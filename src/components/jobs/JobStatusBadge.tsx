import { AppBadge, type AppBadgeVariant } from '@/components/ui'
import { JOB_STATUS_LABELS, type JobStatus } from '@/features/jobs'

export const jobStatusVariant: Record<JobStatus, AppBadgeVariant> = {
  draft: 'muted',
  unclaimed: 'warning',
  pending_approval: 'warning',
  company_not_found: 'destructiveSubtle',
  approved: 'successSubtle',
  rejected: 'destructiveSubtle',
  expired: 'muted',
  closed: 'secondary',
}

export function JobStatusBadge(props: { status: JobStatus; size?: 'sm' | 'md'; class?: string }) {
  return (
    <AppBadge variant={jobStatusVariant[props.status] ?? 'muted'} size={props.size ?? 'sm'} class={props.class}>
      {JOB_STATUS_LABELS[props.status] ?? props.status}
    </AppBadge>
  )
}
