/** TEST seeds for read characterization, not a legacy migration/provider. */
import { fixture, fixtureFingerprint, resource } from '../../wp7-4-5/tests/fixtures'
import type { FixtureState } from '../../wp7-4-5/tests/fixtures'
import { validateFixtureChange } from '../../wp7-4-5/tests/fixtureSemantics'
import { ReferenceOperationalHistoryRepository } from '../../wp7-4-5/tests/referenceOperationalHistoryRepository'
import { latestCompletion, progressForTask } from '../../../../src/progress/taskProgress'
import type { JsonValue, QualifiedDate, RetainedTaskValue, HistoricalRecord } from '../../../../src/repository/operationalHistoryRepository'
import type { LegacyCase } from './legacyFixtures'
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as JsonValue
const unknown = (): QualifiedDate => ({ kind: 'Unknown', reason: 'No current actual fact in legacy source' })
export function seedFor(c: LegacyCase): FixtureState {
  const s = fixture()
  s.resourceId = resource('parity-' + c.id); s.lineageId = c.project.projectId; s.project = c.project
  s.baseline = c.baseline ? { kind: 'Present', baselineId: c.baseline.baselineId, value: json(c.baseline) } : { kind: 'Absent' }
  s.tasks = c.tasks.map((input): RetainedTaskValue => {
    const p = progressForTask(c.progress, input.taskId), completion = latestCompletion(c.progress, input.taskId)
    const known = (date: string): QualifiedDate => ({ kind: 'Known', date, recordedAt: completion?.recordedAt ?? null, actorLabel: null, sourceRecordId: completion ? completion.eventId : null })
    return { input, lifecycle: { kind: c.lifecycle === 'Retired' && input.taskId === 'T1' ? 'Retired' : 'Active', lastDecisionId: c.lifecycle === 'Active' || input.taskId !== 'T1' ? null : c.lifecycle === 'Retired' ? 'L-retire' : 'L-restore' }, progress: p,
      facts: { start: unknown(), completion: p.status === 'Complete' && completion ? known(completion.date) : unknown(), committedAtCompletion: p.status === 'Complete' && completion?.committedFinishDateAtCompletion ? known(completion.committedFinishDateAtCompletion) : unknown() },
      remainingHours: c.work.remainingHours[input.taskId] ?? null, detail: { source: 'Synthetic characterization; no embedded legacy history/guidance' } }
  })
  s.activeOrder = c.order.filter(id => s.tasks.find(t => t.input.taskId === id)?.lifecycle.kind === 'Active')
  s.nextTaskNumber = c.tasks.length + 1; s.working = { kind: 'Unreviewed', reason: 'No accepted working context in legacy inputs' }; s.forecastAssumptions = json(c.settings)
  s.coverage = c.coverage === 'Partial' ? { kind: 'Partial', reason: 'Legacy source is not a complete general change log' } : { kind: 'CompleteSince', revision: 17 }
  s.records = c.progress.events.map((e, i): HistoricalRecord => ({ recordType: 'Event', recordId: e.eventId, sequence: i + 1, eventKind: 'LegacyStatus', taskIds: [e.taskId], recordedInRevision: null,
    recordedAt: e.recordedAt, effectiveDate: e.date, actorLabel: null, rationale: e.reason ?? null, links: [], payload: { legacyStatusEvent: json(e) } }))
  s.records.push(...c.work.entries.map((e): HistoricalRecord => ({ recordType: 'Work', recordId: e.entryId, taskIds: [e.taskId], taskId: e.taskId, operation: 'Record', correctsRecordId: null, hours: e.hours, recordedInRevision: null, recordedAt: e.createdAt, effectiveDate: e.workDate, actorLabel: null, rationale: e.description })))
  s.nextSequence = c.progress.events.length + 1
  // Explicitly authored target-only lifecycle evidence, not inference from a
  // missing legacy task. These population fixtures are not /2 validation claims.
  if (c.lifecycle !== 'Active') {
    const subject = s.tasks[0], common = { taskIds: ['T1'], recordedAt: '2026-11-09T15:00:00.000Z', effectiveDate: '2026-11-09', actorLabel: null, rationale: 'Authored synthetic lifecycle review' }
    const before = { ...subject, lifecycle: { kind: 'Active' as const, lastDecisionId: null } }
    const retireRevision = c.lifecycle === 'Retired' ? 17 : 16
    s.records.push(
      { ...common, recordType: 'Lifecycle', recordId: 'L-retire', taskId: 'T1', operation: 'Retire', priorDecisionId: null, recordedInRevision: retireRevision, reviewId: 'R-retire', sourceEventId: 'E-retire', before, beforeWorking: s.working },
      { ...common, recordType: 'Archive', recordId: 'AR-T1-T2', taskIds: ['T1', 'T2'], recordedInRevision: retireRevision, predecessorId: 'T1', successorId: 'T2', reviewId: 'R-retire', sourceEventId: 'E-review-retire' },
      { ...common, recordType: 'Review', recordId: 'R-retire', taskIds: ['T1', 'T2'], recordedInRevision: retireRevision, sourceRevision: retireRevision - 1, targetRevision: retireRevision, subjectTaskIds: ['T1'], affectedTaskIds: ['T1', 'T2'], outcomes: [{ taskId: 'T1', predecessorIds: [], rationale: 'Retire explicit subject' }, { taskId: 'T2', predecessorIds: [], rationale: 'Remove reviewed edge' }], archiveIds: ['AR-T1-T2'], addedEdges: [], sourceEventId: 'E-review-retire' },
      { ...common, recordType: 'Event', recordId: 'E-retire', recordedInRevision: retireRevision, sequence: s.nextSequence++, eventKind: 'TaskRetired', links: ['L-retire'], payload: { decisionId: 'L-retire' } },
      { ...common, recordType: 'Event', recordId: 'E-review-retire', taskIds: ['T1','T2'], recordedInRevision: retireRevision, sequence: s.nextSequence++, eventKind: 'ScopeReview', links: ['R-retire'], payload: { reviewId: 'R-retire' } },
    )
    if (c.lifecycle === 'Restored') s.records.push(
      { ...common, recordType: 'Lifecycle', recordId: 'L-restore', recordedInRevision: 17, taskId: 'T1', operation: 'Restore', priorDecisionId: 'L-retire', reviewId: 'R-restore', sourceEventId: 'E-restore', before: { ...subject, lifecycle: { kind: 'Retired', lastDecisionId: 'L-retire' } }, beforeWorking: s.working },
      { ...common, recordType: 'Review', recordId: 'R-restore', recordedInRevision: 17, taskIds: ['T1','T2'], sourceRevision: 16, targetRevision: 17, subjectTaskIds: ['T1'], affectedTaskIds: ['T1','T2'], outcomes: [{ taskId: 'T1', predecessorIds: [], rationale: 'Explicit restoration' }, { taskId: 'T2', predecessorIds: ['T1'], rationale: 'Explicit reconnected edge' }], archiveIds: [], addedEdges: [{ predecessorId: 'T1', successorId: 'T2', reinstatesArchiveIds: ['AR-T1-T2'] }], sourceEventId: 'E-review-restore' },
      { ...common, recordType: 'Event', recordId: 'E-restore', recordedInRevision: 17, sequence: s.nextSequence++, eventKind: 'TaskRestored', links: ['L-restore'], payload: { decisionId: 'L-restore' } },
      { ...common, recordType: 'Event', recordId: 'E-review-restore', recordedInRevision: 17, taskIds: ['T1','T2'], sequence: s.nextSequence++, eventKind: 'ScopeReview', links: ['R-restore'], payload: { reviewId: 'R-restore' } },
    )
  }
  s.workAvailable = Object.fromEntries(c.tasks.map(t => [t.taskId, true]))
  s.totals = Object.fromEntries(c.tasks.map(t => [t.taskId, { kind: 'RecordedSum', hours: c.work.entries.filter(e => e.taskId === t.taskId).reduce((n, e) => n + Math.round(e.hours * 100), 0) / 100, completeness: 'RecordedDataOnly', actualTotal: 'Unknown', throughRevision: 17 }]))
  return s
}
export function referenceFor(c: LegacyCase) {
  return new ReferenceOperationalHistoryRepository('WP746', [seedFor(c)], { fingerprint: fixtureFingerprint, validate: validateFixtureChange })
}
