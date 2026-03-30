import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'

type ProfilePanelProps = {
  title: string
  onClose: () => void
  children: ReactNode
}

export function ProfilePanel({ title, onClose, children }: ProfilePanelProps) {
  return (
    <div className="absolute right-5 top-5 z-30 flex h-[calc(100%-40px)] w-[380px] flex-col rounded-3xl border border-default bg-surface">
      <div className="flex items-center justify-between border-b border-default px-5 py-4">
        <h2 className="text-xl font-semibold text-primary">{title}</h2>
        <IconButton onClick={onClose} aria-label="关闭侧板">
          <X className="h-4 w-4" />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  )
}
