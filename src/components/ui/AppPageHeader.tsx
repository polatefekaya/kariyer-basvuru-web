import { Show, type JSX } from 'solid-js'
import { cn } from '@/lib/cn'

export interface AppPageHeaderProps {
  title: JSX.Element
  description?: JSX.Element
  /** Decorative icon shown on the right at >= sm. */
  icon?: JSX.Element
  /** Rendered inline after the title (e.g. an AppBadge). */
  badge?: JSX.Element
  /** Right-aligned action buttons. */
  actions?: JSX.Element
  /** Optional area under a divider (filters, tabs…). */
  children?: JSX.Element
  /** `card` (default) wraps in the bordered card; `plain` renders bare. */
  variant?: 'card' | 'plain'
  class?: string
}

export function AppPageHeader(props: AppPageHeaderProps) {
  return (
    <div
      class={cn(
        'flex shrink-0 flex-col',
        (props.variant ?? 'card') === 'card' && 'rounded-2xl border border-border bg-card p-4',
        props.children && 'gap-4',
        props.class,
      )}
    >
      <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h1 class="text-lg font-medium text-foreground md:text-xl">{props.title}</h1>
            {props.badge}
          </div>
          <Show when={props.description}>
            <p class="mt-1 text-sm text-muted-foreground">{props.description}</p>
          </Show>
        </div>
        <div class="flex shrink-0 items-center gap-4">
          <Show when={props.actions}>
            <div class="flex items-center gap-2">{props.actions}</div>
          </Show>
          <Show when={props.icon}>
            <div class="hidden shrink-0 items-center justify-center text-primary [&_svg]:size-6 sm:flex">
              {props.icon}
            </div>
          </Show>
        </div>
      </div>
      <Show when={props.children}>
        <div class="border-t border-border pt-4">{props.children}</div>
      </Show>
    </div>
  )
}
