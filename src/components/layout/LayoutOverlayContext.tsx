import { createContext, useContext } from 'react'

type LayoutOverlayContextValue = {
  isMobile: boolean
  mobilePanelOpen: boolean
  togglePanel: () => void
  closePanel: () => void
}

export const LayoutOverlayContext = createContext<LayoutOverlayContextValue | null>(null)

export function useLayoutOverlay() {
  const context = useContext(LayoutOverlayContext)
  if (!context) {
    throw new Error('useLayoutOverlay must be used within LayoutOverlayContext.Provider')
  }

  return context
}
