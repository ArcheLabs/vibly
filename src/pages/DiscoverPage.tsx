import { Link } from 'react-router-dom'
import { ExternalLink, Search } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchBar } from '@/components/ui/SearchBar'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useMvpApp } from '@/modules/mvp/provider'

export function DiscoverPage() {
  const {
    publicIdentities,
    selectedDiscoveryIdentity,
    selectDiscoveryIdentity,
    getRelation,
    setRelationStatus,
    removeRelation,
  } = useMvpApp()
  const [query, setQuery] = useState('')

  const matches = useMemo(
    () =>
      publicIdentities.filter((identity) => {
        const haystack = [
          identity.identityId,
          identity.profile?.display_name ?? '',
          identity.profile?.bio ?? '',
          identity.publicAgents.map((agent) => `${agent.name} ${agent.bio} ${agent.capabilities.join(' ')}`).join(' '),
        ]
          .join(' ')
          .toLowerCase()

        return haystack.includes(query.toLowerCase())
      }),
    [publicIdentities, query],
  )

  const selected = matches.find((identity) => identity.identityId === selectedDiscoveryIdentity?.identityId) ?? matches[0] ?? null
  const relation = selected ? getRelation(selected.identityId) : null

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={
          <SearchBar value={query} onChange={setQuery} placeholder="Search public identities and agents" />
        }
      >
        {matches.length > 0 ? (
          <div>
            {matches.map((identity) => (
              <button
                key={identity.identityId}
                type="button"
                onClick={() => selectDiscoveryIdentity(identity.identityId)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-default px-3 py-3 text-left transition',
                  identity.identityId === selected?.identityId ? 'bg-muted' : 'bg-surface hover-bg-muted',
                )}
              >
                <Avatar label={identity.profile?.display_name ?? identity.identityId} tone="human" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="truncate text-sm font-medium text-primary">
                        {identity.profile?.display_name ?? identity.identityId}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {identity.profile?.headline ?? identity.profile?.bio ?? identity.identityId}
                      </p>
                    </div>
                    <Badge label={String(identity.publicAgents.length)} variant="default" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="Discovery"
            title="No public matches"
            description="Try another search term or publish a profile and agent from the local identity flow."
          />
        )}
      </ListPanel>

      <MainPanel>
        {selected ? (
          <div className="space-y-4 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <Avatar label={selected.profile?.display_name ?? selected.identityId} size="lg" tone="human" />
                <div>
                  <h2 className="text-2xl font-semibold text-primary">
                    {selected.profile?.display_name ?? selected.identityId}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-secondary">
                    {selected.profile?.bio ?? 'No public bio available.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge label={selected.summary.status} variant="accent" />
                <Badge label={`Contact ${selected.profile?.default_contact_policy ?? 'closed'}`} variant="warning" />
                {relation ? <Badge label={`Local relation: ${relation.status}`} variant="default" /> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-default bg-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Public profile</p>
                  <p className="mt-2 text-sm text-secondary">
                    Headline: {selected.profile?.headline ?? 'No public headline'}
                  </p>
                </div>
                <Link
                  to={`/public/${selected.identityId}`}
                  className="inline-flex items-center gap-2 rounded-full border border-default bg-surface px-4 py-2 text-sm text-primary transition hover-bg-muted"
                >
                  Open public page
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setRelationStatus(selected.identityId, 'contact')}>
                  Contact
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRelationStatus(selected.identityId, 'favorite')}>
                  Favorite
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRelationStatus(selected.identityId, 'blocked')}>
                  Block
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeRelation(selected.identityId)}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-default bg-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-primary">Public agents</h3>
                <div className="inline-flex items-center gap-2 text-sm text-muted">
                  <Search className="h-4 w-4" />
                  Gateway-style discovery list
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {selected.publicAgents.length === 0 ? (
                  <p className="text-sm text-muted">No public agents have been published for this identity yet.</p>
                ) : (
                  selected.publicAgents.map((agent) => (
                    <div key={agent.agent_id} className="rounded-2xl border border-default bg-surface p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{agent.name}</p>
                          <p className="mt-1 text-sm text-secondary">{agent.bio}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge label={agent.status} variant={agent.status === 'active' ? 'accent' : 'muted'} />
                          <Badge label={agent.visibility} variant="default" />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {agent.capabilities.map((capability) => (
                          <Badge key={capability} label={capability} variant="default" />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            eyebrow="Discovery"
            title="Pick a public identity"
            description="Select a search result to inspect the aggregated profile and public agents."
          />
        )}
      </MainPanel>
    </>
  )
}
