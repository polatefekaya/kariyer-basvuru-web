import { createSignal } from 'solid-js'
import { Briefcase, Mail, Settings, Users } from 'lucide-solid'
import { AppCountBadge, AppTabs, AppTabsContent } from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'tabs', title: 'AppTabs', group: 'Navigation' }

export function TabsSection() {
  const knobs = createKnobs(
    {
      variant: { type: 'select', options: ['pill', 'underline'] },
      icons: { type: 'boolean' },
      badges: { type: 'boolean' },
      disabledLast: { type: 'boolean', label: 'disable last' },
      count: { type: 'number', min: 2, max: 10, step: 1 },
    },
    { variant: 'pill', icons: true, badges: true, disabledLast: true, count: 4 },
  )
  const [tab, setTab] = createSignal('overview')
  const base = [
    { value: 'overview', label: 'Genel Bakış', icon: Briefcase },
    { value: 'applicants', label: 'Başvurular', icon: Users, rightElement: () => <AppCountBadge count={12} /> },
    { value: 'messages', label: 'Mesajlar', icon: Mail },
    { value: 'settings', label: 'Ayarlar', icon: Settings },
    { value: 'analytics', label: 'Analitik' },
    { value: 'billing', label: 'Faturalama' },
    { value: 'team', label: 'Ekip' },
    { value: 'integrations', label: 'Entegrasyonlar' },
    { value: 'security', label: 'Güvenlik' },
    { value: 'logs', label: 'Kayıtlar' },
  ]

  return (
    <DevSection
      meta={meta}
      description="Kobalte Tabs + Tabs.Indicator: kayan primary pill (veya alt çizgi). Liste yatay kaydırılabilir, kenarlarda mask fade. Fazla sekme ekleyip mobil viewport'ta deneyin."
      imports="import { AppTabs, AppTabsContent } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <AppTabs
              variant={v.variant}
              value={tab()}
              onChange={setTab}
              tabs={base.slice(0, v.count).map((t, i) => ({
                value: t.value,
                label: t.label,
                icon: v.icons ? t.icon : undefined,
                rightElement: v.badges ? t.rightElement : undefined,
                disabled: v.disabledLast && i === v.count - 1,
              }))}
              listClass="bg-transparent"
            >
              <AppTabsContent value={tab()} class="text-sm text-muted-foreground">
                Aktif: <code class="font-mono text-foreground">{tab()}</code>
              </AppTabsContent>
            </AppTabs>
          )}
          code={(v) =>
            jsxSnippet(
              'AppTabs',
              { variant: v.variant, value: '{tab()}', onChange: '{setTab}', tabs: '{tabs}' },
              { defaults: { variant: 'pill' }, children: '<AppTabsContent value="overview">…</AppTabsContent>' },
            ).replace(/"\{([^"]+)\}"/g, '{$1}')
          }
        />
      </Block>
      <Block title="Overflow" description="Dar bir kapta: kaydırma + kenar fade.">
        <Preview align="stretch" class="flex-col">
          <Cell label="pill, 320px">
            <div class="w-80 rounded-xl border border-dashed border-border p-2">
              <AppTabs value={tab()} onChange={setTab} tabs={base} listClass="mb-0 bg-transparent" />
            </div>
          </Cell>
          <Cell label="underline, 320px">
            <div class="w-80 rounded-xl border border-dashed border-border p-2">
              <AppTabs
                variant="underline"
                value={tab()}
                onChange={setTab}
                tabs={base}
                listClass="mb-0 bg-transparent"
              />
            </div>
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
