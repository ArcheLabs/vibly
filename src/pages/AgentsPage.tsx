import { useMemo, useState } from 'react'
import { Globe, Lock, PencilLine, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { AgentListItem } from '@/components/agents/AgentListItem'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { Input } from '@/components/ui/Input'
import { SearchBar } from '@/components/ui/SearchBar'
import { cn } from '@/lib/utils'
import { useMvpApp } from '@/modules/mvp/provider'
import type { AgentListFilter, AgentRecord } from '@/modules/agents/types'

const filterTabs: AgentListFilter[] = ['all', 'private', 'public', 'draft']

function publishActionLabel(agent: AgentRecord) {
  if (agent.publishState === 'public_live' || agent.publishState === 'public_dirty') return 'Republish'
  return 'Publish'
}

export function AgentsPage() {
  const {
    currentIdentity,
    filteredLocalAgents,
    selectedLocalAgent,
    uiState,
    createAgent,
    selectLocalAgent,
    setAgentFilter,
    updateAgent,
    deleteAgent,
    publishAgent,
  } = useMvpApp()
  const [search, setSearch] = useState('')

  const visibleAgents = useMemo(
    () =>
      filteredLocalAgents.filter((agent) =>
        `${agent.name} ${agent.bio ?? ''} ${agent.capabilities.join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [filteredLocalAgents, search],
  )

  const focusedAgent = visibleAgents.find((agent) => agent.agentId === selectedLocalAgent?.agentId) ?? visibleAgents[0] ?? null

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <SearchBar value={search} onChange={setSearch} placeholder="Search local agents" />
              <Button size="sm" variant="accent" onClick={createAgent}>
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </div>
            <div className="flex gap-2">
              {filterTabs.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setAgentFilter(filter)}
                  className={cn(
                    'flex-1 rounded-full border px-3 py-2 text-sm transition',
                    uiState.agentFilter === filter
                      ? 'border-accent bg-muted text-primary'
                      : 'border-default bg-surface text-muted hover-bg-muted',
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {visibleAgents.length > 0 ? (
          <div>
            {visibleAgents.map((agent) => (
              <AgentListItem
                key={agent.agentId}
                agent={agent}
                active={agent.agentId === focusedAgent?.agentId}
                onClick={() => selectLocalAgent(agent.agentId)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="Agents"
            title="No agents in this filter"
            description="Create a local private agent or change the filter to inspect published state."
          />
        )}
      </ListPanel>

      <MainPanel>
        {focusedAgent ? (
          <div className="space-y-4 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Agent details</p>
                <h2 className="mt-2 text-2xl font-semibold text-primary">{focusedAgent.name}</h2>
                <p className="mt-2 text-sm text-secondary">
                  Private/public visibility stays local until you publish the agent registry.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge label={focusedAgent.publishState} variant="default" />
                <Badge label={focusedAgent.visibility} variant={focusedAgent.visibility === 'public' ? 'accent' : 'muted'} />
                <Badge label={focusedAgent.status} variant={focusedAgent.status === 'active' ? 'accent' : 'muted'} />
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-3 rounded-3xl border border-default bg-panel p-4">
                <label className="block text-sm text-secondary">
                  Name
                  <Input
                    className="mt-2"
                    value={focusedAgent.name}
                    onChange={(event) => updateAgent(focusedAgent.agentId, { name: event.target.value })}
                  />
                </label>
                <label className="block text-sm text-secondary">
                  Bio
                  <textarea
                    value={focusedAgent.bio ?? ''}
                    onChange={(event) => updateAgent(focusedAgent.agentId, { bio: event.target.value })}
                    className="mt-2 min-h-[112px] w-full rounded-2xl border border-default bg-surface px-3 py-3 text-sm text-primary outline-none focus-border-strong"
                  />
                </label>
                <label className="block text-sm text-secondary">
                  Description
                  <textarea
                    value={focusedAgent.description ?? ''}
                    onChange={(event) => updateAgent(focusedAgent.agentId, { description: event.target.value })}
                    className="mt-2 min-h-[112px] w-full rounded-2xl border border-default bg-surface px-3 py-3 text-sm text-primary outline-none focus-border-strong"
                  />
                </label>
              </div>

              <div className="space-y-3 rounded-3xl border border-default bg-panel p-4">
                <label className="block text-sm text-secondary">
                  Visibility
                  <select
                    className="mt-2 h-10 w-full rounded-2xl border border-default bg-surface px-3 text-sm text-primary outline-none"
                    value={focusedAgent.visibility}
                    onChange={(event) =>
                      updateAgent(focusedAgent.agentId, {
                        visibility: event.target.value as AgentRecord['visibility'],
                      })
                    }
                  >
                    <option value="private">private</option>
                    <option value="public">public</option>
                  </select>
                </label>

                <label className="block text-sm text-secondary">
                  Status
                  <select
                    className="mt-2 h-10 w-full rounded-2xl border border-default bg-surface px-3 text-sm text-primary outline-none"
                    value={focusedAgent.status}
                    onChange={(event) =>
                      updateAgent(focusedAgent.agentId, {
                        status: event.target.value as AgentRecord['status'],
                      })
                    }
                  >
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                  </select>
                </label>

                <label className="block text-sm text-secondary">
                  Pricing mode
                  <select
                    className="mt-2 h-10 w-full rounded-2xl border border-default bg-surface px-3 text-sm text-primary outline-none"
                    value={focusedAgent.pricingMode}
                    onChange={(event) =>
                      updateAgent(focusedAgent.agentId, {
                        pricingMode: event.target.value as AgentRecord['pricingMode'],
                      })
                    }
                  >
                    <option value="free">free</option>
                    <option value="per_message">per_message</option>
                    <option value="per_session">per_session</option>
                  </select>
                </label>

                <label className="block text-sm text-secondary">
                  Capabilities (comma separated)
                  <Input
                    className="mt-2"
                    value={focusedAgent.capabilities.join(', ')}
                    onChange={(event) =>
                      updateAgent(focusedAgent.agentId, {
                        capabilities: event.target.value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-default bg-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">On-chain publishing</p>
                  <h3 className="mt-2 text-lg font-semibold text-primary">Registry pointer workflow</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge label={`Owner ${currentIdentity?.identityId ?? 'not registered'}`} variant="default" />
                  {focusedAgent.lastPublishedAt ? (
                    <Badge label={`Published ${new Date(focusedAgent.lastPublishedAt).toLocaleString()}`} variant="muted" />
                  ) : null}
                </div>
              </div>

              <Divider variant="full" className="my-4" />

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-default bg-surface p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Visibility</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-primary">
                    {focusedAgent.visibility === 'public' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {focusedAgent.visibility}
                  </p>
                </div>
                <div className="rounded-2xl border border-default bg-surface p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Publish state</p>
                  <p className="mt-2 text-sm text-primary">{focusedAgent.publishState}</p>
                </div>
                <div className="rounded-2xl border border-default bg-surface p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Last published</p>
                  <p className="mt-2 text-sm text-primary">
                    {focusedAgent.lastPublishedAt ? new Date(focusedAgent.lastPublishedAt).toLocaleString() : 'never'}
                  </p>
                </div>
                <div className="rounded-2xl border border-default bg-surface p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Required action</p>
                  <p className="mt-2 text-sm text-primary">
                    {focusedAgent.visibility === 'public' ? publishActionLabel(focusedAgent) : 'Keep local or switch to public'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="accent"
                  onClick={() => publishAgent(focusedAgent.agentId)}
                  disabled={!currentIdentity || focusedAgent.visibility !== 'public'}
                >
                  <RefreshCw className="h-4 w-4" />
                  {publishActionLabel(focusedAgent)}
                </Button>
                <Button variant="outline" onClick={() => updateAgent(focusedAgent.agentId, { visibility: 'public' })}>
                  <Globe className="h-4 w-4" />
                  Make public draft
                </Button>
                <Button variant="ghost" onClick={() => deleteAgent(focusedAgent.agentId)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            eyebrow="Agents"
            title="Select an agent"
            description="Pick a local agent to edit its visibility, profile, pricing, and publish state."
          />
        )}
      </MainPanel>
    </>
  )
}
