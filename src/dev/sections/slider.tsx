import { createSignal } from 'solid-js'
import { Type } from 'lucide-solid'
import { AppSlider } from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'slider', title: 'AppSlider', group: 'Controls' }

export function SliderSection() {
  const knobs = createKnobs(
    {
      label: { type: 'text' },
      min: { type: 'number', min: -50, max: 50, step: 1 },
      max: { type: 'number', min: 10, max: 500, step: 10 },
      step: { type: 'number', min: 0.1, max: 10, step: 0.1 },
      showInput: { type: 'boolean' },
      showBounds: { type: 'boolean' },
      icon: { type: 'boolean' },
      hint: { type: 'text' },
      error: { type: 'text' },
      disabled: { type: 'boolean' },
    },
    {
      label: 'Yazı boyutu',
      min: 10,
      max: 24,
      step: 1,
      showInput: true,
      showBounds: true,
      icon: true,
      hint: '',
      error: '',
      disabled: false,
    },
  )
  const [v1, setV1] = createSignal(14)
  const [v2, setV2] = createSignal(62)
  const [v3, setV3] = createSignal(0)

  return (
    <DevSection
      meta={meta}
      description="Kobalte Slider: label, opsiyonel sayı kutusu, defaultValue ile sıfırlama, min/max etiketleri, formatValue, onChangeEnd."
      imports="import { AppSlider } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <AppSlider
              label={v.label}
              min={v.min}
              max={v.max}
              step={v.step}
              defaultValue={14}
              showInput={v.showInput}
              showBounds={v.showBounds}
              icon={v.icon ? <Type /> : undefined}
              hint={v.hint}
              error={v.error}
              disabled={v.disabled}
              value={v1()}
              onChange={setV1}
              class="max-w-md"
            />
          )}
          code={(v) =>
            jsxSnippet(
              'AppSlider',
              { ...v, icon: v.icon ? '{<Type />}' : undefined, defaultValue: 14, value: '{v()}', onChange: '{setV}' },
              { defaults: { min: 0, max: 100, step: 1 } },
            ).replace(/"\{([^"]+)\}"/g, '{$1}')
          }
        />
      </Block>
      <Block title="States">
        <Preview align="start" class="grid grid-cols-1 gap-8 @sm:grid-cols-2">
          <Cell label="minimal (label + value)" class="[&>*]:w-full">
            <AppSlider label="Tamamlanma" value={v2()} onChange={setV2} formatValue={(x) => `${x}%`} />
          </Cell>
          <Cell label="no label" class="[&>*]:w-full">
            <AppSlider value={v2()} onChange={setV2} />
          </Cell>
          <Cell label="negative range, step 0.05" class="[&>*]:w-full">
            <AppSlider
              label="Harf aralığı"
              min={-0.2}
              max={0.5}
              step={0.05}
              defaultValue={0}
              value={v3()}
              onChange={setV3}
              showInput
              showBounds
            />
          </Cell>
          <Cell label="error" class="[&>*]:w-full">
            <AppSlider label="Bütçe" value={v2()} onChange={setV2} error="Bütçe 50'nin altında olamaz" />
          </Cell>
          <Cell label="disabled" class="[&>*]:w-full">
            <AppSlider label="Kilitli" value={40} onChange={() => {}} disabled showBounds />
          </Cell>
          <Cell label="hint + formatValue ₺" class="[&>*]:w-full">
            <AppSlider
              label="Maaş"
              min={0}
              max={200000}
              step={5000}
              value={v2() * 1000}
              onChange={(x) => setV2(x / 1000)}
              formatValue={(x) => `${x.toLocaleString('tr-TR')} ₺`}
              hint="Brüt aylık"
            />
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
