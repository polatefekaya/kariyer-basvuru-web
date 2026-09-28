import { createSignal } from 'solid-js'
import { Building2, MapPin } from 'lucide-solid'
import { AppSelect } from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'select', title: 'AppSelect', group: 'Forms' }

const cities = [
  'İstanbul',
  'Ankara',
  'İzmir',
  'Bursa',
  'Antalya',
  'Adana',
  'Konya',
  'Gaziantep',
  'Mersin',
  'Kayseri',
  'Eskişehir',
  'Samsun',
]
const positions = [
  { value: 'fe', label: 'Frontend Developer' },
  { value: 'be', label: 'Backend Developer' },
  { value: 'fs', label: 'Fullstack Developer' },
  { value: 'pm', label: 'Ürün Yöneticisi', disabled: true },
  { value: 'ds', label: 'Veri Bilimci' },
]

export function SelectSection() {
  const knobs = createKnobs(
    {
      label: { type: 'text' },
      placeholder: { type: 'text' },
      hint: { type: 'text' },
      error: { type: 'text' },
      leftIcon: { type: 'boolean' },
      required: { type: 'boolean' },
      disabled: { type: 'boolean' },
    },
    {
      label: 'Şehir',
      placeholder: 'Şehir seçin',
      hint: '',
      error: '',
      leftIcon: true,
      required: false,
      disabled: false,
    },
  )
  const [city, setCity] = createSignal('')
  const [pos, setPos] = createSignal('be')

  return (
    <DevSection
      meta={meta}
      description="Kobalte Select: portal'lı listbox, klavye + typeahead, seçili öğe bg-primary/10 + check. String-value API; options string[] veya { value, label, disabled }[]."
      imports="import { AppSelect } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <AppSelect
              label={v.label}
              placeholder={v.placeholder}
              hint={v.hint}
              error={v.error}
              required={v.required}
              disabled={v.disabled}
              leftIcon={v.leftIcon ? <MapPin /> : undefined}
              options={cities}
              value={city()}
              onChange={setCity}
              class="max-w-md"
            />
          )}
          code={(v) =>
            jsxSnippet('AppSelect', {
              ...v,
              leftIcon: v.leftIcon ? '{<MapPin />}' : undefined,
              options: '{cities}',
              value: '{city()}',
              onChange: '{setCity}',
            }).replace(/"\{([^"]+)\}"/g, '{$1}')
          }
        />
      </Block>

      <Block title="States">
        <Preview align="start" class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3">
          <Cell label="object options + disabled item">
            <AppSelect label="Pozisyon" options={positions} value={pos()} onChange={setPos} leftIcon={<Building2 />} />
          </Cell>
          <Cell label="error">
            <AppSelect
              label="Pozisyon"
              placeholder="Seçin"
              options={positions}
              value=""
              onChange={() => {}}
              error="Bu alan zorunlu"
              required
            />
          </Cell>
          <Cell label="disabled">
            <AppSelect label="Şehir" options={cities} value="İzmir" onChange={() => {}} disabled />
          </Cell>
          <Cell label="no label">
            <AppSelect
              placeholder="Sırala"
              options={['En yeni', 'En eski', 'Maaşa göre']}
              value=""
              onChange={() => {}}
            />
          </Cell>
          <Cell label="hint">
            <AppSelect
              label="Çalışma şekli"
              options={['Ofis', 'Hibrit', 'Uzaktan']}
              value="Hibrit"
              onChange={() => {}}
              hint="İlanınızda görünür."
            />
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
