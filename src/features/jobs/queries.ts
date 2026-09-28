import { useInfiniteQuery, useMutation, useQuery, type InfiniteData } from '@tanstack/solid-query'
import { optimisticMany, queryClient } from '@/lib/query'
import { jobsApi, type JobListResponse } from './api'
import type { JobCreateInput, JobDetail, JobListParams, JobStatus, JobUpdateInput } from './types'

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  mine: (companyUid: string, params: JobListParams = {}) => [...jobKeys.lists(), companyUid, params] as const,
  mineInfinite: (companyUid: string, params: JobListParams = {}) =>
    [...jobKeys.lists(), 'infinite', companyUid, params] as const,
  count: (companyUid: string) => [...jobKeys.all, 'count', companyUid] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (uid: string) => [...jobKeys.details(), uid] as const,
  statistics: (uid: string) => [...jobKeys.all, 'statistics', uid] as const,
}

// ---------------------------------------------------------------------------
// Queries — Solid accessors so the query re-keys when inputs change.
// ---------------------------------------------------------------------------
export function useMyJobs(companyUid: () => string | null | undefined, params: () => JobListParams = () => ({})) {
  return useQuery(() => ({
    queryKey: jobKeys.mine(companyUid() ?? '', params()),
    queryFn: () => jobsApi.listMine(companyUid()!, params()),
    enabled: !!companyUid(),
    placeholderData: (prev) => prev,
  }))
}

/** Page size of the infinite İlanlar grid — a multiple of 3 so the last row of a page is full. */
export const JOBS_PAGE_SIZE = 24

/**
 * Same list, paged for infinite scroll. `params` must not contain `page`/`limit`; the hook owns them.
 * `data.pages[i].data` are the rows; `hasNextPage` / `fetchNextPage` drive the sentinel.
 */
export function useMyJobsInfinite(
  companyUid: () => string | null | undefined,
  params: () => Omit<JobListParams, 'page' | 'limit'> = () => ({}),
) {
  return useInfiniteQuery(() => ({
    queryKey: jobKeys.mineInfinite(companyUid() ?? '', params()),
    queryFn: ({ pageParam }) =>
      jobsApi.listMine(companyUid()!, { ...params(), page: pageParam, limit: JOBS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasNext ? last.pagination.currentPage + 1 : undefined),
    enabled: !!companyUid(),
    placeholderData: (prev) => prev,
  }))
}

export function useMyJobCount(companyUid: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: jobKeys.count(companyUid() ?? ''),
    queryFn: () => jobsApi.countMine(companyUid()!),
    enabled: !!companyUid(),
  }))
}

export function useJob(uid: () => string | null | undefined, opts: { withStats?: boolean } = {}) {
  return useQuery(() => ({
    queryKey: [...jobKeys.detail(uid() ?? ''), { withStats: !!opts.withStats }] as const,
    queryFn: () => jobsApi.detail(uid()!, opts),
    enabled: !!uid(),
  }))
}

export function useJobStatistics(uid: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: jobKeys.statistics(uid() ?? ''),
    queryFn: () => jobsApi.statistics(uid()!),
    enabled: !!uid(),
  }))
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
/** `lists()` covers both `useMyJobs` pages and `useMyJobsInfinite` (`{ pages, pageParams }`) caches. */
const patchListCaches = (patchPage: (page: JobListResponse) => JobListResponse) =>
  optimisticMany<JobListResponse | InfiniteData<JobListResponse>>(jobKeys.lists(), (cached) =>
    !cached ? cached : 'pages' in cached ? { ...cached, pages: cached.pages.map(patchPage) } : patchPage(cached),
  )

const patchJobEverywhere = async (uids: readonly string[], patch: Partial<JobDetail>) => {
  const set = new Set(uids)
  const details = await optimisticMany<JobDetail>(jobKeys.details(), (j) =>
    j && set.has(j.uid) ? { ...j, ...patch } : j,
  )
  const lists = await patchListCaches((page) => ({
    ...page,
    data: page.data.map((j) => (set.has(j.uid) ? { ...j, ...patch } : j)),
  }))
  return { rollback: () => (details.rollback(), lists.rollback()) }
}

const invalidateJobs = () => queryClient.invalidateQueries({ queryKey: jobKeys.all })

export function useCreateJob() {
  return useMutation(() => ({
    mutationFn: (input: JobCreateInput) => jobsApi.create(input),
    onSuccess: (job) => queryClient.setQueryData([...jobKeys.detail(job.uid), { withStats: false }], job),
    onSettled: invalidateJobs,
  }))
}

export function useUpdateJob() {
  return useMutation(() => ({
    mutationFn: ({ uid, input }: { uid: string; input: JobUpdateInput }) => jobsApi.update(uid, input),
    onMutate: ({ uid, input }) =>
      patchJobEverywhere([uid], { ...(input as Partial<JobDetail>), modified_on: new Date().toISOString() }),
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: invalidateJobs,
  }))
}

/** Publish / close / expire a posting — flips `status` instantly in the list and detail. */
export function useSetJobStatus() {
  return useMutation(() => ({
    mutationFn: ({ uid, status }: { uid: string; status: JobStatus }) => jobsApi.setStatus(uid, status),
    onMutate: ({ uid, status }) => patchJobEverywhere([uid], { status, is_active: status === 'approved' }),
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: invalidateJobs,
  }))
}

export function useBulkSetJobStatus() {
  return useMutation(() => ({
    mutationFn: ({ uids, status }: { uids: string[]; status: JobStatus }) => jobsApi.bulkSetStatus(uids, status),
    onMutate: ({ uids, status }) => patchJobEverywhere(uids, { status, is_active: status === 'approved' }),
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: invalidateJobs,
  }))
}

/** Soft-delete — drops the row from every cached list immediately. */
export function useDeleteJob() {
  return useMutation(() => ({
    mutationFn: (uid: string) => jobsApi.remove(uid),
    onMutate: async (uid) => patchListCaches((page) => ({ ...page, data: page.data.filter((j) => j.uid !== uid) })),
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: invalidateJobs,
  }))
}
