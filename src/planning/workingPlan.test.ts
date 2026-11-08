import { describe, expect, test } from 'vitest'
import { evaluateWorkingCandidate } from './workingPlan'
import type { WorkingInput, WorkingResult } from './workingPlan'
import { at, affected, caseInput, date, fixture, floor, literalAnswers, move } from './__fixtures__/cases'
import { calculateSchedule, createWorkingCalendar, dateToOrdinal } from '../domain'
import { establishBaseline } from '../baseline/baseline'
import { transitionTask } from '../progress/taskProgress'
import { benchmarkInput } from './__fixtures__/benchmark'

function freeze(value: unknown): void {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return
  if (value instanceof Map) {
    for (const item of value.values()) freeze(item)
    for (const key of ['set', 'delete', 'clear']) Object.defineProperty(value, key, { value: () => { throw new Error('Mutated read-only map') } })
  } else for (const child of Object.values(value)) freeze(child)
  Object.freeze(value)
}
const snapshot = (value: unknown) => JSON.stringify(value, (_, item) => item instanceof Map ? { map: [...item] } : item)
function success(input: WorkingInput): Extract<WorkingResult, { ok: true }> {
  const before = snapshot(input); freeze(input)
  const result = evaluateWorkingCandidate(input)
  expect(snapshot(input)).toBe(before)
  if (!result.ok) throw new Error(JSON.stringify(result.issues))
  return result
}
function known(input: WorkingInput, id: string) {
  const result = success(input), candidate = result.candidates.find(c => c.taskId === id)
  if (candidate?.kind !== 'Known') throw new Error(JSON.stringify(result))
  return candidate
}
function errors(input: WorkingInput) {
  const before = snapshot(input); freeze(input)
  const result = evaluateWorkingCandidate(input)
  expect(snapshot(input)).toBe(before)
  if (result.ok) throw new Error('Expected structured rejection')
  return result.issues.map(issue => issue.code)
}
describe('literal approved answers (expected dates never come from evaluator)', () => {
  test.each(literalAnswers)('%s %s -> %i H%i / %i afterH%i', (id, taskId, start, hour, end, afterHour) => {
    const candidate = known(caseInput(id), taskId)
    expect(candidate.start).toEqual(at(start, hour))
    expect(candidate.finish).toEqual({ date: date(end), afterHour })
  })
  test('C01 condition both sides: floor Nov9, second actual release Nov12 -> computed Nov12', () => {
    let input = fixture([{ id: 'A', duration: 4, start: 2, end: 2 }, { id: 'P', duration: 4, start: 2, end: 2 }, { id: 'B', duration: 4, start: 9, end: 9, predecessors: ['A', 'P'] }], 11)
    input = affected(move(move(input, 'A', 'Complete', 9), 'P', 'Complete', 11), ['B'], true)
    const result = known(input, 'B')
    expect(result.notBefore).toEqual(at(9))
    expect(result.start).toEqual(at(12))
    expect(result.binding).toEqual([{ kind: 'Predecessor', predecessorId: 'P', eventId: 'E1', precision: 'ConservativeActualDate', slot: at(12) }])
  })
  test('C03 exact H3 hold is a separate winning bound', () => {
    const result = known(caseInput('C03'), 'B')
    expect(result.notBefore).toEqual(at(9))
    expect(result.binding).toEqual([{ kind: 'Hold', slot: at(9, 3), precision: 'PlannedSlot' }])
  })
  test('C06/E14 retain both tied releases, never choose first ID', () => {
    for (const id of ['C06', 'E14']) expect(known(caseInput(id), 'J').binding.filter(b => b.predecessorId).map(b => b.predecessorId)).toEqual(['A', 'B'])
  })
  test('C07 keeps historical completion/ref2 and computes project10 without summing task shifts', () => {
    const input = caseInput('C07'), original = snapshot(input.progress), result = success(input)
    expect(result.project).toMatchObject({ kind: 'Conditional', date: date(10), finish: { date: date(10), afterHour: 4 } })
    expect(snapshot(input.progress)).toBe(original)
    expect(dateToOrdinal(input.progress.events[0].date) - dateToOrdinal(input.progress.events[0].committedFinishDateAtCompletion!)).toBe(4)
  })
  test('C08 Advance does not accelerate its unreviewed child', () => {
    const result = success(caseInput('C08-advance'))
    expect(result.candidates.find(c => c.taskId === 'C')).toMatchObject({ kind: 'Retained', currentCommitment: { start: at(17), finish: { date: date(17), afterHour: 4 } }, feasibilityIssues: [] })
    expect(result.project.date).toBe(date(17))
  })
  test('C09 unknown second predecessor prevents a definite commitment', () => {
    const result = success(move(caseInput('C09'), 'P', 'In Progress', 11))
    expect(result.candidates.find(c => c.taskId === 'B')).toMatchObject({ kind: 'Unknown' })
    expect(result.requiredReviewIds).toEqual(['P'])
    expect(result.project.kind).toBe('Unknown')
  })
  test('C10 rejects backdated plan; separate attested actual start still gives no finish', () => {
    expect(errors(caseInput('C10'))).toContain('PAST_PLANNED_FLOOR')
    let input = { ...caseInput('C08'), reviewDate: date(16) }
    expect(known(input, 'B').start).toEqual(at(16))
    input = { ...move(input, 'B', 'In Progress', 12), actualStarts: new Map([['B', { kind: 'Known' as const, date: date(12), eventId: 'S-B' }]]) }
    expect(success(input).candidates.find(c => c.taskId === 'B')).toMatchObject({ kind: 'Unknown' })
  })
  test('C12 raw requested Tue3 stays outside Slot API; caller-normalized literal Thu5 retained', () => {
    const envelope = { requestedDate: date(3), input: caseInput('C12') }
    const before = snapshot(envelope); freeze(envelope)
    expect(createWorkingCalendar(envelope.input.project).firstSlotOnOrAfter(envelope.requestedDate)).toEqual(at(5))
    expect(known(envelope.input, 'B').notBefore).toEqual(at(5))
    expect(snapshot(envelope)).toBe(before)
  })
})
describe('E13-E18 and evidence precision', () => {
  test('E13 diamond is canonical, deduplicated, and includes both joining planned bounds', () => {
    const result = success(caseInput('E13'))
    expect(result.topologicalIds).toEqual(['A', 'B', 'C', 'D'])
    expect(result.candidates.map(c => c.taskId)).toEqual(['A', 'B', 'C', 'D'])
    expect(known(caseInput('E13'), 'D').binding.filter(b => b.predecessorId).map(b => b.predecessorId)).toEqual(['B', 'C'])
  })
  test('E15 overdue external promise retained; joins require prerequisite review', () => {
    const result = success(caseInput('E15'))
    expect(result.requiredReviewIds).toEqual(['P'])
    expect(result.candidates.find(c => c.taskId === 'P')).toMatchObject({ kind: 'Retained', currentCommitment: { start: at(2) } })
    expect(result.candidates.find(c => c.taskId === 'J')).toMatchObject({ kind: 'Unknown', reasons: ['P: required readiness is Unknown.'] })
    expect(result.project).toMatchObject({ kind: 'Unknown', date: null, finish: null })
  })
  test.each(['In Progress', 'Blocked', 'reopened'] as const)('E16 %s stays Unknown with person-hours4 or0', status => {
    let input = caseInput('E15')
    input = status === 'reopened' ? move(move(input, 'P', 'Complete', 2), 'P', 'Not Started', 5) : move(input, 'P', status, 3)
    const answers = [0, 4].map(hours => {
      const envelope = { input, effort: { remainingHours: { P: hours, J: hours }, entries: [] } }
      const before = snapshot(envelope); freeze(envelope)
      const result = success(envelope.input)
      expect(snapshot(envelope)).toBe(before)
      expect(result.candidates.every(c => c.kind === 'Unknown')).toBe(true)
      return result
    })
    expect(answers[0]).toEqual(answers[1])
  })
  test('E17 self, missing, repeated edge, cycle and overflow reject atomically', () => {
    const input = caseInput('C07')
    for (const [ids, code] of [[['A'], 'SELF_DEPENDENCY'], [['missing'], 'MISSING_PREDECESSOR'], [['B', 'B'], 'DUPLICATE_PREDECESSOR'], [['C'], 'DEPENDENCY_CYCLE']] as const) {
      expect(errors({ ...input, tasks: input.tasks.map(t => t.taskId === 'A' ? { ...t, predecessorTaskIds: [...ids] } : t) })).toContain(code)
    }
    expect(errors({ ...input, tasks: input.tasks.map(t => ({ ...t, durationHours: Number.MAX_SAFE_INTEGER })) })).toContain('DATE_OUT_OF_RANGE')
  })
  test('E18 future completion remains evidence, never observed readiness', () => {
    const input = caseInput('E18'), result = success(input)
    expect(result.candidates.every(c => c.kind === 'Unknown')).toBe(true)
    expect(result.candidates.some(c => c.kind === 'ActualOnly')).toBe(false)
    expect(result.project.date).toBeNull()
    expect(input.progress.events[0].date).toBe(date(9))
  })
  test('contradictory recorded completions remain facts with explicit global qualification', () => {
    const input = move(caseInput('C07'), 'B', 'Complete', 4, 3), result = success(input)
    expect(result.conflicts).toEqual(['B: completion 2026-11-04 precedes retained predecessor A completion 2026-11-06.'])
    expect(result.candidates.find(c => c.taskId === 'B')).toMatchObject({ kind: 'ActualOnly', actualDate: date(4), release: at(5) })
    expect(result.project.kind).toBe('Unknown')
    expect(known(input, 'C').start).toEqual(at(6)) // conditional local date, never a certified project
  })
  test('actual start bypass is flagged, not repaired; same-date order is unverified, not a conflict', () => {
    const bypass = { ...move(caseInput('C07'), 'B', 'In Progress', 3), actualStarts: new Map([['B', { kind: 'Known' as const, date: date(3), eventId: 'S-B' }]]) }
    expect(success(bypass).conflicts.join(' ')).toContain('actual start 2026-11-03 precedes')
    const equal = success(move(caseInput('C07'), 'B', 'Complete', 6, 3))
    expect(equal.conflicts).toEqual([])
    expect(equal.candidates.find(c => c.taskId === 'B')).toMatchObject({ kind: 'ActualOnly', release: at(9) })
  })
  test('actual start after own completion qualifies the project without moving completion', () => {
    const input = { ...caseInput('C07'), actualStarts: new Map([['A', { kind: 'Known' as const, date: date(7), eventId: 'S-A' }]]) }
    const result = success(input)
    expect(result.conflicts.join(' ')).toContain('actual start 2026-11-07 follows completion 2026-11-06')
    expect(result.project.kind).toBe('Unknown')
    expect(result.candidates[0]).toMatchObject({ kind: 'ActualOnly', actualDate: date(6) })
  })
  test('last recorded completion wins even when corrected effective date goes backwards', () => {
    let input = move(move(caseInput('C07'), 'A', 'In Progress', 7), 'A', 'Complete', 4, 2)
    input = { ...input, reviewDate: date(4) }
    expect(success(input).candidates[0]).toMatchObject({ kind: 'ActualOnly', actualDate: date(4), release: at(5) })
    expect(known(input, 'B').start).toEqual(at(5))
    expect(input.progress.events.filter(e => e.toStatus === 'Complete').map(e => e.date)).toEqual([date(6), date(4)])
  })
  test('nonworking Saturday actual is not snapped to Monday; release is Monday', () => {
    const input = { ...caseInput('C01'), reviewDate: date(9) }
    const base = fixture([{ id: 'A', duration: 20, start: 2, end: 6 }, { id: 'B', duration: 4, start: 9, end: 9, predecessors: ['A'] }], 9)
    const result = success(affected(move(base, 'A', 'Complete', 7, 6), ['B'], true))
    expect(result.candidates[0]).toMatchObject({ kind: 'ActualOnly', actualDate: date(7), release: at(9) })
    expect(known(input, 'B').start).toEqual(at(10))
  })
  test('date-only actual tying latest planned date leaves project hour unknown', () => {
    const input = affected(move(fixture([{ id: 'A', duration: 4, start: 2, end: 2 }, { id: 'B', duration: 2, start: 6, end: 6, after: 2, manual: 6 }]), 'A', 'Complete', 6), ['B'])
    expect(success(input).project).toEqual({ kind: 'Conditional', date: date(6), finish: null, uncertain: false })
  })
})
describe('validation, independent bounds and immutable callers', () => {
  test('root manual bound controls; retained dependent manual is inactive', () => {
    const root = affected(fixture([{ id: 'R', duration: 4, start: 9, end: 9, floor: 6, manual: 9 }]), ['R'])
    expect(known(root, 'R').binding).toEqual([{ kind: 'Floor', source: 'IndependentRoot', slot: at(9), precision: 'PlannedSlot' }])
    const input = caseInput('C07')
    const dependent = { ...input, tasks: input.tasks.map(t => t.taskId === 'B' ? { ...t, independentStartMode: 'MANUAL' as const, requestedStartDate: date(30) } : t) }
    expect(known(dependent, 'B').start).toEqual(at(9))
  })
  test('a new root needs an explicit affected floor and null hold; it does not inherit an old promise', () => {
    const original = fixture([{ id: 'R', duration: 4, start: 6, end: 6 }])
    const input = { ...affected(original, ['R']), current: { ...original.current, constraints: {}, commitments: {} } }
    expect(known(input, 'R')).toMatchObject({ notBefore: at(6), start: at(6), finish: { date: date(6), afterHour: 4 } })
    expect(errors({ ...input, affectedIds: [] })).toContain('UNAFFECTED_EDIT')
  })
  test('known/corrected/retracted resolved starts never manufacture remaining duration', () => {
    const input = move(affected(fixture([{ id: 'R', duration: 4, start: 2, end: 2 }]), ['R']), 'R', 'In Progress', 3)
    const facts = [{ kind: 'Known' as const, date: date(2), eventId: 'S1' }, { kind: 'Known' as const, date: date(1), eventId: 'S2' }, { kind: 'Unknown' as const }]
    const results = facts.map(fact => success({ ...input, actualStarts: new Map([['R', fact]]) }))
    expect(results[0]).toEqual(results[1]); expect(results[1]).toEqual(results[2])
    expect(results[0].project.kind).toBe('Unknown')
  })
  test('old commitment validates on old calendar; candidate Keep uses new duration/calendar', () => {
    const input = caseInput('C03')
    const changed = { ...input, project: { ...input.project, workingWeekdays: [1, 4, 5] as const, workingHoursPerDay: 3 } }
    expect(known(changed, 'B')).toMatchObject({ start: at(9, 3), finish: { date: date(12), afterHour: 1 } })
  })
  test.each([
    ['MISSING_FLOOR', (i: WorkingInput) => ({ ...i, proposedFloors: new Map() })],
    ['MISSING_HOLD', (i: WorkingInput) => ({ ...i, holds: new Map() })],
    ['INVALID_HOLD', (i: WorkingInput) => ({ ...i, holds: new Map([['B', at(9)]]) })],
    ['UNKNOWN_INPUT_ID', (i: WorkingInput) => ({ ...i, actualStarts: new Map([['absent', { kind: 'Unknown' as const }]]) })],
    ['INVALID_AFFECTED_IDS', (i: WorkingInput) => ({ ...i, affectedIds: ['B', 'B'] })],
    ['INVALID_SLOT', (i: WorkingInput) => floor(i, 'B', 7)],
    ['INVALID_SLOT', (i: WorkingInput) => floor(i, 'B', 9, 5)],
    ['INVALID_DATE', (i: WorkingInput) => ({ ...i, reviewDate: '2026-02-30' })],
    ['UNAFFECTED_EDIT', (i: WorkingInput) => floor(i, 'P', 12)],
  ] as const)('%s is rejected without partial output', (code, edit) => { expect(errors(edit(caseInput('C03')))).toContain(code) })
  test('malformed runtime shapes and status history rejected rather than thrown', () => {
    expect(evaluateWorkingCandidate(null as unknown as WorkingInput)).toMatchObject({ ok: false })
    expect(errors({ ...caseInput('C03'), holds: [] as unknown as WorkingInput['holds'] })).toContain('INVALID_MAP')
    expect(errors({ ...caseInput('C03'), progress: { schemaVersion: 1, definitionOfDone: '', tasks: { P: { status: 'Complete', criteria: [] } }, events: [] } })).toContain('STATUS_HISTORY_MISMATCH')
  })
  test('ReferenceOnly cannot supply a Keep hold or feasible external predecessor', () => {
    const input = caseInput('C03'), old = input.current.commitments.B
    const current = { ...input.current, commitments: { ...input.current.commitments, B: { ...old, kind: 'ReferenceOnly' as const, reason: 'Unknown evidence' } } }
    expect(errors({ ...input, current })).toContain('INVALID_HOLD')
    const other = { ...caseInput('E15'), current: { ...caseInput('E15').current, commitments: { ...caseInput('E15').current.commitments, P: { kind: 'ReferenceOnly' as const, start: null, finish: null, reason: 'Unknown evidence', decisionId: 'D-P' } } } }
    expect(success(other).requiredReviewIds).toEqual(['P'])
  })
  test('permutations of tasks, edges, maps and affected IDs have the same canonical result', () => {
    const input = caseInput('E13'), expected = success(input)
    const permuted = { ...input, tasks: [...input.tasks].reverse().map(t => ({ ...t, predecessorTaskIds: [...t.predecessorTaskIds].reverse() })), affectedIds: [...input.affectedIds].reverse(), proposedFloors: new Map([...input.proposedFloors].reverse()), holds: new Map([...input.holds].reverse()) }
    expect(success(permuted)).toEqual(expected)
  })
  test('baseline, historical events, source schedule and effort envelope remain byte-for-value unchanged', () => {
    const input = caseInput('C07'), beforeSchedule = calculateSchedule(input.project, input.tasks)
    const baseline = establishBaseline({ project: input.project, tasks: input.tasks, nextTaskNumber: 50 }, 'BL-original', '2026-11-01T12:00:00.000Z')
    if (!baseline.ok) throw new Error(JSON.stringify(baseline.errors))
    const envelope = { input, baseline: baseline.value, effort: { entries: [], remainingHours: { A: 0, B: 99, C: null } } }
    const before = snapshot(envelope); freeze(envelope)
    success(input)
    expect(snapshot(envelope)).toBe(before)
    expect(calculateSchedule(input.project, input.tasks)).toEqual(beforeSchedule)
  })
  test('output does not expose mutable aliases into old promises or input floor maps', () => {
    const input = caseInput('C03'), result = evaluateWorkingCandidate(input)
    if (!result.ok) throw new Error('Expected success')
    const retained = result.candidates.find(c => c.taskId === 'P'), proposed = result.candidates.find(c => c.taskId === 'B')
    if (retained?.kind !== 'Retained' || proposed?.kind !== 'Known') throw new Error('Expected rows')
    ;(retained.currentCommitment.start as { date: string }).date = date(30)
    ;(proposed.notBefore as { date: string }).date = date(30)
    expect(input.current.commitments.P.start).toEqual(at(9))
    expect(input.proposedFloors.get('B')).toEqual(at(9))
    expect(Object.isFrozen(input)).toBe(false)
  })
})
describe('range and graph-size boundaries', () => {
  function lastDate(withChild = false): WorkingInput {
    const original = fixture([{ id: 'R', duration: 1, start: 2, end: 2, after: 1 }], 2)
    const last = '9999-12-31'
    const project = { ...original.project, projectStartDate: last, targetEndDate: last }
    const tasks = withChild ? [...original.tasks, { ...original.tasks[0], taskId: 'Q', predecessorTaskIds: ['R'] }] : original.tasks
    const constraints = Object.fromEntries(tasks.map(t => [t.taskId, { notBefore: { date: last, hour: 1 }, origin: 'Confirmed' as const, decisionId: `D-${t.taskId}` }]))
    const commitments = Object.fromEntries(tasks.map(t => [t.taskId, { kind: 'Known' as const, start: { date: last, hour: t.taskId === 'R' ? 1 : 2 }, finish: { date: last, afterHour: t.taskId === 'R' ? 1 : 2 }, decisionId: `D-${t.taskId}` }]))
    return { ...original, project, tasks, current: { ...original.current, calendar: project, constraints, commitments }, proposedFloors: new Map(tasks.map(t => [t.taskId, { date: last, hour: 1 }])), affectedIds: tasks.map(t => t.taskId), holds: new Map(tasks.map(t => [t.taskId, null])), reviewDate: last }
  }
  test('empty project has no invented finish', () => { expect(success(fixture([])).project).toEqual({ kind: 'Conditional', date: null, finish: null, uncertain: false }) })
  test('first supported year uses global slot zero correctly', () => {
    const original = affected(fixture([{ id: 'R', duration: 1, start: 2, end: 2, after: 1 }]), ['R'])
    const input = { ...original, project: { ...original.project, projectStartDate: '0001-01-01', targetEndDate: '0001-01-02' }, proposedFloors: new Map([['R', { date: '0001-01-01', hour: 1 }]]), reviewDate: '0001-01-01' }
    expect(known(input, 'R')).toMatchObject({ start: { date: '0001-01-01', hour: 1 }, finish: { date: '0001-01-01', afterHour: 1 } })
  })
  test('last-date planned leaf and actual leaf do not need a fictitious next-year slot', () => {
    const input = lastDate()
    expect(known(input, 'R').finish).toEqual({ date: '9999-12-31', afterHour: 1 })
    const changed = transitionTask(input.progress, 'R', { target: 'Complete', eventId: 'E-last', date: '9999-12-31', recordedAt: '9999-12-31T12:00:00.000Z', completionAcknowledged: true, noCriteriaAcknowledged: true }, ['R'])
    if (!changed.ok) throw new Error('Invalid fixture')
    const result = success({ ...input, progress: changed.value })
    expect(result.candidates[0]).toEqual({ kind: 'ActualOnly', taskId: 'R', actualDate: '9999-12-31', release: null })
    expect(result.project).toEqual({ kind: 'Actual', date: '9999-12-31', finish: null, uncertain: false })
  })
  test('required release beyond supported dates rejects, never clamps actual to a planned slot', () => {
    const input = lastDate(true)
    const changed = transitionTask(input.progress, 'R', { target: 'Complete', eventId: 'E-last', date: '9999-12-31', recordedAt: '9999-12-31T12:00:00.000Z', completionAcknowledged: true, noCriteriaAcknowledged: true }, input.tasks.map(t => t.taskId))
    if (!changed.ok) throw new Error('Invalid fixture')
    expect(errors({ ...input, progress: changed.value })).toContain('DATE_OUT_OF_RANGE')
  })
  test('already completed successor needs no new planned release beyond year9999', () => {
    let input = affected(fixture([{ id: 'R', duration: 4, start: 2, end: 2 }, { id: 'Q', duration: 1, start: 3, end: 3, after: 1, predecessors: ['R'] }]), ['R'])
    input = move(input, 'Q', 'Complete', 3, 3)
    input = { ...input, reviewDate: '9999-12-31', proposedFloors: new Map([...input.proposedFloors, ['R', { date: '9999-12-31', hour: 1 }]]) }
    expect(known(input, 'R').finish).toEqual({ date: '9999-12-31', afterHour: 4 })
    expect(success(input).candidates.find(c => c.taskId === 'Q')).toMatchObject({ kind: 'ActualOnly', actualDate: date(3) })
  })
  test.each([[30, '2026-12-17'], [40, '2026-12-31']] as const)('chain%i from reviewNov6 has independently counted final date%s', (size, end) => {
    const result = success(benchmarkInput(size, 'chain'))
    expect(result.project).toMatchObject({ kind: 'Conditional', date: end, finish: { date: end, afterHour: 4 } })
  })
  test('300-node repeated diamonds do not enumerate exponentially many paths; 1200-chain is iterative', () => {
    for (const [size, shape] of [[300, 'diamond'], [1200, 'chain']] as const) {
      const result = success(benchmarkInput(size, shape))
      expect(result.candidates).toHaveLength(size)
      expect(new Set(result.topologicalIds).size).toBe(size)
      expect(result.candidates.every(c => c.kind === 'Known')).toBe(true)
    }
  })
  test('arbitrary stable IDs including Object prototype names retain exact identity', () => {
    const input = affected(fixture([{ id: '__proto__', duration: 4, start: 2, end: 2 }, { id: 'constructor', duration: 4, start: 3, end: 3, predecessors: ['__proto__'] }], 2), ['__proto__', 'constructor'], true)
    expect(known(input, 'constructor').start).toEqual(at(3))
  })
})
