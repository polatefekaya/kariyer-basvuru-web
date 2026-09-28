/**
 * Shared class strings for form-control chrome so every field (input, textarea,
 * select, checkbox…) renders the identical label / hint / error treatment.
 */
export const fieldWrapperClass = 'flex w-full flex-col gap-2'

export const fieldLabelClass = 'text-sm text-foreground'

export const fieldRequiredMarkClass = 'text-destructive'

export const fieldHintClass = 'text-xs text-muted-foreground'

export const fieldErrorClass = 'text-xs text-destructive'

/** The canonical bordered control box (input / select trigger / textarea). */
export const fieldControlClass = [
  'flex w-full rounded-2xl border border-input bg-background text-sm text-foreground',
  'ring-offset-background transition-colors',
  'placeholder:text-muted-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'data-[invalid]:border-destructive data-[invalid]:focus-visible:ring-destructive',
].join(' ')

/** Shared focus ring for non-text controls (buttons, switches, tabs…). */
export const focusRingClass =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
