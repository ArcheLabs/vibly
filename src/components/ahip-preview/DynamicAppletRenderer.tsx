import { useCallback, useEffect, useRef, useState } from 'react'
import type { AHIPWidgetRendererProps } from '@ahip/react'
import { getDynamicApplet } from '@/modules/ahip-preview/dynamicAppletRegistry'
import { registerWidgetListener } from '@/modules/ahip-preview/widgetActionBus'

const SANDBOX_FLAGS = 'allow-scripts'
const DEFAULT_HEIGHT = 400
const MAX_HEIGHT = 800
const MIN_HEIGHT = 100

export function DynamicAppletRenderer({ widget, item, host, fallback }: AHIPWidgetRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
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
    return <>{fallback}</>
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
        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">dynamic applet</span>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={applet.htmlSource}
        sandbox={SANDBOX_FLAGS}
        title={applet.displayName}
        className="w-full rounded border border-default"
        style={{ height: `${height}px`, border: 'none' }}
        onError={() => setError('Failed to load applet.')}
      />
    </section>
  )
}
