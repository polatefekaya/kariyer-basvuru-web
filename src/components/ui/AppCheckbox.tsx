import { Show, splitProps } from 'solid-js'
import { Checkbox as CheckboxPrimitive } from '@kobalte/core/checkbox'
import { Check, Minus } from 'lucide-solid'
import { cn } from '@/lib/cn'
import { fieldErrorClass, fieldHintClass } from './field'

export interface AppCheckboxProps {
  checked?: boolean
  defaultChecked?: boolean
  indeterminate?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  description?: string
  error?: string
  disabled?: boolean
  required?: boolean
  name?: string
  value?: string
  'aria-label'?: string
  class?: string
}

export function AppCheckbox(props: AppCheckboxProps) {
  const [local] = splitProps(props, [
    'checked',
    'defaultChecked',
    'indeterminate',
    'onChange',
    'label',
    'description',
    'error',
    'disabled',
    'required',
    'name',
    'value',
    'aria-label',
    'class',
  ])

  return (
    <CheckboxPrimitive
      checked={local.checked}
      defaultChecked={local.defaultChecked}
      indeterminate={local.indeterminate}
      onChange={local.onChange}
      disabled={local.disabled}
      required={local.required}
      name={local.name}
      value={local.value}
      validationState={local.error ? 'invalid' : 'valid'}
      class={cn(
        'group inline-flex items-start gap-3',
        local.label && 'cursor-pointer select-none',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60',
        local.class,
      )}
    >
      <CheckboxPrimitive.Input class="peer" aria-label={local.label ? undefined : local['aria-label']} />
      <CheckboxPrimitive.Control
        class={cn(
          'mt-0.5 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input bg-background transition-colors',
          'data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-foreground',
          'data-[indeterminate]:border-primary data-[indeterminate]:bg-primary data-[indeterminate]:text-primary-foreground',
          'data-[invalid]:border-destructive',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Show when={local.indeterminate} fallback={<Check class="size-3.5" stroke-width={3} />}>
            <Minus class="size-3.5" stroke-width={3} />
          </Show>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Control>
      <Show when={local.label || local.description}>
        <div class="flex flex-col gap-0.5">
          <CheckboxPrimitive.Label class="text-sm text-foreground">
            {local.label}{' '}
            <Show when={local.required}>
              <span class="text-destructive" aria-hidden="true">
                *
              </span>
            </Show>
          </CheckboxPrimitive.Label>
          <Show when={local.description}>
            <CheckboxPrimitive.Description class={fieldHintClass}>{local.description}</CheckboxPrimitive.Description>
          </Show>
          <CheckboxPrimitive.ErrorMessage class={fieldErrorClass}>{local.error}</CheckboxPrimitive.ErrorMessage>
        </div>
      </Show>
    </CheckboxPrimitive>
  )
}
