import { Match, Switch, type JSX } from 'solid-js'
import { useLocation } from '@solidjs/router'
import { Briefcase, LogOut, RefreshCw, Users } from 'lucide-solid'
import { KzLogo } from '@/components/brand/KzLogo'
import {
  AppShell,
  Sidebar,
  SidebarBrand,
  SidebarCloseButton,
  SidebarCollapseButton,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarNav,
  SidebarUserCard,
} from '@/components/layout'
import { AppButton, AppEmptyState, AppLoadingBlock } from '@/components/ui'
import { goToLogin, sessionState, signOut, useCurrentCompany, type PortalAccess } from '@/features/auth'
import { companyDisplayName } from '@/features/companies'
import config from '@/config/config'

const NAV = [
  {
    items: [
      { label: 'İlanlar', icon: Briefcase, href: '/' },
      // No separate Başvurular screen: applications live inside their candidate's row on /adaylar.
      { label: 'Adaylar', icon: Users, href: '/adaylar' },
    ],
  },
]

const BLOCKED: Record<Exclude<PortalAccess, 'ok' | 'loading'>, { title: string; description: string }> = {
  'signed-out': {
    title: 'Oturum açmanız gerekiyor',
    description: 'İşveren paneline erişmek için Kariyer Zamanı şirket hesabınızla giriş yapın.',
  },
  'wrong-account-type': {
    title: 'Bu panel şirket hesapları içindir',
    description: 'Aday hesabıyla giriş yaptınız. İş aramak için kariyerzamani.com adresini kullanın.',
  },
  incomplete: {
    title: 'Şirket kaydınız tamamlanmamış',
    description: 'İlanlarınızı yönetmeye başlamadan önce kariyerzamani.com üzerinde şirket kaydını tamamlayın.',
  },
  'not-approved': {
    title: 'Hesabınız onay bekliyor',
    description: 'Şirket hesabınız ekibimiz tarafından incelendikten sonra panele erişebileceksiniz.',
  },
  unreachable: {
    title: 'Şirket bilgileriniz alınamadı',
    description: 'Giriş yapıldı ama şirket profiliniz yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.',
  },
}

/** Full-screen "you can't be here" state; only `ok` renders the shell. */
function AccessScreen(props: { access: Exclude<PortalAccess, 'ok' | 'loading'>; onRetry?: () => void }) {
  const copy = () => BLOCKED[props.access]
  const signedIn = () => props.access !== 'signed-out'

  // Coming back from the auth hub with a session that could not be applied looks exactly like
  // never having signed in, which is maddening when you just did. Say what went wrong.
  const handoff = () => (props.access === 'signed-out' ? sessionState.handoffError : null)

  return (
    <div class="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6 py-12 text-foreground">
      <KzLogo class="size-12 text-primary" />
      <AppEmptyState
        variant="plain"
        size="lg"
        title={handoff() ? 'Oturum açılamadı' : copy().title}
        description={
          handoff()
            ? `Giriş yapıldı ama oturum bu panele aktarılamadı (${handoff()}). Tekrar giriş yapmayı deneyin.`
            : copy().description
        }
        actions={
          <Switch>
            <Match when={!signedIn()}>
              <AppButton onClick={goToLogin}>Giriş yap</AppButton>
            </Match>
            <Match when={props.access === 'unreachable'}>
              <AppButton leftIcon={<RefreshCw />} onClick={() => void props.onRetry?.()}>
                Tekrar dene
              </AppButton>
              <AppButton variant="outline" leftIcon={<LogOut />} onClick={() => void signOut()}>
                Çıkış yap
              </AppButton>
            </Match>
            <Match when={signedIn()}>
              <AppButton variant="outline" leftIcon={<LogOut />} onClick={() => void signOut()}>
                Çıkış yap
              </AppButton>
            </Match>
          </Switch>
        }
      />
    </div>
  )
}

/**
 * Router root: gates on the company access state, then wraps every page in the sidebar shell.
 * Pages render their own header inside `main`; the shell's top bar is hidden on desktop.
 */
export function AppLayout(props: { children?: JSX.Element }) {
  const company = useCurrentCompany()
  const location = useLocation()

  return (
    <Switch>
      <Match when={company.access() === 'loading'}>
        <div class="flex min-h-dvh items-center justify-center bg-background">
          <AppLoadingBlock label="Yükleniyor" />
        </div>
      </Match>
      <Match when={company.access() !== 'ok'}>
        <AccessScreen
          access={company.access() as Exclude<PortalAccess, 'ok' | 'loading'>}
          onRetry={() => void company.refetch()}
        />
      </Match>
      <Match when={company.access() === 'ok'}>
        <AppShell
          class="h-dvh"
          path={location.pathname}
          title={
            <span class="flex items-center gap-2 text-sm">
              <KzLogo class="size-5 text-primary" />
              Kariyer Zamanı
            </span>
          }
          topBarClass="lg:hidden"
          sidebar={
            <Sidebar>
              <SidebarHeader>
                <SidebarBrand mark={<KzLogo />} name="Kariyer Zamanı" subtitle="İşveren Paneli" href="/" />
                <SidebarCollapseButton />
                <SidebarCloseButton />
              </SidebarHeader>
              <SidebarContent>
                <SidebarNav groups={NAV} />
              </SidebarContent>
              <SidebarFooter>
                <SidebarUserCard
                  name={companyDisplayName(company.data!)}
                  subtitle={config.USE_MOCKS ? 'Örnek veri modu' : (company.data!.email ?? undefined)}
                  src={company.data!.photo_url}
                  onSignOut={() => void signOut()}
                />
              </SidebarFooter>
            </Sidebar>
          }
        >
          {props.children}
        </AppShell>
      </Match>
    </Switch>
  )
}
