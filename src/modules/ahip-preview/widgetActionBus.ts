import type { AHIPAction } from '@ahip/core'

/**
 * Simple pub/sub bus that connects AHIP action buttons (host side)
 * to sandboxed iframe applets (widget side) via postMessage.
 *
 * DynamicAppletRenderer registers its iframe on mount.
 * provider.tsx routes invoke_widget_action here before falling
 * through to the generic handler.
 */

type WidgetActionListener = (action: AHIPAction) => void

const listeners = new Map<string, WidgetActionListener>()

export function registerWidgetListener(widgetId: string, listener: WidgetActionListener): () => void {
  listeners.set(widgetId, listener)
  return () => {
    if (listeners.get(widgetId) === listener) {
      listeners.delete(widgetId)
    }
  }
}

/**
 * Returns true if the action was dispatched to a live widget iframe.
 */
export function dispatchWidgetAction(widgetId: string, action: AHIPAction): boolean {
  const listener = listeners.get(widgetId)
  if (listener) {
    listener(action)
    return true
  }
  return false
}

export function hasActiveWidget(widgetId: string): boolean {
  return listeners.has(widgetId)
}
