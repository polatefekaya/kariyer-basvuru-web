// Central app configuration — all env-derived constants live here (mirrors
// kariyer-zamani-web/src/config/config.js, Vite-flavoured: VITE_* instead of REACT_APP_*).

const config = {
  /** Backend API base URL. */
  API_BASE_URL: import.meta.env.VITE_API_URL,

  /** CDN base URL — file-service (Cloudflare R2) public assets are served from here. */
  CDN_URL: import.meta.env.VITE_CDN_URL,

  /** kariyer-file-service base URL (presigned upload / confirm / download endpoints). */
  FILE_SERVICE_URL: import.meta.env.VITE_FILE_SERVICE_URL,

  /**
   * The main Kariyer Zamanı site. The portal does not reimplement the screens that already
   * exist there — posting a job, editing one — it opens them in a new tab.
   */
  SITE_URL: (import.meta.env.VITE_SITE_URL ?? 'https://kariyerzamani.com').replace(/\/$/, ''),

  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  AUTH_HUB_URL: import.meta.env.VITE_AUTH_HUB_URL ?? 'https://auth.kariyerzamani.com/login',

  /**
   * Serve the feature APIs from in-memory mock data instead of the backend.
   * On when `VITE_USE_MOCKS=true`, or automatically in dev while Supabase isn't configured
   * (there is no way to get a Bearer token then). Off in production builds unless forced.
   */
  USE_MOCKS:
    import.meta.env.VITE_USE_MOCKS === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false' && !import.meta.env.VITE_SUPABASE_URL),

  /** kariyer-recruiting-service: the ATS pipeline, interviews, notes and activity. */
  RECRUITING_API_URL: import.meta.env.VITE_RECRUITING_API_URL ?? 'http://localhost:5340/api/recruiting',

  /**
   * Use the live recruiting service even while the Node-backed features stay mocked. Lets the
   * ATS screens run against a locally seeded service without a Supabase project for the rest.
   */
  RECRUITING_LIVE: import.meta.env.VITE_RECRUITING_LIVE === 'true',

  /**
   * Whether the pipeline extras exist: interviews, recruiter notes and the activity trail. They
   * are kariyer-recruiting-service's own tables — the Node backend has no equivalent — so when it
   * is not configured the screens leave them out instead of offering a notepad that cannot save.
   */
  get HAS_PIPELINE() {
    return this.RECRUITING_LIVE || this.USE_MOCKS
  },

  /** API request timeout (ms) — same as kariyer-zamani-web's axios instance. */
  API_TIMEOUT_MS: 15_000,

  ENV: import.meta.env.MODE,
  IS_DEV: import.meta.env.DEV,
} as const

if (config.IS_DEV) {
  console.info('[config]', {
    API_BASE_URL: config.API_BASE_URL || '❌ Missing',
    SITE_URL: config.SITE_URL,
    CDN_URL: config.CDN_URL || '❌ Missing',
    FILE_SERVICE_URL: config.FILE_SERVICE_URL || '❌ Missing',
    SUPABASE:
      config.SUPABASE_URL && config.SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing (requests go out unauthenticated)',
    ENV: config.ENV,
    MOCKS: config.USE_MOCKS ? '⚠️ ON (mock data)' : 'off',
  })
}

export default config
