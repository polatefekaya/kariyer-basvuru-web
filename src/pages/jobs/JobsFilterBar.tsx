import { createEffect, createSignal, on, Show, type JSX } from 'solid-js'
import { ArrowDownUp, Briefcase, MapPin, Search, X } from 'lucide-solid'
import { AppButton, AppCheckbox, AppInput, AppSelect, AppTabs } from '@/components/ui'
import { JOB_STATUS_LABELS } from '@/features/jobs'
import {
  JOB_TYPE_OPTIONS,
  JOBS_SORT_OPTIONS,
  JOBS_STATUS_FILTERS,
  WORKING_TYPE_OPTIONS,
  type JobsFilters,
  type JobsSort,
  type JobsStatusFilter,
} from './useJobsFilters'

export interface JobsFilterBarProps {
  filters: JobsFilters
  onChange: (patch: Partial<JobsFilters>) => void
  onReset: () => void
  isDirty: boolean
  /** Right end of the tabs row (the cards/rows view toggle). */
  trailing?: JSX.Element
}

const STATUS_TABS = JOBS_STATUS_FILTERS.map((value) => ({
  value,
  label: value === 'all' ? 'Tümü' : JOB_STATUS_LABELS[value],
}))
const ANY = '__any'

/** Status tabs + search + the handful of list filters the company job endpoint supports. */
export function JobsFilterBar(props: JobsFilterBarProps) {
  // Local echo of the search box so typing stays instant; the URL/query gets the debounced value.
  const [q, setQ] = createSignal(props.filters.q)
  createEffect(
    on(
      () => props.filters.q,
      (v) => v !== q() && setQ(v),
    ),
  )
  let timer: ReturnType<typeof setTimeout> | undefined
  const onSearch = (v: string) => {
    setQ(v)
    clearTimeout(timer)
    timer = setTimeout(() => props.onChange({ q: v }), 300)
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <AppTabs<JobsStatusFilter>
          tabs={STATUS_TABS}
          value={props.filters.status}
          onChange={(status) => props.onChange({ status })}
          variant="pill"
          class="w-auto min-w-0 flex-1"
          listClass="mb-0 bg-transparent"
        />
        <div class="flex items-center gap-3">
          <Show when={props.isDirty}>
            <AppButton variant="ghost" size="sm" leftIcon={<X />} onClick={() => (setQ(''), props.onReset())}>
              Filtreleri temizle
            </AppButton>
          </Show>
          {props.trailing}
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <AppInput
          class="min-w-72 flex-1"
          value={q()}
          onChange={onSearch}
          placeholder="İlan başlığı, pozisyon veya şehir ara…"
          aria-label="İlanlarda ara"
          leftIcon={<Search />}
          clearable
        />
        <AppSelect
          aria-label="İlan türü"
          leftIcon={<Briefcase />}
          options={[{ value: ANY, label: 'Tüm türler' }, ...JOB_TYPE_OPTIONS]}
          value={props.filters.type || ANY}
          onChange={(v) => props.onChange({ type: v === ANY ? '' : v })}
          triggerClass="w-44"
          class="w-auto"
        />
        <AppSelect
          aria-label="Çalışma şekli"
          leftIcon={<MapPin />}
          options={[{ value: ANY, label: 'Tüm çalışma şekilleri' }, ...WORKING_TYPE_OPTIONS]}
          value={props.filters.working || ANY}
          onChange={(v) => props.onChange({ working: v === ANY ? '' : (v as JobsFilters['working']) })}
          triggerClass="w-56"
          class="w-auto"
        />
        <AppSelect
          aria-label="Sıralama"
          leftIcon={<ArrowDownUp />}
          options={JOBS_SORT_OPTIONS}
          value={props.filters.sort}
          onChange={(v) => props.onChange({ sort: v as JobsSort })}
          triggerClass="w-48"
          class="w-auto"
        />
        <AppCheckbox
          class="px-1"
          label="Sadece Vitrin"
          checked={props.filters.vitrin}
          onChange={(vitrin) => props.onChange({ vitrin })}
        />
      </div>
    </div>
  )
}
