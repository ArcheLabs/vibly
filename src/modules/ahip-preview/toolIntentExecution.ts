import {
  assertValidAHIPItem,
  type AHIPItem,
  type ToolIntent,
  type WidgetRef,
} from '@ahip/core'
import { makePreviewId, nowIso } from './storage'
import { getToolHandler, type ToolExecutionContext, type ToolExecutionResult } from './toolExecutor'
import { getAhipSkillManifest } from './skillManifest'
import { getRuntimeCapabilities } from './capabilities'
import type {
  GenerateDecisionInput,
  AhipPreviewAgent,
  AhipPreviewMessage,
  AhipRuntimeTrace,
} from './types'

function hostActor(): AHIPItem['actor'] {
  return {
    actor_id: 'host_ahip_runtime',
    actor_kind: 'host',
    display_name: 'AHIP Runtime',
  }
}

function createStatusItem(sessionId: string, status: 'idle' | 'done' | 'failed', message: string): AHIPItem {
  return assertValidAHIPItem({
    protocol: 'ahip',
    version: '0.2',
    item_id: makePreviewId('ahip'),
    session_id: sessionId,
    kind: 'tool_result',
    actor: hostActor(),
    created_at: nowIso(),
    fallback_text: message,
    content: [
      {
        id: makePreviewId('block'),
        type: 'status',
        status,
        message,
      },
    ],
  })
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

export interface ToolIntentExecutionInput {
  intent: ToolIntent
  sourceItem: AHIPItem
  agent: AhipPreviewAgent
  apiKey: string
  sessionId: string
  transcript: AhipPreviewMessage[]
  abortSignal?: AbortSignal
  onPipelineEvent?: GenerateDecisionInput['onPipelineEvent']
}

export interface ToolIntentExecutionResult {
  statusMessage: AhipPreviewMessage
  followUpMessage?: AhipPreviewMessage
  trace: AhipRuntimeTrace
}

export async function executeToolIntent(input: ToolIntentExecutionInput): Promise<ToolIntentExecutionResult> {
  const startedAt = nowIso()
  const handler = getToolHandler(input.intent.tool_name)

  if (!handler) {
    const item = createStatusItem(
      input.sessionId,
      'failed',
      `No handler registered for tool: ${input.intent.tool_name}`,
    )
    return {
      statusMessage: ahipMessage(input.sessionId, item),
      trace: buildTrace(input, startedAt, 'failed', `No handler for ${input.intent.tool_name}`),
    }
  }

  const executionContext: ToolExecutionContext = {
    sessionId: input.sessionId,
    generateInput: {
      agent: input.agent,
      apiKey: input.apiKey,
      userText: '',
      transcript: input.transcript,
      skillManifest: getAhipSkillManifest(getRuntimeCapabilities()),
      abortSignal: input.abortSignal,
      onPipelineEvent: input.onPipelineEvent,
    },
  }

  let executionResult: ToolExecutionResult
  try {
    input.onPipelineEvent?.({
      phase: 'tool_execution',
      label: `Executing tool intent: ${input.intent.tool_name}.`,
      providerActive: false,
    })
    executionResult = await handler(input.intent, executionContext)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tool execution failed.'
    const item = createStatusItem(input.sessionId, 'failed', message)
    return {
      statusMessage: ahipMessage(input.sessionId, item),
      trace: buildTrace(input, startedAt, 'failed', message),
    }
  }

  if (executionResult.status === 'failed') {
    const item = createStatusItem(
      input.sessionId,
      'failed',
      executionResult.error ?? 'Tool execution failed.',
    )
    return {
      statusMessage: ahipMessage(input.sessionId, item),
      trace: buildTrace(input, startedAt, 'failed', executionResult.error),
    }
  }

  const output = executionResult.output as Record<string, unknown> | undefined
  const widgetType = output?.widget_type as string | undefined
  const displayName = output?.display_name as string | undefined

  const statusItem = createToolResultStatusItem(input.sessionId, input.intent, widgetType, displayName)
  const statusMsg = ahipMessage(input.sessionId, statusItem)

  let followUpMessage: AhipPreviewMessage | undefined

  if (widgetType) {
    input.onPipelineEvent?.({
      phase: 'widget_followup',
      label: 'Building AHIP widget item in the host runtime.',
      providerActive: false,
    })
    followUpMessage = createWidgetFollowUpMessage(input, widgetType, displayName ?? 'Applet')
  }

  return {
    statusMessage: statusMsg,
    followUpMessage,
    trace: buildTrace(input, startedAt, 'ok'),
  }
}

function createToolResultStatusItem(
  sessionId: string,
  intent: ToolIntent,
  widgetType?: string,
  displayName?: string,
): AHIPItem {
  return assertValidAHIPItem({
    protocol: 'ahip',
    version: '0.2',
    item_id: makePreviewId('ahip'),
    session_id: sessionId,
    kind: 'tool_result',
    actor: hostActor(),
    created_at: nowIso(),
    fallback_text: widgetType
      ? `Applet "${displayName}" registered as ${widgetType}.`
      : `Tool "${intent.tool_name}" completed.`,
    content: [
      {
        id: makePreviewId('block'),
        type: 'status',
        status: 'done',
        message: widgetType
          ? `Applet "${displayName}" has been generated and registered as widget type "${widgetType}". It is now available for use.`
          : `Tool "${intent.tool_name}" completed successfully.`,
      },
    ],
    tool_intents: [
      {
        ...intent,
        status: 'completed',
      },
    ],
  })
}

function createWidgetFollowUpMessage(
  input: ToolIntentExecutionInput,
  widgetType: string,
  displayName: string,
): AhipPreviewMessage {
  const widgetId = `${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_widget`
  const widget: WidgetRef = {
    id: makePreviewId('widget'),
    widget_id: widgetId,
    widget_type: widgetType,
    props: {
      display_name: displayName,
      source_tool_intent_id: input.intent.intent_id,
    },
    permissions: {
      network: 'none',
      clipboard: false,
      wallet: false,
      storage: 'session',
    },
    fallback_text: `${displayName} interactive widget.`,
  }

  const item = assertValidAHIPItem({
    protocol: 'ahip',
    version: '0.2',
    item_id: makePreviewId('ahip'),
    session_id: input.sessionId,
    kind: 'turn',
    actor: hostActor(),
    created_at: nowIso(),
    fallback_text: `${displayName} is ready as an AHIP widget.`,
    content: [
      {
        id: makePreviewId('block'),
        type: 'status',
        status: 'idle',
        title: `${displayName} ready`,
        message: `The host generated and registered "${displayName}" as widget type "${widgetType}".`,
      },
      {
        id: makePreviewId('block'),
        type: 'entity_card',
        entity_kind: 'dev.vibly/dynamic_applet',
        entity_id: widgetType.replace(/[^a-z0-9._-]+/gi, '_').toLowerCase(),
        name: displayName,
        subtitle: 'Generated AHIP widget',
        fields: [
          { label: 'Widget type', value: widgetType },
          { label: 'Source tool', value: input.intent.tool_name },
        ],
      },
    ],
    widgets: [widget],
    actions: [
      {
        id: makePreviewId('action'),
        label: 'Start',
        kind: 'invoke_widget_action',
        style: 'primary',
        payload: {
          widget_id: widgetId,
          action: 'start',
        },
        fallback_text: `Start ${displayName}.`,
      },
      {
        id: makePreviewId('action'),
        label: 'Reset',
        kind: 'invoke_widget_action',
        payload: {
          widget_id: widgetId,
          action: 'reset',
        },
        fallback_text: `Reset ${displayName}.`,
      },
    ],
    metadata: {
      tags: ['dynamic_applet', `tool:${input.intent.tool_name}`],
    },
  })

  return ahipMessage(input.sessionId, item)
}

function buildTrace(
  input: ToolIntentExecutionInput,
  startedAt: string,
  status: AhipRuntimeTrace['status'],
  error?: string,
): AhipRuntimeTrace {
  return {
    traceId: makePreviewId('trace'),
    sessionId: input.sessionId,
    agentId: input.agent.agentId,
    mode: 'langgraph_llm',
    provider: input.agent.provider,
    model: input.agent.model,
    userText: `tool_execute:${input.intent.tool_name}`,
    startedAt,
    finishedAt: nowIso(),
    status,
    decisionMode: 'tool_intent',
    repairCount: 0,
    validationErrors: [],
    finalMessageKind: 'ahip',
    error,
  }
}
