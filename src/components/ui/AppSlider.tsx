import { Show, splitProps, type JSX } from 'solid-js'
import { Slider as SliderPrimitive } from '@kobalte/core/slider'
import { RotateCcw } from 'lucide-solid'
import { cn } from '@/lib/cn'
import { fieldErrorClass, fieldHintClass, focusRingClass } from './field'

export interface AppSliderProps {
  label?: string
  value: number
  onChange: (value: number) => void
  /** Fires when the user releases the thumb — use for expensive side effects. */
  onChangeEnd?: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Enables the reset affordance when `value !== defaultValue`. */
  defaultValue?: number
  /** Custom display for the value label (e.g. `v => \`${v}%\``). */
  formatValue?: (value: number) => string
  /** Show a paired number input next to the label. */
  showInput?: boolean
  /** Show `min` / `max` captions at either end of the track. */
  showBounds?: boolean
  icon?: JSX.Element
  hint?: string
  error?: string
  disabled?: boolean
  name?: string
  class?: string
}

/**
 * Labelled numeric slider (Kobalte Slider): optional paired number box, reset-to-default
 * affordance and min/max captions — the SliderControl pattern from kariyer-zamani-web.
 */
export function AppSlider(props: AppSliderProps) {
  const [local] = splitProps(props, [
    'label',
    'value',
    'onChange',
    'onChangeEnd',
    'min',
    'max',
    'step',
    'defaultValue',
    'formatValue',
    'showInput',
    'showBounds',
    'icon',
    'hint',
    'error',
    'disabled',
    'name',
    'class',
  ])

  const min = () => local.min ?? 0
  const max = () => local.max ?? 100
  const step = () => local.step ?? 1
  const isModified = () => local.defaultValue != null && local.value !== local.defaultValue
  const format = (v: number) => (local.formatValue ? local.formatValue(v) : String(v))

  // Clamp typed input without swallowing legitimate values (0 or negatives).
  const handleNumber = (raw: string) => {
    if (raw.trim() === '') return
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return
    local.onChange(Math.min(max(), Math.max(min(), parsed)))
  }

  return (
    <SliderPrimitive
      value={[local.value]}
      onChange={([v]) => local.onChange(v!)}
      onChangeEnd={([v]) => local.onChangeEnd?.(v!)}
      minValue={min()}
      maxValue={max()}
      step={step()}
      disabled={local.disabled}
      name={local.name}
      validationState={local.error ? 'invalid' : 'valid'}
      getValueLabel={(p) => format(p.values[0]!)}
      class={cn('flex w-full select-none flex-col gap-3 data-[disabled]:opacity-60', local.class)}
    >
      <Show when={local.label || local.showInput}>
        <div class="flex items-center justify-between gap-3">
          <SliderPrimitive.Label class="flex items-center gap-2 text-xs text-muted-foreground [&_svg]:size-3.5">
            {local.icon} {local.label}
          </SliderPrimitive.Label>
          <div class="flex items-center gap-2">
            <Show when={isModified() && !local.disabled}>
              <button
                type="button"
                onClick={() => local.onChange(local.defaultValue!)}
                class={cn(
                  'rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary-hover hover:text-primary-hover',
                  focusRingClass,
                )}
                title="Varsayılana sıfırla"
                aria-label={`${local.label ?? ''}: varsayılana sıfırla`}
              >
                <RotateCcw class="size-3" />
              </button>
            </Show>
            <Show when={local.showInput} fallback={<SliderPrimitive.ValueLabel class="text-xs text-foreground" />}>
              <input
                type="number"
                value={local.value}
                min={min()}
                max={max()}
                step={step()}
                disabled={local.disabled}
                aria-label={local.label}
                onInput={(e) => handleNumber(e.currentTarget.value)}
                class={cn(
                  'w-16 rounded-lg border border-border bg-secondary px-1 py-0.5 text-center text-xs',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                )}
              />
            </Show>
          </div>
        </div>
      </Show>

      <div class="flex items-center gap-3">
        <Show when={local.showBounds}>
          <span class="w-6 text-right text-xs text-muted-foreground" aria-hidden="true">
            {min()}
          </span>
        </Show>
        <SliderPrimitive.Track class="relative h-2 w-full grow cursor-pointer rounded-full bg-secondary data-[disabled]:cursor-not-allowed">
          <SliderPrimitive.Fill class="absolute h-full rounded-full bg-primary" />
          <SliderPrimitive.Thumb
            class={cn(
              'top-1/2 block size-4 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary bg-background active:cursor-grabbing',
              'transition-transform',
              focusRingClass,
              'data-[disabled]:pointer-events-none',
            )}
          >
            <SliderPrimitive.Input />
          </SliderPrimitive.Thumb>
        </SliderPrimitive.Track>
        <Show when={local.showBounds}>
          <span class="w-6 text-left text-xs text-muted-foreground" aria-hidden="true">
            {max()}
          </span>
        </Show>
      </div>

      <Show when={local.hint && !local.error}>
        <SliderPrimitive.Description class={fieldHintClass}>{local.hint}</SliderPrimitive.Description>
      </Show>
      <SliderPrimitive.ErrorMessage class={fieldErrorClass}>{local.error}</SliderPrimitive.ErrorMessage>
    </SliderPrimitive>
  )
}
