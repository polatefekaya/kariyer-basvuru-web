import { For, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { Collapsible } from '@kobalte/core/collapsible'
import { CalendarCog, CalendarPlus, StickyNote, User } from 'lucide-solid'
import { AddToCalendar } from '@/components/AddToCalendar'
import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppDropdown,
  AppDropdownContent,
  AppDropdownItem,
  AppDropdownSeparator,
  AppDropdownTrigger,
  AppTooltip,
  focusRingClass,
} from '@/components/ui'
import { applicantName, matchTone, stageVariant, type ApplicationNote, type ApplicationRow } from '@/features/applications'
import {
  formatUserName,
  INTERVIEW_CONFIRMATION_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_TYPE_LABELS,
  awaitsOutcome,
  headlineInterview,
  interviewStatusVariant,
  isOngoing,
  type Interview,
} from '@/features/hiring'
import { formatDateTime, formatRelative } from '@/lib/format'
import { track } from '@/lib/analytics'
import config from '@/config/config'
import { cn } from '@/lib/cn'
import { ApplicationActivity, useStageChange } from '@/components/applications'
import { ApplicantNotes } from './ApplicantNotes'
import { interviewEvent } from './interviewEvent'

export interface ApplicantRowProps {
  row: ApplicationRow
  interviews: Interview[]
  note: ApplicationNote | undefined
  jobUid: string
  /** Schedule a new interview with this applicant. */
  onInvite: (row: ApplicationRow) => void
  /** Open an existing interview's manage modal. */
  onManageInterview: (interview: Interview) => void
  notesOpen: boolean
  onNotesOpenChange: (open: boolean) => void
}

/**
 * One applicant of this posting: stage, match, interview state, note and the actions. Clicking the
 * row opens it in place (note, interviews, history); the profile has its own button.
 */
export function ApplicantRow(props: ApplicantRowProps) {
  const navigate = useNavigate()
  const next = () => headlineInterview(props.interviews)
  const expandable = () => config.HAS_PIPELINE
  const toggle = () => props.onNotesOpenChange(!props.notesOpen)
  const interviewAction = () => {
    const interview = next()
    if (interview) props.onManageInterview(interview)
    else props.onInvite(props.row)
  }
  const interviewActionLabel = () =>
    !next() ? 'Mülakata davet et' : awaitsOutcome(next()!) ? 'Mülakatı sonuçlandır' : 'Mülakatı yönet'

  const openProfile = () => {
    track('candidate_detail_opened', { applicationId: props.row.id, jobId: props.row.job.uid, source: 'list' })
    navigate(`/adaylar/${props.row.candidate.id}`)
  }
  const tone = () => matchTone(props.row.score)

  const stage = useStageChange({ row: () => props.row, subject: () => applicantName(props.row) })

  return (
    <Collapsible
      as="article"
      open={props.notesOpen}
      onOpenChange={props.onNotesOpenChange}
      // Expanded, the card is a workspace (note editor, history) — a hover tint there reads as a highlight.
      class={cn('@container flex w-full flex-col rounded-2xl transition-colors', !props.notesOpen && 'hover:bg-secondary')}
    >
      <div
        class={cn('flex items-start gap-4 rounded-2xl p-5', expandable() && 'cursor-pointer select-none', focusRingClass)}
        role={expandable() ? 'button' : undefined}
        tabIndex={expandable() ? 0 : undefined}
        aria-expanded={expandable() ? props.notesOpen : undefined}
        aria-label={expandable() ? `${applicantName(props.row)} · ayrıntıları ${props.notesOpen ? 'gizle' : 'göster'}` : undefined}
        onClick={(e) => {
          if (!expandable() || (e.target as Element).closest('button, a, [role="menu"]')) return
          toggle()
        }}
        onKeyDown={(e) => {
          if (!expandable() || (e.key !== 'Enter' && e.key !== ' ')) return
          if ((e.target as Element).closest('button, a, [role="menu"]')) return
          e.preventDefault()
          toggle()
        }}
      >
        <AppAvatar src={props.row.candidate.avatarUrl} name={props.row.candidate.fullName} size="lg" />

        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span class="min-w-0 truncate text-foreground">{applicantName(props.row)}</span>
            <AppBadge variant={stageVariant[props.row.stage]} size="sm">
              {props.row.stageLabel}
            </AppBadge>
            <Show when={config.HAS_PIPELINE}>
              <AppTooltip content={props.notesOpen ? 'Notu gizle' : props.note ? 'Notu gör' : 'Not yaz'}>
                <Collapsible.Trigger
                  class={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm transition-colors [&_svg]:size-4',
                    props.notesOpen || props.note ? 'text-foreground' : 'text-muted-foreground',
                    'hover:bg-secondary-hover hover:text-primary-hover',
                    focusRingClass,
                  )}
                  aria-label={props.note ? 'Notu gör' : 'Not yaz'}
                >
                  <StickyNote />
                  Not
                </Collapsible.Trigger>
              </AppTooltip>
            </Show>
          </div>

          <span class="truncate text-sm text-muted-foreground">
            {[props.row.candidate.email, props.row.candidate.phone, props.row.candidate.location]
              .filter(Boolean)
              .join(' · ')}
          </span>

          <Show when={next()}>
            <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <AppBadge variant={isOngoing(next()!) ? 'primarySubtle' : 'secondary'} size="sm">
                {isOngoing(next()!) ? 'Şu an görüşmede' : INTERVIEW_STATUS_LABELS[next()!.status]}
              </AppBadge>
              <span class="text-foreground">{formatDateTime(next()!.startsAt)}</span>
              <span class="text-muted-foreground">
                {INTERVIEW_TYPE_LABELS[next()!.type]} · {formatUserName(next()!.interviewer.name)}
              </span>
              <span class="text-muted-foreground">· davet: {formatUserName(next()!.invitedBy.name)}</span>
              <Show when={next()!.confirmationStatus !== 'PENDING'}>
                <span class={cn(next()!.confirmationStatus === 'ACCEPTED' ? 'text-success' : 'text-muted-foreground')}>
                  · {INTERVIEW_CONFIRMATION_LABELS[next()!.confirmationStatus]}
                </span>
              </Show>
              <Show when={next()!.status === 'SCHEDULED'}>
                <AddToCalendar
                  size="xs"
                  variant="ghost"
                  label="Takvime ekle"
                  event={interviewEvent(next()!, props.row)}
                />
              </Show>
            </div>
          </Show>
        </div>

        <div class="flex shrink-0 items-center gap-4">
          <div class="hidden flex-col items-end gap-1.5 text-sm text-muted-foreground @2xl:flex">
            <span>{formatRelative(props.row.appliedAt)} başvurdu</span>
            <Show
              when={props.row.score != null}
              fallback={<span class="text-muted-foreground">Uyum hesaplanmadı</span>}
            >
              <span
                class={cn(
                  tone() === 'success' ? 'text-success' : tone() === 'foreground' ? 'text-foreground' : undefined,
                )}
              >
                %{Math.round(props.row.score!)} uyum
              </span>
            </Show>
          </div>

          <AppButton size="sm" variant="ghost" leftIcon={<User />} class="hidden md:inline-flex" onClick={openProfile}>
            Profil
          </AppButton>

          <Show when={config.HAS_PIPELINE}>
            <AppButton
              size="sm"
              variant={next() && awaitsOutcome(next()!) ? 'primary' : 'secondary'}
              leftIcon={next() ? <CalendarCog /> : <CalendarPlus />}
              class="hidden md:inline-flex"
              onClick={interviewAction}
            >
              {interviewActionLabel()}
            </AppButton>
          </Show>

          <AppDropdown placement="bottom-end">
            <AppDropdownTrigger
              aria-label="Başvuru işlemleri"
              class={cn(
                'inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-primary-hover',
                focusRingClass,
              )}
            >
              ⋯
            </AppDropdownTrigger>
            <AppDropdownContent>
              {/* The service decides which moves are legal and returns them per row. */}
              <For each={props.row.allowedActions}>
                {(to) => (
                  <AppDropdownItem
                    variant={to === 'REJECTED' ? 'destructive' : undefined}
                    onSelect={() => stage.request(to)}
                  >
                    {stage.label(to)}
                  </AppDropdownItem>
                )}
              </For>
              <AppDropdownSeparator />
              <Show when={config.HAS_PIPELINE}>
                <AppDropdownItem onSelect={interviewAction}>
                  {next() ? <CalendarCog /> : <CalendarPlus />} {interviewActionLabel()}
                </AppDropdownItem>
                <Show when={next()}>
                  <AppDropdownItem onSelect={() => props.onInvite(props.row)}>
                    <CalendarPlus /> Yeni mülakat planla
                  </AppDropdownItem>
                </Show>
                <AppDropdownItem onSelect={() => props.onNotesOpenChange(!props.notesOpen)}>
                  <StickyNote /> {props.note ? 'Notu gör' : 'Not yaz'}
                </AppDropdownItem>
              </Show>
              <AppDropdownItem onSelect={openProfile}>
                <User /> Aday profilini aç
              </AppDropdownItem>
            </AppDropdownContent>
          </AppDropdown>
        </div>
      </div>

      <Show when={config.HAS_PIPELINE}>
        <Collapsible.Content class="overflow-hidden data-[expanded]:animate-collapsible-down data-[closed]:animate-collapsible-up">
          <div class="flex flex-col gap-6 border-t border-border px-5 py-5 pl-[5.25rem]">
            <Show when={props.interviews.length > 0}>
              <section class="flex max-w-4xl flex-col gap-2">
                <h4 class="text-sm text-muted-foreground">Mülakatlar</h4>
                <ul class="flex flex-col">
                  <For each={[...props.interviews].sort((a, b) => b.startsAt.localeCompare(a.startsAt))}>
                    {(interview) => (
                      <li>
                        <button
                          type="button"
                          onClick={() => props.onManageInterview(interview)}
                          class={cn(
                            '-mx-3 flex w-[calc(100%+1.5rem)] cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-3 py-2 text-left text-sm transition-colors select-none hover:bg-secondary',
                            focusRingClass,
                          )}
                        >
                          <span class="text-foreground">{formatDateTime(interview.startsAt)}</span>
                          <span class="text-muted-foreground">{INTERVIEW_TYPE_LABELS[interview.type]}</span>
                          <AppBadge
                            variant={awaitsOutcome(interview) ? 'warning' : interviewStatusVariant[interview.status]}
                            size="sm"
                          >
                            {awaitsOutcome(interview) ? 'Sonuç bekleniyor' : INTERVIEW_STATUS_LABELS[interview.status]}
                          </AppBadge>
                          <Show when={interview.result}>
                            <span class="text-muted-foreground">· {INTERVIEW_RESULT_LABELS[interview.result!]}</span>
                          </Show>
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </section>
            </Show>
            <ApplicantNotes application={props.row} note={props.note} jobUid={props.jobUid} />
            <ApplicationActivity applicationUid={props.row.id} />
          </div>
        </Collapsible.Content>
      </Show>

      <stage.Confirm />
    </Collapsible>
  )
}
