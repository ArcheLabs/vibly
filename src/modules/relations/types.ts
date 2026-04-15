export type RelationStatus =
  | 'none'
  | 'contact'
  | 'favorite'
  | 'blocked'
  | 'muted'
  | 'archived'

export interface LocalRelation {
  actorId: string
  status: RelationStatus
  nickname?: string
  note?: string
  allowFreeContact?: boolean
  allowFreeAgentAccess?: boolean
  defaultPricingOverride?: string | null
  tags?: string[]
  createdAt: number
  updatedAt: number
}

export interface RelationStore {
  get(actorId: string): Promise<LocalRelation | null>
  set(actorId: string, patch: Partial<LocalRelation>): Promise<void>
  remove(actorId: string): Promise<void>
  list(): Promise<LocalRelation[]>
}

export interface RelationPolicyResolver {
  isFreeContact(actorId: string): Promise<boolean>
  isBlocked(actorId: string): Promise<boolean>
  getPricingOverride(actorId: string): Promise<string | null>
}

