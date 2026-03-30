import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type SidebarItemProps = {
  title: string
  subtitle: string
  time: string
  active?: boolean
  unreadCount?: number
  leading?: ReactNode
  onClick: () => void
}

export function SidebarItem({
  title,
  subtitle,
  time,
  active,
  unreadCount,
  leading,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-default px-3 py-3 text-left transition',
        active ? 'bg-muted' : 'bg-surface hover-bg-muted',
      )}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-medium text-primary">{title}</p>
          <span className="shrink-0 text-[11px] text-muted">{time}</span>
        </div>
        <p className="mt-1 truncate text-xs text-muted">{subtitle}</p>
      </div>
      {unreadCount && unreadCount > 0 ? (
        <span className="rounded-sm border border-accent bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground">
          {unreadCount}
        </span>
      ) : (
        <ChevronRight className="h-4 w-4 text-muted" />
      )}
    </button>
  )
}
