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

export const interviewEndsAt = (interview: Interview) =>
  new Date(interview.startsAt).getTime() + interview.durationMinutes * 60_000

/** The meeting time has started, so "how did it go" can be answered. */
export const hasStarted = (interview: Interview, now = Date.now()) => new Date(interview.startsAt).getTime() <= now

/** Still SCHEDULED after its end — nobody recorded the outcome yet. */
export const awaitsOutcome = (interview: Interview, now = Date.now()) =>
  interview.status === 'SCHEDULED' && interviewEndsAt(interview) <= now

export type InterviewAction = 'reschedule' | 'complete' | 'noShow' | 'cancel' | 'reinvite'

/**
 * What can be done to an interview now — mirrors kariyer-recruiting-service's Interview rules:
 * CANCELLED and COMPLETED are closed to rescheduling and cancelling, a result can always be
 * (re)recorded on a completed one, and a no-show or a cancellation is followed by a NEW interview
 * (rescheduling one would leave it marked as it was). An outcome is only asked for once the
 * meeting has started.
 */
export function interviewActions(interview: Interview, now = Date.now()): InterviewAction[] {
  switch (interview.status) {
    case 'SCHEDULED':
      return hasStarted(interview, now) ? ['complete', 'noShow', 'reschedule', 'cancel'] : ['reschedule', 'cancel']
    case 'COMPLETED':
      return ['complete', 'reinvite']
    case 'NO_SHOW':
    case 'CANCELLED':
      return ['reinvite']
  }
}
