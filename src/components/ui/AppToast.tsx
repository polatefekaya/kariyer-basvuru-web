import { Show, type JSX } from 'solid-js'
import { Toast as ToastPrimitive, toaster } from '@kobalte/core/toast'
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-solid'
import { cn } from '@/lib/cn'
import { focusRingClass } from './field'

export type AppToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface AppToastOptions {
  title: JSX.Element
  description?: JSX.Element
  variant?: AppToastVariant
  /** ms; 0 = persistent. */
  duration?: number
  action?: { label: string; onClick: () => void }
}

const icons: Record<AppToastVariant, () => JSX.Element> = {
  default: () => null,
  success: () => <CheckCircle2 class="text-success dark:text-success-foreground" />,
  error: () => <XCircle class="text-destructive" />,
  warning: () => <AlertTriangle class="text-warning dark:text-warning-foreground" />,
  info: () => <Info class="text-primary" />,
  loading: () => <Loader2 class="animate-spin text-primary" />,
}

function ToastCard(props: AppToastOptions & { toastId: number }) {
  const icon = () => icons[props.variant ?? 'default']()
  return (
    <ToastPrimitive
      toastId={props.toastId}
      duration={props.duration}
      persistent={props.duration === 0 || props.variant === 'loading'}
      class={cn(
        'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 pr-10 text-card-foreground',
        '[&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
        'data-[opened]:animate-in data-[opened]:slide-in-from-right-full data-[opened]:fade-in-0',
        'data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:slide-out-to-right-full',
        'data-[swipe=move]:translate-x-[var(--kb-toast-swipe-move-x)] data-[swipe=move]:transition-none',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
        'data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full',
      )}
    >
      <Show when={icon()}>{icon()}</Show>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <ToastPrimitive.Title class="text-sm font-medium">{props.title}</ToastPrimitive.Title>
        <Show when={props.description}>
          <ToastPrimitive.Description class="text-xs text-muted-foreground">
            {props.description}
          </ToastPrimitive.Description>
        </Show>
        <Show when={props.action}>
          <button
            type="button"
            onClick={() => {
              props.action!.onClick()
              toaster.dismiss(props.toastId)
            }}
            class={cn(
              'mt-1 self-start text-xs text-primary underline-offset-4 hover:underline',
              focusRingClass,
              'rounded',
            )}
          >
            {props.action!.label}
          </button>
        </Show>
      </div>
      <ToastPrimitive.CloseButton
        class={cn(
          'absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-primary-hover',
          focusRingClass,
        )}
        aria-label="Kapat"
      >
        <X class="size-3.5" />
      </ToastPrimitive.CloseButton>
      <ToastPrimitive.ProgressTrack class="absolute inset-x-0 bottom-0 h-0.5 bg-transparent">
        <ToastPrimitive.ProgressFill class="h-full w-[var(--kb-toast-progress-fill-width)] bg-primary/40 transition-[width] duration-200 ease-linear" />
      </ToastPrimitive.ProgressTrack>
    </ToastPrimitive>
  )
}

/** Mount once near the app root. */
export function AppToaster(props: { class?: string }) {
  return (
    <ToastPrimitive.Region swipeDirection="right" duration={5000} limit={5} pauseOnInteraction>
      <ToastPrimitive.List
        class={cn(
          'pointer-events-none fixed bottom-0 right-0 z-100 flex w-full max-w-sm flex-col gap-2 p-4 outline-none',
          'sm:bottom-4 sm:right-4 sm:p-0',
          props.class,
        )}
      />
    </ToastPrimitive.Region>
  )
}

function show(opts: AppToastOptions) {
  return toaster.show((p) => <ToastCard {...opts} toastId={p.toastId} />)
}

/**
 * `toast.success('Kaydedildi')`, `toast.error({ title, description })`,
 * `toast.promise(fetchX(), { loading, success, error })`.
 */
export const toast = Object.assign(
  (opts: AppToastOptions | string) => show(typeof opts === 'string' ? { title: opts } : opts),
  {
    success: (opts: AppToastOptions | string) =>
      show({ ...(typeof opts === 'string' ? { title: opts } : opts), variant: 'success' }),
    error: (opts: AppToastOptions | string) =>
      show({ ...(typeof opts === 'string' ? { title: opts } : opts), variant: 'error' }),
    warning: (opts: AppToastOptions | string) =>
      show({ ...(typeof opts === 'string' ? { title: opts } : opts), variant: 'warning' }),
    info: (opts: AppToastOptions | string) =>
      show({ ...(typeof opts === 'string' ? { title: opts } : opts), variant: 'info' }),
    loading: (opts: AppToastOptions | string) =>
      show({ ...(typeof opts === 'string' ? { title: opts } : opts), variant: 'loading' }),
    dismiss: (id?: number) => (id == null ? toaster.clear() : toaster.dismiss(id)),
    promise: <T,>(
      promise: Promise<T>,
      msgs: {
        loading: JSX.Element
        success: JSX.Element | ((v: T) => JSX.Element)
        error: JSX.Element | ((e: unknown) => JSX.Element)
      },
    ) => {
      const id = show({ title: msgs.loading, variant: 'loading' })
      promise.then(
        (v) => {
          toaster.dismiss(id)
          show({ title: typeof msgs.success === 'function' ? msgs.success(v) : msgs.success, variant: 'success' })
        },
        (e) => {
          toaster.dismiss(id)
          show({ title: typeof msgs.error === 'function' ? msgs.error(e) : msgs.error, variant: 'error' })
        },
      )
      return promise
    },
  },
)
