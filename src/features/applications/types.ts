import type { ISODateString } from '@/features/common/types'
import type { ApplicationStage } from './stages'

export type { ApplicationStage }

export interface CandidateRef {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  location: string | null
  avatarUrl: string | null
}

export interface JobRef {
  uid: string
  title: string
}

export interface InterviewSummary {
  id: string
  startsAt: ISODateString
  durationMinutes: number
  type: InterviewType
  status: InterviewStatus
  confirmationStatus: InterviewConfirmation
}

export type InterviewType = 'VIDEO' | 'PHONE' | 'IN_PERSON'
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type InterviewConfirmation = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
export type InterviewResult = 'POSITIVE' | 'NEGATIVE' | 'UNDECIDED'

/** One row of `GET /jobs/:uid/applications` and `GET /company/applications`. */
export interface ApplicationRow {
  id: string
  job: JobRef
  candidate: CandidateRef
  stage: ApplicationStage
  stageLabel: string
  score: number | null
  resumeId: number | null
  appliedAt: ISODateString
  lastActivityAt: ISODateString | null
  hasNote: boolean
  nextInterview: InterviewSummary | null
  /** Stages this application may move to next; the service decides, the UI only renders. */
  allowedActions: ApplicationStage[]
}

export interface ApplicationPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApplicationListResponse {
  items: ApplicationRow[]
  pagination: ApplicationPagination
  /** Stage → count, plus `ALL`. Empty on the company-wide list. */
  stats: Record<string, number>
}

export interface ApplicationListParams {
  status?: ApplicationStage
  q?: string
  sort?: 'appliedAt:desc' | 'appliedAt:asc' | 'stage:asc'
  page?: number
  limit?: number
}

export interface CompanyApplicationParams extends ApplicationListParams {
  jobUid?: string
  candidateUid?: string
}

export interface ApplicationStatsResponse {
  stages: Record<string, number>
  interviews: { total: number; scheduled: number }
}

export interface ChangeStageResponse {
  applicationUid: string
  stage: ApplicationStage
  stageLabel: string
  allowedActions: ApplicationStage[]
}

export interface ApplicationNote {
  applicationUid: string
  candidateUid: string
  body: string
  author: HiringUser
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface HiringUser {
  uid: string
  name: string
  position?: string | null
  photoUrl?: string | null
}

export interface ActivityEntry {
  id: number
  type: string
  actorUid: string | null
  actorName: string | null
  metadata: Record<string, unknown>
  createdAt: ISODateString
}
