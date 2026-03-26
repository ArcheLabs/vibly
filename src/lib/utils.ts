import clsx from 'clsx'

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values)
}

export function formatNowTime(date = new Date()) {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
