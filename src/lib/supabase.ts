import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import config from '@/config/config'
import { sharedAuthStorage, usesSharedAuthStorage } from './sharedAuthStorage'

export const AUTH_STORAGE_KEY = config.SUPABASE_URL
  ? `sb-${new URL(config.SUPABASE_URL).hostname.split('.')[0]}-auth-token`
  : ''

/**
 * Auth session source for the API client. Same settings as kariyer-zamani-web:
 * detectSessionInUrl is off so the app owns hash-token handling on redirect from the auth hub.
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
          storage: usesSharedAuthStorage() ? sharedAuthStorage : undefined,
          storageKey: AUTH_STORAGE_KEY,
        },
      })
    : null
