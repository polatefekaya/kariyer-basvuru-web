import { Info } from 'lucide-solid'
import { AppBadge, AppButton, AppTooltip, AppTooltipContent, AppTooltipRoot, AppTooltipTrigger } from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'tooltip', title: 'AppTooltip', group: 'Overlays' }
const placements = ['top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end'] as const

export function TooltipSection() {
  const knobs = createKnobs(
    {
      content: { type: 'text' },
      placement: { type: 'select', options: placements },
      openDelay: { type: 'number', min: 0, max: 1500, step: 50 },
      gutter: { type: 'number', min: 0, max: 24, step: 1 },
      disabledTrigger: { type: 'boolean', label: 'disabled button' },
    },
    { content: 'Bu bir ipucu', placement: 'top', openDelay: 200, gutter: 8, disabledTrigger: false },
  )
  return (
    <DevSection
      meta={meta}
      description="Kobalte Tooltip. Kolay API: <AppTooltip content>…</AppTooltip> çocuğu span trigger'a sarar (disabled butonlarda da çalışır). Tam kontrol için AppTooltipRoot/Trigger/Content."
      imports="import { AppTooltip, AppTooltipRoot, AppTooltipTrigger, AppTooltipContent } from '@/components/ui'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          render={(v) => (
            <AppTooltip content={v.content} placement={v.placement} openDelay={v.openDelay} gutter={v.gutter}>
              <AppButton variant="secondary" disabled={v.disabledTrigger}>
                Üzerine gel
              </AppButton>
            </AppTooltip>
          )}
          code={(v) =>
            jsxSnippet(
              'AppTooltip',
              { content: v.content, placement: v.placement, openDelay: v.openDelay, gutter: v.gutter },
              {
                defaults: { placement: 'top', openDelay: 200, gutter: 8 },
                children: '<AppButton variant="secondary">Üzerine gel</AppButton>',
              },
            )
          }
        />
      </Block>
      <Block title="Placements & triggers">
        <Preview class="gap-6 py-10">
          <Cell label="top / bottom / left / right">
            <div class="flex gap-2">
              <AppTooltip content="top" placement="top">
                <AppButton size="sm" variant="outline">
                  T
                </AppButton>
              </AppTooltip>
              <AppTooltip content="bottom" placement="bottom">
                <AppButton size="sm" variant="outline">
                  B
                </AppButton>
              </AppTooltip>
              <AppTooltip content="left" placement="left">
                <AppButton size="sm" variant="outline">
                  L
                </AppButton>
              </AppTooltip>
              <AppTooltip content="right" placement="right">
                <AppButton size="sm" variant="outline">
                  R
                </AppButton>
              </AppTooltip>
            </div>
          </Cell>
          <Cell label="on icon / badge / text">
            <div class="flex items-center gap-3">
              <AppTooltip content="Bilgi: bu alan zorunludur">
                <Info class="size-4 text-muted-foreground" />
              </AppTooltip>
              <AppTooltip content="Vitrin ilanları 5× daha fazla görüntülenir">
                <AppBadge variant="premium">Vitrin</AppBadge>
              </AppTooltip>
              <AppTooltip content="2 saat 14 dk önce">
                <span class="text-xs text-muted-foreground underline decoration-dotted">2 saat önce</span>
              </AppTooltip>
            </div>
          </Cell>
          <Cell label="compound API (trigger is the button itself)">
            <AppTooltipRoot>
              <AppTooltipTrigger as={AppButton} variant="ghost">
                Compound
              </AppTooltipTrigger>
              <AppTooltipContent>Trigger doğrudan AppButton — ekstra span yok.</AppTooltipContent>
            </AppTooltipRoot>
          </Cell>
          <Cell label="rich content">
            <AppTooltip
              content={
                <div class="flex flex-col gap-1">
                  <b>Eşleşme: %82</b>
                  <span class="font-normal text-muted-foreground">Deneyim ✓ · Dil ✓ · Konum ✗</span>
                </div>
              }
            >
              <AppBadge variant="successSubtle" dot>
                %82 eşleşme
              </AppBadge>
            </AppTooltip>
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
