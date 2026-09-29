import { splitProps, type ComponentProps, type JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { cn } from '@/lib/cn'
import { focusRingClass } from './field'

export type AppCardVariant = 'default' | 'outline' | 'ghost' | 'muted' | 'premium'
export type AppCardPadding = 'none' | 'sm' | 'md' | 'lg'

const variants: Record<AppCardVariant, string> = {
  default: 'bg-card border border-border',
  outline: 'bg-card border border-border',
  ghost: 'bg-transparent',
  muted: 'bg-secondary/30 border border-border/60',
  premium: 'bg-gradient-to-br from-premium-muted to-card border border-premium/30',
}

export const cardPaddings: Record<AppCardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export interface AppCardProps extends ComponentProps<'div'> {
  as?: 'div' | 'section' | 'article' | 'li'
  variant?: AppCardVariant
  padding?: AppCardPadding
  /** Hover lift + pointer cursor for clickable cards; also makes it keyboard-focusable. */
  interactive?: boolean
  class?: string
  children?: JSX.Element
}

export function AppCard(props: AppCardProps) {
  const [local, rest] = splitProps(props, ['as', 'variant', 'padding', 'interactive', 'class', 'onKeyDown'])
  // Interactive cards behave like buttons: focusable, role=button, Enter/Space activate.
  const onKeyDown = (e: KeyboardEvent & { currentTarget: HTMLElement }) => {
    if (typeof local.onKeyDown === 'function') local.onKeyDown(e as never)
    if (!local.interactive || e.defaultPrevented) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.currentTarget.click()
    }
  }
  return (
    <Dynamic
      component={local.as ?? 'div'}
      role={local.interactive ? 'button' : undefined}
      tabIndex={local.interactive ? 0 : undefined}
      onKeyDown={onKeyDown}
      class={cn(
        'flex flex-col rounded-2xl text-card-foreground transition-all duration-200',
        variants[local.variant ?? 'default'],
        cardPaddings[local.padding ?? 'md'],
        local.interactive &&
          cn(
            'cursor-pointer select-none hover:-translate-y-px hover:border-primary/30 active:translate-y-0',
            focusRingClass,
          ),
        local.class,
      )}
      {...rest}
    />
  )
}

export interface AppCardHeaderProps extends ComponentProps<'div'> {
  /** Adds the `border-b border-border/50 pb-2 mb-4` divider from CardGrid. */
  divider?: boolean
  /** Right-aligned slot (actions, badge, icon). */
  actions?: JSX.Element
}

export const AppCardHeader = (props: AppCardHeaderProps) => {
  const [local, rest] = splitProps(props, ['class', 'divider', 'actions', 'children'])
  return (
    <div
      class={cn(
        'flex items-start justify-between gap-4',
        local.divider && 'mb-4 border-b border-border/50 pb-3',
        local.class,
      )}
      {...rest}
    >
      <div class="flex min-w-0 flex-1 flex-col gap-1">{local.children}</div>
      {local.actions && <div class="flex shrink-0 items-center gap-2">{local.actions}</div>}
    </div>
  )
}

export const AppCardTitle = (props: ComponentProps<'h3'>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <h3 class={cn('text-lg font-medium text-foreground', local.class)} {...rest} />
}

export const AppCardDescription = (props: ComponentProps<'p'>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <p class={cn('text-sm text-muted-foreground', local.class)} {...rest} />
}

export const AppCardContent = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <div class={cn('flex flex-col gap-4', local.class)} {...rest} />
}

export const AppCardFooter = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <div class={cn('mt-4 flex items-center gap-2 border-t border-border pt-4', local.class)} {...rest} />
}

/** Section eyebrow used above card groups (`text-xs font-medium`). */
export const AppSectionLabel = (props: ComponentProps<'span'>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <span class={cn('text-xs font-medium text-muted-foreground', local.class)} {...rest} />
}
