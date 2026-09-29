import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  useContext,
  type Accessor,
  type JSX,
} from 'solid-js'
import { Dialog } from '@kobalte/core/dialog'
import { ChevronLeft, ChevronsUpDown, LogOut, Menu, Moon, Sun, SunMoon, X } from 'lucide-solid'
import { setTheme, theme } from '@/lib/theme'
import { cn } from '@/lib/cn'
import {
  AppAvatar,
  AppButton,
  AppCountBadge,
  AppDropdown,
  AppDropdownContent,
  AppDropdownItem,
  AppDropdownSeparator,
  AppDropdownTrigger,
  AppTooltipContent,
  AppTooltipRoot,
  AppTooltipTrigger,
  focusRingClass,
  IconSlot,
  type IconSlot as IconSlotType,
} from '@/components/ui'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export interface SidebarContextValue {
  /** Icon-only rail (desktop only — the mobile drawer is always expanded). */
  collapsed: Accessor<boolean>
  setCollapsed: (v: boolean) => void
  toggleCollapsed: () => void
  /** Container narrower than `mobileBreakpoint`: sidebar becomes a drawer. */
  isMobile: Accessor<boolean>
  mobileOpen: Accessor<boolean>
  setMobileOpen: (v: boolean) => void
  /** Current path used for default `active` detection on items. */
  path: Accessor<string>
}

const SidebarContext = createContext<SidebarContextValue>()

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used inside <SidebarProvider>')
  return ctx
}

export interface SidebarProviderProps {
  children: JSX.Element
  defaultCollapsed?: boolean
  /** Controlled collapsed state. */
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** Persist the collapsed choice under this localStorage key (`null` disables). */
  storageKey?: string | null
  /** Below this container width (px) the sidebar renders as a drawer. */
  mobileBreakpoint?: number
  /** Override the path used for `active` detection (e.g. from a router). */
  path?: string
  class?: string
}

/**
 * Owns the sidebar state and measures its own width (ResizeObserver, not `matchMedia`), so the
 * shell behaves the same at the app root and inside a resized dev frame.
 */
export function SidebarProvider(props: SidebarProviderProps) {
  const storageKey = () => (props.storageKey === undefined ? 'kz-sidebar-collapsed' : props.storageKey)
  const readStored = () => {
    try {
      const v = storageKey() ? localStorage.getItem(storageKey()!) : null
      return v == null ? undefined : v === '1'
    } catch {
      return undefined
    }
  }
  const [internalCollapsed, setInternalCollapsed] = createSignal(readStored() ?? props.defaultCollapsed ?? false)
  const [isMobile, setIsMobile] = createSignal(false)
  const [mobileOpen, setMobileOpen] = createSignal(false)
  const [path, setPath] = createSignal(typeof location !== 'undefined' ? location.pathname : '/')

  const collapsed = createMemo(() => !isMobile() && (props.collapsed ?? internalCollapsed()))
  const setCollapsed = (v: boolean) => {
    setInternalCollapsed(v)
    props.onCollapsedChange?.(v)
    try {
      if (storageKey()) localStorage.setItem(storageKey()!, v ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
  }

  let root!: HTMLDivElement
  onMount(() => {
    const ro = new ResizeObserver(([entry]) => setIsMobile(entry!.contentRect.width < (props.mobileBreakpoint ?? 1024)))
    ro.observe(root)
    const onPop = () => setPath(location.pathname)
    window.addEventListener('popstate', onPop)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !isMobile()) {
        e.preventDefault()
        setCollapsed(!collapsed())
      }
    }
    window.addEventListener('keydown', onKey)
    onCleanup(() => {
      ro.disconnect()
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
    })
  })
  // Leaving mobile closes the drawer so it never lingers open when the layout switches.
  createEffect(() => {
    if (!isMobile()) setMobileOpen(false)
  })

  const value: SidebarContextValue = {
    collapsed,
    setCollapsed,
    toggleCollapsed: () => setCollapsed(!collapsed()),
    isMobile,
    mobileOpen,
    setMobileOpen,
    path: () => props.path ?? path(),
  }

  return (
    <SidebarContext.Provider value={value}>
      <div ref={root} class={cn('flex h-full min-h-0 w-full', props.class)}>
        {props.children}
      </div>
    </SidebarContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Sidebar (desktop rail / mobile drawer)
// ---------------------------------------------------------------------------
export interface SidebarProps {
  children: JSX.Element
  /** Expanded width in px. */
  width?: number
  collapsedWidth?: number
  class?: string
}

export function Sidebar(props: SidebarProps) {
  const ctx = useSidebar()
  const width = () => (ctx.collapsed() ? (props.collapsedWidth ?? 64) : (props.width ?? 256))
  const panelClass =
    'flex h-full min-h-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground select-none'

  return (
    <Show
      when={ctx.isMobile()}
      fallback={
        <aside
          data-collapsed={ctx.collapsed() ? '' : undefined}
          class={cn(panelClass, 'relative sticky top-0 shrink-0 transition-[width] duration-200 ease-out', props.class)}
          style={{ width: `${width()}px` }}
        >
          {props.children}
        </aside>
      }
    >
      {/* Drawer: no Portal on purpose — `fixed` then resolves against a transformed ancestor (dev frame) or the viewport. */}
      <Dialog open={ctx.mobileOpen()} onOpenChange={ctx.setMobileOpen}>
        <Dialog.Overlay
          class={cn(
            'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm',
            'data-[expanded]:animate-in data-[closed]:animate-out data-[expanded]:fade-in-0 data-[closed]:fade-out-0',
          )}
        />
        <Dialog.Content
          aria-label="Menü"
          class={cn(
            panelClass,
            'fixed inset-y-0 left-0 z-50 w-72 outline-none',
            'duration-200 data-[expanded]:animate-in data-[closed]:animate-out data-[expanded]:slide-in-from-left data-[closed]:slide-out-to-left',
            props.class,
          )}
        >
          {props.children}
        </Dialog.Content>
      </Dialog>
    </Show>
  )
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------
const DURATION = 'duration-200 ease-out'

/**
 * Content that folds away when the rail collapses. It stays mounted and animates
 * `max-width` + `opacity` in step with the rail's width transition, so nothing pops.
 */
function Reveal(props: { when: boolean; children: JSX.Element; class?: string; maxWidth?: number }) {
  return (
    <span
      class={cn(
        'flex min-w-0 items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity,padding]',
        DURATION,
        props.class,
      )}
      style={{
        'max-width': props.when ? `${props.maxWidth ?? 240}px` : '0px',
        opacity: props.when ? 1 : 0,
        'padding-left': props.when ? undefined : '0px',
      }}
      aria-hidden={!props.when}
    >
      {props.children}
    </span>
  )
}

export function SidebarHeader(props: { children: JSX.Element; class?: string }) {
  // Constant horizontal padding: the mark never moves, only the wordmark folds.
  return <div class={cn('flex h-16 shrink-0 items-center px-3.5', props.class)}>{props.children}</div>
}

/** Logo mark + wordmark; the wordmark folds away when collapsed. */
export function SidebarBrand(props: {
  mark: JSX.Element
  name: JSX.Element
  subtitle?: JSX.Element
  href?: string
  class?: string
}) {
  const ctx = useSidebar()
  const inner = () => (
    <>
      <span class="flex size-9 shrink-0 items-center justify-center text-primary [&_svg]:size-6">{props.mark}</span>
      <Reveal when={!ctx.collapsed()} class="pl-3">
        <span class="flex min-w-0 flex-col">
          <span class="truncate text-sm text-foreground">{props.name}</span>
          <Show when={props.subtitle}>
            <span class="truncate text-xs text-muted-foreground">{props.subtitle}</span>
          </Show>
        </span>
      </Reveal>
    </>
  )
  return (
    <Show when={props.href} fallback={<div class={cn('flex min-w-0 flex-1 items-center', props.class)}>{inner()}</div>}>
      <a href={props.href} class={cn('flex min-w-0 flex-1 items-center rounded-xl', focusRingClass, props.class)}>
        {inner()}
      </a>
    </Show>
  )
}

/**
 * Desktop collapse toggle, pinned to the rail's right edge so it stays put in both states.
 * Place it anywhere inside `<Sidebar>`; it positions itself. Hidden on mobile.
 */
export function SidebarCollapseButton(props: { class?: string }) {
  const ctx = useSidebar()
  return (
    <Show when={!ctx.isMobile()}>
      <AppTooltipRoot placement="right">
        <AppTooltipTrigger
          as="button"
          type="button"
          aria-label={ctx.collapsed() ? 'Kenar çubuğunu genişlet' : 'Kenar çubuğunu daralt'}
          aria-expanded={!ctx.collapsed()}
          onClick={ctx.toggleCollapsed}
          class={cn(
            'absolute top-6 -right-3.5 z-10 flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-primary-hover',
            focusRingClass,
            props.class,
          )}
        >
          <ChevronLeft class={cn('size-4 transition-transform', DURATION, ctx.collapsed() && 'rotate-180')} />
        </AppTooltipTrigger>
        <AppTooltipContent>{ctx.collapsed() ? 'Genişlet (⌘B)' : 'Daralt (⌘B)'}</AppTooltipContent>
      </AppTooltipRoot>
    </Show>
  )
}

/** Close button for the mobile drawer (renders nothing on desktop). */
export function SidebarCloseButton(props: { class?: string }) {
  const ctx = useSidebar()
  return (
    <Show when={ctx.isMobile()}>
      <AppButton
        variant="ghost"
        size="iconSm"
        aria-label="Menüyü kapat"
        onClick={() => ctx.setMobileOpen(false)}
        class={cn('text-muted-foreground', props.class)}
      >
        <X />
      </AppButton>
    </Show>
  )
}

/** Hamburger for the top bar on mobile. Renders nothing on desktop. */
export function SidebarTrigger(props: { class?: string }) {
  const ctx = useSidebar()
  return (
    <Show when={ctx.isMobile()}>
      <AppButton
        variant="ghost"
        size="icon"
        aria-label="Menüyü aç"
        aria-expanded={ctx.mobileOpen()}
        onClick={() => ctx.setMobileOpen(true)}
        class={props.class}
      >
        <Menu />
      </AppButton>
    </Show>
  )
}

export function SidebarContent(props: { children: JSX.Element; class?: string }) {
  return (
    <nav
      aria-label="Ana menü"
      class={cn(
        'flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4',
        props.class,
      )}
    >
      {props.children}
    </nav>
  )
}

export function SidebarGroup(props: { label?: JSX.Element; children: JSX.Element; class?: string }) {
  const ctx = useSidebar()
  return (
    <div class={cn('flex flex-col gap-1', props.class)}>
      <Show when={props.label}>
        {/* Fixed-height slot: the label fades out and a divider fades in, no layout change. */}
        <div class="relative mb-1 h-6">
          <div
            class={cn(
              'absolute inset-x-0 top-0 truncate px-3 text-xs text-muted-foreground transition-opacity',
              DURATION,
            )}
            style={{ opacity: ctx.collapsed() ? 0 : 1 }}
            aria-hidden={ctx.collapsed()}
          >
            {props.label}
          </div>
          <div
            class={cn('absolute inset-x-3 top-1/2 h-px bg-border transition-opacity', DURATION)}
            style={{ opacity: ctx.collapsed() ? 1 : 0 }}
            aria-hidden="true"
          />
        </div>
      </Show>
      <ul class="flex flex-col gap-1">{props.children}</ul>
    </div>
  )
}

export interface SidebarItemProps {
  label: string
  icon?: IconSlotType
  href?: string
  onClick?: (e: MouseEvent) => void
  /** Defaults to path-prefix matching against the provider's `path`. */
  active?: boolean
  /** Count bubble (hidden when 0); a dot when collapsed. */
  badge?: number
  disabled?: boolean
  class?: string
}

export function SidebarItem(props: SidebarItemProps) {
  const ctx = useSidebar()
  const active = createMemo(() => {
    if (props.active !== undefined) return props.active
    if (!props.href) return false
    const p = ctx.path()
    return p === props.href || (props.href !== '/' && p.startsWith(props.href + '/'))
  })
  const handleClick = (e: MouseEvent) => {
    props.onClick?.(e)
    if (ctx.isMobile()) ctx.setMobileOpen(false)
  }
  const itemClass = () =>
    cn(
      // px-2.5 keeps the 20px icon centred in the 40px-wide collapsed item, so it never shifts.
      'relative flex h-10 w-full items-center rounded-2xl px-2.5 text-sm transition-colors',
      active()
        ? 'bg-secondary font-medium text-primary'
        : 'text-muted-foreground hover:bg-secondary-hover hover:text-primary-hover',
      props.disabled && 'pointer-events-none opacity-50',
      focusRingClass,
      props.class,
    )
  const body = () => (
    <>
      <span class="flex size-5 shrink-0 items-center justify-center [&_svg]:size-5">
        <IconSlot icon={props.icon} />
      </span>
      <Reveal when={!ctx.collapsed()} class="flex-1 pl-3">
        <span class="min-w-0 flex-1 truncate">{props.label}</span>
        <Show when={props.badge}>
          <span class="pl-2">
            <AppCountBadge count={props.badge!} variant={active() ? 'primary' : 'secondary'} />
          </span>
        </Show>
      </Reveal>
      <span
        class={cn('absolute top-1.5 right-1.5 size-2 rounded-full bg-primary transition-opacity', DURATION)}
        style={{ opacity: ctx.collapsed() && (props.badge ?? 0) > 0 ? 1 : 0 }}
        aria-hidden="true"
      />
    </>
  )

  return (
    <li>
      {/* One trigger element per state; the tooltip is simply disabled while expanded. */}
      <AppTooltipRoot placement="right" disabled={!ctx.collapsed()}>
        <Show
          when={props.href}
          fallback={
            <AppTooltipTrigger
              as="button"
              type="button"
              onClick={handleClick}
              aria-current={active() ? 'page' : undefined}
              disabled={props.disabled}
              class={itemClass()}
            >
              {body()}
            </AppTooltipTrigger>
          }
        >
          <AppTooltipTrigger
            as="a"
            href={props.href}
            onClick={handleClick}
            aria-current={active() ? 'page' : undefined}
            aria-disabled={props.disabled || undefined}
            tabIndex={props.disabled ? -1 : undefined}
            class={itemClass()}
          >
            {body()}
          </AppTooltipTrigger>
        </Show>
        <AppTooltipContent>{props.badge ? `${props.label} (${props.badge})` : props.label}</AppTooltipContent>
      </AppTooltipRoot>
    </li>
  )
}

export function SidebarFooter(props: { children: JSX.Element; class?: string }) {
  return <div class={cn('shrink-0 border-t border-border p-3', props.class)}>{props.children}</div>
}

export interface SidebarUserCardProps {
  name: string
  subtitle?: string
  src?: string | null
  /** Extra menu items rendered above "Çıkış yap". */
  menu?: JSX.Element
  onSignOut?: () => void
  class?: string
}

/** Bottom user card: avatar + name (+ subtitle) opening a menu; the text folds away when collapsed. */
export function SidebarUserCard(props: SidebarUserCardProps) {
  const ctx = useSidebar()
  const [name, surname] = [props.name.split(' ')[0], props.name.split(' ').slice(1).join(' ')]
  return (
    <AppDropdown placement={ctx.collapsed() ? 'right-end' : 'top-start'} gutter={8}>
      <AppDropdownTrigger
        class={cn(
          'flex w-full items-center rounded-2xl p-1 text-left transition-colors hover:bg-secondary-hover',
          focusRingClass,
          props.class,
        )}
        aria-label={ctx.collapsed() ? props.name : undefined}
      >
        <AppAvatar src={props.src} name={name} surname={surname} size="sm" shape="square" />
        <Reveal when={!ctx.collapsed()} class="flex-1 pl-3">
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm text-foreground">{props.name}</span>
            <Show when={props.subtitle}>
              <span class="truncate text-xs text-muted-foreground">{props.subtitle}</span>
            </Show>
          </span>
          <ChevronsUpDown class="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Reveal>
      </AppDropdownTrigger>
      <AppDropdownContent class="w-60">
        <div class="flex items-center gap-3 px-3 py-2">
          <AppAvatar src={props.src} name={name} surname={surname} size="sm" shape="square" />
          <span class="flex min-w-0 flex-col">
            <span class="truncate text-sm text-foreground">{props.name}</span>
            <Show when={props.subtitle}>
              <span class="truncate text-xs text-muted-foreground">{props.subtitle}</span>
            </Show>
          </span>
        </div>
        <AppDropdownSeparator />
        <div class="px-2 py-1.5">
          <div class="mb-1.5 px-1 text-xs font-medium text-muted-foreground">Görünüm</div>
          <div class="grid grid-cols-3 gap-1 rounded-xl bg-secondary/50 p-1">
            <button
              type="button"
              class={cn(
                'flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all cursor-pointer',
                theme() === 'light'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
              )}
              onClick={() => setTheme('light')}
            >
              <Sun class="size-3.5" /> Açık
            </button>
            <button
              type="button"
              class={cn(
                'flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all cursor-pointer',
                theme() === 'dark'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
              )}
              onClick={() => setTheme('dark')}
            >
              <Moon class="size-3.5" /> Koyu
            </button>
            <button
              type="button"
              class={cn(
                'flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all cursor-pointer',
                theme() === 'system'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
              )}
              onClick={() => setTheme('system')}
            >
              <SunMoon class="size-3.5" /> Sistem
            </button>
          </div>
        </div>
        <Show when={props.menu}>
          <AppDropdownSeparator />
          {props.menu}
        </Show>
        <Show when={props.onSignOut}>
          <AppDropdownSeparator />
          <AppDropdownItem biggerText variant="destructive" onSelect={props.onSignOut}>
            <LogOut /> Çıkış yap
          </AppDropdownItem>
        </Show>
      </AppDropdownContent>
    </AppDropdown>
  )
}

/** Convenience: builds a whole nav from data. */
export interface SidebarNavGroup {
  label?: string
  items: SidebarItemProps[]
}
export function SidebarNav(props: { groups: SidebarNavGroup[] }) {
  return (
    <For each={props.groups}>
      {(g) => (
        <SidebarGroup label={g.label}>
          <For each={g.items}>{(item) => <SidebarItem {...item} />}</For>
        </SidebarGroup>
      )}
    </For>
  )
}
