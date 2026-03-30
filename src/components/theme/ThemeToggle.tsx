import { useRef, useState } from 'react'
import { Check, LaptopMinimal, Moon, Sun } from 'lucide-react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const options: Array<{ key: ThemeMode; label: string; icon: typeof Sun }> = [
  { key: 'light', label: '亮色', icon: Sun },
  { key: 'dark', label: '暗色', icon: Moon },
  { key: 'system', label: '跟随', icon: LaptopMinimal },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false))

  const CurrentIcon = options.find((option) => option.key === theme)?.icon ?? LaptopMinimal

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary transition hover-bg-muted"
        aria-label="切换主题"
      >
        <CurrentIcon className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute bottom-0 left-[calc(100%+8px)] z-20 w-[132px] rounded-2xl border border-default bg-surface p-1.5">
          {options.map((option) => {
            const Icon = option.icon
            const active = theme === option.key

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setTheme(option.key)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-sm',
                  active ? 'bg-muted text-primary' : 'text-secondary hover-bg-muted',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{option.label}</span>
                {active ? <Check className="h-3.5 w-3.5" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
