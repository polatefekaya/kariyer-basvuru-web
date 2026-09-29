import { For, splitProps, type ComponentProps } from 'solid-js'
import { cn } from '@/lib/cn'

export interface AppSkeletonProps extends ComponentProps<'div'> {
  width?: number | string
  height?: number | string
  variant?: 'rect' | 'circle' | 'text'
  class?: string
}

const dim = (v?: number | string) => (typeof v === 'number' ? `${v}px` : v)

/** Base skeleton primitive: `animate-pulse bg-muted/60`. */
export function AppSkeleton(props: AppSkeletonProps) {
  const [local, rest] = splitProps(props, ['width', 'height', 'variant', 'class', 'style'])
  return (
    <div
      aria-hidden="true"
      class={cn(
        'animate-pulse select-none bg-muted/60',
        local.variant === 'circle' ? 'rounded-full' : 'rounded-lg',
        local.variant === 'text' && 'h-3.5',
        local.class,
      )}
      style={{
        width: dim(local.width),
        height: dim(local.height),
        ...(typeof local.style === 'object' ? local.style : {}),
      }}
      {...rest}
    />
  )
}

/** N lines of text placeholder; the last line is shorter. */
export function AppSkeletonText(props: { lines?: number; class?: string }) {
  const lines = () => Array.from({ length: props.lines ?? 3 }, (_, i) => i)
  return (
    <div class={cn('flex flex-col gap-2', props.class)} aria-hidden="true">
      <For each={lines()}>
        {(i) => <AppSkeleton variant="text" width={i === lines().length - 1 ? '60%' : '100%'} />}
      </For>
    </div>
  )
}

/** Card-shaped placeholder: avatar + two lines + a media block. */
export function AppSkeletonCard(props: { media?: boolean; class?: string }) {
  return (
    <div class={cn('flex flex-col gap-4 rounded-2xl border border-border bg-card p-4', props.class)} aria-hidden="true">
      <div class="flex items-center gap-3">
        <AppSkeleton variant="circle" width={40} height={40} />
        <div class="flex flex-1 flex-col gap-2">
          <AppSkeleton variant="text" width="50%" />
          <AppSkeleton variant="text" width="30%" class="h-2.5" />
        </div>
      </div>
      <AppSkeletonText lines={3} />
      {props.media !== false && <AppSkeleton height={160} class="w-full rounded-2xl" />}
    </div>
  )
}
