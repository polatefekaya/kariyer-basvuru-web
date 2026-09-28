const rtf = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' })
const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const monthYearFmt = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' })
const numberFmt = new Intl.NumberFormat('tr-TR')

const toDate = (d: string | number | Date | null | undefined) => {
  if (d == null || d === '') return null
  const date = d instanceof Date ? d : new Date(d)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "3 gün önce", "2 saat sonra", "dün". Falls back to the absolute date beyond 30 days. */
export function formatRelative(value: string | number | Date | null | undefined, now = new Date()): string {
  const date = toDate(value)
  if (!date) return ''
  const diffSec = Math.round((date.getTime() - now.getTime()) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 60) return rtf.format(0, 'second').replace('0 saniye içinde', 'şimdi').replace('şimdi', 'az önce')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day')
  return dateFmt.format(date)
}

export function formatDate(value: string | number | Date | null | undefined): string {
  const date = toDate(value)
  return date ? dateFmt.format(date) : ''
}

/** "Ocak 2022" — for CV date ranges, where the day is noise. */
export function formatMonthYear(value: string | number | Date | null | undefined): string {
  const date = toDate(value)
  return date ? monthYearFmt.format(date) : ''
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  const date = toDate(value)
  return date ? dateTimeFmt.format(date) : ''
}

export const formatNumber = (n: number | null | undefined) => (n == null ? '—' : numberFmt.format(n))

/** Whole days from `now` to `value`; negative when in the past; null when unset. */
export function daysUntil(value: string | number | Date | null | undefined, now = new Date()): number | null {
  const date = toDate(value)
  if (!date) return null
  return Math.ceil((date.getTime() - now.getTime()) / 86400000)
}

/** "3 gün önce oluşturuldu" · "31 Tem 2026 tarihinde oluşturuldu" (absolute fallback beyond 30 days). */
export function createdLabel(value: string | number | Date | null | undefined): string {
  const rel = formatRelative(value)
  if (!rel) return ''
  return /\d{4}$/.test(rel) ? `${rel} tarihinde oluşturuldu` : `${rel} oluşturuldu`
}
