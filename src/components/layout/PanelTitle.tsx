import type { LucideIcon } from 'lucide-react'

type PanelTitleProps = {
  icon: LucideIcon
  title: string
}

export function PanelTitle({ icon: Icon, title }: PanelTitleProps) {
  return (
    <div className="flex h-12 items-center gap-2 px-1">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium text-secondary">{title}</span>
    </div>
  )
}
