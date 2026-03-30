import { Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { navItems } from '@/lib/nav'
import { cn } from '@/lib/utils'
import type { AppPage } from '@/types'

type SideNavProps = {
  activePage: AppPage
  onSelect: (page: AppPage) => void
}

export function SideNav({ activePage, onSelect }: SideNavProps) {
  return (
    <nav className="flex w-[78px] shrink-0 flex-col items-center gap-4 border-r border-default bg-panel px-2 py-4 lg:w-[86px]">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Sparkles className="h-5 w-5" />
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
                'group flex w-full flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-medium transition',
                active
                  ? 'border border-default bg-surface text-primary'
                  : 'text-muted hover-bg-muted hover-text-primary',
              )}
            >
              <Icon className={cn('h-4 w-4', active && 'text-accent')} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className="w-full">
        <ThemeToggle />
      </div>
    </nav>
  )
}
