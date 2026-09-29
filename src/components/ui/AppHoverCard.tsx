import { Show, splitProps, type ComponentProps, type JSX, type ValidComponent } from 'solid-js'
import { HoverCard as HoverCardPrimitive, type HoverCardRootProps } from '@kobalte/core/hover-card'
import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import { cn } from '@/lib/cn'
import { focusRingClass } from './field'

/** Same surface as dropdown/select content so every floating panel matches. */
export const hoverCardContentClass = cn(
  'z-50 w-64 rounded-2xl border border-border bg-card p-4 text-card-foreground outline-none',
  'origin-[var(--kb-hovercard-content-transform-origin)]',
  'data-[expanded]:animate-in data-[closed]:animate-out',
  'data-[expanded]:fade-in-0 data-[closed]:fade-out-0 data-[expanded]:zoom-in-95 data-[closed]:zoom-out-95',
)

// --- Compound API -----------------------------------------------------------
export const AppHoverCardRoot = (props: HoverCardRootProps) => (
  <HoverCardPrimitive openDelay={300} closeDelay={150} gutter={8} {...props} />
)

export function AppHoverCardTrigger<T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, ComponentProps<typeof HoverCardPrimitive.Trigger> & { class?: string }>,
) {
  const [local, rest] = splitProps(props as { class?: string }, ['class'])
  return (
    <HoverCardPrimitive.Trigger
      as="button"
      type="button"
      class={cn('rounded-full', focusRingClass, local.class)}
      {...rest}
    />
  )
}

export const AppHoverCardContent = (props: ComponentProps<typeof HoverCardPrimitive.Content>) => {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content class={cn(hoverCardContentClass, local.class)} {...rest} />
    </HoverCardPrimitive.Portal>
  )
}

// --- Convenience API ----------------------------------------------------------
export interface AppHoverCardProps extends HoverCardRootProps {
  /** Card body; pass a function when the content is defined outside render. */
  content: JSX.Element | (() => JSX.Element)
  children: JSX.Element
  contentClass?: string
  /** Class for the trigger button. */
  class?: string
}

/**
 * `<AppHoverCard content={<UserPreview />}><AppAvatar … /></AppHoverCard>` — wraps the child in a
 * focusable trigger that opens the card on hover (300 ms) or keyboard focus. Renders the child
 * alone when `content` is empty.
 */
export function AppHoverCard(props: AppHoverCardProps) {
  const [local, root] = splitProps(props, ['content', 'children', 'contentClass', 'class'])
  return (
    <Show when={local.content} fallback={local.children}>
      <AppHoverCardRoot {...root}>
        <AppHoverCardTrigger class={cn('inline-flex', local.class)}>{local.children}</AppHoverCardTrigger>
        <AppHoverCardContent class={local.contentClass}>
          {typeof local.content === 'function' ? (local.content as () => JSX.Element)() : local.content}
        </AppHoverCardContent>
      </AppHoverCardRoot>
    </Show>
  )
}
