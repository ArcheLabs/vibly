import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppRouter } from '@/router/AppRouter'
import { AppStateContext, type AppStateContextValue } from '@/lib/app-context'
import {
  agents,
  currentUser,
  featuredAgents,
  identities,
  initialContacts,
  initialContactRequests,
  initialConversations,
  initialMessagesByConversation,
  users,
  walletRecords,
  walletSummary,
} from '@/mock'
import { makeId } from '@/lib/utils'
import { useI18n } from '@/i18n'
import { formatTimeByLocale } from '@/i18n/format'
import type {
  Contact,
  AppPage,
  ContactsSection,
  Conversation,
  ConversationFilter,
  DiscoverSection,
  MeSection,
  Message,
  ProfileOverlay,
  WalletSection,
} from '@/types'

const pageFromPath = (pathname: string): AppPage => {
  if (pathname.startsWith('/agents')) return 'agents'
  if (pathname.startsWith('/discover')) return 'discover'
  if (pathname.startsWith('/contacts')) return 'contacts'
  if (pathname.startsWith('/wallet')) return 'wallet'
  if (pathname.startsWith('/me')) return 'me'
  return 'chat'
}

function moveConversationToFront(items: Conversation[], conversationId: string) {
  const target = items.find((item) => item.id === conversationId)
  if (!target) return items
  return [target, ...items.filter((item) => item.id !== conversationId)]
}

const conversationFilterOrder: ConversationFilter[] = ['human', 'agent', 'all']

function getNextConversationFilter(filter: ConversationFilter): ConversationFilter {
  const currentIndex = conversationFilterOrder.indexOf(filter)
  return conversationFilterOrder[(currentIndex + 1) % conversationFilterOrder.length] ?? 'human'
}

export default function App() {
  const { locale, t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  )
  const [chatConversationFilter, setChatConversationFilter] = useState<ConversationFilter>('all')
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>(
    initialMessagesByConversation,
  )
  const [conversationIdentityMap, setConversationIdentityMap] = useState<Record<string, string>>(
    Object.fromEntries(
      initialConversations.map((conversation) => [conversation.id, currentUser.defaultIdentityId]),
    ),
  )
  const [overlay, setOverlay] = useState<ProfileOverlay>(null)
  const [discoverSection, setDiscoverSection] = useState<DiscoverSection>('featured')
  const [selectedFeaturedAgentId, setSelectedFeaturedAgentId] = useState<string | null>(
    featuredAgents[0]?.id ?? null,
  )
  const [agentsSelectedId, setAgentsSelectedId] = useState<string | null>('a_research_assistant')
  const [contactsSection, setContactsSection] = useState<ContactsSection>('contacts')
  const [contacts] = useState(initialContacts)
  const [contactRequests, setContactRequests] = useState<Contact[]>(initialContactRequests)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    initialContacts[0]?.id ?? null,
  )
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    initialContactRequests[0]?.id ?? null,
  )
  const [walletSection, setWalletSection] = useState<WalletSection>('overview')
  const [selectedWalletRecordId, setSelectedWalletRecordId] = useState<string | null>(
    walletRecords[0]?.id ?? null,
  )
  const [meSection, setMeSection] = useState<MeSection>('profile')

  const currentPage = pageFromPath(location.pathname)

  function selectConversation(conversationId: string | null) {
    setSelectedConversationId(conversationId)
    if (!conversationId) return
    setConversations((items) =>
      items.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    )
  }

  function ensureAgentConversation(agentId: string) {
    const existingConversation = conversations.find((conversation) => conversation.agentId === agentId)
    if (existingConversation) {
      selectConversation(existingConversation.id)
      navigate('/chat')
      return
    }

    const agent = agents.find((item) => item.id === agentId)
    const owner = agent ? users.find((user) => user.id === agent.ownerUserId) : null
    if (!agent || !owner) return

    const newConversation: Conversation = {
      id: makeId('c_agent'),
      targetType: 'agent',
      humanId: owner.id,
      humanName: owner.name,
      title: `${owner.name} / ${agent.name}`,
      subtitle: t('chat.noMessages'),
      updatedAt: formatTimeByLocale(new Date(), locale),
      unreadCount: 0,
      state: 'empty',
      agentId: agent.id,
      agentName: agent.name,
    }

    setConversations((items) => [newConversation, ...items])
    setConversationIdentityMap((items) => ({
      ...items,
      [newConversation.id]: currentUser.defaultIdentityId,
    }))
    setSelectedConversationId(newConversation.id)
    navigate('/chat')
  }

  function ensureUserConversation(userId: string) {
    const existingConversation = conversations.find(
      (conversation) => conversation.targetType === 'human' && conversation.humanId === userId,
    )
    if (existingConversation) {
      selectConversation(existingConversation.id)
      navigate('/chat')
      return
    }

    const user = users.find((item) => item.id === userId)
    if (!user) return

    const newConversation: Conversation = {
      id: makeId('c_user'),
      targetType: 'human',
      humanId: user.id,
      humanName: user.name,
      title: user.name,
      subtitle: t('chat.noMessages'),
      updatedAt: formatTimeByLocale(new Date(), locale),
      unreadCount: 0,
      state: 'empty',
    }

    setConversations((items) => [newConversation, ...items])
    setConversationIdentityMap((items) => ({
      ...items,
      [newConversation.id]: currentUser.defaultIdentityId,
    }))
    setSelectedConversationId(newConversation.id)
    navigate('/chat')
  }

  function switchIdentity(conversationId: string, identityId: string) {
    const identity = identities.find((item) => item.id === identityId)
    if (!identity) return

    setConversationIdentityMap((items) => ({ ...items, [conversationId]: identityId }))
    setConversationMessages((items) => ({
      ...items,
      [conversationId]: [
        ...(items[conversationId] ?? []),
        {
          id: makeId('m_system'),
          conversationId,
          type: 'system',
          text: t('chat.systemIdentitySwitched', { value: identity.name }),
          time: formatTimeByLocale(new Date(), locale),
        },
      ],
    }))
    setConversations((items) =>
      moveConversationToFront(
        items.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                subtitle: t('chat.systemIdentitySwitched', { value: identity.name }),
                updatedAt: formatTimeByLocale(new Date(), locale),
              }
            : conversation,
        ),
        conversationId,
      ),
    )
  }

  function createConversationSession(conversationId: string) {
    const sourceConversation = conversations.find((conversation) => conversation.id === conversationId)
    if (!sourceConversation) return

    const nextConversation: Conversation = {
      ...sourceConversation,
      id: makeId('c_session'),
      subtitle: t('chat.noMessages'),
      updatedAt: formatTimeByLocale(new Date(), locale),
      unreadCount: 0,
      state: 'empty',
    }

    setConversations((items) => [nextConversation, ...items])
    setConversationMessages((items) => ({ ...items, [nextConversation.id]: [] }))
    setConversationIdentityMap((items) => ({
      ...items,
      [nextConversation.id]: currentUser.defaultIdentityId,
    }))
    setSelectedConversationId(nextConversation.id)
    navigate('/chat')
  }

  function sendMessage(conversationId: string, text: string) {
    const content = text.trim()
    if (!content) return

    const identityId = conversationIdentityMap[conversationId] ?? currentUser.defaultIdentityId
    const identity = identities.find((item) => item.id === identityId)
    const sentAt = formatTimeByLocale(new Date(), locale)

    setConversationMessages((items) => ({
      ...items,
      [conversationId]: [
        ...(items[conversationId] ?? []),
        {
          id: makeId('m_text'),
          conversationId,
          type: 'text',
          senderSide: 'me',
          senderIdentityId: identityId,
          senderName: identity?.name ?? currentUser.name,
          text: content,
          time: sentAt,
        },
      ],
    }))
    setConversations((items) =>
      moveConversationToFront(
        items.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                subtitle: content,
                updatedAt: sentAt,
                unreadCount: 0,
                state: conversation.state === 'empty' ? 'normal' : conversation.state,
              }
            : conversation,
        ),
        conversationId,
      ),
    )
  }

  const value: AppStateContextValue = {
    currentPage,
    conversations,
    selectedConversationId,
    chatConversationFilter,
    conversationMessages,
    conversationIdentityMap,
    identities,
    users,
    agents,
    contacts,
    contactRequests,
    featuredAgentIds: featuredAgents.map((agent) => agent.id),
    discoverSection,
    selectedFeaturedAgentId,
    agentsSelectedId,
    contactsSection,
    selectedContactId,
    selectedRequestId,
    walletSection,
    selectedWalletRecordId,
    walletSummary,
    walletRecords,
    meSection,
    overlay,
    selectConversation,
    setChatConversationFilter,
    cycleChatConversationFilter: () =>
      setChatConversationFilter((filter) => getNextConversationFilter(filter)),
    createConversationSession,
    switchIdentity,
    sendMessage,
    openUserProfile: (userId) => setOverlay({ type: 'user', id: userId }),
    openAgentProfile: (agentId) => setOverlay({ type: 'agent', id: agentId }),
    closeOverlay: () => setOverlay(null),
    startChatWithAgent: ensureAgentConversation,
    startChatWithUser: ensureUserConversation,
    setDiscoverSection,
    setSelectedFeaturedAgentId,
    setAgentsSelectedId,
    setContactsSection,
    setSelectedContactId,
    setSelectedRequestId,
    updateRequestStatus: (requestId, status) =>
      setContactRequests((items) =>
        items.map((request) => (request.id === requestId ? { ...request, status } : request)),
      ),
    setWalletSection,
    setSelectedWalletRecordId,
    setMeSection,
  }

  return (
    <AppStateContext.Provider value={value}>
      <AppRouter />
    </AppStateContext.Provider>
  )
}
