import { api } from '@/lib/api'
import config from '@/config/config'
import { mockResumesApi } from '@/mocks'
import type { ProfileReference, Resume, ResumeDetail } from './types'

/**
 * `GET /resume/:id` answers with the raw row; `GET /resume/employee/:uid` wraps its array in
 * `{ success, data }`. Reading the list as a bare array is why every candidate looked like they
 * had no CV — `length` on the envelope object is `undefined`. Both shapes are accepted here so a
 * backend that stops wrapping (or starts) does not empty the screen again.
 */
const asList = (res: Resume[] | { data?: Resume[] } | null | undefined): Resume[] =>
  Array.isArray(res) ? res : (res?.data ?? [])

const realResumesApi = {
  /** `GET /resume/employee/:uid` — every CV of one candidate, active first (no sub-tables). */
  listByEmployee: (employeeUid: string) =>
    api.get<Resume[] | { data?: Resume[] }>(`/resume/employee/${employeeUid}`).then(asList),
  /** `GET /resume/:id` — one CV with all its sections; comes back redacted unless unlocked. */
  get: (id: number) => api.get<ResumeDetail>(`/resume/${id}`),
  /** Paid unlock, not a tracking ping: failures must reach the caller. */
  unlock: async (id: number): Promise<void> => {
    await api.data.post(`/employee/${id}/track-cv-view`, {
      consume_right: true,
      view_source: 'applications',
    })
  },
  /** `GET /profile_reference/:employee_uid` — every reference; the CV's `refs` pick which ones show. */
  references: (employeeUid: string) =>
    api.data.get<ProfileReference[]>(`/profile_reference/${employeeUid}`).catch(() => [] as ProfileReference[]),
}

/** Swapped for the in-memory mock when `config.USE_MOCKS`. */
export const resumesApi: typeof realResumesApi = config.USE_MOCKS ? mockResumesApi : realResumesApi
