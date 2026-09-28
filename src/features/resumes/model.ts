import { formatMonthYear } from '@/lib/format'
import type { ProfileReference, Resume, ResumeDetail, ResumeEducation, ResumeExperience } from './types'

/** A locked CV arrives already stripped of identity/contact; the page offers to unlock it. */
export const isResumeLocked = (r: Pick<Resume, 'is_redacted'> | null | undefined) => !!r?.is_redacted

export const resumeDisplayName = (r: Pick<Resume, 'resume_name' | 'id'>) => r.resume_name?.trim() || `Özgeçmiş #${r.id}`

/** "Oca 2022 – Halen" / "2019 – 2021" from a start/end pair plus the `is_continue` flag. */
export function dateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  isContinue?: boolean,
): string {
  const from = start ? formatMonthYear(start) : ''
  const to = isContinue ? 'Halen' : end ? formatMonthYear(end) : ''
  return [from, to].filter(Boolean).join(' – ')
}

const time = (d: string | null | undefined) => (d ? new Date(d).getTime() : 0)

/** Ongoing first, then newest start date — how a CV reads. */
export const sortExperiences = (rows: ResumeExperience[] = []) =>
  [...rows].sort(
    (a, b) => Number(b.is_continue) - Number(a.is_continue) || time(b.ex_start_date) - time(a.ex_start_date),
  )

export const sortEducations = (rows: ResumeEducation[] = []) =>
  [...rows].sort(
    (a, b) => Number(b.is_continue) - Number(a.is_continue) || time(b.edu_start_date) - time(a.edu_start_date),
  )

export const resumeLocation = (r: Pick<Resume, 'province' | 'town'>) =>
  [r.town, r.province].filter((s) => s && s.trim()).join(', ')

/** Every skill name on the CV (plain + digital), de-duplicated. */
export function resumeSkillNames(r: ResumeDetail | undefined): string[] {
  const names = [...(r?.skills ?? []), ...(r?.digital_skills ?? [])].map((s) => s.skill_name?.trim()).filter(Boolean)
  return [...new Set(names as string[])]
}

/** `lang_level` is "1"–"5"; the CV builder shows these labels. */
const LANG_LEVELS: Record<string, string> = {
  '1': 'Başlangıç',
  '2': 'Temel',
  '3': 'Orta',
  '4': 'İyi',
  '5': 'İleri',
}
export const languageLevelLabel = (level: string | null | undefined) => (level && (LANG_LEVELS[level] ?? level)) || '—'

/** "3 yıl 2 ay" between two dates (open-ended ranges run to today), as the CV modal shows. */
export function durationLabel(
  start: string | null | undefined,
  end: string | null | undefined,
  isContinue?: boolean,
): string {
  if (!start) return ''
  const from = new Date(start)
  const to = isContinue || !end ? new Date() : new Date(end)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return ''
  const months = Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()))
  const years = Math.floor(months / 12)
  const rest = months % 12
  return [years ? `${years} yıl` : '', rest ? `${rest} ay` : ''].filter(Boolean).join(' ') || '1 aydan az'
}

/** `lang_level` / skill `level` are "1"–"5" (the CV modal draws them as five stars). */
export const levelValue = (level: string | null | undefined) => {
  const n = Number(level)
  return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0
}

/** Only the references this CV selected (`refs` holds their ids, sometimes as strings). */
export function resumeReferences(resume: Pick<Resume, 'refs'> | undefined, all: ProfileReference[] = []) {
  const ids = new Set((resume?.refs ?? []).map(String))
  return ids.size ? all.filter((r) => ids.has(String(r.id))) : []
}

/** Flags an employer filters on: emekli / engelli / afetzede. */
export function resumeFlags(r: Pick<Resume, 'retirement' | 'is_disabled' | 'is_disaster_affected'>): string[] {
  return [r.retirement && 'Emekli', r.is_disabled && 'Engelli', r.is_disaster_affected && 'Afetzede'].filter(
    Boolean,
  ) as string[]
}

export const referenceName = (r: ProfileReference) =>
  (r.referee ? `${r.referee.name ?? ''} ${r.referee.surname ?? ''}`.trim() : '') || r.referee_name || 'Referans'
