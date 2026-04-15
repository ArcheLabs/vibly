import { loadDynamicApplets, saveDynamicApplet, saveDynamicApplets } from './storage'
import type { AhipDynamicAppletEntry } from './types'

export type DynamicAppletEntry = AhipDynamicAppletEntry

const STORAGE_KEY = 'ahip_dynamic_applets'

const dynamicApplets = new Map<string, DynamicAppletEntry>()
const listeners = new Set<() => void>()
let hydratedFromDb = false

function persistToSessionStorage() {
  try {
    const entries = Array.from(dynamicApplets.values())
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // sessionStorage unavailable or quota exceeded — ignore.
  }
}

export function readLegacySessionApplets(): DynamicAppletEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const entries = JSON.parse(raw) as DynamicAppletEntry[]
    return entries.filter((entry) => Boolean(entry.widgetType && entry.htmlSource))
  } catch {
    return []
  }
}

function restoreFromSessionStorage() {
  for (const entry of readLegacySessionApplets()) {
    dynamicApplets.set(entry.widgetType, entry)
  }
}

function notifyListeners() {
  listeners.forEach((fn) => fn())
}

// Restore on module load so same-tab dev refreshes keep working before DB hydration.
restoreFromSessionStorage()

export async function hydrateDynamicAppletsFromDb() {
  if (hydratedFromDb) return

  try {
    const legacyEntries = readLegacySessionApplets()
    if (legacyEntries.length) {
      await saveDynamicApplets(legacyEntries)
    }

    const entries = await loadDynamicApplets()
    for (const entry of entries) {
      dynamicApplets.set(entry.widgetType, entry)
    }

    persistToSessionStorage()
    hydratedFromDb = true
    notifyListeners()
  } catch {
    // IndexedDB unavailable or corrupted — keep in-memory/session applets.
  }
}

export async function registerDynamicApplet(entry: DynamicAppletEntry) {
  dynamicApplets.set(entry.widgetType, entry)
  persistToSessionStorage()
  notifyListeners()
  try {
    await saveDynamicApplet(entry)
  } catch {
    // IndexedDB unavailable or quota exceeded — in-memory/session applet still works.
  }
}

export function clearDynamicApplets() {
  hydratedFromDb = false
  dynamicApplets.clear()
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // sessionStorage unavailable — ignore.
  }
  notifyListeners()
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

export function listDynamicApplets(): DynamicAppletEntry[] {
  return Array.from(dynamicApplets.values())
}

export function subscribeDynamicApplets(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
