import { createStore } from 'solid-js/store'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AUTH_LOGOUT_EVENT } from '@/lib/api'
import type { AccountType } from '@/features/common/types'
import config from '@/config/config'
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from '@/lib/cookieSession'

export interface SessionState {
  /** Supabase session; null when signed out. */
  session: Session | null
  /** Supabase auth user. */
  authUser: User | null
  /** From `user_metadata.account_type`; the React app defaults unknown to `employee`. */
  accountType: AccountType | null
  /** Supabase auth UUID — what we call the API with until the legacy uid is known. */
  supabaseUid: string | null
  /** True once the initial `getSession()` resolved (so guards don't flash the login page). */
  initialized: boolean
  /**
   * Why a session that arrived from the auth hub could not be applied. Without this a failed
   * hand-off is indistinguishable from never having signed in: the user comes back from the hub
   * having just logged in and is asked to log in again, with nothing saying why.
   */
  handoffError: string | null
}

const [sessionState, setSessionState] = createStore<SessionState>(
  config.USE_MOCKS
    ? // Mock mode: behave as an already signed-in company so the access gate opens.
      {
        session: null,
        authUser: null,
        accountType: 'company',
        supabaseUid: 'mock-supabase-uid',
        initialized: true,
        handoffError: null,
      }
    : {
        session: null,
        authUser: null,
        accountType: null,
        supabaseUid: null,
        initialized: !supabase,
        handoffError: null,
      },
)

export const accountTypeOf = (user: User | null | undefined): AccountType | null => {
  if (!user) return null
  const t = user.user_metadata?.account_type
  return t === 'company' ? 'company' : 'employee'
}

function apply(session: Session | null) {
  setSessionState({
    session,
    authUser: session?.user ?? null,
    accountType: accountTypeOf(session?.user),
    supabaseUid: session?.user.id ?? null,
    initialized: true,
    ...(session ? { handoffError: null } : {}),
  })
}

/**
 * Takes the session the auth hub handed over on the URL hash.
 *
 * `setSession` only talks to the network when the access token has already expired — then it
 * spends the refresh token, and a refresh token another client has already rotated comes back
 * "Invalid Refresh Token: Already Used". That is the one case worth retrying explicitly; anything
 * else is reported rather than swallowed, because the alternative is the user coming back from a
 * successful login to a screen asking them to log in.
 */
async function applyHandoff(accessToken: string, refreshToken: string) {
  const { error } = await supabase!.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (!error) return

  const retry = await supabase!.auth.refreshSession({ refresh_token: refreshToken })

  if (!retry.error) return

  console.error('[auth] the session from the auth hub could not be applied.', error, retry.error)
  setSessionState('handoffError', error.message)
}

/**
 * Call once at app start (after `initTheme()`): consumes an auth-hub redirect hash
 * (`#access_token=…&refresh_token=…`) exactly like the React app, then tracks Supabase auth
 * changes and the API client's forced-logout event.
 */
export async function initSession() {
  if (config.USE_MOCKS || !supabase) return

  const hash = window.location.hash.replace(/^#/, '')

  if (hash.includes('access_token=')) {
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    // Off the address bar (and out of the history entry) before anything awaits, whatever happens
    // next: these are bearer tokens.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)

    if (accessToken && refreshToken) {
      await applyHandoff(accessToken, refreshToken)
    }
  }

  let { data } = await supabase.auth.getSession()

  // If local storage has no active session, check the shared domain cookie (continuous auth across subdomains)
  if (!data.session) {
    const cookieSession = readSessionCookie()
    if (cookieSession?.access_token && cookieSession?.refresh_token) {
      await applyHandoff(cookieSession.access_token, cookieSession.refresh_token)
      data = (await supabase.auth.getSession()).data
    }
  }

  if (data.session) {
    writeSessionCookie(data.session)
  }

  apply(data.session)

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      writeSessionCookie(session)
    } else {
      clearSessionCookie()
    }
    apply(session)
  })

  window.addEventListener(AUTH_LOGOUT_EVENT, () => void signOut())
}

export async function signOut() {
  clearSessionCookie()
  await supabase?.auth.signOut().catch(() => undefined)
  apply(null)
}

/**
 * Send the user to the shared auth hub.
 *
 * Its login page reads `redirect_to` (an absolute URL) and `type` — `b` is a company account, so
 * the form opens on the right variant instead of the candidate default. After a successful sign-in
 * the hub puts the session on that URL's hash (`#access_token=…&refresh_token=…`), which is what
 * `initSession` consumes above.
 *
 * The hub only honours `redirect_to` for origins on its own allow-list; one it does not recognise
 * is dropped silently and the user lands on the site's default page instead of back here.
 */
export function goToLogin() {
  const hub = config.AUTH_HUB_URL
  if (!hub) return

  const url = new URL(hub)
  // Ensure target path ends with /login to avoid auth hub root catch-all stripping query params
  if (!url.pathname.endsWith('/login')) {
    url.pathname = url.pathname.replace(/\/+$/, '') + '/login'
  }
  url.searchParams.set('type', 'b')

  // Clean return URL: strip any existing auth tokens / hash fragments before passing as redirect_to.
  const returnUrl = window.location.origin + window.location.pathname + window.location.search
  url.searchParams.set('redirect_to', returnUrl)

  window.location.assign(url.toString())
}

export { sessionState }
