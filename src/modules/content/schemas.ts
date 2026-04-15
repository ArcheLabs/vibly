export type ContentKind = 'profile' | 'agent-registry' | 'auth-registry' | 'relation-policy'

export type ContentRef = string

export interface ContentEnvelope<T = unknown> {
  ref: ContentRef
  kind: ContentKind
  hash: string
  createdAt: number
  value: T
}

export interface PublicProfileV1 {
  version: 1
  identity_id: string
  updated_at: number
  display_name: string
  username?: string
  avatar_ref?: string | null
  bio?: string
  headline?: string
  links: Array<{ type: string; value: string }>
  public_agent_count: number
  default_contact_policy: 'paid' | 'open' | 'closed'
}

export interface PublicAgentEntryV1 {
  agent_id: string
  visibility: 'public'
  status: 'active' | 'paused'
  name: string
  avatar_ref?: string | null
  bio: string
  description_ref?: string | null
  capabilities: string[]
  pricing_ref?: string | null
  auth_hint_ref?: string | null
}

export interface PublicAgentRegistryV1 {
  version: 1
  owner_identity: string
  updated_at: number
  agents: PublicAgentEntryV1[]
}

export interface AuthRegistryRuleV1 {
  agent_id: string
  can_request_payment: boolean
  can_use_delegated_budget: boolean
  allowed_action_codes: number[]
  max_amount_per_tx: string
  max_amount_per_day: string
  allowed_payees: string[]
}

export interface AuthRegistryV1 {
  version: 1
  owner_identity: string
  rules: AuthRegistryRuleV1[]
}

export interface RelationPolicyV1 {
  version: 1
  default_stranger_policy: 'paid' | 'open' | 'closed'
  friend_free: boolean
  blocked_behavior: 'reject' | 'ignore'
}

