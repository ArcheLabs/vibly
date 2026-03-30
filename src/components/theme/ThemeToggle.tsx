import { LaptopMinimal, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const options: Array<{ key: ThemeMode; label: string; icon: typeof Sun }> = [
  { key: 'light', label: '亮色', icon: Sun },
  { key: 'dark', label: '暗色', icon: Moon },
  { key: 'system', label: '跟随', icon: LaptopMinimal },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-[11px] text-muted">主题</p>
      <div className="flex items-center gap-1 rounded-md border border-default bg-surface p-1">
        {options.map((option) => {
          const Icon = option.icon
          const active = theme === option.key

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setTheme(option.key)}
              className={cn(
                'inline-flex flex-1 items-center justify-center gap-1 rounded-sm px-2 py-1 text-xs transition',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-secondary hover-bg-muted',
              )}
              aria-label={`切换到${option.label}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
