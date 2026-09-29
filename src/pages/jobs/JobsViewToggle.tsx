import { LayoutGrid, Rows3 } from 'lucide-solid'
import { AppSegmentedControl } from '@/components/ui'
import { createPersistedSignal } from '@/lib/persisted'

export type JobsView = 'cards' | 'rows'
export const JOBS_VIEWS: readonly JobsView[] = ['cards', 'rows']

/** Gallery (cards) vs list (rows) — a device preference, so it lives in localStorage, not the URL. */
export const useJobsView = () => createPersistedSignal<JobsView>('kz-jobs-view', 'cards', JOBS_VIEWS)

export function JobsViewToggle(props: { value: JobsView; onChange: (view: JobsView) => void; class?: string }) {
  return (
    <AppSegmentedControl<JobsView>
      size="md"
      aria-label="Görünüm"
      options={[
        { value: 'cards', label: 'Kartlar', icon: LayoutGrid },
        { value: 'rows', label: 'Liste', icon: Rows3 },
      ]}
      value={props.value}
      onChange={props.onChange}
      class={props.class}
    />
  )
}
