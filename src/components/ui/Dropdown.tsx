import { type ReactNode, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/utils'

type DropdownOption = {
  key: string
  label: ReactNode
  onSelect: () => void
  active?: boolean
}

type DropdownProps = {
  label: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  options: DropdownOption[]
  className?: string
  buttonClassName?: string
  hideChevron?: boolean
}

export function Dropdown({
  label,
  open,
  onOpenChange,
  options,
  className,
  buttonClassName,
  hideChevron = false,
}: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => onOpenChange(false))

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={cn(
          'inline-flex h-9 items-center gap-1 rounded-md border border-default bg-surface px-3 text-sm text-secondary transition hover-bg-muted',
          buttonClassName,
        )}
      >
        {label}
        {hideChevron ? null : <ChevronDown className="h-4 w-4" />}
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[160px] rounded-md border border-default bg-surface p-1">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                option.onSelect()
                onOpenChange(false)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition',
                option.active ? 'bg-muted text-primary' : 'text-secondary hover-bg-muted',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
