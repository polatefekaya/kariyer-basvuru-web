import { createSignal, Show, splitProps, type JSX } from 'solid-js'
import { AlertTriangle, CheckCircle2, Info, Sparkles, X, XCircle } from 'lucide-solid'
import { cn } from '@/lib/cn'
import { focusRingClass } from './field'

export type AppAlertVariant = 'info' | 'success' | 'warning' | 'destructive' | 'premium' | 'neutral'

const variants: Record<AppAlertVariant, { box: string; icon: () => JSX.Element }> = {
  info: { box: 'bg-primary/5 border-primary/20 [&>svg]:text-primary', icon: () => <Info /> },
  success: {
    box: 'bg-success-subtle border-success-subtle-border text-success-subtle-foreground [&>svg]:text-success-subtle-foreground',
    icon: () => <CheckCircle2 />,
  },
  warning: {
    box: 'bg-warning/10 border-warning/30 [&>svg]:text-warning dark:[&>svg]:text-warning-foreground',
    icon: () => <AlertTriangle />,
  },
  destructive: { box: 'bg-destructive/5 border-destructive/30 [&>svg]:text-destructive', icon: () => <XCircle /> },
  premium: { box: 'bg-premium-muted border-premium/30 [&>svg]:text-premium', icon: () => <Sparkles /> },
  neutral: { box: 'bg-secondary/40 border-border [&>svg]:text-muted-foreground', icon: () => <Info /> },
}

export interface AppAlertProps {
  variant?: AppAlertVariant
  title?: JSX.Element
  description?: JSX.Element
  /** Replace the variant's default icon; pass `null` to hide. */
  icon?: JSX.Element | null
  /** Slot rendered under the description (buttons, links). */
  actions?: JSX.Element
  dismissible?: boolean
  onDismiss?: () => void
  class?: string
  children?: JSX.Element
}

/** Inline callout / banner. */
export function AppAlert(props: AppAlertProps) {
  const [local] = splitProps(props, [
    'variant',
    'title',
    'description',
    'icon',
    'actions',
    'dismissible',
    'onDismiss',
    'class',
    'children',
  ])
  const [open, setOpen] = createSignal(true)
  const v = () => variants[local.variant ?? 'info']

  return (
    <Show when={open()}>
      <div
        role={local.variant === 'destructive' || local.variant === 'warning' ? 'alert' : 'status'}
        class={cn(
          'relative flex w-full gap-3 rounded-2xl border p-4 text-sm text-foreground [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
          v().box,
          local.dismissible && 'pr-10',
          local.class,
        )}
      >
        <Show when={local.icon !== null}>{local.icon ?? v().icon()}</Show>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <Show when={local.title}>
            <p class="font-medium">{local.title}</p>
          </Show>
          <Show when={local.description}>
            <p class="text-muted-foreground">{local.description}</p>
          </Show>
          {local.children}
          <Show when={local.actions}>
            <div class="mt-2 flex flex-wrap items-center gap-2">{local.actions}</div>
          </Show>
        </div>
        <Show when={local.dismissible}>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              local.onDismiss?.()
            }}
            class={cn(
              'absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-primary-hover',
              focusRingClass,
            )}
            aria-label="Kapat"
          >
            <X class="size-4" />
          </button>
        </Show>
      </div>
    </Show>
  )
}
