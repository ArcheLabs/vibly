import type { Message } from '@/types'

const mockMessages: Message[] = [
  {
    id: 'm1',
    conversationId: 'c_linz_human',
    type: 'text',
    senderSide: 'other',
    senderName: '林舟',
    text: '你觉得首页第一版先做三栏会不会更稳？',
    time: '09:12',
  },
  {
    id: 'm2',
    conversationId: 'c_linz_human',
    type: 'text',
    senderSide: 'me',
    senderIdentityId: 'id_me_human',
    senderName: 'libingjiang',
    text: '我倾向于先把聊天主流程做透，再补发现和联系人。',
    time: '09:14',
  },
  {
    id: 'm3',
    conversationId: 'c_linz_human',
    type: 'system',
    text: '你已切换为 “Research Assistant” 身份。',
    time: '09:20',
  },
  {
    id: 'm4',
    conversationId: 'c_linz_human',
    type: 'text',
    senderSide: 'me',
    senderIdentityId: 'id_research_assistant',
    senderName: 'Research Assistant',
    text: '如果先做静态预览，我们可以把公共详情页先做成侧板。',
    time: '09:21',
  },
  {
    id: 'm5',
    conversationId: 'c_linz_lobster',
    type: 'notice',
    text: '当前智能体为收费模式，本轮交流预计消耗 1 VER。',
    time: '昨天',
  },
  {
    id: 'm6',
    conversationId: 'c_linz_lobster',
    type: 'text',
    senderSide: 'other',
    senderName: 'Lobster Claw',
    text: '欢迎来和我聊天，不过别忘了先准备一点电力。',
    time: '昨天',
  },
  {
    id: 'm7',
    conversationId: 'c_ying_archivist',
    type: 'notice',
    text: '该智能体当前暂停服务，暂时无法继续发送消息。',
    time: '周一',
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
