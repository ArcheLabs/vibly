import { MessageBubble } from './MessageBubble'
import { NoticeCard } from './NoticeCard'
import { SystemMessage } from './SystemMessage'
import type { Conversation, Message } from '@/types'

type MessageListProps = {
  conversation: Conversation
  messages: Message[]
}

export function MessageList({ conversation, messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-secondary">暂无聊天记录</div>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        if (message.type === 'system') {
          return <SystemMessage key={message.id} text={message.text} />
        }

        if (message.type === 'notice') {
          return (
            <NoticeCard
              key={message.id}
              title={
                conversation.state === 'paused'
                  ? '智能体暂停服务'
                  : conversation.state === 'restricted'
                    ? '当前会话受限'
                    : '系统提示'
              }
              description={message.text}
            />
          )
        }

        return <MessageBubble key={message.id} message={message} />
      })}
    </div>
  )
}
