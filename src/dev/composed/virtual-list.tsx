import { createMemo, createSignal, For } from 'solid-js'
import {
  AppAvatar,
  AppBadge,
  AppButton,
  AppEmptyState,
  AppInput,
  AppVirtualList,
  type AppVirtualListApi,
} from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, Playground, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'virtual-list', title: 'AppVirtualList', group: 'Lists' }

type Row = { id: number; name: string; lines: number }
const names = [
  'Ayşe Demir',
  'Mehmet Yılmaz',
  'Zeynep Kaya',
  'Can Öz',
  'Elif Şahin',
  'Burak Çelik',
  'Deniz Arslan',
  'Selin Aydın',
]
const makeRows = (n: number, offset = 0): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    id: offset + i,
    name: names[(offset + i) % names.length]!,
    lines: 1 + ((offset + i) % 4),
  }))

export function VirtualListSection() {
  const knobs = createKnobs(
    {
      count: { type: 'number', min: 0, max: 100000, step: 1000 },
      height: { type: 'number', min: 200, max: 800, step: 40 },
      gap: { type: 'number', min: 0, max: 24, step: 4 },
      overscan: { type: 'number', min: 0, max: 30, step: 1 },
      loading: { type: 'boolean' },
      header: { type: 'boolean' },
    },
    { count: 10000, height: 440, gap: 8, overscan: 6, loading: false, header: true },
  )
  const rows = createMemo(() => makeRows(knobs.values.count))
  let api: AppVirtualListApi | undefined
  const [jump, setJump] = createSignal('5000')

  // Infinite loading demo
  const [pages, setPages] = createSignal(makeRows(40))
  const [loadingMore, setLoadingMore] = createSignal(false)
  const loadMore = () => {
    if (loadingMore() || pages().length >= 400) return
    setLoadingMore(true)
    setTimeout(() => {
      setPages((p) => [...p, ...makeRows(40, p.length)])
      setLoadingMore(false)
    }, 700)
  }

  const renderRow = (r: Row) => (
    <div class="flex items-start gap-3 rounded-2xl border border-border bg-card p-3">
      <AppAvatar name={r.name.split(' ')[0]} surname={r.name.split(' ')[1]} size="sm" />
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="flex items-center gap-2 text-sm">
          <span class="truncate">{r.name}</span>
          <AppBadge variant="muted" size="sm">
            #{r.id}
          </AppBadge>
        </div>
        <For each={Array.from({ length: r.lines })}>
          {() => (
            <p class="text-xs text-muted-foreground">Satır yüksekliği değişken — ölçüm ResizeObserver ile yapılır.</p>
          )}
        </For>
      </div>
    </div>
  )

  return (
    <DevSection
      meta={meta}
      description="Virtuoso muadili: @tanstack/solid-virtual üzerine. Satır yükseklikleri gerçek DOM'dan ölçülür (dinamik), kendi scroll kabı ya da window; header/footer, boş/yükleniyor durumları, onEndReached ile sonsuz yükleme, scrollToIndex API'si."
      imports="import { AppVirtualList } from '@/components/ui'"
    >
      <Block title="Playground" description="10.000+ satır, değişken yükseklik. Sadece görünür satırlar DOM'da.">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <div class="flex w-full flex-col gap-3">
              <div class="flex flex-wrap items-center gap-2">
                <AppInput placeholder="index" value={jump()} onChange={setJump} class="w-32" inputClass="h-8" />
                <AppButton
                  size="sm"
                  variant="secondary"
                  onClick={() => api?.scrollToIndex(Number(jump()) || 0, { align: 'start' })}
                >
                  scrollToIndex
                </AppButton>
                <AppButton size="sm" variant="ghost" onClick={() => api?.scrollToTop()}>
                  Başa dön
                </AppButton>
              </div>
              <AppVirtualList
                items={rows()}
                itemKey={(r) => r.id}
                estimateSize={72}
                gap={v.gap}
                overscan={v.overscan}
                height={v.height}
                loading={v.loading}
                api={(a) => (api = a)}
                class="rounded-2xl border border-border bg-background p-2"
                header={
                  v.header ? (
                    <div class="mb-2 px-1 text-xs text-muted-foreground">
                      {rows().length.toLocaleString('tr-TR')} kayıt
                    </div>
                  ) : undefined
                }
                empty={
                  <AppEmptyState
                    variant="plain"
                    size="sm"
                    title="Kayıt yok"
                    description="count knob'unu 0 yapınca görünür."
                  />
                }
                renderItem={renderRow}
              />
            </div>
          )}
          code={(v) =>
            `<AppVirtualList\n  items={rows()}\n  itemKey={(r) => r.id}\n  estimateSize={72}${v.gap ? `\n  gap={${v.gap}}` : ''}${v.overscan !== 6 ? `\n  overscan={${v.overscan}}` : ''}\n  height={${v.height}}${v.loading ? '\n  loading' : ''}${v.header ? '\n  header={<Header />}' : ''}\n  empty={<AppEmptyState … />}\n  renderItem={(r) => <Row {...r} />}\n/>`
          }
        />
      </Block>

      <Block
        title="Infinite loading"
        description="onEndReached son 5 satır görünür olunca bir kez tetiklenir; loadingMore alt spinner gösterir."
      >
        <div class="grid gap-4 @lg:grid-cols-2">
          <Cell label={`onEndReached · ${pages().length} / 400 satır`} class="[&>*]:w-full">
            <AppVirtualList
              items={pages()}
              itemKey={(r) => r.id}
              estimateSize={72}
              gap={8}
              height={360}
              loadingMore={loadingMore()}
              onEndReached={loadMore}
              class="rounded-2xl border border-border p-2"
              renderItem={renderRow}
            />
          </Cell>
          <Cell label="loading (skeleton rows)" class="[&>*]:w-full">
            <AppVirtualList
              items={[] as Row[]}
              estimateSize={72}
              gap={8}
              height={360}
              loading
              loadingRows={5}
              class="rounded-2xl border border-border p-2"
              renderItem={renderRow}
            />
          </Cell>
        </div>
      </Block>
    </DevSection>
  )
}
