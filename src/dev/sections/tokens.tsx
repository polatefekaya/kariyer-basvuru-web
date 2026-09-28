import { For } from 'solid-js'
import { cn } from '@/lib/cn'
import { Block, DevSection, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'tokens', title: 'Design Tokens', group: 'Foundation' }

const colorGroups: { title: string; tokens: { name: string; bg: string; fg?: string }[] }[] = [
  {
    title: 'Base & surfaces',
    tokens: [
      { name: 'background', bg: 'bg-background', fg: 'text-foreground' },
      { name: 'card', bg: 'bg-card', fg: 'text-card-foreground' },
      { name: 'popover', bg: 'bg-popover', fg: 'text-popover-foreground' },
      { name: 'muted', bg: 'bg-muted', fg: 'text-muted-foreground' },
      { name: 'accent', bg: 'bg-accent', fg: 'text-accent-foreground' },
      { name: 'secondary', bg: 'bg-secondary', fg: 'text-secondary-foreground' },
      { name: 'border', bg: 'bg-border' },
      { name: 'input', bg: 'bg-input' },
      { name: 'ring', bg: 'bg-ring' },
    ],
  },
  {
    title: 'Brand',
    tokens: [
      { name: 'primary', bg: 'bg-primary', fg: 'text-primary-foreground' },
      { name: 'primary-hover', bg: 'bg-primary-hover', fg: 'text-primary-foreground' },
      { name: 'primary/10', bg: 'bg-primary/10', fg: 'text-primary' },
      { name: 'premium', bg: 'bg-premium', fg: 'text-premium-foreground' },
      { name: 'premium-muted', bg: 'bg-premium-muted', fg: 'text-premium' },
      { name: 'premium/15', bg: 'bg-premium/15', fg: 'text-premium' },
    ],
  },
  {
    title: 'Feedback',
    tokens: [
      { name: 'success', bg: 'bg-success', fg: 'text-success-foreground' },
      { name: 'success-subtle', bg: 'bg-success-subtle', fg: 'text-success-subtle-foreground' },
      { name: 'warning', bg: 'bg-warning', fg: 'text-warning-foreground' },
      { name: 'warning/15', bg: 'bg-warning/15', fg: 'text-warning' },
      { name: 'destructive', bg: 'bg-destructive', fg: 'text-destructive-foreground' },
      { name: 'destructive/10', bg: 'bg-destructive/10', fg: 'text-destructive' },
    ],
  },
]

const radii = ['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full']
// House rule: normal is the default; font-medium (500) is the boldest tier (titles / eyebrows only).
const weights = [
  ['font-normal', 400],
  ['font-medium', 500],
] as const
const textSizes = ['text-xs', 'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl']

function cssVar(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()
  return v || '—'
}

export function TokensSection() {
  return (
    <DevSection
      meta={meta}
      description="kariyer-zamani-web ile birebir aynı HSL değişkenleri. Tema değiştirince swatch'lar canlı güncellenir; alttaki değer :root / .dark üzerindeki ham HSL üçlüsüdür."
      imports="src/index.css → :root / .dark → @theme inline"
    >
      <For each={colorGroups}>
        {(g) => (
          <Block title={g.title}>
            <div class="grid grid-cols-2 gap-3 @sm:grid-cols-3 @lg:grid-cols-5">
              <For each={g.tokens}>
                {(t) => (
                  <div class="flex flex-col gap-1.5">
                    <div class={cn('flex h-16 items-end rounded-xl border border-border p-2', t.bg)}>
                      {t.fg && <span class={cn('text-xs', t.fg)}>Aa</span>}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs text-foreground">{t.name}</span>
                      <span class="text-xs text-muted-foreground">{cssVar(t.name.split('/')[0]!)}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Block>
        )}
      </For>

      <div class="grid gap-6">
        <Block
          title="Radius"
          description="Kural: ana yüzey/kontrol radius'u rounded-2xl; iç öğeler bir kademe küçük (xl → lg). rounded-full: segmented control, xs/sm buton, rozet, avatar, sekme pill'i."
        >
          <div class="flex flex-wrap gap-4">
            <For each={radii}>
              {(r) => (
                <div class="flex flex-col items-center gap-1.5">
                  <div class={cn('size-14 border border-primary/40 bg-primary/10', r)} />
                  <span class="text-xs text-muted-foreground">{r}</span>
                </div>
              )}
            </For>
          </div>
        </Block>
      </div>

      <Block
        title="Typography"
        description="Geist Variable (self-hosted). Kural: gövde metni font-normal; font-medium (500) en kalın kademe — yalnızca başlık ve eyebrow'larda. Türkçe karakterler: İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü"
      >
        <div class="grid gap-6 @lg:grid-cols-2">
          <div class="flex flex-col gap-2">
            <For each={textSizes}>
              {(s) => (
                <div class="flex items-baseline gap-3">
                  <span class="w-16 shrink-0 text-xs text-muted-foreground">{s}</span>
                  <span class={cn(s, 'truncate text-foreground')}>Kariyer Zamanı — İş ilanları</span>
                </div>
              )}
            </For>
          </div>
          <div class="flex flex-col gap-2">
            <For each={weights}>
              {([w, n]) => (
                <div class="flex items-baseline gap-3">
                  <span class="w-24 shrink-0 text-xs text-muted-foreground">
                    {w} · {n}
                  </span>
                  <span class={cn(w, 'text-base text-foreground')}>Şirket profilini güncelle</span>
                </div>
              )}
            </For>
            <div class="mt-3 flex flex-col gap-1 border-t border-border pt-3">
              <span class="text-xs font-medium text-muted-foreground">Section label ·</span>
              <span class="text-xs font-medium text-primary">Eyebrow · primary</span>
              <span class="font-mono text-xs text-muted-foreground">font-mono · 0123456789</span>
            </div>
          </div>
        </div>
      </Block>
    </DevSection>
  )
}
