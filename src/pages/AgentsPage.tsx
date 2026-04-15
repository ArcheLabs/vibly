import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { AgentListItem } from '@/components/agents/AgentListItem'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { SearchBar } from '@/components/ui/SearchBar'
import { toPreviewAgentListItem } from '@/modules/ahip-preview/agentListAdapter'
import { useAhipPreview } from '@/modules/ahip-preview/provider'
import type { AhipPreviewProviderKind } from '@/modules/ahip-preview/types'

const providerOptions: Array<{ value: AhipPreviewProviderKind; label: string; baseUrl: string; model: string }> = [
  { value: 'openai-compatible', label: 'OpenAI compatible', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },
  { value: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { value: 'openrouter', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4.1-mini' },
  { value: 'ollama', label: 'Ollama', baseUrl: 'http://localhost:11434', model: 'llama3.1' },
  { value: 'lm-studio', label: 'LM Studio', baseUrl: 'http://localhost:1234/v1', model: 'local-model' },
  { value: 'anthropic', label: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
  { value: 'gemini', label: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-1.5-pro' },
  { value: 'webllm', label: 'WebLLM (planned)', baseUrl: 'browser://webllm', model: 'local-webgpu' },
]

const defaultSystemPrompt =
  'You are a careful AHIP preview agent. Use AHIP only for durable, structured, or actionable interactions.'

export function AgentsPage() {
  const {
    agents,
    secrets,
    selectedAgent,
    selectedProviderTest,
    hydrating,
    createAgent,
    updateAgent,
    updateAgentApiKey,
    deleteAgentApiKey,
    selectSession,
    testProvider,
    sessions,
  } = useAhipPreview()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [focusedAgentId, setFocusedAgentId] = useState<string | null>(null)

  // New agent form state
  const [newAgentName, setNewAgentName] = useState('AHIP Agent')
  const [newBio, setNewBio] = useState('')
  const [newProvider, setNewProvider] = useState<AhipPreviewProviderKind>('openai-compatible')
  const selectedProviderPreset = providerOptions.find((option) => option.value === newProvider) ?? providerOptions[0]
  const [newBaseUrl, setNewBaseUrl] = useState(selectedProviderPreset.baseUrl)
  const [newModel, setNewModel] = useState(selectedProviderPreset.model)
  const [newApiKey, setNewApiKey] = useState('')
  const [newSystemPrompt, setNewSystemPrompt] = useState(defaultSystemPrompt)

  useEffect(() => {
    const preset = providerOptions.find((option) => option.value === newProvider)
    if (!preset) return
    setNewBaseUrl(preset.baseUrl)
    setNewModel(preset.model)
  }, [newProvider])

  const visibleAgents = useMemo(
    () =>
      agents.filter((agent) =>
        `${agent.name} ${agent.bio ?? ''} ${agent.model} ${agent.provider}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [agents, search],
  )

  const focusedAgent =
    visibleAgents.find((a) => a.agentId === focusedAgentId) ??
    visibleAgents.find((a) => a.agentId === selectedAgent?.agentId) ??
    visibleAgents[0] ??
    null

  const focusedApiKey = focusedAgent ? secrets.apiKeysByAgentId[focusedAgent.agentId] ?? '' : ''
  const focusedProviderTest = focusedAgent
    ? selectedAgent?.agentId === focusedAgent.agentId
      ? selectedProviderTest
      : { status: 'idle' as const }
    : { status: 'idle' as const }

  const handleCreateAgent = () => {
    createAgent({
      name: newAgentName,
      bio: newBio,
      provider: newProvider,
      baseUrl: newBaseUrl,
      model: newModel,
      apiKey: newApiKey,
      systemPrompt: newSystemPrompt,
    })
    setCreating(false)
    setNewApiKey('')
    setNewBio('')
    setNewAgentName('AHIP Agent')
    setNewSystemPrompt(defaultSystemPrompt)
  }

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <SearchBar value={search} onChange={setSearch} placeholder="Search agents" />
              <Button
                size="sm"
                variant="accent"
                onClick={() => setCreating(true)}
                className="h-9 w-9 shrink-0 rounded-full px-0"
                aria-label="Create agent"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        }
      >
        {visibleAgents.length > 0 ? (
          <div>
            {visibleAgents.map((agent) => {
              const active = agent.agentId === focusedAgent?.agentId

              return (
                <AgentListItem
                  key={agent.agentId}
                  agent={toPreviewAgentListItem(agent)}
                  active={active}
                  onClick={() => setFocusedAgentId(agent.agentId)}
                />
              )
            })}
          </div>
        ) : (
          <EmptyState
            eyebrow="Agents"
            title="No agents yet"
            description="Create a new AHIP agent to get started."
          />
        )}
      </ListPanel>

      <Dialog
        open={creating}
        title="New AHIP agent"
        description="Add a local preview agent. API keys stay in this browser only."
        onClose={() => setCreating(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleCreateAgent}>
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm text-secondary">
            Agent name
            <Input className="mt-2" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} placeholder="Agent name" />
          </label>
          <label className="block text-sm text-secondary">
            Bio
            <Input className="mt-2" value={newBio} onChange={(e) => setNewBio(e.target.value)} placeholder="Short bio (optional)" />
          </label>
          <label className="block text-sm text-secondary">
            Provider
            <select
              className="mt-2 h-10 w-full rounded-md border border-default bg-surface px-3 text-sm text-primary outline-none focus-border-strong"
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value as AhipPreviewProviderKind)}
            >
              {providerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-secondary">
            Base URL
            <Input className="mt-2" value={newBaseUrl} onChange={(e) => setNewBaseUrl(e.target.value)} placeholder="Base URL" />
          </label>
          <label className="block text-sm text-secondary">
            Model
            <Input className="mt-2" value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="Model" />
          </label>
          <label className="block text-sm text-secondary">
            API key
            <Input
              className="mt-2"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="API key (local BYOK)"
              type="password"
            />
          </label>
          <label className="block text-sm text-secondary">
            System prompt
            <textarea
              value={newSystemPrompt}
              onChange={(e) => setNewSystemPrompt(e.target.value)}
              className="mt-2 min-h-[96px] w-full rounded-md border border-default bg-surface px-3 py-2 text-sm text-primary outline-none focus-border-strong"
              placeholder="System prompt"
            />
          </label>
        </div>
      </Dialog>

      <MainPanel>
        {focusedAgent ? (
          <div className="space-y-4 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <Avatar label={focusedAgent.name} src={focusedAgent.avatar} size="lg" tone="agent" />
                <div>
                  <h2 className="text-2xl font-semibold text-primary">{focusedAgent.name}</h2>
                  <p className="mt-1 text-sm text-secondary">
                    {focusedAgent.bio || 'AHIP preview agent — add a bio in the settings below.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge label={focusedAgent.provider} variant="default" />
                <Badge label={focusedAgent.model.split('/').pop() ?? focusedAgent.model} variant="muted" />
                <Badge label={focusedApiKey ? 'LangGraph LLM' : 'Local demo'} variant={focusedApiKey ? 'accent' : 'warning'} />
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {/* ── Profile ── */}
              <div className="space-y-3 rounded-3xl border border-default bg-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Profile</p>
                <label className="block text-sm text-secondary">
                  Name
                  <Input
                    className="mt-2"
                    value={focusedAgent.name}
                    onChange={(e) => updateAgent(focusedAgent.agentId, { name: e.target.value })}
                  />
                </label>
                <label className="block text-sm text-secondary">
                  Bio
                  <textarea
                    value={focusedAgent.bio ?? ''}
                    onChange={(e) => updateAgent(focusedAgent.agentId, { bio: e.target.value })}
                    className="mt-2 min-h-[80px] w-full rounded-2xl border border-default bg-surface px-3 py-3 text-sm text-primary outline-none focus-border-strong"
                    placeholder="Brief description of the agent"
                  />
                </label>
                <label className="block text-sm text-secondary">
                  System prompt
                  <textarea
                    value={focusedAgent.systemPrompt}
                    onChange={(e) => updateAgent(focusedAgent.agentId, { systemPrompt: e.target.value })}
                    className="mt-2 min-h-[112px] w-full rounded-2xl border border-default bg-surface px-3 py-3 text-sm text-primary outline-none focus-border-strong"
                  />
                </label>
              </div>

              {/* ── Provider config ── */}
              <div className="space-y-3 rounded-3xl border border-default bg-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Provider</p>
                <label className="block text-sm text-secondary">
                  Provider
                  <select
                    className="mt-2 h-10 w-full rounded-2xl border border-default bg-surface px-3 text-sm text-primary outline-none"
                    value={focusedAgent.provider}
                    onChange={(e) => updateAgent(focusedAgent.agentId, { provider: e.target.value as AhipPreviewProviderKind })}
                  >
                    {providerOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-secondary">
                  Base URL
                  <Input
                    className="mt-2"
                    value={focusedAgent.baseUrl}
                    onChange={(e) => updateAgent(focusedAgent.agentId, { baseUrl: e.target.value })}
                  />
                </label>
                <label className="block text-sm text-secondary">
                  Model
                  <Input
                    className="mt-2"
                    value={focusedAgent.model}
                    onChange={(e) => updateAgent(focusedAgent.agentId, { model: e.target.value })}
                  />
                </label>
                <label className="block text-sm text-secondary">
                  API key (stays in this browser only)
                  <Input
                    className="mt-2"
                    type="password"
                    value={focusedApiKey}
                    placeholder="Enter API key for BYOK preview"
                    onChange={(e) => updateAgentApiKey(focusedAgent.agentId, e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => deleteAgentApiKey(focusedAgent.agentId)}>
                    Clear key
                  </Button>
                  <Button
                    variant="accent"
                    disabled={focusedProviderTest.status === 'testing' || hydrating}
                    onClick={() => {
                      // Make sure this agent is selected so the test applies
                      const firstSession = sessions.find((s) => s.agentId === focusedAgent.agentId)
                      if (firstSession) selectSession(firstSession.sessionId)
                      void testProvider(focusedAgent.agentId)
                    }}
                  >
                    {focusedProviderTest.status === 'testing' ? 'Checking...' : 'Confirm'}
                  </Button>
                </div>
                {focusedProviderTest.status !== 'idle' ? (
                  <div className="rounded-md border border-default bg-muted px-3 py-2 text-xs text-secondary">
                    <span className="font-semibold text-primary">Result:</span>{' '}
                    {focusedProviderTest.status}
                    {focusedProviderTest.testedAt ? ` at ${new Date(focusedProviderTest.testedAt).toLocaleString()}` : ''}
                    {focusedProviderTest.message ? ` — ${focusedProviderTest.message}` : ''}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            eyebrow="Agents"
            title={agents.length ? 'Select an agent' : 'Create an agent'}
            description={agents.length ? 'Pick an agent to edit its profile and provider settings.' : 'Click + in the sidebar to create your first AHIP agent.'}
          />
        )}
      </MainPanel>
    </>
  )
}
