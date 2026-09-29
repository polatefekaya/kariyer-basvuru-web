import { Show, splitProps, type JSX } from 'solid-js'
import { TextField } from '@kobalte/core/text-field'
import { X } from 'lucide-solid'
import { cn } from '@/lib/cn'
import {
  fieldControlClass,
  fieldErrorClass,
  fieldHintClass,
  fieldLabelClass,
  fieldRequiredMarkClass,
  fieldWrapperClass,
  focusRingClass,
} from './field'

type NativeInputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'onInput' | 'class' | 'name' | 'required' | 'disabled' | 'readOnly' | 'readonly'
>

export interface AppInputProps extends NativeInputProps {
  label?: string
  hint?: string
  error?: string
  value?: string
  defaultValue?: string
  /** Fires on every keystroke with the current string value. */
  onChange?: (value: string) => void
  name?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  leftIcon?: JSX.Element
  rightIcon?: JSX.Element
  /** Show an accessible ✕ button while there is a value (controlled inputs; calls `onChange('')`). */
  clearable?: boolean
  /** Class for the outer wrapper. */
  class?: string
  /** Class for the <input> itself. */
  inputClass?: string
  ref?: HTMLInputElement | ((el: HTMLInputElement) => void)
}

export function AppInput(props: AppInputProps) {
  const [local, input] = splitProps(props, [
    'label',
    'hint',
    'error',
    'value',
    'defaultValue',
    'onChange',
    'name',
    'required',
    'disabled',
    'readOnly',
    'leftIcon',
    'rightIcon',
    'clearable',
    'class',
    'inputClass',
  ])
  const showClear = () => local.clearable && !!local.value && !local.disabled && !local.readOnly

  return (
    <TextField
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={local.onChange}
      name={local.name}
      required={local.required}
      disabled={local.disabled}
      readOnly={local.readOnly}
      validationState={local.error ? 'invalid' : 'valid'}
      class={cn(fieldWrapperClass, local.class)}
    >
      <Show when={local.label}>
        <TextField.Label class={fieldLabelClass}>
          {local.label}{' '}
          <Show when={local.required}>
            <span class={fieldRequiredMarkClass} aria-hidden="true">
              *
            </span>
          </Show>
        </TextField.Label>
      </Show>

      <div class="relative w-full">
        <Show when={local.leftIcon}>
          <span
            aria-hidden="true"
            class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4"
          >
            {local.leftIcon}
          </span>
        </Show>
        <TextField.Input
          class={cn(
            fieldControlClass,
            'h-10 px-4 py-2',
            'file:border-0 file:bg-transparent file:text-sm',
            local.leftIcon && 'pl-10',
            (local.rightIcon || local.clearable) && 'pr-10',
            local.inputClass,
          )}
          {...input}
        />
        <Show when={showClear()}>
          <button
            type="button"
            aria-label="Temizle"
            class={cn(
              'absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full',
              'text-muted-foreground hover:bg-secondary-hover hover:text-primary-hover [&_svg]:size-4',
              focusRingClass,
            )}
            onClick={() => local.onChange?.('')}
          >
            <X />
          </button>
        </Show>
        <Show when={local.rightIcon && !showClear()}>
          <span
            aria-hidden="true"
            class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4"
          >
            {local.rightIcon}
          </span>
        </Show>
      </div>

      <Show when={local.hint && !local.error}>
        <TextField.Description class={fieldHintClass}>{local.hint}</TextField.Description>
      </Show>
      <TextField.ErrorMessage class={fieldErrorClass}>{local.error}</TextField.ErrorMessage>
    </TextField>
  )
}
