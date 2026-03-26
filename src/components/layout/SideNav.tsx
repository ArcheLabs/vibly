import { Sparkles } from 'lucide-react'
import { navItems } from '@/lib/nav'
import { cn } from '@/lib/utils'
import type { AppPage } from '@/types'

type SideNavProps = {
  activePage: AppPage
  onSelect: (page: AppPage) => void
}

export function SideNav({ activePage, onSelect }: SideNavProps) {
  return (
    <nav className="glass flex w-[84px] shrink-0 flex-col items-center gap-4 border-r border-white/60 px-3 py-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white shadow-panel">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.key === activePage

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={cn(
                'group flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-xs font-medium transition',
                active
                  ? 'bg-white text-ink shadow-panel'
                  : 'text-stone-500 hover:bg-white/70 hover:text-ink',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-coral')} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
