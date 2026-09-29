import { createMemo, type Accessor } from 'solid-js'
import { useJobApplications } from '@/features/applications'
import type { CandidateSummary } from '@/features/candidates'
import type { JobListItem } from '@/features/jobs'

/**
 * The five most recent applicants of a job for the Başvuranlar avatar group. Fetched only while
 * `enabled()` (the row/card is in view) and only if the job has applications at all.
 */
export function useApplicantsPreview(job: Accessor<JobListItem>, enabled: Accessor<boolean>) {
  const total = () => job().stats?.total_applications ?? 0

  const query = useJobApplications(
    () => (enabled() && total() > 0 ? job().uid : null),
    () => ({ limit: 5, sort: 'appliedAt:desc' as const }),
  )

  const applicants = createMemo<CandidateSummary[]>(() =>
    (query.data?.items ?? []).map((row) => ({
      uid: row.candidate.id,
      name: row.candidate.fullName.split(' ')[0] ?? null,
      surname: row.candidate.fullName.split(' ').slice(1).join(' ') || null,
      email: row.candidate.email ?? '',
      phone: row.candidate.phone,
      photo_url: row.candidate.avatarUrl,
      username: null,
    })),
  )

  return { applicants, total }
}
