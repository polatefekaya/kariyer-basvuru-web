import type { Interview, InterviewConfirmation, InterviewStatus } from './types'

export const isOngoing = (interview: Interview, now = Date.now()) =>
  interview.status === 'SCHEDULED' &&
  new Date(interview.startsAt).getTime() <= now &&
  now < new Date(interview.startsAt).getTime() + interview.durationMinutes * 60_000

export const isUpcoming = (interview: Interview, now = Date.now()) =>
  interview.status === 'SCHEDULED' && new Date(interview.startsAt).getTime() > now

export const isPast = (interview: Interview, now = Date.now()) =>
  !isOngoing(interview, now) && !isUpcoming(interview, now)

export const interviewStatusVariant: Record<
  InterviewStatus,
  'primarySubtle' | 'success' | 'muted' | 'destructiveSubtle'
> = {
  SCHEDULED: 'primarySubtle',
  COMPLETED: 'success',
  CANCELLED: 'muted',
  NO_SHOW: 'destructiveSubtle',
}

/** The candidate's own answer to the invitation, which they give from the e-mail link. */
export const interviewConfirmationVariant: Record<
  InterviewConfirmation,
  'successSubtle' | 'destructiveSubtle' | 'secondary' | 'muted'
> = {
  PENDING: 'secondary',
  ACCEPTED: 'successSubtle',
  DECLINED: 'destructiveSubtle',
  EXPIRED: 'muted',
}

/** The interview a row leads with: the live one, else the next, else the most recent. */
export function headlineInterview(interviews: Interview[], now = Date.now()): Interview | undefined {
  return (
    interviews.find((i) => isOngoing(i, now)) ??
    [...interviews].filter((i) => isUpcoming(i, now)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ??
    [...interviews].sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0]
  )
}
