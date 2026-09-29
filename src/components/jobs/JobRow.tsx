import { createMemo, For, Show, splitProps, type JSX } from 'solid-js'
import { Briefcase, Eye, Users } from 'lucide-solid'
import { cn } from '@/lib/cn'
import { createdLabel, daysUntil, formatDate, formatNumber, formatRelative } from '@/lib/format'
import { AppAvatarGroup, AppBadge, AppButton, AppCheckbox, AppProgress, AppSkeleton, AppTooltip } from '@/components/ui'
import type { CandidateSummary } from '@/features/candidates'
import { formatSalary, isJobOpen, jobLocation, type JobListItem } from '@/features/jobs'
import { JobActionsMenu, type JobActionHandlers } from './JobActionsMenu'
import { JobStatusBadge } from './JobStatusBadge'

export type JobRowVariant = 'compact' | 'default' | 'detailed'

export interface JobRowProps extends JobActionHandlers {
  job: JobListItem
  /** `compact`: one line for dense lists · `default`: title + meta · `detailed`: adds the metrics strip. */
  variant?: JobRowVariant
  /**
   * `card` (default): rounded, bordered card · `divided`: flat row with a bottom hairline for stacked
   * lists · `none`: no border at all — the row is just a rounded hover target on the page.
   */
  bordered?: boolean | 'card' | 'divided' | 'none'
  /** Renders the selection checkbox when provided. */
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  /** Extra content in the actions area (before the menu). */
  actions?: JSX.Element
  /** Recent applicants for the Başvuranlar avatar group (bottom-right; not in `compact`). */
  applicants?: CandidateSummary[]
  /** Real applicant count behind the avatars; defaults to `stats.total_applications`. */
  applicantsTotal?: number
  onApplicantClick?: (applicant: CandidateSummary) => void
  class?: string
}

function Metric(props: { icon: JSX.Element; value: number | null | undefined; label: string; class?: string }) {
  return (
    <AppTooltip content={props.label}>
      <span class={cn('inline-flex items-center gap-1.5 text-sm text-muted-foreground [&_svg]:size-4', props.class)}>
        {props.icon}
        {formatNumber(props.value)}
      </span>
    </AppTooltip>
  )
}

/** Dot-separated inline meta, skipping blanks. */
function Meta(props: { parts: (string | null | undefined | false)[]; class?: string }) {
  const parts = () => props.parts.filter((p): p is string => !!p && p.trim() !== '')
  return (
    <Show when={parts().length > 0}>
      <p class={cn('truncate text-sm text-muted-foreground', props.class)}>
        <For each={parts()}>
          {(p, i) => (
            <>
              {i() > 0 && <span class="mx-1.5 opacity-60">·</span>}
              {p}
            </>
          )}
        </For>
      </p>
    </Show>
  )
}

export function JobRow(props: JobRowProps) {
  const [local] = splitProps(props, [
    'job',
    'variant',
    'bordered',
    'selected',
    'onSelectedChange',
    'onOpen',
    'onEdit',
    'onDuplicate',
    'onSetStatus',
    'onDelete',
    'actions',
    'applicants',
    'applicantsTotal',
    'onApplicantClick',
    'class',
  ])
  const job = () => local.job
  const variant = () => local.variant ?? 'default'
  const compact = () => variant() === 'compact'
  const detailed = () => variant() === 'detailed'
  const selectable = () => !!local.onSelectedChange
  const open = () => isJobOpen(job())
  const daysLeft = createMemo(() => daysUntil(job().job_end_date))
  const salary = createMemo(() => formatSalary(job()))
  const isVitrin = () => (job().plan ?? []).some((p) => /vitrin/i.test(p))
  const stats = () => job().stats
  const applications = () => local.applicantsTotal ?? stats()?.total_applications ?? 0
  const accepted = () => stats()?.accepted_applications ?? 0
  const showApplicants = () => !compact() && local.applicants !== undefined && applications() > 0

  const endHint = createMemo(() => {
    const d = daysLeft()
    if (d == null || !open()) return null
    if (d < 0) return 'Süresi doldu'
    if (d === 0) return 'Bugün bitiyor'
    return `${d} gün kaldı`
  })

  const stop = (e: Event) => e.stopPropagation()

  const menu = (
    <JobActionsMenu
      job={job()}
      onOpen={local.onOpen}
      onEdit={local.onEdit}
      onDuplicate={local.onDuplicate}
      onSetStatus={local.onSetStatus}
      onDelete={local.onDelete}
    />
  )

  return (
    <article
      class={cn(
        'group/row relative flex w-full items-start gap-4 bg-card text-card-foreground transition-colors',
        borderClass(local.bordered),
        compact() ? 'px-4 py-3' : 'p-5',
        local.onOpen && 'cursor-pointer hover:bg-secondary',
        local.selected && 'border-primary bg-secondary',
        local.class,
      )}
      onClick={() => local.onOpen?.(job())}
      aria-selected={selectable() ? !!local.selected : undefined}
    >
      <Show when={selectable()}>
        <span class={cn('shrink-0', compact() ? 'pt-1' : 'pt-0.5')} onClick={stop}>
          <AppCheckbox
            aria-label={`${job().title} seç`}
            checked={!!local.selected}
            onChange={(v) => local.onSelectedChange?.(v)}
          />
        </span>
      </Show>

      {/* Title + meta */}
      <div class={cn('flex min-w-0 flex-1 flex-col', compact() ? 'gap-1' : 'gap-2')}>
        <div class="flex min-w-0 items-center gap-2">
          <h3 class={cn('min-w-0 truncate text-foreground', compact() ? 'text-sm' : 'text-lg')}>{job().title}</h3>
          <JobStatusBadge status={job().status} />
          <Show when={isVitrin()}>
            <AppBadge variant="premiumSubtle" size="sm">
              Vitrin
            </AppBadge>
          </Show>
          <Show when={job().is_secret_name}>
            <AppTooltip content="Şirket adı ilanda gizli">
              <AppBadge variant="outline" size="sm">
                <Eye /> Gizli
              </AppBadge>
            </AppTooltip>
          </Show>
          <Show when={compact()}>
            <Meta
              class="hidden min-w-0 flex-1 md:block"
              parts={[job().position || job().department, jobLocation(job()), job().type]}
            />
          </Show>
        </div>

        <Show when={!compact()}>
          <Meta
            parts={[job().position || job().department, jobLocation(job()), job().type, ...(job().working_type ?? [])]}
          />
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <Show when={salary()}>
              <span class="text-foreground">{salary()}</span>
            </Show>
            <span>{createdLabel(job().created_on)}</span>
            <Show when={endHint()}>
              <span class={cn((daysLeft() ?? 99) <= 3 && 'text-destructive')}>{endHint()}</span>
            </Show>
            <Show when={!open() && job().job_end_date}>
              <span>Bitiş {formatDate(job().job_end_date)}</span>
            </Show>
          </div>
        </Show>

        <Show when={detailed() && stats()}>
          <div class="mt-3 grid grid-cols-2 gap-x-8 gap-y-4 rounded-2xl border border-border p-4 sm:grid-cols-4">
            <div class="flex flex-col">
              <span class="text-sm text-muted-foreground">Görüntülenme</span>
              <span class="text-sm">
                {formatNumber(stats()!.total_views)}{' '}
                <span class="text-sm text-muted-foreground">/ {formatNumber(stats()!.unique_views)} tekil</span>
              </span>
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-muted-foreground">Başvuru</span>
              <span class="text-sm">
                {formatNumber(applications())}{' '}
                <span class="text-sm text-muted-foreground">
                  / bu hafta {formatNumber(stats()!.applications_this_week)}
                </span>
              </span>
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-muted-foreground">Son başvuru</span>
              <span class="text-sm">{stats()!.last_applied_at ? formatRelative(stats()!.last_applied_at) : '—'}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-sm text-muted-foreground">Kabul oranı</span>
              <AppProgress
                value={applications() ? (accepted() / applications()) * 100 : 0}
                size="xs"
                variant="success"
                showValue
                formatValue={() => `${accepted()} / ${applications()}`}
              />
            </div>
          </div>
        </Show>
      </div>

      {/* Metrics + actions, with the applicants preview underneath (bottom-right) */}
      <div
        class={cn('flex shrink-0 flex-col items-end gap-3', compact() ? 'self-center' : 'self-stretch justify-between')}
        onClick={stop}
      >
        <div class="flex items-center gap-4">
          <Show when={!detailed()}>
            <div class="hidden items-center gap-4 sm:flex">
              <Metric
                icon={<Users />}
                value={applications()}
                label="Başvuru"
                class={applications() > 0 ? 'text-foreground' : undefined}
              />
              <Metric icon={<Eye />} value={stats()?.total_views} label="Görüntülenme" />
            </div>
          </Show>
          {local.actions}
          <Show when={local.onOpen && !compact()}>
            <AppButton
              size="sm"
              variant="secondary"
              leftIcon={<Briefcase />}
              onClick={() => local.onOpen!(job())}
              class="hidden md:inline-flex"
            >
              Başvurular
            </AppButton>
          </Show>
          {menu}
        </div>
        <Show when={showApplicants()}>
          <div class="flex items-center gap-3">
            <AppAvatarGroup
              size="sm"
              max={5}
              total={applications()}
              hoverCards
              items={local.applicants!.map((a) => ({
                src: a.photo_url,
                name: a.name ?? undefined,
                surname: a.surname ?? undefined,
                subtitle: a.email ?? undefined,
                onClick: local.onApplicantClick ? () => local.onApplicantClick!(a) : undefined,
              }))}
              onOverflowClick={() => local.onOpen?.(job())}
            />
          </div>
        </Show>
      </div>
    </article>
  )
}

/** Shared by the row and its skeleton; `true`/`false` keep working as `card`/`divided`. */
function borderClass(bordered: JobRowProps['bordered']) {
  const mode = bordered === undefined || bordered === true ? 'card' : bordered === false ? 'divided' : bordered
  return mode === 'card'
    ? 'rounded-2xl border border-border'
    : mode === 'divided'
      ? 'border-b border-border last:border-b-0'
      : 'rounded-2xl'
}

export function JobRowSkeleton(props: { variant?: JobRowVariant; bordered?: JobRowProps['bordered']; class?: string }) {
  const compact = () => props.variant === 'compact'
  return (
    <div
      class={cn(
        'flex w-full items-start gap-3 bg-card',
        borderClass(props.bordered),
        compact() ? 'px-4 py-3' : 'p-5',
        props.class,
      )}
      aria-hidden="true"
    >
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <div class="flex items-center gap-2">
          <AppSkeleton variant="text" width="40%" class={compact() ? 'h-3.5' : 'h-4'} />
          <AppSkeleton width={64} height={20} class="rounded-full" />
        </div>
        <Show when={!compact()}>
          <AppSkeleton variant="text" width="55%" />
          <AppSkeleton variant="text" width="35%" class="h-2.5" />
        </Show>
        <Show when={props.variant === 'detailed'}>
          <AppSkeleton height={64} class="mt-2 w-full rounded-2xl" />
        </Show>
      </div>
      <div class="flex items-center gap-3">
        <AppSkeleton variant="text" width={40} />
        <AppSkeleton variant="text" width={40} />
        <AppSkeleton variant="circle" width={32} height={32} />
      </div>
    </div>
  )
}
