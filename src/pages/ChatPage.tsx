import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, FileText, Plus, RotateCcw, Send, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AhipMessageRenderer } from '@/components/ahip-preview/AhipMessageRenderer'
import { EmptyState } from '@/components/common/EmptyState'
import { useLayoutOverlay } from '@/components/layout/LayoutOverlayContext'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/utils'
import { AHIP_PREVIEW_CAPABILITIES } from '@/modules/ahip-preview/capabilities'
import { AHIP_PROTOCOL_SCENARIOS } from '@/modules/ahip-preview/scenarioMatrix'
import { getAhipSkillManifest } from '@/modules/ahip-preview/skillManifest'
import { useAhipPreview } from '@/modules/ahip-preview/provider'

function engineLabel(hasApiKey: boolean) {
  return hasApiKey ? 'LangGraph' : 'Local demo'
}

export function ChatPage() {
  const {
    agents,
    sessions,
    selectedAgent,
    selectedSession,
    selectedMessages,
    selectedTraces,
    selectedArtifactEvents,
    selectedProviderTest,
    secrets,
    hydrating,
    hydrationError,
    running,
    pipelineStatus,
    longRunningRequest,
    runtimeError,
    createSession,
    selectSession,
    sendMessage,
    dispatchAction,
    continueWaitingForProvider,
    cancelRunningRequest,
    openArtifact,
    recordRenderError,
    exportPreviewData,
    resetPreview,
  } = useAhipPreview()
  const navigate = useNavigate()
  const { closePanel } = useLayoutOverlay()
  const [draft, setDraft] = useState('')
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectedAgentSessions = useMemo(
    () => sessions.filter((session) => session.agentId === selectedAgent?.agentId),
    [selectedAgent?.agentId, sessions],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [selectedMessages.length, running])

  // Close session dropdown on outside click
  useEffect(() => {
    if (!sessionDropdownOpen) return
    const handler = () => setSessionDropdownOpen(false)
    document.addEventListener('click', handler, { once: true })
    return () => document.removeEventListener('click', handler)
  }, [sessionDropdownOpen])

  const handleSend = () => {
    const text = draft.trim()
    if (!text || hydrating) return
    setDraft('')
    void sendMessage(text)
  }

  const handleExport = async (scope: 'session' | 'all') => {
    if (scope === 'session' && !selectedSession) return
    const sessionId = selectedSession?.sessionId
    const exportData = await exportPreviewData(
      scope === 'all'
        ? { kind: 'all' }
        : { kind: 'session', sessionId: sessionId ?? '' },
    )
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `vibly-ahip-preview-export-${date}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const agentApiKey = selectedAgent ? secrets.apiKeysByAgentId[selectedAgent.agentId] ?? '' : ''
  const skillManifest = getAhipSkillManifest(AHIP_PREVIEW_CAPABILITIES)
  const latestTrace = selectedTraces[selectedTraces.length - 1]
  const recentTraces = selectedTraces.slice(-3).reverse()
  const scenarioPrompts = AHIP_PROTOCOL_SCENARIOS.map((scenario) => scenario.promptExamples[0] ?? scenario.title)
  const selectedModelIsReasoner = selectedAgent?.provider === 'deepseek' && /reasoner/i.test(selectedAgent.model)

  return (
    <>
      {/* ── ListPanel: IM-style agent list ── */}
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">AHIP Preview</p>
              <h2 className="text-base font-semibold text-primary">Agents</h2>
            </div>
            <Button
              size="sm"
              variant="accent"
              className="h-8 w-8 shrink-0 rounded-full px-0"
              onClick={() => navigate('/agents')}
              aria-label="Manage agents"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div>
          {agents.map((agent) => {
            const active = agent.agentId === selectedAgent?.agentId
            const hasKey = Boolean(secrets.apiKeysByAgentId[agent.agentId])

            return (
              <button
                key={agent.agentId}
                type="button"
                onClick={() => {
                  const latestSession = sessions
                    .filter((s) => s.agentId === agent.agentId)
                    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
                  if (latestSession) selectSession(latestSession.sessionId)
                  closePanel()
                }}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-default px-3 py-3 text-left transition',
                  active ? 'bg-muted' : 'bg-surface hover-bg-muted',
                )}
              >
                <Avatar label={agent.name} src={agent.avatar} tone="agent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{agent.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {agent.bio || agent.systemPrompt.slice(0, 60)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge label={agent.provider} variant="default" />
                    <Badge label={agent.model.split('/').pop() ?? agent.model} variant="muted" />
                    <Badge label={engineLabel(hasKey)} variant={hasKey ? 'accent' : 'warning'} />
                  </div>
                </div>
              </button>
            )
          })}
          {agents.length === 0 ? (
            <EmptyState
              eyebrow="AHIP"
              title="No agents yet"
              description="Go to Agents page to create your first AHIP agent."
            />
          ) : null}
        </div>
      </ListPanel>

      {/* ── MainPanel: chat area ── */}
      <MainPanel className="p-0">
        {!selectedAgent || !selectedSession ? (
          <EmptyState
            eyebrow="AHIP"
            title="Create an AHIP agent"
            description="Go to Agents to add a provider, model, and optional local API key."
          />
        ) : (
          <div className="flex h-full min-h-[640px] flex-col bg-surface">
            {/* ── IM-style header with session dropdown ── */}
            <header className="relative border-b border-default px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar label={selectedAgent.name} src={selectedAgent.avatar} tone="agent" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-primary">{selectedAgent.name}</h2>
                      <Badge label={selectedAgent.provider} variant="default" />
                      <Badge label={agentApiKey ? 'LangGraph' : 'Local demo'} variant={agentApiKey ? 'accent' : 'warning'} />
                    </div>
                    <p className="truncate text-xs text-muted">
                      {selectedAgent.bio || `${selectedAgent.model} · ${selectedAgent.baseUrl}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <IconButton
                      active={sessionDropdownOpen}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSessionDropdownOpen((open) => !open)
                      }}
                      aria-label="Sessions"
                    >
                      <FileText className="h-4 w-4" />
                      <ChevronDown className="h-3 w-3" />
                    </IconButton>
                    {sessionDropdownOpen ? (
                      <div
                        className="absolute right-0 top-[calc(100%+8px)] z-20 w-[320px] rounded-2xl border border-default bg-surface shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between border-b border-default px-4 py-3">
                          <p className="text-sm font-semibold text-primary">Sessions</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              createSession(selectedAgent.agentId)
                              setSessionDropdownOpen(false)
                            }}
                          >
                            <Plus className="h-3 w-3" />
                            New
                          </Button>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto">
                          {selectedAgentSessions.map((session) => (
                            <button
                              key={session.sessionId}
                              type="button"
                              onClick={() => {
                                selectSession(session.sessionId)
                                setSessionDropdownOpen(false)
                              }}
                              className={cn(
                                'flex w-full flex-col border-b border-default px-4 py-2.5 text-left text-sm transition',
                                session.sessionId === selectedSession?.sessionId
                                  ? 'bg-muted text-primary'
                                  : 'text-secondary hover-bg-muted',
                              )}
                            >
                              <p className="truncate">{session.title}</p>
                              <p className="mt-0.5 text-xs text-muted">
                                {new Date(session.updatedAt).toLocaleString()}
                              </p>
                            </button>
                          ))}
                          {selectedAgentSessions.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-muted">No sessions yet.</p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              {selectedProviderTest.status !== 'idle' ? (
                <div className="mt-2 rounded-md border border-default bg-muted px-3 py-2 text-xs text-secondary">
                  <span className="font-semibold text-primary">Provider test:</span>{' '}
                  {selectedProviderTest.status}
                  {selectedProviderTest.testedAt ? ` at ${new Date(selectedProviderTest.testedAt).toLocaleString()}` : ''}
                  {selectedProviderTest.message ? ` - ${selectedProviderTest.message}` : ''}
                </div>
              ) : null}
              {selectedModelIsReasoner ? (
                <div className="mt-2 rounded-md border border-default bg-muted px-3 py-2 text-xs text-warning">
                  DeepSeek reasoner can take several minutes. Use deepseek-chat for faster AHIP JSON preview.
                </div>
              ) : null}
              {hydrationError ? (
                <div className="mt-2 rounded-md border border-default bg-muted px-3 py-2 text-xs text-warning">
                  Local database warning: {hydrationError}
                </div>
              ) : null}
            </header>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {hydrating ? (
                <div className="rounded-lg border border-default bg-panel px-3 py-2 text-sm text-secondary">
                  Loading local AHIP database...
                </div>
              ) : null}
              {runtimeError ? (
                <div className="rounded-lg border border-default bg-muted px-3 py-2 text-sm text-secondary">
                  Runtime error: {runtimeError}
                </div>
              ) : null}
              {selectedMessages.length === 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-default bg-panel p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-accent" />
                      <h2 className="font-semibold text-primary">AHIP Skill behavior</h2>
                    </div>
                    <p className="mt-2 text-sm text-secondary">
                      Simple prompts stay as text. Structured, actionable, stateful, approval, payment, artifact, or widget prompts become AHIP items.
                    </p>
                  </div>
                  <div className="rounded-lg border border-default bg-panel p-4">
                    <h2 className="font-semibold text-primary">Try these prompts</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {scenarioPrompts.map((prompt) => (
                        <Button key={prompt} size="sm" variant="outline" onClick={() => setDraft(prompt)}>
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
              {selectedMessages.map((message) => (
                <AhipMessageRenderer
                  key={message.messageId}
                  message={message}
                  onAction={(action, item) => dispatchAction(action, item)}
                  onArtifactOpen={(artifact, item) => openArtifact(artifact, item)}
                  onRenderError={(item, error) => recordRenderError(item, error)}
                />
              ))}
              {running ? (
                <div className="rounded-lg border border-default bg-panel px-3 py-2 text-sm text-secondary">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-primary">
                        {pipelineStatus?.label ?? 'Generating and validating AHIP response...'}
                      </p>
                      <p className="mt-1 text-xs">
                        {longRunningRequest
                          ? `${longRunningRequest.operationLabel} You can keep waiting or cancel this request.`
                          : pipelineStatus
                            ? `${pipelineStatus.phase}${pipelineStatus.providerActive ? ' · provider active' : ' · local runtime'} · last activity ${new Date(pipelineStatus.lastActivityAt).toLocaleTimeString()}`
                            : 'The runtime is still running.'}
                      </p>
                    </div>
                    {longRunningRequest ? (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="accent" onClick={continueWaitingForProvider}>
                          Continue waiting
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelRunningRequest}>
                          Cancel
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="border-t border-default bg-muted/60 px-4 py-3">
              <div className="mb-3 rounded-lg border border-default bg-surface p-3 text-xs text-secondary">
                <p className="font-semibold text-primary">Local BYOK preview</p>
                <p className="mt-1">
                  Chats and API keys stay in this browser's IndexedDB. JSON export excludes API keys.
                </p>
                <p className="mt-1 text-warning">
                  Do not paste API keys or private secrets into chat messages.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void handleExport('session')} disabled={!selectedSession || hydrating}>
                    Export session JSON
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void handleExport('all')} disabled={hydrating}>
                    Export all JSON
                  </Button>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-primary">AHIP Skill manifest preview</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-2">{skillManifest}</pre>
                </details>
                <details className="mt-2">
                  <summary className="cursor-pointer text-primary">
                    Runtime trace{latestTrace ? `: ${latestTrace.mode} / ${latestTrace.status}` : ''}
                  </summary>
                  {recentTraces.length ? (
                    <div className="mt-2 space-y-2">
                      {recentTraces.map((trace) => (
                        <div key={trace.traceId} className="rounded-md bg-muted p-2">
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-primary">
                            <span>{trace.mode}</span>
                            <span>{trace.status}</span>
                            <span>{trace.provider}</span>
                            <span>{trace.model}</span>
                          </div>
                          <p className="mt-1">
                            scenario={trace.scenarioId ?? 'none'} decision={trace.decisionMode ?? 'none'} repair={trace.repairCount} message={trace.finalMessageKind ?? 'none'}
                          </p>
                          {trace.actionId ? <p className="mt-1">action={trace.actionId}</p> : null}
                          {trace.artifactIds?.length ? <p className="mt-1">artifacts={trace.artifactIds.join(', ')}</p> : null}
                          {trace.fallbackUsed ? <p className="mt-1">fallback used</p> : null}
                          {trace.validationErrors.length ? (
                            <p className="mt-1 text-warning">validation: {trace.validationErrors.join('; ')}</p>
                          ) : null}
                          {trace.error ? <p className="mt-1 text-warning">error: {trace.error}</p> : null}
                        </div>
                      ))}
                      {latestTrace?.decisionJson ? (
                        <details>
                          <summary className="cursor-pointer text-primary">Latest decision JSON</summary>
                          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-2">
                            {latestTrace.decisionJson}
                          </pre>
                        </details>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2">No runtime trace yet. Send a message to record local demo or LangGraph execution.</p>
                  )}
                </details>
                <details className="mt-2">
                  <summary className="cursor-pointer text-primary">
                    Artifact events{selectedArtifactEvents.length ? `: ${selectedArtifactEvents.length}` : ''}
                  </summary>
                  {selectedArtifactEvents.length ? (
                    <div className="mt-2 space-y-2">
                      {selectedArtifactEvents.slice(-5).reverse().map((event) => (
                        <div key={event.eventId} className="rounded-md bg-muted p-2">
                          <p className="text-primary">{event.name ?? event.artifactId}</p>
                          <p className="mt-1">
                            {event.artifactKind} opened at {new Date(event.openedAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2">No artifact open events yet.</p>
                  )}
                </details>
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                      handleSend()
                    }
                  }}
                  placeholder="Ask naturally. AHIP renders only when the interaction needs structure, action, or durable state."
                  rows={3}
                  className="min-h-[84px] flex-1 resize-none rounded-lg border border-default bg-surface px-3 py-2 text-sm text-primary outline-none placeholder:text-muted"
                />
                <div className="flex shrink-0 flex-col gap-2">
                  <Button variant="accent" disabled={!draft.trim() || running || hydrating} onClick={handleSend}>
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                  <Button variant="outline" onClick={() => void resetPreview()} disabled={hydrating}>
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </footer>
          </div>
        )}
      </MainPanel>
    </>
  )
}
