import {
  Annotation,
  END,
  START,
  StateGraph,
} from '@langchain/langgraph'
import {
  assertValidAHIPItem,
  normalizeAHIPItem,
  validateAHIPItem,
  type AHIPAction,
  type AHIPItem,
} from '@ahip/core'
import { sanitizeModelAHIPItem } from './ahipItemSanitizer'
import { getRuntimeCapabilities } from './capabilities'
import { getAhipSkillManifest } from './skillManifest'
import { inferScenarioIdFromItem } from './scenarioMatrix'
import { makePreviewId, nowIso } from './storage'
import { hasToolHandler } from './toolExecutor'
import { generateProviderDecision, repairProviderDecision } from './providerAdapters'
import type {
  AhipModelDecision,
  AhipPreviewAgent,
  AhipPreviewMessage,
  AhipRuntimePipelineEvent,
  AhipRuntimeTrace,
} from './types'

type RuntimeSource = 'langgraph' | 'repair' | 'error'

const AhipRuntimeState = Annotation.Root({
  agent: Annotation<AhipPreviewAgent>(),
  apiKey: Annotation<string>(),
  sessionId: Annotation<string>(),
  userText: Annotation<string>(),
  transcript: Annotation<AhipPreviewMessage[]>(),
  skillManifest: Annotation<string>(),
  abortSignal: Annotation<AbortSignal | undefined>(),
  onPipelineEvent: Annotation<((event: AhipRuntimePipelineEvent) => void) | undefined>(),
  decision: Annotation<AhipModelDecision | null>(),
  invalidItem: Annotation<unknown>(),
  validationErrors: Annotation<string[]>(),
  repairCount: Annotation<number>(),
  outputMessage: Annotation<AhipPreviewMessage | null>(),
  source: Annotation<RuntimeSource>(),
})

type AhipRuntimeStateValue = typeof AhipRuntimeState.State

function hostActor(): AHIPItem['actor'] {
  return {
    actor_id: 'host_ahip_runtime',
    actor_kind: 'host',
    display_name: 'AHIP Runtime',
  }
}

function createErrorItem(sessionId: string, message: string): AHIPItem {
  return assertValidAHIPItem({
    protocol: 'ahip',
    version: '0.2',
    item_id: makePreviewId('ahip'),
    session_id: sessionId,
    kind: 'system_notice',
    actor: hostActor(),
    created_at: nowIso(),
    fallback_text: message,
    content: [
      {
        id: makePreviewId('block'),
        type: 'error',
        code: 'AHIP_LANGGRAPH_RUNTIME_ERROR',
        message,
        recoverable: true,
      },
    ],
  })
}

function textMessage(sessionId: string, text: string): AhipPreviewMessage {
  return {
    messageId: makePreviewId('msg'),
    sessionId,
    role: 'assistant',
    kind: 'text',
    text,
    createdAt: nowIso(),
  }
}

function ahipMessage(sessionId: string, item: AHIPItem): AhipPreviewMessage {
  return {
    messageId: makePreviewId('msg'),
    sessionId,
    role: item.actor.actor_kind === 'host' ? 'system' : 'assistant',
    kind: 'ahip',
    item,
    createdAt: nowIso(),
  }
}

function normalizeAndValidateItem(input: unknown, sessionId: string) {
  try {
    const normalized = normalizeAHIPItem(sanitizeModelAHIPItem(input, sessionId))
    const withSession: AHIPItem = {
      ...normalized,
      session_id: normalized.session_id ?? sessionId,
      fallback_text: normalized.fallback_text ?? 'AHIP item fallback.',
    }
    const result = validateAHIPItem(withSession)
    if (!result.valid) {
      return {
        item: null,
        errors: result.errors,
      }
    }

    return {
      item: result.value ?? assertValidAHIPItem(withSession),
      errors: [],
    }
  } catch (error) {
    return {
      item: null,
      errors: [error instanceof Error ? error.message : 'Invalid AHIP item.'],
    }
  }
}

function emitPipelineEvent(state: AhipRuntimeStateValue, event: AhipRuntimePipelineEvent) {
  state.onPipelineEvent?.(event)
}

/**
 * Post-process: if the AHIP item has tool_intents with a registered handler
 * but no corresponding invoke_tool action, inject one so the user can trigger
 * applet generation.
 */
function injectToolIntentActions(item: AHIPItem): AHIPItem {
  const intents = item.tool_intents
  if (!intents?.length) return item

  const executableIntents = intents.filter(
    (intent) =>
      hasToolHandler(intent.tool_name) &&
      intent.status !== 'completed' &&
      intent.status !== 'failed',
  )
  if (executableIntents.length === 0) return item

  const existingActions: AHIPAction[] = item.actions ? [...item.actions] : []
  const hasInvokeTool = existingActions.some((a) => a.kind === 'invoke_tool')
  if (hasInvokeTool) return item

  // Pick the first executable intent and create an invoke_tool action
  const intent = executableIntents[0]
  const appletName =
    (intent.proposed_args?.applet_type as string) ??
    (intent.proposed_args?.requested_applet as string) ??
    intent.title ??
    'applet'

  const invokeAction: AHIPAction = {
    id: makePreviewId('action'),
    label: `Generate ${appletName}`,
    kind: 'invoke_tool',
    style: 'primary',
    payload: {
      tool_name: intent.tool_name,
      intent_id: intent.intent_id,
    },
    fallback_text: `Generate a ${appletName} applet dynamically.`,
  }

  // Demote existing primary actions to secondary
  const adjustedActions = existingActions.map((a) =>
    a.style === 'primary' ? { ...a, style: 'secondary' as const } : a,
  )

  return {
    ...item,
    actions: [invokeAction, ...adjustedActions],
  }
}

async function decideResponse(state: AhipRuntimeStateValue) {
  emitPipelineEvent(state, {
    phase: 'preparing_context',
    label: 'Preparing LangGraph context.',
    providerActive: false,
  })
  const decision = await generateProviderDecision({
    agent: state.agent,
    apiKey: state.apiKey,
    userText: state.userText,
    transcript: state.transcript,
    skillManifest: state.skillManifest,
    abortSignal: state.abortSignal,
    onPipelineEvent: state.onPipelineEvent,
  })

  return {
    decision,
    source: 'langgraph' as RuntimeSource,
  }
}

function validateDecision(state: AhipRuntimeStateValue) {
  emitPipelineEvent(state, {
    phase: 'validating_ahip',
    label: 'Validating AHIP item with @ahip/core.',
    providerActive: false,
  })
  const decision = state.decision

  if (!decision) {
    return {
      validationErrors: ['Missing model decision.'],
      invalidItem: null,
    }
  }

  if (decision.mode === 'plain_text') {
    return {
      outputMessage: textMessage(state.sessionId, decision.text),
      validationErrors: [],
      invalidItem: null,
    }
  }

  const { item, errors } = normalizeAndValidateItem(decision.item, state.sessionId)

  if (item) {
    const enriched = injectToolIntentActions(item)
    return {
      outputMessage: ahipMessage(state.sessionId, enriched),
      validationErrors: [],
      invalidItem: null,
    }
  }

  return {
    outputMessage: null,
    validationErrors: errors,
    invalidItem: decision.item,
  }
}

async function repairDecision(state: AhipRuntimeStateValue) {
  emitPipelineEvent(state, {
    phase: 'repairing_ahip',
    label: 'Sending validation errors back to the model.',
    providerActive: false,
  })
  const decision = await repairProviderDecision({
    agent: state.agent,
    apiKey: state.apiKey,
    userText: state.userText,
    transcript: state.transcript,
    skillManifest: state.skillManifest,
    abortSignal: state.abortSignal,
    onPipelineEvent: state.onPipelineEvent,
    invalidItem: state.invalidItem,
    validationErrors: state.validationErrors,
  })

  return {
    decision,
    repairCount: state.repairCount + 1,
    source: 'repair' as RuntimeSource,
  }
}

function emitRuntimeError(state: AhipRuntimeStateValue) {
  const repairNote = state.repairCount > 0
    ? ` after ${state.repairCount} repair attempt${state.repairCount === 1 ? '' : 's'}`
    : ''
  const message = state.validationErrors.length
    ? `Model output failed AHIP validation${repairNote}: ${state.validationErrors.join('; ')}`
    : `Model output failed AHIP validation${repairNote}.`

  return {
    outputMessage: ahipMessage(state.sessionId, createErrorItem(state.sessionId, message)),
    source: 'error' as RuntimeSource,
  }
}

function routeAfterValidation(state: AhipRuntimeStateValue) {
  if (state.outputMessage) return END
  if (state.validationErrors.length > 0 && state.repairCount < 1) return 'repair_ahip'
  return 'emit_runtime_error'
}

const ahipRuntimeGraph = new StateGraph(AhipRuntimeState)
  .addNode('decide_response', decideResponse)
  .addNode('validate_ahip', validateDecision)
  .addNode('repair_ahip', repairDecision)
  .addNode('emit_runtime_error', emitRuntimeError)
  .addEdge(START, 'decide_response')
  .addEdge('decide_response', 'validate_ahip')
  .addConditionalEdges('validate_ahip', routeAfterValidation, {
    repair_ahip: 'repair_ahip',
    emit_runtime_error: 'emit_runtime_error',
    [END]: END,
  })
  .addEdge('repair_ahip', 'validate_ahip')
  .addEdge('emit_runtime_error', END)
  .compile()

export async function generateLangGraphAssistantMessage(input: {
  agent: AhipPreviewAgent
  apiKey: string
  sessionId: string
  userText: string
  transcript: AhipPreviewMessage[]
  abortSignal?: AbortSignal
  onPipelineEvent?: (event: AhipRuntimePipelineEvent) => void
}): Promise<{ message: AhipPreviewMessage; trace: AhipRuntimeTrace }> {
  const startedAt = nowIso()

  const result = await ahipRuntimeGraph.invoke({
    agent: input.agent,
    apiKey: input.apiKey,
    sessionId: input.sessionId,
    userText: input.userText,
    transcript: input.transcript,
    skillManifest: getAhipSkillManifest(getRuntimeCapabilities()),
    abortSignal: input.abortSignal,
    onPipelineEvent: input.onPipelineEvent,
    decision: null,
    invalidItem: null,
    validationErrors: [],
    repairCount: 0,
    outputMessage: null,
    source: 'langgraph',
  })

  const message = result.outputMessage ?? ahipMessage(
    input.sessionId,
    createErrorItem(input.sessionId, 'LangGraph finished without an output message.'),
  )
  const repaired = result.repairCount > 0
  const status = result.source === 'error' ? 'failed' : repaired ? 'repaired' : 'ok'
  const scenarioId = message.kind === 'ahip' ? inferScenarioIdFromItem(message.item) : undefined
  const artifactIds = message.kind === 'ahip'
    ? message.item.artifacts?.map((artifact) => artifact.artifact_id)
    : undefined
  const fallbackUsed = message.kind === 'ahip'
    ? message.item.content?.some((block) => Boolean(block.fallback_text)) ||
      message.item.widgets?.some((widget) => Boolean(widget.fallback_text)) ||
      message.item.artifacts?.some((artifact) => Boolean(artifact.fallback_text))
    : undefined
  input.onPipelineEvent?.({
    phase: 'completed',
    label: 'Runtime completed.',
    providerActive: false,
  })

  return {
    message,
    trace: {
      traceId: makePreviewId('trace'),
      sessionId: input.sessionId,
      agentId: input.agent.agentId,
      mode: 'langgraph_llm',
      provider: input.agent.provider,
      model: input.agent.model,
      userText: input.userText,
      startedAt,
      finishedAt: nowIso(),
      status,
      decisionMode: result.decision?.mode,
      repairCount: result.repairCount,
      validationErrors: result.validationErrors,
      finalMessageKind: message.kind,
      decisionJson: result.decision ? JSON.stringify(result.decision, null, 2) : undefined,
      scenarioId,
      artifactIds,
      fallbackUsed,
    },
  }
}
