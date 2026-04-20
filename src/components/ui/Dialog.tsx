import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/utils'

type DialogProps = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  className?: string
}

export function Dialog({ open, title, description, children, footer, onClose, className }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          'relative z-10 flex max-h-[min(720px,calc(100vh-32px))] w-full max-w-[560px] flex-col overflow-hidden rounded-lg border border-default bg-panel shadow-xl',
          className,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-default px-4 py-3">
          <div className="min-w-0">
            <h2 id="dialog-title" className="text-base font-semibold text-primary">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-secondary">{description}</p> : null}
          </div>
          <IconButton aria-label="Close dialog" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? <footer className="shrink-0 border-t border-default px-4 py-3">{footer}</footer> : null}
      </section>
    </div>
  )
}
