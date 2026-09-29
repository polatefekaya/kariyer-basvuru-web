import { createEffect, createMemo, For, on, onMount, Show, splitProps, type Accessor, type JSX } from 'solid-js'
import { createVirtualizer, createWindowVirtualizer, type Virtualizer } from '@tanstack/solid-virtual'
import { cn } from '@/lib/cn'
import { AppSpinner } from './AppSpinner'

export interface AppVirtualListApi {
  scrollToIndex: (
    index: number,
    opts?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' },
  ) => void
  scrollToTop: () => void
  /** Underlying TanStack virtualizer for anything not covered here. */
  virtualizer: Virtualizer<HTMLDivElement, HTMLDivElement> | Virtualizer<Window, HTMLDivElement>
}

export interface AppVirtualListProps<T> {
  items: readonly T[]
  /** `index` is an accessor so the row can stay reactive when items shift. */
  renderItem: (item: T, index: Accessor<number>) => JSX.Element
  /** Stable key per item; defaults to the index. */
  itemKey?: (item: T, index: number) => string | number
  /** Initial row height guess in px (rows are measured after mount, so this only affects the scrollbar before paint). */
  estimateSize?: number | ((index: number) => number)
  /** Rows rendered beyond the viewport on each side. */
  overscan?: number
  /** Vertical gap between rows in px (applied by the virtualizer, not CSS). */
  gap?: number
  /**
   * `self` (default): the list is its own scroll container — give it a height via `height` or `class`.
   * `window`: the page scrolls; the list only positions rows.
   */
  scrollParent?: 'self' | 'window'
  height?: number | string
  /** Non-virtual content above / below the rows (scrolls with them). */
  header?: JSX.Element
  footer?: JSX.Element
  /** Rendered instead of rows when `items` is empty and not `loading`. */
  empty?: JSX.Element
  /** Initial load: shows `loadingRows` skeleton rows via `renderSkeleton`, or a spinner. */
  loading?: boolean
  loadingRows?: number
  renderSkeleton?: (index: number) => JSX.Element
  /** Fetching the next page: spinner under the last row. */
  loadingMore?: boolean
  /** Called once per `items.length` when the last `endReachedThreshold` rows come into view. */
  onEndReached?: () => void
  endReachedThreshold?: number
  api?: (api: AppVirtualListApi) => void
  class?: string
  rowClass?: string
}

/**
 * Virtualised list (Virtuoso equivalent) on `@tanstack/solid-virtual`: measures real row heights,
 * supports its own scroll container or the window, header/footer, empty/loading states and
 * infinite loading via `onEndReached`.
 */
export function AppVirtualList<T>(props: AppVirtualListProps<T>) {
  const [local] = splitProps(props, [
    'items',
    'renderItem',
    'itemKey',
    'estimateSize',
    'overscan',
    'gap',
    'scrollParent',
    'height',
    'header',
    'footer',
    'empty',
    'loading',
    'loadingRows',
    'renderSkeleton',
    'loadingMore',
    'onEndReached',
    'endReachedThreshold',
    'api',
    'class',
    'rowClass',
  ])

  let scrollEl!: HTMLDivElement
  let listEl!: HTMLDivElement
  const estimate = (i: number) =>
    typeof local.estimateSize === 'function' ? local.estimateSize(i) : (local.estimateSize ?? 72)
  // Evaluate the `items` prop once per change. TanStack calls `getItemKey(i)` for EVERY index
  // when options change; if the parent passes `items={build()}` (a fresh array per read) that
  // would be O(n²) and freeze the tab.
  const data = createMemo(() => local.items)
  const count = () => (local.loading ? (local.loadingRows ?? 6) : data().length)

  // `scrollParent` is read once: the two virtualizers differ in construction, not in options.
  const virtualizer =
    local.scrollParent === 'window'
      ? createWindowVirtualizer<HTMLDivElement>({
          get count() {
            return count()
          },
          estimateSize: estimate,
          get overscan() {
            return local.overscan ?? 6
          },
          get gap() {
            return local.gap ?? 0
          },
          get scrollMargin() {
            return listEl?.offsetTop ?? 0
          },
          getItemKey: (i) => (local.itemKey && data()[i] !== undefined ? local.itemKey(data()[i]!, i) : i),
        })
      : createVirtualizer<HTMLDivElement, HTMLDivElement>({
          get count() {
            return count()
          },
          getScrollElement: () => scrollEl,
          estimateSize: estimate,
          get overscan() {
            return local.overscan ?? 6
          },
          get gap() {
            return local.gap ?? 0
          },
          getItemKey: (i) => (local.itemKey && data()[i] !== undefined ? local.itemKey(data()[i]!, i) : i),
        })

  const rows = createMemo(() => virtualizer.getVirtualItems())

  // Infinite loading: fire once per distinct length, when the tail enters the rendered window.
  let firedFor = -1
  createEffect(
    on(
      () => [rows().at(-1)?.index ?? -1, data().length, !!local.loading, !!local.loadingMore] as const,
      ([last, len, loading, loadingMore]) => {
        if (!local.onEndReached || loading || loadingMore || len === 0) return
        if (last >= len - 1 - (local.endReachedThreshold ?? 5) && firedFor !== len) {
          firedFor = len
          local.onEndReached()
        }
      },
    ),
  )

  onMount(() => {
    local.api?.({
      scrollToIndex: (i, opts) => virtualizer.scrollToIndex(i, opts),
      scrollToTop: () => virtualizer.scrollToOffset(0),
      virtualizer,
    })
  })

  // Window mode: rows are offset by the list's own top so `scrollMargin` cancels out.
  const translate = (start: number) =>
    `translateY(${start - (local.scrollParent === 'window' ? virtualizer.options.scrollMargin : 0)}px)`

  const body = (
    <>
      {local.header}
      <Show when={local.loading || data().length > 0} fallback={<Show when={local.empty}>{local.empty}</Show>}>
        <div ref={listEl} class="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          <For each={rows()}>
            {(row) => (
              <div
                data-index={row.index}
                ref={(el) => queueMicrotask(() => virtualizer.measureElement(el))}
                class={cn('absolute left-0 top-0 w-full', local.rowClass)}
                style={{ transform: translate(row.start) }}
              >
                <Show
                  when={!local.loading}
                  fallback={
                    local.renderSkeleton ? (
                      local.renderSkeleton(row.index)
                    ) : (
                      <div class="h-16 animate-pulse rounded-2xl bg-muted" />
                    )
                  }
                >
                  {local.renderItem(data()[row.index]!, () => row.index)}
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={local.loadingMore}>
        <div class="flex justify-center py-4">
          <AppSpinner size="sm" label="Daha fazla yükleniyor" />
        </div>
      </Show>
      {local.footer}
    </>
  )

  return (
    <Show when={local.scrollParent !== 'window'} fallback={<div class={cn('w-full', local.class)}>{body}</div>}>
      <div
        ref={scrollEl}
        class={cn('relative w-full overflow-y-auto overscroll-contain', local.class)}
        style={{ height: typeof local.height === 'number' ? `${local.height}px` : local.height }}
      >
        {body}
      </div>
    </Show>
  )
}
