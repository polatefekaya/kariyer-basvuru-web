import type { ApplicationRow } from './types'
import { isOpenStage, stageLabel, stageVariant, type ApplicationStage } from './stages'

export { isOpenStage, stageLabel, stageVariant }

export const applicantName = (row: Pick<ApplicationRow, 'candidate'>) => row.candidate.fullName || 'Aday'

export const isApplicationOpen = (row: Pick<ApplicationRow, 'stage'>) => isOpenStage(row.stage)

/** `ALL` plus each stage, from the list response's `stats`. */
export function stageCount(stats: Record<string, number> | undefined, stage: ApplicationStage | 'ALL'): number {
  return stats?.[stage] ?? 0
}

export function matchTone(score: number | null | undefined): 'success' | 'foreground' | 'muted' {
  if (score == null) return 'muted'
  if (score >= 70) return 'success'
  return score >= 45 ? 'foreground' : 'muted'
}
