import { createMemo, createSignal, For, Show, type JSX } from 'solid-js'
import { Collapsible } from '@kobalte/core/collapsible'
import { ChevronDown } from 'lucide-solid'
import { AppAlert, AppBadge, AppEmptyState, AppSkeleton, focusRingClass } from '@/components/ui'
import {
  isOpenStage,
  matchTone,
  stageVariant,
  useCompanyApplications,
  type ApplicationRow,
} from '@/features/applications'
import { useCandidateInterviews, type Interview } from '@/features/hiring'
import { formatDate, formatRelative } from '@/lib/format'
import { cn } from '@/lib/cn'
import { CandidateApplicationDetail } from './CandidateApplicationDetail'

function ApplicationLine(props: {
  row: ApplicationRow
  interviews: Interview[]
  expanded: boolean
  onExpandedChange: (open: boolean) => void
}) {
  const tone = () => matchTone(props.row.score)
  const scheduled = () => props.interviews.filter((i) => i.status === 'SCHEDULED').length

  return (
    <Collapsible
      as="article"
      open={props.expanded}
      onOpenChange={props.onExpandedChange}
      class="flex flex-col rounded-2xl transition-colors hover:bg-secondary"
    >
      <Collapsible.Trigger
        class={cn(
          'flex w-full cursor-pointer flex-col gap-2 rounded-2xl px-4 py-3.5 text-left @lg:flex-row @lg:items-center @lg:gap-4',
          focusRingClass,
        )}
      >
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="flex min-w-0 flex-wrap items-center gap-2">
            <span class="min-w-0 truncate text-foreground">{props.row.job.title}</span>
            <AppBadge variant={stageVariant[props.row.stage]} size="sm">
              {props.row.stageLabel}
            </AppBadge>
          </div>
          <Show when={props.row.nextInterview}>
            <span class="truncate text-sm text-muted-foreground">
              Mülakat: {formatDate(props.row.nextInterview!.startsAt)}
              {scheduled() > 1 ? ` · ${scheduled()} planlı görüşme` : ''}
            </span>
          </Show>
        </div>
        <div class="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
          <Show when={props.row.score != null}>
            <span
              class={cn(
                tone() === 'success' ? 'text-success' : tone() === 'foreground' ? 'text-foreground' : undefined,
              )}
            >
              %{Math.round(props.row.score!)} uyum
            </span>
          </Show>
          <span title={formatDate(props.row.appliedAt)}>{formatRelative(props.row.appliedAt)} başvurdu</span>
          <ChevronDown class={cn('size-4 transition-transform', props.expanded && 'rotate-180')} aria-hidden="true" />
        </div>
      </Collapsible.Trigger>

      <Collapsible.Content class="overflow-hidden data-[expanded]:animate-collapsible-down data-[closed]:animate-collapsible-up">
        <CandidateApplicationDetail row={props.row} interviews={props.interviews} />
      </Collapsible.Content>
    </Collapsible>
  )
}

function Group(props: {
  title: string
  rows: ApplicationRow[]
  interviewsFor: (uid: string) => Interview[]
  expanded: ReadonlySet<string>
  onExpandedChange: (uid: string, open: boolean) => void
}) {
  return (
    <Show when={props.rows.length > 0}>
      <section class="flex flex-col gap-2">
        <h3 class="px-1 text-sm text-muted-foreground">
          {props.title} ({props.rows.length})
        </h3>
        <div class="flex flex-col">
          <For each={props.rows}>
            {(row) => (
              <ApplicationLine
                row={row}
                interviews={props.interviewsFor(row.id)}
                expanded={props.expanded.has(row.id)}
                onExpandedChange={(open) => props.onExpandedChange(row.id, open)}
              />
            )}
          </For>
        </div>
      </section>
    </Show>
  )
}

/** This candidate's applications to the company's own postings — never another employer's. */
export function CandidateApplications(props: { candidateUid: string }): JSX.Element {
  const query = useCompanyApplications(() => ({ candidateUid: props.candidateUid, limit: 100 }))
  const interviews = useCandidateInterviews(() => props.candidateUid)

  const rows = createMemo(() => query.data?.items ?? [])
  const active = createMemo(() => rows().filter((r) => isOpenStage(r.stage)))
  const past = createMemo(() => rows().filter((r) => !isOpenStage(r.stage)))

  const byApplication = createMemo(() => {
    const map = new Map<string, Interview[]>()
    for (const interview of interviews.data ?? []) {
      const list = map.get(interview.applicationUid)
      if (list) list.push(interview)
      else map.set(interview.applicationUid, [interview])
    }
    for (const list of map.values()) list.sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    return map
  })
  const interviewsFor = (uid: string) => byApplication().get(uid) ?? []

  // Held here rather than in the row: the groups are rebuilt whenever a note or stage changes.
  const [open, setOpen] = createSignal<ReadonlySet<string>>(new Set())
  const toggle = (uid: string, expanded: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (expanded) next.add(uid)
      else next.delete(uid)
      return next
    })

  return (
    <Show
      when={!query.isPending}
      fallback={
        <div class="flex flex-col gap-3">
          <For each={[0, 1, 2]}>{() => <AppSkeleton height={64} class="rounded-2xl" />}</For>
        </div>
      }
    >
      <Show
        when={!query.isError}
        fallback={<AppAlert variant="destructive" title="Başvurular yüklenemedi" description="Sunucuya ulaşılamadı." />}
      >
        <Show
          when={rows().length > 0}
          fallback={
            <AppEmptyState variant="plain" title="Başvuru yok" description="Bu aday henüz ilanlarınıza başvurmamış." />
          }
        >
          <div class="flex flex-col gap-8">
            <Group
              title="Aktif başvurular"
              rows={active()}
              interviewsFor={interviewsFor}
              expanded={open()}
              onExpandedChange={toggle}
            />
            <Group
              title="Geçmiş başvurular"
              rows={past()}
              interviewsFor={interviewsFor}
              expanded={open()}
              onExpandedChange={toggle}
            />
            <p class="px-1 text-sm text-muted-foreground">
              Yalnızca kendi ilanlarınıza yapılan {rows().length} başvuru gösteriliyor. Bir başvuruya dokunduğunuzda
              mülakatları, notu ve geçmişi açılır.
            </p>
          </div>
        </Show>
      </Show>
    </Show>
  )
}
