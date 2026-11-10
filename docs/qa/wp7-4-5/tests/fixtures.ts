/** Authored TEST values and commands, not a portable schema or lifecycle writer. */
import type { Fingerprint, RepositoryProjectId, TransactionId } from '../../../../src/repository/projectRepository'
import type { AtomicChangeRequest, Coverage, HistoricalRecord, JsonValue, OriginalBaseline, RecordedWorkTotal, RetainedTaskValue } from '../../../../src/repository/operationalHistoryRepository'
import type { ProjectSettings } from '../../../../src/types/scheduling'

export interface FixtureState {
  resourceId: RepositoryProjectId
  lineageId: string
  revision: number
  baseline: OriginalBaseline<JsonValue>
  project: ProjectSettings
  tasks: RetainedTaskValue[]
  activeOrder: string[]
  working: JsonValue
  forecastAssumptions: JsonValue
  nextTaskNumber: number
  nextSequence: number
  records: HistoricalRecord[]
  coverage: Coverage
  historyAvailable: boolean
  workAvailable: Record<string, boolean>
  totals: Record<string, RecordedWorkTotal>
}
export const clone = <T>(value: T): T => structuredClone(value)
/** Fixture value comparison only; NOT JCS, a wire codec or a production D. */
export function exact(value: unknown): string {
  return JSON.stringify(value, (_key, child: unknown) => {
    if (typeof child === 'number' && !Number.isFinite(child)) throw new Error('Non-JSON fixture number')
    return child && typeof child === 'object' && !Array.isArray(child)
      ? Object.fromEntries(Object.entries(child).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : child
  })
}
// Exact value interning: collision-free within this test process, no hash/profile
// adoption and no Node-only dependency in the compiled application TS project.
const fingerprints = new Map<string, Fingerprint>()
export function fixtureFingerprint(value: unknown): Fingerprint {
  const semantic = value && typeof value === 'object' && 'lineageId' in value && 'revision' in value
    ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'resourceId')) : value
  const key = exact(semantic), prior = fingerprints.get(key)
  if (prior) return prior
  const id = `fixture-only:${fingerprints.size + 1}` as Fingerprint
  fingerprints.set(key, id)
  return id
}
export const resource = (value: string) => value as RepositoryProjectId
export const transaction = (value: string) => value as TransactionId
export const stamp = '2026-11-09T15:00:00.000Z'
const unknown = () => ({ kind: 'Unknown' as const, reason: 'No actual evidence recorded.' })
export function fixture(): FixtureState {
  const inputs = [[], ['T1'], ['T1', 'T5'], ['T2', 'T3'], []]
  const project: ProjectSettings = { projectId: 'portable-lineage', name: 'Fixture only', projectStartDate: '2026-11-02', targetEndDate: '2026-11-30', workingWeekdays: [1, 4, 5], workingHoursPerDay: 3 }
  const tasks: RetainedTaskValue[] = inputs.map((predecessors, i) => ({
    input: { taskId: `T${i + 1}`, name: `Task ${i + 1}`, description: 'Retained detail', durationHours: 3, predecessorTaskIds: predecessors, independentStartMode: 'DEFAULT' },
    lifecycle: { kind: 'Active', lastDecisionId: null }, progress: { status: 'Not Started', criteria: [] },
    facts: { start: unknown(), completion: unknown(), committedAtCompletion: unknown() }, remainingHours: 4, detail: { retained: 'opaque detail' },
  }))
  const records: HistoricalRecord[] = [
    { recordType: 'Event', recordId: 'undated', sequence: 98, eventKind: 'SourceEdit', taskIds: ['T1'], recordedInRevision: null, recordedAt: null, effectiveDate: null, actorLabel: null, rationale: null, links: [], payload: { limitation: 'Legacy date unavailable' } },
    ...['event-z', 'event-a'].map((recordId, i): HistoricalRecord => ({ recordType: 'Event', recordId, sequence: 99 + i, eventKind: 'SourceEdit', taskIds: ['T1', 'T3'], recordedInRevision: 17, recordedAt: stamp, effectiveDate: '2026-11-09', actorLabel: null, rationale: 'Prior authored explanation', links: [], payload: { order: i } })),
  ]
  return {
    resourceId: resource('stored-copy-1'), lineageId: project.projectId, revision: 17, project, tasks,
    baseline: { kind: 'Present', baselineId: 'first-B', value: { fixtureOnly: true, originalTasks: tasks.map(t => clone(t.input)) as unknown as JsonValue, opaque: { token: 'preserve-me' }, originalFinish: '2026-11-06' } },
    activeOrder: tasks.map(t => t.input.taskId), working: { kind: 'Unreviewed', reason: 'Fixture seed, not a WP742 promise' }, forecastAssumptions: null,
    nextTaskNumber: 6, nextSequence: 101, records, coverage: { kind: 'Partial', reason: 'Earlier changes unavailable' }, historyAvailable: true,
    workAvailable: Object.fromEntries(tasks.map(t => [t.input.taskId, true])),
    totals: Object.fromEntries(tasks.map(t => [t.input.taskId, { kind: 'RecordedSum', hours: 0, completeness: 'RecordedDataOnly', actualTotal: 'Unknown', throughRevision: 17 }])),
  }
}
export function edit(state: FixtureState, suffix = 'edit'): AtomicChangeRequest {
  const task = clone(state.tasks[1])
  return { resourceId: state.resourceId, expected: { revision: state.revision, fingerprint: fixtureFingerprint(state) }, transactionId: transaction(suffix), delta: { changedTasks: [{ ...task, input: { ...task.input, name: 'Edited ' + suffix } }] }, appendRecords: [{ recordType: 'Event', recordId: 'E-' + suffix, sequence: state.nextSequence, eventKind: 'SourceEdit', taskIds: ['T2'], recordedInRevision: state.revision + 1, recordedAt: stamp, effectiveDate: null, actorLabel: null, rationale: 'Explicit edit', links: [], payload: { field: 'name' } }] }
}
export function scopeChange(state: FixtureState, operation: 'Retire' | 'Restore', suffix: string = operation): AtomicChangeRequest {
  const R = state.revision + 1, retiring = operation === 'Retire', subject = state.tasks.find(t => t.input.taskId === 'T1')!
  const lifecycleId = 'L-' + suffix, reviewId = 'R-' + suffix, eventId = 'E-' + suffix, reviewEvent = 'E-review-' + suffix
  const common = { recordedInRevision: R, recordedAt: stamp, effectiveDate: '2026-11-09', actorLabel: null, rationale: 'Explicit scope rationale' }
  const changed = ['T1', 'T2', 'T3'].map(id => {
    const old = state.tasks.find(t => t.input.taskId === id)!
    return { ...clone(old), lifecycle: id === 'T1' ? { kind: retiring ? 'Retired' as const : 'Active' as const, lastDecisionId: lifecycleId } : old.lifecycle,
      input: { ...old.input, predecessorTaskIds: id === 'T1' ? [] : retiring ? old.input.predecessorTaskIds.filter(p => p !== 'T1') : id === 'T2' ? ['T1'] : ['T1', 'T5'] } }
  })
  const archives: HistoricalRecord[] = retiring ? ['T2', 'T3'].map(id => ({ ...common, recordType: 'Archive', recordId: `AR-${suffix}-${id}`, taskIds: ['T1', id], predecessorId: 'T1', successorId: id, reviewId, sourceEventId: reviewEvent })) : []
  const allTasks = state.tasks.map(t => changed.find(c => c.input.taskId === t.input.taskId) ?? t)
  const records: HistoricalRecord[] = [
    { ...common, recordType: 'Lifecycle', recordId: lifecycleId, taskIds: ['T1'], taskId: 'T1', operation, priorDecisionId: subject.lifecycle.lastDecisionId, reviewId, sourceEventId: eventId, before: clone(subject), beforeWorking: clone(state.working) },
    ...archives,
    { ...common, recordType: 'Review', recordId: reviewId, taskIds: ['T1', 'T2', 'T3', 'T4'], sourceRevision: state.revision, targetRevision: R, subjectTaskIds: ['T1'], affectedTaskIds: ['T1', 'T2', 'T3', 'T4'],
      outcomes: allTasks.filter(t => ['T1', 'T2', 'T3', 'T4'].includes(t.input.taskId)).map(t => ({ taskId: t.input.taskId, predecessorIds: clone(t.input.predecessorTaskIds), rationale: 'Reviewed once per unique task' })),
      archiveIds: archives.map(a => a.recordId), addedEdges: retiring ? [] : ['T2', 'T3'].map(id => ({ predecessorId: 'T1', successorId: id, reinstatesArchiveIds: state.records.filter(r => r.recordType === 'Archive' && r.predecessorId === 'T1' && r.successorId === id).map(r => r.recordId) })), sourceEventId: reviewEvent },
    { ...common, recordType: 'Event', recordId: eventId, sequence: state.nextSequence, eventKind: retiring ? 'TaskRetired' : 'TaskRestored', taskIds: ['T1'], links: [lifecycleId], payload: { decisionId: lifecycleId } },
    { ...common, recordType: 'Event', recordId: reviewEvent, sequence: state.nextSequence + 1, eventKind: 'ScopeReview', taskIds: ['T1', 'T2', 'T3', 'T4'], links: [reviewId], payload: { reviewId } },
  ]
  return { resourceId: state.resourceId, expected: { revision: state.revision, fingerprint: fixtureFingerprint(state) }, transactionId: transaction(suffix),
    delta: { changedTasks: changed, activeOrder: retiring ? ['T2', 'T3', 'T4', 'T5'] : ['T1', 'T2', 'T3', 'T4', 'T5'], working: { kind: 'Reviewed', contextId: 'W-' + suffix, sourceRevision: state.revision } }, appendRecords: records }
}
export function logWork(state: FixtureState, hours: number | null, suffix: string, correctsRecordId: string | null = null): AtomicChangeRequest {
  const request = edit(state, suffix), recordId = 'WORK-' + suffix
  return { ...request, delta: { changedTasks: [] }, appendRecords: [
    { recordType: 'Work', recordId, taskIds: ['T2'], taskId: 'T2', operation: correctsRecordId === null ? 'Record' : hours === null ? 'Retract' : 'Correct', correctsRecordId, hours, recordedInRevision: state.revision + 1, recordedAt: stamp, effectiveDate: '2026-11-09', actorLabel: null, rationale: 'Optional recorded work' },
    { ...request.appendRecords[0], recordType: 'Event', sequence: state.nextSequence, eventKind: 'WorkChanged', links: [recordId], payload: { workRecordId: recordId } } as HistoricalRecord,
  ] }
}
export function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) }
  return value
}
