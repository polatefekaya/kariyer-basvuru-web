import { createMemo, For, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { Collapsible } from '@kobalte/core/collapsible'
import { ChevronDown, FileText } from 'lucide-solid'
import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppDropdown,
  AppDropdownContent,
  AppDropdownItem,
  AppDropdownSeparator,
  AppDropdownTrigger,
  focusRingClass,
} from '@/components/ui'
import { stageVariant, type ApplicationRow } from '@/features/applications'
import { useStageChange } from '@/components/applications'
import { formatDate, formatRelative } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { CandidateGroup } from './useCandidateGroups'

/** How many job chips fit on the collapsed row before the rest collapse into "+N". */
const VISIBLE_JOBS = 2

function StageBadge(props: { row: ApplicationRow }) {
  return (
    <AppBadge variant={stageVariant[props.row.stage]} size="sm">
      {props.row.stageLabel}
    </AppBadge>
  )
}

/** One application inside the expanded row: the posting, where it stands, and what you can do. */
function ApplicationLine(props: { row: ApplicationRow; onOpenJob: (row: ApplicationRow) => void }) {
  const stage = useStageChange({ row: () => props.row, subject: () => props.row.job.title })
  const match = () => props.row.score

  return (
    <div class="flex flex-col gap-2 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0 @2xl:flex-row @2xl:items-center @2xl:gap-4">
      <button
        type="button"
        onClick={() => props.onOpenJob(props.row)}
        class={cn(
          'flex min-w-0 flex-1 flex-col items-start gap-1 rounded-2xl text-left transition-colors hover:text-primary-hover',
          focusRingClass,
        )}
      >
        <span class="flex min-w-0 flex-wrap items-center gap-2">
          <span class="min-w-0 truncate text-foreground">{props.row.job.title}</span>
          <StageBadge row={props.row} />
        </span>
        <span class="truncate text-sm text-muted-foreground">{formatRelative(props.row.appliedAt)} başvurdu</span>
      </button>

      <div class="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
        <Show when={match() != null}>
          <span class={cn(match()! >= 70 ? 'text-success' : match()! >= 45 ? 'text-foreground' : undefined)}>
            %{Math.round(match()!)} uyum
          </span>
        </Show>
        <span title={formatDate(props.row.appliedAt)}>{formatRelative(props.row.appliedAt)}</span>
        <AppDropdown placement="bottom-end">
          <AppDropdownTrigger
            aria-label="Başvuru işlemleri"
            class={cn(
              'inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-primary-hover',
              focusRingClass,
            )}
          >
            ⋯
          </AppDropdownTrigger>
          <AppDropdownContent>
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
            <AppDropdownItem onSelect={() => props.onOpenJob(props.row)}>
              <FileText /> İlanın başvurularını gör
            </AppDropdownItem>
          </AppDropdownContent>
        </AppDropdown>
      </div>

      <stage.Confirm />
    </div>
  )
}

/**
 * One person in the Adaylar list. Collapsed it names every posting of yours they applied to;
 * expanded it becomes their application queue — status moves happen right here, which is why
 * there is no separate Başvurular screen.
 */
export function CandidateListRow(props: {
  group: CandidateGroup
  /** Owned by the page so a regroup (after a status change, or a new page) keeps rows open. */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  class?: string
}) {
  const navigate = useNavigate()
  const expanded = () => props.expanded
  const setExpanded = (v: boolean) => props.onExpandedChange(v)
  const g = () => props.group
  const count = () => g().applications.length
  const visible = createMemo(() => g().applications.slice(0, VISIBLE_JOBS))
  const hiddenCount = () => Math.max(0, count() - VISIBLE_JOBS)
  const openCandidate = (e: MouseEvent) => {
    if ((e.target as Element).closest('button, a, [role="menu"], [role="dialog"]')) return
    navigate(`/adaylar/${g().uid}`)
  }
  const openJob = (row: ApplicationRow) => navigate(`/adaylar?ilan=${row.job.uid}`)

  return (
    <Collapsible
      as="article"
      open={expanded()}
      onOpenChange={setExpanded}
      class={cn('@container flex w-full flex-col rounded-2xl transition-colors hover:bg-secondary', props.class)}
    >
      <div class="flex cursor-pointer items-start gap-4 p-5" onClick={openCandidate}>
        <AppAvatar src={g().candidate.avatarUrl} name={g().candidate.fullName} size="lg" />

        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span class="min-w-0 truncate text-foreground">{g().candidate.fullName}</span>
            <Show when={count() > 1}>
              <AppBadge variant="primarySubtle" size="sm">
                {count()} ilana başvurdu
              </AppBadge>
            </Show>
          </div>

          {/* Which of your postings they applied to — hidden while the full list is open. */}
          <Show when={!expanded()}>
            <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
              <For each={visible()}>
                {(row, i) => (
                  <>
                    <Show when={i() > 0}>
                      <span class="text-muted-foreground opacity-60">·</span>
                    </Show>
                    <span class="flex min-w-0 items-center gap-1.5 text-sm">
                      <span class="min-w-0 truncate text-foreground">{row.job.title}</span>
                      <StageBadge row={row} />
                    </span>
                  </>
                )}
              </For>
              <Show when={hiddenCount()}>
                <span class="text-sm text-muted-foreground">+{hiddenCount()} ilan daha</span>
              </Show>
            </div>
          </Show>

          <span class="truncate text-sm text-muted-foreground">
            {[g().candidate.email, g().candidate.phone].filter(Boolean).join(' · ')}
          </span>
        </div>

        <div class="flex shrink-0 items-center gap-4">
          <div class="hidden flex-col items-end gap-1.5 text-sm text-muted-foreground @2xl:flex">
            <span>{formatRelative(g().appliedAt)} başvurdu</span>
            <Show when={g().bestMatch != null}>
              <span
                class={cn(g().bestMatch! >= 70 ? 'text-success' : g().bestMatch! >= 45 ? 'text-foreground' : undefined)}
              >
                %{Math.round(g().bestMatch!)} uyum
              </span>
            </Show>
          </div>
          <Collapsible.Trigger
            class={cn(
              'inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-primary-hover',
              focusRingClass,
            )}
            aria-label={expanded() ? 'Başvuruları gizle' : `${count()} başvuruyu göster`}
          >
            <ChevronDown class={cn('size-5 transition-transform duration-200', expanded() && 'rotate-180')} />
          </Collapsible.Trigger>
        </div>
      </div>

      <Collapsible.Content class="overflow-hidden data-[expanded]:animate-collapsible-down data-[closed]:animate-collapsible-up">
        <div class="flex flex-col px-5 pb-5 pl-[5.25rem]">
          <For each={g().applications}>{(row) => <ApplicationLine row={row} onOpenJob={openJob} />}</For>
          <div class="flex items-center gap-2 border-t border-border pt-4">
            <AppButton variant="ghost" size="sm" onClick={() => navigate(`/adaylar/${g().uid}`)}>
              Aday profilini aç
            </AppButton>
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible>
  )
}
