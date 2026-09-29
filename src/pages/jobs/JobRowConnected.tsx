import { splitProps } from 'solid-js'
import { JobRow, type JobRowProps } from '@/components/jobs'
import { createInView } from '@/lib/inView'
import { useApplicantsPreview } from './useApplicantsPreview'

/** `JobRow` with its Başvuranlar preview loaded once the row scrolls into view. */
export function JobRowConnected(props: Omit<JobRowProps, 'applicants' | 'applicantsTotal'>) {
  const [local, rest] = splitProps(props, ['job'])
  const { ref, inView } = createInView()
  const { applicants, total } = useApplicantsPreview(() => local.job, inView)
  return (
    <div ref={ref} class="min-w-0">
      <JobRow job={local.job} applicants={applicants()} applicantsTotal={total()} {...rest} />
    </div>
  )
}
