export function formatTimeByLocale(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatNumberByLocale(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value)
}

export function localizeRelativeTimeToken(value: string, locale: string) {
  if (locale.startsWith('zh')) return value

  const dayMap: Record<string, string> = {
    刚刚: 'Just now',
    今天: 'Today',
    昨天: 'Yesterday',
    周一: 'Mon',
    周二: 'Tue',
    周三: 'Wed',
    周四: 'Thu',
    周五: 'Fri',
    周六: 'Sat',
    周日: 'Sun',
    周天: 'Sun',
  }

  const todayWithTime = value.match(/^今天\s+(\d{2}:\d{2})$/)
  if (todayWithTime) return `Today ${todayWithTime[1]}`

  const yesterdayWithTime = value.match(/^昨天\s+(\d{2}:\d{2})$/)
  if (yesterdayWithTime) return `Yesterday ${yesterdayWithTime[1]}`

  const weekWithTime = value.match(/^(周[一二三四五六日天])\s+(\d{2}:\d{2})$/)
  if (weekWithTime) {
    return `${dayMap[weekWithTime[1]] ?? weekWithTime[1]} ${weekWithTime[2]}`
  }

  return dayMap[value] ?? value
}

export function formatAmountByLocale(value: string, locale: string) {
  const match = value.match(/^([+-]?)(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/)
  if (!match) return value

  const [, sign, numeric, unit] = match
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: numeric.includes('.') ? numeric.split('.')[1].length : 0,
    maximumFractionDigits: numeric.includes('.') ? numeric.split('.')[1].length : 0,
  }).format(Number(numeric))

  return `${sign}${formatted} ${unit}`
}
