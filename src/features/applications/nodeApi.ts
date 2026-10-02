import { api, ApiError } from '@/lib/api'
import { currentCompanyUid } from '@/features/auth'
import { jobsApi } from '@/features/jobs'
import { STAGE_LABELS } from './stages'
import { legacyAllowedActions, LEGACY_FROM_STAGE, stageFromLegacy, type LegacyApplicationStatus } from './legacy'
import type {
  ActivityEntry,
  ApplicationListParams,
  ApplicationListResponse,
  ApplicationNote,
  ApplicationRow,
  ApplicationStage,
  ApplicationStatsResponse,
  BulkChangeStageResponse,
  ChangeStageResponse,
  CompanyApplicationParams,
  MessageRecipient,
  SendMessageResponse,
} from './types'

/**
 * The applications feature served by the Node backend (`/job_applications`).
 *
 * This is what runs when kariyer-recruiting-service is not configured: real applications, real
 * match scores, and the five statuses the `job_application` table actually has. The pipeline
 * extras that live only in the recruiting service — notes, the activity trail, interviews — read
 * as empty here rather than pretending; see `applicationsApi` for which source is chosen.
 */

interface NodeApplicant {
  uid: string
  name?: string | null
  surname?: string | null
  email?: string | null
  phone?: string | null
  photo_url?: string | null
}

interface NodeResume {
  id?: number | null
  province?: string | null
  town?: string | null
  country?: string | null
}

interface NodeApplication {
  uid: string
  job_uid: string
  applicant_uid: string
  resume_id: number | null
  application_status: LegacyApplicationStatus | string
  application_status_label?: string
  applied_at: string
  reviewed_at?: string | null
  job?: { uid: string; title?: string | null } | null
  applicant?: NodeApplicant | null
  resume?: NodeResume | null
  /** Company/admin only, and only on the per-job list — computed per request, never stored. */
  applicant_match?: { overall_match_percentage?: number | null } | null
}

interface NodePagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface NodeListResponse {
  success: boolean
  data: NodeApplication[]
  pagination?: NodePagination
}

/** Applications the company-wide list pulls per posting before merging. */
const PER_JOB_LIMIT = 100

/** How many of the company's postings the merged list covers, newest first. */
const JOB_SCAN_LIMIT = 50

const fullName = (a: NodeApplicant | null | undefined) =>
  [a?.name, a?.surname].filter(Boolean).join(' ').trim() || 'İsimsiz aday'

const location = (r: NodeResume | null | undefined) => [r?.province, r?.town].filter(Boolean).join(', ') || null

function toRow(row: NodeApplication): ApplicationRow {
  const stage = stageFromLegacy(row.application_status)
  const score = row.applicant_match?.overall_match_percentage

  return {
    id: row.uid,
    job: { uid: row.job?.uid ?? row.job_uid, title: row.job?.title ?? 'İlan' },
    candidate: {
      id: row.applicant?.uid ?? row.applicant_uid,
      fullName: fullName(row.applicant),
      email: row.applicant?.email ?? null,
      phone: row.applicant?.phone ?? null,
      location: location(row.resume),
      avatarUrl: row.applicant?.photo_url ?? null,
    },
    stage,
    stageLabel: STAGE_LABELS[stage],
    score: typeof score === 'number' ? score : null,
    resumeId: row.resume_id ?? null,
    appliedAt: row.applied_at,
    lastActivityAt: row.reviewed_at ?? null,
    hasNote: false,
    nextInterview: null,
    allowedActions: legacyAllowedActions(stage),
  }
}

/** Our filters in the shape `parseFilters` reads. `sortBy` is ignored server-side. */
function toQuery(params: ApplicationListParams) {
  const status = params.status ? LEGACY_FROM_STAGE[params.status] : undefined

  return {
    ...(status && { application_status: status }),
    ...(params.q?.trim() && { keyword: params.q.trim() }),
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
}

/** The backend always returns `applied_at DESC`; the other orders are applied to what arrived. */
function sortRows(rows: ApplicationRow[], sort: ApplicationListParams['sort']): ApplicationRow[] {
  if (sort === 'appliedAt:asc') return [...rows].sort((a, b) => a.appliedAt.localeCompare(b.appliedAt))
  if (sort === 'stage:asc') return [...rows].sort((a, b) => a.stage.localeCompare(b.stage))
  return rows
}

const listByJob = async (jobUid: string, params: ApplicationListParams = {}): Promise<ApplicationListResponse> => {
  const path = `/job_applications/${jobUid}/applications`
  const res = await api.get<NodeListResponse>(path, { params: toQuery(params) })

  // The backend answers 200 with `success: false` for a refused read; without this the screen
  // would show "no applications" where it should show the error.
  if (res.success === false) throw new ApiError(200, 'RESPONSE', path, res)

  const items = sortRows((res.data ?? []).map(toRow), params.sort)

  return {
    items,
    pagination: {
      page: res.pagination?.currentPage ?? 1,
      limit: res.pagination?.itemsPerPage ?? params.limit ?? 20,
      total: res.pagination?.totalItems ?? items.length,
      totalPages: res.pagination?.totalPages ?? 1,
    },
    stats: {},
  }
}

/**
 * Every application across the company's postings.
 *
 * Assembled per posting on purpose: `/job_applications/companies/:uid/applications` does not
 * actually filter by company — `_company_uid` is put on the filter bag and never read — so it
 * answers with every application in the database. Pulling that into an employer's browser would
 * be both wrong and a privacy problem, so the merged list is built from the company's own jobs
 * and paginated here. It covers the newest {@link JOB_SCAN_LIMIT} postings, {@link PER_JOB_LIMIT}
 * applications each.
 */
const listByCompany = async (params: CompanyApplicationParams = {}): Promise<ApplicationListResponse> => {
  const page = params.page ?? 1
  const limit = params.limit ?? 20

  let jobUids: string[]

  if (params.jobUid) {
    jobUids = [params.jobUid]
  } else {
    const companyUid = currentCompanyUid()
    if (!companyUid) return { items: [], pagination: { page, limit, total: 0, totalPages: 0 }, stats: {} }

    const jobs = await jobsApi.listMine(companyUid, {
      limit: JOB_SCAN_LIMIT,
      sortBy: 'created_on',
      sortOrder: 'DESC',
    })
    jobUids = (jobs.data ?? []).map((job) => job.uid)
  }

  const pages = await Promise.all(
    jobUids.map((uid) =>
      listByJob(uid, { status: params.status, q: params.q, limit: PER_JOB_LIMIT }).catch(() => null),
    ),
  )

  let rows = pages.flatMap((p) => p?.items ?? [])
  if (params.candidateUid) rows = rows.filter((row) => row.candidate.id === params.candidateUid)

  rows = sortRows(rows, params.sort ?? 'appliedAt:desc')
  if (!params.sort || params.sort === 'appliedAt:desc') {
    rows = [...rows].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
  }

  const start = (page - 1) * limit

  return {
    items: rows.slice(start, start + limit),
    pagination: { page, limit, total: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / limit)) },
    stats: {},
  }
}

interface NodeStatsResponse {
  success: boolean
  data: { application_status: string; count: string | number }[]
}

const stats = async (jobUid: string): Promise<ApplicationStatsResponse> => {
  const path = '/job_applications/applications/stats'
  const res = await api.get<NodeStatsResponse>(path, { params: { job_uid: jobUid } })

  if (res.success === false) throw new ApiError(200, 'RESPONSE', path, res)

  const stages: Record<string, number> = {}
  let all = 0

  for (const row of res.data ?? []) {
    const count = Number(row.count) || 0
    stages[stageFromLegacy(row.application_status)] = count
    all += count
  }

  return { stages: { ...stages, ALL: all }, interviews: { total: 0, scheduled: 0 } }
}

const setStage = async (applicationUid: string, stage: ApplicationStage): Promise<ChangeStageResponse> => {
  const status = LEGACY_FROM_STAGE[stage]

  if (!status) {
    throw new Error(`"${STAGE_LABELS[stage]}" aşaması bu kurulumda saklanamıyor.`)
  }

  await api.data.put<unknown>(`/job_applications/applications/${applicationUid}/status`, { status })

  return {
    applicationUid,
    stage,
    stageLabel: STAGE_LABELS[stage],
    allowedActions: legacyAllowedActions(stage),
  }
}

/**
 * Notes, the activity trail and interviews are the recruiting service's own tables — there is
 * nothing to read them from here. They answer empty so the screens render without them.
 */
export const nodeApplicationsApi = {
  listByJob,
  listByCompany,
  stats,
  setStage,
  // No bulk route in the Node backend: one move per application, judged one by one like the
  // recruiting service does, so a selection spanning stages still moves what it can.
  setStageBulk: async (applicationUids: string[], stage: ApplicationStage): Promise<BulkChangeStageResponse> => {
    const results = await Promise.allSettled(applicationUids.map((uid) => setStage(uid, stage)))
    return {
      moved: results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      skipped: results.flatMap((r, i) =>
        r.status === 'rejected'
          ? [{ applicationUid: applicationUids[i]!, reason: 'INVALID_STATUS_TRANSITION' as const, stage: null }]
          : [],
      ),
    }
  },
  // Messages are recorded and mailed by the recruiting service; without it there is no one to send them.
  messageAudience: async (): Promise<MessageRecipient[]> => [],
  sendMessage: async (): Promise<SendMessageResponse> => {
    throw new Error('Adaylara mesaj göndermek için işe alım servisi gerekiyor.')
  },
  notesByJob: async (): Promise<ApplicationNote[]> => [],
  note: async (): Promise<ApplicationNote | null> => null,
  saveNote: async (): Promise<ApplicationNote | null> => {
    throw new Error('Notlar için işe alım servisi gerekiyor.')
  },
  activity: async (): Promise<ActivityEntry[]> => [],
}
