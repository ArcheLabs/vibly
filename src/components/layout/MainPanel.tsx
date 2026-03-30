import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type MainPanelProps = {
  children: ReactNode
  className?: string
}

export function MainPanel({ children, className }: MainPanelProps) {
  return <main className={cn('min-w-0 flex-1 bg-surface p-3 lg:p-4', className)}>{children}</main>
}
