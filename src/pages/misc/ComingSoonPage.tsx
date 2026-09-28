import { useLocation, useNavigate } from '@solidjs/router'
import { ArrowLeft, Construction } from 'lucide-solid'
import { AppButton, AppEmptyState } from '@/components/ui'

/** Placeholder for routes that exist in the nav but aren't built yet. */
export function ComingSoonPage(props: { title: string; description?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <div class="mx-auto flex w-full max-w-screen-2xl flex-col gap-6">
      <AppEmptyState
        icon={<Construction />}
        title={props.title}
        description={props.description ?? `${location.pathname} sayfası henüz hazır değil.`}
        actions={
          <AppButton variant="outline" leftIcon={<ArrowLeft />} onClick={() => navigate('/')}>
            İlanlara dön
          </AppButton>
        }
      />
    </div>
  )
}

export function NotFoundPage() {
  return (
    <ComingSoonPage title="Sayfa bulunamadı" description="Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir." />
  )
}
