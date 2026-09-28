import { api, ApiError } from '@/lib/api'
import config from '@/config/config'
import { mockCandidatesApi } from '@/mocks'
import type { CandidateProfile } from './types'

/** `GET /employee/...` spreads the record next to `success` instead of nesting it under `data`. */
type SpreadEnvelope<T> = { success: boolean; message?: string } & T

function unwrapSpread<T extends object>(res: SpreadEnvelope<T>, url: string): T {
  if (!res.success) throw new ApiError(200, 'RESPONSE', url, res)
  const { success: _s, message: _m, ...record } = res
  return record as T
}

const profile = (url: string) => api.get<SpreadEnvelope<CandidateProfile>>(url).then((r) => unwrapSpread(r, url))

const realCandidatesApi = {
  /** `uid` = applicant uid; `resumeId` = the resume they applied with (from the application). */
  get: (uid: string, resumeId?: number | null) => profile(`/employee/${uid}${resumeId ? `/${resumeId}` : ''}`),
  byUsername: (username: string, resumeId?: number | null) =>
    profile(`/employee/username/${encodeURIComponent(username)}${resumeId ? `/${resumeId}` : ''}`),

  /** View-tracking (counts toward the candidate's monthly stats and the company's CV-view rights). Fire-and-forget. */
  trackProfileView: (uid: string) => api.post<unknown>(`/employee/${uid}/track-profile-view`).catch(() => undefined),
  trackCvView: (resumeId: number) => api.post<unknown>(`/employee/${resumeId}/track-cv-view`).catch(() => undefined),
}

/** Swapped for the in-memory mock when `config.USE_MOCKS`. */
export const candidatesApi: typeof realCandidatesApi = config.USE_MOCKS
  ? { ...realCandidatesApi, ...mockCandidatesApi }
  : realCandidatesApi
