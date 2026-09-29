import { For, Show, splitProps, type JSX } from 'solid-js'
import { RadioGroup as RadioGroupPrimitive } from '@kobalte/core/radio-group'
import { cn } from '@/lib/cn'
import { fieldErrorClass, fieldHintClass, fieldLabelClass, fieldRequiredMarkClass } from './field'

export interface AppRadioOption<T extends string = string> {
  value: T
  label: JSX.Element
  description?: string
  disabled?: boolean
}

export interface AppRadioGroupProps<T extends string = string> {
  options: AppRadioOption<T>[]
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  label?: string
  hint?: string
  error?: string
  orientation?: 'vertical' | 'horizontal'
  /** `card` renders each option as a selectable bordered tile. */
  variant?: 'default' | 'card'
  required?: boolean
  disabled?: boolean
  name?: string
  class?: string
}

export function AppRadioGroup<T extends string = string>(props: AppRadioGroupProps<T>) {
  const [local] = splitProps(props, [
    'options',
    'value',
    'defaultValue',
    'onChange',
    'label',
    'hint',
    'error',
    'orientation',
    'variant',
    'required',
    'disabled',
    'name',
    'class',
  ])
  const isCard = () => local.variant === 'card'

  return (
    <RadioGroupPrimitive
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={(v) => local.onChange?.(v as T)}
      orientation={local.orientation ?? 'vertical'}
      required={local.required}
      disabled={local.disabled}
      name={local.name}
      validationState={local.error ? 'invalid' : 'valid'}
      class={cn('flex flex-col gap-2', local.class)}
    >
      <Show when={local.label}>
        <RadioGroupPrimitive.Label class={fieldLabelClass}>
          {local.label}{' '}
          <Show when={local.required}>
            <span class={fieldRequiredMarkClass} aria-hidden="true">
              *
            </span>
          </Show>
        </RadioGroupPrimitive.Label>
      </Show>

      <div class={cn('flex gap-2', local.orientation === 'horizontal' ? 'flex-row flex-wrap gap-x-5' : 'flex-col')}>
        <For each={local.options}>
          {(opt) => (
            <RadioGroupPrimitive.Item
              value={opt.value}
              disabled={opt.disabled}
              class={cn(
                'group flex items-start gap-3 select-none',
                'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60',
                isCard()
                  ? cn(
                      'cursor-pointer rounded-2xl border border-border bg-card p-4 transition-colors',
                      'hover:bg-secondary/40 data-[checked]:border-primary data-[checked]:bg-primary/5',
                    )
                  : 'cursor-pointer',
              )}
            >
              <RadioGroupPrimitive.ItemInput class="peer" />
              <RadioGroupPrimitive.ItemControl
                class={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background transition-colors',
                  'data-[checked]:border-primary',
                  'data-[invalid]:border-destructive',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                )}
              >
                <RadioGroupPrimitive.ItemIndicator class="size-2 rounded-full bg-primary" />
              </RadioGroupPrimitive.ItemControl>
              <div class="flex flex-col gap-0.5">
                <RadioGroupPrimitive.ItemLabel class="text-sm text-foreground">
                  {opt.label}
                </RadioGroupPrimitive.ItemLabel>
                <Show when={opt.description}>
                  <RadioGroupPrimitive.ItemDescription class={fieldHintClass}>
                    {opt.description}
                  </RadioGroupPrimitive.ItemDescription>
                </Show>
              </div>
            </RadioGroupPrimitive.Item>
          )}
        </For>
      </div>

      <Show when={local.hint && !local.error}>
        <RadioGroupPrimitive.Description class={fieldHintClass}>{local.hint}</RadioGroupPrimitive.Description>
      </Show>
      <RadioGroupPrimitive.ErrorMessage class={fieldErrorClass}>{local.error}</RadioGroupPrimitive.ErrorMessage>
    </RadioGroupPrimitive>
  )
}
