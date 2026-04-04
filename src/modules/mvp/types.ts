import type { AgentListFilter, AgentRecord } from '@/modules/agents/types'
import type { ContentEnvelope, PublicAgentEntryV1, PublicProfileV1 } from '@/modules/content/schemas'
import type { ChainState, IdentitySummary } from '@/modules/identity/types'
import type { AppNotification, GlobalBanner } from '@/modules/notifications/types'
import type { PublicProfileDraft, ProfilePublishState } from '@/modules/profile/types'
import type { LocalRelation } from '@/modules/relations/types'
import type { WalletAccount, WalletState } from '@/modules/wallet/types'

export interface PublicIdentityView {
  identityId: string
  summary: IdentitySummary
  profile: PublicProfileV1 | null
  publicAgents: PublicAgentEntryV1[]
}

export interface PublicAgentView extends PublicAgentEntryV1 {
  ownerIdentityId: string
}

export interface PublicContentState {
  contentsByRef: Record<string, ContentEnvelope>
}

export interface LocalPrivateState {
  wallet: WalletState
  profileDraft: PublicProfileDraft
  profilePublishState: ProfilePublishState
  profileLastPublishedAt: number | null
  agentsLocal: AgentRecord[]
  relations: Record<string, LocalRelation>
  notifications: AppNotification[]
}

export interface UiState {
  agentFilter: AgentListFilter
  selectedLocalAgentId: string | null
  selectedDiscoveryIdentityId: string | null
  notificationCenterOpen: boolean
  dismissedBannerIds: string[]
}

export interface PersistedMvpState {
  chainState: ChainState
  publicContentState: PublicContentState
  localPrivateState: LocalPrivateState
  uiState: UiState
}

export interface DerivedUiState {
  activeWalletAccount: WalletAccount | null
  currentIdentity: IdentitySummary | null
  publicProfile: PublicProfileV1 | null
  publicIdentities: PublicIdentityView[]
  publicAgents: PublicAgentView[]
  selectedLocalAgent: AgentRecord | null
  selectedDiscoveryIdentity: PublicIdentityView | null
  filteredLocalAgents: AgentRecord[]
  banners: GlobalBanner[]
  unreadNotificationCount: number
  insufficientGas: boolean
  unsupportedNetwork: boolean
}
