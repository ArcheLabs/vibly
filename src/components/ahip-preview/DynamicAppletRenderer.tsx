import { useCallback, useEffect, useRef, useState } from 'react'
import type { AHIPWidgetRendererProps } from '@ahip/react'
import { getDynamicApplet } from '@/modules/ahip-preview/dynamicAppletRegistry'
import { registerWidgetListener } from '@/modules/ahip-preview/widgetActionBus'

const SANDBOX_FLAGS = 'allow-scripts'
const DEFAULT_HEIGHT = 560
const DEFAULT_WIDTH = 760
const MAX_HEIGHT = 1400
const MAX_WIDTH = 1200
const MIN_HEIGHT = 100
const MIN_WIDTH = 320

export function DynamicAppletRenderer({ widget, item, host, fallback }: AHIPWidgetRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [error, setError] = useState<string | null>(null)

  const applet = getDynamicApplet(widget.widget_type)

  // Outbound: iframe → host
  const handleMessage = useCallback((event: MessageEvent) => {
    const iframe = iframeRef.current
    if (!iframe || event.source !== iframe.contentWindow) return

    const data = event.data
    if (!data || typeof data !== 'object') return

    if (data.type === 'ahip_widget_action' && data.payload) {
      host.actionDispatcher?.dispatchAction(
        {
          id: `dynamic_${Date.now()}`,
          label: data.payload.action ?? 'Widget action',
          kind: 'invoke_widget_action',
          payload: {
            widget_id: widget.widget_id,
            ...data.payload,
          },
        },
        { item },
      )
    }

    if (data.type === 'ahip_widget_resize' && typeof data.height === 'number') {
      setHeight(Math.min(Math.max(data.height, MIN_HEIGHT), MAX_HEIGHT))
    }
  }, [host, widget, item])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Inbound: host → iframe (via widget action bus)
  useEffect(() => {
    const unregister = registerWidgetListener(widget.widget_id, (action) => {
      const iframe = iframeRef.current
      if (!iframe?.contentWindow) return
      iframe.contentWindow.postMessage(
        {
          type: 'ahip_host_action',
          action: action.payload?.action ?? action.label,
          payload: action.payload ?? {},
        },
        '*',
      )
    })
    return unregister
  }, [widget.widget_id])

  if (!applet) {
    return (
      <div className="rounded-md border border-default bg-muted px-3 py-2 text-xs text-secondary">
        Applet renderer is not available locally. Regenerate applet.
        <div className="mt-2">{fallback}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-warning bg-muted px-3 py-2 text-xs text-warning">
        Dynamic applet error: {error}
      </div>
    )
  }

  return (
    <section className="space-y-2" data-ahip-widget={widget.widget_type}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-primary">{applet.displayName}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted">Drag the corner to resize</span>
          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">dynamic applet</span>
        </div>
      </div>
      <div
        className="max-w-full overflow-auto rounded border border-default bg-surface"
        style={{
          height: `${height}px`,
          width: `min(100%, ${width}px)`,
          maxHeight: `${MAX_HEIGHT}px`,
          maxWidth: '100%',
          minHeight: `${MIN_HEIGHT}px`,
          minWidth: `${MIN_WIDTH}px`,
          resize: 'both',
        }}
        onPointerUp={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setHeight(Math.min(Math.max(Math.round(rect.height), MIN_HEIGHT), MAX_HEIGHT))
          setWidth(Math.min(Math.max(Math.round(rect.width), MIN_WIDTH), MAX_WIDTH))
        }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={applet.htmlSource}
          sandbox={SANDBOX_FLAGS}
          title={applet.displayName}
          className="h-full w-full"
          style={{ border: 'none' }}
          onError={() => setError('Failed to load applet.')}
        />
      </div>
    </section>
  )
}
