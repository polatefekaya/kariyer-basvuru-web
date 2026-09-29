import { For, splitProps, type JSX } from 'solid-js'
import { SegmentedControl as SegmentedPrimitive } from '@kobalte/core/segmented-control'
import { cn } from '@/lib/cn'
import { IconSlot } from './icon'

export interface AppSegmentedOption<T extends string = string> {
  value: T
  label: JSX.Element
  /** Component reference (`List`) or element (`<List />`). */
  icon?: IconSlot
  disabled?: boolean
}

export interface AppSegmentedControlProps<T extends string = string> {
  options: AppSegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** `sm` (default) matches dense settings rows; `md` for standalone use. */
  size?: 'sm' | 'md'
  /** Stretch items to fill the container. */
  fullWidth?: boolean
  disabled?: boolean
  'aria-label'?: string
  class?: string
}

/**
 * Compact single-select pill group (2–4 mutually exclusive options) with an
 * animated primary indicator. Reach for `AppSelect` beyond that.
 */
export function AppSegmentedControl<T extends string = string>(props: AppSegmentedControlProps<T>) {
  const [local] = splitProps(props, [
    'options',
    'value',
    'onChange',
    'size',
    'fullWidth',
    'disabled',
    'aria-label',
    'class',
  ])
  const md = () => local.size === 'md'

  return (
    <SegmentedPrimitive
      value={local.value}
      onChange={(v) => local.onChange(v as T)}
      disabled={local.disabled}
      aria-label={local['aria-label']}
      class={cn(
        'relative inline-flex items-center rounded-full border border-border bg-secondary/30 p-0.5',
        local.fullWidth && 'flex w-full',
        'data-[disabled]:opacity-60',
        local.class,
      )}
    >
      <SegmentedPrimitive.Indicator
        class={cn(
          // Kobalte translates the indicator by (item.offsetLeft - root.paddingLeft), so it must start
          // at the padding edge — keep this inset equal to the root's `p-0.5`.
          'absolute left-0.5 top-0.5 rounded-full bg-primary',
          'transition-[transform,width,height] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] data-[resizing=true]:transition-none',
        )}
      />
      <For each={local.options}>
        {(opt) => (
          <SegmentedPrimitive.Item
            value={opt.value}
            disabled={opt.disabled}
            class={cn(
              'relative z-10 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full transition-colors duration-200 select-none',
              md() ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs',
              local.fullWidth && 'flex-1',
              // Idle items shift to the hover token; the checked item sits on the primary indicator, so its
              // text must stay primary-foreground on hover (otherwise it's primary-hover on primary).
              'text-muted-foreground hover:text-primary-hover',
              'data-[checked]:text-primary-foreground data-[checked]:hover:text-primary-foreground',
              'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
              'has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-1 has-[input:focus-visible]:ring-offset-background',
            )}
          >
            <SegmentedPrimitive.ItemInput />
            <SegmentedPrimitive.ItemLabel class="inline-flex items-center gap-1.5 whitespace-nowrap [&_svg]:size-3.5">
              <IconSlot icon={opt.icon} />
              {opt.label}
            </SegmentedPrimitive.ItemLabel>
          </SegmentedPrimitive.Item>
        )}
      </For>
    </SegmentedPrimitive>
  )
}
