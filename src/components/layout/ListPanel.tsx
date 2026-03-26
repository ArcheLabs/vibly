import type { ReactNode } from 'react'

type ListPanelProps = {
  header?: ReactNode
  children: ReactNode
}

export function ListPanel({ header, children }: ListPanelProps) {
  return (
    <aside className="glass flex w-[320px] shrink-0 flex-col border-r border-white/60">
      {header ? <div className="border-b border-stone-200/70 p-4">{header}</div> : null}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  )
}
