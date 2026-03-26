import { Avatar } from '@/components/common/Avatar'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'

type MessageBubbleProps = {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isMe = message.senderSide === 'me'

  return (
    <div className={cn('flex gap-3', isMe ? 'justify-end' : 'justify-start')}>
      {!isMe ? (
        <Avatar label={message.senderName ?? 'U'} size="sm" tone="human" />
      ) : null}
      <div className={cn('max-w-[70%]', isMe && 'order-first')}>
        <p className={cn('mb-1 text-xs', isMe ? 'text-right text-stone-500' : 'text-stone-500')}>
          {message.senderName}
        </p>
        <div
          className={cn(
            'rounded-[24px] px-4 py-3 text-sm shadow-sm',
            isMe
              ? 'rounded-br-md bg-stone-900 text-white'
              : 'rounded-bl-md bg-white text-ink',
          )}
        >
          {message.text}
        </div>
        <p className={cn('mt-1 text-xs text-stone-400', isMe ? 'text-right' : 'text-left')}>
          {message.time}
        </p>
      </div>
      {isMe ? <Avatar label={message.senderName ?? 'Me'} size="sm" tone="agent" /> : null}
    </div>
  )
}
