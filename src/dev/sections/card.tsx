import { MoreHorizontal, Sparkles } from 'lucide-solid'
import {
  AppBadge,
  AppButton,
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardFooter,
  AppCardHeader,
  AppCardTitle,
  AppProgress,
  AppSectionLabel,
  type AppCardPadding,
  type AppCardVariant,
} from '@/components/ui'
import { Block, createKnobs, DevSection, Matrix, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'card', title: 'AppCard', group: 'Data display' }
const variants = ['default', 'outline', 'ghost', 'muted', 'premium'] as const
const paddings = ['none', 'sm', 'md', 'lg'] as const

export function CardSection() {
  const knobs = createKnobs(
    {
      variant: { type: 'select', options: variants },
      padding: { type: 'select', options: paddings },
      interactive: { type: 'boolean' },
      header: { type: 'boolean' },
      divider: { type: 'boolean', label: 'header divider' },
      actions: { type: 'boolean', label: 'header actions' },
      footer: { type: 'boolean' },
    },
    {
      variant: 'default',
      padding: 'md',
      interactive: false,
      header: true,
      divider: false,
      actions: true,
      footer: true,
    },
  )
  return (
    <DevSection
      meta={meta}
      description="bg-card border rounded-2xl. Compound: Header (divider, actions) / Title / Description / Content / Footer. interactive → hover lift + focusable."
      imports="import { AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent, AppCardFooter, AppSectionLabel } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <AppCard variant={v.variant} padding={v.padding} interactive={v.interactive} class="max-w-md">
              {v.header && (
                <AppCardHeader
                  divider={v.divider}
                  actions={
                    v.actions ? (
                      <AppButton size="iconSm" variant="ghost" aria-label="Daha fazla">
                        <MoreHorizontal />
                      </AppButton>
                    ) : undefined
                  }
                >
                  <AppCardTitle>Başvuru Durumu</AppCardTitle>
                  <AppCardDescription>Son 30 gün</AppCardDescription>
                </AppCardHeader>
              )}
              <AppCardContent class={v.header && !v.divider ? 'mt-4' : ''}>
                <AppProgress label="Değerlendirilen" value={72} showValue variant="success" size="sm" />
                <AppProgress label="Bekleyen" value={18} showValue variant="warning" size="sm" />
              </AppCardContent>
              {v.footer && (
                <AppCardFooter class="justify-end">
                  <AppButton size="sm" variant="ghost">
                    Detay
                  </AppButton>
                  <AppButton size="sm">Rapor</AppButton>
                </AppCardFooter>
              )}
            </AppCard>
          )}
          code={(v) =>
            `<AppCard${v.variant !== 'default' ? ` variant="${v.variant}"` : ''}${v.padding !== 'md' ? ` padding="${v.padding}"` : ''}${v.interactive ? ' interactive' : ''}>\n${v.header ? `  <AppCardHeader${v.divider ? ' divider' : ''}${v.actions ? ' actions={<AppButton size="iconSm" variant="ghost"><MoreHorizontal /></AppButton>}' : ''}>\n    <AppCardTitle>Başvuru Durumu</AppCardTitle>\n    <AppCardDescription>Son 30 gün</AppCardDescription>\n  </AppCardHeader>\n` : ''}  <AppCardContent>…</AppCardContent>\n${v.footer ? '  <AppCardFooter>…</AppCardFooter>\n' : ''}</AppCard>`
          }
        />
      </Block>
      <Block title="Variant × Padding">
        <Matrix
          rows={variants}
          cols={paddings}
          rowLabel={(r) => r}
          colLabel={(c) => c}
          cell={(variant: AppCardVariant, padding: AppCardPadding) => (
            <AppCard variant={variant} padding={padding} class="w-36">
              <span class="text-xs">{variant}</span>
            </AppCard>
          )}
        />
      </Block>
      <Block title="Compositions">
        <Preview align="stretch" class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3">
          <AppCard interactive as="article">
            <div class="flex items-center justify-between">
              <AppBadge variant="premiumSubtle" size="sm" icon={<Sparkles />}>
                Vitrin
              </AppBadge>
              <span class="text-xs text-muted-foreground">2 saat önce</span>
            </div>
            <AppCardTitle class="mt-3 text-base">Senior Frontend Developer</AppCardTitle>
            <AppCardDescription>PSB Tech · İstanbul (Hibrit)</AppCardDescription>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <AppBadge variant="secondary" size="sm">
                React
              </AppBadge>
              <AppBadge variant="secondary" size="sm">
                TypeScript
              </AppBadge>
              <AppBadge variant="secondary" size="sm">
                Tam zamanlı
              </AppBadge>
            </div>
          </AppCard>
          <AppCard variant="premium">
            <AppCardHeader>
              <AppCardTitle class="flex items-center gap-2">
                <Sparkles class="size-4 text-premium" /> Vitrin'e taşı
              </AppCardTitle>
              <AppCardDescription>İlanınız arama sonuçlarında en üstte gösterilsin.</AppCardDescription>
            </AppCardHeader>
            <AppCardFooter class="border-premium/20">
              <AppButton variant="premium" size="sm" fullWidth>
                Paketi İncele
              </AppButton>
            </AppCardFooter>
          </AppCard>
          <div class="flex flex-col gap-2">
            <AppSectionLabel>İstatistikler</AppSectionLabel>
            <div class="grid grid-cols-2 gap-2">
              <AppCard variant="muted" padding="sm">
                <span class="text-2xl font-medium">128</span>
                <span class="text-xs text-muted-foreground">Başvuru</span>
              </AppCard>
              <AppCard variant="muted" padding="sm">
                <span class="text-2xl font-medium text-success dark:text-success-foreground">%82</span>
                <span class="text-xs text-muted-foreground">Eşleşme</span>
              </AppCard>
            </div>
          </div>
        </Preview>
      </Block>
    </DevSection>
  )
}
