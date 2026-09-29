import { Loader2 } from 'lucide-solid'
import { cn } from '@/lib/cn'

const sizes = { xs: 'size-3', sm: 'size-4', md: 'size-6', lg: 'size-8', xl: 'size-12' }

export interface AppSpinnerProps {
  size?: keyof typeof sizes
  /** Screen-reader label. */
  label?: string
  class?: string
}

export function AppSpinner(props: AppSpinnerProps) {
  return (
    <span role="status" class={cn('inline-flex items-center justify-center text-primary', props.class)}>
      <Loader2 class={cn('animate-spin', sizes[props.size ?? 'md'])} aria-hidden="true" />
      <span class="sr-only">{props.label ?? 'Yükleniyor'}</span>
    </span>
  )
}

/** Centered full-area loading state for panels / pages. */
export function AppLoadingBlock(props: { label?: string; class?: string }) {
  return (
    <div class={cn('flex w-full flex-col items-center justify-center gap-3 py-16 text-muted-foreground', props.class)}>
      <AppSpinner size="lg" label={props.label} />
      {props.label && <span class="text-sm">{props.label}</span>}
    </div>
  )
}
