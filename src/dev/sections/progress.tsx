import { AppProgress, AppProgressRing, type AppProgressSize, type AppProgressVariant } from '@/components/ui'
import {
  Block,
  Cell,
  createKnobs,
  DevSection,
  jsxSnippet,
  Matrix,
  Playground,
  Preview,
  type DevSectionMeta,
} from '../knobs'

export const meta: DevSectionMeta = { id: 'progress', title: 'AppProgress · AppProgressRing', group: 'Controls' }

const variants = ['primary', 'success', 'warning', 'destructive', 'premium'] as const
const sizes = ['xs', 'sm', 'md', 'lg'] as const

export function ProgressSection() {
  const knobs = createKnobs(
    {
      value: { type: 'number', min: 0, max: 100, step: 1 },
      variant: { type: 'select', options: variants },
      size: { type: 'select', options: sizes },
      label: { type: 'text' },
      showValue: { type: 'boolean' },
      indeterminate: { type: 'boolean' },
    },
    { value: 62, variant: 'primary', size: 'md', label: 'Profil tamamlanma', showValue: true, indeterminate: false },
  )
  const ring = createKnobs(
    {
      value: { type: 'number', min: 0, max: 100, step: 1 },
      size: { type: 'number', min: 24, max: 160, step: 4 },
      strokeWidth: { type: 'number', min: 2, max: 16, step: 1 },
      variant: { type: 'select', options: variants },
      showValue: { type: 'boolean' },
    },
    { value: 62, size: 64, strokeWidth: 6, variant: 'primary', showValue: true },
  )

  return (
    <DevSection
      meta={meta}
      description="Kobalte Progress (bar) + SVG ring. Değer değişimi 500ms ease-out ile animasyonlu."
      imports="import { AppProgress, AppProgressRing } from '@/components/ui'"
    >
      <Block title="AppProgress playground">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <AppProgress
              value={v.value}
              variant={v.variant}
              size={v.size}
              label={v.label}
              showValue={v.showValue}
              indeterminate={v.indeterminate}
              class="max-w-md"
            />
          )}
          code={(v) => jsxSnippet('AppProgress', v, { defaults: { variant: 'primary', size: 'md' } })}
        />
      </Block>
      <Block title="AppProgressRing playground">
        <Playground
          knobs={ring}
          render={(v) => (
            <AppProgressRing
              value={v.value}
              size={v.size}
              strokeWidth={v.strokeWidth}
              variant={v.variant}
              showValue={v.showValue}
            />
          )}
          code={(v) => jsxSnippet('AppProgressRing', v, { defaults: { size: 48, strokeWidth: 4, variant: 'primary' } })}
        />
      </Block>
      <Block title="Variant × Size">
        <Matrix
          rows={variants}
          cols={sizes}
          rowLabel={(r) => r}
          colLabel={(c) => c}
          cell={(variant: AppProgressVariant, size: AppProgressSize) => (
            <AppProgress value={62} variant={variant} size={size} class="w-40" />
          )}
        />
      </Block>
      <Block title="Rings & states">
        <Preview align="start">
          <Cell label="rings">
            <div class="flex items-center gap-4">
              <AppProgressRing value={25} size={32} strokeWidth={3} />
              <AppProgressRing value={50} variant="success" showValue />
              <AppProgressRing value={75} size={64} strokeWidth={6} variant="warning" showValue />
              <AppProgressRing value={100} size={80} strokeWidth={8} variant="premium" showValue />
              <AppProgressRing value={10} size={48} variant="destructive" showValue />
            </div>
          </Cell>
          <Cell label="0 / 100 / indeterminate / custom format" class="w-72">
            <AppProgress value={0} showValue label="Boş" />
            <AppProgress value={100} showValue label="Dolu" variant="success" />
            <AppProgress indeterminate label="Yükleniyor" />
            <AppProgress value={3} max={8} showValue label="Adım" formatValue={(v, m) => `${v} / ${m}`} />
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
