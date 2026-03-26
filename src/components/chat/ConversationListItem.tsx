import { BellOff, ChevronRight } from 'lucide-react'
import { CompositeAvatar } from '@/components/common/CompositeAvatar'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types'

type ConversationListItemProps = {
  item: Conversation
  active: boolean
  onClick: () => void
}

export function ConversationListItem({ item, active, onClick }: ConversationListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-[26px] border p-3 text-left transition',
        active
          ? 'border-stone-900 bg-stone-900 text-white shadow-panel'
          : 'border-transparent bg-white/80 hover:border-stone-200 hover:bg-white',
      )}
    >
      <CompositeAvatar humanLabel={item.humanName} agentLabel={item.agentName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.title}</p>
            <p
              className={cn(
                'mt-1 truncate text-xs',
                active ? 'text-white/70' : 'text-stone-500',
              )}
            >
              {item.subtitle}
            </p>
          </div>
          <div className={cn('shrink-0 text-[11px]', active ? 'text-white/70' : 'text-stone-400')}>
            {item.updatedAt}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            {item.muted ? <BellOff className="h-3.5 w-3.5" /> : null}
            <span className={active ? 'text-white/60' : 'text-stone-500'}>
              {item.state === 'restricted'
                ? '受限会话'
                : item.state === 'paused'
                  ? '已暂停'
                  : item.state === 'empty'
                    ? '暂无记录'
                    : '可继续交流'}
            </span>
          </div>
          {item.unreadCount > 0 ? (
            <span className="rounded-full bg-coral px-2 py-1 text-white">{item.unreadCount}</span>
          ) : (
            <ChevronRight className={cn('h-3.5 w-3.5', active ? 'text-white/60' : 'text-stone-300')} />
          )}
        </div>
      </div>
    </button>
  )
}
