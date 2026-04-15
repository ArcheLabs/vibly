import Dexie, { type Table } from 'dexie'
import type {
  AhipArtifactOpenEvent,
  AhipDynamicAppletEntry,
  AhipPreviewAgent,
  AhipPreviewExport,
  AhipPreviewExportScope,
  AhipPreviewMessage,
  AhipPreviewSecrets,
  AhipPreviewSession,
  AhipWidgetStateEntry,
  AhipPreviewState,
  AhipProviderTest,
  AhipRuntimeTrace,
} from './types'

const STATE_KEY = 'vibly:ahip-preview-state'
const SECRETS_KEY = 'vibly:ahip-preview-secrets'
const DB_NAME = 'vibly_ahip_preview'
const META_SELECTED_AGENT_ID = 'selectedAgentId'
const META_SELECTED_SESSION_ID = 'selectedSessionId'
const META_LOCAL_STORAGE_MIGRATED_AT = 'localStorageMigratedAt'
const META_SCHEMA_VERSION = 'schemaVersion'

type MetaRecord = {
  key: string
  value: unknown
}

type SecretRecord = {
  agentId: string
  apiKey: string
  updatedAt: string
}

class AhipPreviewDB extends Dexie {
  agents!: Table<AhipPreviewAgent, string>
  sessions!: Table<AhipPreviewSession, string>
  messages!: Table<AhipPreviewMessage, string>
  runtimeTraces!: Table<AhipRuntimeTrace, string>
  providerTests!: Table<AhipProviderTest & { agentId: string }, string>
  artifactOpenEvents!: Table<AhipArtifactOpenEvent, string>
  dynamicApplets!: Table<AhipDynamicAppletEntry, string>
  widgetStates!: Table<AhipWidgetStateEntry, string>
  secrets!: Table<SecretRecord, string>
  meta!: Table<MetaRecord, string>

  constructor() {
    super(DB_NAME)

    const versionOneSchema = {
      agents: '&agentId, updatedAt',
      sessions: '&sessionId, agentId, updatedAt',
      messages: '&messageId, sessionId, createdAt',
      runtimeTraces: '&traceId, sessionId, agentId, finishedAt',
      providerTests: '&agentId, status, testedAt',
      artifactOpenEvents: '&eventId, sessionId, openedAt',
      secrets: '&agentId, updatedAt',
      meta: '&key',
    }

    this.version(1).stores(versionOneSchema)
    this.version(2).stores({
      ...versionOneSchema,
      dynamicApplets: '&widgetType, registeredAt',
    })
    this.version(3).stores({
      ...versionOneSchema,
      dynamicApplets: '&widgetType, registeredAt',
      widgetStates: '&widgetKey, sessionId, itemId, widgetId, updatedAt',
    })
  }
}

export const ahipPreviewDb = new AhipPreviewDB()

async function ensureDbOpen() {
  if (!ahipPreviewDb.isOpen()) {
    await ahipPreviewDb.open()
  }
}

export function nowIso() {
  return new Date().toISOString()
}

export function makePreviewId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

export function makeWidgetStateKey(itemId: string, widgetId: string) {
  return `${itemId}:${widgetId}`
}

function createDefaultAgent(): AhipPreviewAgent {
  const timestamp = nowIso()

  return {
    agentId: 'agent_ahip_preview',
    name: 'AHIP Preview Agent',
    provider: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    systemPrompt:
      'You are a careful AHIP preview agent. Use AHIP only for durable, structured, or actionable interactions.',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createDefaultAhipPreviewState(): AhipPreviewState {
  const agent = createDefaultAgent()
  const timestamp = nowIso()
  const sessionId = 'session_ahip_preview'

  return {
    agents: [agent],
    sessions: [
      {
        sessionId,
        agentId: agent.agentId,
        title: 'AHIP preview',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    messages: {
      [sessionId]: [
        {
          messageId: makePreviewId('msg'),
          sessionId,
          role: 'system',
          kind: 'text',
          text:
            'Local AHIP demo is ready without an API key. Add a key to run the LangGraph LLM runtime.',
          createdAt: timestamp,
        },
      ],
    },
    runtimeTraces: {},
    providerTests: {},
    artifactOpenEvents: {},
    selectedAgentId: agent.agentId,
    selectedSessionId: sessionId,
  }
}

function groupBySession<T extends { sessionId: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    acc[item.sessionId] = [...(acc[item.sessionId] ?? []), item]
    return acc
  }, {})
}

function sortByCreatedAt<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function sortByFinishedAt<T extends { finishedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
}

function sortByOpenedAt<T extends { openedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => a.openedAt.localeCompare(b.openedAt))
}

function normalizeState(input: Partial<AhipPreviewState>, fallback = createDefaultAhipPreviewState()): AhipPreviewState {
  return {
    agents: input.agents?.length ? input.agents : fallback.agents,
    sessions: input.sessions?.length ? input.sessions : fallback.sessions,
    messages: input.messages ?? fallback.messages,
    runtimeTraces: input.runtimeTraces ?? fallback.runtimeTraces,
    providerTests: input.providerTests ?? fallback.providerTests,
    artifactOpenEvents: input.artifactOpenEvents ?? fallback.artifactOpenEvents,
    selectedAgentId: input.selectedAgentId ?? fallback.selectedAgentId,
    selectedSessionId: input.selectedSessionId ?? fallback.selectedSessionId,
  }
}

function readLegacyAhipPreviewState(): AhipPreviewState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STATE_KEY)
    if (!raw) return null
    return normalizeState(JSON.parse(raw) as Partial<AhipPreviewState>)
  } catch {
    return null
  }
}

function readLegacyAhipPreviewSecrets(): AhipPreviewSecrets | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(SECRETS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AhipPreviewSecrets>
    return {
      apiKeysByAgentId: parsed.apiKeysByAgentId ?? {},
    }
  } catch {
    return null
  }
}

export function saveAhipPreviewState(state: AhipPreviewState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STATE_KEY, JSON.stringify(state))
}

export function loadAhipPreviewState(): AhipPreviewState {
  return readLegacyAhipPreviewState() ?? createDefaultAhipPreviewState()
}

export function saveAhipPreviewSecrets(secrets: AhipPreviewSecrets) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SECRETS_KEY, JSON.stringify(secrets))
}

export function loadAhipPreviewSecrets(): AhipPreviewSecrets {
  return readLegacyAhipPreviewSecrets() ?? { apiKeysByAgentId: {} }
}

async function putStateSnapshot(state: AhipPreviewState) {
  await ahipPreviewDb.transaction(
    'rw',
    [
      ahipPreviewDb.agents,
      ahipPreviewDb.sessions,
      ahipPreviewDb.messages,
      ahipPreviewDb.runtimeTraces,
      ahipPreviewDb.providerTests,
      ahipPreviewDb.artifactOpenEvents,
      ahipPreviewDb.meta,
    ],
    async () => {
      await ahipPreviewDb.agents.bulkPut(state.agents)
      await ahipPreviewDb.sessions.bulkPut(state.sessions)
      await ahipPreviewDb.messages.bulkPut(Object.values(state.messages).flat())
      await ahipPreviewDb.runtimeTraces.bulkPut(Object.values(state.runtimeTraces).flat())
      await ahipPreviewDb.providerTests.bulkPut(
        Object.entries(state.providerTests).map(([agentId, test]) => ({ ...test, agentId })),
      )
      await ahipPreviewDb.artifactOpenEvents.bulkPut(Object.values(state.artifactOpenEvents).flat())
      await ahipPreviewDb.meta.bulkPut([
        { key: META_SELECTED_AGENT_ID, value: state.selectedAgentId },
        { key: META_SELECTED_SESSION_ID, value: state.selectedSessionId },
        { key: META_SCHEMA_VERSION, value: 1 },
      ])
    },
  )
}

async function putSecrets(secrets: AhipPreviewSecrets) {
  const timestamp = nowIso()
  await ahipPreviewDb.secrets.bulkPut(
    Object.entries(secrets.apiKeysByAgentId).map(([agentId, apiKey]) => ({
      agentId,
      apiKey,
      updatedAt: timestamp,
    })),
  )
}

async function seedDefaultStateIfEmpty() {
  const agentCount = await ahipPreviewDb.agents.count()
  if (agentCount > 0) return
  await putStateSnapshot(createDefaultAhipPreviewState())
}

async function migrateLocalStorageOnce() {
  const migrationRecord = await ahipPreviewDb.meta.get(META_LOCAL_STORAGE_MIGRATED_AT)
  if (migrationRecord) return

  const legacyState = readLegacyAhipPreviewState()
  const legacySecrets = readLegacyAhipPreviewSecrets()
  if (legacyState) {
    await putStateSnapshot(legacyState)
  }
  if (legacySecrets) {
    await putSecrets(legacySecrets)
  }

  await ahipPreviewDb.meta.put({
    key: META_LOCAL_STORAGE_MIGRATED_AT,
    value: nowIso(),
  })
}

export async function initAhipPreviewDb() {
  if (typeof indexedDB === 'undefined') return
  await ensureDbOpen()
  await migrateLocalStorageOnce()
  await seedDefaultStateIfEmpty()
}

export async function loadAhipPreviewSnapshot(): Promise<AhipPreviewState> {
  if (typeof indexedDB === 'undefined') return createDefaultAhipPreviewState()

  await initAhipPreviewDb()

  const [
    agents,
    sessions,
    messages,
    runtimeTraces,
    providerTests,
    artifactOpenEvents,
    selectedAgentIdRecord,
    selectedSessionIdRecord,
  ] = await Promise.all([
    ahipPreviewDb.agents.toArray(),
    ahipPreviewDb.sessions.toArray(),
    ahipPreviewDb.messages.toArray(),
    ahipPreviewDb.runtimeTraces.toArray(),
    ahipPreviewDb.providerTests.toArray(),
    ahipPreviewDb.artifactOpenEvents.toArray(),
    ahipPreviewDb.meta.get(META_SELECTED_AGENT_ID),
    ahipPreviewDb.meta.get(META_SELECTED_SESSION_ID),
  ])

  return normalizeState({
    agents: [...agents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    sessions: [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    messages: groupBySession(sortByCreatedAt(messages)),
    runtimeTraces: groupBySession(sortByFinishedAt(runtimeTraces)),
    providerTests: Object.fromEntries(providerTests.map(({ agentId, ...test }) => [agentId, test])),
    artifactOpenEvents: groupBySession(sortByOpenedAt(artifactOpenEvents)),
    selectedAgentId: typeof selectedAgentIdRecord?.value === 'string' ? selectedAgentIdRecord.value : null,
    selectedSessionId: typeof selectedSessionIdRecord?.value === 'string' ? selectedSessionIdRecord.value : null,
  })
}

export async function loadSecrets(): Promise<AhipPreviewSecrets> {
  if (typeof indexedDB === 'undefined') return { apiKeysByAgentId: {} }
  await initAhipPreviewDb()
  const records = await ahipPreviewDb.secrets.toArray()
  return {
    apiKeysByAgentId: Object.fromEntries(records.map((record) => [record.agentId, record.apiKey])),
  }
}

export async function saveAgent(agent: AhipPreviewAgent) {
  await ensureDbOpen()
  await ahipPreviewDb.agents.put(agent)
}

export async function saveSession(session: AhipPreviewSession) {
  await ensureDbOpen()
  await ahipPreviewDb.sessions.put(session)
}

export async function saveSelection(selectedAgentId: string | null, selectedSessionId: string | null) {
  await ensureDbOpen()
  await ahipPreviewDb.meta.bulkPut([
    { key: META_SELECTED_AGENT_ID, value: selectedAgentId },
    { key: META_SELECTED_SESSION_ID, value: selectedSessionId },
  ])
}

export async function appendMessage(message: AhipPreviewMessage) {
  await ensureDbOpen()
  await ahipPreviewDb.messages.put(message)
}

export async function replaceMessage(messageId: string, message: AhipPreviewMessage) {
  await ensureDbOpen()
  await ahipPreviewDb.messages.put({ ...message, messageId })
}

export async function appendRuntimeTrace(trace: AhipRuntimeTrace) {
  await ensureDbOpen()
  await ahipPreviewDb.runtimeTraces.put(trace)
}

export async function saveProviderTest(agentId: string, test: AhipProviderTest) {
  await ensureDbOpen()
  await ahipPreviewDb.providerTests.put({ ...test, agentId })
}

export async function appendArtifactOpenEvent(event: AhipArtifactOpenEvent) {
  await ensureDbOpen()
  await ahipPreviewDb.artifactOpenEvents.put(event)
}

export async function saveDynamicApplet(entry: AhipDynamicAppletEntry) {
  await ensureDbOpen()
  await ahipPreviewDb.dynamicApplets.put(entry)
}

export async function saveDynamicApplets(entries: AhipDynamicAppletEntry[]) {
  if (!entries.length) return
  await ensureDbOpen()
  await ahipPreviewDb.dynamicApplets.bulkPut(entries)
}

export async function loadDynamicApplets(): Promise<AhipDynamicAppletEntry[]> {
  if (typeof indexedDB === 'undefined') return []
  await initAhipPreviewDb()
  const entries = await ahipPreviewDb.dynamicApplets.toArray()
  return [...entries].sort((a, b) => a.registeredAt.localeCompare(b.registeredAt))
}

export async function saveWidgetState(entry: AhipWidgetStateEntry) {
  await ensureDbOpen()
  await ahipPreviewDb.widgetStates.put(entry)
}

export async function loadWidgetState(widgetKey: string): Promise<AhipWidgetStateEntry | undefined> {
  if (typeof indexedDB === 'undefined') return undefined
  await initAhipPreviewDb()
  return ahipPreviewDb.widgetStates.get(widgetKey)
}

export async function loadWidgetStates(): Promise<AhipWidgetStateEntry[]> {
  if (typeof indexedDB === 'undefined') return []
  await initAhipPreviewDb()
  const entries = await ahipPreviewDb.widgetStates.toArray()
  return [...entries].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
}

export async function saveSecret(agentId: string, apiKey: string) {
  await ensureDbOpen()
  await ahipPreviewDb.secrets.put({
    agentId,
    apiKey,
    updatedAt: nowIso(),
  })
}

export async function deleteSecret(agentId: string) {
  await ensureDbOpen()
  await ahipPreviewDb.secrets.delete(agentId)
}

export async function clearAhipPreviewDb() {
  await ensureDbOpen()
  await ahipPreviewDb.transaction(
    'rw',
    [
      ahipPreviewDb.agents,
      ahipPreviewDb.sessions,
      ahipPreviewDb.messages,
      ahipPreviewDb.runtimeTraces,
      ahipPreviewDb.providerTests,
      ahipPreviewDb.artifactOpenEvents,
      ahipPreviewDb.dynamicApplets,
      ahipPreviewDb.widgetStates,
      ahipPreviewDb.secrets,
      ahipPreviewDb.meta,
    ],
    async () => {
      await Promise.all([
        ahipPreviewDb.agents.clear(),
        ahipPreviewDb.sessions.clear(),
        ahipPreviewDb.messages.clear(),
        ahipPreviewDb.runtimeTraces.clear(),
        ahipPreviewDb.providerTests.clear(),
        ahipPreviewDb.artifactOpenEvents.clear(),
        ahipPreviewDb.dynamicApplets.clear(),
        ahipPreviewDb.widgetStates.clear(),
        ahipPreviewDb.secrets.clear(),
        ahipPreviewDb.meta.clear(),
      ])
    },
  )
}

export async function resetAhipPreviewDb(): Promise<AhipPreviewState> {
  await clearAhipPreviewDb()
  const state = createDefaultAhipPreviewState()
  await putStateSnapshot(state)
  await ahipPreviewDb.meta.put({
    key: META_LOCAL_STORAGE_MIGRATED_AT,
    value: nowIso(),
  })
  return state
}

function filterRecordBySession<T>(record: Record<string, T[]>, sessionIds: Set<string>) {
  return Object.fromEntries(Object.entries(record).filter(([sessionId]) => sessionIds.has(sessionId)))
}

function getWidgetTypesFromMessages(messages: Record<string, AhipPreviewMessage[]>) {
  const widgetTypes = new Set<string>()
  Object.values(messages).flat().forEach((message) => {
    if (message.kind !== 'ahip') return
    message.item.widgets?.forEach((widget) => widgetTypes.add(widget.widget_type))
  })
  return widgetTypes
}

export async function exportAhipPreviewData(scope: AhipPreviewExportScope): Promise<AhipPreviewExport> {
  const snapshot = await loadAhipPreviewSnapshot()
  const dynamicApplets = await loadDynamicApplets()
  const widgetStates = await loadWidgetStates()

  if (scope.kind === 'all') {
    return {
      schemaVersion: 1,
      exportedAt: nowIso(),
      scope,
      agents: snapshot.agents,
      sessions: snapshot.sessions,
      messages: snapshot.messages,
      runtimeTraces: snapshot.runtimeTraces,
      providerTests: snapshot.providerTests,
      artifactOpenEvents: snapshot.artifactOpenEvents,
      dynamicApplets,
      widgetStates,
    }
  }

  const session = snapshot.sessions.find((item) => item.sessionId === scope.sessionId)
  const sessionIds = new Set([scope.sessionId])
  const agentIds = new Set(session ? [session.agentId] : [])

  const messages = filterRecordBySession(snapshot.messages, sessionIds)
  const widgetTypes = getWidgetTypesFromMessages(messages)

  return {
    schemaVersion: 1,
    exportedAt: nowIso(),
    scope,
    agents: snapshot.agents.filter((agent) => agentIds.has(agent.agentId)),
    sessions: session ? [session] : [],
    messages,
    runtimeTraces: filterRecordBySession(snapshot.runtimeTraces, sessionIds),
    providerTests: Object.fromEntries(
      Object.entries(snapshot.providerTests).filter(([agentId]) => agentIds.has(agentId)),
    ),
    artifactOpenEvents: filterRecordBySession(snapshot.artifactOpenEvents, sessionIds),
    dynamicApplets: dynamicApplets.filter((entry) => widgetTypes.has(entry.widgetType)),
    widgetStates: widgetStates.filter((entry) => sessionIds.has(entry.sessionId)),
  }
}
