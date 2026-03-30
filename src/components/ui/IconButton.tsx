import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
}

export function IconButton({ className, active, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-default bg-surface text-secondary transition hover-bg-muted hover-text-primary disabled:cursor-not-allowed disabled:opacity-60',
        active && 'border-accent text-accent',
        className,
      )}
      {...props}
    />
  )
}
