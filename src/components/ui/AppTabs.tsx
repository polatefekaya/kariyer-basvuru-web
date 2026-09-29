import { createSignal, For, onCleanup, onMount, Show, splitProps, type ComponentProps, type JSX } from 'solid-js'
import { Tabs as TabsPrimitive } from '@kobalte/core/tabs'
import { cn } from '@/lib/cn'
import { focusRingClass } from './field'
import { IconSlot } from './icon'

export interface AppTabItem<T extends string = string> {
  value: T
  label: JSX.Element
  /** Component reference (`Briefcase`) or element (`<Briefcase />`). */
  icon?: IconSlot
  disabled?: boolean
  /** e.g. a count badge rendered after the label. Pass a function for arrays defined outside render. */
  rightElement?: JSX.Element | (() => JSX.Element)
}

export interface AppTabsProps<T extends string = string> {
  tabs: AppTabItem<T>[]
  value: T
  onChange: (value: T) => void
  /** `pill` (default): sliding primary pill. `underline`: sliding bottom bar. */
  variant?: 'pill' | 'underline'
  /** Make the tab bar stick to the top of its scroll container. */
  sticky?: boolean
  children?: JSX.Element
  class?: string
  listClass?: string
}

/**
 * Horizontal tabs with an animated indicator (Kobalte `Tabs.Indicator`), a
 * horizontally scrollable list with edge fades, and `AppTabsContent` panes.
 */
export function AppTabs<T extends string = string>(props: AppTabsProps<T>) {
  const [local] = splitProps(props, [
    'tabs',
    'value',
    'onChange',
    'variant',
    'sticky',
    'children',
    'class',
    'listClass',
  ])
  const pill = () => (local.variant ?? 'pill') === 'pill'

  let scroller!: HTMLDivElement
  const [atStart, setAtStart] = createSignal(true)
  const [atEnd, setAtEnd] = createSignal(true)

  const checkEdges = () => {
    if (!scroller) return
    const { scrollLeft, scrollWidth, clientWidth } = scroller
    setAtStart(scrollLeft <= 1)
    setAtEnd(Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 1)
  }

  onMount(() => {
    checkEdges()
    const ro = new ResizeObserver(checkEdges)
    ro.observe(scroller)
    onCleanup(() => ro.disconnect())
  })

  const mask = () => {
    const fade = '24px'
    if (atStart() && atEnd()) return undefined
    if (atStart()) return `linear-gradient(to right, black 0%, black calc(100% - ${fade}), transparent)`
    if (atEnd()) return `linear-gradient(to right, transparent, black ${fade}, black 100%)`
    return `linear-gradient(to right, transparent, black ${fade}, black calc(100% - ${fade}), transparent)`
  }

  return (
    <TabsPrimitive
      value={local.value}
      onChange={(v) => local.onChange(v as T)}
      class={cn('flex w-full min-w-0 flex-col', local.class)}
    >
      <div class={cn('z-40 mb-4 w-full max-w-full bg-card', local.sticky && 'sticky top-0', local.listClass)}>
        <div
          ref={scroller}
          onScroll={checkEdges}
          class="scrollbar-hide w-full max-w-full min-w-0 overflow-x-auto"
          style={{ 'mask-image': mask(), '-webkit-mask-image': mask() }}
        >
          <TabsPrimitive.List
            class={cn('relative flex w-max items-center', pill() ? 'gap-1' : 'gap-4 border-b border-border')}
          >
            <For each={local.tabs}>
              {(tab) => (
                <TabsPrimitive.Trigger
                  value={tab.value}
                  disabled={tab.disabled}
                  class={cn(
                    'group relative z-10 flex select-none items-center justify-center gap-2 whitespace-nowrap text-sm transition-colors duration-200',
                    '[&_svg]:size-4 [&_svg]:shrink-0',
                    focusRingClass,
                    'text-muted-foreground hover:text-primary-hover data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
                    pill()
                      ? 'rounded-full px-4 py-2 data-[selected]:text-primary-foreground data-[selected]:hover:text-primary-foreground'
                      : 'px-1 pb-3 pt-1 data-[selected]:text-primary',
                  )}
                >
                  <IconSlot icon={tab.icon} />
                  <span>{tab.label}</span>
                  <Show when={tab.rightElement}>
                    {(el) => (typeof el() === 'function' ? (el() as () => JSX.Element)() : (el() as JSX.Element))}
                  </Show>
                </TabsPrimitive.Trigger>
              )}
            </For>
            <TabsPrimitive.Indicator
              class={cn(
                'absolute transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                pill() ? 'inset-y-0 z-0 rounded-full bg-primary' : 'bottom-0 h-0.5 rounded-full bg-primary',
              )}
            />
          </TabsPrimitive.List>
        </div>
      </div>
      <div class="flex min-h-0 w-full min-w-0 flex-1 flex-col">{local.children}</div>
    </TabsPrimitive>
  )
}

export const AppTabsContent = (props: ComponentProps<typeof TabsPrimitive.Content>) => {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <TabsPrimitive.Content
      class={cn(
        'w-full min-w-0 outline-none data-[selected]:animate-in data-[selected]:fade-in-0 data-[selected]:duration-200',
        local.class,
      )}
      {...rest}
    />
  )
}
