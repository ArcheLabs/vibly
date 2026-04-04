export interface PublicProfileDraft {
  version: 1
  identityId?: string
  displayName: string
  username?: string
  avatarRef?: string | null
  bio?: string
  headline?: string
  links: Array<{ type: string; value: string }>
  defaultContactPolicy: 'paid' | 'open' | 'closed'
}

export type ProfilePublishState = 'draft' | 'publishing' | 'published' | 'dirty' | 'error'

