import { For, Show } from 'solid-js'
import { AppBadge } from '@/components/ui'
import { ApplicationActivity } from '@/components/applications'
import { useApplicationNote, type ApplicationRow } from '@/features/applications'
import {
  formatUserName,
  INTERVIEW_CONFIRMATION_LABELS,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  interviewConfirmationVariant,
  interviewStatusVariant,
  isOngoing,
  type Interview,
} from '@/features/hiring'
import { ApplicantNotes } from '@/pages/jobs/detail/ApplicantNotes'
import { formatDateTime } from '@/lib/format'
import config from '@/config/config'

function InterviewLine(props: { interview: Interview }) {
  const i = () => props.interview
  const live = () => isOngoing(i())

  return (
    <li class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <AppBadge variant={live() ? 'primarySubtle' : interviewStatusVariant[i().status]} size="sm">
        {live() ? 'Şu an görüşmede' : INTERVIEW_STATUS_LABELS[i().status]}
      </AppBadge>
      <span class="text-foreground">{formatDateTime(i().startsAt)}</span>
      <span class="text-muted-foreground">
        {INTERVIEW_TYPE_LABELS[i().type]} · {formatUserName(i().interviewer.name)}
      </span>
      <span class="text-muted-foreground">· davet: {formatUserName(i().invitedBy.name)}</span>
      <Show when={i().status === 'SCHEDULED'}>
        <AppBadge variant={interviewConfirmationVariant[i().confirmationStatus]} size="sm">
          {INTERVIEW_CONFIRMATION_LABELS[i().confirmationStatus]}
        </AppBadge>
      </Show>
      <Show when={i().result}>
        <span class="text-muted-foreground">· {INTERVIEW_RESULT_LABELS[i().result!]}</span>
      </Show>
    </li>
  )
}

export interface CandidateApplicationDetailProps {
  row: ApplicationRow
  /** This candidate's interviews across the company, already filtered to this application. */
  interviews: Interview[]
}

/**
 * What the company knows about one of this candidate's applications: the interviews booked for it,
 * the team's note and the application's own history. Everything here is scoped to the company's
 * own postings — another employer's process is not ours to show.
 */
export function CandidateApplicationDetail(props: CandidateApplicationDetailProps) {
  const note = useApplicationNote(() => props.row.id)

  return (
    <div class="flex flex-col gap-6 px-4 pt-1 pb-5">
      <Show when={props.interviews.length > 0}>
        <section class="flex flex-col gap-2">
          <h4 class="text-sm text-muted-foreground">Mülakatlar</h4>
          <ol class="flex flex-col gap-2">
            <For each={props.interviews}>{(interview) => <InterviewLine interview={interview} />}</For>
          </ol>
        </section>
      </Show>

      {/* Notes and the trail are the recruiting service's tables; without it there is nothing to
          show and nowhere to save. */}
      <Show when={config.HAS_PIPELINE}>
        <ApplicantNotes application={props.row} note={note.data ?? undefined} jobUid={props.row.job.uid} />
        <ApplicationActivity applicationUid={props.row.id} limit={6} />
      </Show>
    </div>
  )
}
