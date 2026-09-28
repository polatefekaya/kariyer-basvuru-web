import config from '@/config/config'

/**
 * Product analytics for the başvuru yönetimi screens (technical document §13).
 *
 * PostHog is the estate's tool — kariyer-zamani-web already sends to it — so this loads the same
 * client from the CDN and forwards the eight events the document names. It is deliberately
 * fail-quiet: with no `VITE_POSTHOG_KEY` every call is a no-op, so a developer machine, a test
 * run and a preview build send nothing and need no configuration.
 *
 * Event names and properties are the document's, not ours; changing one silently breaks a funnel
 * someone is reading, so they live in `AnalyticsEvent` where a rename is a type error.
 */

export interface AnalyticsEvent {
  application_list_viewed: { jobId?: string; companyId?: string; status?: string; filterCount: number }
  application_filter_applied: { filterType: string; status?: string; source?: string; hasSearch: boolean }
  candidate_detail_opened: { applicationId?: string; jobId?: string; source: 'list' | 'job' | 'link' }
  /**
   * `actorRole` is always `company`. The platform has no role model and one is not planned
   * (kariyer-recruiting-service/docs/PLAN.md, "Roles are not coming"), so the property is kept
   * only because the funnel definition names it.
   */
  application_status_changed: { fromStatus: string; toStatus: string; actorRole: 'company' }
  interview_invite_opened: { entryPoint: 'list' | 'detail' }
  interview_invite_sent: { type: string; duration: number; participantCount: number }
  application_note_created: { applicationId: string; noteLength: number }
  applications_exported: { rowCount: number; filters: string }
}

type PostHog = {
  init: (key: string, options: Record<string, unknown>) => void
  capture: (event: string, properties?: Record<string, unknown>) => void
}

let client: PostHog | null = null
let loading: Promise<PostHog | null> | null = null

const key = () => import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host = () => (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com'

/** Loads the client once, on the first event rather than at startup, so it never blocks paint. */
async function load(): Promise<PostHog | null> {
  if (client) return client
  if (!key()) return null

  loading ??= import('posthog-js')
    .then((module) => {
      const posthog = module.default as unknown as PostHog
      posthog.init(key()!, { api_host: host(), capture_pageview: false, persistence: 'localStorage' })
      client = posthog
      return posthog
    })
    .catch((error) => {
      // Analytics must never take a screen down with it.
      if (config.IS_DEV) console.warn('[analytics] PostHog could not be loaded.', error)
      return null
    })

  return loading
}

/** Fire and forget: nothing here is awaited by a screen, and nothing throws into one. */
export function track<K extends keyof AnalyticsEvent>(event: K, properties: AnalyticsEvent[K]): void {
  if (!key()) {
    if (config.IS_DEV) console.debug('[analytics]', event, properties)
    return
  }

  void load().then((posthog) => posthog?.capture(event, properties as Record<string, unknown>))
}
