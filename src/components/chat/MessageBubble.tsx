import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'

type MessageBubbleProps = {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isMe = message.senderSide === 'me'
  const senderName = message.senderName ?? (isMe ? '我' : '对方')

  return (
    <div className={cn('group flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
      {!isMe ? <Avatar label={senderName} size="sm" tone="human" /> : null}
      <div className={cn('max-w-[75%]', isMe ? 'order-first items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm',
            isMe ? 'bg-muted text-primary' : 'bg-surface text-primary',
          )}
        >
          {message.text}
        </div>
        <p className="mt-1 text-[11px] text-muted opacity-0 transition group-hover:opacity-100">{message.time}</p>
      </div>
      {isMe ? <Avatar label={senderName} size="sm" tone="agent" /> : null}
    </div>
  )
}
