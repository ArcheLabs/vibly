import humanLinzAvatar from '@/assets/avatars/humans/human-linz.png'
import humanYingAvatar from '@/assets/avatars/humans/human-ying.png'
import type { User } from '@/types'

export const users: User[] = [
  {
    id: 'u_me',
    name: 'Vibly User',
    avatar: '',
    bio: 'Building a local Vibly preview.',
    mainAddress: '5F3sa2TJ...Vibly',
    relationship: 'self',
    publicAgentIds: ['a_research_assistant', 'a_chain_helper'],
  },
  {
    id: 'u_linz',
    name: 'Linz',
    avatar: humanLinzAvatar,
    bio: 'Explores product structure and social protocol UX.',
    mainAddress: '8Qm2sa7L...Linz',
    relationship: 'contact',
    publicAgentIds: ['a_claw_lobster'],
  },
  {
    id: 'u_ying',
    name: 'Ying',
    avatar: humanYingAvatar,
    bio: 'Experiments with long-term memory and knowledge archiving.',
    mainAddress: '7Di1no2C...Ying',
    relationship: 'public',
    publicAgentIds: ['a_archivist'],
  },
  {
    id: 'u_nova',
    name: 'Nova',
    avatar: '',
    bio: 'Explores lighter collaboration between people and agents.',
    mainAddress: '4Xc1rt8M...Nova',
    relationship: 'request',
    publicAgentIds: ['a_nova_guide'],
  },
]
