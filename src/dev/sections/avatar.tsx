import { For } from 'solid-js'
import { Building2 } from 'lucide-solid'
import { AppAvatar, AppAvatarGroup, AppButton, type AppAvatarSize } from '@/components/ui'
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

export const meta: DevSectionMeta = { id: 'avatar', title: 'AppAvatar · AppAvatarGroup', group: 'Data display' }
const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
const kinds = ['image', 'initials', 'broken'] as const

export function AvatarSection() {
  const knobs = createKnobs(
    {
      source: { type: 'select', options: ['image', 'initials', 'broken', 'cdn-key'] },
      size: { type: 'select', options: sizes },
      shape: { type: 'select', options: ['circle', 'square'] },
      status: { type: 'select', options: ['none', 'online', 'offline', 'busy', 'away'] },
      name: { type: 'text' },
      surname: { type: 'text' },
      subtitle: { type: 'text' },
      hoverCard: { type: 'boolean', label: 'hoverCard (default card)' },
      interactive: { type: 'boolean' },
    },
    {
      source: 'image',
      size: 'lg',
      shape: 'circle',
      status: 'online',
      name: 'Polat',
      surname: 'Kaya',
      subtitle: 'Frontend Developer · PSB Tech',
      hoverCard: true,
      interactive: false,
    },
  )
  const src = (s: string) =>
    s === 'image'
      ? 'https://i.pravatar.cc/192?img=12'
      : s === 'broken'
        ? 'https://broken.example/x.png'
        : s === 'cdn-key'
          ? 'public/images/01HXP-avatar.png'
          : undefined
  const people = [
    { src: 'https://i.pravatar.cc/64?img=5', name: 'Ayşe', surname: 'Demir', subtitle: 'İK Uzmanı' },
    { name: 'Mehmet', surname: 'Yılmaz', subtitle: 'Backend Developer' },
    { src: 'https://i.pravatar.cc/64?img=32', name: 'Zeynep', subtitle: 'Ürün Yöneticisi' },
    { name: 'Can', surname: 'Öz', subtitle: 'Tasarımcı' },
    { name: 'Elif', subtitle: 'Veri Bilimci' },
    { name: 'Burak', surname: 'Kaya', subtitle: 'DevOps' },
  ]

  return (
    <DevSection
      meta={meta}
      description="src cdnImage üzerinden avatarın px boyutunda (24–96) + 2x srcset çözülür. Hata → baş harfler. hoverCard: üzerine gelince / odaklanınca bilgi kartı (varsayılan ad kartı ya da özel içerik). Grupta her avatar ve +N kartı açar."
      imports="import { AppAvatar, AppAvatarGroup } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          render={(v) => (
            <AppAvatar
              src={src(v.source)}
              name={v.name}
              surname={v.surname}
              subtitle={v.subtitle}
              size={v.size}
              shape={v.shape}
              status={v.status === 'none' ? undefined : v.status}
              hoverCard={v.hoverCard}
              interactive={v.interactive}
            />
          )}
          code={(v) =>
            jsxSnippet(
              'AppAvatar',
              {
                src: src(v.source),
                name: v.name,
                surname: v.surname,
                subtitle: v.subtitle,
                size: v.size,
                shape: v.shape,
                status: v.status === 'none' ? undefined : v.status,
                hoverCard: v.hoverCard,
                interactive: v.interactive,
              },
              { defaults: { size: 'md', shape: 'circle' } },
            )
          }
        />
      </Block>
      <Block title="Size × Source">
        <Matrix
          rows={kinds}
          cols={sizes}
          rowLabel={(r) => r}
          colLabel={(c) => c}
          cell={(kind, size: AppAvatarSize) => (
            <AppAvatar
              src={src(kind)}
              name="Polat"
              surname="Kaya"
              size={size}
              status={size === 'xs' ? undefined : 'online'}
            />
          )}
        />
      </Block>
      <Block title="Groups, shapes, statuses">
        <Preview align="start">
          <Cell label="AppAvatarGroup · hoverCards (hover any avatar or +N)">
            <div class="flex flex-col gap-4">
              <AppAvatarGroup items={people} max={3} size="xs" hoverCards />
              <AppAvatarGroup items={people} max={3} size="sm" hoverCards />
              <AppAvatarGroup items={people} max={4} size="md" hoverCards />
              <AppAvatarGroup items={people} max={5} size="lg" hoverCards />
            </div>
          </Cell>
          <Cell label="custom hoverCard content (the future profile preview)">
            <AppAvatar
              src="https://i.pravatar.cc/96?img=12"
              name="Mehmet"
              surname="Yılmaz"
              size="lg"
              status="online"
              hoverCard={() => (
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-3">
                    <AppAvatar src="https://i.pravatar.cc/96?img=12" name="Mehmet" surname="Yılmaz" size="lg" />
                    <div class="flex flex-col">
                      <span class="text-sm">Mehmet Yılmaz</span>
                      <span class="text-xs text-muted-foreground">Backend Developer · Ankara</span>
                    </div>
                  </div>
                  <p class="text-xs text-muted-foreground">3 ortak bağlantı · 12 başvuru · %82 eşleşme</p>
                  <AppButton size="sm" fullWidth>
                    Profili gör
                  </AppButton>
                </div>
              )}
            />
          </Cell>
          <Cell label="square (company logo)">
            <div class="flex items-center gap-2">
              <For each={sizes}>
                {(s) => <AppAvatar shape="square" name="PSB" size={s} fallbackIcon={<Building2 class="size-1/2" />} />}
              </For>
            </div>
          </Cell>
          <Cell label="status">
            <div class="flex items-center gap-2">
              <AppAvatar name="A" status="online" />
              <AppAvatar name="B" status="busy" />
              <AppAvatar name="C" status="away" />
              <AppAvatar name="D" status="offline" />
            </div>
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
