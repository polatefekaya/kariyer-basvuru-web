import { createEffect, createMemo, createSignal, For, Index, Match, on, Show, Switch } from 'solid-js'
import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { ArrowLeft, MessagesSquare, Pencil, RefreshCw, Search, Users } from 'lucide-solid'
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppCheckbox,
  AppEmptyState,
  AppInput,
  AppLoadingBlock,
  AppSelect,
  AppSkeleton,
  AppTabs,
  AppTabsContent,
  AppTooltip,
  toast,
} from '@/components/ui'
import { JobActionsMenu, JobStatusBadge } from '@/components/jobs'
import {
  APPLICATION_STAGES,
  STAGE_LABELS,
  useApplicationStats,
  useJobApplications,
  useJobNotes,
  type ApplicationListParams,
  type ApplicationRow,
  type ApplicationStage,
} from '@/features/applications'
import { useJobInterviews, type Interview } from '@/features/hiring'
import { formatSalary, jobLocation, useJob, useSetJobStatus, type JobListItem, type JobStatus } from '@/features/jobs'
import { createdLabel, formatDate, formatNumber } from '@/lib/format'
import { companyJobsPath, openSite } from '@/lib/site'
import { track } from '@/lib/analytics'
import config from '@/config/config'
import { useCurrentCompany } from '@/features/auth'
import { ApplicantRow } from './ApplicantRow'
import { InterviewsBoard } from './InterviewsBoard'
import { InterviewModal } from './InterviewModal'
import { InterviewManageModal, type InterviewManageView } from './InterviewManageModal'
import { BulkActionBar } from './BulkActionBar'
import { CandidateMessageModal } from './CandidateMessageModal'

type DetailTab = 'basvuranlar' | 'mulakatlar' | 'ilan'
// Mülakatlar only exists where interviews do — see config.HAS_PIPELINE.
const TABS: { value: DetailTab; label: string }[] = [
  { value: 'basvuranlar', label: 'Başvuranlar' },
  ...(config.HAS_PIPELINE ? [{ value: 'mulakatlar' as DetailTab, label: 'Mülakatlar' }] : []),
  { value: 'ilan', label: 'İlan detayı' },
]

type SortKey = 'newest' | 'oldest' | 'status'
// No "uyum" sort: match scores are computed by the Node matching engine, not stored, so the
// recruiting service cannot order by them. The score still renders wherever one is present.
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'En yeni başvuru' },
  { value: 'oldest', label: 'En eski başvuru' },
  { value: 'status', label: 'Duruma göre' },
]
const STAGE_ORDER: ApplicationStage[] = APPLICATION_STAGES
const ANY = '__all'
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

function Stat(props: { label: string; value: string | number }) {
  return (
    <div class="flex flex-col gap-0.5">
      <span class="text-sm text-muted-foreground">{props.label}</span>
      <span class="text-foreground">{props.value}</span>
    </div>
  )
}

/** İlan detayı: this posting's applicants, its interviews, and the posting itself. */
export function JobDetailPage() {
  const params = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParams()

  const company = useCurrentCompany()
  const job = useJob(() => params.uid, { withStats: true })

  // The posting form and its editor live on the main site; the editor opens from the company's
  // own job list there, so that is what a link can reach.
  const openEditor = () => {
    const uid = company.data?.uid
    if (uid) openSite(companyJobsPath(uid))
    else toast.info('Şirket bilgisi yükleniyor')
  }
  const interviews = useJobInterviews(() => params.uid)
  const notes = useJobNotes(() => params.uid)

  const tab = createMemo<DetailTab>(() => {
    const v = first(search.sekme) as DetailTab
    return TABS.some((t) => t.value === v) ? v : 'basvuranlar'
  })
  const setTab = (v: DetailTab) => setSearch({ sekme: v === 'basvuranlar' ? undefined : v }, { replace: true })

  // ---- applicant filters (URL-backed, same shape as the other lists) ----
  const status = () => first(search.durum) as ApplicationStage | ''
  const q = () => first(search.q)
  const sort = createMemo<SortKey>(() => {
    const v = first(search.sirala) as SortKey
    return SORTS.some((s) => s.value === v) ? v : 'newest'
  })
  const isDirty = () => !!q() || !!status()

  // §13: the list view and every filter change are the two events the funnel is built on.
  createEffect(
    on(
      () => [params.uid, tab()] as const,
      ([jobUid, current]) => {
        if (current !== 'basvuranlar') return
        track('application_list_viewed', {
          jobId: jobUid,
          status: status() || undefined,
          filterCount: [q(), status()].filter(Boolean).length,
        })
      },
    ),
  )

  const setFilters = (patch: { q?: string; durum?: string; sirala?: SortKey }) => (
    track('application_filter_applied', {
      filterType: patch.q !== undefined ? 'search' : patch.durum !== undefined ? 'status' : 'sort',
      status: (patch.durum ?? status()) || undefined,
      hasSearch: !!(patch.q ?? q()),
    }),
    setSearch(
      {
        q: (patch.q ?? q()) || undefined,
        durum: (patch.durum ?? status()) || undefined,
        sirala: (patch.sirala ?? sort()) === 'newest' ? undefined : (patch.sirala ?? sort()),
        sekme: tab() === 'basvuranlar' ? undefined : tab(),
      },
      { replace: true },
    )
  )

  const [term, setTerm] = createSignal(q())
  createEffect(on(q, (v) => v !== term() && setTerm(v)))
  let timer: ReturnType<typeof setTimeout> | undefined
  const onSearch = (v: string) => {
    setTerm(v)
    clearTimeout(timer)
    timer = setTimeout(() => setFilters({ q: v }), 300)
  }

  const listParams = createMemo<ApplicationListParams>(() => ({
    ...(status() && { status: status() as ApplicationStage }),
    ...(q().trim() && { q: q().trim() }),
    sort: sort() === 'oldest' ? 'appliedAt:asc' : sort() === 'status' ? 'stage:asc' : 'appliedAt:desc',
    limit: 100,
  }))
  const applications = useJobApplications(() => params.uid, listParams)
  const stats = useApplicationStats(() => params.uid)

  const rows = createMemo<ApplicationRow[]>(() => {
    return applications.data?.items ?? []
  })

  const allInterviews = createMemo<Interview[]>(() =>
    interviews.data ? [...interviews.data.ongoing, ...interviews.data.upcoming, ...interviews.data.past] : [],
  )
  const interviewsFor = (applicationUid: string) => allInterviews().filter((i) => i.applicationUid === applicationUid)
  const noteFor = (applicationUid: string) => (notes.data ?? []).find((n) => n.applicationUid === applicationUid)

  // ---- modals ----
  const [inviting, setInviting] = createSignal<{ row: ApplicationRow; interview?: Interview } | null>(null)
  // Notes open inside their row; the set lives here so a refetch doesn't close what is open.
  const [openNotes, setOpenNotes] = createSignal<ReadonlySet<string>>(new Set())
  const toggleNotes = (uid: string, open: boolean) =>
    setOpenNotes((prev) => {
      const next = new Set(prev)
      if (open) next.add(uid)
      else next.delete(uid)
      return next
    })
  const openInvite = (row: ApplicationRow) => {
    track('interview_invite_opened', { entryPoint: 'list' })
    setInviting({ row })
  }
  const rowFor = (interview: Interview) =>
    (applications.data?.items ?? []).find((r) => r.id === interview.applicationUid)

  // One interview's lifecycle — overview, outcome, no-show, cancellation. Rescheduling and a new
  // round hand over to the scheduling form above.
  const [managing, setManaging] = createSignal<{ interview: Interview; view?: InterviewManageView } | null>(null)
  const manageInterview = (interview: Interview, view?: InterviewManageView) => setManaging({ interview, view })
  const rescheduleInterview = (interview: Interview) => {
    const row = rowFor(interview)
    setManaging(null)
    if (row) setInviting({ row, interview })
  }
  const reinvite = (interview: Interview) => {
    const row = rowFor(interview)
    setManaging(null)
    if (row) openInvite(row)
  }

  const setJobStatus = useSetJobStatus()
  const jobStats = () => job.data?.stats
  const stageCounts = () => stats.data?.stages ?? applications.data?.stats ?? {}

  // ---- bulk selection & messaging ----
  // Only where the recruiting service runs: bulk moves and messages are its endpoints.
  const bulk = config.HAS_PIPELINE
  const [selected, setSelected] = createSignal<ReadonlySet<string>>(new Set())
  const selectedRows = createMemo(() => rows().filter((r) => selected().has(r.id)))
  const setRowSelected = (uid: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(uid)
      else next.delete(uid)
      return next
    })
  const allSelected = () => rows().length > 0 && rows().every((r) => selected().has(r.id))
  const someSelected = () => selectedRows().length > 0 && !allSelected()
  const toggleAll = (on: boolean) => setSelected(on ? new Set(rows().map((r) => r.id)) : new Set<string>())
  // A filter or search that hides a row also drops it from the selection — nothing acts on rows
  // the recruiter can no longer see.
  createEffect(
    on(rows, (visible) => {
      const ids = new Set(visible.map((r) => r.id))
      setSelected((prev) => (([...prev].every((id) => ids.has(id))) ? prev : new Set([...prev].filter((id) => ids.has(id)))))
    }),
  )

  const [messaging, setMessaging] = createSignal<{ applicationUids: string[] | null } | null>(null)
  const messageSelected = () => setMessaging({ applicationUids: selectedRows().map((r) => r.id) })

  return (
    <div class="@container flex w-full flex-col gap-6 sm:px-2 lg:px-6">
      <AppButton variant="ghost" size="sm" leftIcon={<ArrowLeft />} class="self-start" onClick={() => navigate('/')}>
        İlanlar
      </AppButton>

      <Switch>
        <Match when={job.isPending}>
          <AppLoadingBlock label="İlan yükleniyor" />
        </Match>
        <Match when={job.isError || !job.data}>
          <AppAlert
            variant="destructive"
            title="İlan bulunamadı"
            description="Bu ilan kaldırılmış ya da erişiminiz yok."
            actions={
              <AppButton variant="outline" size="sm" onClick={() => navigate('/')}>
                İlanlara dön
              </AppButton>
            }
          />
        </Match>
        <Match when={job.data}>
          {/* ---------------- Header ---------------- */}
          <header class="flex flex-col gap-5">
            <div class="flex flex-col gap-4 @2xl:flex-row @2xl:items-start @2xl:justify-between">
              <div class="flex min-w-0 flex-col gap-2">
                <div class="flex min-w-0 flex-wrap items-center gap-2">
                  <h1 class="min-w-0 truncate text-xl font-medium text-foreground">{job.data!.title}</h1>
                  <JobStatusBadge status={job.data!.status} />
                </div>
                <p class="text-sm text-muted-foreground">
                  {[
                    job.data!.position || job.data!.department,
                    jobLocation(job.data!),
                    job.data!.type,
                    ...(job.data!.working_type ?? []),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p class="text-sm text-muted-foreground">
                  {[formatSalary(job.data!), createdLabel(job.data!.created_on)].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <AppButton variant="outline" leftIcon={<Pencil />} onClick={openEditor}>
                  İlanı düzenle
                </AppButton>
                <JobActionsMenu
                  job={job.data as JobListItem}
                  onEdit={openEditor}
                  onSetStatus={(j, s: JobStatus) =>
                    setJobStatus.mutate(
                      { uid: j.uid, status: s },
                      { onSuccess: () => toast.success('İlan durumu güncellendi') },
                    )
                  }
                />
              </div>
            </div>

            <div class="grid gap-x-8 gap-y-5 border-t border-border pt-5 sm:grid-cols-3 @3xl:grid-cols-6">
              <Stat label="Başvuru" value={formatNumber(stageCounts().ALL ?? jobStats()?.total_applications ?? 0)} />
              <Stat label="Bu hafta" value={formatNumber(jobStats()?.applications_this_week ?? 0)} />
              <Stat label="Görüntülenme" value={formatNumber(jobStats()?.total_views ?? 0)} />
              <Stat label="İncelenen" value={formatNumber(stageCounts().REVIEWING ?? 0)} />
              <Show when={config.HAS_PIPELINE}>
                <Stat label="Mülakat" value={formatNumber(stats.data?.interviews.total ?? allInterviews().length)} />
              </Show>
              <Stat label="İşe alınan" value={formatNumber(stageCounts().HIRED ?? 0)} />
            </div>
          </header>

          {/* ---------------- Tabs ---------------- */}
          <AppTabs<DetailTab>
            tabs={TABS}
            value={tab()}
            onChange={setTab}
            variant="underline"
            listClass="bg-transparent"
          >
            <AppTabsContent value="basvuranlar">
              <div class="flex flex-col gap-5">
                <div class="flex flex-wrap items-center gap-3">
                  <Show when={bulk && rows().length > 0}>
                    <AppCheckbox
                      checked={allSelected()}
                      indeterminate={someSelected()}
                      onChange={toggleAll}
                      aria-label="Listedeki tüm başvuranları seç"
                      class="pl-5"
                    />
                  </Show>
                  <AppInput
                    class="min-w-64 flex-1"
                    value={term()}
                    onChange={onSearch}
                    placeholder="Aday adı veya e-posta ara…"
                    aria-label="Başvuranlarda ara"
                    leftIcon={<Search />}
                    clearable
                  />
                  <AppSelect
                    aria-label="Durum"
                    // Counts next to each stage, refreshed with the filter (technical document §7).
                    options={[
                      { value: ANY, label: `Tüm durumlar (${formatNumber(stageCounts().ALL ?? 0)})` },
                      ...STAGE_ORDER.map((stage) => ({
                        value: stage,
                        label: `${STAGE_LABELS[stage]} (${formatNumber(stageCounts()[stage] ?? 0)})`,
                      })),
                    ]}
                    value={status() || ANY}
                    onChange={(v) => setFilters({ durum: v === ANY ? '' : v })}
                    triggerClass="w-48"
                    class="w-auto"
                  />
                  <AppSelect
                    aria-label="Sıralama"
                    options={SORTS}
                    value={sort()}
                    onChange={(v) => setFilters({ sirala: v as SortKey })}
                    triggerClass="w-52"
                    class="w-auto"
                  />
                  <Show when={isDirty()}>
                    <AppButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTerm('')
                        setSearch({ q: undefined, durum: undefined }, { replace: true })
                      }}
                    >
                      Filtreleri temizle
                    </AppButton>
                  </Show>
                  <Show when={bulk}>
                    <AppButton
                      size="sm"
                      variant="secondary"
                      leftIcon={<MessagesSquare />}
                      onClick={() => setMessaging({ applicationUids: null })}
                    >
                      Adaylarla iletişime geç
                    </AppButton>
                  </Show>
                  <AppTooltip content="Bu ilana gelen başvurular">
                    <AppBadge variant="secondary" size="md">
                      {formatNumber(rows().length)} kişi
                    </AppBadge>
                  </AppTooltip>
                </div>

                <Show when={bulk && selectedRows().length > 0}>
                  <BulkActionBar selected={selectedRows()} onClear={() => toggleAll(false)} onMessage={messageSelected} />
                </Show>

                <Switch>
                  <Match when={applications.isPending}>
                    <div class="flex flex-col gap-1">
                      <Index each={Array.from({ length: 6 })}>
                        {() => (
                          <div class="flex items-center gap-4 p-5">
                            <AppSkeleton variant="circle" width={48} height={48} />
                            <div class="flex flex-1 flex-col gap-2">
                              <AppSkeleton variant="text" width="26%" class="h-4" />
                              <AppSkeleton variant="text" width="44%" />
                            </div>
                          </div>
                        )}
                      </Index>
                    </div>
                  </Match>
                  <Match when={applications.isError}>
                    <AppAlert
                      variant="destructive"
                      title="Başvurular yüklenemedi"
                      description="Sunucuya ulaşılamadı."
                      actions={
                        <AppButton
                          variant="outline"
                          size="sm"
                          leftIcon={<RefreshCw />}
                          onClick={() => void applications.refetch()}
                        >
                          Tekrar dene
                        </AppButton>
                      }
                    />
                  </Match>
                  <Match when={rows().length === 0}>
                    <AppEmptyState
                      icon={<Users />}
                      title={isDirty() ? 'Sonuç bulunamadı' : 'Henüz başvuru yok'}
                      description={
                        isDirty()
                          ? 'Bu filtrelerle eşleşen başvuru yok.'
                          : 'İlan yayınlandıktan sonra gelen başvurular burada listelenir.'
                      }
                    />
                  </Match>
                  <Match when={rows().length > 0}>
                    <div class="flex flex-col">
                      <For each={rows()}>
                        {(row) => (
                          <ApplicantRow
                            row={row}
                            interviews={interviewsFor(row.id)}
                            note={noteFor(row.id)}
                            jobUid={params.uid}
                            onInvite={openInvite}
                            onManageInterview={manageInterview}
                            notesOpen={openNotes().has(row.id)}
                            onNotesOpenChange={(open) => toggleNotes(row.id, open)}
                            selected={selected().has(row.id)}
                            onSelectedChange={bulk ? (on) => setRowSelected(row.id, on) : undefined}
                          />
                        )}
                      </For>
                    </div>
                  </Match>
                </Switch>
              </div>
            </AppTabsContent>

            <AppTabsContent value="mulakatlar">
              <Show when={!interviews.isPending} fallback={<AppLoadingBlock label="Mülakatlar yükleniyor" />}>
                <InterviewsBoard
                  board={interviews.data ?? { ongoing: [], upcoming: [], past: [] }}
                  applications={applications.data?.items ?? []}
                  onManage={manageInterview}
                  onReschedule={rescheduleInterview}
                  onReinvite={reinvite}
                />
              </Show>
            </AppTabsContent>

            <AppTabsContent value="ilan">
              <div class="flex flex-col gap-8">
                <Show when={(job.data!.job_desc || job.data!.description)?.trim()}>
                  <section class="flex flex-col gap-3">
                    <h3 class="text-sm text-muted-foreground">Açıklama</h3>
                    <p class="max-w-5xl text-sm whitespace-pre-line text-foreground">
                      {job.data!.job_desc || job.data!.description}
                    </p>
                  </section>
                </Show>
                <div class="grid gap-x-8 gap-y-5 border-t border-border pt-6 sm:grid-cols-2 @3xl:grid-cols-4">
                  <Stat label="Departman" value={job.data!.department || '—'} />
                  <Stat label="Pozisyon" value={job.data!.position || '—'} />
                  <Stat label="Çalışan sayısı" value={job.data!.worker_count || '—'} />
                  <Stat label="Deneyim" value={job.data!.is_experience_required ? 'Aranıyor' : 'Şart değil'} />
                  <Stat label="Konum" value={jobLocation(job.data!) || '—'} />
                  <Stat label="Çalışma şekli" value={(job.data!.working_type ?? []).join(', ') || '—'} />
                  <Stat label="Maaş" value={formatSalary(job.data!) || 'Belirtilmemiş'} />
                  <Stat
                    label="Bitiş"
                    value={job.data!.job_end_date ? formatDate(job.data!.job_end_date) : 'Belirtilmemiş'}
                  />
                </div>
              </div>
            </AppTabsContent>
          </AppTabs>
        </Match>
      </Switch>

      <InterviewModal
        application={inviting()?.row ?? null}
        interview={inviting()?.interview ?? null}
        jobUid={params.uid}
        onClose={() => setInviting(null)}
      />

      <CandidateMessageModal
        open={messaging() !== null}
        jobUid={params.uid}
        jobTitle={job.data?.title ?? ''}
        stageCounts={stageCounts()}
        applicationUids={messaging()?.applicationUids}
        onClose={() => setMessaging(null)}
      />

      <InterviewManageModal
        interview={managing() ? (allInterviews().find((i) => i.uid === managing()!.interview.uid) ?? managing()!.interview) : null}
        application={managing() ? rowFor(managing()!.interview) : undefined}
        initialView={managing()?.view}
        onClose={() => setManaging(null)}
        onReschedule={rescheduleInterview}
        onReinvite={reinvite}
      />
    </div>
  )
}
