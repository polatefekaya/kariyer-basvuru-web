import { For } from 'solid-js'
import { AppButton, AppLoadingBlock, AppSkeleton, AppSkeletonCard, AppSkeletonText, AppSpinner } from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'loading', title: 'AppSkeleton · AppSpinner', group: 'Feedback' }
const spinnerSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const

export function LoadingSection() {
  const sk = createKnobs(
    {
      variant: { type: 'select', options: ['rect', 'circle', 'text'] },
      width: { type: 'number', min: 8, max: 400, step: 4 },
      height: { type: 'number', min: 8, max: 200, step: 4 },
    },
    { variant: 'rect', width: 160, height: 24 },
  )
  const sp = createKnobs(
    { size: { type: 'select', options: spinnerSizes }, label: { type: 'text' } },
    { size: 'md', label: 'Yükleniyor' },
  )

  return (
    <DevSection
      meta={meta}
      description="Skeleton: animate-pulse bg-muted/60. Spinner: Loader2 animate-spin text-primary + sr-only label. AppLoadingBlock: panel/sayfa için ortalanmış durum."
      imports="import { AppSkeleton, AppSkeletonText, AppSkeletonCard, AppSpinner, AppLoadingBlock } from '@/components/ui'"
    >
      <Block title="AppSkeleton playground">
        <Playground
          knobs={sk}
          render={(v) => (
            <AppSkeleton variant={v.variant} width={v.width} height={v.variant === 'text' ? undefined : v.height} />
          )}
          code={(v) =>
            jsxSnippet(
              'AppSkeleton',
              { variant: v.variant, width: v.width, height: v.variant === 'text' ? undefined : v.height },
              { defaults: { variant: 'rect' } },
            )
          }
        />
      </Block>
      <Block title="AppSpinner playground">
        <Playground
          knobs={sp}
          render={(v) => <AppSpinner size={v.size} label={v.label} />}
          code={(v) => jsxSnippet('AppSpinner', v, { defaults: { size: 'md', label: 'Yükleniyor' } })}
        />
      </Block>
      <Block title="Compositions">
        <Preview align="start" class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3">
          <Cell label="AppSkeletonText lines=4" class="[&>*]:w-full">
            <AppSkeletonText lines={4} />
          </Cell>
          <Cell label="AppSkeletonCard" class="[&>*]:w-full">
            <AppSkeletonCard />
          </Cell>
          <Cell label="AppSkeletonCard media=false" class="[&>*]:w-full">
            <AppSkeletonCard media={false} />
          </Cell>
          <Cell label="list row" class="[&>*]:w-full">
            <div class="flex flex-col gap-3">
              <For each={[1, 2, 3]}>
                {() => (
                  <div class="flex items-center gap-3">
                    <AppSkeleton variant="circle" width={40} height={40} />
                    <div class="flex flex-1 flex-col gap-2">
                      <AppSkeleton variant="text" width="70%" />
                      <AppSkeleton variant="text" width="40%" class="h-2.5" />
                    </div>
                    <AppSkeleton width={64} height={24} class="rounded-full" />
                  </div>
                )}
              </For>
            </div>
          </Cell>
          <Cell label="spinner sizes">
            <div class="flex items-center gap-4">
              <For each={spinnerSizes}>{(s) => <AppSpinner size={s} />}</For>
            </div>
          </Cell>
          <Cell label="AppLoadingBlock" class="[&>*]:w-full">
            <div class="rounded-2xl border border-dashed border-border">
              <AppLoadingBlock label="Başvurular yükleniyor…" class="py-8" />
            </div>
          </Cell>
          <Cell label="inside button">
            <AppButton loading>Kaydediliyor</AppButton>
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
