import { cn } from '@/lib/utils'

type BadgeProps = {
  label: string
  variant?: 'default' | 'human' | 'agent' | 'success' | 'warning' | 'muted'
}

const variantClassMap: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-white/80 text-ink',
  human: 'bg-sky/80 text-ink',
  agent: 'bg-pine/10 text-pine',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  muted: 'bg-stone-200/80 text-stone-600',
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]',
        variantClassMap[variant],
      )}
    >
      {label}
    </span>
  )
}
