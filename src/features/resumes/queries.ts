import { useMutation, useQuery } from '@tanstack/solid-query'
import { queryClient } from '@/lib/query'
import { resumesApi } from './api'

export const resumeKeys = {
  all: ['resumes'] as const,
  byEmployee: (employeeUid: string) => [...resumeKeys.all, 'employee', employeeUid] as const,
  detail: (id: number) => [...resumeKeys.all, 'detail', id] as const,
  references: (employeeUid: string) => [...resumeKeys.all, 'references', employeeUid] as const,
}

/** Every CV of one candidate (active first). */
export function useEmployeeResumes(employeeUid: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: resumeKeys.byEmployee(employeeUid() ?? ''),
    queryFn: () => resumesApi.listByEmployee(employeeUid()!),
    enabled: !!employeeUid(),
  }))
}

/** One CV with all its sections; `is_redacted` when the company hasn't unlocked it yet. */
export function useResume(id: () => number | null | undefined) {
  return useQuery(() => ({
    queryKey: resumeKeys.detail(id() ?? 0),
    queryFn: () => resumesApi.get(id()!),
    enabled: !!id(),
  }))
}

/** The candidate's references; the selected CV picks which of them it shows. */
export function useProfileReferences(employeeUid: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: resumeKeys.references(employeeUid() ?? ''),
    queryFn: () => resumesApi.references(employeeUid()!),
    enabled: !!employeeUid(),
    staleTime: 10 * 60 * 1000,
  }))
}

/**
 * Spend a CV-view right on this CV. The server decides what comes back next; we just refetch
 * the CV (and the candidate profile, whose monthly stats change) once it's recorded.
 */
export function useUnlockResume(candidateUid?: () => string | null | undefined) {
  return useMutation(() => ({
    mutationFn: (resumeId: number) => resumesApi.unlock(resumeId),
    onSuccess: async () => {
      // Keep the button pending until the CV and cached candidate identity have refreshed.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: resumeKeys.all }),
        ...(candidateUid?.() ? [queryClient.invalidateQueries({ queryKey: ['candidates'] })] : []),
      ])
    },
  }))
}
