import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MessageSquareText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { useMvpApp } from '@/modules/mvp/provider'

export function PublicIdentityPage() {
  const { identityId } = useParams()
  const { getPublicIdentityView, getRelation, setRelationStatus, removeRelation } = useMvpApp()
  const identity = identityId ? getPublicIdentityView(identityId) : null
  const relation = identity ? getRelation(identity.identityId) : null

  if (!identity) {
    return (
      <div className="min-h-screen bg-app p-6">
        <EmptyState
          eyebrow="Public identity"
          title="Identity not found"
          description="The gateway-style public view is missing for this identity."
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app p-4 text-primary lg:p-8">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-default bg-panel shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-default px-5 py-4">
          <Link to="/discover" className="inline-flex items-center gap-2 text-sm text-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to discovery
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setRelationStatus(identity.identityId, 'favorite')}>
              Favorite
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRelationStatus(identity.identityId, 'contact')}>
              Mark contact
            </Button>
            <Button size="sm" variant="ghost" onClick={() => removeRelation(identity.identityId)}>
              Clear relation
            </Button>
          </div>
        </div>

        <div className="grid gap-6 px-5 py-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-5">
            <div className="flex items-start gap-4">
              <Avatar label={identity.profile?.display_name ?? identity.identityId} size="lg" tone="human" />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Public profile</p>
                <h1 className="mt-2 text-3xl font-semibold text-primary">
                  {identity.profile?.display_name ?? identity.identityId}
                </h1>
                <p className="mt-2 text-sm text-secondary">
                  {identity.profile?.headline ?? 'No public headline yet.'}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-default bg-surface p-4">
              <p className="text-sm text-secondary">
                {identity.profile?.bio ?? 'No public bio yet.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge label={`Identity ${identity.identityId}`} variant="default" />
                <Badge label={`Contact ${identity.profile?.default_contact_policy ?? 'closed'}`} variant="warning" />
                {relation ? <Badge label={`Local relation: ${relation.status}`} variant="accent" /> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-default bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-primary">Public agents</h2>
                <Badge label={`${identity.publicAgents.length} live`} variant="default" />
              </div>
              <div className="mt-4 space-y-3">
                {identity.publicAgents.length === 0 ? (
                  <p className="text-sm text-muted">No public agents have been published for this identity.</p>
                ) : (
                  identity.publicAgents.map((agent) => (
                    <div key={agent.agent_id} className="rounded-2xl border border-default px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{agent.name}</p>
                          <p className="mt-1 text-sm text-secondary">{agent.bio}</p>
                        </div>
                        <Badge label={agent.status} variant={agent.status === 'active' ? 'accent' : 'muted'} />
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
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-default bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Pointers</p>
              <div className="mt-3 space-y-3 text-sm text-secondary">
                <p>Profile ref: {identity.summary.activeProfileRef ?? 'unset'}</p>
                <p>Agent registry: {identity.summary.activeAgentRegistryRef ?? 'unset'}</p>
                <p>Auth registry: {identity.summary.activeAuthRegistryRef ?? 'unset'}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-default bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Links</p>
              <div className="mt-3 space-y-2">
                {(identity.profile?.links ?? []).map((link) => (
                  <a
                    key={`${link.type}-${link.value}`}
                    href={link.value}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-secondary transition hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {link.type}: {link.value}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-default bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Contact</p>
              <p className="mt-3 text-sm text-secondary">
                Public policy is currently set to <strong>{identity.profile?.default_contact_policy ?? 'closed'}</strong>.
              </p>
              <Button className="mt-4" variant="accent">
                <MessageSquareText className="h-4 w-4" />
                Start public conversation
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
