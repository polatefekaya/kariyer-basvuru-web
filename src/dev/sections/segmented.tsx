import { createSignal } from 'solid-js'
import { LayoutGrid, List, Map as MapIcon } from 'lucide-solid'
import { AppSegmentedControl } from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'segmented', title: 'AppSegmentedControl', group: 'Controls' }

export function SegmentedSection() {
  const knobs = createKnobs(
    {
      size: { type: 'select', options: ['sm', 'md'] },
      icons: { type: 'boolean' },
      fullWidth: { type: 'boolean' },
      disabled: { type: 'boolean' },
      count: { type: 'number', min: 2, max: 5, step: 1 },
    },
    { size: 'sm', icons: false, fullWidth: false, disabled: false, count: 3 },
  )
  const [view, setView] = createSignal('list')
  const [disabledDemo, setDisabledDemo] = createSignal('list')
  const all = [
    { value: 'list', label: 'Liste', icon: List },
    { value: 'grid', label: 'Izgara', icon: LayoutGrid },
    { value: 'map', label: 'Harita', icon: MapIcon },
    { value: 'table', label: 'Tablo' },
    { value: 'kanban', label: 'Kanban' },
  ]

  return (
    <DevSection
      meta={meta}
      description="2–4 seçenek için animasyonlu primary indicator (Kobalte SegmentedControl). Daha fazlası için AppSelect."
      imports="import { AppSegmentedControl } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          previewAlign={knobs.values.fullWidth ? 'stretch' : 'center'}
          render={(v) => (
            <AppSegmentedControl
              size={v.size}
              fullWidth={v.fullWidth}
              disabled={v.disabled}
              options={all.slice(0, v.count).map((o) => (v.icons ? o : { value: o.value, label: o.label }))}
              value={view()}
              onChange={setView}
            />
          )}
          code={(v) =>
            jsxSnippet(
              'AppSegmentedControl',
              {
                size: v.size,
                fullWidth: v.fullWidth,
                disabled: v.disabled,
                options: '{options}',
                value: '{view()}',
                onChange: '{setView}',
              },
              { defaults: { size: 'sm' } },
            ).replace(/"\{([^"]+)\}"/g, '{$1}')
          }
        />
      </Block>
      <Block title="States">
        <Preview align="start" class="grid grid-cols-1 @sm:grid-cols-2">
          <Cell label="sm">
            <AppSegmentedControl value={view()} onChange={setView} options={all.slice(0, 3)} />
          </Cell>
          <Cell label="md + icons">
            <AppSegmentedControl size="md" value={view()} onChange={setView} options={all.slice(0, 3)} />
          </Cell>
          <Cell label="disabled">
            <AppSegmentedControl disabled value="list" onChange={() => {}} options={all.slice(0, 3)} />
          </Cell>
          <Cell label="disabled item">
            <AppSegmentedControl
              value={disabledDemo()}
              onChange={setDisabledDemo}
              options={[all[0]!, { ...all[1]!, disabled: true }, all[2]!]}
            />
          </Cell>
          <Cell label="fullWidth" class="@sm:col-span-2 [&>*]:w-full">
            <AppSegmentedControl fullWidth size="md" value={view()} onChange={setView} options={all.slice(0, 4)} />
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
