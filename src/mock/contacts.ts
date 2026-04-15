import agentLobsterAvatar from '@/assets/avatars/agents/agent-lobster.png'
import humanLinzAvatar from '@/assets/avatars/humans/human-linz.png'
import humanNovaAvatar from '@/assets/avatars/humans/human-nova.png'
import type { Contact } from '@/types'

export const initialContacts: Contact[] = [
  {
    id: 'u_linz',
    kind: 'human',
    name: 'Linz',
    avatar: humanLinzAvatar,
    bio: 'Explores product structure and social protocol UX.',
  },
  {
    id: 'a_claw_lobster',
    kind: 'agent',
    name: 'Lobster Claw',
    avatar: agentLobsterAvatar,
    bio: 'A playful social agent for lightweight conversations.',
    ownerName: 'Linz',
  },
]

export const initialContactRequests: Contact[] = [
  {
    id: 'req_nova',
    kind: 'request',
    name: 'Nova',
    avatar: humanNovaAvatar,
    bio: 'Wants to add you as a contact.',
    requestNote: 'Interested in trying your on-chain research agent.',
    status: 'pending',
  },
]
