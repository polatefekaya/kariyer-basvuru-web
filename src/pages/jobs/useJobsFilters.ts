import { createMemo } from 'solid-js'
import { useSearchParams } from '@solidjs/router'
import type { JobListParams, JobStatus, WorkingType } from '@/features/jobs'

/** `Tümü` plus the statuses a company actually sees on its own list. */
export type JobsStatusFilter =
  'all' | Extract<JobStatus, 'approved' | 'draft' | 'pending_approval' | 'closed' | 'expired' | 'rejected'>
export const JOBS_STATUS_FILTERS: JobsStatusFilter[] = [
  'all',
  'approved',
  'draft',
  'pending_approval',
  'closed',
  'expired',
  'rejected',
]

export type JobsSort = 'newest' | 'oldest' | 'title' | 'salary'
export const JOBS_SORT_OPTIONS: { value: JobsSort; label: string }[] = [
  { value: 'newest', label: 'En yeni' },
  { value: 'oldest', label: 'En eski' },
  { value: 'title', label: 'Başlık (A–Z)' },
  { value: 'salary', label: 'Maaş (yüksekten)' },
]
const SORT_PARAMS: Record<JobsSort, Pick<JobListParams, 'sortBy' | 'sortOrder'>> = {
  newest: { sortBy: 'created_on', sortOrder: 'DESC' },
  oldest: { sortBy: 'created_on', sortOrder: 'ASC' },
  title: { sortBy: 'title', sortOrder: 'ASC' },
  salary: { sortBy: 'max_salary', sortOrder: 'DESC' },
}

export const JOB_TYPE_OPTIONS = ['Tam Zamanlı', 'Yarı Zamanlı', 'Proje Bazlı', 'Dönemsel', 'Stajyer']
export const WORKING_TYPE_OPTIONS: WorkingType[] = ['İş Yerinde', 'Uzaktan', 'Hibrit']

export interface JobsFilters {
  q: string
  status: JobsStatusFilter
  type: string
  working: WorkingType | ''
  vitrin: boolean
  sort: JobsSort
}

const DEFAULTS: JobsFilters = { q: '', status: 'all', type: '', working: '', vitrin: false, sort: 'newest' }

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/**
 * Filter state lives in the URL (`?q=&status=&type=&work=&vitrin=1&sort=`) so a filtered view is
 * shareable and survives reloads. Empty/default values are dropped from the query string.
 */
export function useJobsFilters() {
  const [params, setParams] = useSearchParams()

  const filters = createMemo<JobsFilters>(() => {
    const status = first(params.status) as JobsStatusFilter
    const sort = first(params.sort) as JobsSort
    return {
      q: first(params.q),
      status: JOBS_STATUS_FILTERS.includes(status) ? status : 'all',
      type: first(params.type),
      working: first(params.work) as WorkingType | '',
      vitrin: first(params.vitrin) === '1',
      sort: sort in SORT_PARAMS ? sort : 'newest',
    }
  })

  const set = (patch: Partial<JobsFilters>) => {
    const next = { ...filters(), ...patch }
    setParams(
      {
        q: next.q || undefined,
        status: next.status === 'all' ? undefined : next.status,
        type: next.type || undefined,
        work: next.working || undefined,
        vitrin: next.vitrin ? '1' : undefined,
        sort: next.sort === 'newest' ? undefined : next.sort,
      },
      { replace: true },
    )
  }
  const reset = () => set(DEFAULTS)

  const isDirty = createMemo(() => {
    const f = filters()
    return f.q !== '' || f.status !== 'all' || f.type !== '' || f.working !== '' || f.vitrin
  })

  /** What the API receives (page/limit are owned by the infinite query). */
  const apiParams = createMemo<Omit<JobListParams, 'page' | 'limit'>>(() => {
    const f = filters()
    return {
      ...SORT_PARAMS[f.sort],
      ...(f.status !== 'all' && { status: f.status }),
      ...(f.q.trim() && { search: f.q.trim() }),
      ...(f.type && { type: f.type }),
      ...(f.working && { working_type: [f.working] }),
      ...(f.vitrin && { plan: ['Vitrin İlan'] }),
    }
  })

  return { filters, set, reset, isDirty, apiParams }
}
