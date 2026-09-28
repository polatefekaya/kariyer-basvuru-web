// Single source of truth for resolving a stored image/media path into a URL.
//
// Storage conventions:
//   - file-service (CDN) keys look like `public/images/<ULID>-name.jpg`
//   - legacy backend paths look like `images/<uuid>-name.jpg`
// New `public/`|`private/` keys resolve to the CDN; everything else falls back
// to the legacy API origin, so old and new media render side-by-side with zero
// data migration. Absolute (`http(s):`), `blob:` and `data:` URLs pass through.
//
// Kept byte-for-byte compatible with kariyer-zamani-web/src/utils/mediaUrl.ts so
// both apps produce identical transform URLs (= shared Cloudflare edge cache).

import config from '@/config/config'

const stripTrailingSlash = (s: string): string => s.replace(/\/+$/, '')

const CDN_URL = stripTrailingSlash(config.CDN_URL || '')
const API_BASE_URL = stripTrailingSlash(config.API_BASE_URL || '')

const PASSTHROUGH = /^(blob:|https?:\/\/|data:)/i
const CDN_PREFIX = /^(public|private)\//i

export const resolveMediaUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined
  if (PASSTHROUGH.test(path)) return path

  const clean = path.replace(/^\/+/, '')

  if (CDN_PREFIX.test(clean) && CDN_URL) {
    return `${CDN_URL}/${clean}`
  }
  return `${API_BASE_URL}/${clean}`
}

/** True when a stored value is a file-service/CDN key (vs a legacy path or URL). */
export const isCdnKey = (path?: string | null): boolean =>
  !!path && !PASSTHROUGH.test(path) && CDN_PREFIX.test(path.replace(/^\/+/, ''))

/**
 * True for a `private/...` file-service key. Private objects are NOT served by the
 * public CDN domain — fetch them via a short-lived presigned GET from the
 * file-service, never via resolveMediaUrl.
 */
export const isPrivateKey = (path?: string | null): boolean => !!path && /^\/?private\//i.test(path)

// Standard width buckets. Snapping every requested width to one of these bounds
// the number of *unique* Cloudflare transformations — cheaper to bill and far
// better edge-cache hit rates than one transform per arbitrary pixel size.
export const WIDTH_LADDER = [64, 96, 128, 192, 256, 384, 512, 640, 768, 1024, 1280, 1600, 2048] as const
export const snapWidth = (w: number): number =>
  WIDTH_LADDER.find((x) => x >= Math.round(w)) ?? WIDTH_LADDER[WIDTH_LADDER.length - 1]!

/**
 * Default Cloudflare `quality` directive. kariyer-zamani-web's docstring says 82 but its
 * code ships 40 — we match the shipped value so both apps hit the same cached variants.
 */
export const DEFAULT_CDN_QUALITY = 40

export interface CdnImageOptions {
  /** Intended render width in CSS px; snapped to a standard bucket. Omit for full-size. */
  width?: number
  height?: number
  /** 1–100; default `DEFAULT_CDN_QUALITY`. */
  quality?: number
  fit?: 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad'
}

/**
 * Resolve a media path and, when it's a CDN asset, route it through Cloudflare
 * Image Transformations (`/cdn-cgi/image/...`): always `format=auto` (AVIF/WebP)
 * plus an optional snapped `width`. The original stays full-size in R2; Cloudflare
 * resizes/reformats on delivery and edge-caches the result.
 *
 * Legacy/API, `blob:`, `data:` and absolute URLs pass through untouched (they
 * can't be transformed), so unmigrated images keep working.
 */
export const cdnImage = (path?: string | null, opts: CdnImageOptions = {}): string | undefined => {
  const url = resolveMediaUrl(path)
  if (!url || !CDN_URL || !url.startsWith(`${CDN_URL}/`)) return url
  const key = url.slice(CDN_URL.length + 1)
  const directives = [
    'format=auto',
    `quality=${opts.quality ?? DEFAULT_CDN_QUALITY}`,
    opts.width ? `width=${snapWidth(opts.width)}` : null,
    opts.height ? `height=${snapWidth(opts.height)}` : null,
    opts.width || opts.height ? `fit=${opts.fit ?? 'cover'}` : null,
  ]
    .filter(Boolean)
    .join(',')
  return `${CDN_URL}/cdn-cgi/image/${directives}/${key}`
}

/** Retina-aware srcSet (`1x`/`2x`) for a CDN image at a given render width. */
export const cdnImageSrcSet = (path?: string | null, opts: CdnImageOptions = {}): string | undefined => {
  if (!opts.width || !isCdnKey(path)) return undefined
  const one = cdnImage(path, opts)
  const two = cdnImage(path, { ...opts, width: opts.width * 2, height: opts.height ? opts.height * 2 : undefined })
  return one && two ? `${one} 1x, ${two} 2x` : undefined
}
