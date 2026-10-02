import { useInfiniteQuery, useMutation, useQuery, type InfiniteData } from '@tanstack/solid-query'
import { optimistic, optimisticMany, queryClient } from '@/lib/query'
import { currentCompanyUid } from '@/features/auth'
import config from '@/config/config'
import { applicationsApi } from './api'
import { STAGE_LABELS } from './stages'
import type {
  ApplicationListParams,
  ApplicationListResponse,
  ApplicationNote,
  ApplicationStage,
  CompanyApplicationParams,
  MessageRecipient,
  SendMessageInput,
} from './types'

export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  byJob: (jobUid: string, params: ApplicationListParams = {}) =>
    [...applicationKeys.lists(), 'job', jobUid, params] as const,
  byCompany: (params: CompanyApplicationParams = {}, companyUid?: string | null) =>
    [...applicationKeys.lists(), 'company', companyUid ?? null, params] as const,
  stats: (jobUid: string) => [...applicationKeys.all, 'stats', jobUid] as const,
  notes: (jobUid: string) => [...applicationKeys.all, 'notes', jobUid] as const,
  note: (applicationUid: string) => [...applicationKeys.all, 'note', applicationUid] as const,
  activity: (applicationUid: string) => [...applicationKeys.all, 'activity', applicationUid] as const,
  audiences: () => [...applicationKeys.all, 'audience'] as const,
  audience: (jobUid: string, stages: readonly ApplicationStage[]) =>
    [...applicationKeys.audiences(), jobUid, [...stages].sort()] as const,
}

export const APPLICATIONS_PAGE_SIZE = 60

export function useJobApplications(
  jobUid: () => string | null | undefined,
  params: () => ApplicationListParams = () => ({}),
) {
  return useQuery(() => ({
    queryKey: applicationKeys.byJob(jobUid() ?? '', params()),
    queryFn: () => applicationsApi.listByJob(jobUid()!, params()),
    enabled: !!jobUid(),
    placeholderData: (prev) => prev,
  }))
}

/** The Node adapter builds the company-wide list from the company's own postings, so it cannot run
 * before `useCurrentCompany` has resolved. The other sources scope by token and do not care. */
const companyScopeReady = () => config.RECRUITING_LIVE || config.USE_MOCKS || !!currentCompanyUid()

export function useCompanyApplicationsInfinite(params: () => CompanyApplicationParams = () => ({})) {
  return useInfiniteQuery(() => ({
    queryKey: applicationKeys.byCompany(params(), currentCompanyUid()),
    enabled: companyScopeReady(),
    queryFn: ({ pageParam }) =>
      applicationsApi.listByCompany({ ...params(), page: pageParam, limit: APPLICATIONS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    placeholderData: (prev) => prev,
  }))
}

export function useCompanyApplications(params: () => CompanyApplicationParams = () => ({})) {
  return useQuery(() => ({
    queryKey: applicationKeys.byCompany(params(), currentCompanyUid()),
    enabled: companyScopeReady(),
    queryFn: () => applicationsApi.listByCompany(params()),
    placeholderData: (prev) => prev,
  }))
}

export function useApplicationStats(jobUid: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: applicationKeys.stats(jobUid() ?? ''),
    queryFn: () => applicationsApi.stats(jobUid()!),
    enabled: !!jobUid(),
  }))
}

export function useJobNotes(jobUid: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: applicationKeys.notes(jobUid() ?? ''),
    queryFn: () => applicationsApi.notesByJob(jobUid()!),
    enabled: !!jobUid(),
  }))
}

/** One application's note, for screens about a single person rather than a whole posting. */
export function useApplicationNote(applicationUid: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: applicationKeys.note(applicationUid() ?? ''),
    queryFn: () => applicationsApi.note(applicationUid()!),
    enabled: !!applicationUid(),
  }))
}

export function useApplicationActivity(applicationUid: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: applicationKeys.activity(applicationUid() ?? ''),
    queryFn: () => applicationsApi.activity(applicationUid()!),
    enabled: !!applicationUid(),
  }))
}

type ListCache = ApplicationListResponse | InfiniteData<ApplicationListResponse>

const patchLists = (applicationUid: string, patch: (row: ApplicationListResponse['items'][number]) => typeof row) => {
  const patchPage = (page: ApplicationListResponse): ApplicationListResponse => ({
    ...page,
    items: page.items.map((row) => (row.id === applicationUid ? patch(row) : row)),
  })

  return optimisticMany<ListCache>(applicationKeys.lists(), (cached) =>
    !cached ? cached : 'pages' in cached ? { ...cached, pages: cached.pages.map(patchPage) } : patchPage(cached),
  )
}

const invalidateAll = () => {
  void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
}

export function useSetApplicationStage() {
  return useMutation(() => ({
    mutationFn: ({ uid, stage, reason }: { uid: string; stage: ApplicationStage; reason?: string }) =>
      applicationsApi.setStage(uid, stage, reason),
    onMutate: ({ uid, stage }) => patchLists(uid, (row) => ({ ...row, stage, stageLabel: STAGE_LABELS[stage] })),
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: invalidateAll,
  }))
}

/**
 * The same move for many applications. Shown at once for every selected row; the service judges
 * each one, and the refetch afterwards puts back any it refused.
 */
export function useBulkSetApplicationStage() {
  return useMutation(() => ({
    mutationFn: ({ uids, stage, reason }: { uids: string[]; stage: ApplicationStage; reason?: string }) =>
      applicationsApi.setStageBulk(uids, stage, reason),
    onMutate: ({ uids, stage }) => {
      const selected = new Set(uids)
      return optimisticMany<ListCache>(applicationKeys.lists(), (cached) => {
        const patchPage = (page: ApplicationListResponse): ApplicationListResponse => ({
          ...page,
          items: page.items.map((row) =>
            selected.has(row.id) && row.allowedActions.includes(stage)
              ? { ...row, stage, stageLabel: STAGE_LABELS[stage] }
              : row,
          ),
        })
        return !cached ? cached : 'pages' in cached ? { ...cached, pages: cached.pages.map(patchPage) } : patchPage(cached)
      })
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: invalidateAll,
  }))
}

/** Who a message to these stages would reach, with who already received one. Read live. */
export function useMessageAudience(
  jobUid: () => string | null | undefined,
  stages: () => ApplicationStage[],
  enabled: () => boolean = () => true,
) {
  return useQuery(() => ({
    queryKey: applicationKeys.audience(jobUid() ?? '', stages()),
    queryFn: () => applicationsApi.messageAudience(jobUid()!, stages()),
    enabled: !!jobUid() && enabled(),
    staleTime: 0,
    placeholderData: (prev) => prev,
  }))
}

export function useSendCandidateMessage(jobUid: () => string | null | undefined) {
  return useMutation(() => ({
    mutationFn: (input: SendMessageInput) => applicationsApi.sendMessage(jobUid()!, input),
    // The recipients read as "already messaged" straight away, in every open audience.
    onMutate: ({ applicationUids }) => {
      const sent = new Set(applicationUids)
      const now = new Date().toISOString()
      return optimisticMany<MessageRecipient[]>(applicationKeys.audiences(), (cached) =>
        cached?.map((r) =>
          sent.has(r.applicationUid) && r.email ? { ...r, lastMessagedAt: now, messageCount: r.messageCount + 1 } : r,
        ),
      )
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: invalidateAll,
  }))
}

export function useSaveNote(jobUid: () => string | null | undefined) {
  return useMutation(() => ({
    mutationFn: ({ uid, body }: { uid: string; body: string }) => applicationsApi.saveNote(uid, body),
    onMutate: async ({ uid, body }) => {
      const trimmed = body.trim()
      const rollbacks = [
        await patchLists(uid, (row) => ({ ...row, hasNote: trimmed.length > 0 })),
        await optimistic<ApplicationNote | null>(applicationKeys.note(uid), (note) =>
          !trimmed ? null : note ? { ...note, body: trimmed, updatedAt: new Date().toISOString() } : note,
        ),
        await optimistic<ApplicationNote[]>(applicationKeys.notes(jobUid() ?? ''), (notes) => {
          const list = notes ?? []
          const existing = list.find((n) => n.applicationUid === uid)

          if (!trimmed) return list.filter((n) => n.applicationUid !== uid)
          if (existing) {
            return list.map((n) => (n === existing ? { ...n, body: trimmed, updatedAt: new Date().toISOString() } : n))
          }

          return list
        }),
      ]

      return { rollback: () => rollbacks.forEach((r) => r.rollback()) }
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: invalidateAll,
  }))
}
