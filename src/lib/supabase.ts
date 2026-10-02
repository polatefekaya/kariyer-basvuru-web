import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import config from '@/config/config'
import { sharedAuthStorage, sharedCookieDomain } from '@/lib/sharedAuthStorage'

/**
 * Auth session source for the API client. Same settings as kariyer-zamani-web:
 * detectSessionInUrl is off so the app owns hash-token handling on redirect from the auth hub.
 *
 * On *.kariyerzamani.com the session lives in parent-domain cookies (sharedAuthStorage), so this
 * portal, the auth hub and the main site share one login. Elsewhere (localhost) it stays in
 * localStorage.
 *
 * `null` when the env is missing (e.g. the /dev page without a .env) — the API client then
 * sends requests without a Bearer token instead of crashing at import time.
 */
export const supabase: SupabaseClient | null =
  config.SUPABASE_URL && config.SUPABASE_ANON_KEY
    ? createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: {
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
          storage: sharedCookieDomain() ? sharedAuthStorage : undefined,
        },
      })
    : null
