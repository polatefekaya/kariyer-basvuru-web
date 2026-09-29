import { Show, splitProps, type JSX } from 'solid-js'
import { TextField } from '@kobalte/core/text-field'
import { cn } from '@/lib/cn'
import {
  fieldControlClass,
  fieldErrorClass,
  fieldHintClass,
  fieldLabelClass,
  fieldRequiredMarkClass,
  fieldWrapperClass,
} from './field'

type NativeTextAreaProps = Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'onInput' | 'class' | 'name' | 'required' | 'disabled' | 'readOnly' | 'readonly'
>

export interface AppTextAreaProps extends NativeTextAreaProps {
  label?: string
  hint?: string
  error?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  name?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  /** Show a `current / max` character counter (requires `maxLength`). */
  showCount?: boolean
  /** Grow with content instead of scrolling. */
  autoResize?: boolean
  class?: string
  textareaClass?: string
}

export function AppTextArea(props: AppTextAreaProps) {
  const [local, textarea] = splitProps(props, [
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
    'showCount',
    'autoResize',
    'class',
    'textareaClass',
    'rows',
    'maxLength',
  ])

  const count = () => (local.value ?? '').length

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

      <TextField.TextArea
        rows={local.rows ?? 4}
        maxLength={local.maxLength}
        autoResize={local.autoResize}
        class={cn(
          fieldControlClass,
          'min-h-20 px-4 py-3 resize-y',
          local.autoResize && 'resize-none',
          local.textareaClass,
        )}
        {...textarea}
      />

      <div class="flex items-start justify-between gap-2 empty:hidden">
        <Show when={local.hint && !local.error}>
          <TextField.Description class={fieldHintClass}>{local.hint}</TextField.Description>
        </Show>
        <TextField.ErrorMessage class={fieldErrorClass}>{local.error}</TextField.ErrorMessage>
        <Show when={local.showCount && local.maxLength != null}>
          <span class={cn(fieldHintClass, 'ml-auto', count() >= Number(local.maxLength) && 'text-destructive')}>
            {count()} / {local.maxLength}
          </span>
        </Show>
      </div>
    </TextField>
  )
}
