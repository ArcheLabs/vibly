import { Bell, CheckCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/modules/notifications/types'

type NotificationCenterProps = {
  open: boolean
  notifications: AppNotification[]
  unreadCount: number
  onToggle: () => void
  onMarkRead: (notificationId: string) => void
  onMarkAllRead: () => void
  onDismiss: (notificationId: string) => void
  className?: string
  panelClassName?: string
  buttonClassName?: string
}

const categoryToneMap: Record<AppNotification['type'], string> = {
  info: 'text-sky-200',
  success: 'text-emerald-200',
  warning: 'text-amber-200',
  error: 'text-rose-200',
}

export function NotificationCenter({
  open,
  notifications,
  unreadCount,
  onToggle,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  className,
  panelClassName,
  buttonClassName,
}: NotificationCenterProps) {
  return (
    <div className={cn('relative z-50', className)}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-default bg-panel text-secondary transition hover-bg-muted',
          buttonClassName,
        )}
        aria-label="Toggle notification center"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            'mt-3 w-[320px] rounded-3xl border border-default bg-panel p-3 shadow-2xl',
            panelClassName,
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-default pb-3">
            <div>
              <p className="text-sm font-semibold text-primary">Notification Center</p>
              <p className="text-xs text-muted">Identity, publish, and wallet events.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={onMarkAllRead}>
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
              <IconButton aria-label="Close notification center" onClick={onToggle}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-default px-4 py-6 text-center text-sm text-muted">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => onMarkRead(notification.id)}
                  className={cn(
                    'w-full rounded-2xl border px-3 py-3 text-left transition',
                    notification.read ? 'border-default bg-surface' : 'border-accent/40 bg-muted',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className={cn('text-sm font-medium', categoryToneMap[notification.type])}>
                        {notification.title}
                      </p>
                      {notification.message ? (
                        <p className="mt-1 text-xs text-secondary">{notification.message}</p>
                      ) : null}
                    </div>
                    <div className="flex items-start gap-2">
                      {!notification.read ? (
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" />
                      ) : null}
                      <IconButton
                        className="h-7 w-7 shrink-0"
                        aria-label="Dismiss notification"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDismiss(notification.id)
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
