import { createSignal, For, onCleanup, onMount, Show, type Component } from 'solid-js'
import { Monitor, Moon, Smartphone, Sun, SunMoon, Tablet } from 'lucide-solid'
import { cn } from '@/lib/cn'
import { setTheme, theme } from '@/lib/theme'
import { AppSegmentedControl, AppSelect, AppSwitch, focusRingClass } from '@/components/ui'
import { devSettings, setDevSettings, viewportWidths, type Surface, type Viewport } from './settings'
import type { DevSectionMeta } from './knobs'

import * as tokens from './sections/tokens'
import * as button from './sections/button'
import * as inputs from './sections/inputs'
import * as select from './sections/select'
import * as toggles from './sections/toggles'
import * as segmented from './sections/segmented'
import * as slider from './sections/slider'
import * as progress from './sections/progress'
import * as tabs from './sections/tabs'
import * as modal from './sections/modal'
import * as dropdown from './sections/dropdown'
import * as tooltip from './sections/tooltip'
import * as toastSec from './sections/toast'
import * as badge from './sections/badge'
import * as avatar from './sections/avatar'
import * as card from './sections/card'
import * as image from './sections/image'
import * as alert from './sections/alert'
import * as layout from './sections/layout'
import * as loading from './sections/loading'
import * as virtualList from './composed/virtual-list'
import * as jobRow from './composed/job-row'
import * as jobCard from './composed/job-card'
import * as sidebarSec from './composed/sidebar'
import * as calendar from './sections/calendar'

type Section = { meta: DevSectionMeta; Component: Component }

export type CatalogId = 'primitives' | 'composed'

export const catalogs: Record<CatalogId, { title: string; path: string; sections: Section[] }> = {
  primitives: {
    title: 'Primitives',
    path: '/dev',
    sections: [
      { meta: tokens.meta, Component: tokens.TokensSection },
      { meta: button.meta, Component: button.ButtonSection },
      { meta: inputs.meta, Component: inputs.InputsSection },
      { meta: select.meta, Component: select.SelectSection },
      { meta: toggles.meta, Component: toggles.TogglesSection },
      { meta: segmented.meta, Component: segmented.SegmentedSection },
      { meta: slider.meta, Component: slider.SliderSection },
      { meta: progress.meta, Component: progress.ProgressSection },
      { meta: tabs.meta, Component: tabs.TabsSection },
      { meta: modal.meta, Component: modal.ModalSection },
      { meta: dropdown.meta, Component: dropdown.DropdownSection },
      { meta: tooltip.meta, Component: tooltip.TooltipSection },
      { meta: toastSec.meta, Component: toastSec.ToastSection },
      { meta: badge.meta, Component: badge.BadgeSection },
      { meta: avatar.meta, Component: avatar.AvatarSection },
      { meta: card.meta, Component: card.CardSection },
      { meta: image.meta, Component: image.ImageSection },
      { meta: alert.meta, Component: alert.AlertSection },
      { meta: layout.meta, Component: layout.LayoutSection },
      { meta: loading.meta, Component: loading.LoadingSection },
      { meta: calendar.meta, Component: calendar.CalendarSection },
    ],
  },
  composed: {
    title: 'Composed',
    path: '/dev/composed',
    sections: [
      { meta: virtualList.meta, Component: virtualList.VirtualListSection },
      { meta: jobRow.meta, Component: jobRow.JobRowSection },
      { meta: jobCard.meta, Component: jobCard.JobCardSection },
      { meta: sidebarSec.meta, Component: sidebarSec.SidebarSection },
    ],
  },
}

const groupsOf = (sections: Section[]) => {
  const map = new Map<string, DevSectionMeta[]>()
  for (const s of sections) map.set(s.meta.group, [...(map.get(s.meta.group) ?? []), s.meta])
  return [...map.entries()]
}

function Toolbar(props: { catalog: CatalogId }) {
  return (
    <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
      <AppSegmentedControl<CatalogId>
        aria-label="Katalog"
        value={props.catalog}
        onChange={(c) => {
          if (c !== props.catalog) window.location.assign(catalogs[c].path)
        }}
        options={[
          { value: 'primitives', label: 'Primitives' },
          { value: 'composed', label: 'Composed' },
        ]}
      />
      <AppSegmentedControl
        aria-label="Tema"
        value={theme()}
        onChange={setTheme}
        options={[
          { value: 'light', label: 'Açık', icon: <Sun /> },
          { value: 'dark', label: 'Koyu', icon: <Moon /> },
          { value: 'system', label: 'Sistem', icon: <SunMoon /> },
        ]}
      />
      <AppSegmentedControl<Viewport>
        aria-label="Viewport"
        value={devSettings.viewport}
        onChange={(v) => setDevSettings('viewport', v)}
        options={[
          { value: 'full', label: 'Tam' },
          { value: 'desktop', label: '1024', icon: <Monitor /> },
          { value: 'tablet', label: '768', icon: <Tablet /> },
          { value: 'mobile', label: '400', icon: <Smartphone /> },
        ]}
      />
      <AppSegmentedControl<Surface>
        aria-label="Yüzey"
        value={devSettings.surface}
        onChange={(v) => setDevSettings('surface', v)}
        options={[
          { value: 'background', label: 'bg' },
          { value: 'card', label: 'card' },
          { value: 'muted', label: 'muted' },
        ]}
      />
      <AppSwitch
        size="sm"
        label="Outlines"
        checked={devSettings.outlines}
        onChange={(v) => setDevSettings('outlines', v)}
        class="w-auto"
      />
    </div>
  )
}

export default function DevPage(props: { catalog: CatalogId }) {
  const catalog = () => catalogs[props.catalog]
  const sections = catalog().sections
  const [active, setActive] = createSignal(sections[0]!.meta.id)

  onMount(() => {
    // Scroll-spy: the section whose top is nearest below the sticky header wins.
    const els = sections.map((s) => document.getElementById(s.meta.id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-88px 0px -65% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    onCleanup(() => io.disconnect())
    if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView())
  })

  const jump = (id: string) => {
    setActive(id)
    history.replaceState(null, '', `#${id}`)
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }

  return (
    <div class="min-h-dvh bg-background text-foreground">
      <header class="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div class="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-3">
            <span class="flex size-8 items-center justify-center rounded-xl bg-primary font-medium text-primary-foreground">
              K
            </span>
            <div class="">
              <div class="text-sm font-medium">UI Kit — Dev</div>
              <div class="text-xs text-muted-foreground">
                kariyer-basvuru-web · {catalog().title} · {sections.length} bölüm
              </div>
            </div>
          </div>
          <Toolbar catalog={props.catalog} />
        </div>
      </header>

      <div class="mx-auto flex max-w-[1600px] gap-8 px-4 py-6 sm:px-6">
        {/* Sidebar (desktop) */}
        <nav
          class="sticky top-[88px] hidden h-[calc(100dvh-112px)] w-56 shrink-0 overflow-y-auto pr-2 lg:block"
          aria-label="Bölümler"
        >
          <For each={groupsOf(sections)}>
            {([group, items]) => (
              <div class="mb-4">
                <div class="mb-1 px-2 text-xs font-medium text-muted-foreground">{group}</div>
                <For each={items}>
                  {(m) => (
                    <button
                      type="button"
                      onClick={() => jump(m.id)}
                      class={cn(
                        'block w-full truncate rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                        focusRingClass,
                        active() === m.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-secondary-hover hover:text-primary-hover',
                      )}
                    >
                      {m.title}
                    </button>
                  )}
                </For>
              </div>
            )}
          </For>
        </nav>

        {/* Mobile section jump */}
        <div class="fixed inset-x-4 bottom-4 z-30 lg:hidden">
          <AppSelect
            options={sections.map((s) => ({ value: s.meta.id, label: s.meta.title }))}
            value={active()}
            onChange={jump}
            aria-label="Bölüme git"
            triggerClass="bg-card"
          />
        </div>

        {/* Content */}
        <main
          class={cn(
            '@container min-w-0 flex-1 transition-[max-width] duration-300',
            devSettings.viewport !== 'full' && 'mx-auto rounded-2xl border-2 border-dashed border-border/70 px-4 py-2',
          )}
          style={{ 'max-width': viewportWidths[devSettings.viewport] }}
        >
          <Show when={devSettings.viewport !== 'full'}>
            <div class="mb-4 text-center text-xs text-muted-foreground">
              viewport {viewportWidths[devSettings.viewport]}
            </div>
          </Show>
          <div class="flex flex-col gap-16 pb-32">
            <For each={sections}>{(s) => <s.Component />}</For>
          </div>
        </main>
      </div>
    </div>
  )
}
