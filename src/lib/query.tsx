import { lazy, Show, type JSX } from 'solid-js'
import { QueryClient, QueryClientProvider, type QueryKey } from '@tanstack/solid-query'
import { ApiError } from '@/lib/api'

// Dev-only and lazy: guards the import so the devtools chunk is completely excluded in production.
const SolidQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/solid-query-devtools').then((m) => ({
        default: m.SolidQueryDevtools,
      })),
    )
  : () => null

/**
 * One client for the app. Defaults match the React app's hooks
 * (`staleTime: 5 min`, no refetch on window focus) so caches behave the same way.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      // Don't hammer the API on 4xx — those won't fix themselves.
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
    },
    mutations: { retry: 0 },
  },
})

export function QueryProvider(props: { children: JSX.Element }) {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      <Show when={import.meta.env.DEV}>
        <SolidQueryDevtools buttonPosition="bottom-left" />
      </Show>
    </QueryClientProvider>
  )
}

// ---------------------------------------------------------------------------
// Optimistic updates
// ---------------------------------------------------------------------------
export interface OptimisticContext<T> {
  previous: T | undefined
  rollback: () => void
}

/**
 * Apply an optimistic cache update and get a rollback for `onError`.
 *
 *   onMutate: (vars) => optimistic<Job>(jobKeys.detail(vars.id), (job) => job && { ...job, saved: true }),
 *   onError: (_e, _v, ctx) => ctx?.rollback(),
 *   onSettled: (_d, _e, vars) => queryClient.invalidateQueries({ queryKey: jobKeys.detail(vars.id) }),
 *
 * Cancels in-flight fetches for the key first so a stale response can't overwrite the optimistic value.
 */
export async function optimistic<T>(
  key: QueryKey,
  update: (previous: T | undefined) => T | undefined,
  client: QueryClient = queryClient,
): Promise<OptimisticContext<T>> {
  await client.cancelQueries({ queryKey: key })
  const previous = client.getQueryData<T>(key)
  client.setQueryData<T>(key, update)
  return { previous, rollback: () => client.setQueryData<T>(key, previous) }
}

/** Same, but for every cache entry matching a key prefix (e.g. all job lists). */
export async function optimisticMany<T>(
  keyPrefix: QueryKey,
  update: (previous: T | undefined, key: QueryKey) => T | undefined,
  client: QueryClient = queryClient,
): Promise<OptimisticContext<never>> {
  await client.cancelQueries({ queryKey: keyPrefix })
  const snapshots = client.getQueriesData<T>({ queryKey: keyPrefix })
  for (const [key, data] of snapshots) client.setQueryData<T>(key, update(data, key))
  return {
    previous: undefined,
    rollback: () => snapshots.forEach(([key, data]) => client.setQueryData<T>(key, data)),
  }
}
