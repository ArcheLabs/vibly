import { Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useI18n } from '@/i18n'
import { navItems } from '@/lib/nav'
import { cn } from '@/lib/utils'
import type { AppPage } from '@/types'

type SideNavProps = {
  activePage: AppPage
  onSelect: (page: AppPage) => void
}

export function SideNav({ activePage, onSelect }: SideNavProps) {
  const { t } = useI18n()

  return (
    <nav className="flex h-full w-[76px] shrink-0 flex-col items-center gap-4 border-r border-default bg-panel px-2 py-4">
      <div className="flex aspect-square h-12 items-center justify-center rounded-full bg-secondary text-secondary">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="mt-2 flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.key === activePage

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
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
      <div className="w-full pb-1">
        <ThemeToggle />
      </div>
    </nav>
  )
}
