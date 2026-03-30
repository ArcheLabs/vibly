import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ListPanelProps = {
  header?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function ListPanel({
  header,
  children,
  className,
  headerClassName,
  contentClassName,
}: ListPanelProps) {
  return (
    <aside className={cn('flex w-[320px] shrink-0 flex-col border-r border-default bg-panel', className)}>
      {header ? <div className={cn('border-b border-default p-3', headerClassName)}>{header}</div> : null}
      <div className={cn('min-h-0 flex-1 overflow-y-auto', contentClassName)}>{children}</div>
    </aside>
  )
}
