import { createSignal, onMount, Show, splitProps, type ComponentProps, type JSX } from 'solid-js'
import { Tooltip as TooltipPrimitive, type TooltipRootProps } from '@kobalte/core/tooltip'
import { cn } from '@/lib/cn'

export const tooltipContentClass = cn(
  'z-50 max-w-70 select-none overflow-hidden rounded-2xl border border-border bg-popover px-4 py-2 text-xs text-popover-foreground',
  'origin-[var(--kb-tooltip-content-transform-origin)]',
  'data-[expanded]:animate-in data-[closed]:animate-out',
  'data-[expanded]:fade-in-0 data-[closed]:fade-out-0 data-[expanded]:zoom-in-95 data-[closed]:zoom-out-95',
)

// --- Compound API (full control) -------------------------------------------
export const AppTooltipRoot = (props: TooltipRootProps) => (
  <TooltipPrimitive gutter={8} openDelay={200} closeDelay={0} {...props} />
)
export const AppTooltipTrigger = TooltipPrimitive.Trigger

export const AppTooltipContent = (props: ComponentProps<typeof TooltipPrimitive.Content>) => {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content class={cn(tooltipContentClass, local.class)} {...rest} />
    </TooltipPrimitive.Portal>
  )
}

// --- Convenience API ----------------------------------------------------------
export interface AppTooltipProps extends TooltipRootProps {
  content: JSX.Element
  children: JSX.Element
  contentClass?: string
  /** Class for the inline wrapper around `children`. */
  class?: string
}

/**
 * `<AppTooltip content="…"><AppButton …/></AppTooltip>` — wraps children in an
 * inline span trigger so disabled buttons and non-focusable elements still show
 * the tooltip. Renders children alone when `content` is empty.
 *
 * Keyboard: if the child is itself focusable (button, link, input…) the span stays out
 * of the tab order and the tooltip opens on the child's focus (`focusin` bubbles); a
 * non-focusable child makes the span the tab stop instead. Either way: one tab stop.
 */
export function AppTooltip(props: AppTooltipProps) {
  const [local, root] = splitProps(props, ['content', 'children', 'contentClass', 'class', 'open', 'onOpenChange'])
  const [open, setOpen] = createSignal(false)
  const [childFocusable, setChildFocusable] = createSignal(false)
  let span!: HTMLSpanElement
  onMount(() =>
    setChildFocusable(
      !!span.querySelector('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ),
  )

  const isOpen = () => local.open ?? open()
  const change = (v: boolean) => {
    setOpen(v)
    local.onOpenChange?.(v)
  }

  return (
    <Show when={local.content} fallback={local.children}>
      <AppTooltipRoot open={isOpen()} onOpenChange={change} {...root}>
        <TooltipPrimitive.Trigger
          as="span"
          ref={span}
          class={cn('inline-flex', local.class)}
          tabIndex={childFocusable() ? -1 : 0}
          onFocusIn={() => change(true)}
          onFocusOut={() => change(false)}
        >
          {local.children}
        </TooltipPrimitive.Trigger>
        <AppTooltipContent class={local.contentClass}>{local.content}</AppTooltipContent>
      </AppTooltipRoot>
    </Show>
  )
}
