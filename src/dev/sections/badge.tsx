import { For } from 'solid-js'
import { Check, Clock, Sparkles, X } from 'lucide-solid'
import { AppBadge, AppCountBadge, type AppBadgeVariant } from '@/components/ui'
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

export const meta: DevSectionMeta = { id: 'badge', title: 'AppBadge · AppCountBadge', group: 'Data display' }
const variants = [
  'primary',
  'primarySubtle',
  'secondary',
  'outline',
  'success',
  'successSubtle',
  'warning',
  'destructive',
  'destructiveSubtle',
  'premium',
  'premiumSubtle',
  'muted',
] as const
const sizes = ['sm', 'md', 'lg'] as const

export function BadgeSection() {
  const knobs = createKnobs(
    {
      variant: { type: 'select', options: variants },
      size: { type: 'select', options: sizes },
      children: { type: 'text', label: 'label' },
      dot: { type: 'boolean' },
      icon: { type: 'boolean' },
    },
    { variant: 'primarySubtle', size: 'md', children: 'Aktif', dot: false, icon: false },
  )
  const count = createKnobs(
    {
      count: { type: 'number', min: 0, max: 250, step: 1 },
      max: { type: 'number', min: 9, max: 999, step: 1 },
      variant: { type: 'select', options: variants },
    },
    { count: 12, max: 99, variant: 'primary' },
  )
  return (
    <DevSection
      meta={meta}
      description="rounded-full, font-normal; *Subtle varyantlar bg-x/10 + text-x. AppCountBadge: 0'da gizlenir, max üstünde '99+'."
      imports="import { AppBadge, AppCountBadge } from '@/components/ui'"
    >
      <Block title="AppBadge playground">
        <Playground
          knobs={knobs}
          render={(v) => (
            <AppBadge variant={v.variant} size={v.size} dot={v.dot} icon={v.icon ? <Sparkles /> : undefined}>
              {v.children}
            </AppBadge>
          )}
          code={(v) =>
            jsxSnippet(
              'AppBadge',
              { ...v, icon: v.icon ? '{<Sparkles />}' : undefined },
              { defaults: { variant: 'primarySubtle', size: 'md' }, omit: ['children'], children: v.children },
            ).replace(/"\{(<[^"]+>)\}"/g, '{$1}')
          }
        />
      </Block>
      <Block title="AppCountBadge playground">
        <Playground
          knobs={count}
          render={(v) => <AppCountBadge count={v.count} max={v.max} variant={v.variant} />}
          code={(v) => jsxSnippet('AppCountBadge', v, { defaults: { max: 99, variant: 'primary' } })}
        />
      </Block>
      <Block title="Variant × Size">
        <Matrix
          rows={variants}
          cols={sizes}
          rowLabel={(r) => r}
          colLabel={(c) => c}
          cell={(variant: AppBadgeVariant, size) => (
            <AppBadge variant={variant} size={size}>
              {variant}
            </AppBadge>
          )}
        />
      </Block>
      <Block title="With dot / icon">
        <Preview align="start">
          <Cell label="status dots">
            <div class="flex flex-wrap gap-2">
              <AppBadge variant="successSubtle" dot>
                Aktif
              </AppBadge>
              <AppBadge variant="warning" dot>
                Beklemede
              </AppBadge>
              <AppBadge variant="destructiveSubtle" dot>
                Süresi doldu
              </AppBadge>
              <AppBadge variant="muted" dot>
                Taslak
              </AppBadge>
            </div>
          </Cell>
          <Cell label="icons">
            <div class="flex flex-wrap gap-2">
              <AppBadge variant="success" icon={<Check />}>
                Onaylandı
              </AppBadge>
              <AppBadge variant="destructive" icon={<X />}>
                Reddedildi
              </AppBadge>
              <AppBadge variant="primarySubtle" icon={<Clock />}>
                2 gün
              </AppBadge>
              <AppBadge variant="premium" icon={<Sparkles />}>
                Vitrin
              </AppBadge>
            </div>
          </Cell>
          <Cell label="counts">
            <div class="flex items-center gap-2">
              <For each={[0, 1, 12, 99, 100, 1000]}>{(n) => <AppCountBadge count={n} />}</For>
              <AppCountBadge count={5} variant="destructive" />
              <AppCountBadge count={5} variant="primarySubtle" />
            </div>
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
