export type AppPage = 'chat' | 'agents' | 'discover' | 'contacts' | 'wallet' | 'me'

export type CurrentUser = {
  id: string
  name: string
  avatar?: string
  bio: string
  mainAddress: string
  defaultIdentityId: string
}

export type Identity = {
  id: string
  kind: 'human' | 'agent'
  name: string
  avatar?: string
  description?: string
}

export type User = {
  id: string
  name: string
  avatar?: string
  bio: string
  mainAddress: string
  relationship: 'self' | 'contact' | 'request' | 'public'
  publicAgentIds: string[]
}

export type Agent = {
  id: string
  name: string
  avatar?: string
  ownerUserId: string
  ownerName: string
  bio: string
  tags: string[]
  status: 'active' | 'paused' | 'draft'
  visibility: 'public' | 'contacts' | 'private'
  pricingMode: 'free' | 'paid' | 'invite-only'
  priceHint?: string
}

export type Conversation = {
  id: string
  targetType: 'human' | 'agent'
  humanId: string
  humanName: string
  humanAvatar?: string
  agentId?: string
  agentName?: string
  agentAvatar?: string
  title: string
  subtitle: string
  updatedAt: string
  unreadCount: number
  muted?: boolean
  state: 'normal' | 'empty' | 'restricted' | 'paused'
}

export type ConversationFilter = 'all' | 'agent' | 'human'

export type Message = {
  id: string
  conversationId: string
  type: 'text' | 'system' | 'notice'
  senderSide?: 'me' | 'other'
  senderIdentityId?: string
  senderName?: string
  senderAvatar?: string
  text: string
  time: string
}

export type Contact = {
  id: string
  kind: 'human' | 'agent' | 'request'
  name: string
  avatar?: string
  bio: string
  ownerName?: string
  requestNote?: string
  status?: 'pending' | 'accepted' | 'rejected'
}

export type FeaturedAgent = {
  id: string
  rank: number
  reason: string
}

export type WalletSummary = {
  balance: string
  income30d: string
  expense30d: string
}

export type WalletRecord = {
  id: string
  type: 'income' | 'expense'
  title: string
  amount: string
  time: string
  remark: string
  relatedTo?: string
}

export type DiscoverSection = 'featured' | 'plugins'
export type ContactsSection = 'contacts' | 'requests'
export type WalletSection = 'overview' | 'income' | 'expense'
export type MeSection = 'profile' | 'identity' | 'preferences' | 'security' | 'about'

export type ProfileOverlay =
  | { type: 'user'; id: string }
  | { type: 'agent'; id: string }
  | null
