export interface DynamicAppletEntry {
  widgetType: string
  displayName: string
  htmlSource: string
  registeredAt: string
}

const STORAGE_KEY = 'ahip_dynamic_applets'

const dynamicApplets = new Map<string, DynamicAppletEntry>()
const listeners = new Set<() => void>()

function persistToStorage() {
  try {
    const entries = Array.from(dynamicApplets.values())
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // sessionStorage unavailable or quota exceeded — ignore
  }
}

function restoreFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const entries: DynamicAppletEntry[] = JSON.parse(raw)
    for (const entry of entries) {
      if (entry.widgetType && entry.htmlSource) {
        dynamicApplets.set(entry.widgetType, entry)
      }
    }
  } catch {
    // corrupted or unavailable — ignore
  }
}

// Restore on module load
restoreFromStorage()

export function registerDynamicApplet(entry: DynamicAppletEntry) {
  dynamicApplets.set(entry.widgetType, entry)
  persistToStorage()
  listeners.forEach((fn) => fn())
}

export function getDynamicApplet(widgetType: string): DynamicAppletEntry | undefined {
  return dynamicApplets.get(widgetType)
}

export function hasDynamicApplet(widgetType: string): boolean {
  return dynamicApplets.has(widgetType)
}

export function listDynamicAppletTypes(): string[] {
  return Array.from(dynamicApplets.keys())
}

export function subscribeDynamicApplets(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
