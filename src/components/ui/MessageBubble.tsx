import { cn } from '@/lib/utils'

type MessageBubbleProps = {
  text: string
  time: string
  isMe: boolean
}

export function MessageBubble({ text, time, isMe }: MessageBubbleProps) {
  return (
    <div className={cn('group flex', isMe ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-md border border-default px-3 py-2 text-sm',
            isMe ? 'bg-muted text-primary' : 'bg-surface text-primary',
          )}
        >
          {text}
        </div>
        <p className="mt-1 text-[11px] text-muted opacity-0 transition group-hover:opacity-100">{time}</p>
      </div>
    </div>
  )
}
