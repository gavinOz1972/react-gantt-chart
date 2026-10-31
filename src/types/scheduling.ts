/** Strict YYYY-MM-DD in the proleptic Gregorian calendar, years 0001–9999. */
export type CalendarDate = string
/** Sunday = 0, Monday = 1, …, Saturday = 6. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface CalendarSettings {
  readonly workingWeekdays: readonly Weekday[]
  readonly workingHoursPerDay: number
}

export interface ProjectSettings extends CalendarSettings {
  readonly projectId: string
  readonly name: string
  readonly projectStartDate: CalendarDate
  readonly targetEndDate: CalendarDate
}

interface TaskFields {
  readonly taskId: string
  readonly name: string
  readonly description: string
  readonly durationHours: number
  readonly predecessorTaskIds: readonly string[]
}

export type TaskInput = TaskFields & (
  | { readonly independentStartMode: 'DEFAULT'; readonly requestedStartDate?: never }
  | { readonly independentStartMode: 'MANUAL'; readonly requestedStartDate: CalendarDate }
)

export interface WorkingSlot {
  readonly date: CalendarDate
  /** 1-based occupied working hour. These are ordinal hours, not wall-clock times. */
  readonly hour: number
}

export interface FinishBoundary {
  readonly date: CalendarDate
  /** Exclusive boundary immediately after this occupied working hour. */
  readonly afterHour: number
}

export interface ScheduledTask {
  readonly taskId: string
  readonly predecessorTaskIds: readonly string[]
  readonly startSlot: WorkingSlot
  readonly finishBoundary: FinishBoundary
  readonly startDate: CalendarDate
  /** Date of the last occupied hour, even at the end of a working day. */
  readonly finishDate: CalendarDate
}

export type EarlierDatePolicy = 'ALLOW' | 'REJECT'
export interface SchedulePolicies {
  /** Omitted means an owner decision is required if this case occurs. */
  readonly manualStartBeforeProject?: EarlierDatePolicy
  readonly targetEndBeforeProject?: EarlierDatePolicy
}

export type ScheduleErrorCode =
  | 'INVALID_PROJECT' | 'INVALID_CALENDAR' | 'INVALID_DATE' | 'INVALID_DURATION'
  | 'INVALID_TASK' | 'INVALID_TASK_ID' | 'DUPLICATE_TASK_ID' | 'INVALID_START_MODE'
  | 'INVALID_PREDECESSORS' | 'DUPLICATE_PREDECESSOR' | 'SELF_DEPENDENCY'
  | 'MISSING_PREDECESSOR' | 'DEPENDENCY_CYCLE' | 'POLICY_DECISION_REQUIRED'
  | 'MANUAL_START_BEFORE_PROJECT' | 'TARGET_END_BEFORE_PROJECT'
  | 'DATE_OUT_OF_RANGE' | 'INVALID_SLOT' | 'INVALID_POLICY'

export interface ScheduleError {
  readonly code: ScheduleErrorCode
  readonly field: string
  readonly message: string
  readonly taskId?: string
  readonly relatedTaskIds?: readonly string[]
}

export type ScheduleResult =
  | { readonly ok: true; readonly tasks: readonly ScheduledTask[]; readonly projectCompletion: FinishBoundary | null }
  | { readonly ok: false; readonly errors: readonly ScheduleError[] }
