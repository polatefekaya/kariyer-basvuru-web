import type { CandidateProfile, CandidateSummary, Employee } from './types'

type AnyCandidate = Employee | CandidateProfile | CandidateSummary

export function candidateFullName(c: Pick<AnyCandidate, 'name' | 'surname'> & { username?: string | null }): string {
  const full = `${c.name ?? ''} ${c.surname ?? ''}`.trim()
  return full || c.username || 'Aday'
}

/** `looking_job` is "0"/"1" as a string. */
export function isLookingForJob(c: Pick<Employee, 'looking_job'>): boolean {
  return c.looking_job === '1' || (c.looking_job as unknown) === true
}

/** Prefer the resume's address (what they applied with) over the account's. */
export function candidateLocation(
  c: Pick<CandidateProfile, 'resume_province' | 'resume_town' | 'province' | 'town'>,
): string {
  const town = c.resume_town || c.town
  const province = c.resume_province || c.province
  return [town, province].filter((s) => s && s.trim()).join(', ')
}

/** Explicit title, else latest experience "position · company". */
export function candidateHeadline(c: Pick<CandidateProfile, 'title' | 'position' | 'company'>): string | null {
  if (c.title?.trim()) return c.title
  return [c.position, c.company].filter(Boolean).join(' · ') || null
}

export function candidateAge(c: Pick<Employee, 'birth_date'>, now = new Date()): number | null {
  if (!c.birth_date) return null
  const b = new Date(c.birth_date)
  if (Number.isNaN(b.getTime())) return null
  let age = now.getFullYear() - b.getFullYear()
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age--
  return age
}
