// @vitest-environment node
import { expect, test } from 'vitest'
import { calculateSchedule, dateToOrdinal } from '../domain'
import type { ProjectSettings, TaskInput } from '../domain'
import { connectorPath, createTimelineAxis, MAX_SCROLL_WIDTH, pixelsPerUnit, projectTimeline, taskSegments, timelineWindow, visibleDays, visibleHourTicks } from './projection'
import type { TimelineMode } from './projection'

const project: ProjectSettings = { projectId: 'P1', name: 'Example', projectStartDate: '2026-11-02', targetEndDate: '2026-11-09', workingWeekdays: [1, 4], workingHoursPerDay: 2 }
const task = (taskId: string, durationHours: number, predecessorTaskIds: string[] = []): TaskInput => ({ taskId, name: taskId, description: '', durationHours, predecessorTaskIds, independentStartMode: 'DEFAULT' })
function fixture(tasks = [task('T1', 3)], settings = project, mode: TimelineMode = 'expanded') {
  const result = calculateSchedule(settings, tasks)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  const axis = createTimelineAxis(settings, result.tasks, mode)
  return { axis, result, ...projectTimeline(axis, tasks, result.tasks) }
}

test('A01/A02 expanded span is continuous, with exactly three occupied hours and two hatched days', () => {
  const { axis, rows } = fixture()
  expect(rows[0]).toMatchObject({ start: 0, end: 3.5 })
  const segments = taskSegments(axis, rows[0], visibleDays(axis, 0, 5))
  expect(segments).toEqual([
    { start: 0, end: 1, kind: 'working' }, { start: 1, end: 2, kind: 'nonworking' },
    { start: 2, end: 3, kind: 'nonworking' }, { start: 3, end: 3.5, kind: 'working' },
  ])
  expect(segments.filter(segment => segment.kind === 'working').reduce((sum, segment) => sum + (segment.end - segment.start) * axis.hoursPerDay, 0)).toBe(3)
  expect(axis.startAt({ date: '2026-11-05', hour: 2 })).toBe(3.5)
})

test('A01 compressed view contains exactly three adjacent slots and explicitly skips nonworking dates', () => {
  const { axis, rows } = fixture(undefined, undefined, 'compressed')
  expect(rows[0]).toMatchObject({ start: 0, end: 3 })
  expect(taskSegments(axis, rows[0], visibleDays(axis, 0, 5))).toEqual([{ start: 0, end: 3, kind: 'working' }])
  expect(visibleDays(axis, 0, 5).map(day => day.date)).toEqual(['2026-11-02', '2026-11-05', '2026-11-09'])
  expect(axis.ordinalAt(2)).toBe(dateToOrdinal('2026-11-05'))
})

test.each(['expanded', 'compressed'] as const)('A03 adjacent tasks share exact finish/start connector boundary in %s', mode => {
  const { rows, links } = fixture([task('T1', 2), task('T2', 2, ['T1'])], { ...project, workingHoursPerDay: 4 }, mode)
  expect(rows[0].end).toBe(rows[1].start)
  expect(rows[0].end).toBe(mode === 'expanded' ? 0.5 : 2)
  expect(links[0]).toMatchObject({ from: { x: rows[0].end, row: 0 }, to: { x: rows[1].start, row: 1 } })
})

test('A04 connectors use stable IDs and follow row reordering and latest-predecessor scheduling', () => {
  const tasks = [task('A', 1), task('B', 3), task('C', 1, ['A', 'B'])]
  const before = fixture(tasks)
  const after = fixture([tasks[2], tasks[0], tasks[1]])
  expect(before.links).toHaveLength(2)
  expect(after.links.map(link => link.key)).toEqual(before.links.map(link => link.key))
  expect(after.links.find(link => link.predecessorId === 'A')).toMatchObject({ from: { row: 1 }, to: { row: 0 } })
  expect(after.rows.find(row => row.taskId === 'C')?.start).toBe(before.rows.find(row => row.taskId === 'B')?.end)
})

test('A05 unrelated tasks overlap instead of being serialized', () => {
  const { rows } = fixture([task('A', 5), task('B', 5)])
  expect(rows[0].start).toBe(rows[1].start)
  expect(rows[0].end).toBe(rows[1].end)
  expect(rows[0].index).not.toBe(rows[1].index)
})

test.each(['expanded', 'compressed'] as const)('A06/A07 live results move bars and remove only edited relationship in %s', mode => {
  const tasks = [task('A', 1), task('B', 3), task('C', 2, ['A', 'B'])]
  const before = fixture(tasks, project, mode)
  const after = fixture([task('A', 5), tasks[1], tasks[2]], project, mode)
  expect(after.rows[2].start).toBeGreaterThan(before.rows[2].start)
  expect(after.links.find(link => link.predecessorId === 'A')?.from.x).toBe(after.rows[0].end)
  const removed = fixture([tasks[0], tasks[1], task('C', 2, ['A'])], project, mode)
  expect(removed.links).toHaveLength(1)
  expect(removed.links[0].predecessorId).toBe('A')
  expect(removed.rows).toHaveLength(3)
})

test('A08 calendar changes reproject fractions and hatching without overwriting inputs', () => {
  const tasks = [task('A', 3)]
  const snapshot = structuredClone(tasks)
  const before = fixture(tasks)
  const moreHours = fixture(tasks, { ...project, workingHoursPerDay: 4 })
  expect(moreHours.rows[0].end).toBe(0.75)
  const differentDays = fixture(tasks, { ...project, workingWeekdays: [1, 2] })
  expect(differentDays.rows[0].end).toBe(1.5)
  expect(before.rows[0].end).toBe(3.5)
  expect(tasks).toEqual(snapshot)
})

test('A09 mode changes do not mutate engine output or source data', () => {
  const tasks = [task('A', 3), task('B', 1, ['A'])]
  const { result } = fixture(tasks)
  const snapshot = structuredClone({ project, tasks, result })
  for (const mode of ['compressed', 'expanded', 'compressed', 'expanded'] as const) {
    projectTimeline(createTimelineAxis(project, result.tasks, mode), tasks, result.tasks)
  }
  expect({ project, tasks, result }).toEqual(snapshot)
})

test('A10 viewport cost is bounded across centuries and horizontal scrolling reaches the end', () => {
  const { axis, rows } = fixture([task('A', 10000)], { ...project, projectStartDate: '0001-01-01', targetEndDate: '9999-12-31', workingHoursPerDay: 8 })
  const scale = pixelsPerUnit(axis, 'hour')
  const first = timelineWindow(axis.totalUnits, scale, 900, 0)
  const last = timelineWindow(axis.totalUnits, scale, 900, MAX_SCROLL_WIDTH)
  expect(first.scrollWidth).toBe(MAX_SCROLL_WIDTH)
  expect(last.right).toBeCloseTo(axis.totalUnits)
  expect(visibleDays(axis, first.left, first.right).length).toBeLessThan(10)
  expect(visibleDays(axis, last.left, last.right).length).toBeLessThan(10)
  expect(taskSegments(axis, rows[0], visibleDays(axis, first.left, first.right)).length).toBeLessThan(10)
})

test('coordinate mapping remains date-only at leap/year/DST boundaries and at range limit', () => {
  for (const start of ['2026-03-07', '2026-10-31', '2000-02-28', '2026-12-31', '9999-12-31']) {
    const { axis, rows } = fixture([task('A', 1)], { ...project, projectStartDate: start, targetEndDate: start, workingWeekdays: [0, 1, 2, 3, 4, 5, 6] })
    expect(rows[0].start).toBe(0)
    expect(rows[0].end).toBe(0.5)
    expect(axis.endOrdinal).toBeLessThanOrEqual(dateToOrdinal('9999-12-31'))
  }
})

test('unsafe display ranges fail explicitly rather than drawing inaccurate slot coordinates', () => {
  expect(() => fixture([task('A', 1)], { ...project, workingHoursPerDay: Number.MAX_SAFE_INTEGER }, 'compressed')).toThrow(RangeError)
})

test('connector paths start and finish exactly at provided bar boundaries', () => {
  expect(connectorPath(40, 26, 40, 78)).toBe('M 40 26 H 52 V 52 H 28 V 78 H 40')
  expect(connectorPath(40, 26, 100, 130)).toBe('M 40 26 H 70 V 130 H 100')
})

test('dense compressed days sample hour labels from the visible part of the day, without unbounded allocation', () => {
  const { axis } = fixture([task('A', 1)], { ...project, workingHoursPerDay: 10000 }, 'compressed')
  const days = visibleDays(axis, 5000, 5020)
  const ticks = visibleHourTicks(axis, days[0], 5000, 5020, 40)
  expect(ticks[0]).toEqual({ hour: 5001, unit: 5000 })
  expect(ticks.at(-1)).toEqual({ hour: 5021, unit: 5020 })
  expect(ticks.length).toBeLessThan(100)
})

test('mid-day task span never marks unused hours before its start or after its finish as occupied', () => {
  const { axis, rows } = fixture([task('A', 1), task('B', 2, ['A'])], { ...project, workingHoursPerDay: 4 })
  expect(taskSegments(axis, rows[1], visibleDays(axis, 0, 4))).toEqual([{ start: 0.25, end: 0.75, kind: 'working' }])
})
