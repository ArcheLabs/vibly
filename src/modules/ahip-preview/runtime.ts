import {
  assertValidAHIPItem,
  normalizeAHIPItem,
  validateAHIPItem,
  type AHIPItem,
} from '@ahip/core'
import { sanitizeModelAHIPItem } from './ahipItemSanitizer'
import { generateLangGraphAssistantMessage } from './langgraphRuntime'
import {
  AHIP_PREVIEW_SCENARIO_EXTENSION_KEY,
  createGenericActionResult,
  getAhipScenarioById,
  inferScenarioIdFromItem,
  selectAhipScenario,
} from './scenarioMatrix'
import { makePreviewId, nowIso } from './storage'
import type {
  AhipActionRuntimeResult,
  AhipModelDecision,
  AhipPreviewAgent,
  AhipPreviewMessage,
  AhipRuntimePipelineEvent,
  AhipRuntimeTrace,
} from './types'

function hostActor(): AHIPItem['actor'] {
  return {
    actor_id: 'host_ahip_preview',
    actor_kind: 'host',
    display_name: 'AHIP Host',
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
        code: 'AHIP_PREVIEW_ERROR',
        message,
        recoverable: true,
      },
    ],
    metadata: {
      tags: ['scenario:runtime_error'],
      extensions: {
        [AHIP_PREVIEW_SCENARIO_EXTENSION_KEY]: 'runtime_error',
      },
    },
  })
}

function normalizeDecisionItem(input: unknown, sessionId: string): { item: AHIPItem; validationErrors: string[] } {
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
        item: createErrorItem(sessionId, `Invalid AHIP item: ${result.errors.join('; ')}`),
        validationErrors: result.errors,
      }
    }

    return {
      item: result.value ?? assertValidAHIPItem(withSession),
      validationErrors: [],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid AHIP item.'
    return {
      item: createErrorItem(sessionId, `Invalid AHIP item: ${message}`),
      validationErrors: [message],
    }
  }
}

function decisionToMessage(decision: AhipModelDecision, sessionId: string): {
  message: AhipPreviewMessage
  validationErrors: string[]
  scenarioId?: string
  artifactIds?: string[]
  fallbackUsed?: boolean
} {
  if (decision.mode === 'plain_text') {
    return {
      message: {
        messageId: makePreviewId('msg'),
        sessionId,
        role: 'assistant',
        kind: 'text',
        text: decision.text,
        createdAt: nowIso(),
      },
      validationErrors: [],
      scenarioId: 'plain_text',
    }
  }

  const { item, validationErrors } = normalizeDecisionItem(decision.item, sessionId)

  return {
    message: {
      messageId: makePreviewId('msg'),
      sessionId,
      role: item.actor.actor_kind === 'host' ? 'system' : 'assistant',
      kind: 'ahip',
      item,
      createdAt: nowIso(),
    },
    validationErrors,
    scenarioId: inferScenarioIdFromItem(item),
    artifactIds: item.artifacts?.map((artifact) => artifact.artifact_id),
    fallbackUsed:
      item.content?.some((block) => Boolean(block.fallback_text)) ||
      item.widgets?.some((widget) => Boolean(widget.fallback_text)) ||
      item.artifacts?.some((artifact) => Boolean(artifact.fallback_text)),
  }
}

function createRuntimeTrace(input: {
  agent: AhipPreviewAgent
  sessionId: string
  userText: string
  startedAt: string
  decision: AhipModelDecision
  message: AhipPreviewMessage
  status: AhipRuntimeTrace['status']
  validationErrors?: string[]
  error?: string
  scenarioId?: string
  actionId?: string
  artifactIds?: string[]
  fallbackUsed?: boolean
}): AhipRuntimeTrace {
  return {
    traceId: makePreviewId('trace'),
    sessionId: input.sessionId,
    agentId: input.agent.agentId,
    mode: 'local_demo',
    provider: input.agent.provider,
    model: input.agent.model,
    userText: input.userText,
    startedAt: input.startedAt,
    finishedAt: nowIso(),
    status: input.status,
    decisionMode: input.decision.mode,
    repairCount: 0,
    validationErrors: input.validationErrors ?? [],
    finalMessageKind: input.message.kind,
    error: input.error,
    decisionJson: JSON.stringify(input.decision, null, 2),
    scenarioId: input.scenarioId,
    actionId: input.actionId,
    artifactIds: input.artifactIds,
    fallbackUsed: input.fallbackUsed,
  }
}

function isLocalEndpoint(baseUrl: string) {
  return /^http:\/\/(localhost|127\.0\.0\.1)/i.test(baseUrl)
}

function runtimeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown provider error'
  if (/aborted|abort/i.test(message)) {
    return 'Provider request was aborted before returning an AHIP decision. It may have timed out; retry with a working provider or a smaller prompt.'
  }
  return message
}

function formatActionPayload(action: import('@ahip/core').AHIPAction) {
  return action.payload && Object.keys(action.payload).length
    ? JSON.stringify(action.payload, null, 2)
    : '{}'
}

function summarizeToolIntents(item: AHIPItem) {
  if (!item.tool_intents?.length) return ''
  const summaries = item.tool_intents.map((intent) => {
    const args = intent.proposed_args ? JSON.stringify(intent.proposed_args) : '{}'
    return `  - intent_id: ${intent.intent_id}, tool_name: ${intent.tool_name}, status: ${intent.status}, proposed_args: ${args}`
  })
  return [
    '',
    'Previous tool_intents already proposed in this item (DO NOT re-propose these):',
    ...summaries,
  ].join('\n')
}

export function getActionContinuationPrompt(action: import('@ahip/core').AHIPAction, item: AHIPItem) {
  if (action.kind === 'reply_with_template' && typeof action.payload?.template === 'string') {
    return action.payload.template.trim()
  }

  if (action.kind !== 'continue_task') return null

  const toolIntentContext = summarizeToolIntents(item)

  return [
    `The user selected AHIP action "${action.label}".`,
    '',
    'Continue the current AHIP interaction using the AHIP Skill manifest and host capabilities.',
    'If the interaction needs a stateful applet or widget that is NOT in host capabilities, do NOT propose another tool_intent for the same applet.',
    'Instead, generate a playable text-based interactive experience using supported AHIP blocks:',
    '- Use markdown blocks to render the game board or interaction state as formatted text.',
    '- Use form blocks or action buttons for user input.',
    '- Use status blocks to show current state (turn, score, phase).',
    '- Include continue_task actions with payload describing each valid next step.',
    'Do not assume the host has an unlisted widget. Do not output React code.',
    '',
    `Current item fallback: ${item.fallback_text ?? 'none'}`,
    `Action kind: ${action.kind}`,
    `Action payload: ${formatActionPayload(action)}`,
    toolIntentContext,
  ].join('\n')
}

export async function generateAssistantMessage(input: {
  agent: AhipPreviewAgent
  apiKey: string
  sessionId: string
  userText: string
  transcript: AhipPreviewMessage[]
  abortSignal?: AbortSignal
  onPipelineEvent?: (event: AhipRuntimePipelineEvent) => void
}): Promise<{ message: AhipPreviewMessage; trace: AhipRuntimeTrace }> {
  const startedAt = nowIso()
  const createScenarioFallback = (
    status: AhipRuntimeTrace['status'],
    error?: string,
    appendErrorToText = false,
  ) => {
    const scenario = selectAhipScenario(input.userText)
    const decision = scenario.createDecision(input.sessionId, input.userText)
    const result = decisionToMessage(decision, input.sessionId)
    let message = result.message

    if (appendErrorToText && message.kind === 'text' && error) {
      message = {
        ...message,
        text: `${message.text}\n\nProvider fallback: ${error}`,
      }
    }

    return {
      message,
      trace: createRuntimeTrace({
        agent: input.agent,
        sessionId: input.sessionId,
        userText: input.userText,
        startedAt,
        decision,
        message,
        status,
        validationErrors: result.validationErrors,
        error,
        scenarioId: result.scenarioId ?? scenario.id,
        artifactIds: result.artifactIds,
        fallbackUsed: result.fallbackUsed || status === 'fallback',
      }),
    }
  }

  if (!input.apiKey && !isLocalEndpoint(input.agent.baseUrl)) {
    input.onPipelineEvent?.({
      phase: 'completed',
      label: 'Local demo response generated.',
      providerActive: false,
    })
    const result = createScenarioFallback('ok')
    if (result.trace.validationErrors.length) {
      return createScenarioFallback('failed')
    }
    return result
  }

  try {
    const result = await generateLangGraphAssistantMessage(input)
    const scenario = selectAhipScenario(input.userText)

    if (scenario.id !== 'plain_text' && result.message.kind === 'text') {
      return createScenarioFallback(
        'fallback',
        `Provider returned plain_text for AHIP scenario "${scenario.id}".`,
      )
    }

    return result
  } catch (error) {
    const errorMessage = runtimeErrorMessage(error)
    return createScenarioFallback('fallback', errorMessage, true)
  }
}

export function handleAhipAction(input: {
  action: import('@ahip/core').AHIPAction
  item: AHIPItem
  agent: AhipPreviewAgent
}): AhipActionRuntimeResult {
  const sessionId = input.item.session_id ?? makePreviewId('session')
  const startedAt = nowIso()
  const scenarioId = inferScenarioIdFromItem(input.item)
  const scenario = getAhipScenarioById(scenarioId)
  const nextItem = scenario?.handleAction
    ? scenario.handleAction({ action: input.action, item: input.item, sessionId })
    : createGenericActionResult({ action: input.action, item: input.item, sessionId }, scenarioId)
  const { item, validationErrors } = normalizeDecisionItem(nextItem, sessionId)
  const message: AhipPreviewMessage = {
    messageId: makePreviewId('msg'),
    sessionId,
    role: item.actor.actor_kind === 'host' ? 'system' : 'assistant',
    kind: 'ahip',
    item,
    createdAt: nowIso(),
  }
  const decision: AhipModelDecision = {
    mode: 'ahip_item',
    item,
  }

  return {
    message,
    replaceSourceItem: scenarioId === 'gomoku_widget',
    trace: createRuntimeTrace({
      agent: input.agent,
      sessionId,
      userText: `action:${input.action.kind}:${input.action.label}`,
      startedAt,
      decision,
      message,
      status: validationErrors.length ? 'failed' : 'ok',
      validationErrors,
      scenarioId: inferScenarioIdFromItem(item) ?? scenarioId,
      actionId: input.action.id,
      artifactIds: item.artifacts?.map((artifact) => artifact.artifact_id),
      fallbackUsed:
        item.content?.some((block) => Boolean(block.fallback_text)) ||
        item.widgets?.some((widget) => Boolean(widget.fallback_text)) ||
        item.artifacts?.some((artifact) => Boolean(artifact.fallback_text)),
    }),
  }
}
