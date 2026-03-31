import { MessageBubble } from './MessageBubble'
import { NoticeCard } from './NoticeCard'
import { SystemMessage } from './SystemMessage'
import { useI18n } from '@/i18n'
import type { Conversation, Message } from '@/types'

type MessageListProps = {
  conversation: Conversation
  messages: Message[]
}

export function MessageList({ conversation, messages }: MessageListProps) {
  const { t } = useI18n()

  if (messages.length === 0) {
    return <div className="py-12 text-center text-sm text-secondary">{t('chat.noMessages')}</div>
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
                  ? t('chat.noticePaused')
                  : conversation.state === 'restricted'
                    ? t('chat.noticeRestricted')
                    : t('chat.noticeSystem')
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
