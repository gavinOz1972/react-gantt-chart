import { describe, expect, test } from 'vitest'
import { historyAsOf, historyFile } from '../test/historyFixture'
import type { HistoryCase } from '../test/historyFixture'
import { calculateSchedule } from '../domain'
import { calculateProgressImpact } from '../projection/progressImpact'
import { parseProject, serializeProject } from '../persistence/projectFile'
import { createTimelineAxis, projectTimeline } from './projection'
import type { TimelineMode } from './projection'
import { elapsedOverrun, hasPrimaryPA, historicalDates, historyCaption, presentImpactRelations, subordinateCommitment } from './historyPresentation'

function view(kind: HistoryCase = 'late', mode: TimelineMode = 'expanded') {
  const file = historyFile(kind), before = serializeProject(file)
  const schedule = calculateSchedule(file.project, file.tasks)
  const impact = calculateProgressImpact({ project: file.project, tasks: file.tasks, progress: file.taskProgress!, asOf: historyAsOf(kind) })
  if (!schedule.ok || !impact.ok) throw new Error('Expected validated fictional fixture')
  const axis = createTimelineAxis(file.project, schedule.tasks, mode, historicalDates(file.project, impact))
  const rows = projectTimeline(axis, file.tasks, schedule.tasks).rows
  const relations = presentImpactRelations(axis, file.project, rows, impact)
  expect(serializeProject(file)).toBe(before)
  return { file, impact, axis, relations, rows }
}
for (const mode of ['expanded', 'compressed'] as const) describe(mode, () => {
  test('four calendar days of lateness from saved historical reference, without invented hours', () => {
    const { impact, axis } = view('late', mode), a = impact.tasks[0]
    const overrun = elapsedOverrun(axis, a)!
    expect(overrun.calendarDays).toBe(4)
    expect(overrun.label).toContain('not continuous work, actual effort, scheduled slots or project delay')
    expect(overrun.start.unit).toBe(axis.dayEnd(axis.startOrdinal))
    expect(historyCaption(a)).toContain('Completed late +4 calendar days')
    expect(subordinateCommitment(a)).toBe(true)
  })
  test('Friday actual releases on Monday Nov9, with original committed graph intact', () => {
    const { impact, relations } = view('late', mode), b = impact.tasks[1]
    expect(b.start).toEqual({ date: '2026-11-09', hour: 1 })
    expect(hasPrimaryPA(b)).toBe(true); expect(subordinateCommitment(b)).toBe(true)
    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({ kind: 'actual-release', release: { date: '2026-11-09', hour: 1 } })
    expect(relations[0].label).toContain('not an actual finish hour')
    expect(b.committed.startDate).toBe('2026-11-03')
  })
  test('nonworking actual is preserved; compressed-only elapsed gaps use a collapsed symbol', () => {
    const { impact, axis, relations } = view('weekend', mode)
    const overrun = elapsedOverrun(axis, impact.tasks[0])!
    expect(overrun.calendarDays).toBe(1)
    expect(overrun.collapsed).toBe(mode === 'compressed')
    expect(relations[0].release?.date).toBe('2026-11-09')
    expect(impact.tasks[0].completion?.date).toBe('2026-11-07')
    expect(impact.project.calendarDays).toBe(0)
  })
  test('actual lateness remains visible with no project delay or no successors', () => {
    const absorbed = view('absorbed', mode), leaf = view('leaf', mode)
    expect(absorbed.impact.project).toMatchObject({ date: '2026-11-10', shiftSlots: '0' })
    expect(elapsedOverrun(absorbed.axis, absorbed.impact.tasks[0])).not.toBeNull()
    expect(elapsedOverrun(leaf.axis, leaf.impact.tasks[0])).not.toBeNull()
    expect(leaf.relations).toEqual([])
  })
  test('every tied actual predecessor retains its own release relation', () => {
    const { relations, impact } = view('tied', mode)
    expect(relations.map(r => [r.predecessorId, r.successorId, r.release?.date])).toEqual([['T1', 'T3', '2026-11-09'], ['T2', 'T3', '2026-11-09']])
    expect(impact.tasks[2].binding.filter(b => b.predecessorId).map(b => b.predecessorId)).toEqual(['T1', 'T2'])
  })
  for (const kind of ['future', 'started', 'blocked', 'reopened', 'conflict'] as const) test(`${kind} never invents a precise shifted connector`, () => {
    const { relations, impact } = view(kind, mode)
    expect(relations.every(r => r.kind === 'unknown')).toBe(true)
    expect(impact.project.uncertain).toBe(true)
    if (kind === 'conflict') expect(impact.tasks[1].completion?.date).toBe('2026-11-03')
    else expect(impact.tasks[1].finish).toBeNull()
  })
  for (const kind of ['on-time', 'early', 'missing-reference'] as const) test(`${kind} never fabricates an overrun`, () => {
    const { axis, impact } = view(kind, mode)
    expect(elapsedOverrun(axis, impact.tasks[0])).toBeNull()
    if (kind === 'on-time') expect(subordinateCommitment(impact.tasks[1])).toBe(false)
    if (kind === 'missing-reference') expect(historyCaption(impact.tasks[0])).toContain('Historical comparison unavailable')
  })
})
test('edited current plan never substitutes for the active event historical date', () => {
  const { file } = view()
  const tasks = file.tasks.map(t => ({ ...t, durationHours: t.taskId === 'T1' ? 20 : t.durationHours }))
  const impact = calculateProgressImpact({ project: file.project, tasks, progress: file.taskProgress!, asOf: '2026-11-06' })
  const schedule = calculateSchedule(file.project, tasks)
  if (!impact.ok || !schedule.ok) throw new Error('Expected valid edited plan')
  expect(impact.tasks[0].committed.finishDate).toBe('2026-11-06')
  const axis = createTimelineAxis(file.project, schedule.tasks, 'expanded', historicalDates(file.project, impact))
  expect(elapsedOverrun(axis, impact.tasks[0])?.calendarDays).toBe(4)
  expect(impact.tasks[0].completion?.reference).toBe('2026-11-02')
})
test('format4 and format5 redraw deterministically with identical explicit As-of and immutable baseline', () => {
  const { file, impact } = view()
  for (const version of [4, 5]) {
    const candidate = { ...file, schemaVersion: version, ...(version === 4 ? { forecastSettings: undefined } : {}) }
    const loaded = parseProject(JSON.stringify(candidate))
    if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors))
    expect(loaded.value.baseline).toEqual(file.baseline)
    expect(loaded.value.taskProgress).toEqual(file.taskProgress)
    expect(calculateProgressImpact({ project: loaded.value.project, tasks: loaded.value.tasks, progress: loaded.value.taskProgress!, asOf: '2026-11-06' })).toEqual(impact)
    expect(JSON.stringify(loaded.value)).not.toContain('paAsOf')
    expect(JSON.stringify(loaded.value)).not.toContain('elapsedOverrun')
  }
})
test('staged dependency previews cannot create or remove accepted actual-to-PA relations', () => {
  const { file, impact, axis } = view('absorbed')
  const before = JSON.stringify(file)
  const tasks = file.tasks.map(t => ({ ...t, predecessorTaskIds: t.taskId === 'T3' ? ['T1'] : t.taskId === 'T2' ? [] : t.predecessorTaskIds }))
  const preview = calculateSchedule(file.project, tasks)
  if (!preview.ok) throw new Error('Expected valid staged graph')
  const rows = projectTimeline(axis, tasks, preview.tasks).rows
  const relations = presentImpactRelations(axis, file.project, rows, impact)
  expect(relations.map(r => [r.predecessorId, r.successorId])).toEqual([['T1', 'T2']])
  expect(relations[0].label).toContain('Existing accepted dependency; no graph change')
  expect(JSON.stringify(file)).toBe(before)
})
