import clsx from 'clsx'

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values)
}

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
