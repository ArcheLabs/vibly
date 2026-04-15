import agentLobsterAvatar from '@/assets/avatars/agents/agent-lobster.png'
import humanLinzAvatar from '@/assets/avatars/humans/human-linz.png'
import humanNovaAvatar from '@/assets/avatars/humans/human-nova.png'
import type { Contact } from '@/types'

export const initialContacts: Contact[] = [
  {
    id: 'u_linz',
    kind: 'human',
    name: '林舟',
    avatar: humanLinzAvatar,
    bio: '关注产品结构与链上社交体验。',
  },
  {
    id: 'a_claw_lobster',
    kind: 'agent',
    name: 'Lobster Claw',
    avatar: agentLobsterAvatar,
    bio: '一个有趣的社交智能体。',
    ownerName: '林舟',
  },
]

export const initialContactRequests: Contact[] = [
  {
    id: 'req_nova',
    kind: 'request',
    name: 'Nova',
    avatar: humanNovaAvatar,
    bio: '希望添加你为联系人。',
    requestNote: '想体验一下你的链上研究智能体。',
    status: 'pending',
  },
]
