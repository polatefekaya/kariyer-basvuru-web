import type { ApplicationStage } from './stages'

/**
 * The five values `job_application.application_status` can hold in the Node backend, and how they
 * line up with the nine stages the portal speaks.
 *
 * The mapping is the same one kariyer-recruiting-service uses (`LegacyStageMapping`), so a
 * company sees the same stage whichever source is answering. It is lossy on purpose: CONTACT,
 * INTERVIEW, OFFER and HOLD have no column to live in here, which is precisely why the recruiting
 * service exists. Until it is reachable, those moves are not offered rather than silently
 * collapsed into something else.
 */
export type LegacyApplicationStatus = 'pending' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn'

export const STAGE_FROM_LEGACY: Record<LegacyApplicationStatus, ApplicationStage> = {
  pending: 'NEW',
  under_review: 'REVIEWING',
  accepted: 'HIRED',
  rejected: 'REJECTED',
  withdrawn: 'WITHDRAWN',
}

export const LEGACY_FROM_STAGE: Partial<Record<ApplicationStage, LegacyApplicationStatus>> = {
  NEW: 'pending',
  REVIEWING: 'under_review',
  HIRED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
}

export const stageFromLegacy = (status: string | null | undefined): ApplicationStage =>
  STAGE_FROM_LEGACY[(status ?? '') as LegacyApplicationStatus] ?? 'NEW'

/**
 * What a company may move an application to when the backend only has the five columns.
 *
 * WITHDRAWN is the candidate's own act and is terminal, so it is never offered here — the same
 * rule the recruiting service enforces.
 */
export function legacyAllowedActions(stage: ApplicationStage): ApplicationStage[] {
  if (stage === 'WITHDRAWN') return []

  return (['REVIEWING', 'HIRED', 'REJECTED', 'NEW'] as ApplicationStage[]).filter((next) => next !== stage)
}
