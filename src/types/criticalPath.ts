import type { FinishBoundary, ScheduleError, WorkingSlot } from './scheduling'

export interface TaskCriticalAnalysis {
  readonly taskId: string
  readonly durationHours: number
  readonly earliestStart: WorkingSlot
  readonly earliestFinish: FinishBoundary
  readonly latestStart: WorkingSlot
  readonly latestFinish: FinishBoundary
  readonly totalSlackHours: number
  readonly critical: boolean
  /** Effective not-before slot for independent roots only; retained dependent dates are inactive. */
  readonly releaseStart?: WorkingSlot
  /** Working slots between the project's first available slot and the root release, not effort. */
  readonly releaseDelayHours: number
}
export interface CriticalRelationship {
  readonly key: string
  readonly predecessorId: string
  readonly successorId: string
  readonly critical: boolean
}
export type CriticalPathResult =
  | { readonly ok: true; readonly tasks: readonly TaskCriticalAnalysis[]; readonly relationships: readonly CriticalRelationship[]; readonly topologicalTaskIds: readonly string[]; readonly projectCompletion: FinishBoundary | null }
  | { readonly ok: false; readonly errors: readonly (ScheduleError | { code: 'ANALYSIS_INPUT_MISMATCH' | 'ANALYSIS_RANGE_OVERFLOW'; field: string; message: string; taskId?: string })[] }
