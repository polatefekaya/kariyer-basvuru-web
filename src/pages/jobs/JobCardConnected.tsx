import { createSignal, splitProps } from 'solid-js'
import { JobCard, type JobCardProps } from '@/components/jobs'
import { useJob } from '@/features/jobs'
import { createInView } from '@/lib/inView'
import { useApplicantsPreview } from './useApplicantsPreview'

/**
 * `JobCard` plus its data: the applicants preview loads once the card scrolls into view (so a
 * 24-card page doesn't fire 24 requests up front) and the full detail (skills, languages,
 * questions) only when the card is expanded.
 */
export function JobCardConnected(props: Omit<JobCardProps, 'applicants' | 'applicantsTotal' | 'detail'>) {
  const [local, rest] = splitProps(props, ['job', 'expanded', 'defaultExpanded', 'onExpandedChange'])
  const { ref, inView } = createInView()
  const { applicants, total } = useApplicantsPreview(() => local.job, inView)
  const [internalExpanded, setInternalExpanded] = createSignal(!!local.defaultExpanded)
  const expanded = () => local.expanded ?? internalExpanded()
  const detail = useJob(() => (expanded() ? local.job.uid : null))

  return (
    <div ref={ref} class="min-w-0">
      <JobCard
        job={local.job}
        detail={detail.data}
        applicants={applicants()}
        applicantsTotal={total()}
        expanded={expanded()}
        onExpandedChange={(v) => {
          setInternalExpanded(v)
          local.onExpandedChange?.(v)
        }}
        {...rest}
      />
    </div>
  )
}
