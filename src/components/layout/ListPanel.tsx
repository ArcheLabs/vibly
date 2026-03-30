import type { ReactNode } from 'react'
import { useLayoutOverlay } from '@/components/layout/LayoutOverlayContext'
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
  const { isMobile, mobilePanelOpen, closePanel } = useLayoutOverlay()

  const panel = (
    <aside
      className={cn('flex w-[320px] shrink-0 flex-col border-r border-default bg-panel', className)}
      onClickCapture={(event) => {
        if (!isMobile) return
        const target = event.target as HTMLElement
        if (target.closest('button')) {
          closePanel()
        }
      }}
    >
      {header ? <div className={cn('border-b border-default p-3', headerClassName)}>{header}</div> : null}
      <div className={cn('min-h-0 flex-1 overflow-y-auto', contentClassName)}>{children}</div>
    </aside>
  )

  if (!isMobile) {
    return panel
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 left-[76px] z-40 w-[min(320px,calc(100vw-76px))] border-r border-default bg-panel transition-transform',
          mobilePanelOpen ? 'translate-x-0' : '-translate-x-[calc(100%+76px)]',
        )}
      >
        {panel}
      </div>
    </>
  )
}
