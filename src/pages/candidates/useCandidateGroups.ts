import type { ApplicationRow, ApplicationStage, CandidateRef } from '@/features/applications'

/** One candidate plus every application of theirs in the loaded pages. */
export interface CandidateGroup {
  uid: string
  candidate: CandidateRef
  /** Newest first. */
  applications: ApplicationRow[]
  latest: ApplicationRow
  appliedAt: string
  stages: ApplicationStage[]
  /** Best match score across their applications, when scored. */
  bestMatch: number | null
}

/**
 * Applications arrive one row per (candidate, job). The Adaylar list shows people, so rows are
 * folded by candidate — keeping every job they applied to, newest first, and ordering the people
 * by their most recent application.
 */
export function groupByCandidate(rows: ApplicationRow[]): CandidateGroup[] {
  const byUid = new Map<string, ApplicationRow[]>()

  for (const row of rows) {
    const list = byUid.get(row.candidate.id)
    if (list) list.push(row)
    else byUid.set(row.candidate.id, [row])
  }

  const groups: CandidateGroup[] = []

  for (const [uid, list] of byUid) {
    const applications = [...list].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    const latest = applications[0]!
    const matches = applications.map((a) => a.score).filter((n): n is number => typeof n === 'number')

    groups.push({
      uid,
      candidate: latest.candidate,
      applications,
      latest,
      appliedAt: latest.appliedAt,
      stages: [...new Set(applications.map((a) => a.stage))],
      bestMatch: matches.length ? Math.max(...matches) : null,
    })
  }

  return groups.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
}
