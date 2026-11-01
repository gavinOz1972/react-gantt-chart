import { dateToOrdinal } from '../domain'
import { record, validTimestamp } from '../persistence/planInputs'

export const TASK_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Complete'] as const
export type TaskStatus = typeof TASK_STATUSES[number]
export interface CompletionCriterion { readonly criterionId: string; readonly text: string; readonly checked: boolean }
export interface TaskProgress { readonly status: TaskStatus; readonly criteria: readonly CompletionCriterion[]; readonly blockedReason?: string }
export interface StatusEvent {
  readonly eventId: string; readonly taskId: string; readonly fromStatus: TaskStatus; readonly toStatus: TaskStatus
  readonly date: string; readonly recordedAt: string; readonly reason?: string; readonly note?: string
  readonly criteriaSnapshot?: readonly CompletionCriterion[]; readonly completionAcknowledged?: true
  readonly noCriteriaAcknowledged?: true; readonly definitionOfDone?: string
  readonly committedFinishDateAtCompletion?: string
}
export interface ProgressTracking {
  readonly schemaVersion: 1; readonly definitionOfDone: string
  readonly tasks: Readonly<Record<string, TaskProgress>>; readonly events: readonly StatusEvent[]
}
export interface ProgressIssue { code: string; message: string }
export type ProgressResult<T> = { ok: true; value: T } | { ok: false; errors: readonly ProgressIssue[] }
export interface TransitionRequest {
  target: TaskStatus; eventId: string; date: string; recordedAt: string; reason?: string; note?: string
  completionAcknowledged?: boolean; noCriteriaAcknowledged?: boolean; reopenAcknowledged?: boolean
  criteria?: readonly CompletionCriterion[]
  committedFinishDateAtCompletion?: string
}
export const emptyProgress = (): ProgressTracking => ({ schemaVersion: 1, definitionOfDone: '', tasks: {}, events: [] })
export const progressForTask = (tracking: ProgressTracking, id: string): TaskProgress => Object.hasOwn(tracking.tasks, id) ? tracking.tasks[id] : { status: 'Not Started', criteria: [] }
export const latestCompletion = (tracking: ProgressTracking, id: string) => [...tracking.events].reverse().find(event => event.taskId === id && event.toStatus === 'Complete')
const fail = (code: string, message: string): ProgressResult<never> => ({ ok: false, errors: [{ code, message }] })
const status = (value: unknown): value is TaskStatus => TASK_STATUSES.includes(value as TaskStatus)
const id = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.length <= 120
const text = (value: unknown, min: number, max: number): value is string => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max
const validDate = (value: unknown): value is string => { try { if (typeof value !== 'string') return false; dateToOrdinal(value); return true } catch { return false } }
function freeze<T extends object>(value: T): T {
  for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child)
  return Object.freeze(value)
}
function criteria(value: unknown): ProgressResult<CompletionCriterion[]> {
  if (!Array.isArray(value)) return fail('INVALID_CRITERIA', 'Completion criteria must be an array.')
  const ids = new Set<string>(); const items: CompletionCriterion[] = []
  for (const item of value) {
    if (!record(item) || !id(item.criterionId) || !text(item.text, 3, 500) || typeof item.checked !== 'boolean') return fail('INVALID_CRITERION', 'Each criterion needs a stable ID, 3–500 characters of text and a boolean checked state.')
    if (ids.has(item.criterionId)) return fail('DUPLICATE_CRITERION_ID', `Duplicate criterion ID ${item.criterionId}.`)
    ids.add(item.criterionId); items.push({ criterionId: item.criterionId, text: item.text.trim(), checked: item.checked })
  }
  return { ok: true, value: items }
}
const sameCriteria = (a: readonly CompletionCriterion[], b: readonly CompletionCriterion[]) => JSON.stringify(a) === JSON.stringify(b)

/** Validate current state and replay ordered history independently of dates/effort scheduling. */
export function decodeProgress(value: unknown, taskIds: readonly string[]): ProgressResult<ProgressTracking> {
  if (!record(value) || value.schemaVersion !== 1) return fail('UNSUPPORTED_PROGRESS_VERSION', 'Task progress requires a version 1 object.')
  if (!text(value.definitionOfDone, 0, 2000) || !record(value.tasks) || !Array.isArray(value.events)) return fail('INVALID_PROGRESS_STRUCTURE', 'Progress needs a Definition of Done (up to 2,000 characters), task records and an events array.')
  const known = new Set(taskIds); const owners = new Map<string, string>(); const pairs: [string, TaskProgress][] = []
  function own(items: readonly CompletionCriterion[], taskId: string): boolean {
    for (const item of items) { if (owners.has(item.criterionId) && owners.get(item.criterionId) !== taskId) return false; owners.set(item.criterionId, taskId) }
    return true
  }
  for (const [taskId, entry] of Object.entries(value.tasks)) {
    if (!known.has(taskId)) return fail('ORPHAN_TASK_PROGRESS', `Status/criteria refer to missing current task ${taskId}.`)
    if (!record(entry) || !status(entry.status)) return fail('INVALID_TASK_STATUS', `Task ${taskId} must use Not Started, In Progress, Blocked or Complete.`)
    const decoded = criteria(entry.criteria); if (!decoded.ok) return decoded
    if (!own(decoded.value, taskId)) return fail('DUPLICATE_CRITERION_ID', 'A criterion ID cannot belong to different tasks.')
    if (entry.status === 'Blocked' ? !text(entry.blockedReason, 3, 500) : entry.blockedReason !== undefined) return fail('INVALID_BLOCKED_REASON', 'Blocked tasks need a 3–500 character reason; other statuses must not carry an active blocked reason.')
    pairs.push([taskId, { status: entry.status, criteria: decoded.value, ...(entry.status === 'Blocked' ? { blockedReason: String(entry.blockedReason).trim() } : {}) }])
  }
  const tasks = Object.fromEntries(pairs); const events: StatusEvent[] = []; const eventIds = new Set<string>()
  const replay = new Map<string, { status: TaskStatus; blockedReason?: string; recordedAt: string; completion?: readonly CompletionCriterion[] }>()
  for (const entry of value.events) {
    if (!record(entry) || !id(entry.eventId) || typeof entry.taskId !== 'string' || !known.has(entry.taskId)) return fail('INVALID_STATUS_EVENT_REFERENCE', 'Each status event needs a stable ID and a surviving task reference.')
    if (eventIds.has(entry.eventId)) return fail('DUPLICATE_STATUS_EVENT_ID', `Duplicate status event ID ${entry.eventId}.`)
    eventIds.add(entry.eventId)
    const previous = replay.get(entry.taskId)
    if (!status(entry.fromStatus) || !status(entry.toStatus) || entry.fromStatus === entry.toStatus || entry.fromStatus !== (previous?.status ?? 'Not Started')) return fail('INVALID_STATUS_HISTORY', 'Status history must form an unbroken sequence from Not Started, with distinct from/to statuses.')
    if (!validDate(entry.date) || !validTimestamp(entry.recordedAt) || (previous && entry.recordedAt < previous.recordedAt)) return fail('INVALID_STATUS_EVENT_DATE', 'Events need a valid calendar date and UTC recording timestamp in recorded sequence. Effective dates may be historical.')
    const requiredReason = entry.toStatus === 'Blocked' || entry.fromStatus === 'Complete'
    if (requiredReason ? !text(entry.reason, 3, 500) : entry.reason !== undefined && !text(entry.reason, 3, 500)) return fail('INVALID_TRANSITION_REASON', 'Blocking or reopening requires a 3–500 character reason.')
    if (entry.note !== undefined && !text(entry.note, 0, 1000)) return fail('INVALID_COMPLETION_NOTE', 'Event notes must be plain text up to 1,000 characters.')
    let snapshot: CompletionCriterion[] | undefined
    if (entry.committedFinishDateAtCompletion !== undefined && (entry.toStatus !== 'Complete' || !validDate(entry.committedFinishDateAtCompletion))) return fail('INVALID_COMPLETION_FINISH', 'Only completion events may retain a valid committed finish date.')
    if (entry.toStatus === 'Complete') {
      const decoded = criteria(entry.criteriaSnapshot); if (!decoded.ok) return fail('INVALID_COMPLETION_SNAPSHOT', decoded.errors[0].message)
      snapshot = decoded.value
      if (!own(snapshot, entry.taskId)) return fail('INVALID_COMPLETION_SNAPSHOT', 'A historical criterion ID belongs to another task.')
      if (snapshot.some(item => !item.checked) || entry.completionAcknowledged !== true || (!snapshot.length && entry.noCriteriaAcknowledged !== true)) return fail('INVALID_COMPLETION_ATTESTATION', 'Completion requires every snapshot criterion checked, explicit confirmation and acknowledgement when no criteria exist.')
      if (entry.noCriteriaAcknowledged !== undefined && (entry.noCriteriaAcknowledged !== true || snapshot.length > 0)) return fail('INVALID_COMPLETION_ATTESTATION', 'The no-criteria acknowledgement is only valid for an empty completion checklist.')
      if (!text(entry.definitionOfDone, 0, 2000)) return fail('INVALID_COMPLETION_GUIDANCE', 'Completion must retain its project Definition of Done guidance as text.')
    } else if (entry.criteriaSnapshot !== undefined || entry.completionAcknowledged !== undefined || entry.noCriteriaAcknowledged !== undefined || entry.definitionOfDone !== undefined) return fail('INVALID_STATUS_EVENT', 'Only a completion event may contain criterion snapshots or completion acknowledgements.')
    const event: StatusEvent = { eventId: entry.eventId, taskId: entry.taskId, fromStatus: entry.fromStatus, toStatus: entry.toStatus, date: entry.date, recordedAt: entry.recordedAt,
      ...(entry.reason !== undefined ? { reason: String(entry.reason).trim() } : {}), ...(entry.note !== undefined ? { note: String(entry.note).trim() } : {}),
      ...(snapshot ? { criteriaSnapshot: snapshot, completionAcknowledged: true as const, ...(snapshot.length ? {} : { noCriteriaAcknowledged: true as const }), definitionOfDone: String(entry.definitionOfDone).trim(), ...(entry.committedFinishDateAtCompletion !== undefined ? { committedFinishDateAtCompletion: String(entry.committedFinishDateAtCompletion) } : {}) } : {}) }
    events.push(event)
    replay.set(entry.taskId, { status: entry.toStatus, ...(entry.toStatus === 'Blocked' ? { blockedReason: event.reason } : {}), recordedAt: entry.recordedAt, completion: snapshot ?? previous?.completion })
  }
  for (const taskId of taskIds) {
    const current: TaskProgress = Object.hasOwn(tasks, taskId) ? tasks[taskId] : { status: 'Not Started', criteria: [] }
    const last = replay.get(taskId)
    if (current.status !== (last?.status ?? 'Not Started') || current.blockedReason !== last?.blockedReason) return fail('STATUS_HISTORY_MISMATCH', `Current status/reason for ${taskId} disagrees with its transition history.`)
    if (current.status === 'Complete' && (!last?.completion || !sameCriteria(current.criteria, last.completion))) return fail('COMPLETED_CRITERIA_MISMATCH', 'A completed checklist must match its last attestation. Reopen the task before changing criteria.')
  }
  return { ok: true, value: freeze({ schemaVersion: 1, definitionOfDone: value.definitionOfDone.trim(), tasks, events }) }
}

export function transitionTask(tracking: ProgressTracking, taskId: string, request: TransitionRequest, taskIds: readonly string[]): ProgressResult<ProgressTracking> {
  const current = progressForTask(tracking, taskId)
  if (!taskIds.includes(taskId)) return fail('ORPHAN_TASK_PROGRESS', 'Select a current task before changing status.')
  if (current.status === request.target) return fail('STATUS_UNCHANGED', 'Choose a different status.')
  if (current.status === 'Complete' && request.reopenAcknowledged !== true) return fail('REOPEN_CONFIRMATION_REQUIRED', 'Confirm reopening and give a reason before leaving Complete.')
  let checked = current.criteria
  if (request.target === 'Complete') {
    if (request.completionAcknowledged !== true || (!checked.length && request.noCriteriaAcknowledged !== true)) return fail('COMPLETION_CONFIRMATION_REQUIRED', 'Confirm completion and acknowledge explicitly when no formal criteria were recorded.')
    checked = request.criteria ?? current.criteria
    if (checked.length !== current.criteria.length || checked.some((item, index) => item.criterionId !== current.criteria[index].criterionId || item.text !== current.criteria[index].text)) return fail('COMPLETION_CRITERIA_CHANGED', 'Completion must attest the current checklist without replacing its text or IDs.')
    if (checked.some(item => !item.checked)) return fail('UNCHECKED_COMPLETION_CRITERIA', 'Check every satisfied completion criterion before completing the task.')
  }
  const event: StatusEvent = { eventId: request.eventId, taskId, fromStatus: current.status, toStatus: request.target, date: request.date, recordedAt: request.recordedAt,
    ...(request.reason?.trim() ? { reason: request.reason.trim() } : {}), ...(request.note?.trim() ? { note: request.note.trim() } : {}),
    ...(request.target === 'Complete' ? { criteriaSnapshot: checked.map(item => ({ ...item })), completionAcknowledged: true, ...(!checked.length ? { noCriteriaAcknowledged: true as const } : {}), definitionOfDone: tracking.definitionOfDone, ...(request.committedFinishDateAtCompletion !== undefined ? { committedFinishDateAtCompletion: request.committedFinishDateAtCompletion } : {}) } : {}) }
  const next: TaskProgress = { status: request.target, criteria: checked.map(item => ({ ...item })), ...(request.target === 'Blocked' ? { blockedReason: request.reason?.trim() } : {}) }
  return decodeProgress({ ...tracking, tasks: { ...tracking.tasks, [taskId]: next }, events: [...tracking.events, event] }, taskIds)
}
export function replaceCriteria(tracking: ProgressTracking, taskId: string, items: readonly CompletionCriterion[], taskIds: readonly string[]): ProgressResult<ProgressTracking> {
  const current = progressForTask(tracking, taskId)
  if (current.status === 'Complete') return fail('REOPEN_BEFORE_CRITERIA', 'Reopen the completed task before changing its checklist. Its original attestation will be preserved.')
  return decodeProgress({ ...tracking, tasks: { ...tracking.tasks, [taskId]: { ...current, criteria: items } } }, taskIds)
}
export function duplicateProgress(tracking: ProgressTracking, sourceId: string, targetId: string, criterionIds: readonly string[], taskIds: readonly string[]): ProgressResult<ProgressTracking> {
  const source = progressForTask(tracking, sourceId)
  if (source.criteria.length !== criterionIds.length) return fail('INVALID_COPY_CRITERIA', 'A copy needs a fresh ID for every criterion.')
  const copied: TaskProgress = { status: 'Not Started', criteria: source.criteria.map((item, index) => ({ criterionId: criterionIds[index], text: item.text, checked: false })) }
  return decodeProgress({ ...tracking, tasks: { ...tracking.tasks, [targetId]: copied } }, taskIds)
}
export function removeTaskProgress(tracking: ProgressTracking, taskId: string): ProgressTracking {
  return { ...tracking, tasks: Object.fromEntries(Object.entries(tracking.tasks).filter(([id]) => id !== taskId)), events: tracking.events.filter(event => event.taskId !== taskId) }
}
export function progressFingerprint(tracking: ProgressTracking = emptyProgress()): unknown {
  return [tracking.definitionOfDone, Object.entries(tracking.tasks).filter(([, task]) => task.status !== 'Not Started' || task.criteria.length > 0).sort(([a], [b]) => a.localeCompare(b)).map(([id, task]) => [id, task.status, task.blockedReason ?? null, task.criteria.map(item => [item.criterionId, item.text, item.checked])]),
    tracking.events.map(event => [event.eventId, event.taskId, event.fromStatus, event.toStatus, event.date, event.recordedAt, event.reason ?? null, event.note ?? null, event.criteriaSnapshot ?? null, event.completionAcknowledged ?? null, event.noCriteriaAcknowledged ?? null, event.definitionOfDone ?? null, event.committedFinishDateAtCompletion ?? null])]
}
