import { onMount } from 'solid-js'
import { ExternalLink } from 'lucide-solid'
import { AppButton, AppEmptyState } from '@/components/ui'
import { siteUrl } from '@/lib/site'

export interface SiteRedirectPageProps {
  /** Path on the main site, e.g. `/ilan-ver`. */
  path: string
  title: string
  description: string
}

/**
 * Sends an old portal link on to the screen that actually implements it on the main site.
 *
 * The portal deliberately does not reimplement job posting, so `/ilanlar/yeni` is not a page here
 * — but links and bookmarks to it exist, and landing on "not found" would look like the feature
 * was removed. This replaces the history entry rather than pushing one, so Geri still works.
 */
export function SiteRedirectPage(props: SiteRedirectPageProps) {
  onMount(() => window.location.replace(siteUrl(props.path)))

  return (
    <div class="mx-auto flex w-full max-w-screen-2xl flex-col gap-6">
      <AppEmptyState
        title={props.title}
        description={props.description}
        actions={
          <AppButton
            variant="outline"
            leftIcon={<ExternalLink />}
            as="a"
            href={siteUrl(props.path)}
            rel="noreferrer noopener"
          >
            Sayfayı aç
          </AppButton>
        }
      />
    </div>
  )
}
