import { createMemo, createSignal, For, Show, splitProps, type JSX } from 'solid-js'
import { Collapsible } from '@kobalte/core/collapsible'
import { Briefcase, ChevronDown, Eye } from 'lucide-solid'
import { cn } from '@/lib/cn'
import { createdLabel, daysUntil, formatDate, formatNumber, formatRelative } from '@/lib/format'
import {
  AppAvatarGroup,
  AppBadge,
  AppButton,
  AppProgress,
  AppSkeleton,
  AppTooltip,
  focusRingClass,
} from '@/components/ui'
import { formatSalary, isJobOpen, jobLocation, type JobDetail, type JobListItem } from '@/features/jobs'
import { APPLICATION_STAGES, STAGE_LABELS, type ApplicationStage } from '@/features/applications'
import type { CandidateSummary } from '@/features/candidates'
import { JobActionsMenu, type JobActionHandlers } from './JobActionsMenu'
import { JobStatusBadge } from './JobStatusBadge'

export interface JobCardProps extends JobActionHandlers {
  job: JobListItem
  /** Richer data (skills, languages, questions) when the detail has been loaded. */
  detail?: JobDetail
  /** Preview of recent applicants for the avatar group (first few). */
  applicants?: CandidateSummary[]
  /** Real applicant count; defaults to `stats.total_applications`. */
  applicantsTotal?: number
  /** Stage counts for the expanded "Başvuru dağılımı" bars, as the stats endpoint returns them. */
  pipeline?: Partial<Record<ApplicationStage, number>>
  onApplicantClick?: (applicant: CandidateSummary) => void
  /**
   * `false` removes the chevron and the collapsible body entirely; the card then acts as one
   * click target for `onOpen` (the job's own page), like `JobRow`. Default `true`.
   */
  expandable?: boolean
  /**
   * `card` (default): bordered card on the card surface · `none`: no border lines and no surface at
   * all — the card sits straight on the page (hover tint only), and the inner strip separator goes too.
   */
  bordered?: boolean | 'card' | 'none'
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  class?: string
}

/**
 * Separated rows for the expanded body. Borders sit inside the card padding (never corner to
 * corner); a two-column row also gets an inset vertical divider on wide containers.
 */
function Row(props: { children: JSX.Element; cols?: boolean; class?: string }) {
  return (
    <div
      class={cn(
        'border-t border-border py-6 first:border-t-0 first:pt-0 last:pb-0',
        props.cols &&
          'grid gap-8 @lg:grid-cols-2 @lg:gap-0 @lg:[&>*:first-child]:pr-8 @lg:[&>*+*]:border-l @lg:[&>*+*]:border-border @lg:[&>*+*]:pl-8',
        props.class,
      )}
    >
      {props.children}
    </div>
  )
}

function Chips(props: { items: (string | null | undefined)[]; empty?: string }) {
  const items = () => props.items.filter((s): s is string => !!s && s.trim() !== '')
  return (
    <Show when={items().length > 0} fallback={<span class="text-sm text-muted-foreground">{props.empty ?? '—'}</span>}>
      <div class="flex flex-wrap gap-2">
        <For each={items()}>{(s) => <AppBadge variant="secondary">{s}</AppBadge>}</For>
      </div>
    </Show>
  )
}

function Stat(props: { label: string; value: JSX.Element; hint?: string }) {
  return (
    <div class="flex flex-col gap-1">
      <span class="text-sm text-muted-foreground">{props.label}</span>
      <span class="text-sm text-foreground">
        {props.value}
        <Show when={props.hint}>
          <span class="ml-1.5 text-sm text-muted-foreground">{props.hint}</span>
        </Show>
      </span>
    </div>
  )
}

/**
 * Job card: collapsed summary with the applicant avatar group, expandable (chevron) into
 * description, requirements, working conditions, benefits, stats and the pipeline breakdown.
 */
export function JobCard(props: JobCardProps) {
  const [local, handlers] = splitProps(props, [
    'job',
    'detail',
    'applicants',
    'applicantsTotal',
    'pipeline',
    'onApplicantClick',
    'expandable',
    'bordered',
    'expanded',
    'defaultExpanded',
    'onExpandedChange',
    'class',
  ])
  // The detail (when loaded) carries the full description and the has-many rows; the list item wins for stats.
  const job = (): JobListItem =>
    local.detail
      ? {
          ...local.detail,
          ...local.job,
          description: local.detail.description || local.job.description,
          job_desc: local.detail.job_desc ?? local.job.job_desc,
        }
      : local.job
  const expandable = () => local.expandable !== false
  const borderless = () => local.bordered === 'none'
  const [internal, setInternal] = createSignal(!!local.defaultExpanded)
  const expanded = () => expandable() && (local.expanded ?? internal())
  const clickable = () => !expandable() && !!handlers.onOpen
  // Whole-card click opens the job, except when the click came from a control inside the card.
  const onCardClick = (e: MouseEvent) => {
    if (!clickable()) return
    if ((e.target as Element).closest('button, a, input, [role="menu"], [role="dialog"]')) return
    handlers.onOpen!(job())
  }
  const setExpanded = (v: boolean) => {
    setInternal(v)
    local.onExpandedChange?.(v)
  }

  const open = () => isJobOpen(job())
  const stats = () => job().stats
  const total = () => local.applicantsTotal ?? stats()?.total_applications ?? 0
  const accepted = () => stats()?.accepted_applications ?? 0
  const salary = createMemo(() => formatSalary(job()))
  const daysLeft = createMemo(() => daysUntil(job().job_end_date))
  const isVitrin = () => (job().plan ?? []).some((p) => /vitrin/i.test(p))
  const description = () => (job().job_desc || job().description || '').trim()
  const pipelineTotal = () => APPLICATION_STAGES.reduce((n, stage) => n + (local.pipeline?.[stage] ?? 0), 0)

  const endHint = createMemo(() => {
    const d = daysLeft()
    if (d == null) return null
    if (!open()) return `Bitiş ${formatDate(job().job_end_date)}`
    if (d < 0) return 'Süresi doldu'
    if (d === 0) return 'Bugün bitiyor'
    return `${d} gün kaldı`
  })

  return (
    <Collapsible
      open={expanded()}
      onOpenChange={setExpanded}
      as="article"
      class={cn(
        '@container flex w-full flex-col rounded-2xl text-card-foreground',
        !borderless() && 'border border-border bg-card',
        clickable() && 'cursor-pointer transition-colors hover:bg-secondary',
        local.class,
      )}
      onClick={onCardClick}
    >
      {/* ---------------- Header ---------------- */}
      <div class="flex items-start gap-4 p-6">
        <div class="flex min-w-0 flex-1 flex-col gap-2.5">
          <div class="flex min-w-0 flex-wrap items-center gap-2">
            <h3 class="min-w-0 truncate text-lg text-foreground">{job().title}</h3>
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
          </div>
          <p class="truncate text-sm text-muted-foreground">
            {[job().position || job().department, jobLocation(job()), job().type, ...(job().working_type ?? [])]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <Show when={salary()}>
              <span class="text-foreground">{salary()}</span>
            </Show>
            <span>{createdLabel(job().created_on)}</span>
            <Show when={endHint()}>
              <span class={cn(open() && (daysLeft() ?? 99) <= 3 && 'text-destructive')}>{endHint()}</span>
            </Show>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <JobActionsMenu job={job()} {...handlers} />
          <Show when={expandable()}>
            <Collapsible.Trigger
              class={cn(
                'inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-primary-hover',
                focusRingClass,
              )}
              aria-label={expanded() ? 'Daralt' : 'Detayları göster'}
            >
              <ChevronDown class={cn('size-5 transition-transform duration-200', expanded() && 'rotate-180')} />
            </Collapsible.Trigger>
          </Show>
        </div>
      </div>

      {/* ---------------- Applicants strip ---------------- */}
      <div
        class={cn(
          'flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4',
          borderless() ? 'pt-0' : 'border-t border-border',
        )}
      >
        <div class="flex min-w-0 flex-wrap items-center gap-3">
          <Show when={total() > 0} fallback={<span class="text-sm text-muted-foreground">Henüz başvuru yok</span>}>
            <AppAvatarGroup
              size="sm"
              max={5}
              total={total()}
              hoverCards
              items={(local.applicants ?? []).map((a) => ({
                src: a.photo_url,
                name: a.name ?? undefined,
                surname: a.surname ?? undefined,
                subtitle: a.email ?? undefined,
                onClick: local.onApplicantClick ? () => local.onApplicantClick!(a) : undefined,
              }))}
              onOverflowClick={() => handlers.onOpen?.(job())}
            />
            <span class="text-base text-foreground">{formatNumber(total())}</span>
            <Show when={(stats()?.applications_this_week ?? 0) > 0}>
              <AppBadge variant="primarySubtle" class="hidden @md:inline-flex">
                +{stats()!.applications_this_week} bu hafta
              </AppBadge>
            </Show>
          </Show>
        </div>
        <div class="flex items-center gap-4">
          <AppTooltip content="Görüntülenme">
            <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground [&_svg]:size-4">
              <Eye />
              {formatNumber(stats()?.total_views)}
            </span>
          </AppTooltip>
          <Show when={handlers.onOpen}>
            <AppButton size="sm" variant="secondary" leftIcon={<Briefcase />} onClick={() => handlers.onOpen!(job())}>
              Başvurular
            </AppButton>
          </Show>
        </div>
      </div>

      {/* ---------------- Expanded details ---------------- */}
      <Show when={expandable()}>
        <Collapsible.Content class="overflow-hidden data-[expanded]:animate-collapsible-down data-[closed]:animate-collapsible-up">
          <div class="flex flex-col border-t border-border px-6 py-6">
            <Row>
              <Show
                when={description()}
                fallback={<span class="text-sm text-muted-foreground">Açıklama girilmemiş.</span>}
              >
                <p class="line-clamp-5 text-sm whitespace-pre-line text-foreground">{description()}</p>
              </Show>
            </Row>

            <Row cols>
              <Chips
                items={[
                  job().is_experience_required ? `${job().experience_year ?? 0}+ yıl deneyim` : 'Deneyim şartı yok',
                  ...(job().education_status ?? []),
                  ...(job().education_department ?? []),
                  ...(job().military ?? []).map((m) => `Askerlik: ${m}`),
                  ...(job().driver_license ?? []).map((d) => `Ehliyet ${d}`),
                  job().gender ? `Cinsiyet: ${job().gender}` : null,
                  ...(local.detail?.skills ?? []).map((s) => s.skill_name),
                  ...(local.detail?.languages ?? []).map(
                    (l) => `${l.lang_name}${l.lang_level ? ` (${l.lang_level})` : ''}`,
                  ),
                ]}
              />
              <Chips
                items={[
                  ...(job().working_type ?? []),
                  ...(job().working_prefs ?? []),
                  job().working_hours,
                  ...(job().working_days ?? []),
                  job().is_shift_work
                    ? `Vardiyalı${job().shift_daily_hours ? ` · ${job().shift_daily_hours} saat` : ''}`
                    : null,
                  job().worker_count ? `${job().worker_count} alım` : null,
                ]}
              />
            </Row>

            <Row cols>
              <div class="flex flex-col gap-3">
                <span class="text-sm">{salary() ?? 'Maaş belirtilmemiş'}</span>
                <Chips items={job().benefits ?? []} empty="Yan hak belirtilmemiş" />
              </div>
              <div class="grid grid-cols-2 gap-x-6 gap-y-4">
                <Stat
                  label="Konum"
                  value={[job().neighbourhood, job().town, job().province].filter(Boolean).join(', ') || '—'}
                />
                <Stat label="Başlangıç" value={job().job_start_date ? formatDate(job().job_start_date) : '—'} />
                <Stat label="Oluşturma" value={formatDate(job().created_on)} />
                <Stat
                  label="Bitiş"
                  value={job().job_end_date ? formatDate(job().job_end_date) : '—'}
                  hint={open() ? (endHint() ?? undefined) : undefined}
                />
              </div>
            </Row>

            <Show when={stats()}>
              <Row>
                <div class="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
                  <Stat
                    label="Görüntülenme"
                    value={formatNumber(stats()!.total_views)}
                    hint={`/ ${formatNumber(stats()!.unique_views)} tekil`}
                  />
                  <Stat
                    label="Başvuru"
                    value={formatNumber(total())}
                    hint={`/ bu ay ${formatNumber(stats()!.applications_this_month)}`}
                  />
                  <Stat
                    label="Son başvuru"
                    value={stats()!.last_applied_at ? formatRelative(stats()!.last_applied_at) : '—'}
                  />
                  <div class="flex flex-col gap-2">
                    <span class="text-sm text-muted-foreground">Kabul oranı</span>
                    <AppProgress
                      value={total() ? (accepted() / total()) * 100 : 0}
                      size="sm"
                      variant="success"
                      showValue
                      formatValue={() => `${accepted()} / ${total()}`}
                    />
                  </div>
                </div>
              </Row>
            </Show>

            <Show when={local.pipeline && pipelineTotal() > 0}>
              <Row>
                <div class="grid gap-4 sm:grid-cols-2">
                  <For each={APPLICATION_STAGES.filter((stage) => (local.pipeline?.[stage] ?? 0) > 0)}>
                    {(s) => (
                      <AppProgress
                        label={STAGE_LABELS[s]}
                        value={((local.pipeline?.[s] ?? 0) / pipelineTotal()) * 100}
                        size="sm"
                        variant={
                          s === 'HIRED'
                            ? 'success'
                            : s === 'REJECTED' || s === 'WITHDRAWN'
                              ? 'destructive'
                              : s === 'NEW'
                                ? 'warning'
                                : 'primary'
                        }
                        showValue
                        formatValue={() => String(local.pipeline?.[s] ?? 0)}
                      />
                    )}
                  </For>
                </div>
              </Row>
            </Show>

            <Show when={local.detail?.questions?.length}>
              <Row>
                <ol class="list-inside list-decimal space-y-2 text-sm">
                  <For each={local.detail!.questions}>
                    {(q) => (
                      <li>
                        {q.question}
                        {q.is_required && <span class="text-destructive"> *</span>}
                      </li>
                    )}
                  </For>
                </ol>
              </Row>
            </Show>
          </div>
        </Collapsible.Content>
      </Show>
    </Collapsible>
  )
}

export function JobCardSkeleton(props: { bordered?: JobCardProps['bordered']; class?: string }) {
  const borderless = () => props.bordered === 'none'
  return (
    <div
      class={cn('flex w-full flex-col rounded-2xl', !borderless() && 'border border-border bg-card', props.class)}
      aria-hidden="true"
    >
      <div class="flex items-start gap-4 p-6">
        <div class="flex flex-1 flex-col gap-2">
          <div class="flex items-center gap-2">
            <AppSkeleton variant="text" width="45%" class="h-4" />
            <AppSkeleton width={64} height={20} class="rounded-full" />
          </div>
          <AppSkeleton variant="text" width="60%" />
          <AppSkeleton variant="text" width="40%" class="h-2.5" />
        </div>
        <AppSkeleton variant="circle" width={32} height={32} />
      </div>
      <div class={cn('flex items-center gap-4 px-6 py-4', borderless() ? 'pt-0' : 'border-t border-border')}>
        <AppSkeleton variant="text" width={64} />
        <div class="flex -space-x-2">
          <For each={[0, 1, 2, 3]}>{() => <AppSkeleton variant="circle" width={32} height={32} />}</For>
        </div>
        <AppSkeleton variant="text" width={32} />
      </div>
    </div>
  )
}
