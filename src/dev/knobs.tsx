import { For, Show, Switch, Match, type JSX } from 'solid-js'
import { createStore, type SetStoreFunction } from 'solid-js/store'
import { Copy, RotateCcw } from 'lucide-solid'
import { cn } from '@/lib/cn'
import { AppButton, AppInput, AppSelect, AppSlider, AppSwitch, toast } from '@/components/ui'
import { devSettings, surfaceClasses } from './settings'

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------
export type KnobDef =
  | { type: 'select'; options: readonly string[]; label?: string }
  | { type: 'boolean'; label?: string }
  | { type: 'text'; label?: string; placeholder?: string }
  | { type: 'number'; min?: number; max?: number; step?: number; label?: string }

export type KnobSchema = Record<string, KnobDef>

type KnobValue<K extends KnobDef> = K extends { type: 'select'; options: readonly (infer O)[] }
  ? O
  : K extends { type: 'boolean' }
    ? boolean
    : K extends { type: 'number' }
      ? number
      : string

export type KnobValues<S extends KnobSchema> = { [K in keyof S]: KnobValue<S[K]> }

export interface Knobs<S extends KnobSchema> {
  schema: S
  defaults: KnobValues<S>
  values: KnobValues<S>
  set: SetStoreFunction<KnobValues<S>>
  /** Typed single-key setter (the store setter's path overloads don't infer through `const S`). */
  setValue: <K extends keyof S & string>(key: K, value: KnobValues<S>[K]) => void
  reset: () => void
}

export function createKnobs<const S extends KnobSchema>(schema: S, defaults: KnobValues<S>): Knobs<S> {
  const [values, set] = createStore<KnobValues<S>>({ ...defaults })
  const setValue = (key: string, value: unknown) => (set as unknown as (k: string, v: unknown) => void)(key, value)
  return { schema, defaults, values, set, setValue, reset: () => set({ ...defaults } as KnobValues<S>) }
}

// ----------------------------------------------------------------------------
// JSX snippet generator
// ----------------------------------------------------------------------------
export function jsxSnippet(
  tag: string,
  props: Record<string, unknown>,
  opts: { defaults?: Record<string, unknown>; children?: string; omit?: readonly string[] } = {},
) {
  const attrs = Object.entries(props)
    .filter(
      ([k, v]) => !opts.omit?.includes(k) && v !== undefined && v !== '' && v !== false && v !== opts.defaults?.[k],
    )
    .map(([k, v]) => (typeof v === 'string' ? `${k}="${v}"` : v === true ? k : `${k}={${JSON.stringify(v)}}`))
  const multiline = attrs.length > 3
  const open = multiline ? `<${tag}\n  ${attrs.join('\n  ')}\n` : `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}`
  if (opts.children == null) return `${open}${multiline ? '' : ' '}/>`
  return `${open}>${multiline ? '\n  ' : ''}${opts.children}${multiline ? '\n' : ''}</${tag}>`
}

// ----------------------------------------------------------------------------
// UI
// ----------------------------------------------------------------------------
function KnobPanel<S extends KnobSchema>(props: { knobs: Knobs<S> }) {
  const entries = () => Object.entries(props.knobs.schema) as [keyof S & string, KnobDef][]
  const setAny = (k: string, v: unknown) => (props.knobs.set as unknown as (k: string, v: unknown) => void)(k, v)
  const label = (k: string, d: KnobDef) => d.label ?? k

  return (
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-muted-foreground">Props</span>
        <AppButton size="xs" variant="ghost" leftIcon={<RotateCcw />} onClick={props.knobs.reset}>
          Sıfırla
        </AppButton>
      </div>
      <For each={entries()}>
        {([key, def]) => (
          <Switch>
            <Match when={def.type === 'select' && def}>
              {(d) => (
                <AppSelect
                  label={label(key, d())}
                  options={[...d().options]}
                  value={String(props.knobs.values[key])}
                  onChange={(v) => setAny(key, v)}
                />
              )}
            </Match>
            <Match when={def.type === 'boolean' && def}>
              {(d) => (
                <AppSwitch
                  size="sm"
                  label={label(key, d())}
                  checked={Boolean(props.knobs.values[key])}
                  onChange={(v) => setAny(key, v)}
                />
              )}
            </Match>
            <Match when={def.type === 'text' && def}>
              {(d) => (
                <AppInput
                  label={label(key, d())}
                  placeholder={d().placeholder}
                  value={String(props.knobs.values[key] ?? '')}
                  onChange={(v) => setAny(key, v)}
                />
              )}
            </Match>
            <Match when={def.type === 'number' && def}>
              {(d) => (
                <AppSlider
                  label={label(key, d())}
                  min={d().min}
                  max={d().max}
                  step={d().step}
                  showInput
                  value={Number(props.knobs.values[key])}
                  onChange={(v) => setAny(key, v)}
                />
              )}
            </Match>
          </Switch>
        )}
      </For>
    </div>
  )
}

export function CodeBlock(props: { code: string; class?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.code)
      toast.success('Kopyalandı')
    } catch {
      toast.error('Panoya kopyalanamadı')
    }
  }
  return (
    <div class={cn('group relative overflow-hidden rounded-2xl border border-border bg-muted/40', props.class)}>
      <pre class="overflow-x-auto p-4 font-mono text-xs text-foreground">{props.code}</pre>
      <AppButton
        size="iconSm"
        variant="ghost"
        aria-label="Kopyala"
        onClick={copy}
        class="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Copy />
      </AppButton>
    </div>
  )
}

/** Preview surface that follows the global toolbar (surface colour, outlines). */
export function Preview(props: { children: JSX.Element; class?: string; align?: 'center' | 'start' | 'stretch' }) {
  return (
    <div
      class={cn(
        'flex min-h-40 w-full flex-wrap gap-4 rounded-2xl border border-border p-6 transition-colors',
        surfaceClasses[devSettings.surface],
        (props.align ?? 'center') === 'center' && 'items-center justify-center',
        props.align === 'start' && 'items-start justify-start',
        props.align === 'stretch' && 'items-stretch',
        devSettings.outlines && '[&_>*]:outline [&_>*]:outline-1 [&_>*]:outline-dashed [&_>*]:outline-primary/40',
        props.class,
      )}
    >
      {props.children}
    </div>
  )
}

/**
 * Playground = knob panel + live preview + generated snippet.
 * `render` receives the reactive values; `code` returns the JSX string for them.
 */
export function Playground<S extends KnobSchema>(props: {
  knobs: Knobs<S>
  render: (v: KnobValues<S>) => JSX.Element
  code: (v: KnobValues<S>) => string
  previewAlign?: 'center' | 'start' | 'stretch'
}) {
  return (
    <div class="grid gap-4 @lg:grid-cols-[1fr_260px]">
      <div class="flex min-w-0 flex-col gap-3">
        <Preview align={props.previewAlign}>{props.render(props.knobs.values)}</Preview>
        <CodeBlock code={props.code(props.knobs.values)} />
      </div>
      <aside class="rounded-2xl border border-border bg-card p-4">
        <KnobPanel knobs={props.knobs} />
      </aside>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Section scaffolding
// ----------------------------------------------------------------------------
export interface DevSectionMeta {
  id: string
  title: string
  group: string
}

export function DevSection(props: {
  meta: DevSectionMeta
  description?: JSX.Element
  imports?: string
  children: JSX.Element
}) {
  return (
    <section id={props.meta.id} class="flex scroll-mt-24 flex-col gap-6">
      <header class="flex flex-col gap-2 border-b border-border pb-4">
        <div class="flex items-baseline gap-3">
          <h2 class="text-xl font-medium text-foreground">{props.meta.title}</h2>
          <span class="text-xs font-medium text-muted-foreground">{props.meta.group}</span>
        </div>
        <Show when={props.description}>
          <p class="max-w-2xl text-sm text-muted-foreground">{props.description}</p>
        </Show>
        <Show when={props.imports}>
          <code class="w-fit rounded-lg bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
            {props.imports}
          </code>
        </Show>
      </header>
      {props.children}
    </section>
  )
}

export function Block(props: { title: string; description?: string; children: JSX.Element; class?: string }) {
  return (
    <div class={cn('flex flex-col gap-3', props.class)}>
      <div>
        <h3 class="text-sm font-medium text-foreground">{props.title}</h3>
        <Show when={props.description}>
          <p class="text-xs text-muted-foreground">{props.description}</p>
        </Show>
      </div>
      {props.children}
    </div>
  )
}

/** Labelled cell for matrices. */
export function Cell(props: { label: string; children: JSX.Element; class?: string }) {
  return (
    <div class={cn('flex flex-col items-start gap-2', props.class)}>
      <span class="text-xs text-muted-foreground">{props.label}</span>
      {props.children}
    </div>
  )
}

/** Matrix grid: rows × cols with a header row and row labels. */
export function Matrix<R, C>(props: {
  rows: readonly R[]
  cols: readonly C[]
  rowLabel: (r: R) => string
  colLabel: (c: C) => string
  cell: (r: R, c: C) => JSX.Element
}) {
  return (
    <div class={cn('overflow-x-auto rounded-2xl border border-border p-4', surfaceClasses[devSettings.surface])}>
      <table class="w-full border-separate border-spacing-x-4 border-spacing-y-3">
        <thead>
          <tr>
            <th />
            <For each={props.cols}>
              {(c) => <th class="text-left text-xs text-muted-foreground">{props.colLabel(c)}</th>}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {(r) => (
              <tr>
                <th class="whitespace-nowrap pr-2 text-left text-xs text-muted-foreground">{props.rowLabel(r)}</th>
                <For each={props.cols}>{(c) => <td class="align-middle">{props.cell(r, c)}</td>}</For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}
