import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type ProfilePanelProps = {
  title: string
  onClose: () => void
  children: ReactNode
}

export function ProfilePanel({ title, onClose, children }: ProfilePanelProps) {
  return (
    <div className="glass absolute right-5 top-5 z-30 flex h-[calc(100%-40px)] w-[380px] flex-col rounded-[32px] border border-white/70 shadow-panel">
      <div className="flex items-center justify-between border-b border-stone-200/70 px-5 py-4">
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-stone-200 bg-white p-2 text-stone-500 transition hover:border-stone-300 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  )
}
