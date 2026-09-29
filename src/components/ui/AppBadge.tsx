import { Show, splitProps, type ComponentProps, type JSX } from 'solid-js'
import { cn } from '@/lib/cn'

export type AppBadgeVariant =
  | 'primary'
  | 'primarySubtle'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'successSubtle'
  | 'warning'
  | 'destructive'
  | 'destructiveSubtle'
  | 'premium'
  | 'premiumSubtle'
  | 'muted'

const variants: Record<AppBadgeVariant, string> = {
  primary: 'bg-primary text-primary-foreground',
  primarySubtle: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border bg-transparent text-foreground',
  success: 'bg-success text-success-foreground',
  successSubtle: 'bg-success-subtle text-success-subtle-foreground border border-success-subtle-border',
  warning: 'bg-warning/15 text-warning dark:text-warning-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  destructiveSubtle: 'bg-destructive/10 text-destructive',
  premium: 'bg-premium text-premium-foreground',
  premiumSubtle: 'bg-premium/15 text-premium',
  muted: 'bg-muted text-muted-foreground',
}

const sizes = {
  sm: 'h-5 px-2 text-xs gap-1 [&_svg]:size-3',
  md: 'h-6 px-2.5 text-xs gap-1.5 [&_svg]:size-3.5',
  lg: 'h-8 px-3 text-sm gap-1.5 [&_svg]:size-4',
}

export interface AppBadgeProps extends ComponentProps<'span'> {
  variant?: AppBadgeVariant
  size?: keyof typeof sizes
  /** Leading status dot (uses `currentColor`). */
  dot?: boolean
  icon?: JSX.Element
  class?: string
}

export function AppBadge(props: AppBadgeProps) {
  const [local, rest] = splitProps(props, ['variant', 'size', 'dot', 'icon', 'class', 'children'])
  return (
    <span
      class={cn(
        'inline-flex shrink-0 select-none items-center whitespace-nowrap rounded-full',
        variants[local.variant ?? 'primarySubtle'],
        sizes[local.size ?? 'md'],
        local.class,
      )}
      {...rest}
    >
      <Show when={local.dot}>
        <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
      </Show>
      {local.icon}
      {local.children}
    </span>
  )
}

/** Circular count bubble (notifications, tab counts). */
export function AppCountBadge(props: { count: number; max?: number; variant?: AppBadgeVariant; class?: string }) {
  const max = () => props.max ?? 99
  const text = () => (props.count > max() ? `${max()}+` : String(props.count))
  return (
    <Show when={props.count > 0}>
      <span
        class={cn(
          'inline-flex h-5 min-w-5 select-none items-center justify-center rounded-full px-1.5 text-xs',
          variants[props.variant ?? 'primary'],
          props.class,
        )}
      >
        {text()}
      </span>
    </Show>
  )
}
