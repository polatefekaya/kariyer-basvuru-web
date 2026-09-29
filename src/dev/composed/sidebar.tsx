import { createSignal, For } from 'solid-js'
import { BarChart3, Bell, Briefcase, CreditCard, FileText, LayoutDashboard, Plus, Settings, Users } from 'lucide-solid'
import { AppButton, AppCard, AppCardDescription, AppCardTitle, AppDropdownItem, toast } from '@/components/ui'
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
import { JobRow } from '@/components/jobs'
import { KzLogo } from '@/components/brand'
import { Block, createKnobs, DevSection, Playground, type DevSectionMeta } from '../knobs'
import { mockJobs } from '@/mocks/data'

export const meta: DevSectionMeta = { id: 'sidebar', title: 'AppShell · Sidebar', group: 'Layout' }

export function SidebarSection() {
  const knobs = createKnobs(
    {
      collapsed: { type: 'boolean' },
      frameHeight: { type: 'number', min: 400, max: 900, step: 20, label: 'frame height' },
      badges: { type: 'boolean' },
      topBar: { type: 'boolean', label: 'top bar' },
      subtitle: { type: 'boolean', label: 'brand subtitle' },
      breakpoint: { type: 'select', options: ['640', '768', '1024'], label: 'mobileBreakpoint' },
    },
    { collapsed: false, frameHeight: 640, badges: true, topBar: true, subtitle: true, breakpoint: '640' },
  )
  const [path, setPath] = createSignal('/ilanlar')
  const jobs = mockJobs(6)

  const groups = (badges: boolean) => [
    {
      items: [
        { label: 'Panel', icon: LayoutDashboard, href: '/', onClick: (e: MouseEvent) => nav(e, '/') },
        {
          label: 'İlanlar',
          icon: Briefcase,
          href: '/ilanlar',
          badge: badges ? 12 : undefined,
          onClick: (e: MouseEvent) => nav(e, '/ilanlar'),
        },
        {
          label: 'Başvurular',
          icon: FileText,
          href: '/basvurular',
          badge: badges ? 148 : undefined,
          onClick: (e: MouseEvent) => nav(e, '/basvurular'),
        },
        { label: 'Adaylar', icon: Users, href: '/adaylar', onClick: (e: MouseEvent) => nav(e, '/adaylar') },
      ],
    },
    {
      label: 'Şirket',
      items: [
        { label: 'Raporlar', icon: BarChart3, href: '/raporlar', onClick: (e: MouseEvent) => nav(e, '/raporlar') },
        {
          label: 'Bildirimler',
          icon: Bell,
          href: '/bildirimler',
          badge: badges ? 3 : undefined,
          onClick: (e: MouseEvent) => nav(e, '/bildirimler'),
        },
        { label: 'Abonelik', icon: CreditCard, href: '/abonelik', onClick: (e: MouseEvent) => nav(e, '/abonelik') },
        { label: 'Ayarlar', icon: Settings, href: '/ayarlar', disabled: true },
      ],
    },
  ]
  const nav = (e: MouseEvent, to: string) => {
    e.preventDefault()
    setPath(to)
  }

  return (
    <DevSection
      meta={meta}
      description="Kenar çubuğu: masaüstünde daraltılabilir ray (ikon + tooltip), mobilde çekmece (Kobalte Dialog). Alt kısımda kullanıcı kartı + menü. Genişlik ölçümü konteynere göre yapılır — viewport'u 768/400 yapınca çekmeceye döner. ⌘/Ctrl+B daraltır. Daraltma tercihi localStorage'da tutulur."
      imports="import { AppShell, Sidebar, SidebarHeader, SidebarBrand, SidebarCollapseButton, SidebarContent, SidebarNav, SidebarFooter, SidebarUserCard } from '@/components/layout'"
    >
      <Block title="Playground" description="Çerçeve transform'lu olduğu için çekmece (fixed) çerçevenin içinde kalır.">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <div
              class="w-full overflow-hidden rounded-2xl border border-border transform-gpu"
              style={{ height: `${v.frameHeight}px` }}
            >
              <AppShell
                collapsed={v.collapsed}
                onCollapsedChange={(c) => knobs.setValue('collapsed', c)}
                storageKey={null}
                mobileBreakpoint={Number(v.breakpoint)}
                path={path()}
                title={path() === '/ilanlar' ? 'İlanlar' : path()}
                actions={
                  <AppButton size="sm" leftIcon={<Plus />}>
                    Yeni İlan
                  </AppButton>
                }
                hideTopBar={!v.topBar}
                sidebar={
                  <Sidebar>
                    <SidebarHeader>
                      <SidebarBrand
                        mark={<KzLogo />}
                        name="Kariyer Zamanı"
                        subtitle={v.subtitle ? 'İşveren Paneli' : undefined}
                        href="/"
                      />
                      <SidebarCollapseButton />
                      <SidebarCloseButton />
                    </SidebarHeader>
                    <SidebarContent>
                      <SidebarNav groups={groups(v.badges)} />
                    </SidebarContent>
                    <SidebarFooter>
                      <SidebarUserCard
                        name="PSB Teknoloji"
                        subtitle="polat.kaya@psb-tech.com"
                        src="https://i.pravatar.cc/64?img=68"
                        onSignOut={() => toast.info('Çıkış yapıldı')}
                        menu={
                          <>
                            <AppDropdownItem biggerText onSelect={() => toast('Şirket ayarları')}>
                              <Settings /> Şirket ayarları
                            </AppDropdownItem>
                            <AppDropdownItem biggerText onSelect={() => toast('Abonelik')}>
                              <CreditCard /> Abonelik
                            </AppDropdownItem>
                          </>
                        }
                      />
                    </SidebarFooter>
                  </Sidebar>
                }
              >
                <div class="mx-auto flex max-w-4xl flex-col gap-4">
                  <AppCard>
                    <AppCardTitle>{path()}</AppCardTitle>
                    <AppCardDescription>İçerik alanı kendi başına kayar; kenar çubuğu sabit kalır.</AppCardDescription>
                  </AppCard>
                  <For each={jobs}>{(j) => <JobRow job={j} onOpen={() => toast.info(j.title)} />}</For>
                </div>
              </AppShell>
            </div>
          )}
          code={() =>
            `<AppShell\n  title="İlanlar"\n  actions={<AppButton size="sm">Yeni İlan</AppButton>}\n  sidebar={\n    <Sidebar>\n      <SidebarHeader>\n        <SidebarBrand mark={<KzLogo />} name="Kariyer Zamanı" subtitle="İşveren Paneli" href="/" />\n        <SidebarCollapseButton />\n        <SidebarCloseButton />\n      </SidebarHeader>\n      <SidebarContent>\n        <SidebarNav groups={[{ items: [{ label: 'İlanlar', icon: Briefcase, href: '/ilanlar', badge: 12 }, …] }]} />\n      </SidebarContent>\n      <SidebarFooter>\n        <SidebarUserCard name={company.company_name} subtitle={company.email} src={company.photo_url} onSignOut={signOut} />\n      </SidebarFooter>\n    </Sidebar>\n  }\n  class="h-dvh"\n>\n  <Outlet />\n</AppShell>`
          }
        />
      </Block>
    </DevSection>
  )
}
