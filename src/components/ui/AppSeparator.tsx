import { Show, splitProps, type ComponentProps, type JSX } from 'solid-js'
import { Separator as SeparatorPrimitive } from '@kobalte/core/separator'
import { cn } from '@/lib/cn'

export interface AppSeparatorProps extends ComponentProps<typeof SeparatorPrimitive> {
  /** Text rendered in the middle of a horizontal separator (e.g. "veya"). */
  label?: JSX.Element
  class?: string
}

export function AppSeparator(props: AppSeparatorProps) {
  const [local, rest] = splitProps(props, ['class', 'label', 'orientation'])
  const vertical = () => local.orientation === 'vertical'

  return (
    <Show
      when={local.label && !vertical()}
      fallback={
        <SeparatorPrimitive
          orientation={local.orientation}
          class={cn(
            'shrink-0 border-none bg-border',
            vertical() ? 'h-full w-px self-stretch' : 'h-px w-full',
            local.class,
          )}
          {...rest}
        />
      }
    >
      <div class={cn('flex w-full items-center gap-3', local.class)} role="separator">
        <span class="h-px flex-1 bg-border" />
        <span class="shrink-0 text-xs text-muted-foreground">{local.label}</span>
        <span class="h-px flex-1 bg-border" />
      </div>
    </Show>
  )
}
