import { createMemo, For, Show, splitProps, type JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { cn } from '@/lib/cn'
import { imageCache } from '@/lib/imageCache'
import { cdnImage, cdnImageSrcSet } from '@/lib/mediaUrl'
import { focusRingClass } from './field'
import { AppHoverCardContent, AppHoverCardRoot, AppHoverCardTrigger } from './AppHoverCard'

export type AppAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const sizes: Record<AppAvatarSize, string> = {
  xs: 'size-6 text-xs',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
  '2xl': 'size-24 text-3xl',
}

/** Pixel size per token — drives the Cloudflare `width` (snapped) + retina srcSet. */
const sizePx: Record<AppAvatarSize, number> = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64, '2xl': 96 }

/** Group overlap, proportional to the avatar (about a quarter of its diameter). */
const groupOverlap: Record<AppAvatarSize, string> = {
  xs: '-space-x-1.5',
  sm: '-space-x-2',
  md: '-space-x-2.5',
  lg: '-space-x-3',
  xl: '-space-x-4',
  '2xl': '-space-x-6',
}

const statusLabels = { online: 'Çevrimiçi', offline: 'Çevrimdışı', busy: 'Meşgul', away: 'Uzakta' }
const statusColors = {
  online: 'bg-success dark:bg-success-foreground',
  offline: 'bg-muted-foreground',
  busy: 'bg-destructive',
  away: 'bg-warning',
}

export function getInitials(name?: string, surname?: string) {
  // A full name in `name` alone is common now that the API sends `fullName`; split it so the
  // avatar still shows two letters instead of one.
  const parts = (surname?.trim() ? [name, surname] : (name?.trim().split(/\s+/) ?? [])).filter(
    (part): part is string => !!part?.trim(),
  )

  const first = parts[0]?.charAt(0).toLocaleUpperCase('tr-TR') ?? ''
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0).toLocaleUpperCase('tr-TR') ?? '') : ''

  return first + last || 'K'
}

export interface AppAvatarProps {
  /** Stored media path / CDN key / URL — resolved through `cdnImage` at the avatar's size. */
  src?: string | null
  /** Used for the initials fallback, alt text and the default hover card. */
  name?: string
  surname?: string
  /** Secondary line in the default hover card (job title, company…). */
  subtitle?: string
  size?: AppAvatarSize
  shape?: 'circle' | 'square'
  status?: 'online' | 'offline' | 'busy' | 'away'
  fallbackIcon?: JSX.Element
  /**
   * Hover / focus opens an info card. `true` shows the built-in name card; pass content
   * (or a function) for the real preview once it exists. Implies `interactive`.
   */
  hoverCard?: boolean | JSX.Element | (() => JSX.Element)
  hoverCardPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'bottom-start' | 'top-end' | 'bottom-end'
  /** Pointer cursor + hover state + keyboard focus, without a card. */
  interactive?: boolean
  href?: string
  onClick?: (e: MouseEvent) => void
  /** 2px page-coloured border so stacked avatars separate cleanly (set by AppAvatarGroup). */
  bordered?: boolean
  class?: string
}

export function AppAvatar(props: AppAvatarProps) {
  const [local] = splitProps(props, [
    'src',
    'name',
    'surname',
    'subtitle',
    'size',
    'shape',
    'status',
    'fallbackIcon',
    'hoverCard',
    'hoverCardPlacement',
    'interactive',
    'href',
    'onClick',
    'bordered',
    'class',
  ])

  const size = () => local.size ?? 'md'
  const px = () => sizePx[size()]
  const resolvedSrc = createMemo(() => cdnImage(local.src, { width: px(), fit: 'cover' }))
  const srcSet = createMemo(() => cdnImageSrcSet(local.src, { width: px(), fit: 'cover' }))
  const showImage = () => !!resolvedSrc() && imageCache.status(resolvedSrc()) !== 'invalid'
  const fullName = () => `${local.name ?? ''} ${local.surname ?? ''}`.trim()
  const radius = () => (local.shape === 'square' ? 'rounded-2xl' : 'rounded-full')
  const hasCard = () => !!local.hoverCard
  const interactive = () => hasCard() || !!local.interactive || !!local.href || !!local.onClick
  const small = () => size() === 'xs' || size() === 'sm'

  // The visual: circle + optional status dot. The wrapper follows the shape so a border or focus ring
  // on it is round too (a square ring around a circle was the old avatar-group bug).
  const visual = (
    <span
      class={cn(
        'relative inline-flex shrink-0 select-none transition-transform duration-200',
        radius(),
        local.bordered && 'border-2 border-background',
        interactive() && 'group-hover/avatar:scale-105',
        !interactive() && local.class,
      )}
    >
      <span
        class={cn(
          'flex items-center justify-center overflow-hidden border border-border bg-muted text-muted-foreground',
          radius(),
          sizes[size()],
        )}
        role={showImage() ? undefined : 'img'}
        aria-label={showImage() ? undefined : fullName() || 'Avatar'}
      >
        <Show
          when={showImage()}
          fallback={local.fallbackIcon ?? <span aria-hidden="true">{getInitials(local.name, local.surname)}</span>}
        >
          <img
            src={resolvedSrc()}
            srcset={srcSet()}
            alt={fullName()}
            loading="lazy"
            decoding="async"
            onLoad={() => imageCache.setStatus(resolvedSrc()!, 'valid')}
            onError={() => imageCache.setStatus(resolvedSrc()!, 'invalid')}
            class="h-full w-full object-cover"
          />
        </Show>
      </span>
      <Show when={local.status}>
        <span
          class={cn(
            'absolute bottom-0 right-0 block rounded-full border-2 border-background',
            statusColors[local.status!],
            small() ? 'size-2.5' : 'size-3.5',
          )}
          role="img"
          aria-label={statusLabels[local.status!]}
        >
          <span class="sr-only">{statusLabels[local.status!]}</span>
        </span>
      </Show>
    </span>
  )

  const defaultCard = () => (
    <div class="flex items-center gap-3">
      <AppAvatar src={local.src} name={local.name} surname={local.surname} size="lg" shape={local.shape} />
      <div class="flex min-w-0 flex-col">
        <span class="truncate text-sm text-foreground">{fullName() || 'Kullanıcı'}</span>
        <Show when={local.subtitle}>
          <span class="truncate text-xs text-muted-foreground">{local.subtitle}</span>
        </Show>
      </div>
    </div>
  )
  const cardContent = () => {
    const c = local.hoverCard
    if (c === true) return defaultCard()
    return typeof c === 'function' ? (c as () => JSX.Element)() : (c as JSX.Element)
  }

  const triggerClass = () =>
    cn('group/avatar inline-flex cursor-pointer', radius(), focusRingClass, 'hover:z-10', local.class)

  return (
    <Show when={interactive()} fallback={visual}>
      <Show
        when={hasCard()}
        fallback={
          <Dynamic
            component={local.href ? 'a' : 'button'}
            href={local.href}
            type={local.href ? undefined : 'button'}
            aria-label={fullName() || 'Avatar'}
            class={triggerClass()}
            onClick={(e: MouseEvent) => local.onClick?.(e)}
          >
            {visual}
          </Dynamic>
        }
      >
        <AppHoverCardRoot placement={local.hoverCardPlacement ?? 'bottom-start'}>
          <AppHoverCardTrigger
            as={local.href ? 'a' : 'button'}
            href={local.href}
            aria-label={fullName() || 'Avatar'}
            class={triggerClass()}
            onClick={(e: MouseEvent) => local.onClick?.(e)}
          >
            {visual}
          </AppHoverCardTrigger>
          <AppHoverCardContent>{cardContent()}</AppHoverCardContent>
        </AppHoverCardRoot>
      </Show>
    </Show>
  )
}

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------
export type AppAvatarGroupItem = Pick<
  AppAvatarProps,
  'src' | 'name' | 'surname' | 'subtitle' | 'hoverCard' | 'href' | 'onClick' | 'status'
>

export interface AppAvatarGroupProps {
  items: AppAvatarGroupItem[]
  size?: AppAvatarSize
  /** Show `+N` after this many avatars. */
  max?: number
  /**
   * Real population size when `items` is only a preview (e.g. 5 of 123 applicants).
   * `+N` becomes `total - visible`; the overflow card lists the hidden previews and the remainder.
   */
  total?: number
  /** Give every avatar the built-in hover card (items can still pass their own `hoverCard`). */
  hoverCards?: boolean
  /** Hover card for the `+N` bubble; defaults to a list of the hidden names. */
  overflowCard?: JSX.Element | (() => JSX.Element)
  onOverflowClick?: () => void
  class?: string
}

/**
 * Stacked avatars, later ones overlapping earlier ones, each with a page-coloured border so the
 * stack reads as separate circles. Hovering lifts an avatar above its neighbours.
 */
export function AppAvatarGroup(props: AppAvatarGroupProps) {
  const size = () => props.size ?? 'md'
  const max = () => props.max ?? 4
  const visible = () => props.items.slice(0, max())
  const hidden = () => props.items.slice(max())
  const overflow = () => Math.max(0, (props.total ?? props.items.length) - visible().length)
  const unlisted = () => overflow() - hidden().length

  const overflowContent = () =>
    props.overflowCard ? (
      typeof props.overflowCard === 'function' ? (
        props.overflowCard()
      ) : (
        props.overflowCard
      )
    ) : (
      <ul class="flex flex-col gap-2">
        <For each={hidden()}>
          {(item) => (
            <li class="flex items-center gap-2">
              <AppAvatar src={item.src} name={item.name} surname={item.surname} size="xs" />
              <span class="truncate text-sm">{`${item.name ?? ''} ${item.surname ?? ''}`.trim()}</span>
            </li>
          )}
        </For>
        <Show when={unlisted() > 0}>
          <li class="text-xs text-muted-foreground">+{unlisted()} kişi daha</li>
        </Show>
      </ul>
    )

  return (
    // The avatars carry a 2px background-coloured border for the overlap; pull the group left by that
    // much so the first visible circle sits flush with the container edge instead of 2px inside it.
    <div class={cn('-ml-0.5 flex items-center', groupOverlap[size()], props.class)} role="group">
      <For each={visible()}>
        {(item) => (
          <AppAvatar
            {...item}
            size={size()}
            bordered
            hoverCard={item.hoverCard ?? (props.hoverCards ? true : undefined)}
            class="relative"
          />
        )}
      </For>
      <Show when={overflow() > 0}>
        <AppHoverCardRoot placement="bottom-start">
          <AppHoverCardTrigger
            aria-label={`${overflow()} kişi daha`}
            class="relative hover:z-10"
            onClick={() => props.onOverflowClick?.()}
          >
            <span
              class={cn(
                'flex items-center justify-center rounded-full border-2 border-background bg-secondary text-secondary-foreground select-none',
                sizes[size()],
              )}
            >
              <span class={cn('flex h-full w-full items-center justify-center rounded-full border border-border')}>
                +{overflow()}
              </span>
            </span>
          </AppHoverCardTrigger>
          <AppHoverCardContent>{overflowContent()}</AppHoverCardContent>
        </AppHoverCardRoot>
      </Show>
    </div>
  )
}
