export interface IdentitySummary {
  identityId: string
  ownerAddress: string
  status: 'active' | 'frozen' | 'disabled'
  activeProfileRef?: string | null
  activeAgentRegistryRef?: string | null
  activeAuthRegistryRef?: string | null
  activeRelationPolicyRef?: string | null
}

export type IdentityRegistrationState =
  | 'not_registered'
  | 'registering_profile_upload'
  | 'registering_chain_tx'
  | 'registered'
  | 'frozen'
  | 'error'

export interface ChainState {
  currentIdentityId: string | null
  identitiesById: Record<string, IdentitySummary>
  registrationState: IdentityRegistrationState
}

