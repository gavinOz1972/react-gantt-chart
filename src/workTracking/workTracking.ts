import { dateToOrdinal } from '../domain'
import type { Baseline } from '../baseline/baseline'
import { record, validTimestamp } from '../persistence/planInputs'

export const MAX_EFFORT_HOURS = 1_000_000
export const CONTRIBUTOR_LIMIT = 80
export const WORK_DESCRIPTION_LIMIT = 500
export interface WorkEntry {
  readonly entryId: string
  readonly taskId: string
  readonly workDate: string
  readonly contributor: string
  readonly hours: number
  readonly description: string
  readonly createdAt: string
  readonly updatedAt: string
}
export interface WorkTracking {
  readonly schemaVersion: 1
  readonly entries: readonly WorkEntry[]
  readonly remainingHours: Readonly<Record<string, number | null>>
}
export interface WorkIssue { code: string; field: string; message: string }
export type WorkResult<T> = { ok: true; value: T } | { ok: false; errors: readonly WorkIssue[] }
export interface WorkDraft { contributor: string; workDate: string; hours: string; description: string }
export const emptyWorkTracking = (): WorkTracking => ({ schemaVersion: 1, entries: [], remainingHours: {} })
const failure = (code: string, field: string, message: string): WorkResult<never> => ({ ok: false, errors: [{ code, field, message }] })
export const validWorkDate = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try { dateToOrdinal(value); return true } catch { return false }
}
const validHours = (value: unknown, zero: boolean): value is number => typeof value === 'number' && Number.isFinite(value) && (zero ? value >= 0 : value > 0) && value <= MAX_EFFORT_HOURS && Number(value.toFixed(2)) === value
export const hundredths = (hours: number) => Math.round(hours * 100)
export const formatEffort = (hours: number) => hours.toFixed(2).replace(/\.?0+$/, '')

/** Strict decimal input. Unknown remaining effort stays null; blank work hours fail. */
export function parseEffort(text: string, remaining = false): WorkResult<number | null> {
  const trimmed = text.trim()
  if (remaining && !trimmed) return { ok: true, value: null }
  const value = /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(trimmed) ? Number(trimmed) : NaN
  return validHours(value, remaining) ? { ok: true, value } : failure('INVALID_WORK_HOURS', remaining ? 'remainingHours' : 'hours', `${remaining ? 'Remaining effort' : 'Work hours'} must be ${remaining ? 'zero or a positive' : 'a positive'} number, at most ${MAX_EFFORT_HOURS.toLocaleString('en-US')} hours, with at most two decimal places.${remaining ? ' Leave blank if unknown.' : ''}`)
}

function decodeEntry(value: unknown, taskIds: ReadonlySet<string>): WorkResult<WorkEntry> {
  if (!record(value)) return failure('INVALID_WORK_ENTRY', 'entries', 'Each work entry must be an object.')
  if (typeof value.entryId !== 'string' || !value.entryId.trim() || value.entryId.length > 120) return failure('INVALID_WORK_ENTRY_ID', 'entryId', 'Work entry IDs must be nonempty strings of at most 120 characters.')
  if (typeof value.taskId !== 'string' || !taskIds.has(value.taskId)) return failure('ORPHAN_WORK_ENTRY', 'taskId', `Work entry ${value.entryId} refers to a task that is not in the Current Plan.`)
  if (!validWorkDate(value.workDate)) return failure('INVALID_WORK_DATE', 'workDate', 'Choose a valid work date (YYYY-MM-DD). Historical dates are allowed.')
  if (typeof value.contributor !== 'string' || !value.contributor.trim() || value.contributor.trim().length > CONTRIBUTOR_LIMIT) return failure('INVALID_WORK_CONTRIBUTOR', 'contributor', `Enter a contributor name of 1–${CONTRIBUTOR_LIMIT} characters.`)
  if (!validHours(value.hours, false)) return failure('INVALID_WORK_HOURS', 'hours', `Work hours must be a finite positive number, at most ${MAX_EFFORT_HOURS.toLocaleString('en-US')} hours, with at most two decimal places.`)
  if (typeof value.description !== 'string' || value.description.trim().length < 3 || value.description.trim().length > WORK_DESCRIPTION_LIMIT) return failure('INVALID_WORK_DESCRIPTION', 'description', `Describe the work performed in 3–${WORK_DESCRIPTION_LIMIT} characters.`)
  if (!validTimestamp(value.createdAt) || !validTimestamp(value.updatedAt) || value.updatedAt < value.createdAt) return failure('INVALID_WORK_METADATA', 'updatedAt', 'Work entries need valid UTC creation/update timestamps, with update no earlier than creation.')
  return { ok: true, value: { entryId: value.entryId, taskId: value.taskId, workDate: value.workDate, contributor: value.contributor.trim(), hours: value.hours, description: value.description.trim(), createdAt: value.createdAt, updatedAt: value.updatedAt } }
}

/** Reconstruct known fields only; all work is linked to surviving permanent task IDs. */
export function decodeWorkTracking(value: unknown, taskIds: readonly string[]): WorkResult<WorkTracking> {
  if (!record(value) || value.schemaVersion !== 1) return failure('UNSUPPORTED_WORK_VERSION', 'workTracking', 'Work tracking must be a version 1 object.')
  if (!Array.isArray(value.entries) || !record(value.remainingHours)) return failure('INVALID_WORK_STRUCTURE', 'workTracking', 'Work tracking requires an entries array and remainingHours object.')
  const ids = new Set(taskIds)
  const entryIds = new Set<string>()
  const entries: WorkEntry[] = []
  for (const entry of value.entries) {
    const decoded = decodeEntry(entry, ids)
    if (!decoded.ok) return decoded
    if (entryIds.has(decoded.value.entryId)) return failure('DUPLICATE_WORK_ENTRY_ID', 'entryId', `Duplicate work entry ID: ${decoded.value.entryId}.`)
    entryIds.add(decoded.value.entryId); entries.push(decoded.value)
  }
  const remainingPairs: [string, number | null][] = []
  for (const [id, hours] of Object.entries(value.remainingHours)) {
    if (!ids.has(id)) return failure('ORPHAN_REMAINING_EFFORT', 'remainingHours', `Remaining effort refers to missing current task ${id}.`)
    if (hours !== null && !validHours(hours, true)) return failure('INVALID_REMAINING_EFFORT', 'remainingHours', `Remaining effort for ${id} must be null (unknown), zero, or a positive number up to ${MAX_EFFORT_HOURS.toLocaleString('en-US')} with at most two decimal places.`)
    remainingPairs.push([id, hours])
  }
  const remainingHours: Record<string, number | null> = Object.fromEntries(remainingPairs)
  const total = entries.reduce((sum, entry) => sum + hundredths(entry.hours), 0) + Object.values(remainingHours).reduce<number>((sum, hours) => sum + hundredths(hours ?? 0), 0)
  if (!Number.isSafeInteger(total)) return failure('WORK_TOTAL_LIMIT', 'hours', 'The combined work/remaining total exceeds the safe decimal calculation limit. Split this plan before adding more effort.')
  return { ok: true, value: { schemaVersion: 1, entries, remainingHours } }
}

export function entryFromDraft(draft: WorkDraft, taskId: string, entryId: string, now: string, previous?: WorkEntry): WorkResult<WorkEntry> {
  if (previous && previous.taskId !== taskId) return failure('WORK_TASK_MISMATCH', 'taskId', 'A correction cannot move a work entry to another task.')
  const parsed = parseEffort(draft.hours)
  if (!parsed.ok) return parsed
  return decodeEntry({ ...draft, hours: parsed.value, taskId, entryId: previous?.entryId ?? entryId, createdAt: previous?.createdAt ?? now, updatedAt: now }, new Set([taskId]))
}
export function chronologicalEntries(tracking: WorkTracking, taskId: string): WorkEntry[] {
  return tracking.entries.filter(entry => entry.taskId === taskId).sort((a, b) => a.workDate.localeCompare(b.workDate) || a.createdAt.localeCompare(b.createdAt) || a.entryId.localeCompare(b.entryId))
}
export function futureWorkWarning(workDate: string, today: string): string | undefined {
  if (validWorkDate(workDate) && workDate > today) return 'This work date is in the future. Check it before saving; the date will be kept as entered.'
}
export function removeTaskWork(tracking: WorkTracking, taskId: string): WorkTracking {
  return { schemaVersion: 1, entries: tracking.entries.filter(entry => entry.taskId !== taskId), remainingHours: Object.fromEntries(Object.entries(tracking.remainingHours).filter(([id]) => id !== taskId)) }
}
export function effortSummary(tracking: WorkTracking, taskId: string, baseline?: Baseline, complete = false) {
  const actual = tracking.entries.filter(entry => entry.taskId === taskId).reduce((sum, entry) => sum + hundredths(entry.hours), 0)
  const remaining = complete ? 0 : Object.hasOwn(tracking.remainingHours, taskId) ? tracking.remainingHours[taskId] : null
  const forecast = remaining === null ? null : actual + hundredths(remaining)
  const baselineHours = baseline?.tasks.find(task => task.taskId === taskId)?.durationHours ?? null
  return { actualHours: actual / 100, remainingHours: remaining, forecastHours: forecast === null ? null : forecast / 100, baselineHours,
    varianceHours: forecast === null || baselineHours === null ? null : (forecast - hundredths(baselineHours)) / 100 }
}
