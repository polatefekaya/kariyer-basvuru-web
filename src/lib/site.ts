import config from '@/config/config'

/**
 * Links into the main Kariyer Zamanı site.
 *
 * Posting and editing a job already have screens there — a six-step form and a modal, both with
 * their own draft handling — so the portal opens those rather than growing a second, divergent
 * copy of the same form.
 */
export const siteUrl = (path: string) => `${config.SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

/** Opens a site page in a new tab, with the opener detached. */
export function openSite(path: string) {
  window.open(siteUrl(path), '_blank', 'noopener,noreferrer')
}

/** İlan ver — the six-step posting form. */
export const NEW_JOB_PATH = '/ilan-ver'

/**
 * The company's own job list on the site, where each posting carries its Düzenle button.
 *
 * Editing is a modal over there, opened from that list and keyed in JavaScript — no URL opens a
 * specific job's editor — so this is as close as a link can get. `identifier` accepts the uid.
 */
export const companyJobsPath = (companyUid: string) => `/sirket/is-ilanlari/${companyUid}`
