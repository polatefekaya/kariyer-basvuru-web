// "Add to calendar" helpers — no OAuth, no backend. Google and Outlook get a pre-filled deep link,
// Apple Calendar (and every other client) gets a generated .ics file. See `AddToCalendar` for the UI.

export interface CalendarEvent {
  /**
   * Stable id for the event (e.g. the application / interview uid). Becomes the ICS `UID`, so
   * re-importing the same event updates it instead of creating a duplicate.
   */
  id: string
  title: string
  start: Date
  /** Defaults to `start` + 60 min. */
  end?: Date
  description?: string
  location?: string
  /** Link back into the app — ICS `URL`, appended to the Google/Outlook description. */
  url?: string
  /** Display reminder N minutes before the event (ICS `VALARM` only; deep links can't set alarms). */
  reminderMinutes?: number
}

export type CalendarProvider = 'google' | 'outlook' | 'office365' | 'apple' | 'ics'

const DEFAULT_DURATION_MS = 60 * 60 * 1000
const ICS_UID_DOMAIN = 'kariyerzamani.com'
const ICS_PRODID = '-//KariyerZamani//Basvuru//TR'

const endOf = (ev: CalendarEvent) => ev.end ?? new Date(ev.start.getTime() + DEFAULT_DURATION_MS)

/** `2026-09-25T11:00:00.000Z` → `20260925T110000Z` (RFC 5545 UTC form, also what Google's `dates=` wants). */
const toUtcCompact = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Deep links can't carry a separate URL field, so it goes at the end of the description. */
const descriptionWithUrl = (ev: CalendarEvent) => [ev.description, ev.url].filter(Boolean).join('\n\n')

// ----------------------------------------------------------------------------
// Deep links
// ----------------------------------------------------------------------------

export function googleCalendarUrl(ev: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${toUtcCompact(ev.start)}/${toUtcCompact(endOf(ev))}`,
  })
  const details = descriptionWithUrl(ev)
  if (details) params.set('details', details)
  if (ev.location) params.set('location', ev.location)
  // Times are UTC; `ctz` only decides which zone the compose page previews them in.
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (tz) params.set('ctz', tz)
  return `https://calendar.google.com/calendar/render?${params}`
}

/** `outlook` = personal outlook.live.com accounts, `office365` = work/school outlook.office.com. */
export function outlookCalendarUrl(ev: CalendarEvent, kind: 'outlook' | 'office365' = 'outlook'): string {
  const host = kind === 'office365' ? 'outlook.office.com' : 'outlook.live.com'
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: ev.title,
    startdt: ev.start.toISOString(),
    enddt: endOf(ev).toISOString(),
  })
  // Outlook renders `body` as HTML: escape the text, then turn line breaks into <br>.
  const body = descriptionWithUrl(ev)
  if (body) params.set('body', escapeHtml(body).replace(/\r?\n/g, '<br>'))
  if (ev.location) params.set('location', ev.location)
  return `https://${host}/calendar/0/deeplink/compose?${params}`
}

// ----------------------------------------------------------------------------
// ICS (RFC 5545)
// ----------------------------------------------------------------------------

/** TEXT values: escape `\`, `;`, `,` and turn newlines into a literal `\n`. */
const escapeIcsText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/**
 * Content lines may not exceed 75 octets; longer ones continue on the next line after a single
 * space. Counted in bytes (not chars) so a multi-byte Turkish character is never split in half.
 */
function foldIcsLine(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const parts: string[] = []
  let cur = ''
  let curBytes = 0
  for (const ch of line) {
    const bytes = enc.encode(ch).length
    const limit = parts.length === 0 ? 75 : 74 // continuation lines spend one octet on the leading space
    if (curBytes + bytes > limit) {
      parts.push(cur)
      cur = ch
      curBytes = bytes
    } else {
      cur += ch
      curBytes += bytes
    }
  }
  parts.push(cur)
  return parts.join('\r\n ')
}

export function buildIcs(ev: CalendarEvent): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${ICS_PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.id}@${ICS_UID_DOMAIN}`,
    `DTSTAMP:${toUtcCompact(new Date())}`,
    // UTC throughout: no VTIMEZONE block needed and every client localises on import.
    `DTSTART:${toUtcCompact(ev.start)}`,
    `DTEND:${toUtcCompact(endOf(ev))}`,
    `SUMMARY:${escapeIcsText(ev.title)}`,
  ]
  if (ev.description) lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`)
  if (ev.location) lines.push(`LOCATION:${escapeIcsText(ev.location)}`)
  if (ev.url) lines.push(`URL:${ev.url}`)
  lines.push('STATUS:CONFIRMED')
  if (ev.reminderMinutes != null && ev.reminderMinutes > 0) {
    lines.push(
      'BEGIN:VALARM',
      `TRIGGER:-PT${Math.round(ev.reminderMinutes)}M`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(ev.title)}`,
      'END:VALARM',
    )
  }
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.map(foldIcsLine).join('\r\n') + '\r\n'
}

/** ASCII-safe file name from the event title (`Mülakat — Acme A.Ş.` → `mulakat-acme-a-s.ics`). */
export function icsFileName(ev: CalendarEvent): string {
  const slug = ev.title
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'etkinlik'}.ics`
}

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/**
 * Hands the .ics to the OS. Desktop browsers download it and Calendar / Outlook open it on click.
 * iOS Safari sends `download`ed files to the Files app instead of Calendar, so there we open the
 * `text/calendar` blob directly, which brings up the native "Add to Calendar" sheet.
 */
export function downloadIcs(ev: CalendarEvent, filename = icsFileName(ev)): void {
  const blob = new Blob([buildIcs(ev)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  if (isIos()) {
    window.open(url, '_blank')
  } else {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

// ----------------------------------------------------------------------------
// Dispatch
// ----------------------------------------------------------------------------

export const calendarProviderLabels: Record<CalendarProvider, string> = {
  google: 'Google Takvim',
  outlook: 'Outlook',
  office365: 'Microsoft 365 (Outlook)',
  apple: 'Apple Takvim',
  ics: '.ics dosyası indir',
}

/** Must run inside a user gesture (click) — otherwise the new tab is popup-blocked. */
export function addToCalendar(provider: CalendarProvider, ev: CalendarEvent): void {
  switch (provider) {
    case 'google':
      window.open(googleCalendarUrl(ev), '_blank', 'noopener,noreferrer')
      break
    case 'outlook':
    case 'office365':
      window.open(outlookCalendarUrl(ev, provider), '_blank', 'noopener,noreferrer')
      break
    case 'apple':
    case 'ics':
      downloadIcs(ev)
      break
  }
}
