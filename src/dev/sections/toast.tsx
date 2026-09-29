import { AppButton, toast, type AppToastVariant } from '@/components/ui'
import { Block, createKnobs, DevSection, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'toast', title: 'Toast', group: 'Overlays' }
const variants = ['default', 'success', 'error', 'warning', 'info', 'loading'] as const

export function ToastSection() {
  const knobs = createKnobs(
    {
      variant: { type: 'select', options: variants },
      title: { type: 'text' },
      description: { type: 'text' },
      duration: { type: 'number', min: 0, max: 15000, step: 500 },
      action: { type: 'boolean', label: 'action button' },
    },
    { variant: 'success', title: 'Değişiklikler kaydedildi', description: '', duration: 5000, action: false },
  )
  const fire = (v: typeof knobs.values) =>
    toast({
      title: v.title,
      description: v.description || undefined,
      variant: v.variant as AppToastVariant,
      duration: v.duration,
      action: v.action ? { label: 'Geri al', onClick: () => toast.info('Geri alındı') } : undefined,
    })

  return (
    <DevSection
      meta={meta}
      description="Kobalte Toast; <AppToaster /> kökte bir kez. toast('…'), toast.success/error/warning/info/loading, toast.promise, toast.dismiss. Sağa kaydırarak kapatılır; alt çizgi kalan süre."
      imports="import { AppToaster, toast } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          render={(v) => <AppButton onClick={() => fire(v)}>Toast göster</AppButton>}
          code={(v) =>
            `toast${v.variant === 'default' ? '' : '.' + v.variant}({\n  title: '${v.title}',${v.description ? `\n  description: '${v.description}',` : ''}${v.duration !== 5000 ? `\n  duration: ${v.duration},` : ''}${v.action ? `\n  action: { label: 'Geri al', onClick: () => … },` : ''}\n})`
          }
        />
      </Block>
      <Block title="Presets">
        <Preview>
          <AppButton variant="secondary" onClick={() => toast('Basit bildirim')}>
            string
          </AppButton>
          <AppButton
            variant="success"
            onClick={() =>
              toast.success({
                title: 'İlan yayınlandı',
                description: 'Arama sonuçlarında görünmesi birkaç dakika sürebilir.',
              })
            }
          >
            success
          </AppButton>
          <AppButton variant="danger" onClick={() => toast.error('Ödeme başarısız')}>
            error
          </AppButton>
          <AppButton variant="outline" onClick={() => toast.warning('Bağlantı zayıf')}>
            warning
          </AppButton>
          <AppButton
            variant="outline"
            onClick={() =>
              toast.info({
                title: 'Bilgi',
                description: 'İlanınız 3 gün içinde sona erecek.',
                action: { label: 'Uzat', onClick: () => toast.success('Uzatıldı') },
              })
            }
          >
            info + action
          </AppButton>
          <AppButton
            variant="outline"
            onClick={() => {
              const id = toast.loading('Yükleniyor…')
              setTimeout(() => toast.dismiss(id), 2500)
            }}
          >
            loading (2.5s)
          </AppButton>
          <AppButton
            variant="primaryOutline"
            onClick={() =>
              toast.promise(new Promise((r) => setTimeout(r, 1500)), {
                loading: 'Kaydediliyor…',
                success: 'Kaydedildi',
                error: 'Hata',
              })
            }
          >
            promise ✓
          </AppButton>
          <AppButton
            variant="primaryOutline"
            onClick={() =>
              toast
                .promise(new Promise((_, rej) => setTimeout(rej, 1500)), {
                  loading: 'Gönderiliyor…',
                  success: 'Gönderildi',
                  error: 'Gönderilemedi',
                })
                .catch(() => {})
            }
          >
            promise ✗
          </AppButton>
          <AppButton
            variant="ghost"
            onClick={() => toast({ title: 'Kalıcı', description: 'duration: 0', duration: 0 })}
          >
            persistent
          </AppButton>
          <AppButton variant="ghost" onClick={() => toast.dismiss()}>
            dismiss all
          </AppButton>
        </Preview>
      </Block>
    </DevSection>
  )
}
