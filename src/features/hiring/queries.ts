import { useMutation, useQuery } from '@tanstack/solid-query'
import { optimisticMany, queryClient } from '@/lib/query'
import { applicationKeys } from '@/features/applications'
import { hiringApi } from './api'
import type { Interview, InterviewCreateInput, InterviewUpdateInput, JobInterviewBoard } from './types'

export const hiringKeys = {
  all: ['hiring'] as const,
  board: (jobUid: string) => [...hiringKeys.all, 'board', jobUid] as const,
  byCandidate: (candidateUid: string) => [...hiringKeys.all, 'candidate', candidateUid] as const,
  members: () => [...hiringKeys.all, 'members'] as const,
}

export function useJobInterviews(jobUid: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: hiringKeys.board(jobUid() ?? ''),
    queryFn: () => hiringApi.boardByJob(jobUid()!),
    enabled: !!jobUid(),
  }))
}

export function useCandidateInterviews(candidateUid: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: hiringKeys.byCandidate(candidateUid() ?? ''),
    queryFn: () => hiringApi.byCandidate(candidateUid()!),
    enabled: !!candidateUid(),
  }))
}

export function useInterviewers() {
  return useQuery(() => ({
    queryKey: hiringKeys.members(),
    queryFn: () => hiringApi.members(),
    staleTime: 30 * 60 * 1000,
  }))
}

// An interview write also moves the application's stage, so both caches are invalidated.
const invalidate = () => {
  void queryClient.invalidateQueries({ queryKey: hiringKeys.all })
  void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
}

export function useCreateInterview() {
  return useMutation(() => ({
    mutationFn: ({ applicationUid, input }: { applicationUid: string; input: InterviewCreateInput }) =>
      hiringApi.create(applicationUid, input),
    onSettled: invalidate,
  }))
}

/** The fields of an update that can be shown before the service answers. */
function visiblePatch(input: InterviewUpdateInput): Partial<Interview> {
  const patch: Partial<Interview> = {}
  if (input.status) patch.status = input.status
  if (input.result) patch.result = input.result
  if (input.note !== undefined) patch.note = input.note
  if (input.candidateMessage !== undefined) patch.candidateMessage = input.candidateMessage
  if (input.startsAt) patch.startsAt = input.startsAt
  if (input.durationMinutes) patch.durationMinutes = input.durationMinutes
  if (input.type) patch.type = input.type
  if (input.timeZone) patch.timeZone = input.timeZone
  if (input.videoUrl !== undefined || input.location !== undefined) patch.location = input.videoUrl ?? input.location ?? null
  return patch
}

const isInterview = (value: unknown): value is Interview =>
  typeof value === 'object' && value !== null && 'applicationUid' in value && 'startsAt' in value

/**
 * Applies an interview change to every cached board and candidate list at once. A closed
 * interview (completed, no-show, cancelled) moves to the board's "Geçmiş" straight away, which is
 * where the service will put it.
 */
function patchInterviewCaches(uid: string, patch: Partial<Interview>) {
  return optimisticMany<JobInterviewBoard | Interview[]>(hiringKeys.all, (cached) => {
    if (!cached) return cached

    if (Array.isArray(cached)) {
      return cached.every(isInterview) ? cached.map((i) => (i.uid === uid ? { ...i, ...patch } : i)) : cached
    }

    const all = [...cached.ongoing, ...cached.upcoming, ...cached.past]
    const target = all.find((i) => i.uid === uid)
    if (!target) return cached

    const next = { ...target, ...patch }
    const without = (list: Interview[]) => list.filter((i) => i.uid !== uid)
    const swap = (list: Interview[]) => list.map((i) => (i.uid === uid ? next : i))

    return next.status === 'SCHEDULED'
      ? { ongoing: swap(cached.ongoing), upcoming: swap(cached.upcoming), past: swap(cached.past) }
      : { ongoing: without(cached.ongoing), upcoming: without(cached.upcoming), past: [next, ...without(cached.past)] }
  })
}

export function useUpdateInterview() {
  return useMutation(() => ({
    mutationFn: ({ uid, input }: { uid: string; input: InterviewUpdateInput }) => hiringApi.update(uid, input),
    onMutate: ({ uid, input }) => patchInterviewCaches(uid, visiblePatch(input)),
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: invalidate,
  }))
}

export function useCancelInterview() {
  return useMutation(() => ({
    mutationFn: ({ uid, candidateMessage }: { uid: string; candidateMessage?: string | null }) =>
      hiringApi.cancel(uid, candidateMessage),
    onMutate: ({ uid, candidateMessage }) =>
      patchInterviewCaches(uid, {
        status: 'CANCELLED',
        ...(candidateMessage ? { candidateMessage } : {}),
      }),
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: invalidate,
  }))
}
