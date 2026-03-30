import type { ReactNode } from 'react'
import { ThemeContextProvider } from '@/hooks/useTheme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContextProvider>{children}</ThemeContextProvider>
}
