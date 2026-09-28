import { Show, splitProps } from 'solid-js'
import { Progress as ProgressPrimitive } from '@kobalte/core/progress'
import { cn } from '@/lib/cn'

export type AppProgressVariant = 'primary' | 'success' | 'warning' | 'destructive' | 'premium'
export type AppProgressSize = 'xs' | 'sm' | 'md' | 'lg'

const fillVariants: Record<AppProgressVariant, string> = {
  primary: 'bg-primary',
  success: 'bg-success dark:bg-success-foreground',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  premium: 'bg-premium',
}

const trackSizes: Record<AppProgressSize, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export interface AppProgressProps {
  value?: number
  min?: number
  max?: number
  label?: string
  /** Show the value label (e.g. `42%`) on the right of the label row. */
  showValue?: boolean
  formatValue?: (value: number, max: number) => string
  variant?: AppProgressVariant
  size?: AppProgressSize
  /** Unknown progress — renders a sliding shimmer. */
  indeterminate?: boolean
  class?: string
  trackClass?: string
}

export function AppProgress(props: AppProgressProps) {
  const [local] = splitProps(props, [
    'value',
    'min',
    'max',
    'label',
    'showValue',
    'formatValue',
    'variant',
    'size',
    'indeterminate',
    'class',
    'trackClass',
  ])
  const max = () => local.max ?? 100

  return (
    <ProgressPrimitive
      value={local.value}
      minValue={local.min ?? 0}
      maxValue={max()}
      indeterminate={local.indeterminate}
      getValueLabel={(p) =>
        local.formatValue ? local.formatValue(p.value, p.max) : `${Math.round((p.value / p.max) * 100)}%`
      }
      class={cn('flex w-full flex-col gap-2', local.class)}
    >
      <Show when={local.label || local.showValue}>
        <div class="flex items-center justify-between gap-2">
          <ProgressPrimitive.Label class="text-sm text-foreground">{local.label}</ProgressPrimitive.Label>
          <Show when={local.showValue && !local.indeterminate}>
            <ProgressPrimitive.ValueLabel class="text-xs text-muted-foreground" />
          </Show>
        </div>
      </Show>
      <ProgressPrimitive.Track
        class={cn(
          'relative w-full overflow-hidden rounded-full bg-secondary',
          trackSizes[local.size ?? 'md'],
          local.trackClass,
        )}
      >
        <ProgressPrimitive.Fill
          class={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            fillVariants[local.variant ?? 'primary'],
            local.indeterminate
              ? 'w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite]'
              : 'w-[var(--kb-progress-fill-width)]',
          )}
        />
      </ProgressPrimitive.Track>
      <style>{`@keyframes indeterminate{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </ProgressPrimitive>
  )
}

/** Circular variant — `size` is the diameter in px. */
export interface AppProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  variant?: AppProgressVariant
  /** Render the percentage in the middle. */
  showValue?: boolean
  /** Accessible name for the ring (there is no visible label). */
  label?: string
  class?: string
}

const ringVariants: Record<AppProgressVariant, string> = {
  primary: 'text-primary',
  success: 'text-success dark:text-success-foreground',
  warning: 'text-warning',
  destructive: 'text-destructive',
  premium: 'text-premium',
}

export function AppProgressRing(props: AppProgressRingProps) {
  const size = () => props.size ?? 48
  const stroke = () => props.strokeWidth ?? 4
  const r = () => (size() - stroke()) / 2
  const c = () => 2 * Math.PI * r()
  const pct = () => Math.min(100, Math.max(0, (props.value / (props.max ?? 100)) * 100))

  return (
    <div
      role="progressbar"
      aria-valuenow={props.value}
      aria-valuemin={0}
      aria-valuemax={props.max ?? 100}
      aria-valuetext={`${Math.round(pct())}%`}
      aria-label={props.label}
      class={cn('relative inline-flex shrink-0 select-none items-center justify-center', props.class)}
      style={{ width: `${size()}px`, height: `${size()}px` }}
    >
      <svg width={size()} height={size()} class="-rotate-90">
        <circle cx={size() / 2} cy={size() / 2} r={r()} fill="none" stroke-width={stroke()} class="stroke-secondary" />
        <circle
          cx={size() / 2}
          cy={size() / 2}
          r={r()}
          fill="none"
          stroke="currentColor"
          stroke-width={stroke()}
          stroke-linecap="round"
          stroke-dasharray={String(c())}
          stroke-dashoffset={String(c() * (1 - pct() / 100))}
          class={cn('transition-[stroke-dashoffset] duration-500 ease-out', ringVariants[props.variant ?? 'primary'])}
        />
      </svg>
      <Show when={props.showValue}>
        <span class="absolute text-xs text-foreground">{Math.round(pct())}%</span>
      </Show>
    </div>
  )
}
