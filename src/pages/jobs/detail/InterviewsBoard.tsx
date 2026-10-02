import { createMemo, For, Show, type JSX } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppDropdown,
  AppDropdownContent,
  AppDropdownItem,
  AppDropdownSeparator,
  AppDropdownTrigger,
  AppEmptyState,
  focusRingClass,
} from '@/components/ui'
import {
  formatUserName,
  INTERVIEW_CONFIRMATION_LABELS,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  awaitsOutcome,
  interviewActions,
  interviewConfirmationVariant,
  interviewStatusVariant,
  isOngoing,
  type Interview,
  type JobInterviewBoard,
} from '@/features/hiring'
import { applicantName, type ApplicationRow } from '@/features/applications'
import { AddToCalendar } from '@/components/AddToCalendar'
import { formatDateTime, formatRelative } from '@/lib/format'
import { cn } from '@/lib/cn'
import { interviewEvent } from './interviewEvent'
import type { InterviewManageView } from './InterviewManageModal'

export interface InterviewHandlers {
  /** Opens the interview's manage modal, optionally straight on one step. */
  onManage: (interview: Interview, view?: InterviewManageView) => void
  onReschedule: (interview: Interview) => void
  onReinvite: (interview: Interview) => void
}

function Card(props: InterviewHandlers & { interview: Interview; application: ApplicationRow | undefined }) {
  const navigate = useNavigate()
  const i = () => props.interview
  const live = () => isOngoing(i())
  const name = () => (props.application ? applicantName(props.application) : 'Aday')
  const can = (action: ReturnType<typeof interviewActions>[number]) => interviewActions(i()).includes(action)

  return (
    <article
      class={cn(
        'flex items-start gap-4 rounded-2xl p-5 transition-colors hover:bg-secondary',
        live() && 'bg-secondary',
      )}
    >
      <AppAvatar
        src={props.application?.candidate.avatarUrl}
        name={props.application?.candidate.fullName}
        size="lg"
        interactive
        onClick={() => navigate(`/adaylar/${i().candidateUid}`)}
      />

      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span class="min-w-0 truncate text-foreground">{name()}</span>
          <AppBadge variant={live() ? 'primarySubtle' : interviewStatusVariant[i().status]} size="sm">
            {live() ? 'Şu an görüşmede' : INTERVIEW_STATUS_LABELS[i().status]}
          </AppBadge>
          <Show when={i().status === 'SCHEDULED'}>
            <AppBadge variant={interviewConfirmationVariant[i().confirmationStatus]} size="sm">
              {INTERVIEW_CONFIRMATION_LABELS[i().confirmationStatus]}
            </AppBadge>
          </Show>
          <Show when={awaitsOutcome(i())}>
            <AppBadge variant="warning" size="sm">
              Sonuç bekleniyor
            </AppBadge>
          </Show>
          <Show when={i().result}>
            <AppBadge
              variant={
                i().result === 'POSITIVE' ? 'successSubtle' : i().result === 'NEGATIVE' ? 'destructiveSubtle' : 'muted'
              }
              size="sm"
            >
              {INTERVIEW_RESULT_LABELS[i().result!]}
            </AppBadge>
          </Show>
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span class="text-foreground">{formatDateTime(i().startsAt)}</span>
          <span class="text-muted-foreground">
            {i().durationMinutes} dk · {INTERVIEW_TYPE_LABELS[i().type]}
          </span>
          <span class="text-muted-foreground">· {formatRelative(i().startsAt)}</span>
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>Görüşmeyi yapan: {formatUserName(i().interviewer.name)}</span>
          <span>· Davet eden: {formatUserName(i().invitedBy.name)}</span>
        </div>

        <Show when={i().location}>
          <Show
            when={i().type === 'VIDEO'}
            fallback={<span class="text-sm text-muted-foreground">{i().location}</span>}
          >
            <a
              href={i().location!}
              target="_blank"
              rel="noreferrer noopener"
              class="w-fit truncate text-sm text-primary underline-offset-4 hover:text-primary-hover hover:underline"
            >
              {i().location}
            </a>
          </Show>
        </Show>

        <Show when={i().note}>
          <p class="text-sm whitespace-pre-line text-foreground">{i().note}</p>
        </Show>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <Show when={i().status === 'SCHEDULED'}>
          <AddToCalendar
            size="sm"
            variant="outline"
            label="Takvime ekle"
            placement="bottom-end"
            event={interviewEvent(i(), props.application)}
          />
        </Show>
        <AppButton
          size="sm"
          variant={awaitsOutcome(i()) ? 'primary' : 'secondary'}
          class="hidden md:inline-flex"
          onClick={() => props.onManage(i(), awaitsOutcome(i()) ? 'complete' : 'overview')}
        >
          {awaitsOutcome(i()) ? 'Sonuçlandır' : 'Yönet'}
        </AppButton>
        <AppDropdown placement="bottom-end">
          <AppDropdownTrigger
            aria-label="Mülakat işlemleri"
            class={cn(
              'inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-primary-hover',
              focusRingClass,
            )}
          >
            ⋯
          </AppDropdownTrigger>
          <AppDropdownContent>
            <AppDropdownItem onSelect={() => props.onManage(i())}>Mülakatı yönet</AppDropdownItem>
            <Show when={can('reschedule')}>
              <AppDropdownItem onSelect={() => props.onReschedule(i())}>Yeniden planla</AppDropdownItem>
            </Show>
            <Show when={can('complete')}>
              <AppDropdownItem onSelect={() => props.onManage(i(), 'complete')}>
                {i().status === 'COMPLETED' ? 'Sonucu düzenle' : 'Sonuçlandır'}
              </AppDropdownItem>
            </Show>
            <Show when={can('noShow')}>
              <AppDropdownItem onSelect={() => props.onManage(i(), 'noShow')}>Katılmadı olarak işaretle</AppDropdownItem>
            </Show>
            <Show when={can('reinvite')}>
              <AppDropdownItem onSelect={() => props.onReinvite(i())}>Yeni mülakat planla</AppDropdownItem>
            </Show>
            <Show when={can('cancel')}>
              <AppDropdownSeparator />
              <AppDropdownItem variant="destructive" onSelect={() => props.onManage(i(), 'cancel')}>
                Mülakatı iptal et
              </AppDropdownItem>
            </Show>
          </AppDropdownContent>
        </AppDropdown>
      </div>
    </article>
  )
}

function Group(props: { title: string; count: number; children: JSX.Element }) {
  return (
    <Show when={props.count > 0}>
      <section class="flex flex-col gap-2">
        <h3 class="px-1 text-sm text-muted-foreground">
          {props.title} ({props.count})
        </h3>
        <div class="flex flex-col">{props.children}</div>
      </section>
    </Show>
  )
}

/** Devam eden · yaklaşan · geçmiş mülakatlar for this posting — grouped by the service. */
export function InterviewsBoard(
  props: InterviewHandlers & {
    board: JobInterviewBoard
    applications: ApplicationRow[]
  },
) {
  const byApplication = createMemo(() => new Map(props.applications.map((a) => [a.id, a])))
  const all = createMemo(() => [...props.board.ongoing, ...props.board.upcoming, ...props.board.past])

  const card = (i: Interview) => (
    <Card
      interview={i}
      application={byApplication().get(i.applicationUid)}
      onManage={props.onManage}
      onReschedule={props.onReschedule}
      onReinvite={props.onReinvite}
    />
  )

  return (
    <Show
      when={all().length > 0}
      fallback={
        <AppEmptyState
          variant="plain"
          title="Mülakat yok"
          description="Başvuranlar sekmesinden bir adayı mülakata davet edin; planlanan görüşmeler burada toplanır."
        />
      }
    >
      <div class="flex flex-col gap-8">
        <Group title="Devam eden" count={props.board.ongoing.length}>
          <For each={props.board.ongoing}>{card}</For>
        </Group>
        <Group title="Yaklaşan" count={props.board.upcoming.length}>
          <For each={props.board.upcoming}>{card}</For>
        </Group>
        <Group title="Geçmiş" count={props.board.past.length}>
          <For each={props.board.past}>{card}</For>
        </Group>
      </div>
    </Show>
  )
}
