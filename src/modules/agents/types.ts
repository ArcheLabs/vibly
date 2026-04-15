export interface AgentRecord {
  agentId: string
  ownerIdentityId?: string
  name: string
  avatarRef?: string | null
  bio?: string
  description?: string
  visibility: 'private' | 'public'
  publishState:
    | 'private_local'
    | 'public_draft'
    | 'publishing'
    | 'public_live'
    | 'public_dirty'
  status: 'active' | 'paused'
  capabilities: string[]
  pricingMode: 'free' | 'per_message' | 'per_session'
  pricingRef?: string | null
  authHintRef?: string | null
  updatedAt: number
  lastPublishedAt?: number | null
}

export type AgentListFilter = 'all' | 'private' | 'public' | 'draft'

