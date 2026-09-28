import config from '@/config/config'
import { recruitingApi } from '@/lib/api'
import { mockApplicationsApi } from '@/mocks'
import { nodeApplicationsApi } from './nodeApi'
import type {
  ActivityEntry,
  ApplicationListParams,
  ApplicationListResponse,
  ApplicationNote,
  ApplicationStage,
  ApplicationStatsResponse,
  ChangeStageResponse,
  CompanyApplicationParams,
} from './types'

const realApplicationsApi = {
  listByJob: (jobUid: string, params: ApplicationListParams = {}) =>
    recruitingApi.get<ApplicationListResponse>(`/jobs/${jobUid}/applications`, { params }),

  listByCompany: (params: CompanyApplicationParams = {}) =>
    recruitingApi.get<ApplicationListResponse>('/company/applications', { params }),

  stats: (jobUid: string) => recruitingApi.get<ApplicationStatsResponse>(`/jobs/${jobUid}/application-stats`),

  setStage: (applicationUid: string, status: ApplicationStage, reason?: string) =>
    recruitingApi.patch<ChangeStageResponse>(`/applications/${applicationUid}/status`, { status, reason }),

  notesByJob: (jobUid: string) => recruitingApi.get<ApplicationNote[]>(`/jobs/${jobUid}/notes`),

  // 204 when nobody has written one yet; the query layer cannot hold `undefined`.
  note: (applicationUid: string) =>
    recruitingApi.get<ApplicationNote | undefined>(`/applications/${applicationUid}/note`).then((note) => note ?? null),

  saveNote: (applicationUid: string, body: string) =>
    recruitingApi.put<ApplicationNote | null>(`/applications/${applicationUid}/note`, { body }),

  activity: (applicationUid: string, limit = 50) =>
    recruitingApi.get<ActivityEntry[]>(`/applications/${applicationUid}/activity`, { params: { limit } }),
}

/**
 * Which backend answers for applications:
 *
 * - **kariyer-recruiting-service** when it is configured (`VITE_RECRUITING_LIVE`) — the nine-stage
 *   pipeline with notes, interviews and the activity trail.
 * - **the Node backend** otherwise, whenever there is a session — real applications and real match
 *   scores over the five statuses `job_application` actually stores.
 * - the in-memory mocks only when there is no session to call anything with.
 */
export const applicationsApi: typeof realApplicationsApi = config.RECRUITING_LIVE
  ? realApplicationsApi
  : config.USE_MOCKS
    ? mockApplicationsApi
    : nodeApplicationsApi
