import { createSignal } from 'solid-js'
import { AppCheckbox, AppRadioGroup, AppSwitch } from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'toggles', title: 'AppCheckbox · AppRadioGroup · AppSwitch', group: 'Forms' }

export function TogglesSection() {
  const sw = createKnobs(
    {
      label: { type: 'text' },
      description: { type: 'text' },
      size: { type: 'select', options: ['md', 'sm'] },
      disabled: { type: 'boolean' },
    },
    { label: 'E-posta bildirimleri', description: '', size: 'md', disabled: false },
  )
  const cb = createKnobs(
    {
      label: { type: 'text' },
      description: { type: 'text' },
      error: { type: 'text' },
      indeterminate: { type: 'boolean' },
      required: { type: 'boolean' },
      disabled: { type: 'boolean' },
    },
    {
      label: 'Kullanım koşullarını kabul ediyorum',
      description: '',
      error: '',
      indeterminate: false,
      required: false,
      disabled: false,
    },
  )
  const rg = createKnobs(
    {
      label: { type: 'text' },
      variant: { type: 'select', options: ['default', 'card'] },
      orientation: { type: 'select', options: ['vertical', 'horizontal'] },
      error: { type: 'text' },
      disabled: { type: 'boolean' },
    },
    { label: 'Plan', variant: 'card', orientation: 'vertical', error: '', disabled: false },
  )

  const [on, setOn] = createSignal(true)
  const [checked, setChecked] = createSignal(false)
  const [plan, setPlan] = createSignal('standard')
  const plans = [
    { value: 'standard', label: 'Standart', description: 'Temel ilan yayını.' },
    { value: 'premium', label: 'Vitrin', description: 'Öne çıkan konum + rozet.' },
    { value: 'enterprise', label: 'Kurumsal', description: 'Sınırsız ilan.', disabled: true },
  ]

  return (
    <DevSection
      meta={meta}
      description="Kobalte Switch / Checkbox / RadioGroup. Gizli native input `peer` — focus ring kontrol üzerinde görünür."
      imports="import { AppSwitch, AppCheckbox, AppRadioGroup } from '@/components/ui'"
    >
      <Block title="AppSwitch playground">
        <Playground
          knobs={sw}
          previewAlign="stretch"
          render={(v) => (
            <AppSwitch
              label={v.label}
              description={v.description}
              size={v.size}
              disabled={v.disabled}
              checked={on()}
              onChange={setOn}
              class="max-w-md"
            />
          )}
          code={(v) =>
            jsxSnippet(
              'AppSwitch',
              { ...v, checked: '{on()}', onChange: '{setOn}' },
              { defaults: { size: 'md' } },
            ).replace(/"\{([^"]+)\}"/g, '{$1}')
          }
        />
      </Block>
      <Block title="AppCheckbox playground">
        <Playground
          knobs={cb}
          previewAlign="stretch"
          render={(v) => (
            <AppCheckbox
              label={v.label}
              description={v.description}
              error={v.error}
              indeterminate={v.indeterminate}
              required={v.required}
              disabled={v.disabled}
              checked={checked()}
              onChange={setChecked}
            />
          )}
          code={(v) =>
            jsxSnippet('AppCheckbox', { ...v, checked: '{checked()}', onChange: '{setChecked}' }).replace(
              /"\{([^"]+)\}"/g,
              '{$1}',
            )
          }
        />
      </Block>
      <Block title="AppRadioGroup playground">
        <Playground
          knobs={rg}
          previewAlign="stretch"
          render={(v) => (
            <AppRadioGroup
              label={v.label}
              variant={v.variant}
              orientation={v.orientation}
              error={v.error}
              disabled={v.disabled}
              options={plans}
              value={plan()}
              onChange={setPlan}
              class="max-w-md"
            />
          )}
          code={(v) =>
            jsxSnippet(
              'AppRadioGroup',
              { ...v, options: '{plans}', value: '{plan()}', onChange: '{setPlan}' },
              { defaults: { variant: 'default', orientation: 'vertical' } },
            ).replace(/"\{([^"]+)\}"/g, '{$1}')
          }
        />
      </Block>

      <Block title="States">
        <Preview align="start" class="grid grid-cols-1 gap-6 @sm:grid-cols-2 @lg:grid-cols-3">
          <Cell label="switch: bare / sm / disabled" class="gap-3">
            <AppSwitch aria-label="Bare" defaultChecked />
            <AppSwitch aria-label="Bare off" />
            <AppSwitch size="sm" label="Küçük" defaultChecked />
            <AppSwitch label="Devre dışı" disabled />
            <AppSwitch label="Devre dışı (açık)" disabled defaultChecked />
          </Cell>
          <Cell label="checkbox states" class="gap-3">
            <AppCheckbox label="Unchecked" />
            <AppCheckbox label="Checked" defaultChecked />
            <AppCheckbox label="Indeterminate" indeterminate />
            <AppCheckbox label="Disabled" disabled />
            <AppCheckbox label="Disabled checked" disabled defaultChecked />
            <AppCheckbox label="Error" error="Bu kutuyu işaretlemelisiniz" />
            <AppCheckbox aria-label="Bare" />
          </Cell>
          <Cell label="radio: default horizontal" class="gap-3">
            <AppRadioGroup
              label="Çalışma şekli"
              orientation="horizontal"
              defaultValue="hybrid"
              options={[
                { value: 'office', label: 'Ofis' },
                { value: 'hybrid', label: 'Hibrit' },
                { value: 'remote', label: 'Uzaktan' },
              ]}
            />
            <AppRadioGroup
              label="Hata"
              error="Seçim yapın"
              options={[
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B' },
              ]}
            />
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
