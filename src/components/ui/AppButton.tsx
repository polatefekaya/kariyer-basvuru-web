import { Show, splitProps, type JSX, type ValidComponent } from 'solid-js'
import { Button as ButtonPrimitive, type ButtonRootProps } from '@kobalte/core/button'
import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import { Loader2 } from 'lucide-solid'
import { cn } from '@/lib/cn'
import { focusRingClass } from './field'

export type AppButtonVariant =
  'primary' | 'secondary' | 'primaryOutline' | 'outline' | 'ghost' | 'link' | 'danger' | 'success' | 'premium'

export type AppButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'iconSm' | 'iconLg'

// Semantic variants. Zero hardcoded hex colors — everything goes through tokens.
const variants: Record<AppButtonVariant, string> = {
  primary: cn(
    'bg-primary text-primary-foreground',
    'hover:bg-primary-hover hover:-translate-y-px',
    'active:translate-y-0',
  ),
  secondary: cn('bg-secondary text-secondary-foreground', 'hover:bg-secondary-hover hover:-translate-y-px'),
  primaryOutline: cn(
    'border border-primary bg-primary/5 text-primary',
    'hover:bg-primary/10 hover:text-primary-hover hover:-translate-y-px',
  ),
  outline: cn(
    'border border-input bg-background text-foreground',
    'hover:bg-accent hover:text-primary-hover hover:-translate-y-px',
  ),
  ghost: 'hover:bg-accent hover:text-primary-hover',
  link: 'text-primary underline-offset-4 hover:text-primary-hover hover:underline h-auto px-0',
  danger: cn('bg-destructive text-destructive-foreground', 'hover:bg-destructive/90 hover:-translate-y-px'),
  success: cn('bg-success text-success-foreground', 'hover:bg-success/90 hover:-translate-y-px'),
  premium: cn('bg-premium text-premium-foreground', 'hover:bg-premium/90 hover:-translate-y-px'),
}

const sizes: Record<AppButtonSize, string> = {
  xs: 'h-7 px-3 text-xs rounded-full gap-1.5',
  sm: 'h-8 px-3.5 text-xs rounded-full gap-1.5',
  md: 'h-10 px-4 py-2 text-sm rounded-2xl gap-2',
  lg: 'h-12 px-8 text-base rounded-2xl gap-2',
  icon: 'h-10 w-10 p-0 rounded-2xl',
  iconSm: 'h-8 w-8 p-0 rounded-full',
  iconLg: 'h-12 w-12 p-0 rounded-2xl',
}

export const buttonBaseClass = cn(
  'inline-flex items-center justify-center whitespace-nowrap select-none',
  'transition-all duration-200 ease-out',
  '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none',
  focusRingClass,
  'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
)

/** Compose the button classes without rendering — handy for link-styled-as-button cases. */
export function buttonClasses(opts: { variant?: AppButtonVariant; size?: AppButtonSize; class?: string } = {}) {
  return cn(buttonBaseClass, variants[opts.variant ?? 'primary'], sizes[opts.size ?? 'md'], opts.class)
}

export type AppButtonProps<T extends ValidComponent = 'button'> = ButtonRootProps<T> & {
  variant?: AppButtonVariant
  size?: AppButtonSize
  /** Shows a spinner and disables the button. */
  loading?: boolean
  leftIcon?: JSX.Element
  rightIcon?: JSX.Element
  /** Stretch to the container width. */
  fullWidth?: boolean
  class?: string
  children?: JSX.Element
}

export function AppButton<T extends ValidComponent = 'button'>(props: PolymorphicProps<T, AppButtonProps<T>>) {
  const [local, rest] = splitProps(props as AppButtonProps, [
    'variant',
    'size',
    'loading',
    'leftIcon',
    'rightIcon',
    'fullWidth',
    'class',
    'children',
    'disabled',
  ])

  const isIcon = () => (local.size ?? 'md').startsWith('icon')

  return (
    <ButtonPrimitive
      disabled={local.disabled || local.loading}
      aria-busy={local.loading || undefined}
      class={cn(buttonClasses({ variant: local.variant, size: local.size }), local.fullWidth && 'w-full', local.class)}
      {...rest}
    >
      <Show when={local.loading}>
        <Loader2 class="animate-spin" aria-hidden="true" />
      </Show>
      <Show when={!local.loading && local.leftIcon}>{local.leftIcon}</Show>
      <Show when={!isIcon() || (!local.leftIcon && !local.rightIcon && !local.loading)}>{local.children}</Show>
      <Show when={!local.loading && local.rightIcon}>{local.rightIcon}</Show>
    </ButtonPrimitive>
  )
}
