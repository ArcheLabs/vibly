import { Avatar } from '@/components/ui/Avatar'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'

type MessageBubbleProps = {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { t } = useI18n()
  const isMe = message.senderSide === 'me'
  const senderName = message.senderName ?? (isMe ? t('common.me') : t('common.other'))

  return (
    <div className={cn('group flex items-start gap-2', isMe ? 'justify-end' : 'justify-start')}>
      {!isMe ? <Avatar label={senderName} size="sm" tone="human" /> : null}
      <div className={cn('flex max-w-[75%] flex-col', isMe ? 'order-first items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm shadow-sm',
            isMe
              ? 'bg-accent text-accent-foreground'
              : 'border border-default bg-surface text-primary',
          )}
        >
          {message.text}
        </div>
        <p className="mt-1 text-[11px] text-muted opacity-0 transition group-hover:opacity-100">{message.time}</p>
      </div>
      {isMe ? <Avatar label={senderName} size="sm" tone="human" /> : null}
    </div>
  )
}
