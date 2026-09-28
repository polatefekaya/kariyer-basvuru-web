import type { LatLng } from '@/features/common/types'
import type { CompanyJob, JobDetail, JobListItem } from './types'

type AnyJob = CompanyJob | JobDetail | JobListItem

/** `"15000.00"` → 15000; null/empty/garbage → null. */
export function parseMoney(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

const currencyCode: Record<string, string> = { TL: 'TRY', TRY: 'TRY', USD: 'USD', EUR: 'EUR', GBP: 'GBP' }

/**
 * "15.000 – 20.000 ₺", "15.000 ₺+", "20.000 ₺'ye kadar", or null when undisclosed.
 * `TL` is the stored default; it is not an ISO code, so it is mapped to `TRY` for Intl.
 */
export function formatSalary(
  job: Pick<AnyJob, 'min_salary' | 'max_salary' | 'currency'>,
  locale = 'tr-TR',
): string | null {
  const min = parseMoney(job.min_salary)
  const max = parseMoney(job.max_salary)
  if (min == null && max == null) return null
  const fmt = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode[job.currency?.toUpperCase() ?? 'TL'] ?? 'TRY',
    maximumFractionDigits: 0,
  })
  if (min != null && max != null) return min === max ? fmt.format(min) : `${fmt.format(min)} – ${fmt.format(max)}`
  if (min != null) return `${fmt.format(min)}+`
  return `${fmt.format(max!)}'ye kadar`
}

/** `[lat, lng]` or null when the row has no usable coordinates. */
export function jobCoordinates(job: Pick<CompanyJob, 'coordinates'>): LatLng | null {
  const c = job.coordinates
  return Array.isArray(c) && c.length === 2 && c.every((n) => Number.isFinite(n)) ? (c as LatLng) : null
}

/** "Nilüfer, Bursa" — town + province, skipping blanks. */
export function jobLocation(job: Pick<AnyJob, 'province' | 'town'>): string {
  return [job.town, job.province].filter((s) => s && s.trim()).join(', ')
}

/** Live on the public site and still accepting applications. */
export function isJobOpen(
  job: Pick<AnyJob, 'status' | 'is_active' | 'job_end_date'> & { is_deleted?: boolean },
  now = new Date(),
): boolean {
  if (job.status !== 'approved' || !job.is_active || job.is_deleted) return false
  return !job.job_end_date || new Date(job.job_end_date) > now
}

/**
 * Same algorithm as the model's `beforeValidate` hook, for previewing the slug of an unsaved
 * title. The backend remains the source of truth (`slug_url`).
 */
export function slugifyJobTitle(title: string, uid?: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  return uid ? `${slug}-${uid.split('-')[0]}` : slug
}

/** Canonical public path for a job. */
export function jobPath(job: Pick<AnyJob, 'slug_url' | 'uid'>): string {
  return `/ilan/${job.slug_url || job.uid}`
}

/** Human label for the job pipeline status (company side). */
export const JOB_STATUS_LABELS: Record<CompanyJob['status'], string> = {
  draft: 'Taslak',
  unclaimed: 'Sahiplenilmemiş',
  pending_approval: 'Onay Bekliyor',
  company_not_found: 'Şirket Bulunamadı',
  approved: 'Yayında',
  rejected: 'Reddedildi',
  expired: 'Süresi Doldu',
  closed: 'Kapatıldı',
}
