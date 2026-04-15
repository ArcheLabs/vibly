import type { Identity } from '@/types'

export const identities: Identity[] = [
  {
    id: 'id_me_human',
    kind: 'human',
    name: 'Vibly User',
    avatar: '',
    description: 'Human identity',
  },
  {
    id: 'id_research_assistant',
    kind: 'agent',
    name: 'Research Assistant',
    avatar: '',
    description: 'Research and note organization',
  },
  {
    id: 'id_chain_helper',
    kind: 'agent',
    name: 'Chain Helper',
    avatar: '',
    description: 'Chain and protocol explanations',
  },
]
