import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { messages, type Locale } from '@/i18n/messages'

const STORAGE_KEY = 'vibly-locale'

type Params = Record<string, string | number>

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Params) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'zh-CN'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh-CN' || saved === 'en-US') return saved
  return window.navigator.language.startsWith('zh') ? 'zh-CN' : 'en-US'
}

function getByPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in acc) {
      return (acc as Record<string, unknown>)[segment]
    }
    return undefined
  }, source)
}

function interpolate(template: string, params?: Params) {
  if (!params) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => String(params[key] ?? ''))
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale())

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  const t = (key: string, params?: Params) => {
    const hit = getByPath(messages[locale], key)
    if (typeof hit === 'string') return interpolate(hit, params)

    const fallback = getByPath(messages['en-US'], key)
    if (typeof fallback === 'string') return interpolate(fallback, params)

    return key
  }

  const value = useMemo(() => ({ locale, setLocale, t }), [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }

  return context
}

export { type Locale }
