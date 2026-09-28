import { Inbox, Plus, Search, Sparkles, Users } from 'lucide-solid'
import { AppBadge, AppButton, AppEmptyState, AppPageHeader, AppSegmentedControl, AppSeparator } from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = {
  id: 'layout',
  title: 'AppEmptyState · AppPageHeader · AppSeparator',
  group: 'Layout',
}

export function LayoutSection() {
  const es = createKnobs(
    {
      variant: { type: 'select', options: ['card', 'plain'] },
      size: { type: 'select', options: ['sm', 'md', 'lg'] },
      title: { type: 'text' },
      description: { type: 'text' },
      icon: { type: 'boolean' },
      actions: { type: 'boolean' },
    },
    {
      variant: 'card',
      size: 'md',
      title: 'Henüz başvuru yok',
      description: 'Yayınladığınız ilanlara gelen başvurular burada listelenecek.',
      icon: true,
      actions: true,
    },
  )
  const ph = createKnobs(
    {
      variant: { type: 'select', options: ['card', 'plain'] },
      title: { type: 'text' },
      description: { type: 'text' },
      badge: { type: 'boolean' },
      icon: { type: 'boolean' },
      actions: { type: 'boolean' },
      children: { type: 'boolean', label: 'children (filters)' },
    },
    {
      variant: 'card',
      title: 'Başvurular',
      description: '128 aday · son 30 gün',
      badge: true,
      icon: true,
      actions: true,
      children: true,
    },
  )
  return (
    <DevSection
      meta={meta}
      description="Sayfa iskelet yardımcıları."
      imports="import { AppEmptyState, AppPageHeader, AppSeparator } from '@/components/ui'"
    >
      <Block title="AppEmptyState playground">
        <Playground
          knobs={es}
          previewAlign="stretch"
          render={(v) => (
            <AppEmptyState
              variant={v.variant}
              size={v.size}
              title={v.title}
              description={v.description}
              icon={v.icon ? <Inbox /> : undefined}
              actions={
                v.actions ? (
                  <>
                    <AppButton leftIcon={<Plus />}>İlan Ver</AppButton>
                    <AppButton variant="ghost">Nasıl çalışır?</AppButton>
                  </>
                ) : undefined
              }
            />
          )}
          code={(v) =>
            jsxSnippet(
              'AppEmptyState',
              {
                ...v,
                icon: v.icon ? '{<Inbox />}' : undefined,
                actions: v.actions ? '{<AppButton>İlan Ver</AppButton>}' : undefined,
              },
              { defaults: { variant: 'card', size: 'md' } },
            ).replace(/"\{([^"]+)\}"/g, '{$1}')
          }
        />
      </Block>
      <Block title="AppPageHeader playground">
        <Playground
          knobs={ph}
          previewAlign="stretch"
          render={(v) => (
            <AppPageHeader
              variant={v.variant}
              title={v.title}
              description={v.description}
              badge={v.badge ? <AppBadge variant="primarySubtle">Yeni</AppBadge> : undefined}
              icon={v.icon ? <Users /> : undefined}
              actions={
                v.actions ? (
                  <>
                    <AppButton variant="outline" leftIcon={<Search />}>
                      Ara
                    </AppButton>
                    <AppButton leftIcon={<Plus />}>Yeni İlan</AppButton>
                  </>
                ) : undefined
              }
            >
              {v.children && (
                <AppSegmentedControl
                  value="all"
                  onChange={() => {}}
                  options={[
                    { value: 'all', label: 'Tümü' },
                    { value: 'new', label: 'Yeni' },
                    { value: 'shortlist', label: 'Kısa liste' },
                  ]}
                />
              )}
            </AppPageHeader>
          )}
          code={(v) =>
            jsxSnippet(
              'AppPageHeader',
              {
                variant: v.variant,
                title: v.title,
                description: v.description,
                badge: v.badge ? '{<AppBadge>Yeni</AppBadge>}' : undefined,
                icon: v.icon ? '{<Users />}' : undefined,
                actions: v.actions ? '{<AppButton>Yeni İlan</AppButton>}' : undefined,
              },
              { defaults: { variant: 'card' }, children: v.children ? '<AppSegmentedControl … />' : undefined },
            ).replace(/"\{([^"]+)\}"/g, '{$1}')
          }
        />
      </Block>
      <Block title="AppSeparator">
        <Preview align="stretch" class="flex-col">
          <Cell label="horizontal" class="[&>*]:w-full">
            <AppSeparator />
          </Cell>
          <Cell label="with label" class="[&>*]:w-full">
            <AppSeparator label="veya" />
          </Cell>
          <Cell label="vertical (in a flex row, h-8)">
            <div class="flex h-8 items-center gap-3 text-sm">
              <span>Ofis</span>
              <AppSeparator orientation="vertical" />
              <span>Hibrit</span>
              <AppSeparator orientation="vertical" />
              <span>Uzaktan</span>
            </div>
          </Cell>
          <Cell label="empty state, plain, sm, custom icon" class="[&>*]:w-full">
            <AppEmptyState
              variant="plain"
              size="sm"
              icon={<Sparkles />}
              title="Vitrin boş"
              description="Henüz öne çıkarılmış ilan yok."
            />
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
