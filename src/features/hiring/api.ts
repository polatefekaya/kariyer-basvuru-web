import config from '@/config/config'
import { recruitingApi } from '@/lib/api'
import { mockHiringApi } from '@/mocks'
import type { HiringUser, Interview, InterviewCreateInput, InterviewUpdateInput, JobInterviewBoard } from './types'

const realHiringApi = {
  boardByJob: (jobUid: string) => recruitingApi.get<JobInterviewBoard>(`/jobs/${jobUid}/interviews`),

  byCandidate: (candidateUid: string) => recruitingApi.get<Interview[]>(`/candidates/${candidateUid}/interviews`),

  create: (applicationUid: string, input: InterviewCreateInput) =>
    recruitingApi.post<Interview>(`/applications/${applicationUid}/interviews`, input),

  update: (uid: string, input: InterviewUpdateInput) => recruitingApi.patch<Interview>(`/interviews/${uid}`, input),

  // PATCH rather than DELETE: only the PATCH carries the message the cancellation e-mail quotes.
  cancel: (uid: string, candidateMessage?: string | null) =>
    recruitingApi.patch<Interview>(`/interviews/${uid}`, { status: 'CANCELLED', candidateMessage }),

  members: () => recruitingApi.get<HiringUser[]>('/company/members'),
}

/**
 * Interviews live only in kariyer-recruiting-service — the Node backend's `company_interview` is
 * the candidate's public review of a company, not an employer's schedule. Without the service the
 * board reads empty and scheduling says so, rather than failing at the network layer.
 */
const unavailable = () => Promise.reject(new Error('Mülakat planlamak için işe alım servisi gerekiyor.'))

const offlineHiringApi: typeof realHiringApi = {
  boardByJob: async () => ({ ongoing: [], upcoming: [], past: [] }),
  byCandidate: async () => [],
  create: unavailable,
  update: unavailable,
  cancel: unavailable,
  members: async () => [],
}

export const hiringApi: typeof realHiringApi = config.RECRUITING_LIVE
  ? realHiringApi
  : config.USE_MOCKS
    ? mockHiringApi
    : offlineHiringApi
