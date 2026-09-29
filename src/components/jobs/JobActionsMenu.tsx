import { Show, type JSX } from 'solid-js'
import { Copy, MoreHorizontal, Pencil, PlayCircle, Trash2, Users, XCircle } from 'lucide-solid'
import {
  AppButton,
  AppDropdown,
  AppDropdownContent,
  AppDropdownItem,
  AppDropdownSeparator,
  AppDropdownTrigger,
} from '@/components/ui'
import type { JobListItem, JobStatus } from '@/features/jobs'

export interface JobActionHandlers {
  onOpen?: (job: JobListItem) => void
  onEdit?: (job: JobListItem) => void
  onDuplicate?: (job: JobListItem) => void
  onSetStatus?: (job: JobListItem, status: JobStatus) => void
  onDelete?: (job: JobListItem) => void
}

/** The `⋯` menu shared by JobRow and JobCard. Items appear only when their handler is provided. */
export function JobActionsMenu(props: JobActionHandlers & { job: JobListItem; trigger?: JSX.Element; class?: string }) {
  const stop = (e: Event) => e.stopPropagation()
  return (
    <AppDropdown placement="bottom-end">
      <AppDropdownTrigger
        as={AppButton}
        variant="ghost"
        size="iconSm"
        aria-label="İlan işlemleri"
        onClick={stop}
        class={props.class}
      >
        {props.trigger ?? <MoreHorizontal />}
      </AppDropdownTrigger>
      <AppDropdownContent class="w-52" onClick={stop}>
        <Show when={props.onOpen}>
          <AppDropdownItem biggerText onSelect={() => props.onOpen!(props.job)}>
            <Users /> Başvuruları gör
          </AppDropdownItem>
        </Show>
        <Show when={props.onEdit}>
          <AppDropdownItem biggerText onSelect={() => props.onEdit!(props.job)}>
            <Pencil /> Düzenle
          </AppDropdownItem>
        </Show>
        <Show when={props.onDuplicate}>
          <AppDropdownItem biggerText onSelect={() => props.onDuplicate!(props.job)}>
            <Copy /> Kopyala
          </AppDropdownItem>
        </Show>
        <Show when={props.onSetStatus}>
          <AppDropdownSeparator />
          <Show
            when={props.job.status === 'approved'}
            fallback={
              <AppDropdownItem
                biggerText
                onSelect={() => props.onSetStatus!(props.job, 'approved')}
                disabled={props.job.status === 'pending_approval'}
              >
                <PlayCircle /> Yayınla
              </AppDropdownItem>
            }
          >
            <AppDropdownItem biggerText onSelect={() => props.onSetStatus!(props.job, 'closed')}>
              <XCircle /> İlanı kapat
            </AppDropdownItem>
          </Show>
        </Show>
        <Show when={props.onDelete}>
          <AppDropdownSeparator />
          <AppDropdownItem biggerText variant="destructive" onSelect={() => props.onDelete!(props.job)}>
            <Trash2 /> Sil
          </AppDropdownItem>
        </Show>
      </AppDropdownContent>
    </AppDropdown>
  )
}
