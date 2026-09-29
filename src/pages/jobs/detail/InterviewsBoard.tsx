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
  toast,
} from '@/components/ui'
import {
  formatUserName,
  INTERVIEW_CONFIRMATION_LABELS,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  interviewConfirmationVariant,
  interviewStatusVariant,
  isOngoing,
  useCancelInterview,
  useUpdateInterview,
  type Interview,
  type InterviewResult,
  type JobInterviewBoard,
} from '@/features/hiring'
import { applicantName, type ApplicationRow } from '@/features/applications'
import { AddToCalendar } from '@/components/AddToCalendar'
import { formatDateTime, formatRelative } from '@/lib/format'
import { cn } from '@/lib/cn'
import { interviewEvent } from './interviewEvent'

const RESULTS: InterviewResult[] = ['POSITIVE', 'UNDECIDED', 'NEGATIVE']

function Card(props: {
  interview: Interview
  application: ApplicationRow | undefined
  jobUid: string
  onEdit: (interview: Interview) => void
}) {
  const navigate = useNavigate()
  const update = useUpdateInterview()
  const cancel = useCancelInterview()
  const i = () => props.interview
  const live = () => isOngoing(i())
  const name = () => (props.application ? applicantName(props.application) : 'Aday')

  const complete = (result: InterviewResult) =>
    update.mutate(
      { uid: i().uid, input: { status: 'COMPLETED', result } },
      {
        onSuccess: () => toast.success(`Mülakat sonuçlandı · ${INTERVIEW_RESULT_LABELS[result]}`),
        onError: () => toast.error('Mülakat güncellenemedi'),
      },
    )

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
          <AppButton size="sm" variant="secondary" class="hidden md:inline-flex" onClick={() => complete('POSITIVE')}>
            Sonuçlandır
          </AppButton>
        </Show>
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
            <AppDropdownItem onSelect={() => props.onEdit(i())}>Düzenle / yeniden planla</AppDropdownItem>
            <AppDropdownSeparator />
            <For each={RESULTS}>
              {(r) => (
                <AppDropdownItem disabled={i().status === 'COMPLETED' && i().result === r} onSelect={() => complete(r)}>
                  Sonuç: {INTERVIEW_RESULT_LABELS[r]}
                </AppDropdownItem>
              )}
            </For>
            <AppDropdownItem
              disabled={i().status !== 'SCHEDULED'}
              onSelect={() =>
                update.mutate(
                  { uid: i().uid, input: { status: 'NO_SHOW' } },
                  { onSuccess: () => toast.info('Katılmadı olarak işaretlendi') },
                )
              }
            >
              Katılmadı olarak işaretle
            </AppDropdownItem>
            <AppDropdownSeparator />
            <AppDropdownItem
              variant="destructive"
              onSelect={() =>
                cancel.mutate(i().uid, {
                  onSuccess: () => toast.success('Mülakat iptal edildi'),
                  onError: () => toast.error('Mülakat iptal edilemedi'),
                })
              }
            >
              Mülakatı iptal et
            </AppDropdownItem>
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
export function InterviewsBoard(props: {
  board: JobInterviewBoard
  applications: ApplicationRow[]
  jobUid: string
  onEdit: (interview: Interview) => void
}) {
  const byApplication = createMemo(() => new Map(props.applications.map((a) => [a.id, a])))
  const all = createMemo(() => [...props.board.ongoing, ...props.board.upcoming, ...props.board.past])

  const card = (i: Interview) => (
    <Card
      interview={i}
      application={byApplication().get(i.applicationUid)}
      jobUid={props.jobUid}
      onEdit={props.onEdit}
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
