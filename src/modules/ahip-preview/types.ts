import type { AHIPAction, AHIPItem, ArtifactRef, CoreActionKind, CoreBlockType } from '@ahip/core'

export type AhipPreviewProviderKind =
  | 'openai-compatible'
  | 'deepseek'
  | 'openrouter'
  | 'ollama'
  | 'lm-studio'
  | 'anthropic'
  | 'gemini'
  | 'webllm'

export interface AhipPreviewAgent {
  agentId: string
  name: string
  avatar?: string
  bio?: string
  provider: AhipPreviewProviderKind
  baseUrl: string
  model: string
  systemPrompt: string
  createdAt: string
  updatedAt: string
}

export interface AhipPreviewSession {
  sessionId: string
  agentId: string
  title: string
  createdAt: string
  updatedAt: string
}

export type AhipRuntimeMode = 'local_demo' | 'langgraph_llm'

export interface AhipRuntimeTrace {
  traceId: string
  sessionId: string
  agentId: string
  mode: AhipRuntimeMode
  provider: AhipPreviewProviderKind
  model: string
  userText: string
  startedAt: string
  finishedAt: string
  status: 'ok' | 'repaired' | 'fallback' | 'failed'
  decisionMode?: AhipModelDecision['mode']
  repairCount: number
  validationErrors: string[]
  finalMessageKind?: AhipPreviewMessage['kind']
  error?: string
  decisionJson?: string
  scenarioId?: string
  actionId?: string
  artifactIds?: string[]
  fallbackUsed?: boolean
}

export interface AhipProviderTest {
  status: 'idle' | 'testing' | 'ok' | 'failed'
  testedAt?: string
  message?: string
}

export interface AhipArtifactOpenEvent {
  eventId: string
  sessionId: string
  itemId: string
  artifactId: string
  artifactKind: string
  name?: string
  uri?: string
  openedAt: string
}

export interface AhipDynamicAppletEntry {
  widgetType: string
  displayName: string
  htmlSource: string
  registeredAt: string
}

export interface AhipWidgetStateEntry {
  widgetKey: string
  sessionId: string
  itemId: string
  widgetId: string
  widgetType: string
  state: unknown
  updatedAt: string
}

export interface AhipPreviewMessageMetadata {
  source?: 'widget_action'
  widgetId?: string
  interactionId?: string
}

export type AhipPreviewMessage =
  | {
      messageId: string
      sessionId: string
      role: 'user' | 'assistant' | 'system'
      kind: 'text'
      text: string
      createdAt: string
      metadata?: AhipPreviewMessageMetadata
    }
  | {
      messageId: string
      sessionId: string
      role: 'assistant' | 'system'
      kind: 'ahip'
      item: AHIPItem
      createdAt: string
      metadata?: AhipPreviewMessageMetadata
    }

export interface AhipPreviewState {
  agents: AhipPreviewAgent[]
  sessions: AhipPreviewSession[]
  messages: Record<string, AhipPreviewMessage[]>
  runtimeTraces: Record<string, AhipRuntimeTrace[]>
  providerTests: Record<string, AhipProviderTest>
  artifactOpenEvents: Record<string, AhipArtifactOpenEvent[]>
  selectedAgentId: string | null
  selectedSessionId: string | null
}

export interface AhipPreviewSecrets {
  apiKeysByAgentId: Record<string, string>
}

export interface AhipRuntimePipelineEvent {
  phase:
    | 'preparing_context'
    | 'provider_request'
    | 'provider_response'
    | 'parsing_model_output'
    | 'validating_ahip'
    | 'repairing_ahip'
    | 'tool_execution'
    | 'applet_generation'
    | 'widget_followup'
    | 'completed'
    | 'failed'
  label: string
  detail?: string
  providerActive: boolean
}

export interface AhipRuntimePipelineStatus extends AhipRuntimePipelineEvent {
  startedAt: string
  lastActivityAt: string
}

export type AhipPreviewExportScope =
  | { kind: 'all' }
  | { kind: 'session'; sessionId: string }

export interface AhipPreviewExport {
  schemaVersion: 1
  exportedAt: string
  scope: AhipPreviewExportScope
  agents: AhipPreviewAgent[]
  sessions: AhipPreviewSession[]
  messages: Record<string, AhipPreviewMessage[]>
  runtimeTraces: Record<string, AhipRuntimeTrace[]>
  providerTests: Record<string, AhipProviderTest>
  artifactOpenEvents: Record<string, AhipArtifactOpenEvent[]>
  dynamicApplets: AhipDynamicAppletEntry[]
  widgetStates: AhipWidgetStateEntry[]
}

export type AhipModelDecision =
  | { mode: 'plain_text'; text: string }
  | { mode: 'ahip_item'; item: unknown }
  | { mode: 'tool_intent'; item: unknown }

export interface GenerateDecisionInput {
  agent: AhipPreviewAgent
  apiKey: string
  userText: string
  transcript: AhipPreviewMessage[]
  skillManifest: string
  abortSignal?: AbortSignal
  onPipelineEvent?: (event: AhipRuntimePipelineEvent) => void
}

export interface AhipScenarioExpectation {
  blocks?: Array<CoreBlockType | string>
  actions?: Array<CoreActionKind | string>
  artifacts?: string[]
  widgets?: string[]
}

export interface AhipScenarioActionContext {
  action: AHIPAction
  item: AHIPItem
  sessionId: string
}

export type AhipScenarioActionHandler = (context: AhipScenarioActionContext) => AHIPItem

export interface AhipProtocolScenario {
  id: string
  title: string
  promptExamples: string[]
  match: RegExp[]
  acceptanceNotes: string
  expected: AhipScenarioExpectation
  createDecision: (sessionId: string, userText: string) => AhipModelDecision
  handleAction?: AhipScenarioActionHandler
}

export interface AhipScenarioFixture {
  scenarioId: string
  prompt: string
  decision: AhipModelDecision
  expected: AhipScenarioExpectation
}

export interface AhipActionRuntimeResult {
  message: AhipPreviewMessage
  trace: AhipRuntimeTrace
  replaceSourceItem?: boolean
}

export type AhipArtifactOpenHandler = (artifact: ArtifactRef, item: AHIPItem) => void | Promise<void>
