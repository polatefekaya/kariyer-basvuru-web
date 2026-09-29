import { createEffect, createMemo, type Accessor } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { companiesApi, companyKeys, isCompanyEligible } from '@/features/companies'
import { sessionState } from './session'
import { setCurrentCompanyUid } from './companyRef'

/**
 * Why the portal is (not) usable right now. Only `ok` renders the app; the rest map to a
 * single "you can't be here" screen with the right message / redirect.
 */
export type PortalAccess =
  | 'loading'
  | 'signed-out'
  /** Signed in as an employee — send them to the candidate site. */
  | 'wrong-account-type'
  /** Company exists but `is_account_completed` is false — finish registration on the main site. */
  | 'incomplete'
  /** `status` is `pending_approval` / `rejected` — wait for admin approval. */
  | 'not-approved'
  /** Signed in, but the company profile could not be fetched (network, CORS, 5xx). */
  | 'unreachable'
  | 'ok'

/**
 * The signed-in company's profile (by Supabase uid; the backend resolves either id).
 * `data()?.uid` is the legacy company uid every job/application endpoint expects.
 */
export function useCurrentCompany() {
  const query = useQuery(() => ({
    queryKey: companyKeys.profile(sessionState.supabaseUid ?? ''),
    queryFn: () => companiesApi.get(sessionState.supabaseUid!),
    enabled: sessionState.initialized && !!sessionState.supabaseUid && sessionState.accountType === 'company',
    staleTime: 10 * 60 * 1000,
  }))

  // The API adapters need this outside component scope; see companyRef.
  createEffect(() => setCurrentCompanyUid(query.data?.uid ?? null))

  const access = createMemo<PortalAccess>(() => {
    if (!sessionState.initialized) return 'loading'
    if (!sessionState.supabaseUid) return 'signed-out'
    if (sessionState.accountType !== 'company') return 'wrong-account-type'
    if (query.isPending) return 'loading'
    // A failed lookup is not a missing session: saying "please sign in" to someone who just did
    // sends them round the login loop instead of showing them what actually broke.
    if (query.isError) return 'unreachable'
    const c = query.data
    if (!c) return 'unreachable'
    if (!c.is_account_completed) return 'incomplete'
    if (!isCompanyEligible(c)) return 'not-approved'
    return 'ok'
  })

  // The query result is a Solid store proxy, so `Object.assign` can't add `access` to it; a
  // read-through proxy keeps every `query.*` read reactive and adds the memo on top.
  return new Proxy(query, {
    get: (target, key) => (key === 'access' ? access : Reflect.get(target, key)),
  }) as typeof query & { access: Accessor<PortalAccess> }
}
