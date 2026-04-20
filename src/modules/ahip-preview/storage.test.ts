import { afterEach, describe, expect, it } from 'vitest'
import { assertValidAHIPItem } from '@ahip/core'
import {
  clearDynamicApplets,
  hasDynamicApplet,
  hydrateDynamicAppletsFromDb,
  registerDynamicApplet,
} from './dynamicAppletRegistry'
import { createScenarioFixtures } from './scenarioMatrix'
import {
  ahipPreviewDb,
  appendArtifactOpenEvent,
  appendMessage,
  appendRuntimeTrace,
  createDefaultAhipPreviewState,
  deleteSecret,
  exportAhipPreviewData,
  loadAhipPreviewSecrets,
  loadAhipPreviewSnapshot,
  loadAhipPreviewState,
  loadSecrets,
  resetAhipPreviewDb,
  saveAhipPreviewSecrets,
  saveAhipPreviewState,
  loadDynamicApplets,
  loadWidgetState,
  loadWidgetStates,
  makeWidgetStateKey,
  saveProviderTest,
  saveSecret,
  saveWidgetState,
} from './storage'

afterEach(async () => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  clearDynamicApplets()
  await ahipPreviewDb.delete()
})

describe('AHIP preview IndexedDB storage', () => {
  it('creates default AHIP Preview state when the database is empty', async () => {
    const snapshot = await loadAhipPreviewSnapshot()

    expect(snapshot.agents[0]?.agentId).toBe('agent_ahip_preview')
    expect(snapshot.selectedSessionId).toBe('session_ahip_preview')
    expect(snapshot.messages.session_ahip_preview?.[0]?.kind).toBe('text')
  })

  it('persists messages, traces, artifact events, provider tests, and gomoku widget state', async () => {
    const state = await resetAhipPreviewDb()
    const fixture = createScenarioFixtures().find((item) => item.scenarioId === 'gomoku_widget')
    expect(fixture?.decision.mode).toBe('ahip_item')
    if (!fixture || fixture.decision.mode === 'plain_text') return

    const item = assertValidAHIPItem(fixture.decision.item)
    const sessionId = state.selectedSessionId ?? 'session_ahip_preview'
    const message = {
      messageId: 'msg_gomoku',
      sessionId,
      role: 'assistant' as const,
      kind: 'ahip' as const,
      item,
      createdAt: new Date(0).toISOString(),
    }
    const trace = {
      traceId: 'trace_gomoku',
      sessionId,
      agentId: 'agent_ahip_preview',
      mode: 'local_demo' as const,
      provider: 'openai-compatible' as const,
      model: 'gpt-4.1-mini',
      userText: 'Let us play gomoku',
      startedAt: new Date(0).toISOString(),
      finishedAt: new Date(0).toISOString(),
      status: 'ok' as const,
      repairCount: 0,
      validationErrors: [],
      finalMessageKind: 'ahip' as const,
      scenarioId: 'gomoku_widget',
    }
    const event = {
      eventId: 'artifact_event_1',
      sessionId,
      itemId: item.item_id,
      artifactId: 'artifact_1',
      artifactKind: 'report',
      openedAt: new Date(0).toISOString(),
    }

    await appendMessage(message)
    await appendRuntimeTrace(trace)
    await appendArtifactOpenEvent(event)
    await saveProviderTest('agent_ahip_preview', {
      status: 'ok',
      testedAt: new Date(0).toISOString(),
      message: 'provider ok',
    })

    const restored = await loadAhipPreviewSnapshot()

    expect(restored.messages[sessionId]?.some((item) => item.kind === 'ahip')).toBe(true)
    expect(restored.runtimeTraces[sessionId]?.[0]?.scenarioId).toBe('gomoku_widget')
    expect(restored.artifactOpenEvents[sessionId]?.[0]?.artifactKind).toBe('report')
    expect(restored.providerTests.agent_ahip_preview?.status).toBe('ok')
  })

  it('stores and deletes API keys in the separate secrets store', async () => {
    await resetAhipPreviewDb()
    await saveSecret('agent_ahip_preview', 'sk-preview-secret')

    expect((await loadSecrets()).apiKeysByAgentId.agent_ahip_preview).toBe('sk-preview-secret')
    expect(JSON.stringify(await loadAhipPreviewSnapshot())).not.toContain('sk-preview-secret')

    await deleteSecret('agent_ahip_preview')

    expect((await loadSecrets()).apiKeysByAgentId.agent_ahip_preview).toBeUndefined()
  })

  it('persists dynamic applets in IndexedDB for later hydration', async () => {
    await resetAhipPreviewDb()
    await registerDynamicApplet({
      widgetType: 'dev.vibly/dynamic_chess',
      displayName: 'Chess',
      htmlSource: '<!DOCTYPE html><html><body>Chess board</body></html>',
      registeredAt: new Date(0).toISOString(),
    })

    expect((await loadDynamicApplets())[0]?.widgetType).toBe('dev.vibly/dynamic_chess')

    clearDynamicApplets()
    expect(hasDynamicApplet('dev.vibly/dynamic_chess')).toBe(false)

    await hydrateDynamicAppletsFromDb()
    expect(hasDynamicApplet('dev.vibly/dynamic_chess')).toBe(true)
  })

  it('persists dynamic widget state snapshots separately from AHIP messages', async () => {
    await resetAhipPreviewDb()
    const widgetKey = makeWidgetStateKey('item_chess', 'chess_widget')

    await saveWidgetState({
      widgetKey,
      sessionId: 'session_ahip_preview',
      itemId: 'item_chess',
      widgetId: 'chess_widget',
      widgetType: 'dev.vibly/dynamic_chess',
      state: {
        turn: 'black',
        moves: ['e2e4', 'e7e5'],
      },
      updatedAt: new Date(0).toISOString(),
    })

    const restored = await loadWidgetState(widgetKey)
    const allStates = await loadWidgetStates()

    expect(restored?.state).toMatchObject({ turn: 'black' })
    expect(allStates.some((entry) => entry.widgetKey === widgetKey)).toBe(true)
    expect(JSON.stringify(await loadAhipPreviewSnapshot())).not.toContain('e2e4')
  })

  it('migrates legacy sessionStorage dynamic applets into IndexedDB', async () => {
    await resetAhipPreviewDb()
    clearDynamicApplets()
    window.sessionStorage.setItem(
      'ahip_dynamic_applets',
      JSON.stringify([
        {
          widgetType: 'dev.vibly/dynamic_legacy_chess',
          displayName: 'Legacy Chess',
          htmlSource: '<!DOCTYPE html><html><body>Legacy board</body></html>',
          registeredAt: new Date(0).toISOString(),
        },
      ]),
    )

    await hydrateDynamicAppletsFromDb()

    expect(hasDynamicApplet('dev.vibly/dynamic_legacy_chess')).toBe(true)
    expect((await loadDynamicApplets()).some((entry) => entry.widgetType === 'dev.vibly/dynamic_legacy_chess')).toBe(true)
  })

  it('migrates legacy localStorage state and secrets once', async () => {
    const legacyState = createDefaultAhipPreviewState()
    saveAhipPreviewState(legacyState)
    saveAhipPreviewSecrets({ apiKeysByAgentId: { agent_ahip_preview: 'sk-legacy-secret' } })

    const snapshot = await loadAhipPreviewSnapshot()
    const secrets = await loadSecrets()
    const secondSnapshot = await loadAhipPreviewSnapshot()

    expect(snapshot.selectedSessionId).toBe(legacyState.selectedSessionId)
    expect(secrets.apiKeysByAgentId.agent_ahip_preview).toBe('sk-legacy-secret')
    expect(secondSnapshot.messages.session_ahip_preview).toHaveLength(
      snapshot.messages.session_ahip_preview?.length ?? 0,
    )
    expect(JSON.stringify(snapshot)).not.toContain('sk-legacy-secret')
  })

  it('keeps legacy localStorage helpers available only for migration compatibility', () => {
    const state = createDefaultAhipPreviewState()
    saveAhipPreviewState(state)
    saveAhipPreviewSecrets({ apiKeysByAgentId: { agent_ahip_preview: 'sk-preview-secret' } })

    expect(loadAhipPreviewState().selectedSessionId).toBe(state.selectedSessionId)
    expect(loadAhipPreviewSecrets().apiKeysByAgentId.agent_ahip_preview).toBe('sk-preview-secret')
  })

  it('exports AHIP data without secrets', async () => {
    const state = await resetAhipPreviewDb()
    const sessionId = state.selectedSessionId ?? 'session_ahip_preview'
    await saveSecret('agent_ahip_preview', 'sk-export-secret')
    await registerDynamicApplet({
      widgetType: 'dev.vibly/dynamic_export_chess',
      displayName: 'Export Chess',
      htmlSource: '<!DOCTYPE html><html><body>Export board</body></html>',
      registeredAt: new Date(0).toISOString(),
    })
    await appendMessage({
      messageId: 'msg_dynamic_export_chess',
      sessionId,
      role: 'assistant',
      kind: 'ahip',
      createdAt: new Date(0).toISOString(),
      item: assertValidAHIPItem({
        protocol: 'ahip',
        version: '0.2',
        item_id: 'item_dynamic_export_chess',
        session_id: sessionId,
        kind: 'turn',
        actor: {
          actor_id: 'host',
          actor_kind: 'system',
          display_name: 'Host',
        },
        created_at: new Date(0).toISOString(),
        fallback_text: 'Export Chess widget',
        content: [
          {
            id: 'block_dynamic_export_chess',
            type: 'status',
            status: 'idle',
            message: 'Export Chess ready',
          },
        ],
        widgets: [
          {
            id: 'widget_dynamic_export_chess_ref',
            widget_id: 'dynamic_export_chess_widget',
            widget_type: 'dev.vibly/dynamic_export_chess',
            props: {},
            permissions: { network: 'none', clipboard: false, wallet: false, storage: 'session' },
            fallback_text: 'Export Chess widget fallback',
          },
        ],
      }),
    })
    await appendRuntimeTrace({
      traceId: 'trace_export',
      sessionId,
      agentId: 'agent_ahip_preview',
      mode: 'local_demo',
      provider: 'openai-compatible',
      model: 'gpt-4.1-mini',
      userText: 'export',
      startedAt: new Date(0).toISOString(),
      finishedAt: new Date(0).toISOString(),
      status: 'ok',
      repairCount: 0,
      validationErrors: [],
      finalMessageKind: 'text',
    })
    await saveWidgetState({
      widgetKey: makeWidgetStateKey('item_dynamic_export_chess', 'dynamic_export_chess_widget'),
      sessionId,
      itemId: 'item_dynamic_export_chess',
      widgetId: 'dynamic_export_chess_widget',
      widgetType: 'dev.vibly/dynamic_export_chess',
      state: { moves: ['e2e4'] },
      updatedAt: new Date(0).toISOString(),
    })

    const exportedSession = await exportAhipPreviewData({ kind: 'session', sessionId })
    const exportedAll = await exportAhipPreviewData({ kind: 'all' })

    expect(exportedSession.sessions).toHaveLength(1)
    expect(exportedAll.agents.length).toBeGreaterThan(0)
    expect(exportedSession.dynamicApplets.some((entry) => entry.widgetType === 'dev.vibly/dynamic_export_chess')).toBe(true)
    expect(exportedAll.dynamicApplets.some((entry) => entry.widgetType === 'dev.vibly/dynamic_export_chess')).toBe(true)
    expect(exportedSession.widgetStates.some((entry) => entry.widgetId === 'dynamic_export_chess_widget')).toBe(true)
    expect(exportedAll.widgetStates.some((entry) => entry.widgetId === 'dynamic_export_chess_widget')).toBe(true)
    expect(JSON.stringify(exportedSession)).not.toContain('sk-export-secret')
    expect(JSON.stringify(exportedAll)).not.toContain('sk-export-secret')
  })
})
