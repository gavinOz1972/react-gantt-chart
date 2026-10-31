import { calculateSchedule } from '../domain'
import type { ScheduleResult } from '../domain'
import { decodePlanInputs, record, validTimestamp } from '../persistence/planInputs'
import type { PersistenceIssue, PlanInputs } from '../persistence/planInputs'

type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T
type SuccessfulSchedule = Extract<ScheduleResult, { ok: true }>
export type Baseline = DeepReadonly<PlanInputs & {
  schemaVersion: 1
  baselineId: string
  establishedAt: string
  schedule: Pick<SuccessfulSchedule, 'tasks' | 'projectCompletion'>
}>
export type BaselineResult = { ok: true; value: Baseline } | { ok: false; errors: readonly PersistenceIssue[] }
const failure = (code: string, message: string): BaselineResult => ({ ok: false, errors: [{ code, message }] })

function freeze<T extends object>(value: T): DeepReadonly<T> {
  for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child)
  return Object.freeze(value) as DeepReadonly<T>
}

/** Compare known calculated records without relying on JSON property order. */
function matches(value: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) return Array.isArray(value) && value.length === expected.length && expected.every((item, index) => matches(value[index], item))
  if (record(expected)) return record(value) && Object.keys(value).length === Object.keys(expected).length && Object.entries(expected).every(([key, item]) => matches(value[key], item))
  return value === expected
}

/** Pure creation: callers supply metadata. Never mutates or freezes caller-owned inputs. */
export function establishBaseline(inputs: unknown, baselineId: string, establishedAt: string, existing?: Baseline): BaselineResult {
  if (existing) return failure('BASELINE_EXISTS', 'This project already has its original baseline. View it; it cannot be replaced or deleted.')
  const decoded = decodePlanInputs(inputs)
  if (!decoded.ok) return decoded
  if (!decoded.value.tasks.length) return failure('BASELINE_EMPTY', 'Add and save at least one task before establishing the baseline.')
  if (!baselineId.trim() || !validTimestamp(establishedAt)) return failure('INVALID_BASELINE_METADATA', 'The baseline needs a nonempty identifier and valid UTC establishment timestamp.')
  const schedule = calculateSchedule(decoded.value.project, decoded.value.tasks)
  if (!schedule.ok) return { ok: false, errors: schedule.errors }
  return { ok: true, value: freeze({ ...decoded.value, schemaVersion: 1, baselineId, establishedAt, schedule: { tasks: schedule.tasks, projectCompletion: schedule.projectCompletion } }) }
}

/** Validate frozen inputs independently of the editable current plan, then verify stored outputs. */
export function decodeBaseline(value: unknown): BaselineResult {
  if (!record(value)) return failure('INVALID_BASELINE', 'Baseline must be a versioned snapshot object. The open project was kept.')
  if (value.schemaVersion !== 1) return failure('UNSUPPORTED_BASELINE_VERSION', 'This release supports baseline schema version 1.')
  if (typeof value.baselineId !== 'string' || typeof value.establishedAt !== 'string') return failure('INVALID_BASELINE_METADATA', 'Baseline identifier or establishment timestamp is missing.')
  if (!Array.isArray(value.manualOrder) || typeof value.sortMode !== 'string' || !record(value.duplicateOrigins)) return failure('INVALID_BASELINE_STRUCTURE', 'Baseline manual order and display metadata are required; restore a complete exported snapshot.')
  const created = establishBaseline(value, value.baselineId, value.establishedAt)
  if (!created.ok) return { ok: false, errors: created.errors.map(error => ({ code: `INVALID_BASELINE_${error.code}`, message: `Baseline: ${error.message}` })) }
  if (!matches(value.schedule, created.value.schedule)) return failure('INVALID_BASELINE_SCHEDULE', 'Baseline calculated slots or completion do not match its frozen inputs. Restore an unmodified backup.')
  return created
}
