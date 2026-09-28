import { For } from 'solid-js'
import { ImageOff } from 'lucide-solid'
import { AppImage } from '@/components/ui'
import { cdnImage, cdnImageSrcSet, resolveMediaUrl } from '@/lib/mediaUrl'
import { imageCache } from '@/lib/imageCache'
import { AppButton } from '@/components/ui'
import {
  Block,
  Cell,
  CodeBlock,
  createKnobs,
  DevSection,
  jsxSnippet,
  Playground,
  Preview,
  type DevSectionMeta,
} from '../knobs'

export const meta: DevSectionMeta = { id: 'image', title: 'AppImage · CDN', group: 'Data display' }

const sources = {
  picsum: 'https://picsum.photos/seed/kz1/800/450',
  'cdn-key': 'public/images/01HXP123456789012345678901-avatar.png',
  legacy: 'images/legacy-uuid-photo.jpg',
  broken: 'https://broken.example/hero.png',
  empty: '',
} as const

export function ImageSection() {
  const knobs = createKnobs(
    {
      source: { type: 'select', options: Object.keys(sources) as (keyof typeof sources)[] },
      imgWidth: { type: 'number', min: 0, max: 1600, step: 32 },
      quality: { type: 'number', min: 0, max: 100, step: 1 },
      objectFit: { type: 'select', options: ['cover', 'contain', 'fill'] },
      rounded: { type: 'select', options: ['none', 'md', 'lg', 'xl', '2xl', 'full'] },
      aspectRatio: { type: 'text', placeholder: '16/9' },
      priority: { type: 'boolean' },
      customFallback: { type: 'boolean' },
    },
    {
      source: 'picsum',
      imgWidth: 320,
      quality: 0,
      objectFit: 'cover',
      rounded: 'xl',
      aspectRatio: '16/9',
      priority: false,
      customFallback: false,
    },
  )
  const srcOf = (k: keyof typeof sources) => sources[k] || null

  return (
    <DevSection
      meta={meta}
      description="src = saklanan yol / CDN anahtarı / URL. public/… → Cloudflare Image Transformations (format=auto, quality, snapped width, fit); eski yollar → API origin; mutlak URL passthrough. Hata → baş harf fallback, app-wide imageCache ile paylaşılır."
      imports="import { AppImage } from '@/components/ui' · import { cdnImage, cdnImageSrcSet, resolveMediaUrl } from '@/lib/mediaUrl'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          render={(v) => (
            <div class="flex w-full max-w-md flex-col gap-3">
              <AppImage
                src={srcOf(v.source)}
                alt="Ofis fotoğrafı"
                imgWidth={v.imgWidth || undefined}
                quality={v.quality || undefined}
                objectFit={v.objectFit}
                rounded={v.rounded}
                aspectRatio={v.aspectRatio || undefined}
                priority={v.priority}
                fallback={v.customFallback ? <ImageOff class="size-8" /> : undefined}
              />
              <div class="font-mono text-xs text-muted-foreground break-all">
                <div>
                  <b class="text-foreground">src → </b>
                  {cdnImage(srcOf(v.source), {
                    width: v.imgWidth || undefined,
                    quality: v.quality || undefined,
                    fit: v.objectFit === 'contain' ? 'contain' : 'cover',
                  }) ?? 'undefined'}
                </div>
                <div>
                  <b class="text-foreground">srcset → </b>
                  {cdnImageSrcSet(srcOf(v.source), {
                    width: v.imgWidth || undefined,
                    quality: v.quality || undefined,
                  }) ?? 'undefined'}
                </div>
              </div>
            </div>
          )}
          code={(v) =>
            jsxSnippet(
              'AppImage',
              {
                src: srcOf(v.source) ?? undefined,
                alt: 'Ofis fotoğrafı',
                imgWidth: v.imgWidth || undefined,
                quality: v.quality || undefined,
                objectFit: v.objectFit,
                rounded: v.rounded,
                aspectRatio: v.aspectRatio || undefined,
                priority: v.priority,
                fallback: v.customFallback ? '{<ImageOff />}' : undefined,
              },
              { defaults: { objectFit: 'cover', rounded: '2xl' } },
            ).replace(/"\{(<[^"]+>)\}"/g, '{$1}')
          }
        />
      </Block>
      <Block
        title="mediaUrl resolution"
        description="Aynı girdiler kariyer-zamani-web ile birebir aynı URL'i üretir (paylaşılan edge cache)."
      >
        <CodeBlock
          code={[
            ['cdnImage("public/images/…avatar.png", { width: 48 })', cdnImage(sources['cdn-key'], { width: 48 })],
            ['cdnImageSrcSet(…, { width: 48 })', cdnImageSrcSet(sources['cdn-key'], { width: 48 })],
            [
              'cdnImage("public/images/hero.jpg", { width: 1280, quality: 82, fit: "contain" })',
              cdnImage('public/images/hero.jpg', { width: 1280, quality: 82, fit: 'contain' }),
            ],
            ['cdnImage("public/images/hero.jpg")  // fluid', cdnImage('public/images/hero.jpg')],
            ['resolveMediaUrl("images/legacy.jpg")  // legacy → API', resolveMediaUrl('images/legacy.jpg')],
            [
              'cdnImage("https://picsum.photos/200", { width: 64 })  // passthrough',
              cdnImage('https://picsum.photos/200', { width: 64 }),
            ],
          ]
            .map(([a, b]) => `${a}\n  → ${b}`)
            .join('\n\n')}
        />
      </Block>
      <Block title="States">
        <Preview align="start">
          <For
            each={[
              { label: 'loaded (lazy)', src: sources.picsum },
              { label: 'priority', src: 'https://picsum.photos/seed/kz3/400/400', priority: true },
              { label: 'contain', src: 'https://picsum.photos/seed/kz4/300/500', fit: 'contain' as const },
              { label: 'cdn key → 404', src: sources['cdn-key'] },
              { label: 'broken url', src: sources.broken },
              { label: 'no src', src: null },
              { label: 'rounded-full', src: 'https://picsum.photos/seed/kz5/200/200', rounded: 'full' as const },
            ]}
          >
            {(s) => (
              <Cell label={s.label}>
                <AppImage
                  src={s.src}
                  alt="Örnek görsel"
                  width={112}
                  height={112}
                  imgWidth={112}
                  priority={s.priority}
                  objectFit={s.fit}
                  rounded={s.rounded}
                />
              </Cell>
            )}
          </For>
          <Cell label="cache">
            <AppButton size="sm" variant="outline" onClick={() => imageCache.clear()}>
              imageCache.clear()
            </AppButton>
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
