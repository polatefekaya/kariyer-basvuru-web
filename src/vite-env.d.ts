/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API origin (legacy media paths resolve against this). */
  readonly VITE_API_URL?: string
  /** file-service public CDN origin (Cloudflare R2 behind Image Transformations). */
  readonly VITE_CDN_URL?: string
  /** kariyer-file-service base URL (presigned upload / download endpoints). */
  readonly VITE_FILE_SERVICE_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Base URL of kariyer-recruiting-service, e.g. https://tst.kariyerzamani.com/api/recruiting */
  readonly VITE_RECRUITING_API_URL?: string
  /** 'true' — hit the real recruiting service even when VITE_USE_MOCKS is on. */
  readonly VITE_RECRUITING_LIVE?: string
  /** 'true' | 'false' — force mock APIs on/off (default: on in dev without Supabase). */
  readonly VITE_USE_MOCKS?: string
  /** Where to send the user when the session cannot be refreshed. */
  readonly VITE_AUTH_HUB_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
