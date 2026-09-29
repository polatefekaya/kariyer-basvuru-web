import { createEffect, createMemo, createSignal, on, Show, splitProps, type JSX } from 'solid-js'
import { cn } from '@/lib/cn'
import { imageCache } from '@/lib/imageCache'
import { focusRingClass } from './field'
import { cdnImage, cdnImageSrcSet } from '@/lib/mediaUrl'

type LoadState = 'loading' | 'loaded'

export interface AppImageProps extends Omit<
  JSX.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcset' | 'alt' | 'class' | 'width' | 'height'
> {
  /**
   * Stored media path or URL. CDN keys (`public/...`) are routed through Cloudflare
   * Image Transformations; legacy paths resolve against the API origin; absolute /
   * `blob:` / `data:` URLs pass through untouched.
   */
  src?: string | null
  alt: string
  /** CSS size of the wrapper (number = px). */
  width?: number | string
  height?: number | string
  /**
   * Intended render width in CSS px. Drives Cloudflare resizing + a retina srcSet.
   * Falls back to a numeric `width`. Omit for fluid images that only need format=auto.
   */
  imgWidth?: number
  /** Cloudflare transform quality 1–100 (default: `DEFAULT_CDN_QUALITY`). */
  quality?: number
  objectFit?: 'cover' | 'contain' | 'fill'
  /** Above-the-fold: eager load + high fetch priority, no fade-in. */
  priority?: boolean
  /** Replace the default initial-letter fallback. */
  fallback?: JSX.Element
  rounded?: 'none' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** CSS aspect-ratio for the wrapper, e.g. `"16/9"`. */
  aspectRatio?: string
  onClick?: (e: MouseEvent) => void
  /** Class for the <img>. */
  class?: string
  /** Class for the outer wrapper. */
  wrapperClass?: string
}

const roundedMap = {
  none: 'rounded-none',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
}

/**
 * CDN-aware lazy image: Cloudflare-resized `src`/`srcSet`, skeleton while loading,
 * fade-in on load, and a stable initial-letter fallback backed by the app-wide
 * `imageCache` (a URL that 404'd once falls back everywhere, instantly).
 */
export function AppImage(props: AppImageProps) {
  const [local, img] = splitProps(props, [
    'src',
    'alt',
    'width',
    'height',
    'imgWidth',
    'quality',
    'objectFit',
    'priority',
    'fallback',
    'rounded',
    'aspectRatio',
    'onClick',
    'class',
    'wrapperClass',
  ])

  // Drive Cloudflare resizing from imgWidth, else a numeric CSS width. Fluid images
  // (string width) still get format=auto (AVIF/WebP) at full size.
  const renderWidth = () => local.imgWidth ?? (typeof local.width === 'number' ? local.width : undefined)
  const fit = () => (local.objectFit === 'contain' ? 'contain' : 'cover')
  const resolvedSrc = createMemo(() =>
    cdnImage(local.src, { width: renderWidth(), quality: local.quality, fit: fit() }),
  )
  const srcSet = createMemo(() =>
    cdnImageSrcSet(local.src, { width: renderWidth(), quality: local.quality, fit: fit() }),
  )

  const cached = () => imageCache.status(resolvedSrc())
  const showFallback = () => !resolvedSrc() || cached() === 'invalid'

  const [load, setLoad] = createSignal<LoadState>(cached() === 'valid' ? 'loaded' : 'loading')
  createEffect(
    on(resolvedSrc, (s) => setLoad(imageCache.status(s) === 'valid' ? 'loaded' : 'loading'), { defer: true }),
  )

  const dim = (v?: number | string) => (typeof v === 'number' ? `${v}px` : v)
  const style = () => ({
    width: dim(local.width) ?? '100%',
    height: dim(local.height) ?? (local.aspectRatio ? undefined : '100%'),
    'aspect-ratio': local.aspectRatio,
  })

  return (
    <div
      class={cn(
        'relative select-none overflow-hidden bg-muted',
        roundedMap[local.rounded ?? '2xl'],
        local.onClick && cn('cursor-pointer', focusRingClass),
        local.wrapperClass,
      )}
      style={style()}
      role={local.onClick ? 'button' : undefined}
      tabIndex={local.onClick ? 0 : undefined}
      aria-label={local.onClick ? local.alt : undefined}
      onClick={(e) => local.onClick?.(e)}
      onKeyDown={(e) => {
        if (!local.onClick || (e.key !== 'Enter' && e.key !== ' ')) return
        e.preventDefault()
        e.currentTarget.click()
      }}
    >
      <Show
        when={!showFallback()}
        fallback={
          <div
            class="flex h-full w-full select-none items-center justify-center bg-muted text-muted-foreground/75"
            role="img"
            aria-label={local.alt}
          >
            <Show
              when={local.fallback}
              fallback={<span class="text-3xl">{local.alt.trim().charAt(0).toUpperCase()}</span>}
            >
              {local.fallback}
            </Show>
          </div>
        }
      >
        <Show when={load() === 'loading'}>
          <div class="absolute inset-0 animate-pulse bg-muted/60" aria-hidden="true" />
        </Show>
        <img
          src={resolvedSrc()}
          srcset={srcSet()}
          alt={local.alt}
          loading={local.priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={local.priority ? 'high' : 'auto'}
          onLoad={() => {
            imageCache.setStatus(resolvedSrc()!, 'valid')
            setLoad('loaded')
          }}
          onError={() => imageCache.setStatus(resolvedSrc()!, 'invalid')}
          class={cn(
            'block h-full w-full transition-opacity duration-300',
            {
              'object-cover': (local.objectFit ?? 'cover') === 'cover',
              'object-contain': local.objectFit === 'contain',
              'object-fill': local.objectFit === 'fill',
            },
            load() === 'loaded' || local.priority ? 'opacity-100' : 'opacity-0',
            local.class,
          )}
          {...img}
        />
      </Show>
    </div>
  )
}
