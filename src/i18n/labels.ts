import type { Agent, Contact, Conversation, User } from '@/types'

type Translate = (key: string, params?: Record<string, string | number>) => string

export function getAgentStatusLabel(status: Agent['status'], t: Translate) {
  return t(`status.agent.${status}`)
}

export function getConversationStateLabel(state: Exclude<Conversation['state'], 'normal' | 'empty'>, t: Translate) {
  return t(`status.conversation.${state}`)
}

export function getVisibilityLabel(visibility: Agent['visibility'], t: Translate) {
  return t(`status.visibility.${visibility}`)
}

export function getPricingLabel(pricingMode: Agent['pricingMode'], t: Translate) {
  return t(`status.pricing.${pricingMode}`)
}

export function getRelationshipLabel(relationship: User['relationship'], t: Translate) {
  return t(`status.relationship.${relationship}`)
}

export function getRequestStatusLabel(status: NonNullable<Contact['status']>, t: Translate) {
  return t(`status.request.${status}`)
}
