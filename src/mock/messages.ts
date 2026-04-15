import type { Message } from '@/types'

const mockMessages: Message[] = [
  {
    id: 'm1',
    conversationId: 'c_linz_human',
    type: 'text',
    senderSide: 'other',
    senderName: 'Linz',
    text: 'Would a three-column home layout be the safest first pass?',
    time: '09:12',
  },
  {
    id: 'm2',
    conversationId: 'c_linz_human',
    type: 'text',
    senderSide: 'me',
    senderIdentityId: 'id_me_human',
    senderName: 'Vibly User',
    text: 'I would rather make the chat flow solid first, then add discovery and contacts.',
    time: '09:14',
  },
  {
    id: 'm3',
    conversationId: 'c_linz_human',
    type: 'system',
    text: 'You switched to the "Research Assistant" identity.',
    time: '09:20',
  },
  {
    id: 'm4',
    conversationId: 'c_linz_human',
    type: 'text',
    senderSide: 'me',
    senderIdentityId: 'id_research_assistant',
    senderName: 'Research Assistant',
    text: 'For a static preview, we can start with public detail pages as side panels.',
    time: '09:21',
  },
  {
    id: 'm5',
    conversationId: 'c_linz_lobster',
    type: 'notice',
    text: 'This agent is in paid mode. This session is estimated to cost 1 VER.',
    time: 'Yesterday',
  },
  {
    id: 'm6',
    conversationId: 'c_linz_lobster',
    type: 'text',
    senderSide: 'other',
    senderName: 'Lobster Claw',
    text: 'Welcome in. Bring a little energy before we start.',
    time: 'Yesterday',
  },
  {
    id: 'm7',
    conversationId: 'c_ying_archivist',
    type: 'notice',
    text: 'This agent is paused and cannot receive messages right now.',
    time: 'Mon',
  },
]

export const initialMessagesByConversation = mockMessages.reduce<Record<string, Message[]>>(
  (accumulator, message) => {
    accumulator[message.conversationId] ??= []
    accumulator[message.conversationId].push(message)
    return accumulator
  },
  {},
)
