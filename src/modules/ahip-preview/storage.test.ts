import { afterEach, describe, expect, it } from 'vitest'
import { assertValidAHIPItem } from '@ahip/core'
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
  saveProviderTest,
  saveSecret,
} from './storage'

afterEach(async () => {
  window.localStorage.clear()
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

    const exportedSession = await exportAhipPreviewData({ kind: 'session', sessionId })
    const exportedAll = await exportAhipPreviewData({ kind: 'all' })

    expect(exportedSession.sessions).toHaveLength(1)
    expect(exportedAll.agents.length).toBeGreaterThan(0)
    expect(JSON.stringify(exportedSession)).not.toContain('sk-export-secret')
    expect(JSON.stringify(exportedAll)).not.toContain('sk-export-secret')
  })
})
