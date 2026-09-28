import { Show, splitProps, type ComponentProps, type JSX, type ValidComponent } from 'solid-js'
import { Dialog as DialogPrimitive, type DialogContentProps, type DialogRootProps } from '@kobalte/core/dialog'
import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import { X } from 'lucide-solid'
import { cn } from '@/lib/cn'
import { focusRingClass } from './field'

export type AppModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const sizes: Record<AppModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-4xl',
  xl: 'sm:max-w-6xl',
  full: 'sm:max-w-[95vw] sm:max-h-[95vh]',
}

export const AppModal = (props: DialogRootProps) => <DialogPrimitive {...props} />
export const AppModalTrigger = DialogPrimitive.Trigger
export const AppModalClose = DialogPrimitive.CloseButton
export const AppModalPortal = DialogPrimitive.Portal

export const AppModalOverlay = (props: ComponentProps<typeof DialogPrimitive.Overlay>) => {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <DialogPrimitive.Overlay
      class={cn(
        'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
        'data-[expanded]:animate-in data-[closed]:animate-out data-[expanded]:fade-in-0 data-[closed]:fade-out-0',
        'data-[closed]:pointer-events-none',
        local.class,
      )}
      {...rest}
    />
  )
}

export type AppModalContentProps<T extends ValidComponent = 'div'> = DialogContentProps<T> & {
  size?: AppModalSize
  /** Hide the top-right close button. */
  hideClose?: boolean
  class?: string
  children?: JSX.Element
}

export function AppModalContent<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, AppModalContentProps<T>>) {
  const [local, rest] = splitProps(props as AppModalContentProps, ['size', 'hideClose', 'class', 'children'])
  return (
    <AppModalPortal>
      <AppModalOverlay />
      <DialogPrimitive.Content
        class={cn(
          // Full-screen sheet on mobile, centered card on >= sm (matches kariyer-zamani-web)
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-full -translate-x-1/2 -translate-y-1/2 gap-4 bg-card p-4 sm:p-6',
          'h-full max-h-full overflow-y-auto sm:h-min sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-border',
          'duration-300 data-[expanded]:ease-out data-[closed]:ease-in',
          'data-[expanded]:animate-in data-[closed]:animate-out data-[expanded]:fade-in-0 data-[closed]:fade-out-0',
          'data-[expanded]:zoom-in-95 data-[closed]:zoom-out-95',
          sizes[local.size ?? 'md'],
          local.class,
        )}
        {...rest}
      >
        {local.children}
        <Show when={!local.hideClose}>
          <DialogPrimitive.CloseButton
            class={cn(
              'absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-primary-hover',
              focusRingClass,
            )}
          >
            <X class="size-4" />
            <span class="sr-only">Kapat</span>
          </DialogPrimitive.CloseButton>
        </Show>
      </DialogPrimitive.Content>
    </AppModalPortal>
  )
}

export const AppModalHeader = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <div class={cn('flex flex-col gap-1.5 pr-8 text-left', local.class)} {...rest} />
}

export const AppModalFooter = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <div class={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', local.class)} {...rest} />
}

export const AppModalTitle = (props: ComponentProps<typeof DialogPrimitive.Title>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <DialogPrimitive.Title class={cn('text-lg font-medium', local.class)} {...rest} />
}

export const AppModalDescription = (props: ComponentProps<typeof DialogPrimitive.Description>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <DialogPrimitive.Description class={cn('text-sm text-muted-foreground', local.class)} {...rest} />
}
