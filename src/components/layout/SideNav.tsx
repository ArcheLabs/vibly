import { Sparkles } from 'lucide-react'
import { NotificationCenter } from '@/components/system/NotificationCenter'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useI18n } from '@/i18n'
import { navItems } from '@/lib/nav'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/modules/notifications/types'
import type { AppPage } from '@/types'

type SideNavProps = {
  activePage: AppPage
  onSelect: (page: AppPage, isActive: boolean) => void
  notifications: AppNotification[]
  unreadNotificationCount: number
  notificationCenterOpen: boolean
  onToggleNotificationCenter: () => void
  onMarkNotificationRead: (notificationId: string) => void
  onMarkAllNotificationsRead: () => void
  onDismissNotification: (notificationId: string) => void
}

export function SideNav({
  activePage,
  onSelect,
  notifications,
  unreadNotificationCount,
  notificationCenterOpen,
  onToggleNotificationCenter,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onDismissNotification,
}: SideNavProps) {
  const { t } = useI18n()

  return (
    <nav className="flex h-screen w-[76px] shrink-0 flex-col items-center border-r border-default bg-panel px-2 py-4">
      <div className="flex aspect-square h-12 items-center justify-center rounded-full bg-secondary text-secondary">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="mt-6 flex w-full flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.key === activePage

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key, active)}
              className={cn(
                'group flex w-full items-center justify-center rounded-full px-2 py-2.5 transition',
                active
                  ? 'border border-default bg-muted text-primary'
                  : 'text-muted hover-bg-muted hover-text-primary',
              )}
              aria-label={t(item.labelKey)}
            >
              <Icon className={cn('h-5 w-5', active && 'text-accent')} />
            </button>
          )
        })}
      </div>
      <div className="flex w-full flex-col items-center gap-3 pb-1">
        <NotificationCenter
          open={notificationCenterOpen}
          notifications={notifications}
          unreadCount={unreadNotificationCount}
          onToggle={onToggleNotificationCenter}
          onMarkRead={onMarkNotificationRead}
          onMarkAllRead={onMarkAllNotificationsRead}
          onDismiss={onDismissNotification}
          className="flex w-full justify-center"
          panelClassName="absolute bottom-0 left-[calc(100%+12px)] mt-0"
          buttonClassName="bg-surface"
        />
        <ThemeToggle />
      </div>
    </nav>
  )
}
