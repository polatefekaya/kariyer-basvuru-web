import { Show, type JSX } from 'solid-js'
import { cn } from '@/lib/cn'

export interface AppEmptyStateProps {
  icon?: JSX.Element
  title: JSX.Element
  description?: JSX.Element
  /** Primary / secondary actions rendered under the copy. */
  actions?: JSX.Element
  /** `card` (default) wraps in the standard bordered card; `plain` renders bare. */
  variant?: 'card' | 'plain'
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const paddings = { sm: 'py-8 px-4', md: 'py-12 px-6', lg: 'py-16 px-6' }

/** The `flex-col items-center py-16 bg-card border rounded-2xl text-center` pattern. */
export function AppEmptyState(props: AppEmptyStateProps) {
  return (
    <div
      class={cn(
        'flex w-full flex-col items-center justify-center text-center',
        (props.variant ?? 'card') === 'card' && 'rounded-2xl border border-border bg-card',
        paddings[props.size ?? 'md'],
        props.class,
      )}
    >
      <Show when={props.icon}>
        <div class="mb-4 flex items-center justify-center text-primary [&_svg]:size-8">{props.icon}</div>
      </Show>
      <h3 class="text-base font-medium text-foreground">{props.title}</h3>
      <Show when={props.description}>
        <p class="mt-1 max-w-sm text-sm text-muted-foreground">{props.description}</p>
      </Show>
      <Show when={props.actions}>
        <div class="mt-5 flex flex-wrap items-center justify-center gap-2">{props.actions}</div>
      </Show>
    </div>
  )
}
