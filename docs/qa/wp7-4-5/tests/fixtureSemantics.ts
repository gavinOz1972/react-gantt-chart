/** Independent narrow TEST-domain guards. Not format6 validation or scheduling. */
import type { AtomicChangeRequest, EventRecord, QualifiedDate, RetainedTaskValue } from '../../../../src/repository/operationalHistoryRepository'
import type { ValidationIssue } from '../../../../src/repository/projectRepository'
import { exact } from './fixtures'
import type { FixtureState } from './fixtures'
const same = (a: unknown, b: unknown) => exact(a) === exact(b)
const positive = (n: number) => Number.isSafeInteger(n) && n > 0
const text = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0
const unique = (a: readonly string[]) => new Set(a).size === a.length
const setEqual = (a: readonly string[], b: readonly string[]) => same([...a].sort(), [...b].sort())
const issue = (code: string): ValidationIssue[] => [{ code, message: 'Narrow reference-domain check: ' + code }]
const keys = (o: object, allowed: string[]) => Object.keys(o).every(k => allowed.includes(k))
export function validDate(value: unknown, timestamp = false): boolean {
  if (typeof value !== 'string' || !(timestamp ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/ : /^\d{4}-\d{2}-\d{2}$/).test(value)) return false
  const parsed = new Date(timestamp ? value : value + 'T00:00:00.000Z')
  return Number.isFinite(parsed.getTime()) && (timestamp ? parsed.toISOString() : parsed.toISOString().slice(0, 10)) === value
}
function fact(value: QualifiedDate): boolean {
  return value?.kind === 'Unknown' ? text(value.reason) : value?.kind === 'Known' && validDate(value.date) && (value.recordedAt === null || validDate(value.recordedAt, true)) && (value.actorLabel === null || text(value.actorLabel)) && (value.sourceRecordId === null || text(value.sourceRecordId))
}
function task(value: RetainedTaskValue): boolean {
  const t = value?.input
  return !!t && keys(value, ['input', 'lifecycle', 'progress', 'facts', 'remainingHours', 'detail']) && text(t.taskId) && text(t.name) && typeof t.description === 'string'
    && positive(t.durationHours) && Array.isArray(t.predecessorTaskIds) && t.predecessorTaskIds.every(text) && unique(t.predecessorTaskIds)
    && (t.independentStartMode === 'DEFAULT' || t.independentStartMode === 'MANUAL' && validDate(t.requestedStartDate))
    && ['Active', 'Retired'].includes(value.lifecycle?.kind) && (value.lifecycle.lastDecisionId === null || text(value.lifecycle.lastDecisionId))
    && ['Not Started', 'In Progress', 'Blocked', 'Complete'].includes(value.progress?.status) && Array.isArray(value.progress.criteria)
    && (value.progress.status !== 'Blocked' || text(value.progress.blockedReason))
    && fact(value.facts?.start) && fact(value.facts?.completion) && fact(value.facts?.committedAtCompletion)
    && (value.remainingHours === null || Number.isFinite(value.remainingHours) && value.remainingHours >= 0 && Number.isSafeInteger(Math.round(value.remainingHours * 100)) && Math.abs(value.remainingHours * 100 - Math.round(value.remainingHours * 100)) < 1e-7)
    && value.detail !== undefined
}
function edges(state: FixtureState): string[] { return state.tasks.flatMap(t => t.input.predecessorTaskIds.map(p => p + '>' + t.input.taskId)) }
function downstream(start: readonly string[], state: FixtureState, includeArchives: boolean): Set<string> {
  const visited = new Set<string>(), pending = [...start], pairs = state.tasks.flatMap(t => t.input.predecessorTaskIds.map(p => [p, t.input.taskId]))
  if (includeArchives) for (const r of state.records) if (r.recordType === 'Archive') pairs.push([r.predecessorId, r.successorId])
  while (pending.length) { const id = pending.pop()!; if (visited.has(id)) continue; visited.add(id); for (const [p, child] of pairs) if (p === id && !visited.has(child)) pending.push(child) }
  return visited
}
export function validateFixtureChange(old: FixtureState, next: FixtureState, request: AtomicChangeRequest): readonly ValidationIssue[] {
  if (!keys(request, ['resourceId', 'expected', 'transactionId', 'delta', 'appendRecords']) || !keys(request.delta, ['project', 'changedTasks', 'activeOrder', 'working', 'forecastAssumptions', 'nextTaskNumber'])) return issue('UnknownCommandField')
  if (next.lineageId !== old.lineageId || next.project.projectId !== old.lineageId || !same(next.baseline, old.baseline)) return issue('ImmutableLineageOrBaseline')
  if (!validDate(next.project.projectStartDate) || !validDate(next.project.targetEndDate) || !positive(next.project.workingHoursPerDay) || !next.project.workingWeekdays.length || next.project.workingWeekdays.some(d => !Number.isInteger(d) || d < 0 || d > 6)) return issue('ProjectInput')
  if (!positive(next.nextTaskNumber) || next.nextTaskNumber < old.nextTaskNumber || !positive(next.nextSequence)) return issue('Counter')
  if (!next.tasks.every(task) || !unique(next.tasks.map(t => t.input.taskId)) || !unique(request.delta.changedTasks.map(t => t.input.taskId))) return issue('CompleteRetainedEntityRequired')
  const byId = new Map(next.tasks.map(t => [t.input.taskId, t])), oldById = new Map(old.tasks.map(t => [t.input.taskId, t]))
  if (old.tasks.some(t => !byId.has(t.input.taskId))) return issue('RetainedIdentityRemoved')
  for (const t of next.tasks) {
    const n = Number(t.input.taskId.slice(1))
    if (!/^T[1-9]\d*$/.test(t.input.taskId) || !positive(n) || n >= next.nextTaskNumber || !oldById.has(t.input.taskId) && n < old.nextTaskNumber) return issue('FixtureAllocation')
    if (t.lifecycle.kind === 'Retired' && t.input.predecessorTaskIds.length || t.input.predecessorTaskIds.some(id => byId.get(id)?.lifecycle.kind !== 'Active') || t.input.predecessorTaskIds.includes(t.input.taskId)) return issue('ActiveGraph')
  }
  const active = next.tasks.filter(t => t.lifecycle.kind === 'Active').map(t => t.input.taskId)
  if (!unique(next.activeOrder) || !setEqual(next.activeOrder, active)) return issue('ActiveOrder')
  const visiting = new Set<string>(), visited = new Set<string>()
  function visit(id: string): boolean { if (visiting.has(id)) return false; if (visited.has(id)) return true; visiting.add(id); for (const p of byId.get(id)!.input.predecessorTaskIds) if (!visit(p)) return false; visiting.delete(id); visited.add(id); return true }
  if (!active.every(visit)) return issue('Cycle')
  if (!same(next.records.slice(0, old.records.length), old.records) || !unique(next.records.map(r => r.recordId))) return issue('ImmutableRecordOrDuplicateId')
  const records = new Map(next.records.map(r => [r.recordId, r])), added = request.appendRecords, events = added.filter((r): r is EventRecord => r.recordType === 'Event')
  if (!events.length || events.some((e, i) => e.sequence !== old.nextSequence + i) || next.nextSequence !== old.nextSequence + events.length || !positive(next.nextSequence)) return issue('EventSequence')
  for (const r of added) {
    if (!['Event', 'Archive', 'Review', 'Lifecycle', 'Work'].includes(r.recordType) || !text(r.recordId) || r.recordedInRevision !== next.revision || !validDate(r.recordedAt, true) || r.effectiveDate !== null && !validDate(r.effectiveDate) || !unique(r.taskIds) || r.taskIds.some(id => !byId.has(id)) || r.actorLabel !== null && !text(r.actorLabel)) return issue('EvidenceMetadata')
    if (r.recordType === 'Event' && (!text(r.eventKind) || !unique(r.links) || r.links.some(id => !records.has(id)))) return issue('MissingEventLink')
    if (r.recordType === 'Work') {
      if (!byId.has(r.taskId) || !r.taskIds.includes(r.taskId) || !text(r.rationale)) return issue('WorkIdentity')
      const previous = old.records.find(p => p.recordId === r.correctsRecordId)
      if (r.operation === 'Record' ? r.correctsRecordId !== null : !previous || previous.recordType !== 'Work' || previous.taskId !== r.taskId || next.records.filter(p => p.recordType === 'Work' && p.correctsRecordId === r.correctsRecordId).length !== 1) return issue('WorkCorrection')
      if (!['Record', 'Correct', 'Retract'].includes(r.operation) || (r.operation === 'Retract' ? r.hours !== null : typeof r.hours !== 'number' || !Number.isFinite(r.hours) || r.hours <= 0 || !Number.isSafeInteger(Math.round(r.hours * 100)) || Math.abs(r.hours * 100 - Math.round(r.hours * 100)) > 1e-7) || !events.some(e => e.eventKind === 'WorkChanged' && e.links.includes(r.recordId))) return issue('WorkEvidence')
    }
  }
  for (const t of next.tasks) for (const f of Object.values(t.facts)) if (f.kind === 'Known' && f.sourceRecordId !== null && !records.get(f.sourceRecordId)?.taskIds.includes(t.input.taskId)) return issue('MissingFactLink')
  const decisions = added.filter(r => r.recordType === 'Lifecycle'), reviews = added.filter(r => r.recordType === 'Review'), archives = added.filter(r => r.recordType === 'Archive')
  const changedLife = next.tasks.filter(t => !same(t.lifecycle, oldById.get(t.input.taskId)?.lifecycle ?? { kind: 'Active', lastDecisionId: null }))
  if (!setEqual(changedLife.map(t => t.input.taskId), decisions.map(d => d.taskId))) return issue('MissingLifecycleDecision')
  for (const d of decisions) {
    const prior = oldById.get(d.taskId), current = byId.get(d.taskId)!, event = records.get(d.sourceEventId)
    if (!prior || !['Retire', 'Restore'].includes(d.operation) || (d.operation === 'Retire' ? prior.lifecycle.kind !== 'Active' || current.lifecycle.kind !== 'Retired' : prior.lifecycle.kind !== 'Retired' || current.lifecycle.kind !== 'Active') || current.lifecycle.lastDecisionId !== d.recordId || d.priorDecisionId !== prior.lifecycle.lastDecisionId || !same(d.before, prior) || !same(d.beforeWorking, old.working)) return issue('LifecycleBeforeContext')
    if (!same(current.progress, prior.progress) || !same(current.facts, prior.facts) || current.remainingHours !== prior.remainingHours) return issue('ScopePreservesProgressFactsEffort')
    if (!text(d.rationale) || d.rationale.trim().length < 3 || !validDate(d.effectiveDate) || records.get(d.reviewId)?.recordType !== 'Review' || event?.recordType !== 'Event' || event.eventKind !== (d.operation === 'Retire' ? 'TaskRetired' : 'TaskRestored') || !event.links.includes(d.recordId)) return issue('LifecycleLinks')
  }
  const oldEdges = edges(old), newEdges = edges(next), removed = oldEdges.filter(e => !newEdges.includes(e)), newPairs = newEdges.filter(e => !oldEdges.includes(e))
  if (decisions.length || removed.length || newPairs.length) {
    if (reviews.length !== 1 || !decisions.length || request.delta.working === undefined || same(next.working, old.working)) return issue('ScopeReviewRequired')
    const review = reviews[0], event = records.get(review.sourceEventId)
    const expected = new Set<string>()
    for (const d of decisions) for (const id of downstream([d.taskId], old, d.operation === 'Restore')) expected.add(id)
    for (const id of [...expected]) if (!byId.has(id)) expected.delete(id)
    if (review.sourceRevision !== old.revision || review.targetRevision !== next.revision || !setEqual(review.subjectTaskIds, decisions.map(d => d.taskId)) || !unique(review.affectedTaskIds) || !setEqual(review.affectedTaskIds, [...expected]) || !unique(review.outcomes.map(o => o.taskId)) || !setEqual(review.outcomes.map(o => o.taskId), [...expected])) return issue('IncompleteSuccessorClosure')
    if (!text(review.rationale) || event?.recordType !== 'Event' || event.eventKind !== 'ScopeReview' || !event.links.includes(review.recordId) || decisions.some(d => d.reviewId !== review.recordId)) return issue('ReviewLinks')
    for (const o of review.outcomes) if (!text(o.rationale) || !same(o.predecessorIds, byId.get(o.taskId)!.input.predecessorTaskIds)) return issue('UnconfirmedSuccessor')
    const archivePairs = archives.map(a => a.predecessorId + '>' + a.successorId)
    if (!unique(archivePairs) || !setEqual(archivePairs, removed) || !setEqual(review.archiveIds, archives.map(a => a.recordId))) return issue('MissingArchivedEdgeEpisode')
    for (const a of archives) if (a.reviewId !== review.recordId || a.sourceEventId !== review.sourceEventId || !text(a.rationale) || !byId.has(a.predecessorId) || !byId.has(a.successorId)) return issue('ArchiveLinks')
    const subjects = decisions.map(d => d.taskId)
    if (removed.some(pair => !subjects.some(id => pair.startsWith(id + '>') || pair.endsWith('>' + id)))) return issue('UnaffectedPredecessorRemoved')
    if (!setEqual(review.addedEdges.map(a => a.predecessorId + '>' + a.successorId), newPairs)) return issue('UnconfirmedRestorationEdge')
    for (const a of review.addedEdges) if (!a.reinstatesArchiveIds.length || a.reinstatesArchiveIds.some(id => { const oldArchive = old.records.find(r => r.recordId === id); return oldArchive?.recordType !== 'Archive' || oldArchive.predecessorId !== a.predecessorId || oldArchive.successorId !== a.successorId })) return issue('RestorationArchiveLink')
  } else if (reviews.length || archives.length) return issue('UnrelatedScopeEvidence')
  return []
}
