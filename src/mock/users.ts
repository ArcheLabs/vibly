import type { User } from '@/types'

export const users: User[] = [
  {
    id: 'u_me',
    name: 'libingjiang',
    avatar: '',
    bio: 'Building Vibly for the AI era.',
    mainAddress: '5F3sa2TJ...Vibly',
    relationship: 'self',
    publicAgentIds: ['a_research_assistant', 'a_chain_helper'],
  },
  {
    id: 'u_linz',
    name: '林舟',
    avatar: '',
    bio: '关注产品结构与链上社交体验。',
    mainAddress: '8Qm2sa7L...Linz',
    relationship: 'contact',
    publicAgentIds: ['a_claw_lobster'],
  },
  {
    id: 'u_ying',
    name: '应秋',
    avatar: '',
    bio: '做长期记忆和知识归档的产品实验。',
    mainAddress: '7Di1no2C...Ying',
    relationship: 'public',
    publicAgentIds: ['a_archivist'],
  },
  {
    id: 'u_nova',
    name: 'Nova',
    avatar: '',
    bio: '探索人类与智能体之间更轻的协作方式。',
    mainAddress: '4Xc1rt8M...Nova',
    relationship: 'request',
    publicAgentIds: ['a_nova_guide'],
  },
]
