import { createEffect, onCleanup, Show, type JSX } from 'solid-js'
import { cn } from '@/lib/cn'
import { AppButton } from './AppButton'
import { AppSpinner } from './AppSpinner'

export interface AppInfiniteScrollProps {
  /** Whether another page exists. When false the sentinel renders `endContent` (if any). */
  hasMore: boolean
  /** True while the next page is loading — shows the spinner and pauses observation. */
  loading?: boolean
  onLoadMore: () => void
  /** IntersectionObserver `rootMargin` — how early the next page starts loading. */
  rootMargin?: string
  /** Scroll container to observe against; defaults to the viewport. */
  root?: Element | null
  /** Shown once everything is loaded (e.g. "Tüm ilanlar yüklendi"). */
  endContent?: JSX.Element
  /** Fallback button label for when the observer never fires (print, unsupported, sentinel hidden). */
  loadMoreLabel?: string
  class?: string
}

/**
 * The "load more when this scrolls into view" sentinel for non-virtualized grids (the İlanlar
 * grid). Virtualized lists use `AppVirtualList`'s own `onEndReached` instead.
 */
export function AppInfiniteScroll(props: AppInfiniteScrollProps) {
  let sentinel: HTMLDivElement | undefined

  createEffect(() => {
    if (!sentinel || !props.hasMore || props.loading) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) props.onLoadMore()
      },
      { root: props.root ?? null, rootMargin: props.rootMargin ?? '600px 0px' },
    )
    io.observe(sentinel)
    onCleanup(() => io.disconnect())
  })

  return (
    <div ref={sentinel} class={cn('flex min-h-14 items-center justify-center py-4', props.class)} aria-live="polite">
      <Show when={props.loading}>
        <AppSpinner size="md" label="Yükleniyor" />
      </Show>
      <Show when={!props.loading && props.hasMore}>
        <AppButton variant="ghost" size="sm" onClick={() => props.onLoadMore()}>
          {props.loadMoreLabel ?? 'Daha fazla yükle'}
        </AppButton>
      </Show>
      <Show when={!props.loading && !props.hasMore}>{props.endContent}</Show>
    </div>
  )
}
