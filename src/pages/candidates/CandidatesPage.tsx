import { createEffect, createMemo, createSignal, For, Index, Match, on, Show, Switch } from 'solid-js'
import { useSearchParams } from '@solidjs/router'
import { RefreshCw, Search, Users } from 'lucide-solid'
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppEmptyState,
  AppInfiniteScroll,
  AppInput,
  AppPageHeader,
  AppSelect,
  AppSkeleton,
  AppTabs,
} from '@/components/ui'
import { useCurrentCompany } from '@/features/auth'
import {
  APPLICATION_STAGES,
  STAGE_LABELS,
  useCompanyApplicationsInfinite,
  type ApplicationStage,
  type CompanyApplicationParams,
} from '@/features/applications'
import { useMyJobs } from '@/features/jobs'
import { formatNumber } from '@/lib/format'
import { track } from '@/lib/analytics'
import { CandidateListRow } from './CandidateListRow'
import { groupByCandidate } from './useCandidateGroups'

type StatusFilter = 'all' | ApplicationStage
const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  ...APPLICATION_STAGES.map((stage) => ({ value: stage as StatusFilter, label: STAGE_LABELS[stage] })),
]
const ANY_JOB = '__all'
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/**
 * Adaylar — everyone who applied to the company's postings, mixed into one list and folded per
 * person, so a candidate who applied to several jobs is one row that names all of them.
 * Scope is the company's own jobs only (the endpoint is company-scoped).
 */
export function CandidatesPage() {
  const company = useCurrentCompany()
  const companyUid = () => company.data?.uid
  const [params, setParams] = useSearchParams()

  const status = createMemo<StatusFilter>(() => {
    const v = first(params.durum) as StatusFilter
    return STATUS_TABS.some((t) => t.value === v) ? v : 'all'
  })
  const job = () => first(params.ilan)
  const q = () => first(params.q)
  const isDirty = () => !!q() || status() !== 'all' || !!job()

  const set = (patch: { q?: string; durum?: StatusFilter; ilan?: string }) => (
    track('application_filter_applied', {
      filterType: patch.q !== undefined ? 'search' : patch.durum !== undefined ? 'status' : 'job',
      status: (patch.durum ?? status()) === 'all' ? undefined : (patch.durum ?? status()),
      hasSearch: !!(patch.q ?? q()),
    }),
    setParams(
      {
        q: (patch.q ?? q()) || undefined,
        durum: (patch.durum ?? status()) === 'all' ? undefined : (patch.durum ?? status()),
        ilan: (patch.ilan ?? job()) || undefined,
      },
      { replace: true },
    )
  )

  // Local echo so typing stays instant; the URL/query gets the debounced value.
  const [search, setSearch] = createSignal(q())
  createEffect(on(q, (v) => v !== search() && setSearch(v)))
  let timer: ReturnType<typeof setTimeout> | undefined
  const onSearch = (v: string) => {
    setSearch(v)
    clearTimeout(timer)
    timer = setTimeout(() => set({ q: v }), 300)
  }

  const filters = createMemo<CompanyApplicationParams>(() => ({
    ...(status() !== 'all' && { status: status() as ApplicationStage }),
    ...(job() && { jobUid: job() }),
    ...(q().trim() && { q: q().trim() }),
  }))

  // Expanded rows live here (not in the row) so regrouping after a status change or a new page
  // doesn't collapse what the user opened.
  const [openRows, setOpenRows] = createSignal<ReadonlySet<string>>(new Set())
  const toggleRow = (uid: string, open: boolean) =>
    setOpenRows((prev) => {
      const next = new Set(prev)
      if (open) next.add(uid)
      else next.delete(uid)
      return next
    })

  createEffect(
    on(
      () => companyUid(),
      (uid) => {
        if (!uid) return
        track('application_list_viewed', {
          companyId: uid,
          status: status() === 'all' ? undefined : status(),
          filterCount: [q(), job(), status() !== 'all' ? status() : ''].filter(Boolean).length,
        })
      },
    ),
  )

  const applications = useCompanyApplicationsInfinite(filters)
  const rows = createMemo(() => applications.data?.pages.flatMap((page) => page.items) ?? [])
  const groups = createMemo(() => groupByCandidate(rows()))
  const totalApplications = () => applications.data?.pages[0]?.pagination.total
  const showSkeleton = () =>
    applications.isPending || (applications.isPlaceholderData && applications.isFetching && rows().length === 0)

  // Job filter options — the company's own postings.
  const myJobs = useMyJobs(companyUid, () => ({ limit: 100, sortBy: 'created_on', sortOrder: 'DESC' }))
  const jobOptions = createMemo(() => [
    { value: ANY_JOB, label: 'Tüm ilanlar' },
    ...(myJobs.data?.data ?? []).map((j) => ({ value: j.uid, label: j.title })),
  ])

  return (
    <div class="@container flex w-full flex-col gap-6 sm:px-2 lg:px-6">
      <AppPageHeader
        variant="plain"
        title="Adaylar"
        badge={
          <Show when={totalApplications() !== undefined}>
            {/* The application total is exact; the candidate count grows as pages load, so it is
                labelled as "listed" rather than presented as a total. */}
            <span class="flex items-center gap-2">
              <AppBadge variant="secondary" size="md">
                {formatNumber(totalApplications()!)} başvuru
              </AppBadge>
              <Show when={groups().length > 0}>
                <span class="text-sm text-muted-foreground">{formatNumber(groups().length)} aday listelendi</span>
              </Show>
            </span>
          </Show>
        }
        description="İlanlarınıza başvuran herkes tek listede; birden fazla ilana başvuranlar tek satırda toplanır."
      />

      <div class="sticky -top-4 z-20 -mt-4 -mb-6 flex flex-col gap-4 bg-background pt-4 pb-6 sm:-top-6 sm:-mt-6 sm:pt-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <AppTabs<StatusFilter>
            tabs={STATUS_TABS}
            value={status()}
            onChange={(durum) => set({ durum })}
            variant="pill"
            class="w-auto min-w-0 flex-1"
            listClass="mb-0 bg-transparent"
          />
          <Show when={isDirty()}>
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setParams({ q: undefined, durum: undefined, ilan: undefined }, { replace: true })
              }}
            >
              Filtreleri temizle
            </AppButton>
          </Show>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <AppInput
            class="min-w-72 flex-1"
            value={search()}
            onChange={onSearch}
            placeholder="Aday adı, e-posta veya ilan ara…"
            aria-label="Adaylarda ara"
            leftIcon={<Search />}
            clearable
          />
          <AppSelect
            aria-label="İlan"
            options={jobOptions()}
            value={job() || ANY_JOB}
            onChange={(v) => set({ ilan: v === ANY_JOB ? '' : v })}
            triggerClass="w-64"
            class="w-auto"
          />
        </div>
      </div>

      <Switch>
        <Match when={applications.isError}>
          <AppAlert
            variant="destructive"
            title="Adaylar yüklenemedi"
            description={(applications.error as Error | null)?.message ?? 'Sunucuya ulaşılamadı.'}
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
        <Match when={showSkeleton()}>
          <div class="flex flex-col gap-1" aria-busy="true" aria-label="Adaylar yükleniyor">
            <Index each={Array.from({ length: 8 })}>
              {() => (
                <div class="flex items-center gap-4 p-5">
                  <AppSkeleton variant="circle" width={48} height={48} />
                  <div class="flex flex-1 flex-col gap-2">
                    <AppSkeleton variant="text" width="28%" class="h-4" />
                    <AppSkeleton variant="text" width="46%" />
                  </div>
                </div>
              )}
            </Index>
          </div>
        </Match>
        <Match when={groups().length === 0}>
          <AppEmptyState
            icon={<Users />}
            title={isDirty() ? 'Sonuç bulunamadı' : 'Henüz aday yok'}
            description={
              isDirty()
                ? 'Bu filtrelerle eşleşen aday yok. Aramayı değiştirin ya da filtreleri temizleyin.'
                : 'İlanlarınıza başvuru geldikçe adaylar burada listelenecek.'
            }
            actions={
              <Show when={isDirty()}>
                <AppButton
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setParams({ q: undefined, durum: undefined, ilan: undefined }, { replace: true })
                  }}
                >
                  Filtreleri temizle
                </AppButton>
              </Show>
            }
          />
        </Match>
        <Match when={groups().length > 0}>
          <div class="flex flex-col gap-2">
            <div class="flex flex-col">
              <For each={groups()}>
                {(group) => (
                  <CandidateListRow
                    group={group}
                    expanded={openRows().has(group.uid)}
                    onExpandedChange={(open) => toggleRow(group.uid, open)}
                  />
                )}
              </For>
            </div>
            <AppInfiniteScroll
              hasMore={!!applications.hasNextPage}
              loading={applications.isFetchingNextPage}
              onLoadMore={() => void applications.fetchNextPage()}
              endContent={
                <Show when={groups().length >= 10}>
                  <span class="text-sm text-muted-foreground">Tüm adaylar yüklendi</span>
                </Show>
              }
            />
          </div>
        </Match>
      </Switch>
    </div>
  )
}
