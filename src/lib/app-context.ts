import { createContext, useContext } from 'react'
import type {
  Agent,
  AppPage,
  Contact,
  ContactsSection,
  Conversation,
  DiscoverSection,
  Identity,
  MeSection,
  Message,
  ProfileOverlay,
  User,
  WalletRecord,
  WalletSection,
  WalletSummary,
} from '@/types'

export type AppStateContextValue = {
  currentPage: AppPage
  conversations: Conversation[]
  selectedConversationId: string | null
  conversationMessages: Record<string, Message[]>
  conversationIdentityMap: Record<string, string>
  identities: Identity[]
  users: User[]
  agents: Agent[]
  contacts: Contact[]
  contactRequests: Contact[]
  featuredAgentIds: string[]
  discoverSection: DiscoverSection
  selectedFeaturedAgentId: string | null
  agentsSelectedId: string | null
  contactsSection: ContactsSection
  selectedContactId: string | null
  selectedRequestId: string | null
  walletSection: WalletSection
  selectedWalletRecordId: string | null
  walletSummary: WalletSummary
  walletRecords: WalletRecord[]
  meSection: MeSection
  overlay: ProfileOverlay
  selectConversation: (conversationId: string | null) => void
  switchIdentity: (conversationId: string, identityId: string) => void
  sendMessage: (conversationId: string, text: string) => void
  openUserProfile: (userId: string) => void
  openAgentProfile: (agentId: string) => void
  closeOverlay: () => void
  startChatWithAgent: (agentId: string) => void
  startChatWithUser: (userId: string) => void
  setDiscoverSection: (section: DiscoverSection) => void
  setSelectedFeaturedAgentId: (agentId: string | null) => void
  setAgentsSelectedId: (agentId: string | null) => void
  setContactsSection: (section: ContactsSection) => void
  setSelectedContactId: (contactId: string | null) => void
  setSelectedRequestId: (requestId: string | null) => void
  updateRequestStatus: (requestId: string, status: 'accepted' | 'rejected') => void
  setWalletSection: (section: WalletSection) => void
  setSelectedWalletRecordId: (recordId: string | null) => void
  setMeSection: (section: MeSection) => void
}

export const AppStateContext = createContext<AppStateContextValue | null>(null)

export function useAppContext() {
  const context = useContext(AppStateContext)

  if (!context) {
    throw new Error('useAppContext must be used within AppStateContext.Provider')
  }

  return context
}
