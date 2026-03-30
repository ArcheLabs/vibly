import type { ReactNode } from 'react'

type MainPanelProps = {
  children: ReactNode
}

export function MainPanel({ children }: MainPanelProps) {
  return <main className="min-w-0 flex-1 bg-surface p-3 lg:p-4">{children}</main>
}
