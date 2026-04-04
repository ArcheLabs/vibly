import { useState } from 'react'
import { CircleUserRound, IdCard, Info, PencilLine, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { PanelTitle } from '@/components/layout/PanelTitle'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { Input } from '@/components/ui/Input'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'
import { useMvpApp } from '@/modules/mvp/provider'
import type { MeSection } from '@/types'

const meSections: Array<{ key: MeSection; label: string; icon: typeof CircleUserRound }> = [
  { key: 'profile', label: 'Profile', icon: CircleUserRound },
  { key: 'identity', label: 'Identity', icon: IdCard },
  { key: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { key: 'security', label: 'Security', icon: ShieldCheck },
  { key: 'about', label: 'About', icon: Info },
]

export function MePage() {
  const { meSection, setMeSection } = useAppContext()
  const {
    config,
    chainState,
    currentIdentity,
    activeWalletAccount,
    localPrivateState,
    publicProfile,
    updateProfileDraft,
    registerIdentity,
    publishProfile,
    publicAgents,
  } = useMvpApp()
  const [linkDraft, setLinkDraft] = useState(localPrivateState.profileDraft.links[0]?.value ?? '')

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={<PanelTitle icon={CircleUserRound} title="Me" />}
      >
        <div>
          {meSections.map((section) => {
            const Icon = section.icon

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setMeSection(section.key)}
                className={cn(
                  'flex w-full items-center gap-2 border-b border-default px-3 py-3 text-sm transition',
                  meSection === section.key ? 'bg-muted text-primary' : 'text-muted hover-bg-muted',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
              </button>
            )
          })}
        </div>
      </ListPanel>

      <MainPanel>
        <div className="space-y-4 p-3">
          {meSection === 'profile' ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Public profile editor</p>
                  <h2 className="mt-2 text-2xl font-semibold text-primary">
                    {localPrivateState.profileDraft.displayName || 'Unnamed profile'}
                  </h2>
                  <p className="mt-2 text-sm text-secondary">
                    Edit the public draft, then upload content and move the active profile pointer.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge label={`State: ${localPrivateState.profilePublishState}`} variant="default" />
                  {publicProfile ? <Badge label={`Active ref set`} variant="accent" /> : null}
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-default bg-panel p-4">
                  <label className="block text-sm text-secondary">
                    Display name
                    <Input
                      className="mt-2"
                      value={localPrivateState.profileDraft.displayName}
                      onChange={(event) => updateProfileDraft({ displayName: event.target.value })}
                    />
                  </label>
                  <label className="block text-sm text-secondary">
                    Username
                    <Input
                      className="mt-2"
                      value={localPrivateState.profileDraft.username ?? ''}
                      onChange={(event) => updateProfileDraft({ username: event.target.value })}
                    />
                  </label>
                  <label className="block text-sm text-secondary">
                    Headline
                    <Input
                      className="mt-2"
                      value={localPrivateState.profileDraft.headline ?? ''}
                      onChange={(event) => updateProfileDraft({ headline: event.target.value })}
                    />
                  </label>
                </div>

                <div className="space-y-3 rounded-3xl border border-default bg-panel p-4">
                  <label className="block text-sm text-secondary">
                    Bio
                    <textarea
                      value={localPrivateState.profileDraft.bio ?? ''}
                      onChange={(event) => updateProfileDraft({ bio: event.target.value })}
                      className="mt-2 min-h-[112px] w-full rounded-2xl border border-default bg-surface px-3 py-3 text-sm text-primary outline-none focus-border-strong"
                    />
                  </label>
                  <label className="block text-sm text-secondary">
                    Primary link
                    <Input
                      className="mt-2"
                      value={linkDraft}
                      onChange={(event) => setLinkDraft(event.target.value)}
                      onBlur={() =>
                        updateProfileDraft({ links: linkDraft ? [{ type: 'website', value: linkDraft }] : [] })
                      }
                    />
                  </label>
                  <label className="block text-sm text-secondary">
                    Contact policy
                    <select
                      className="mt-2 h-10 w-full rounded-2xl border border-default bg-surface px-3 text-sm text-primary outline-none"
                      value={localPrivateState.profileDraft.defaultContactPolicy}
                      onChange={(event) =>
                        updateProfileDraft({
                          defaultContactPolicy: event.target.value as 'paid' | 'open' | 'closed',
                        })
                      }
                    >
                      <option value="paid">paid</option>
                      <option value="open">open</option>
                      <option value="closed">closed</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="accent" onClick={publishProfile}>
                  <PencilLine className="h-4 w-4" />
                  Publish profile
                </Button>
                {!currentIdentity ? (
                  <Button variant="outline" onClick={registerIdentity} disabled={!activeWalletAccount}>
                    Register Root Identity
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}

          {meSection === 'identity' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Identity & account</p>
                  <h2 className="mt-2 text-2xl font-semibold text-primary">
                    {currentIdentity?.identityId ?? 'Not registered yet'}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge label={`Registration: ${chainState.registrationState}`} variant="default" />
                  {currentIdentity ? <Badge label={currentIdentity.status} variant="accent" /> : null}
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-3xl border border-default bg-panel p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Wallet</p>
                  <p className="mt-3 text-sm text-secondary">
                    {activeWalletAccount?.address ?? 'Connect or import a wallet first.'}
                  </p>
                  <p className="mt-3 text-sm text-secondary">
                    Identity is anchored to the active signer address and stores only minimal pointers on-chain.
                  </p>
                </div>
                <div className="rounded-3xl border border-default bg-panel p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Pointers summary</p>
                  <div className="mt-3 space-y-2 text-sm text-secondary">
                    <p>Profile: {currentIdentity?.activeProfileRef ?? 'unset'}</p>
                    <p>Agent registry: {currentIdentity?.activeAgentRegistryRef ?? 'unset'}</p>
                    <p>Auth registry: {currentIdentity?.activeAuthRegistryRef ?? 'unset'}</p>
                    <p>Relation policy: {currentIdentity?.activeRelationPolicyRef ?? 'unset'}</p>
                  </div>
                </div>
              </div>

              <Button variant="accent" onClick={registerIdentity} disabled={!activeWalletAccount || Boolean(currentIdentity)}>
                Register identity
              </Button>
            </>
          ) : null}

          {meSection === 'preferences' ? (
            <div className="rounded-3xl border border-default bg-panel p-4">
              <h2 className="text-2xl font-semibold text-primary">Preferences</h2>
              <p className="mt-3 text-sm text-secondary">
                Local UI state is kept private. Current MVP stores notification center state, agent filters,
                and your unpublished profile/agent drafts locally.
              </p>
            </div>
          ) : null}

          {meSection === 'security' ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-3xl border border-default bg-panel p-4">
                <h2 className="text-xl font-semibold text-primary">Backup status</h2>
                <p className="mt-3 text-sm text-secondary">
                  {activeWalletAccount?.backedUp
                    ? 'Current signer is backed up or imported from a recoverable source.'
                    : 'Current signer is not backed up yet. Test wallets are unsafe for production.'}
                </p>
              </div>
              <div className="rounded-3xl border border-default bg-panel p-4">
                <h2 className="text-xl font-semibold text-primary">Key summary</h2>
                <p className="mt-3 text-sm text-secondary">
                  Owner wallet: {activeWalletAccount?.address ?? 'No active signer'}
                </p>
              </div>
            </div>
          ) : null}

          {meSection === 'about' ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-3xl border border-default bg-panel p-4">
                <h2 className="text-xl font-semibold text-primary">Environment</h2>
                <div className="mt-3 space-y-2 text-sm text-secondary">
                  <p>Network: {config.networkName}</p>
                  <p>RPC endpoint: {config.chainEndpoint}</p>
                  <p>Gateway endpoint: {config.gatewayEndpoint}</p>
                  <p>App version: {config.appVersion}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-default bg-panel p-4">
                <h2 className="text-xl font-semibold text-primary">MVP summary</h2>
                <div className="mt-3 space-y-2 text-sm text-secondary">
                  <p>Public identities: {Object.keys(chainState.identitiesById).length}</p>
                  <p>Public agents: {publicAgents.length}</p>
                  <p>Local agents: {localPrivateState.agentsLocal.length}</p>
                  <p>Notifications: {localPrivateState.notifications.length}</p>
                </div>
              </div>
            </div>
          ) : null}

          <Divider variant="full" />
        </div>
      </MainPanel>
    </>
  )
}
