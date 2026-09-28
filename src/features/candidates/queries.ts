import { useQuery } from '@tanstack/solid-query'
import { queryClient } from '@/lib/query'
import { candidatesApi } from './api'

export const candidateKeys = {
  all: ['candidates'] as const,
  profile: (uid: string, resumeId?: number | null) => [...candidateKeys.all, 'profile', uid, resumeId ?? null] as const,
  byUsername: (username: string, resumeId?: number | null) =>
    [...candidateKeys.all, 'username', username, resumeId ?? null] as const,
}

export function useCandidate(uid: () => string | null | undefined, resumeId?: () => number | null | undefined) {
  return useQuery(() => ({
    queryKey: candidateKeys.profile(uid() ?? '', resumeId?.()),
    queryFn: () => candidatesApi.get(uid()!, resumeId?.()),
    enabled: !!uid(),
  }))
}

export function useCandidateByUsername(
  username: () => string | null | undefined,
  resumeId?: () => number | null | undefined,
) {
  return useQuery(() => ({
    queryKey: candidateKeys.byUsername(username() ?? '', resumeId?.()),
    queryFn: () => candidatesApi.byUsername(username()!, resumeId?.()),
    enabled: !!username(),
  }))
}

/** Prefetch when the recruiter hovers an applicant row. */
export const prefetchCandidate = (uid: string, resumeId?: number | null) =>
  queryClient.prefetchQuery({
    queryKey: candidateKeys.profile(uid, resumeId),
    queryFn: () => candidatesApi.get(uid, resumeId),
  })
