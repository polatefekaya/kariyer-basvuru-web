import { createMemo, Show, splitProps, type JSX } from 'solid-js'
import { Select as SelectPrimitive } from '@kobalte/core/select'
import { Check, ChevronDown } from 'lucide-solid'
import { cn } from '@/lib/cn'
import {
  fieldControlClass,
  fieldErrorClass,
  fieldHintClass,
  fieldLabelClass,
  fieldRequiredMarkClass,
  fieldWrapperClass,
} from './field'

export interface AppSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface AppSelectProps {
  label?: string
  hint?: string
  error?: string
  /** Plain strings (value === label) or `{ value, label }` objects. */
  options: (string | AppSelectOption)[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  name?: string
  required?: boolean
  disabled?: boolean
  leftIcon?: JSX.Element
  /** Accessible name when there is no visible `label`. */
  'aria-label'?: string
  class?: string
  triggerClass?: string
}

function normalize(options: (string | AppSelectOption)[]): AppSelectOption[] {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
}

/**
 * Single-select field on Kobalte Select (portaled listbox, keyboard + typeahead,
 * proper aria wiring). For searchable / async lists build on Kobalte Combobox.
 */
export function AppSelect(props: AppSelectProps) {
  const [local] = splitProps(props, [
    'label',
    'hint',
    'error',
    'options',
    'value',
    'onChange',
    'placeholder',
    'name',
    'required',
    'disabled',
    'leftIcon',
    'aria-label',
    'class',
    'triggerClass',
  ])

  const options = createMemo(() => normalize(local.options))
  const selected = createMemo(() => options().find((o) => o.value === local.value) ?? null)

  return (
    <SelectPrimitive<AppSelectOption>
      options={options()}
      optionValue="value"
      optionTextValue="label"
      optionDisabled="disabled"
      value={selected()}
      onChange={(opt) => local.onChange(opt?.value ?? '')}
      placeholder={local.placeholder}
      name={local.name}
      required={local.required}
      disabled={local.disabled}
      validationState={local.error ? 'invalid' : 'valid'}
      gutter={4}
      sameWidth
      disallowEmptySelection
      class={cn(fieldWrapperClass, local.class)}
      itemComponent={(item) => (
        <SelectPrimitive.Item
          item={item.item}
          class={cn(
            'relative flex cursor-pointer select-none items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs outline-none transition-colors',
            'data-[highlighted]:bg-secondary-hover',
            'data-[selected]:bg-primary/10 data-[selected]:text-primary',
            'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          )}
        >
          <SelectPrimitive.ItemLabel class="truncate">{item.item.rawValue.label}</SelectPrimitive.ItemLabel>
          <SelectPrimitive.ItemIndicator>
            <Check class="size-3.5 shrink-0" />
          </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
      )}
    >
      <Show when={local.label}>
        <SelectPrimitive.Label class={fieldLabelClass}>
          {local.label}{' '}
          <Show when={local.required}>
            <span class={fieldRequiredMarkClass} aria-hidden="true">
              *
            </span>
          </Show>
        </SelectPrimitive.Label>
      </Show>

      <SelectPrimitive.HiddenSelect />
      <SelectPrimitive.Trigger
        aria-label={local.label ? undefined : local['aria-label']}
        class={cn(
          fieldControlClass,
          'group h-10 items-center justify-between gap-2 py-2 pl-4 pr-3',
          'data-[expanded]:border-primary data-[expanded]:ring-2 data-[expanded]:ring-primary data-[expanded]:ring-offset-2',
          local.triggerClass,
        )}
      >
        <Show when={local.leftIcon}>
          <span aria-hidden="true" class="shrink-0 text-muted-foreground [&_svg]:size-4">
            {local.leftIcon}
          </span>
        </Show>
        <SelectPrimitive.Value<AppSelectOption> class="flex-1 truncate text-left data-[placeholder-shown]:text-muted-foreground">
          {(state) => state.selectedOption().label}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon class="shrink-0 text-muted-foreground transition-transform duration-200 group-data-[expanded]:rotate-180">
          <ChevronDown class="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          class={cn(
            'z-50 min-w-32 overflow-hidden rounded-2xl border border-border bg-card p-1',
            'origin-[var(--kb-select-content-transform-origin)]',
            'data-[expanded]:animate-in data-[closed]:animate-out',
            'data-[expanded]:fade-in-0 data-[closed]:fade-out-0 data-[expanded]:zoom-in-95 data-[closed]:zoom-out-95',
          )}
        >
          <SelectPrimitive.Listbox class="max-h-64 overflow-y-auto outline-none" />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>

      <Show when={local.hint && !local.error}>
        <SelectPrimitive.Description class={fieldHintClass}>{local.hint}</SelectPrimitive.Description>
      </Show>
      <SelectPrimitive.ErrorMessage class={fieldErrorClass}>{local.error}</SelectPrimitive.ErrorMessage>
    </SelectPrimitive>
  )
}
