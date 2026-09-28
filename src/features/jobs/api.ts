import { api, ApiError, unwrap, type ApiResponse } from '@/lib/api'
import config from '@/config/config'
import { mockJobsApi } from '@/mocks'
import type {
  JobCreateInput,
  JobDetail,
  JobListItem,
  JobListParams,
  JobStatisticsData,
  JobStatus,
  JobUpdateInput,
} from './types'

type Spread<T> = { success: boolean; message?: string } & T
function unwrapSpread<T extends object>(res: Spread<T>, url: string): T {
  if (!res.success) throw new ApiError(200, 'RESPONSE', url, res)
  const { success: _s, message: _m, ...rest } = res
  return rest as T
}

export interface JobListResponse {
  data: JobListItem[]
  pagination: { currentPage: number; totalPages: number; totalItems: number; hasNext: boolean; hasPrevious?: boolean }
}

/**
 * Company-side job endpoints (`/jobs`). Plain async functions; caching lives in queries.ts.
 */
const realJobsApi = {
  /** `GET /jobs/company/:companyUid` — the signed-in company's own postings (spread response). */
  listMine: (companyUid: string, params: JobListParams = {}) =>
    api
      .get<Spread<JobListResponse>>(`/jobs/company/${companyUid}`, { params })
      .then((r) => unwrapSpread(r, `/jobs/company/${companyUid}`)),
  countMine: (companyUid: string) => api.data.get<{ count: number }>(`/jobs/company/${companyUid}/count`),

  /** `GET /jobs/:uid` merged with `GET /jobs/:uid/stats` (applicant analytics; failure tolerated). */
  detail: async (uid: string, opts: { withStats?: boolean } = {}): Promise<JobDetail> => {
    const [detailRes, statsRes] = await Promise.allSettled([
      api.get<ApiResponse<JobDetail>>(`/jobs/${uid}`),
      opts.withStats ? api.data.get<JobStatisticsData>(`/jobs/${uid}/stats`) : Promise.reject(new Error('skipped')),
    ])
    if (detailRes.status !== 'fulfilled') throw detailRes.reason
    const job: JobDetail = { ...unwrap(detailRes.value) }
    if (statsRes.status === 'fulfilled') job.statistics = statsRes.value
    return job
  },
  statistics: (uid: string) => api.data.get<JobStatisticsData>(`/jobs/${uid}/stats`),

  create: (input: JobCreateInput) => api.data.post<JobDetail>('/jobs', input),
  update: (uid: string, input: JobUpdateInput) => api.data.put<JobDetail>(`/jobs/${uid}`, input),
  /** Publish / close / archive: `PUT /jobs/:uid/status { status }`. */
  setStatus: (uid: string, status: JobStatus) => api.data.put<JobDetail>(`/jobs/${uid}/status`, { status }),
  bulkSetStatus: (jobUids: string[], status: JobStatus) =>
    api.data.put<{ uid: string; success: boolean; message?: string }[]>('/jobs/bulk/status', { jobUids, status }),
  remove: (uid: string) => api.data.delete<{ uid: string }>(`/jobs/${uid}`),

  /** `GET /jobs/check-slug?slug=` — availability before publishing. */
  checkSlug: (slug: string) =>
    api.data.get<{ available: boolean; slug: string }>('/jobs/check-slug', { params: { slug } }),
}

/** Swapped for the in-memory mock when `config.USE_MOCKS` (dev without Supabase). Same surface either way. */
export const jobsApi: typeof realJobsApi = config.USE_MOCKS ? { ...realJobsApi, ...mockJobsApi } : realJobsApi
