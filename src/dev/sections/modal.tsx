import { createSignal, For } from 'solid-js'
import {
  AppButton,
  AppInput,
  AppModal,
  AppModalClose,
  AppModalContent,
  AppModalDescription,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
  AppModalTrigger,
  AppTextArea,
  toast,
  type AppModalSize,
} from '@/components/ui'
import { Block, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'modal', title: 'AppModal', group: 'Overlays' }
const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const

export function ModalSection() {
  const knobs = createKnobs(
    {
      size: { type: 'select', options: sizes },
      hideClose: { type: 'boolean' },
      title: { type: 'text' },
      description: { type: 'text' },
      form: { type: 'boolean', label: 'with form' },
      longContent: { type: 'boolean', label: 'long content (scroll)' },
    },
    {
      size: 'md',
      hideClose: false,
      title: 'Başvuruyu geri çek',
      description: 'Bu işlem geri alınamaz. İlan sahibi bilgilendirilecek.',
      form: true,
      longContent: false,
    },
  )
  const [open, setOpen] = createSignal(false)

  return (
    <DevSection
      meta={meta}
      description="Kobalte Dialog: mobilde tam ekran sheet, ≥sm ortalanmış kart (max-h 90vh, scroll). Overlay bg-background/80 + blur. Escape / dışarı tık kapatır, odak trigger'a döner."
      imports="import { AppModal, AppModalTrigger, AppModalContent, AppModalHeader, AppModalTitle, AppModalDescription, AppModalFooter, AppModalClose } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          render={(v) => (
            <AppModal>
              <AppModalTrigger as={AppButton} variant="primaryOutline">
                Modal aç ({v.size})
              </AppModalTrigger>
              <AppModalContent size={v.size} hideClose={v.hideClose}>
                <AppModalHeader>
                  <AppModalTitle>{v.title}</AppModalTitle>
                  <AppModalDescription>{v.description}</AppModalDescription>
                </AppModalHeader>
                {v.form && (
                  <div class="flex flex-col gap-4">
                    <AppInput label="E-posta" placeholder="ornek@site.com" />
                    <AppTextArea label="Sebep (isteğe bağlı)" placeholder="Kısaca açıklayın" rows={3} />
                  </div>
                )}
                {v.longContent && (
                  <div class="flex flex-col gap-3 text-sm text-muted-foreground">
                    <For each={Array.from({ length: 14 })}>
                      {() => (
                        <p>
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Kariyer Zamanı platformunda
                          ilanlarınızı yönetin, başvuruları değerlendirin.
                        </p>
                      )}
                    </For>
                  </div>
                )}
                <AppModalFooter>
                  <AppModalClose as={AppButton} variant="ghost">
                    Vazgeç
                  </AppModalClose>
                  <AppModalClose as={AppButton} variant="danger" onClick={() => toast.error('Başvuru geri çekildi')}>
                    Geri çek
                  </AppModalClose>
                </AppModalFooter>
              </AppModalContent>
            </AppModal>
          )}
          code={(v) =>
            `<AppModal>\n  <AppModalTrigger as={AppButton}>Aç</AppModalTrigger>\n  ${jsxSnippet(
              'AppModalContent',
              { size: v.size, hideClose: v.hideClose },
              { defaults: { size: 'md' }, children: '' },
            ).replace(
              '></AppModalContent>',
              '>',
            )}\n    <AppModalHeader>\n      <AppModalTitle>${v.title}</AppModalTitle>\n      <AppModalDescription>${v.description}</AppModalDescription>\n    </AppModalHeader>\n    …\n    <AppModalFooter>\n      <AppModalClose as={AppButton} variant="ghost">Vazgeç</AppModalClose>\n      <AppButton>Onayla</AppButton>\n    </AppModalFooter>\n  </AppModalContent>\n</AppModal>`
          }
        />
      </Block>
      <Block title="Controlled + sizes">
        <Preview>
          <AppButton variant="outline" onClick={() => setOpen(true)}>
            Controlled (open signal)
          </AppButton>
          <AppModal open={open()} onOpenChange={setOpen}>
            <AppModalContent size="sm">
              <AppModalHeader>
                <AppModalTitle>Kontrollü modal</AppModalTitle>
                <AppModalDescription>open / onOpenChange ile dışarıdan yönetiliyor.</AppModalDescription>
              </AppModalHeader>
              <AppModalFooter>
                <AppButton onClick={() => setOpen(false)}>Tamam</AppButton>
              </AppModalFooter>
            </AppModalContent>
          </AppModal>
          <For each={sizes}>
            {(s: AppModalSize) => (
              <AppModal>
                <AppModalTrigger as={AppButton} variant="secondary" size="sm">
                  {s}
                </AppModalTrigger>
                <AppModalContent size={s}>
                  <AppModalHeader>
                    <AppModalTitle>size="{s}"</AppModalTitle>
                    <AppModalDescription>Genişliği görmek için.</AppModalDescription>
                  </AppModalHeader>
                  <AppModalFooter>
                    <AppModalClose as={AppButton}>Kapat</AppModalClose>
                  </AppModalFooter>
                </AppModalContent>
              </AppModal>
            )}
          </For>
        </Preview>
      </Block>
    </DevSection>
  )
}
