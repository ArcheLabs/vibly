import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean
}

export function Panel({ className, padded = true, ...props }: PanelProps) {
  return (
    <div
      className={cn('rounded-md border border-default bg-panel', padded && 'p-4', className)}
      {...props}
    />
  )
}
