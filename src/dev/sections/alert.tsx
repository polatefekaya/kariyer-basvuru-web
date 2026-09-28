import { For } from 'solid-js'
import { Rocket } from 'lucide-solid'
import { AppAlert, AppButton, type AppAlertVariant } from '@/components/ui'
import { Block, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'alert', title: 'AppAlert', group: 'Feedback' }
const variants = ['info', 'success', 'warning', 'destructive', 'premium', 'neutral'] as const

export function AlertSection() {
  const knobs = createKnobs(
    {
      variant: { type: 'select', options: variants },
      title: { type: 'text' },
      description: { type: 'text' },
      dismissible: { type: 'boolean' },
      actions: { type: 'boolean' },
      customIcon: { type: 'boolean' },
      noIcon: { type: 'boolean' },
    },
    {
      variant: 'info',
      title: 'Profiliniz %62 tamamlandı',
      description: 'Eksik alanları doldurarak görünürlüğünüzü artırın.',
      dismissible: false,
      actions: true,
      customIcon: false,
      noIcon: false,
    },
  )
  return (
    <DevSection
      meta={meta}
      description="Satır içi callout. Varyant rengine göre subtle bg + border + ikon; role=alert (warning/destructive) veya status."
      imports="import { AppAlert } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <AppAlert
              variant={v.variant}
              title={v.title}
              description={v.description}
              dismissible={v.dismissible}
              icon={v.noIcon ? null : v.customIcon ? <Rocket /> : undefined}
              actions={
                v.actions ? (
                  <>
                    <AppButton size="sm">Tamamla</AppButton>
                    <AppButton size="sm" variant="ghost">
                      Sonra
                    </AppButton>
                  </>
                ) : undefined
              }
              class="max-w-xl"
            />
          )}
          code={(v) =>
            jsxSnippet(
              'AppAlert',
              {
                variant: v.variant,
                title: v.title,
                description: v.description,
                dismissible: v.dismissible,
                icon: v.noIcon ? '{null}' : v.customIcon ? '{<Rocket />}' : undefined,
                actions: v.actions ? '{<AppButton size="sm">Tamamla</AppButton>}' : undefined,
              },
              { defaults: { variant: 'info' } },
            ).replace(/"\{([^"]+)\}"/g, '{$1}')
          }
        />
      </Block>
      <Block title="All variants">
        <Preview align="stretch" class="grid grid-cols-1 @lg:grid-cols-2">
          <For each={variants}>
            {(v: AppAlertVariant) => (
              <AppAlert
                variant={v}
                title={`${v} — başlık`}
                description="Kısa açıklama metni burada yer alır."
                dismissible
              />
            )}
          </For>
          <AppAlert variant="success" title="Sadece başlık" />
          <AppAlert variant="destructive" description="Sadece açıklama, ikon yok." icon={null} />
        </Preview>
      </Block>
    </DevSection>
  )
}
