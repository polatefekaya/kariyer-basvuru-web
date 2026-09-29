import { Show, type JSX } from 'solid-js'
import { cn } from '@/lib/cn'
import { SidebarProvider, SidebarTrigger, type SidebarProviderProps } from './AppSidebar'

export interface AppShellProps extends Omit<SidebarProviderProps, 'children' | 'class'> {
  /** The `<Sidebar>` element. */
  sidebar: JSX.Element
  /** Top bar title / breadcrumb slot. */
  title?: JSX.Element
  /** Right side of the top bar. */
  actions?: JSX.Element
  /** Hide the top bar entirely (you render your own). */
  hideTopBar?: boolean
  /** Extra classes for the top bar, e.g. `lg:hidden` to keep it mobile-only. */
  topBarClass?: string
  children: JSX.Element
  class?: string
  contentClass?: string
}

/**
 * Sidebar + top bar + scrollable content. Give it the viewport height at the app root
 * (`class="h-dvh"`); inside a frame it fills whatever height it gets.
 */
export function AppShell(props: AppShellProps) {
  return (
    <SidebarProvider
      defaultCollapsed={props.defaultCollapsed}
      collapsed={props.collapsed}
      onCollapsedChange={props.onCollapsedChange}
      storageKey={props.storageKey}
      mobileBreakpoint={props.mobileBreakpoint}
      path={props.path}
      class={cn('bg-background text-foreground', props.class)}
    >
      {props.sidebar}
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <Show when={!props.hideTopBar}>
          <header
            class={cn(
              'flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4 sm:px-6',
              props.topBarClass,
            )}
          >
            <SidebarTrigger class="-ml-2" />
            <div class="min-w-0 flex-1 truncate text-base text-foreground">{props.title}</div>
            <Show when={props.actions}>
              <div class="flex shrink-0 items-center gap-2">{props.actions}</div>
            </Show>
          </header>
        </Show>
        <main class={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6', props.contentClass)}>
          {props.children}
        </main>
      </div>
    </SidebarProvider>
  )
}
