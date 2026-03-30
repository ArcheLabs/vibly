import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-default bg-surface px-3 text-sm text-primary outline-none placeholder:text-muted focus-border-strong',
        className,
      )}
      {...props}
    />
  )
}
