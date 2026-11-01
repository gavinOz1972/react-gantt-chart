// @vitest-environment node
import { expect, test } from 'vitest'
import { calculateSchedule, dateToOrdinal } from '../domain'
import { workData } from '../test/workFixture'
import { createTimelineAxis } from './projection'
import { clipOverlayPoint, comparisonDescription, forecastFinishDescription, forecastPoint, overlayPoint } from './overlays'
import type { TaskForecast } from '../forecast/forecast'

const schedule = calculateSchedule(workData.project, workData.tasks)
if (!schedule.ok) throw new Error('Invalid fixture')
const task = (finish: string | null, position: number | null): TaskForecast => ({ taskId: 'T2', committedFinish: '2026-11-06', baselineFinish: null, forecastStart: '2026-11-02', forecastFinish: finish, startPosition: 0, finishPosition: position, reason: '', indicator: 'On Schedule', explanation: '' })
for (const mode of ['expanded', 'compressed'] as const) {
  const axis = createTimelineAxis(workData.project, schedule.tasks, mode)
  test(`${mode}: forecast fractional finish uses accepted day position; no endpoint for unknown`, () => {
    const result = forecastPoint(axis, task('2026-11-05', 3.5))!
    const start = axis.dayStart(dateToOrdinal('2026-11-05'))
    expect(result.unit).toBe(start + (mode === 'expanded' ? .5 : 1.5))
    expect(forecastPoint(axis, task(null, null))).toBeNull()
    expect(forecastPoint(axis, task('2026-11-02', 0))!.unit).toBe(0)
  })
  test(`${mode}: original calendar proportions stay within original dates`, () => {
    const point = overlayPoint(axis, '2026-11-05', 2 / 3)
    expect(point.unit).toBe(axis.dayStart(dateToOrdinal('2026-11-05')) + (mode === 'expanded' ? 2 / 3 : 2))
  })
  test(`${mode}: off-range points are explicitly clipped; viewport overflow is identified`, () => {
    const before = overlayPoint(axis, '2026-10-01', 1), after = overlayPoint(axis, '2027-01-01', 1)
    expect(before).toMatchObject({ unit: 0, clipping: 'before-range' })
    expect(after).toMatchObject({ unit: axis.totalUnits, clipping: 'after-range' })
    expect(clipOverlayPoint(before, unit => unit * 10, 200)).toMatchObject({ x: 5, clipping: 'before-range' })
    expect(clipOverlayPoint({ unit: 100, clipping: '', omitted: false }, unit => unit * 10, 200)).toMatchObject({ x: 195, clipping: 'after-view' })
  })
}
test('compressed nonworking forecast dates use labelled omitted boundaries, never a fabricated working date', () => {
  const axis = createTimelineAxis(workData.project, schedule.tasks, 'compressed')
  expect(forecastPoint(axis, task('2026-11-03', 1.5))).toMatchObject({ unit: 3, omitted: true })
})
test('exclusive whole-day completion uses last occupied date; tiny fractions are not rounded to day end', () => {
  const axis = createTimelineAxis(workData.project, schedule.tasks, 'expanded')
  expect(forecastPoint(axis, task('2026-11-02', 1))!.unit).toBe(1)
  expect(forecastPoint(axis, task('2026-11-02', 1e-12))!.unit).toBe(1e-12)
  expect(forecastPoint(axis, task('2026-11-02', null))!.unit).toBe(1)
})
test.each([['2026-11-04', '2 calendar days earlier'], ['2026-11-06', 'same calendar date'], ['2026-11-10', '4 calendar days later']])('finish-marker description uses calendar variance for %s and keeps effort separate', (date, variance) => {
  const current = { ...schedule.tasks[0], finishDate: '2026-11-06' }
  const description = forecastFinishDescription(current, task(date, 1), 12)
  expect(description).toContain('FF (Forecast Finish)')
  expect(description).toContain('Committed finish 2026-11-06')
  expect(description).toContain(`Forecast finish ${date}`)
  expect(description).toContain(variance)
  expect(description).toContain('Known remaining effort: 12 person-hours')
  expect(description).toContain('not effort hours or scheduled working slots')
})
test('chart descriptions omit forecast comparisons when hidden, while baseline/commitment stay available', () => {
  const description = comparisonDescription(schedule.tasks[0], schedule.tasks[0], task('2026-11-10', 1), true, false)
  expect(description).toContain('Baseline:'); expect(description).toContain('committed finish')
  expect(description).not.toContain('forecast'); expect(description).not.toContain('2026-11-10')
  expect(forecastFinishDescription(schedule.tasks[0], task(null, null))).toBe('Forecast Finish unavailable.')
})
