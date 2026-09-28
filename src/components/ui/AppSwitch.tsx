import { Show, splitProps } from 'solid-js'
import { Switch as SwitchPrimitive } from '@kobalte/core/switch'
import { cn } from '@/lib/cn'
import { fieldHintClass } from './field'

export interface AppSwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  /** Visible label — renders the standard label-left / switch-right row. */
  label?: string
  description?: string
  disabled?: boolean
  name?: string
  value?: string
  /** Accessible name when there is no visible `label`. */
  'aria-label'?: string
  size?: 'sm' | 'md'
  class?: string
}

/**
 * The canonical on/off switch. Pass `label` for a full-width settings row, or
 * omit it for the bare track (compose your own layout around it).
 */
export function AppSwitch(props: AppSwitchProps) {
  const [local] = splitProps(props, [
    'checked',
    'defaultChecked',
    'onChange',
    'label',
    'description',
    'disabled',
    'name',
    'value',
    'aria-label',
    'size',
    'class',
  ])
  const sm = () => local.size === 'sm'

  return (
    <SwitchPrimitive
      checked={local.checked}
      defaultChecked={local.defaultChecked}
      onChange={local.onChange}
      disabled={local.disabled}
      name={local.name}
      value={local.value}
      class={cn(
        'inline-flex items-center gap-3',
        local.label && 'flex w-full min-h-7 cursor-pointer select-none justify-between',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70',
        local.class,
      )}
    >
      <Show when={local.label}>
        <div class="flex flex-col gap-0.5">
          <SwitchPrimitive.Label class="text-sm text-foreground">{local.label}</SwitchPrimitive.Label>
          <Show when={local.description}>
            <SwitchPrimitive.Description class={fieldHintClass}>{local.description}</SwitchPrimitive.Description>
          </Show>
        </div>
      </Show>
      <SwitchPrimitive.Input class="peer" aria-label={local.label ? undefined : local['aria-label']} />
      <SwitchPrimitive.Control
        class={cn(
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors duration-200',
          'data-[checked]:bg-primary data-[disabled]:cursor-not-allowed',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
          sm() ? 'h-5 w-9' : 'h-6 w-11',
        )}
      >
        <SwitchPrimitive.Thumb
          class={cn(
            'inline-block rounded-full border border-border/60 bg-background transition-transform duration-200 data-[checked]:border-transparent',
            sm()
              ? 'size-4 translate-x-0.5 data-[checked]:translate-x-[18px]'
              : 'size-5 translate-x-0.5 data-[checked]:translate-x-[22px]',
          )}
        />
      </SwitchPrimitive.Control>
    </SwitchPrimitive>
  )
}
