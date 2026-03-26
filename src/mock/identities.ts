import type { Identity } from '@/types'

export const identities: Identity[] = [
  {
    id: 'id_me_human',
    kind: 'human',
    name: 'libingjiang',
    avatar: '',
    description: '真人身份',
  },
  {
    id: 'id_research_assistant',
    kind: 'agent',
    name: 'Research Assistant',
    avatar: '',
    description: '负责研究与资料整理',
  },
  {
    id: 'id_chain_helper',
    kind: 'agent',
    name: 'Chain Helper',
    avatar: '',
    description: '负责链上与协议说明',
  },
]
