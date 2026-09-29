import { useMutation, useQuery } from '@tanstack/solid-query'
import { queryClient } from '@/lib/query'
import { applicationKeys } from '@/features/applications'
import { hiringApi } from './api'
import type { InterviewCreateInput, InterviewUpdateInput } from './types'

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

export function useUpdateInterview() {
  return useMutation(() => ({
    mutationFn: ({ uid, input }: { uid: string; input: InterviewUpdateInput }) => hiringApi.update(uid, input),
    onSettled: invalidate,
  }))
}

export function useCancelInterview() {
  return useMutation(() => ({
    mutationFn: (uid: string) => hiringApi.cancel(uid),
    onSettled: invalidate,
  }))
}
