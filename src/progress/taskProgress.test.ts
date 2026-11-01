// @vitest-environment node
import { expect, test } from 'vitest'
import { calculateSchedule } from '../domain'
import { workBaseline, workData, workRecords } from '../test/workFixture'
import { decodeProgress, duplicateProgress, emptyProgress, latestCompletion, progressForTask, removeTaskProgress, replaceCriteria, transitionTask } from './taskProgress'
import type { CompletionCriterion, ProgressTracking, TransitionRequest } from './taskProgress'

const ids = ['T2', 'T9', 'T20']
const items: CompletionCriterion[] = [{ criterionId: 'C-1', text: 'Login accepts valid credentials', checked: false }, { criterionId: 'C-2', text: 'Login rejects invalid credentials', checked: false }]
const timestamp = '2026-11-01T12:00:00.000Z'
function ok(result: ReturnType<typeof decodeProgress>): ProgressTracking { if (!result.ok) throw new Error(JSON.stringify(result.errors)); return result.value }
function withCriteria() { return ok(replaceCriteria(emptyProgress(), 'T2', items, ids)) }
function move(tracking: ProgressTracking, target: TransitionRequest['target'], extra: Partial<TransitionRequest> = {}) {
  return transitionTask(tracking, 'T2', { target, eventId: `E-${tracking.events.length + 1}`, date: '2026-11-01', recordedAt: timestamp, ...extra }, ids)
}
function complete() { return ok(move(withCriteria(), 'Complete', { completionAcknowledged: true, criteria: items.map(item => ({ ...item, checked: true })), note: 'Demonstrated both cases' })) }

test('A01/A02 only four explicit statuses; safe default has no events and ordinary transitions form history', () => {
  const original = emptyProgress()
  expect(progressForTask(original, 'T2')).toEqual({ status: 'Not Started', criteria: [] })
  const started = ok(move(original, 'In Progress'))
  const reset = ok(move(started, 'Not Started'))
  expect(reset.events.map(event => [event.fromStatus, event.toStatus])).toEqual([['Not Started', 'In Progress'], ['In Progress', 'Not Started']])
  expect(original.events).toEqual([])
})

test('A03/A04 blocked reason is required and leaving Blocked clears active reason while retaining history', () => {
  expect(move(emptyProgress(), 'Blocked').ok).toBe(false)
  expect(move(emptyProgress(), 'Blocked', { reason: ' ' }).ok).toBe(false)
  const blocked = ok(move(emptyProgress(), 'Blocked', { reason: '  Waiting for test data  ' }))
  expect(progressForTask(blocked, 'T2').blockedReason).toBe('Waiting for test data')
  const started = ok(move(blocked, 'In Progress'))
  expect(progressForTask(started, 'T2')).not.toHaveProperty('blockedReason')
  expect(started.events[0].reason).toBe('Waiting for test data')
})

test('A05/A06 completion requires explicit acknowledgement and all criteria, or an explicit no-criteria acknowledgement', () => {
  expect(move(withCriteria(), 'Complete').ok).toBe(false)
  expect(move(withCriteria(), 'Complete', { completionAcknowledged: true }).ok).toBe(false)
  expect(move(emptyProgress(), 'Complete', { completionAcknowledged: true }).ok).toBe(false)
  const result = ok(move(emptyProgress(), 'Complete', { completionAcknowledged: true, noCriteriaAcknowledged: true }))
  expect(result.events[0]).toMatchObject({ criteriaSnapshot: [], completionAcknowledged: true, noCriteriaAcknowledged: true })
  expect(progressForTask(result, 'T2').status).toBe('Complete')
})

test('A07/A09/A10 completing and reopening retain immutable dated snapshots and distinct events', () => {
  const finished = complete()
  const firstSnapshot = JSON.stringify(finished.events[0])
  expect(finished.events[0].criteriaSnapshot).toEqual(items.map(item => ({ ...item, checked: true })))
  expect(Object.isFrozen(finished.events[0].criteriaSnapshot![0])).toBe(true)
  expect(move(finished, 'In Progress', { reason: 'New test cases' }).ok).toBe(false)
  expect(move(finished, 'In Progress', { reopenAcknowledged: true }).ok).toBe(false)
  const reopened = ok(move(finished, 'In Progress', { reason: 'New test cases require revision', reopenAcknowledged: true }))
  const revised = ok(replaceCriteria(reopened, 'T2', [{ ...items[0], text: 'Login accepts updated credentials', checked: true }], ids))
  const again = ok(move(revised, 'Complete', { date: '2026-11-02', completionAcknowledged: true }))
  expect(JSON.stringify(again.events[0])).toBe(firstSnapshot)
  expect(again.events[2].criteriaSnapshot![0].text).toBe('Login accepts updated credentials')
  expect(new Set(again.events.map(event => event.eventId)).size).toBe(3)
  expect(latestCompletion(again, 'T2')!.date).toBe('2026-11-02')
  expect(replaceCriteria(finished, 'T2', [], ids).ok).toBe(false)
})

test('completion cannot bypass current criteria by deleting items, changing text or repurposing IDs', () => {
  for (const criteria of [[], [{ ...items[0], checked: true }], items.map(item => ({ ...item, text: 'Substituted criterion', checked: true }))]) {
    expect(move(withCriteria(), 'Complete', { completionAcknowledged: true, criteria }).ok).toBe(false)
  }
})

test.each(['Not Started', 'In Progress', 'Blocked'] as const)('all deliberate reopen targets retain completion evidence: %s', target => {
  const finished = complete()
  const reopened = ok(move(finished, target, { reopenAcknowledged: true, reason: 'Additional review is required' }))
  expect(progressForTask(reopened, 'T2').status).toBe(target)
  expect(reopened.events[0]).toEqual(finished.events[0])
  expect(progressForTask(reopened, 'T2').blockedReason).toBe(target === 'Blocked' ? 'Additional review is required' : undefined)
})

test('A11 copy uses new unchecked criteria with no status, blocked reason or events; source is unchanged', () => {
  const source = complete()
  const original = JSON.stringify(source)
  const copy = ok(duplicateProgress(source, 'T2', 'T20', ['C-NEW-1', 'C-NEW-2'], ids))
  expect(progressForTask(copy, 'T20')).toEqual({ status: 'Not Started', criteria: items.map((item, index) => ({ ...item, criterionId: `C-NEW-${index + 1}`, checked: false })) })
  expect(copy.events.filter(event => event.taskId === 'T20')).toEqual([])
  expect(JSON.stringify(source)).toBe(original)
  expect(duplicateProgress(source, 'T2', 'T20', ['C-1', 'C-2'], ids).ok).toBe(false)
})

test('A08 transitions preserve effort, schedule and original baseline and retain project guidance at completion', () => {
  const work = workRecords(); const baseline = workBaseline()
  const before = JSON.stringify([work, baseline, calculateSchedule(workData.project, workData.tasks)])
  const progress = ok(decodeProgress({ ...withCriteria(), definitionOfDone: 'Tests pass and notes are recorded' }, ids))
  const finished = ok(move(progress, 'Complete', { completionAcknowledged: true, criteria: items.map(item => ({ ...item, checked: true })) }))
  const changed = ok(decodeProgress({ ...finished, definitionOfDone: 'Later project definition' }, ids))
  expect(changed.events[0].definitionOfDone).toBe('Tests pass and notes are recorded')
  expect(JSON.stringify([work, baseline, calculateSchedule(workData.project, workData.tasks)])).toBe(before)
})

test.each([
  null, { schemaVersion: 99 }, { ...emptyProgress(), definitionOfDone: 'x'.repeat(2001) },
  { ...emptyProgress(), tasks: { T2: { status: 'Ready for Review', criteria: [] } } },
  { ...emptyProgress(), tasks: { T2: { status: 'Complete', criteria: [] } } },
  { ...emptyProgress(), tasks: { missing: { status: 'Not Started', criteria: [] } } },
  { ...withCriteria(), tasks: { T2: { status: 'Not Started', criteria: [items[0], items[0]] } } },
  { ...withCriteria(), tasks: { T2: progressForTask(withCriteria(), 'T2'), T9: progressForTask(withCriteria(), 'T2') } },
  { ...complete(), events: [...complete().events, complete().events[0]] },
  { ...complete(), events: [{ ...complete().events[0], taskId: 'missing' }] },
  { ...complete(), events: [{ ...complete().events[0], fromStatus: 'Blocked' }] },
  { ...complete(), events: [{ ...complete().events[0], date: '2026-02-30' }] },
  { ...complete(), events: [{ ...complete().events[0], criteriaSnapshot: [{ ...items[0], checked: false }] }] },
  { ...complete(), events: [{ ...complete().events[0], completionAcknowledged: false }] },
  { ...complete(), events: [{ ...complete().events[0], criteriaSnapshot: null }] },
  { ...complete(), tasks: { T2: { status: 'Complete', criteria: [] } } },
])('A13 malformed progress structure/history is rejected %#', value => {
  expect(decodeProgress(value, ids).ok).toBe(false)
})

test('confirmed task cleanup removes only its status/criteria/events and leaves other task decisions intact', () => {
  const first = complete()
  const both = ok(transitionTask(first, 'T9', { target: 'In Progress', eventId: 'E-OTHER', date: '2026-11-01', recordedAt: timestamp }, ids))
  const cleaned = removeTaskProgress(both, 'T2')
  expect(cleaned.events.map(event => event.taskId)).toEqual(['T9'])
  expect(cleaned.tasks).not.toHaveProperty('T2')
  expect(first.events).toHaveLength(1)
  expect(decodeProgress(cleaned, ['T9', 'T20']).ok).toBe(true)
})
