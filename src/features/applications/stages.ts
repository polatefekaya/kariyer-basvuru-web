/**
 * The hiring pipeline as kariyer-recruiting-service defines it. The service is authoritative:
 * it validates every move and returns `allowedActions` per row, so the map below is for
 * ordering and labelling, never for deciding what a user may do.
 */
export type ApplicationStage =
  'NEW' | 'REVIEWING' | 'CONTACT' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'HOLD' | 'REJECTED' | 'WITHDRAWN'

export const APPLICATION_STAGES: ApplicationStage[] = [
  'NEW',
  'REVIEWING',
  'CONTACT',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'HOLD',
  'REJECTED',
  'WITHDRAWN',
]

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  NEW: 'Yeni',
  REVIEWING: 'İnceleniyor',
  CONTACT: 'İletişim',
  INTERVIEW: 'Mülakat',
  OFFER: 'Teklif',
  HIRED: 'İşe alındı',
  HOLD: 'Karar verilmedi',
  REJECTED: 'Reddedildi',
  WITHDRAWN: 'Geri çekildi',
}

/** The verb shown on the action that moves an application into a stage. */
export const STAGE_ACTIONS: Record<ApplicationStage, string> = {
  NEW: 'Yeniye al',
  REVIEWING: 'İncelemeye al',
  CONTACT: 'İletişime geç',
  INTERVIEW: 'Mülakat aşamasına al',
  OFFER: 'Teklif ver',
  HIRED: 'İşe alındı olarak işaretle',
  HOLD: 'Karar verilmedi',
  REJECTED: 'Reddet',
  WITHDRAWN: 'Geri çekildi',
}

export const stageVariant: Record<
  ApplicationStage,
  'muted' | 'warning' | 'primarySubtle' | 'success' | 'successSubtle' | 'destructiveSubtle' | 'premiumSubtle'
> = {
  NEW: 'primarySubtle',
  REVIEWING: 'warning',
  CONTACT: 'warning',
  INTERVIEW: 'premiumSubtle',
  OFFER: 'successSubtle',
  HIRED: 'success',
  HOLD: 'muted',
  REJECTED: 'destructiveSubtle',
  WITHDRAWN: 'muted',
}

/** Decisions that end the process but can still be corrected (the service allows a narrow way back). */
export const FINAL_STAGES: ApplicationStage[] = ['HIRED', 'REJECTED']

export const isCorrection = (from: ApplicationStage, to: ApplicationStage) =>
  FINAL_STAGES.includes(from) && to !== 'REJECTED'

/** Moving out of a final stage reads as undoing it, not as a step forward. */
const CORRECTION_ACTIONS: Partial<Record<ApplicationStage, Partial<Record<ApplicationStage, string>>>> = {
  HIRED: { OFFER: 'Teklif aşamasına geri al', HOLD: 'İşe alımı geri al' },
  REJECTED: { HOLD: 'Reddi geri al' },
}

/** The verb for one particular move — `STAGE_ACTIONS` unless the move is a correction. */
export const stageActionLabel = (from: ApplicationStage, to: ApplicationStage) =>
  CORRECTION_ACTIONS[from]?.[to] ?? STAGE_ACTIONS[to]

/** Stages still in play — the split the lists use for "aktif" vs "geçmiş". */
export const OPEN_STAGES: ApplicationStage[] = ['NEW', 'REVIEWING', 'CONTACT', 'INTERVIEW', 'OFFER']

export const isOpenStage = (stage: ApplicationStage) => OPEN_STAGES.includes(stage)

export const stageLabel = (stage: string) => STAGE_LABELS[stage as ApplicationStage] ?? stage

export const isApplicationStage = (value: string): value is ApplicationStage =>
  APPLICATION_STAGES.includes(value as ApplicationStage)
