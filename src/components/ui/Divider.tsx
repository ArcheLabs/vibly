import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type DividerProps = HTMLAttributes<HTMLHRElement> & {
  variant?: 'full' | 'inset'
}

export function Divider({ className, variant = 'full', ...props }: DividerProps) {
  return (
    <hr
      className={cn(
        'border-0 border-t border-default',
        variant === 'inset' && 'mx-3',
        className,
      )}
      {...props}
    />
  )
}
