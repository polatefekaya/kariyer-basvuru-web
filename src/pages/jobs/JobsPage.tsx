import { createMemo, createSignal, For, Index, Match, Show, Switch } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { Briefcase, Plus, RefreshCw, SearchX } from 'lucide-solid'
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppEmptyState,
  AppInfiniteScroll,
  AppModal,
  AppModalContent,
  AppModalDescription,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
  AppPageHeader,
  toast,
} from '@/components/ui'
import { JobCardSkeleton, JobRowSkeleton } from '@/components/jobs'
import { useCurrentCompany } from '@/features/auth'
import {
  JOB_STATUS_LABELS,
  useDeleteJob,
  useMyJobsInfinite,
  useSetJobStatus,
  type JobListItem,
  type JobStatus,
} from '@/features/jobs'
import { formatNumber } from '@/lib/format'
import { companyJobsPath, NEW_JOB_PATH, openSite } from '@/lib/site'
import { JobCardConnected } from './JobCardConnected'
import { JobRowConnected } from './JobRowConnected'
import { JobsFilterBar } from './JobsFilterBar'
import { JobsViewToggle, useJobsView } from './JobsViewToggle'
import { useJobsFilters } from './useJobsFilters'

const GRID_CLASS = 'grid grid-cols-1 items-start gap-6 @3xl:grid-cols-2 @5xl:grid-cols-3'
/** Rows view: borderless rows straight on the page; each row is its own rounded hover target. */
const ROWS_CLASS = 'flex flex-col gap-1'

/** İlanlar — the company's postings as an infinitely scrolling, filterable 3-column card grid. */
export function JobsPage() {
  const navigate = useNavigate()
  const company = useCurrentCompany()
  const companyUid = () => company.data?.uid
  const { filters, set, reset, isDirty, apiParams } = useJobsFilters()
  const [view, setView] = useJobsView()

  const jobs = useMyJobsInfinite(companyUid, apiParams)
  const rows = createMemo<JobListItem[]>(() => jobs.data?.pages.flatMap((p) => p.data) ?? [])
  const total = () => jobs.data?.pages[0]?.pagination.totalItems
  // First load or a filter change with no cached page → skeleton grid; later refetches keep the cards.
  const showSkeleton = () => jobs.isPending || (jobs.isPlaceholderData && jobs.isFetching && rows().length === 0)

  const setStatus = useSetJobStatus()
  const remove = useDeleteJob()
  const [pendingDelete, setPendingDelete] = createSignal<JobListItem | null>(null)

  const onSetStatus = (job: JobListItem, status: JobStatus) =>
    setStatus.mutate(
      { uid: job.uid, status },
      {
        onSuccess: () =>
          toast.success(`"${job.title}" ${JOB_STATUS_LABELS[status].toLocaleLowerCase('tr-TR')} olarak işaretlendi`),
        onError: () => toast.error('İlan durumu güncellenemedi'),
      },
    )
  const confirmDelete = () => {
    const job = pendingDelete()
    if (!job) return
    setPendingDelete(null)
    remove.mutate(job.uid, {
      onSuccess: () => toast.success(`"${job.title}" silindi`),
      onError: () => toast.error('İlan silinemedi'),
    })
  }

  const openCandidate = (a: { uid: string }) => navigate(`/adaylar/${a.uid}`)
  /** Same handlers for both views; items in the ⋯ menu appear only for the handlers provided. */
  const actions = {
    // "Başvurular" on a job opens its detail page, which leads with the applicant list.
    onOpen: (j: JobListItem) => navigate(`/ilanlar/${j.uid}`),
    // Editing lives on the main site, and only its job list can open the editor.
    onEdit: () => (companyUid() ? openSite(companyJobsPath(companyUid()!)) : toast.info('Şirket bilgisi yükleniyor')),
    onDuplicate: () => toast.info('İlan kopyalama yakında'),
    onSetStatus,
    onDelete: setPendingDelete,
  }

  return (
    <div class="@container flex w-full flex-col gap-6 sm:px-2 lg:px-6">
      <AppPageHeader
        variant="plain"
        title="İlanlar"
        badge={
          <Show when={total() !== undefined}>
            <AppBadge variant="secondary" size="md">
              {formatNumber(total()!)} ilan
            </AppBadge>
          </Show>
        }
        description="Yayındaki ilanlarınızı, taslakları ve başvuruları buradan yönetin."
        actions={
          <AppButton leftIcon={<Plus />} onClick={() => openSite(NEW_JOB_PATH)}>
            Yeni İlan
          </AppButton>
        }
      />

      {/* Tabs + filters pin to the top of the scrolling <main>. Chrome insets the sticky rectangle by the
          scroll container's padding (p-4 / sm:p-6), so the negative `top` lets the bar reach the real edge; the
          negative margins keep the flow position while the padding extends the background above and below. */}
      <div class="sticky -top-4 z-20 -mt-4 -mb-6 bg-background pt-4 pb-6 sm:-top-6 sm:-mt-6 sm:pt-6">
        <JobsFilterBar
          filters={filters()}
          onChange={set}
          onReset={reset}
          isDirty={isDirty()}
          trailing={<JobsViewToggle value={view()} onChange={setView} />}
        />
      </div>

      <Switch>
        <Match when={jobs.isError}>
          <AppAlert
            variant="destructive"
            title="İlanlar yüklenemedi"
            description={(jobs.error as Error | null)?.message ?? 'Sunucuya ulaşılamadı.'}
            actions={
              <AppButton variant="outline" size="sm" leftIcon={<RefreshCw />} onClick={() => void jobs.refetch()}>
                Tekrar dene
              </AppButton>
            }
          />
        </Match>
        <Match when={showSkeleton()}>
          <Show
            when={view() === 'cards'}
            fallback={
              <div class={ROWS_CLASS} aria-busy="true" aria-label="İlanlar yükleniyor">
                <Index each={Array.from({ length: 8 })}>{() => <JobRowSkeleton bordered="none" />}</Index>
              </div>
            }
          >
            <div class={GRID_CLASS} aria-busy="true" aria-label="İlanlar yükleniyor">
              <Index each={Array.from({ length: 6 })}>{() => <JobCardSkeleton bordered="none" />}</Index>
            </div>
          </Show>
        </Match>
        <Match when={rows().length === 0}>
          <Show
            when={isDirty()}
            fallback={
              <AppEmptyState
                icon={<Briefcase />}
                title="Henüz ilanınız yok"
                description="İlk ilanınızı oluşturun; başvurular burada toplanacak."
                actions={
                  <AppButton leftIcon={<Plus />} onClick={() => openSite(NEW_JOB_PATH)}>
                    Yeni İlan
                  </AppButton>
                }
              />
            }
          >
            <AppEmptyState
              icon={<SearchX />}
              title="Sonuç bulunamadı"
              description="Bu filtrelerle eşleşen ilan yok. Aramayı değiştirin ya da filtreleri temizleyin."
              actions={
                <AppButton variant="outline" onClick={reset}>
                  Filtreleri temizle
                </AppButton>
              }
            />
          </Show>
        </Match>
        <Match when={rows().length > 0}>
          <div class={cnFetching(jobs.isPlaceholderData && jobs.isFetching)}>
            <Show
              when={view() === 'cards'}
              fallback={
                <div class={ROWS_CLASS}>
                  <For each={rows()}>
                    {(job) => (
                      <JobRowConnected job={job} bordered="none" onApplicantClick={openCandidate} {...actions} />
                    )}
                  </For>
                </div>
              }
            >
              <div class={GRID_CLASS}>
                <For each={rows()}>
                  {(job) => (
                    <JobCardConnected
                      job={job}
                      expandable={false}
                      bordered="none"
                      onApplicantClick={openCandidate}
                      {...actions}
                    />
                  )}
                </For>
              </div>
            </Show>
            <AppInfiniteScroll
              hasMore={!!jobs.hasNextPage}
              loading={jobs.isFetchingNextPage}
              onLoadMore={() => void jobs.fetchNextPage()}
              endContent={
                <Show when={rows().length >= (view() === 'cards' ? 6 : 10)}>
                  <span class="text-sm text-muted-foreground">Tüm ilanlar yüklendi</span>
                </Show>
              }
            />
          </div>
        </Match>
      </Switch>

      <AppModal open={pendingDelete() !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AppModalContent size="sm">
          <AppModalHeader>
            <AppModalTitle>İlanı sil</AppModalTitle>
            <AppModalDescription>
              "{pendingDelete()?.title}" ilanı ve başvuruları kaldırılacak. Bu işlem geri alınamaz.
            </AppModalDescription>
          </AppModalHeader>
          <AppModalFooter>
            <AppButton variant="outline" onClick={() => setPendingDelete(null)}>
              Vazgeç
            </AppButton>
            <AppButton variant="danger" onClick={confirmDelete}>
              Sil
            </AppButton>
          </AppModalFooter>
        </AppModalContent>
      </AppModal>
    </div>
  )
}

/** Dim the grid while a filter change refetches over placeholder data. */
const cnFetching = (fetching: boolean) =>
  `flex flex-col gap-2 transition-opacity duration-200 ${fetching ? 'opacity-60' : 'opacity-100'}`
