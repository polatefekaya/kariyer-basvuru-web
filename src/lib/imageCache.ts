import { createStore, produce } from 'solid-js/store'

export type ImageStatus = 'valid' | 'invalid'

/**
 * App-wide memo of which resolved image URLs loaded / 404'd. Reactive, so every
 * <AppImage>/<AppAvatar> showing the same URL flips to its fallback together and a
 * list never re-requests a known-broken image per row. Mirrors
 * kariyer-zamani-web's `useImageStore` (zustand) with a Solid store.
 */
const [cache, setCache] = createStore<Record<string, ImageStatus>>({})

export const imageCache = {
  /** Reactive read — call inside a tracking scope. */
  status: (src?: string | null): ImageStatus | undefined => (src ? cache[src] : undefined),

  setStatus(src: string, status: ImageStatus) {
    if (cache[src] === status) return
    setCache(src, status)
  },

  invalidate(src?: string | null) {
    if (!src || !cache[src]) return
    setCache(
      produce((c) => {
        delete c[src]
      }),
    )
  },

  clear() {
    setCache(
      produce((c) => {
        for (const k of Object.keys(c)) delete c[k]
      }),
    )
  },
}
