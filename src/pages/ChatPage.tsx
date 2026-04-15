import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown, FileText, Menu, Plus, RotateCcw, Send, ShieldCheck } from 'lucide-react'
import { AhipMessageRenderer } from '@/components/ahip-preview/AhipMessageRenderer'
import { AgentListItem } from '@/components/agents/AgentListItem'
import { EmptyState } from '@/components/common/EmptyState'
import { useLayoutOverlay } from '@/components/layout/LayoutOverlayContext'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { SearchBar } from '@/components/ui/SearchBar'
import { cn } from '@/lib/utils'
import { AHIP_PREVIEW_CAPABILITIES } from '@/modules/ahip-preview/capabilities'
import { AHIP_PROTOCOL_SCENARIOS } from '@/modules/ahip-preview/scenarioMatrix'
import { getAhipSkillManifest } from '@/modules/ahip-preview/skillManifest'
import { toPreviewAgentListItem } from '@/modules/ahip-preview/agentListAdapter'
import { useAhipPreview } from '@/modules/ahip-preview/provider'
import type { AhipPreviewMessage } from '@/modules/ahip-preview/types'

function getLoadingPhaseLabel(phase?: string) {
  if (!phase) return 'Host'
  if (phase.includes('provider')) return 'Model'
  if (phase.includes('validating') || phase.includes('repairing') || phase.includes('parsing')) return 'Validation'
  if (phase.includes('tool')) return 'Tool'
  if (phase.includes('applet')) return 'Applet'
  return 'Host'
}

function getLoadingProgressText(label?: string, detail?: string) {
  const chunkMatch = label?.match(/(\d+)\s+chunks?\s+received/i)
  if (!chunkMatch && !detail) return null
  return [chunkMatch ? `${chunkMatch[1]} chunks received` : null, detail].filter(Boolean).join(' · ')
}

type MessageRenderGroup =
  | { kind: 'message'; message: AhipPreviewMessage }
  | { kind: 'widget_interactions'; key: string; messages: AhipPreviewMessage[]; interactionCount: number }

function isWidgetActionMessage(message: AhipPreviewMessage) {
  if (message.metadata?.source === 'widget_action') return true

  if (message.kind === 'text') {
    return /widget action|^(player|user)\s+(moved|move)|^move:/i.test(message.text.trim())
  }

  return Boolean(
    !message.item.widgets?.length &&
      message.item.actions?.some(
        (action) => action.kind === 'invoke_widget_action' && typeof action.payload?.widget_id === 'string',
      ),
  )
}

function groupMessagesForRender(messages: AhipPreviewMessage[]): MessageRenderGroup[] {
  const groups: MessageRenderGroup[] = []
  let pending: AhipPreviewMessage[] = []

  const flushPending = () => {
    if (!pending.length) return
    const interactionIds = new Set(pending.map((message) => message.metadata?.interactionId ?? message.messageId))
    groups.push({
      kind: 'widget_interactions',
      key: pending[0].messageId,
      messages: pending,
      interactionCount: pending.some((message) => message.metadata?.interactionId)
        ? interactionIds.size
        : Math.max(1, Math.ceil(pending.length / 2)),
    })
    pending = []
  }

  for (const message of messages) {
    if (isWidgetActionMessage(message)) {
      pending.push(message)
      continue
    }

    flushPending()
    groups.push({ kind: 'message', message })
  }

  flushPending()
  return groups
}

function getAhipSummary(message: AhipPreviewMessage) {
  if (message.kind !== 'ahip') return ''
  const titleBlock = message.item.content?.find((block) => {
    if (!('title' in block) || typeof block.title !== 'string') return false
    return block.title.trim().length > 0
  })
  const title = titleBlock && 'title' in titleBlock && typeof titleBlock.title === 'string'
    ? titleBlock.title
    : message.item.fallback_text
  return `${title} · ${message.item.kind}`
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
  const { closePanel } = useLayoutOverlay()
  const [draft, setDraft] = useState('')
  const [agentSearch, setAgentSearch] = useState('')
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false)
  const [previewDropdownOpen, setPreviewDropdownOpen] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [expandedInteractionGroups, setExpandedInteractionGroups] = useState<Record<string, boolean>>({})
  const [expandedAhipMessages, setExpandedAhipMessages] = useState<Record<string, boolean>>({})
  const [collapsedAhipMessages, setCollapsedAhipMessages] = useState<Record<string, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectedAgentSessions = useMemo(
    () => sessions.filter((session) => session.agentId === selectedAgent?.agentId),
    [selectedAgent?.agentId, sessions],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [selectedMessages.length, running])

  // Close header dropdowns on outside click.
  useEffect(() => {
    if (!sessionDropdownOpen && !previewDropdownOpen && !actionMenuOpen) return
    const handler = () => {
      setSessionDropdownOpen(false)
      setPreviewDropdownOpen(false)
      setActionMenuOpen(false)
    }
    document.addEventListener('click', handler, { once: true })
    return () => document.removeEventListener('click', handler)
  }, [actionMenuOpen, previewDropdownOpen, sessionDropdownOpen])

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
  const visibleAgents = useMemo(() => {
    const query = agentSearch.trim().toLowerCase()
    if (!query) return agents

    return agents.filter((agent) =>
      `${agent.name} ${agent.model} ${agent.provider} ${agent.systemPrompt} ${agent.bio ?? ''}`
        .toLowerCase()
        .includes(query),
    )
  }, [agentSearch, agents])
  const loadingPhaseLabel = getLoadingPhaseLabel(pipelineStatus?.phase)
  const loadingProgressText = getLoadingProgressText(pipelineStatus?.label, pipelineStatus?.detail)
  const messageRenderGroups = useMemo(() => groupMessagesForRender(selectedMessages), [selectedMessages])
  const latestMessageId = selectedMessages[selectedMessages.length - 1]?.messageId

  const renderAhipMessage = (message: AhipPreviewMessage) => {
    if (message.kind !== 'ahip') {
      return (
        <AhipMessageRenderer
          key={message.messageId}
          message={message}
          onAction={(action, item) => dispatchAction(action, item)}
          onArtifactOpen={(artifact, item) => openArtifact(artifact, item)}
          onRenderError={(item, error) => recordRenderError(item, error)}
        />
      )
    }

    const collapsed =
      collapsedAhipMessages[message.messageId] ??
      (expandedAhipMessages[message.messageId] ? false : message.messageId !== latestMessageId)

    if (collapsed) {
      return (
        <div key={message.messageId} className="rounded-lg border border-default bg-panel text-sm text-secondary">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover-bg-muted"
            onClick={() => {
              setExpandedAhipMessages((current) => ({ ...current, [message.messageId]: true }))
              setCollapsedAhipMessages((current) => ({ ...current, [message.messageId]: false }))
            }}
          >
            <span className="truncate font-medium text-primary">{getAhipSummary(message)}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          </button>
        </div>
      )
    }

    return (
      <div key={message.messageId} className="space-y-2">
        <div className="flex justify-end">
          <IconButton
            className="h-8 w-8"
            aria-label="Collapse AHIP"
            onClick={() => {
              setCollapsedAhipMessages((current) => ({ ...current, [message.messageId]: true }))
              setExpandedAhipMessages((current) => ({ ...current, [message.messageId]: false }))
            }}
          >
            <ChevronsDownUp className="h-4 w-4" />
          </IconButton>
        </div>
        <AhipMessageRenderer
          message={message}
          onAction={(action, item) => {
            setCollapsedAhipMessages((current) => ({ ...current, [message.messageId]: true }))
            setExpandedAhipMessages((current) => ({ ...current, [message.messageId]: false }))
            return dispatchAction(action, item)
          }}
          onArtifactOpen={(artifact, item) => openArtifact(artifact, item)}
          onRenderError={(item, error) => recordRenderError(item, error)}
        />
      </div>
    )
  }

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={
          <SearchBar value={agentSearch} onChange={setAgentSearch} placeholder="Search agents" />
        }
      >
        <div>
          {visibleAgents.map((agent) => {
            const active = agent.agentId === selectedAgent?.agentId

            return (
              <AgentListItem
                key={agent.agentId}
                agent={toPreviewAgentListItem(agent)}
                active={active}
                onClick={() => {
                  const latestSession = sessions
                    .filter((s) => s.agentId === agent.agentId)
                    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
                  if (latestSession) selectSession(latestSession.sessionId)
                  closePanel()
                }}
              />
            )
          })}
          {agents.length === 0 ? (
            <EmptyState
              eyebrow="AHIP"
              title="No agents yet"
              description="Go to Agents page to create your first AHIP agent."
            />
          ) : null}
          {agents.length > 0 && visibleAgents.length === 0 ? (
            <EmptyState
              eyebrow="Agents"
              title="No matching agents"
              description="Try a different search."
            />
          ) : null}
        </div>
      </ListPanel>

      <MainPanel className="h-screen max-h-screen overflow-hidden p-0">
        {!selectedAgent || !selectedSession ? (
          <EmptyState
            eyebrow="AHIP"
            title="Create an AHIP agent"
            description="Go to Agents to add a provider, model, and optional local API key."
          />
        ) : (
          <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
            <header className="relative z-20 shrink-0 border-b border-default bg-surface px-4 py-3">
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
                        setPreviewDropdownOpen(false)
                        setActionMenuOpen(false)
                        setSessionDropdownOpen((open) => !open)
                      }}
                      aria-label="Sessions"
                    >
                      <FileText className="h-4 w-4" />
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
                  <div className="relative">
                    <IconButton
                      active={previewDropdownOpen}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSessionDropdownOpen(false)
                        setActionMenuOpen(false)
                        setPreviewDropdownOpen((open) => !open)
                      }}
                      aria-label="Local preview"
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </IconButton>
                    {previewDropdownOpen ? (
                      <div
                        className="absolute right-0 top-[calc(100%+8px)] z-20 max-h-[min(720px,calc(100vh-96px))] w-[min(460px,calc(100vw-120px))] overflow-y-auto rounded-2xl border border-default bg-surface p-3 text-xs text-secondary shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                    ) : null}
                  </div>
                  <div className="relative">
                    <IconButton
                      active={actionMenuOpen}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSessionDropdownOpen(false)
                        setPreviewDropdownOpen(false)
                        setActionMenuOpen((open) => !open)
                      }}
                      aria-label="Menu"
                    >
                      <Menu className="h-4 w-4" />
                    </IconButton>
                    {actionMenuOpen ? (
                      <div
                        className="absolute right-0 top-[calc(100%+8px)] z-20 w-44 rounded-2xl border border-default bg-surface p-2 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={hydrating}
                          onClick={() => {
                            setActionMenuOpen(false)
                            void resetPreview()
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-primary transition hover-bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reset
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
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
              {messageRenderGroups.map((group) => {
                if (group.kind === 'message') {
                  return renderAhipMessage(group.message)
                }

                const expanded = Boolean(expandedInteractionGroups[group.key])

                return (
                  <div key={group.key} className="rounded-lg border border-default bg-panel text-sm text-secondary">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover-bg-muted"
                      onClick={() =>
                        setExpandedInteractionGroups((current) => ({
                          ...current,
                          [group.key]: !current[group.key],
                        }))
                      }
                    >
                      <span className="font-medium text-primary">Applet interactions</span>
                      <span className="text-xs text-muted">
                        {group.interactionCount} interaction{group.interactionCount === 1 ? '' : 's'} · {expanded ? 'Hide details' : 'Show details'}
                      </span>
                    </button>
                    {expanded ? (
                      <div className="space-y-3 border-t border-default p-3">
                        {group.messages.map((message) => (
                          renderAhipMessage(message)
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
              {running ? (
                <div className="rounded-lg border border-default bg-panel px-3 py-3 text-sm text-secondary">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-primary">
                          {longRunningRequest ? 'Still waiting for provider response' : 'Working on AHIP response...'}
                        </p>
                        <p className="mt-1 text-xs text-muted">{loadingPhaseLabel}</p>
                        {loadingProgressText ? (
                          <p className="mt-1 text-xs text-muted">{loadingProgressText}</p>
                        ) : null}
                      </div>
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
                    ) : (
                      <div className="flex items-center gap-1" aria-hidden="true">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="shrink-0 border-t border-default bg-muted/60 px-4 py-3">
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
                </div>
              </div>
            </footer>
          </div>
        )}
      </MainPanel>
    </>
  )
}
