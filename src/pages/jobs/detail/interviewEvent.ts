import { INTERVIEW_TYPE_LABELS, type Interview } from '@/features/hiring'
import type { ApplicationRow } from '@/features/applications'
import type { CalendarEvent } from '@/lib/calendar'

/** The interview as a calendar entry — what "Takvime ekle" hands to Google/Outlook/.ics. */
export function interviewEvent(interview: Interview, application?: ApplicationRow): CalendarEvent {
  const who = application?.candidate.fullName ?? 'Aday'
  const job = application?.job.title

  return {
    id: interview.uid,
    title: `Mülakat · ${who}${job ? ` · ${job}` : ''}`,
    start: new Date(interview.startsAt),
    end: new Date(new Date(interview.startsAt).getTime() + interview.durationMinutes * 60_000),
    description: [
      job ? `İlan: ${job}` : '',
      `Görüşme şekli: ${INTERVIEW_TYPE_LABELS[interview.type]}`,
      `Görüşmeyi yapan: ${interview.interviewer.name}`,
      `Davet eden: ${interview.invitedBy.name}`,
      interview.note ? `Not: ${interview.note}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    location: interview.location ?? undefined,
    url: `${window.location.origin}/adaylar/${interview.candidateUid}`,
    reminderMinutes: 30,
  }
}
