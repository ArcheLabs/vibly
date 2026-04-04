import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { makeId } from '@/lib/utils'
import { appConfig } from '@/modules/config/env'
import type {
  AuthRegistryV1,
  ContentEnvelope,
  ContentKind,
  PublicAgentRegistryV1,
  PublicProfileV1,
} from '@/modules/content/schemas'
import { createDefaultMvpState } from '@/modules/mvp/defaults'
import { loadPersistedMvpState, savePersistedMvpState } from '@/modules/mvp/storage'
import type {
  DerivedUiState,
  PersistedMvpState,
  PublicAgentView,
  PublicIdentityView,
} from '@/modules/mvp/types'
import {
  createNotification,
  deriveGlobalBanners,
  markAllNotificationsRead,
  markNotificationRead,
  pushNotification,
  removeNotification,
} from '@/modules/notifications/store'
import type { LocalRelation, RelationStatus } from '@/modules/relations/types'
import type { PublicProfileDraft } from '@/modules/profile/types'
import type { AgentListFilter, AgentRecord } from '@/modules/agents/types'
import type { WalletAccount } from '@/modules/wallet/types'

type MvpContextValue = PersistedMvpState &
  DerivedUiState & {
    config: typeof appConfig
    connectExtensionWallet: () => void
    importWallet: (source: 'seed' | 'json' | 'qr') => void
    createTestWallet: () => void
    selectWalletAccount: (accountId: string) => void
    updateProfileDraft: (patch: Partial<PublicProfileDraft>) => void
    registerIdentity: () => void
    publishProfile: () => void
    createAgent: () => void
    selectLocalAgent: (agentId: string) => void
    setAgentFilter: (filter: AgentListFilter) => void
    updateAgent: (agentId: string, patch: Partial<AgentRecord>) => void
    deleteAgent: (agentId: string) => void
    publishAgent: (agentId: string) => void
    setRelationStatus: (
      actorId: string,
      status: RelationStatus,
      patch?: Partial<LocalRelation>,
    ) => void
    removeRelation: (actorId: string) => void
    selectDiscoveryIdentity: (identityId: string) => void
    toggleNotificationCenter: () => void
    markNotificationAsRead: (notificationId: string) => void
    markAllNotificationsAsRead: () => void
    dismissNotification: (notificationId: string) => void
    dismissBanner: (bannerId: string) => void
    getRelation: (actorId: string) => LocalRelation | null
    getPublicIdentityView: (identityId: string) => PublicIdentityView | null
  }

const MvpContext = createContext<MvpContextValue | null>(null)

function simpleHash(input: string) {
  let hash = 0

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }

  return hash.toString(16).padStart(8, '0')
}

function createContentEnvelope<T>(
  kind: ContentKind,
  value: T,
  createdAt = Date.now(),
): ContentEnvelope<T> {
  const raw = JSON.stringify(value)
  const hash = simpleHash(raw)

  return {
    ref: `content://${kind}/${createdAt}-${hash}`,
    kind,
    hash,
    createdAt,
    value,
  }
}

function getPublishedProfile(
  contentsByRef: PersistedMvpState['publicContentState']['contentsByRef'],
  ref?: string | null,
) {
  if (!ref) return null
  const envelope = contentsByRef[ref]
  return (envelope?.value ?? null) as PublicProfileV1 | null
}

function getPublishedRegistry(
  contentsByRef: PersistedMvpState['publicContentState']['contentsByRef'],
  ref?: string | null,
) {
  if (!ref) return null
  const envelope = contentsByRef[ref]
  return (envelope?.value ?? null) as PublicAgentRegistryV1 | null
}

function derivePublicIdentities(state: PersistedMvpState): PublicIdentityView[] {
  return Object.values(state.chainState.identitiesById).map((summary) => {
    const profile = getPublishedProfile(state.publicContentState.contentsByRef, summary.activeProfileRef)
    const registry = getPublishedRegistry(
      state.publicContentState.contentsByRef,
      summary.activeAgentRegistryRef,
    )

    return {
      identityId: summary.identityId,
      summary,
      profile,
      publicAgents: registry?.agents ?? [],
    }
  })
}

function derivePublicAgents(publicIdentities: PublicIdentityView[]): PublicAgentView[] {
  return publicIdentities.flatMap((identity) =>
    identity.publicAgents.map((agent) => ({
      ...agent,
      ownerIdentityId: identity.identityId,
    })),
  )
}

function createWalletAccount(source: WalletAccount['source']): WalletAccount {
  const suffix = Math.random().toString(36).slice(2, 8)
  const labelMap: Record<WalletAccount['source'], string> = {
    extension: 'Extension',
    seed: 'Seed import',
    json: 'JSON import',
    qr: 'QR signer',
    test: 'Test wallet',
  }

  return {
    id: makeId('wallet'),
    source,
    name: `${labelMap[source]} ${suffix.toUpperCase()}`,
    address: `5F${suffix}ViblyLocal${suffix.toUpperCase()}`,
    publicKeyHex: `0x${suffix.repeat(10).slice(0, 32)}`,
    isTestWallet: source === 'test',
    isReadOnly: source === 'qr',
    balance: source === 'test' ? 120 : 24,
    gasBalance: source === 'test' ? 9 : 1.8,
    backedUp: source !== 'test',
    network: appConfig.networkName,
  }
}

function createIdentityId(address: string) {
  return `identity_${address.slice(-10).toLowerCase()}`
}

function buildProfileDocument(
  draft: PublicProfileDraft,
  identityId: string,
  publicAgentCount: number,
): PublicProfileV1 {
  return {
    version: 1,
    identity_id: identityId,
    updated_at: Date.now(),
    display_name: draft.displayName,
    username: draft.username,
    avatar_ref: draft.avatarRef ?? null,
    bio: draft.bio,
    headline: draft.headline,
    links: draft.links,
    public_agent_count: publicAgentCount,
    default_contact_policy: draft.defaultContactPolicy,
  }
}

function buildPublicRegistry(identityId: string, agentsLocal: AgentRecord[]): PublicAgentRegistryV1 {
  return {
    version: 1,
    owner_identity: identityId,
    updated_at: Date.now(),
    agents: agentsLocal
      .filter((agent) => agent.visibility === 'public')
      .map((agent) => ({
        agent_id: agent.agentId,
        visibility: 'public' as const,
        status: agent.status,
        name: agent.name,
        avatar_ref: agent.avatarRef ?? null,
        bio: agent.bio ?? '',
        description_ref: null,
        capabilities: agent.capabilities,
        pricing_ref: agent.pricingRef ?? null,
        auth_hint_ref: agent.authHintRef ?? null,
      })),
  }
}

function buildAuthRegistry(identityId: string, agentsLocal: AgentRecord[]): AuthRegistryV1 {
  return {
    version: 1,
    owner_identity: identityId,
    rules: agentsLocal
      .filter((agent) => agent.visibility === 'public')
      .map((agent) => ({
        agent_id: agent.agentId,
        can_request_payment: agent.pricingMode !== 'free',
        can_use_delegated_budget: false,
        allowed_action_codes: [1],
        max_amount_per_tx: agent.pricingMode === 'free' ? '0' : '1',
        max_amount_per_day: agent.pricingMode === 'free' ? '0' : '5',
        allowed_payees: [identityId],
      })),
  }
}

function getNextAgentPublishState(existing: AgentRecord, patch: Partial<AgentRecord>) {
  const nextVisibility = patch.visibility ?? existing.visibility
  const editingContent = Object.keys(patch).some((key) => key !== 'updatedAt' && key !== 'lastPublishedAt')

  if (nextVisibility === 'public') {
    if (existing.publishState === 'private_local') return 'public_draft'
    if (existing.publishState === 'public_live' && editingContent) return 'public_dirty'
    return existing.publishState
  }

  if (existing.publishState === 'public_live') return 'public_dirty'
  return 'private_local'
}

export function MvpProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedMvpState>(() => loadPersistedMvpState() ?? createDefaultMvpState())

  useEffect(() => {
    savePersistedMvpState(state)
  }, [state])

  const derived = useMemo<DerivedUiState>(() => {
    const activeWalletAccount =
      state.localPrivateState.wallet.accounts.find(
        (account) => account.id === state.localPrivateState.wallet.activeAccountId,
      ) ?? null
    const currentIdentity = state.chainState.currentIdentityId
      ? state.chainState.identitiesById[state.chainState.currentIdentityId] ?? null
      : null
    const publicProfile = getPublishedProfile(
      state.publicContentState.contentsByRef,
      currentIdentity?.activeProfileRef,
    )
    const publicIdentities = derivePublicIdentities(state)
    const publicAgents = derivePublicAgents(publicIdentities)
    const selectedLocalAgent =
      state.localPrivateState.agentsLocal.find(
        (agent) => agent.agentId === state.uiState.selectedLocalAgentId,
      ) ??
      state.localPrivateState.agentsLocal[0] ??
      null
    const selectedDiscoveryIdentity =
      publicIdentities.find((identity) => identity.identityId === state.uiState.selectedDiscoveryIdentityId) ??
      publicIdentities[0] ??
      null
    const filteredLocalAgents = state.localPrivateState.agentsLocal.filter((agent) => {
      if (state.uiState.agentFilter === 'all') return true
      if (state.uiState.agentFilter === 'private') return agent.visibility === 'private'
      if (state.uiState.agentFilter === 'public') {
        return agent.publishState === 'public_live'
      }
      return ['public_draft', 'public_dirty', 'publishing'].includes(agent.publishState)
    })
    const unsupportedNetwork = Boolean(
      activeWalletAccount && activeWalletAccount.network !== appConfig.networkName,
    )
    const insufficientGas = Boolean(activeWalletAccount && activeWalletAccount.gasBalance < 0.2)
    const dismissedBannerIds = state.uiState.dismissedBannerIds ?? []
    const banners = deriveGlobalBanners({
      activeAccount: activeWalletAccount,
      identityRegistered: Boolean(currentIdentity),
      unsupportedNetwork,
      insufficientGas,
      pendingProfilePublish: ['dirty', 'draft', 'publishing'].includes(
        state.localPrivateState.profilePublishState,
      ),
      localAgents: state.localPrivateState.agentsLocal,
    }).filter((banner) => !dismissedBannerIds.includes(banner.id))

    return {
      activeWalletAccount,
      currentIdentity,
      publicProfile,
      publicIdentities,
      publicAgents,
      selectedLocalAgent,
      selectedDiscoveryIdentity,
      filteredLocalAgents,
      banners,
      unreadNotificationCount: state.localPrivateState.notifications.filter((item) => !item.read).length,
      insufficientGas,
      unsupportedNetwork,
    }
  }, [state])

  const value = useMemo<MvpContextValue>(() => {
    const getPublicIdentityView = (identityId: string) =>
      derived.publicIdentities.find((identity) => identity.identityId === identityId) ?? null

    return {
      ...state,
      ...derived,
      config: appConfig,
      connectExtensionWallet: () => {
        const account = createWalletAccount('extension')
        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            wallet: {
              accounts: [account, ...current.localPrivateState.wallet.accounts],
              activeAccountId: account.id,
              status: 'account_selected',
            },
            notifications: pushNotification(
              current.localPrivateState.notifications,
              createNotification({
                type: 'success',
                category: 'wallet',
                title: 'Wallet connected',
                message: `${account.name} is now the active signer.`,
              }),
            ),
          },
        }))
      },
      importWallet: (source) => {
        const account = createWalletAccount(source)
        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            wallet: {
              accounts: [account, ...current.localPrivateState.wallet.accounts],
              activeAccountId: account.id,
              status: 'account_selected',
            },
            notifications: pushNotification(
              current.localPrivateState.notifications,
              createNotification({
                type: 'success',
                category: 'wallet',
                title: 'Wallet imported',
                message: `${account.name} was added to the local account list.`,
              }),
            ),
          },
        }))
      },
      createTestWallet: () => {
        const account = createWalletAccount('test')
        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            wallet: {
              accounts: [account, ...current.localPrivateState.wallet.accounts],
              activeAccountId: account.id,
              status: 'account_selected',
            },
            notifications: pushNotification(
              current.localPrivateState.notifications,
              createNotification({
                type: 'warning',
                category: 'wallet',
                title: 'Test wallet created',
                message: 'Use this signer only for localnet demos and unsafe flows.',
              }),
            ),
          },
        }))
      },
      selectWalletAccount: (accountId) => {
        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            wallet: {
              ...current.localPrivateState.wallet,
              activeAccountId: accountId,
              status: 'account_selected',
            },
          },
        }))
      },
      updateProfileDraft: (patch) => {
        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            profileDraft: {
              ...current.localPrivateState.profileDraft,
              ...patch,
            },
            profilePublishState:
              current.localPrivateState.profilePublishState === 'published'
                ? 'dirty'
                : current.localPrivateState.profilePublishState,
          },
        }))
      },
      registerIdentity: () => {
        if (!derived.activeWalletAccount || derived.currentIdentity) return

        const identityId = createIdentityId(derived.activeWalletAccount.address)
        const profileDocument = buildProfileDocument(state.localPrivateState.profileDraft, identityId, 0)
        const profileEnvelope = createContentEnvelope('profile', profileDocument)
        const registryEnvelope = createContentEnvelope('agent-registry', {
          version: 1,
          owner_identity: identityId,
          updated_at: Date.now(),
          agents: [],
        } satisfies PublicAgentRegistryV1)

        setState((current) => ({
          chainState: {
            currentIdentityId: identityId,
            registrationState: 'registered',
            identitiesById: {
              ...current.chainState.identitiesById,
              [identityId]: {
                identityId,
                ownerAddress: derived.activeWalletAccount!.address,
                status: 'active',
                activeProfileRef: profileEnvelope.ref,
                activeAgentRegistryRef: registryEnvelope.ref,
                activeAuthRegistryRef: null,
                activeRelationPolicyRef: null,
              },
            },
          },
          publicContentState: {
            contentsByRef: {
              ...current.publicContentState.contentsByRef,
              [profileEnvelope.ref]: profileEnvelope,
              [registryEnvelope.ref]: registryEnvelope,
            },
          },
          localPrivateState: {
            ...current.localPrivateState,
            profileDraft: {
              ...current.localPrivateState.profileDraft,
              identityId,
            },
            profilePublishState: 'published',
            profileLastPublishedAt: Date.now(),
            agentsLocal: current.localPrivateState.agentsLocal.map((agent) => ({
              ...agent,
              ownerIdentityId: identityId,
            })),
            notifications: pushNotification(
              current.localPrivateState.notifications,
              createNotification({
                type: 'success',
                category: 'identity',
                title: 'Identity registered',
                message: `${identityId} is now the canonical Root Identity for the active signer.`,
              }),
            ),
          },
          uiState: {
            ...current.uiState,
            selectedDiscoveryIdentityId: identityId,
          },
        }))
      },
      publishProfile: () => {
        if (!derived.currentIdentity) return

        const profileDocument = buildProfileDocument(
          state.localPrivateState.profileDraft,
          derived.currentIdentity.identityId,
          state.localPrivateState.agentsLocal.filter((agent) => agent.visibility === 'public').length,
        )
        const profileEnvelope = createContentEnvelope('profile', profileDocument)

        setState((current) => ({
          ...current,
          chainState: {
            ...current.chainState,
            identitiesById: {
              ...current.chainState.identitiesById,
              [derived.currentIdentity!.identityId]: {
                ...current.chainState.identitiesById[derived.currentIdentity!.identityId],
                activeProfileRef: profileEnvelope.ref,
              },
            },
          },
          publicContentState: {
            contentsByRef: {
              ...current.publicContentState.contentsByRef,
              [profileEnvelope.ref]: profileEnvelope,
            },
          },
          localPrivateState: {
            ...current.localPrivateState,
            profilePublishState: 'published',
            profileLastPublishedAt: Date.now(),
            notifications: pushNotification(
              current.localPrivateState.notifications,
              createNotification({
                type: 'success',
                category: 'profile',
                title: 'Profile published',
                message: `Active profile pointer now targets ${profileEnvelope.ref}.`,
              }),
            ),
          },
        }))
      },
      createAgent: () => {
        const agent: AgentRecord = {
          agentId: makeId('agent'),
          ownerIdentityId: derived.currentIdentity?.identityId,
          name: 'New Agent',
          bio: 'Describe what this agent does before you publish it.',
          description: '',
          visibility: 'private',
          publishState: 'private_local',
          status: 'active',
          capabilities: ['assistant'],
          pricingMode: 'free',
          updatedAt: Date.now(),
          lastPublishedAt: null,
        }

        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            agentsLocal: [agent, ...current.localPrivateState.agentsLocal],
            notifications: pushNotification(
              current.localPrivateState.notifications,
              createNotification({
                type: 'info',
                category: 'agent',
                title: 'Local private agent created',
                message: 'The agent is stored locally and has not been published.',
              }),
            ),
          },
          uiState: {
            ...current.uiState,
            selectedLocalAgentId: agent.agentId,
          },
        }))
      },
      selectLocalAgent: (agentId) => {
        setState((current) => ({
          ...current,
          uiState: {
            ...current.uiState,
            selectedLocalAgentId: agentId,
          },
        }))
      },
      setAgentFilter: (filter) => {
        setState((current) => ({
          ...current,
          uiState: {
            ...current.uiState,
            agentFilter: filter,
          },
        }))
      },
      updateAgent: (agentId, patch) => {
        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            agentsLocal: current.localPrivateState.agentsLocal.map((agent) =>
              agent.agentId === agentId
                ? {
                    ...agent,
                    ...patch,
                    publishState: getNextAgentPublishState(agent, patch),
                    updatedAt: Date.now(),
                  }
                : agent,
            ),
          },
        }))
      },
      deleteAgent: (agentId) => {
        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            agentsLocal: current.localPrivateState.agentsLocal.filter((agent) => agent.agentId !== agentId),
          },
          uiState: {
            ...current.uiState,
            selectedLocalAgentId:
              current.uiState.selectedLocalAgentId === agentId
                ? current.localPrivateState.agentsLocal.find((agent) => agent.agentId !== agentId)?.agentId ?? null
                : current.uiState.selectedLocalAgentId,
          },
        }))
      },
      publishAgent: (agentId) => {
        if (!derived.currentIdentity) return

        const target = state.localPrivateState.agentsLocal.find((agent) => agent.agentId === agentId)
        if (!target) return

        const publishedAgents = state.localPrivateState.agentsLocal.map((agent) =>
          agent.agentId === agentId ? { ...agent, publishState: 'publishing' as const } : agent,
        )
        const registry = buildPublicRegistry(derived.currentIdentity.identityId, publishedAgents)
        const authRegistry = buildAuthRegistry(derived.currentIdentity.identityId, publishedAgents)
        const registryEnvelope = createContentEnvelope('agent-registry', registry)
        const authEnvelope = createContentEnvelope('auth-registry', authRegistry)

        setState((current) => ({
          ...current,
          chainState: {
            ...current.chainState,
            identitiesById: {
              ...current.chainState.identitiesById,
              [derived.currentIdentity!.identityId]: {
                ...current.chainState.identitiesById[derived.currentIdentity!.identityId],
                activeAgentRegistryRef: registryEnvelope.ref,
                activeAuthRegistryRef: authEnvelope.ref,
              },
            },
          },
          publicContentState: {
            contentsByRef: {
              ...current.publicContentState.contentsByRef,
              [registryEnvelope.ref]: registryEnvelope,
              [authEnvelope.ref]: authEnvelope,
            },
          },
          localPrivateState: {
            ...current.localPrivateState,
            agentsLocal: current.localPrivateState.agentsLocal.map((agent) => {
              if (agent.visibility === 'public') {
                return {
                  ...agent,
                  ownerIdentityId: derived.currentIdentity!.identityId,
                  publishState: 'public_live',
                  lastPublishedAt: Date.now(),
                  updatedAt: Date.now(),
                }
              }

              return {
                ...agent,
                ownerIdentityId: derived.currentIdentity!.identityId,
                publishState: 'private_local',
                updatedAt: Date.now(),
              }
            }),
            notifications: pushNotification(
              current.localPrivateState.notifications,
              createNotification({
                type: 'success',
                category: 'agent',
                title:
                  target.publishState === 'public_live' || target.publishState === 'public_dirty'
                    ? 'Agent republished'
                    : 'Agent published',
                message: `Active agent registry pointer now targets ${registryEnvelope.ref}.`,
              }),
            ),
          },
        }))
      },
      setRelationStatus: (actorId, status, patch) => {
        setState((current) => {
          const existing = current.localPrivateState.relations[actorId]
          const createdAt = existing?.createdAt ?? Date.now()
          const next: LocalRelation = {
            actorId,
            status,
            createdAt,
            updatedAt: Date.now(),
            nickname: existing?.nickname,
            note: existing?.note,
            allowFreeContact: existing?.allowFreeContact,
            allowFreeAgentAccess: existing?.allowFreeAgentAccess,
            defaultPricingOverride: existing?.defaultPricingOverride ?? null,
            tags: existing?.tags ?? [],
            ...patch,
          }

          return {
            ...current,
            localPrivateState: {
              ...current.localPrivateState,
              relations: {
                ...current.localPrivateState.relations,
                [actorId]: next,
              },
            },
          }
        })
      },
      removeRelation: (actorId) => {
        setState((current) => {
          const nextRelations = { ...current.localPrivateState.relations }
          delete nextRelations[actorId]

          return {
            ...current,
            localPrivateState: {
              ...current.localPrivateState,
              relations: nextRelations,
            },
          }
        })
      },
      selectDiscoveryIdentity: (identityId) => {
        setState((current) => ({
          ...current,
          uiState: {
            ...current.uiState,
            selectedDiscoveryIdentityId: identityId,
          },
        }))
      },
      toggleNotificationCenter: () => {
        setState((current) => ({
          ...current,
          uiState: {
            ...current.uiState,
            notificationCenterOpen: !current.uiState.notificationCenterOpen,
          },
        }))
      },
      markNotificationAsRead: (notificationId) => {
        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            notifications: markNotificationRead(current.localPrivateState.notifications, notificationId),
          },
        }))
      },
      markAllNotificationsAsRead: () => {
        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            notifications: markAllNotificationsRead(current.localPrivateState.notifications),
          },
        }))
      },
      dismissNotification: (notificationId) => {
        setState((current) => ({
          ...current,
          localPrivateState: {
            ...current.localPrivateState,
            notifications: removeNotification(current.localPrivateState.notifications, notificationId),
          },
        }))
      },
      dismissBanner: (bannerId) => {
        setState((current) => ({
          ...current,
          uiState: (current.uiState.dismissedBannerIds ?? []).includes(bannerId)
            ? current.uiState
            : {
                ...current.uiState,
                dismissedBannerIds: [...(current.uiState.dismissedBannerIds ?? []), bannerId],
              },
        }))
      },
      getRelation: (actorId) => state.localPrivateState.relations[actorId] ?? null,
      getPublicIdentityView,
    }
  }, [derived, state])

  return <MvpContext.Provider value={value}>{children}</MvpContext.Provider>
}

export function useMvpApp() {
  const context = useContext(MvpContext)

  if (!context) {
    throw new Error('useMvpApp must be used within MvpProvider')
  }

  return context
}
