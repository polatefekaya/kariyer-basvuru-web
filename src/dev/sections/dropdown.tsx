import { createSignal } from 'solid-js'
import {
  Archive,
  ChevronDown,
  Copy,
  LogOut,
  MoreHorizontal,
  Pencil,
  Settings,
  Share2,
  Trash2,
  User,
} from 'lucide-solid'
import {
  AppButton,
  AppDropdown,
  AppDropdownCheckboxItem,
  AppDropdownContent,
  AppDropdownGroup,
  AppDropdownGroupLabel,
  AppDropdownItem,
  AppDropdownLabel,
  AppDropdownRadioGroup,
  AppDropdownRadioItem,
  AppDropdownSeparator,
  AppDropdownShortcut,
  AppDropdownSub,
  AppDropdownSubContent,
  AppDropdownSubTrigger,
  AppDropdownTrigger,
} from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'dropdown', title: 'AppDropdown', group: 'Overlays' }
const placements = [
  'bottom-start',
  'bottom',
  'bottom-end',
  'top-start',
  'top',
  'top-end',
  'right-start',
  'left-start',
] as const

export function DropdownSection() {
  const knobs = createKnobs(
    {
      placement: { type: 'select', options: placements },
      biggerText: { type: 'boolean' },
      inset: { type: 'boolean' },
      withLabel: { type: 'boolean' },
      withShortcuts: { type: 'boolean' },
      withSub: { type: 'boolean', label: 'submenu' },
    },
    { placement: 'bottom-start', biggerText: false, inset: false, withLabel: true, withShortcuts: true, withSub: true },
  )
  const [notify, setNotify] = createSignal(true)
  const [sort, setSort] = createSignal('new')

  return (
    <DevSection
      meta={meta}
      description="Kobalte DropdownMenu: Item / CheckboxItem / RadioItem / Sub / Group / Separator / Shortcut. Öğeler text-xs (biggerText → text-sm), highlight bg-secondary, destructive variant."
      imports="import { AppDropdown, AppDropdownTrigger, AppDropdownContent, AppDropdownItem, … } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          render={(v) => (
            <AppDropdown placement={v.placement}>
              <AppDropdownTrigger as={AppButton} variant="outline" rightIcon={<ChevronDown />}>
                Hesap
              </AppDropdownTrigger>
              <AppDropdownContent class="w-56">
                {v.withLabel && (
                  <>
                    <AppDropdownLabel inset={v.inset}>polat.kaya@psb-tech.com</AppDropdownLabel>
                    <AppDropdownSeparator />
                  </>
                )}
                <AppDropdownItem inset={v.inset} biggerText={v.biggerText}>
                  <User /> Profil {v.withShortcuts && <AppDropdownShortcut>⇧⌘P</AppDropdownShortcut>}
                </AppDropdownItem>
                <AppDropdownItem inset={v.inset} biggerText={v.biggerText}>
                  <Settings /> Ayarlar {v.withShortcuts && <AppDropdownShortcut>⌘,</AppDropdownShortcut>}
                </AppDropdownItem>
                <AppDropdownCheckboxItem checked={notify()} onChange={setNotify} biggerText={v.biggerText}>
                  Bildirimler
                </AppDropdownCheckboxItem>
                {v.withSub && (
                  <AppDropdownSub>
                    <AppDropdownSubTrigger inset={v.inset}>
                      <Share2 /> Paylaş
                    </AppDropdownSubTrigger>
                    <AppDropdownSubContent>
                      <AppDropdownItem>LinkedIn</AppDropdownItem>
                      <AppDropdownItem>X</AppDropdownItem>
                      <AppDropdownItem>Bağlantıyı kopyala</AppDropdownItem>
                    </AppDropdownSubContent>
                  </AppDropdownSub>
                )}
                <AppDropdownSeparator />
                <AppDropdownGroup>
                  <AppDropdownGroupLabel inset={v.inset}>Sıralama</AppDropdownGroupLabel>
                  <AppDropdownRadioGroup value={sort()} onChange={setSort}>
                    <AppDropdownRadioItem value="new" biggerText={v.biggerText}>
                      En yeni
                    </AppDropdownRadioItem>
                    <AppDropdownRadioItem value="old" biggerText={v.biggerText}>
                      En eski
                    </AppDropdownRadioItem>
                  </AppDropdownRadioGroup>
                </AppDropdownGroup>
                <AppDropdownSeparator />
                <AppDropdownItem inset={v.inset} biggerText={v.biggerText} disabled>
                  <Archive /> Arşivle
                </AppDropdownItem>
                <AppDropdownItem inset={v.inset} biggerText={v.biggerText} variant="destructive">
                  <LogOut /> Çıkış yap
                </AppDropdownItem>
              </AppDropdownContent>
            </AppDropdown>
          )}
          code={(v) =>
            `<AppDropdown placement="${v.placement}">\n  <AppDropdownTrigger as={AppButton} variant="outline">Hesap</AppDropdownTrigger>\n  <AppDropdownContent class="w-56">\n${v.withLabel ? '    <AppDropdownLabel>polat.kaya@psb-tech.com</AppDropdownLabel>\n    <AppDropdownSeparator />\n' : ''}    <AppDropdownItem${v.biggerText ? ' biggerText' : ''}${v.inset ? ' inset' : ''}><User /> Profil${v.withShortcuts ? ' <AppDropdownShortcut>⇧⌘P</AppDropdownShortcut>' : ''}</AppDropdownItem>\n    <AppDropdownCheckboxItem checked={notify()} onChange={setNotify}>Bildirimler</AppDropdownCheckboxItem>\n${v.withSub ? '    <AppDropdownSub>\n      <AppDropdownSubTrigger><Share2 /> Paylaş</AppDropdownSubTrigger>\n      <AppDropdownSubContent>…</AppDropdownSubContent>\n    </AppDropdownSub>\n' : ''}    <AppDropdownSeparator />\n    <AppDropdownItem variant="destructive"><LogOut /> Çıkış yap</AppDropdownItem>\n  </AppDropdownContent>\n</AppDropdown>`
          }
        />
      </Block>
      <Block title="Common menus">
        <Preview>
          <Cell label="row actions (icon trigger)">
            <AppDropdown placement="bottom-end">
              <AppDropdownTrigger as={AppButton} variant="ghost" size="icon" aria-label="Daha fazla">
                <MoreHorizontal />
              </AppDropdownTrigger>
              <AppDropdownContent>
                <AppDropdownItem biggerText>
                  <Pencil /> Düzenle
                </AppDropdownItem>
                <AppDropdownItem biggerText>
                  <Copy /> Kopyala
                </AppDropdownItem>
                <AppDropdownSeparator />
                <AppDropdownItem biggerText variant="destructive">
                  <Trash2 /> Sil
                </AppDropdownItem>
              </AppDropdownContent>
            </AppDropdown>
          </Cell>
          <Cell label="sort (radio)">
            <AppDropdown>
              <AppDropdownTrigger as={AppButton} variant="secondary" size="sm" rightIcon={<ChevronDown />}>
                Sırala: {sort() === 'new' ? 'En yeni' : 'En eski'}
              </AppDropdownTrigger>
              <AppDropdownContent>
                <AppDropdownRadioGroup value={sort()} onChange={setSort}>
                  <AppDropdownRadioItem value="new">En yeni</AppDropdownRadioItem>
                  <AppDropdownRadioItem value="old">En eski</AppDropdownRadioItem>
                  <AppDropdownRadioItem value="salary">Maaşa göre</AppDropdownRadioItem>
                </AppDropdownRadioGroup>
              </AppDropdownContent>
            </AppDropdown>
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
