import { createMemo, createSignal, For, Show } from 'solid-js'
import { Collapsible } from '@kobalte/core/collapsible'
import { ChevronDown } from 'lucide-solid'
import { AppSkeleton, focusRingClass } from '@/components/ui'
import {
  STAGE_LABELS,
  useApplicationActivity,
  type ActivityEntry,
  type ApplicationStage,
} from '@/features/applications'
import { INTERVIEW_RESULT_LABELS, type InterviewResult } from '@/features/hiring'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'

const stage = (value: unknown) =>
  typeof value === 'string' && value in STAGE_LABELS ? STAGE_LABELS[value as ApplicationStage] : null

/** What happened, in one sentence. Unknown shapes fall back to the bare event name. */
function describe(entry: ActivityEntry): string {
  const meta = entry.metadata ?? {}

  switch (entry.type) {
    case 'APPLICATION_CREATED':
      return 'Başvuru alındı'

    case 'STAGE_CHANGED': {
      const to = stage(meta.to)
      const from = stage(meta.from)
      if (!to) return 'Durum değişti'
      return from ? `Durum ${from} → ${to}` : `Durum ${to} olarak güncellendi`
    }

    case 'NOTE_SAVED':
      return 'Not güncellendi'

    case 'NOTE_CLEARED':
      return 'Not silindi'

    case 'INTERVIEW_CREATED':
      return typeof meta.startsAt === 'string'
        ? `Mülakat planlandı · ${formatDateTime(meta.startsAt)}`
        : 'Mülakata davet edildi'

    case 'INTERVIEW_UPDATED': {
      if (meta.confirmation === 'ACCEPTED') return 'Aday daveti kabul etti'
      if (meta.confirmation === 'DECLINED') return 'Aday daveti reddetti'
      if (typeof meta.result === 'string' && meta.result in INTERVIEW_RESULT_LABELS) {
        return `Mülakat sonucu: ${INTERVIEW_RESULT_LABELS[meta.result as InterviewResult]}`
      }
      return typeof meta.startsAt === 'string'
        ? `Mülakat güncellendi · ${formatDateTime(meta.startsAt)}`
        : 'Mülakat güncellendi'
    }

    case 'INTERVIEW_CANCELLED':
      return 'Mülakat iptal edildi'

    case 'INTERVIEW_COMPLETED':
      return 'Mülakat tamamlandı'

    case 'MESSAGE_SENT':
      return 'Adaya mesaj gönderildi'

    case 'CV_VIEWED':
      return 'Özgeçmiş görüntülendi'

    case 'CV_DOWNLOADED':
      return 'Özgeçmiş indirildi'

    default:
      return entry.type
  }
}

export interface ApplicationActivityProps {
  applicationUid: string
  /** How many entries to show; the rest stay in the service. */
  limit?: number
}

/**
 * The application's own history: every stage move, interview and note, newest first. Folded by
 * default so it doesn't crowd the note above it; the query still runs so unfolding is instant.
 */
export function ApplicationActivity(props: ApplicationActivityProps) {
  const activity = useApplicationActivity(() => props.applicationUid)
  const entries = createMemo(() => (activity.data ?? []).slice(0, props.limit ?? 8))
  const [open, setOpen] = createSignal(false)

  return (
    <Collapsible as="section" open={open()} onOpenChange={setOpen} class="flex max-w-4xl flex-col gap-2">
      <Collapsible.Trigger
        class={cn(
          'inline-flex cursor-pointer items-center gap-1.5 self-start rounded-2xl text-sm text-muted-foreground transition-colors select-none hover:text-foreground',
          focusRingClass,
        )}
      >
        Geçmiş
        <Show when={!activity.isPending && entries().length > 0}>
          <span>· {entries().length}</span>
        </Show>
        <ChevronDown class={cn('size-4 transition-transform duration-200', open() && 'rotate-180')} />
      </Collapsible.Trigger>

      <Collapsible.Content class="overflow-hidden data-[expanded]:animate-collapsible-down data-[closed]:animate-collapsible-up">
        <Show
          when={!activity.isPending}
          fallback={
            <div class="flex flex-col gap-2" aria-busy="true">
              <For each={[0, 1, 2]}>{() => <AppSkeleton variant="text" width="42%" />}</For>
            </div>
          }
        >
          <Show
            when={entries().length > 0}
            fallback={<span class="text-sm text-muted-foreground">Bu başvuruda henüz bir hareket yok.</span>}
          >
            <ol class="flex flex-col gap-2">
              <For each={entries()}>
                {(entry) => (
                  <li class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                    <span class="text-foreground">{describe(entry)}</span>
                    <span class="text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                      {entry.actorName ? ` · ${entry.actorName}` : ''}
                    </span>
                  </li>
                )}
              </For>
            </ol>
          </Show>
        </Show>
      </Collapsible.Content>
    </Collapsible>
  )
}
