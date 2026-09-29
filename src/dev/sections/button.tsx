import { For } from 'solid-js'
import { ArrowRight, Download, Plus, Trash2 } from 'lucide-solid'
import { AppButton, type AppButtonSize, type AppButtonVariant } from '@/components/ui'
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

export const meta: DevSectionMeta = { id: 'button', title: 'AppButton', group: 'Actions' }

const variants = [
  'primary',
  'secondary',
  'primaryOutline',
  'outline',
  'ghost',
  'link',
  'danger',
  'success',
  'premium',
] as const
const sizes = ['xs', 'sm', 'md', 'lg', 'icon', 'iconSm', 'iconLg'] as const
const textSizes = ['xs', 'sm', 'md', 'lg'] as const

export function ButtonSection() {
  const knobs = createKnobs(
    {
      variant: { type: 'select', options: variants },
      size: { type: 'select', options: sizes },
      children: { type: 'text', label: 'label' },
      leftIcon: { type: 'boolean' },
      rightIcon: { type: 'boolean' },
      loading: { type: 'boolean' },
      disabled: { type: 'boolean' },
      fullWidth: { type: 'boolean' },
    },
    {
      variant: 'primary',
      size: 'md',
      children: 'İlan Ver',
      leftIcon: false,
      rightIcon: false,
      loading: false,
      disabled: false,
      fullWidth: false,
    },
  )

  return (
    <DevSection
      meta={meta}
      description="9 semantik varyant, 7 boyut. Kobalte Button üzerine; `as` ile polimorfik (ör. as='a' href=…). Hover'da -translate-y-px, focus-visible ring, disabled'da not-allowed imleci."
      imports="import { AppButton, buttonClasses } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          render={(v) => (
            <AppButton
              variant={v.variant}
              size={v.size}
              loading={v.loading}
              disabled={v.disabled}
              fullWidth={v.fullWidth}
              leftIcon={v.leftIcon ? <Plus /> : undefined}
              rightIcon={v.rightIcon ? <ArrowRight /> : undefined}
              aria-label={v.size.startsWith('icon') ? v.children : undefined}
            >
              {v.size.startsWith('icon') ? <Plus /> : v.children}
            </AppButton>
          )}
          code={(v) =>
            jsxSnippet(
              'AppButton',
              {
                ...v,
                leftIcon: v.leftIcon ? '{<Plus />}' : undefined,
                rightIcon: v.rightIcon ? '{<ArrowRight />}' : undefined,
              },
              {
                defaults: knobs.defaults,
                omit: ['children'],
                children: v.size.startsWith('icon') ? '<Plus />' : v.children,
              },
            ).replace(/"\{(<[^"]+>)\}"/g, '{$1}')
          }
        />
      </Block>

      <Block title="Variant × Size">
        <Matrix
          rows={variants}
          cols={textSizes}
          rowLabel={(r) => r}
          colLabel={(c) => c}
          cell={(variant: AppButtonVariant, size: AppButtonSize) => (
            <AppButton variant={variant} size={size}>
              Başvur
            </AppButton>
          )}
        />
      </Block>

      <Block title="States" description="disabled · loading · ikonlu · icon-only · fullWidth · as='a'">
        <Preview align="start">
          <For each={variants}>
            {(v) => (
              <div class="flex flex-wrap items-center gap-2">
                <AppButton variant={v} disabled>
                  Disabled
                </AppButton>
                <AppButton variant={v} loading>
                  Loading
                </AppButton>
                <AppButton variant={v} leftIcon={<Download />}>
                  İndir
                </AppButton>
                <AppButton variant={v} rightIcon={<ArrowRight />}>
                  Devam
                </AppButton>
                <AppButton variant={v} size="iconSm" aria-label="Sil">
                  <Trash2 />
                </AppButton>
                <AppButton variant={v} size="icon" aria-label="Ekle">
                  <Plus />
                </AppButton>
                <AppButton variant={v} size="iconLg" aria-label="Ekle">
                  <Plus />
                </AppButton>
              </div>
            )}
          </For>
        </Preview>
        <Preview align="stretch" class="flex-col">
          <AppButton fullWidth>fullWidth</AppButton>
          <AppButton as="a" href="#button" variant="outline" rightIcon={<ArrowRight />}>
            as="a" href="#button"
          </AppButton>
        </Preview>
      </Block>

      <Block title="Composition" description="Modal footer, toolbar, split action gibi tipik kombinasyonlar.">
        <Preview align="start" class="flex-col items-stretch">
          <Cell label="modal footer">
            <div class="flex w-full justify-end gap-2">
              <AppButton variant="ghost">Vazgeç</AppButton>
              <AppButton variant="danger">Sil</AppButton>
            </div>
          </Cell>
          <Cell label="toolbar">
            <div class="flex flex-wrap gap-2">
              <AppButton size="sm" variant="secondary">
                Filtrele
              </AppButton>
              <AppButton size="sm" variant="secondary">
                Sırala
              </AppButton>
              <AppButton size="sm" variant="primaryOutline">
                Kaydet
              </AppButton>
              <AppButton size="sm" leftIcon={<Plus />}>
                Yeni
              </AppButton>
            </div>
          </Cell>
          <Cell label="cta">
            <div class="flex flex-wrap gap-2">
              <AppButton size="lg" variant="premium">
                Vitrin'e Taşı
              </AppButton>
              <AppButton size="lg" variant="outline">
                Daha sonra
              </AppButton>
            </div>
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
