const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function formatUserName(name?: string | null, fallback = 'Yetkili'): string {
  if (!name) return fallback
  const trimmed = name.trim()
  if (!trimmed || UUID_REGEX.test(trimmed)) {
    return fallback
  }
  return trimmed
}

import type { ISODateString } from '@/features/common/types'
import type {
  HiringUser,
  InterviewConfirmation,
  InterviewResult,
  InterviewStatus,
  InterviewType,
} from '@/features/applications/types'

export type { HiringUser, InterviewConfirmation, InterviewResult, InterviewStatus, InterviewType }

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  VIDEO: 'Online',
  PHONE: 'Telefon',
  IN_PERSON: 'Ofiste',
}

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  SCHEDULED: 'Planlandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal edildi',
  NO_SHOW: 'Katılmadı',
}

export const INTERVIEW_RESULT_LABELS: Record<InterviewResult, string> = {
  POSITIVE: 'Olumlu',
  NEGATIVE: 'Olumsuz',
  UNDECIDED: 'Kararsız',
}

export const INTERVIEW_CONFIRMATION_LABELS: Record<InterviewConfirmation, string> = {
  PENDING: 'Yanıt bekleniyor',
  ACCEPTED: 'Aday onayladı',
  DECLINED: 'Aday reddetti',
  EXPIRED: 'Yanıtlanmadı',
}

export type ParticipantRole = 'RECRUITER' | 'INTERVIEWER' | 'OBSERVER'

export interface InterviewParticipant {
  email: string
  name: string | null
  role: ParticipantRole
}

export interface Interview {
  uid: string
  applicationUid: string
  jobUid: string
  candidateUid: string
  type: InterviewType
  startsAt: ISODateString
  durationMinutes: number
  timeZone: string
  /** Meeting link for VIDEO, address for IN_PERSON, phone number for PHONE. */
  location: string | null
  status: InterviewStatus
  confirmationStatus: InterviewConfirmation
  result: InterviewResult | null
  /** Internal; never leaves the company. */
  note: string | null
  /** What the invitation e-mail carries to the candidate. */
  candidateMessage: string | null
  interviewer: HiringUser
  /** Davet eden. */
  invitedBy: HiringUser
  participants: InterviewParticipant[]
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface JobInterviewBoard {
  ongoing: Interview[]
  upcoming: Interview[]
  past: Interview[]
}

export interface InterviewCreateInput {
  type: InterviewType
  startsAt: ISODateString
  durationMinutes: number
  timeZone?: string
  videoUrl?: string | null
  location?: string | null
  candidateMessage?: string | null
  internalNote?: string | null
  interviewerUid?: string
  participants?: { email: string; role: ParticipantRole; name?: string | null }[]
}

export interface InterviewUpdateInput {
  status?: InterviewStatus
  result?: InterviewResult
  type?: InterviewType
  startsAt?: ISODateString
  durationMinutes?: number
  timeZone?: string
  location?: string | null
  videoUrl?: string | null
  candidateMessage?: string | null
  note?: string | null
  interviewerUid?: string
}
