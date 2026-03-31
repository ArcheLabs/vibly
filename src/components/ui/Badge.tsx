import { cn } from '@/lib/utils'

type BadgeProps = {
  label: string
  variant?: 'default' | 'warning' | 'muted' | 'accent'
}

const variantClassMap: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'border border-default bg-surface text-secondary',
  warning: 'border border-default bg-muted text-secondary',
  muted: 'border border-default bg-muted text-muted',
  accent: 'border border-accent bg-accent text-accent-foreground',
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-2 text-[11px]', variantClassMap[variant])}>
      {label}
    </span>
  )
}
