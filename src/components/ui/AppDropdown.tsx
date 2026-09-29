import { splitProps, type ComponentProps, type JSX, type ValidComponent } from 'solid-js'
import {
  DropdownMenu as DropdownMenuPrimitive,
  type DropdownMenuItemProps,
  type DropdownMenuRootProps,
} from '@kobalte/core/dropdown-menu'
import type { PolymorphicProps } from '@kobalte/core/polymorphic'
import { Check, ChevronRight, Circle } from 'lucide-solid'
import { cn } from '@/lib/cn'

export const AppDropdown = (props: DropdownMenuRootProps) => <DropdownMenuPrimitive gutter={4} {...props} />
export const AppDropdownTrigger = DropdownMenuPrimitive.Trigger
export const AppDropdownPortal = DropdownMenuPrimitive.Portal
export const AppDropdownGroup = DropdownMenuPrimitive.Group
export const AppDropdownSub = DropdownMenuPrimitive.Sub
export const AppDropdownRadioGroup = DropdownMenuPrimitive.RadioGroup
export const AppDropdownIcon = DropdownMenuPrimitive.Icon

/** Shared popover surface for Content / SubContent (kariyer-zamani-web: rounded-2xl border bg-card p-1). */
export const dropdownSurfaceClass = cn(
  'z-50 min-w-32 overflow-hidden rounded-2xl border border-border bg-card p-1 text-card-foreground',
  'origin-[var(--kb-menu-content-transform-origin)]',
  'data-[expanded]:animate-in data-[closed]:animate-out',
  'data-[expanded]:fade-in-0 data-[closed]:fade-out-0 data-[expanded]:zoom-in-95 data-[closed]:zoom-out-95',
)

export const AppDropdownContent = (props: ComponentProps<typeof DropdownMenuPrimitive.Content>) => {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content class={cn(dropdownSurfaceClass, local.class)} {...rest} />
    </DropdownMenuPrimitive.Portal>
  )
}

export const AppDropdownSubContent = (props: ComponentProps<typeof DropdownMenuPrimitive.SubContent>) => {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent class={cn(dropdownSurfaceClass, local.class)} {...rest} />
    </DropdownMenuPrimitive.Portal>
  )
}

export const dropdownItemClass = cn(
  'relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-xs outline-none transition-colors',
  '[&_svg]:size-4 [&_svg]:shrink-0',
  'data-[highlighted]:bg-secondary-hover',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
)

export type AppDropdownItemProps<T extends ValidComponent = 'div'> = DropdownMenuItemProps<T> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
  /** Bumps the text from `text-xs` to `text-sm`. */
  biggerText?: boolean
  class?: string
  children?: JSX.Element
}

export function AppDropdownItem<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, AppDropdownItemProps<T>>) {
  const [local, rest] = splitProps(props as AppDropdownItemProps, ['inset', 'variant', 'biggerText', 'class'])
  return (
    <DropdownMenuPrimitive.Item
      class={cn(
        dropdownItemClass,
        local.inset && 'pl-8',
        local.biggerText && 'text-sm',
        local.variant === 'destructive'
          ? 'text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive'
          : 'text-foreground',
        local.class,
      )}
      {...rest}
    />
  )
}

export const AppDropdownSubTrigger = (
  props: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean },
) => {
  const [local, rest] = splitProps(props, ['class', 'inset', 'children'])
  return (
    <DropdownMenuPrimitive.SubTrigger
      class={cn(dropdownItemClass, 'data-[expanded]:bg-secondary-hover', local.inset && 'pl-8', local.class)}
      {...rest}
    >
      {local.children}
      <ChevronRight class="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

export const AppDropdownCheckboxItem = (props: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) => {
  const [local, rest] = splitProps(props, ['class', 'children'])
  return (
    <DropdownMenuPrimitive.CheckboxItem class={cn(dropdownItemClass, 'pl-8 text-foreground', local.class)} {...rest}>
      <span class="absolute left-2.5 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check class="size-4 text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {local.children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

export const AppDropdownRadioItem = (props: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) => {
  const [local, rest] = splitProps(props, ['class', 'children'])
  return (
    <DropdownMenuPrimitive.RadioItem class={cn(dropdownItemClass, 'pl-8 text-foreground', local.class)} {...rest}>
      <span class="absolute left-2.5 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle class="size-2 fill-primary text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {local.children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

const labelClass = 'px-3 py-2 text-xs text-muted-foreground'

/** Standalone heading inside the menu (e.g. the signed-in e-mail). Not tied to a group. */
export const AppDropdownLabel = (props: ComponentProps<'div'> & { inset?: boolean }) => {
  const [local, rest] = splitProps(props, ['class', 'inset'])
  return <div class={cn(labelClass, local.inset && 'pl-8', local.class)} {...rest} />
}

/** Accessible label for an `AppDropdownGroup` — must be rendered inside one. */
export const AppDropdownGroupLabel = (
  props: ComponentProps<typeof DropdownMenuPrimitive.GroupLabel> & { inset?: boolean },
) => {
  const [local, rest] = splitProps(props, ['class', 'inset'])
  return <DropdownMenuPrimitive.GroupLabel class={cn(labelClass, local.inset && 'pl-8', local.class)} {...rest} />
}

export const AppDropdownSeparator = (props: ComponentProps<typeof DropdownMenuPrimitive.Separator>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <DropdownMenuPrimitive.Separator class={cn('mx-2 my-1 h-px bg-border', local.class)} {...rest} />
}

/** Right-aligned keyboard hint inside an item. */
export const AppDropdownShortcut = (props: ComponentProps<'span'>) => {
  const [local, rest] = splitProps(props, ['class'])
  return <span class={cn('ml-auto text-xs text-muted-foreground', local.class)} {...rest} />
}
