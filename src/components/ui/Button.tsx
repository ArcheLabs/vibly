import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'outline' | 'muted' | 'accent' | 'ghost'
  size?: 'sm' | 'md'
}

const variantClassMap: Record<NonNullable<ButtonProps['variant']>, string> = {
  outline: 'border border-default bg-surface text-primary hover-bg-muted',
  muted: 'border border-default bg-muted text-secondary hover-border-strong',
  accent: 'border border-accent bg-accent text-accent-foreground hover-opacity-90',
  ghost: 'border border-transparent bg-transparent text-secondary hover-bg-muted',
}

const sizeClassMap: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
}

export function Button({
  className,
  variant = 'outline',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variantClassMap[variant],
        sizeClassMap[size],
        className,
      )}
      {...props}
    />
  )
}
