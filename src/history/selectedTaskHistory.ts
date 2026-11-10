/** Read-only, selected-task boundary over already loaded immutable legacy state.
 * No storage, operational repository integration, writes or full-history copy.
 */
import { dateToOrdinal } from '../domain'
import { record, validTimestamp } from '../persistence/planInputs'
import { TASK_STATUSES } from '../progress/taskProgress'
import type { CompletionCriterion, ProgressTracking, StatusEvent, TaskStatus } from '../progress/taskProgress'

export const HISTORY_PAGE_SIZE = 20
export const HISTORY_MAX_BYTES = 128 * 1024
export interface HistorySource {
  readonly resourceId: string
  readonly formatVersion: 1 | 2 | 3 | 4 | 5
  readonly taskIds: readonly string[]
  readonly tracking: ProgressTracking
}
export interface HistoryWatermark { readonly resourceId: string; readonly revisionToken: object }
export interface HistorySession {
  readonly token: object; readonly taskId: string; readonly watermark: HistoryWatermark
  readonly source: { readonly kind: 'LoadedLegacy'; readonly formatVersion: number; readonly progressVersion: 1 }
}
export interface TransitionRow {
  readonly taskId: string; readonly sequence: number; readonly event: StatusEvent
  readonly actor: null; readonly decisionId: null
}
export interface TaskHistoryCursor { readonly token: object; readonly nextIndex: number }
export type HistoryFailureCode = 'Unsupported' | 'InvalidPayload' | 'ReadExpired' | 'RecordTooLarge' | 'InvalidCursor' | 'Cancelled' | 'MixedWatermark'
export interface HistoryFailure { readonly kind: 'Failure'; readonly code: HistoryFailureCode; readonly message: string }
export interface HistoryPage {
  readonly kind: 'Page'; readonly taskId: string; readonly watermark: HistoryWatermark
  readonly source: HistorySession['source']
  readonly items: readonly TransitionRow[]; readonly nextCursor?: TaskHistoryCursor
  readonly availability: 'Available' | 'Unavailable'
  readonly coverage: { readonly kind: 'Partial'; readonly reason: string }
  /** UTF-8 bytes of JSON items; no portable/wire format is asserted. */
  readonly deliveredBytes: number
}
export interface SelectedTaskHistoryReader {
  open(taskId: string, signal?: AbortSignal): Promise<{ readonly kind: 'Opened'; readonly session: HistorySession } | HistoryFailure>
  read(session: HistorySession, request: { readonly cursor?: TaskHistoryCursor; readonly limit: number; readonly maxBytes: number }, signal?: AbortSignal): Promise<HistoryPage | HistoryFailure>
  release(session: HistorySession): void
}
const failure = (code: HistoryFailureCode, message: string): HistoryFailure => ({ kind: 'Failure', code, message })
const text = (v: unknown, min: number, max: number): v is string => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max
const id = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.length <= 120
const status = (v: unknown): v is TaskStatus => TASK_STATUSES.some(s => s === v)
function date(v: unknown): v is string { try { if (typeof v !== 'string') return false; dateToOrdinal(v); return true } catch { return false } }
function criteria(v: unknown): v is readonly CompletionCriterion[] {
  if (!Array.isArray(v)) return false
  const ids = new Set<string>()
  for (const c of v) {
    if (!record(c) || !id(c.criterionId) || !text(c.text, 3, 500) || typeof c.checked !== 'boolean' || ids.has(c.criterionId)) return false
    ids.add(c.criterionId)
  }
  return true
}
/** Validate original fields; never cast a generic fixture payload or trim wording. */
export function isLegacyTransition(v: unknown): v is StatusEvent {
  if (!record(v) || !id(v.eventId) || typeof v.taskId !== 'string' || !status(v.fromStatus) || !status(v.toStatus) || v.fromStatus === v.toStatus || !date(v.date) || !validTimestamp(v.recordedAt)) return false
  const required = v.toStatus === 'Blocked' || v.fromStatus === 'Complete'
  if (required ? !text(v.reason, 3, 500) : v.reason !== undefined && !text(v.reason, 3, 500)) return false
  if (v.note !== undefined && !text(v.note, 0, 1000)) return false
  if (v.committedFinishDateAtCompletion !== undefined && (v.toStatus !== 'Complete' || !date(v.committedFinishDateAtCompletion))) return false
  if (v.toStatus === 'Complete') {
    if (!criteria(v.criteriaSnapshot) || v.criteriaSnapshot.some(c => !c.checked) || v.completionAcknowledged !== true || !text(v.definitionOfDone, 0, 2000)) return false
    if (!v.criteriaSnapshot.length && v.noCriteriaAcknowledged !== true) return false
    if (v.noCriteriaAcknowledged !== undefined && (v.noCriteriaAcknowledged !== true || v.criteriaSnapshot.length > 0)) return false
  } else if (v.criteriaSnapshot !== undefined || v.completionAcknowledged !== undefined || v.noCriteriaAcknowledged !== undefined || v.definitionOfDone !== undefined) return false
  return true
}
/** Selected task validation mirrors the legacy decoder's replay/date rules.
 * Scans references, retaining ID/checklist metadata, not projected history rows.
 * Whole-source/cross-task validation remains with the unchanged import boundary.
 */
function validateSelected(source: HistorySource, taskId: string): HistoryFailure | undefined {
  const p: unknown = source.tracking
  if (!record(p) || p.schemaVersion !== 1 || !text(p.definitionOfDone, 0, 2000) || !record(p.tasks) || !Array.isArray(p.events)) return failure('Unsupported', 'This loaded source does not support legacy progress version 1.')
  let previous: TaskStatus = 'Not Started', recordedAt = '', blockedReason: string | undefined, snapshot: readonly CompletionCriterion[] | undefined
  const ids = new Set<string>()
  for (const value of p.events) {
    if (!record(value)) return failure('InvalidPayload', 'A loaded transition is not a valid legacy record.')
    if (value.taskId !== taskId) continue
    if (!isLegacyTransition(value) || ids.has(value.eventId) || value.fromStatus !== previous || value.recordedAt < recordedAt) return failure('InvalidPayload', 'Selected-task history has invalid fields, attestation, recorded-time order or transition sequence. The loaded data was not changed.')
    ids.add(value.eventId); previous = value.toStatus; recordedAt = value.recordedAt
    blockedReason = value.toStatus === 'Blocked' ? value.reason : undefined
    if (value.criteriaSnapshot) snapshot = value.criteriaSnapshot
  }
  const current: unknown = Object.hasOwn(p.tasks, taskId) ? p.tasks[taskId] : { status: 'Not Started', criteria: [] }
  if (!record(current) || !status(current.status) || !criteria(current.criteria) || current.status !== previous || current.blockedReason !== blockedReason) return failure('InvalidPayload', 'The selected task disagrees with its recorded transition history.')
  const currentCriteria = current.criteria
  if (current.status === 'Complete' && (!snapshot || snapshot.length !== currentCriteria.length || snapshot.some((c, i) => c.criterionId !== currentCriteria[i].criterionId || c.text.trim() !== currentCriteria[i].text.trim() || c.checked !== currentCriteria[i].checked))) return failure('InvalidPayload', 'The completed checklist disagrees with its historical attestation.')
  return undefined
}
const coverage = Object.freeze({ kind: 'Partial' as const, reason: 'Only status transitions retained in this loaded legacy plan are available. Earlier deleted or unrecorded decisions and actor identity are unknown.' })
export function createLoadedTaskHistoryReader(source: HistorySource, options: { now?: () => number; lifetimeMs?: number } = {}): SelectedTaskHistoryReader {
  const watermark = Object.freeze({ resourceId: source.resourceId, revisionToken: Object.freeze({}) })
  const sessions = new Map<object, { session: HistorySession; expires: number; cursors: Set<TaskHistoryCursor> }>()
  const now = options.now ?? Date.now, lifetime = options.lifetimeMs ?? 5 * 60 * 1000
  return {
    async open(taskId, signal) {
      if (signal?.aborted) return failure('Cancelled', 'History request cancelled.')
      if (!source.resourceId || ![1, 2, 3, 4, 5].includes(source.formatVersion)) return failure('Unsupported', 'This source format is not supported by the legacy history reader.')
      if (!source.taskIds.includes(taskId)) return failure('InvalidPayload', 'The selected task is not part of this loaded source.')
      const problem = validateSelected(source, taskId)
      if (problem) return problem
      const session: HistorySession = Object.freeze({ token: Object.freeze({}), taskId, watermark, source: Object.freeze({ kind: 'LoadedLegacy', formatVersion: source.formatVersion, progressVersion: 1 }) })
      sessions.set(session.token, { session, expires: now() + lifetime, cursors: new Set() })
      return { kind: 'Opened', session }
    },
    async read(session, request, signal) {
      if (signal?.aborted) return failure('Cancelled', 'History request cancelled.')
      const pinned = sessions.get(session.token)
      if (!pinned || pinned.session !== session || pinned.expires <= now()) { sessions.delete(session.token); return failure('ReadExpired', 'This history read expired. Refresh history to start a new read.') }
      if (!Number.isInteger(request.limit) || request.limit < 1 || request.limit > HISTORY_PAGE_SIZE || !Number.isInteger(request.maxBytes) || request.maxBytes < 2 || request.maxBytes > HISTORY_MAX_BYTES || request.cursor && !pinned.cursors.has(request.cursor)) return failure('InvalidCursor', 'This page request or cursor is invalid. Refresh history.')
      const items: TransitionRow[] = [], events = source.tracking.events
      let index = request.cursor?.nextIndex ?? events.length - 1, bytes = 2
      while (index >= 0) {
        if (signal?.aborted) return failure('Cancelled', 'History request cancelled.')
        const event = events[index]
        if (event.taskId !== session.taskId) { index--; continue }
        if (items.length === request.limit) break
        const row: TransitionRow = { taskId: session.taskId, sequence: index + 1, event, actor: null, decisionId: null }
        const size = new TextEncoder().encode(JSON.stringify(row)).byteLength + (items.length ? 1 : 0)
        if (bytes + size > request.maxBytes) {
          if (!items.length) return failure('RecordTooLarge', 'A recorded transition exceeds this page delivery limit. No record was truncated.')
          break
        }
        // Only rows accepted within the selected count/byte budget are copied.
        items.push(structuredClone(row)); bytes += size; index--
      }
      const nextCursor: TaskHistoryCursor | undefined = index < 0 ? undefined : Object.freeze({ token: session.token, nextIndex: index })
      if (nextCursor) pinned.cursors.add(nextCursor)
      const unavailable = source.formatVersion < 4 && !events.length && !Object.keys(source.tracking.tasks).length
      return { kind: 'Page', taskId: session.taskId, watermark, source: session.source, items, nextCursor, availability: unavailable ? 'Unavailable' : 'Available', coverage, deliveredBytes: bytes }
    },
    release(session) { sessions.delete(session.token) },
  }
}
export function sameHistoryWatermark(a: HistoryWatermark, b: HistoryWatermark) { return a.resourceId === b.resourceId && a.revisionToken === b.revisionToken }
