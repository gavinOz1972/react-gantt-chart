// @vitest-environment node
import { expect, test } from 'vitest'
import { calculateSchedule } from '../domain'
import type { TaskInput } from '../domain'
import { emptyProgress, transitionTask } from '../progress/taskProgress'
import type { ProgressTracking, TaskStatus } from '../progress/taskProgress'
import { workBaseline, workData } from '../test/workFixture'
import { forecastSchedule } from './forecast'
import type { ForecastInput } from './forecast'
import { decodeForecastSettings } from './settings'
import type { ForecastSettings } from './settings'

const settings: ForecastSettings = { schemaVersion: 1, enabled: true, classHoursPerStudent: 3, homeworkHoursPerStudent: 5, teamSize: 4, asOfDate: '2026-11-02' }
const input: ForecastInput = { project: { ...workData.project, targetEndDate: '2026-12-13' }, tasks: workData.tasks, manualOrder: workData.manualOrder, remainingHours: { T2: 5, T9: 2 }, settings, today: '2026-11-01' }
function status(taskId: string, target: TaskStatus, tracking = emptyProgress(), date = '2026-11-10', committedFinishDateAtCompletion?: string): ProgressTracking {
  const result = transitionTask(tracking, taskId, { target, eventId: `E-${tracking.events.length}`, date, recordedAt: '2026-11-01T12:00:00.000Z', reason: target === 'Blocked' ? 'Waiting for a decision' : undefined, completionAcknowledged: true, noCriteriaAcknowledged: true, committedFinishDateAtCompletion }, workData.tasks.map(task => task.taskId))
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}
test('A01 exactly one team multiplier, inclusive six weeks = 192 person-hours', () => {
  const result = forecastSchedule(input)
  expect(result.weeklyCapacity).toBe(32); expect(result.targetDays).toBe(42); expect(result.capacityThroughTarget).toBe(192)
  expect(result.knownRemaining).toBe(7); expect(result.capacitySurplus).toBe(185)
})
test.each([['2026-11-02', 1], ['2026-11-04', 3], ['2026-11-01', 0]])('A02 inclusive partial interval through %s = %i days', (targetEndDate, days) => {
  const result = forecastSchedule({ ...input, project: { ...input.project, projectStartDate: '2026-10-01', targetEndDate } })
  expect(result.targetDays).toBe(days); expect(result.capacityThroughTarget).toBe(32 * days / 7)
})
test.each([{ classHoursPerStudent: -1 }, { homeworkHoursPerStudent: Infinity }, { homeworkHoursPerStudent: NaN }, { classHoursPerStudent: .001 }, { teamSize: 0 }, { teamSize: 1.5 }, { teamSize: Infinity }, { asOfDate: '2026-02-30' }, { asOfDate: '' }, { schemaVersion: 2 }])('A03 rejects invalid settings %#', patch => {
  expect(decodeForecastSettings({ ...settings, ...patch }).ok).toBe(false)
})
test('A03 zero capacity is safe and never claims On Schedule', () => {
  const result = forecastSchedule({ ...input, settings: { ...settings, classHoursPerStudent: 0, homeworkHoursPerStudent: 0 } })
  expect(result.state).toBe('Unavailable'); expect(result.forecastFinish).toBeNull(); expect(result.capacityThroughTarget).toBe(0)
  expect(result.tasks.every(task => task.indicator === 'Uncertain' && task.forecastFinish === null)).toBe(true)
})
test('A04 missing estimates are Partial, never zero, and invalidate downstream forecasts', () => {
  const result = forecastSchedule({ ...input, remainingHours: { T9: 2 } })
  expect(result.state).toBe('Partial'); expect(result.unknownTaskIds).toEqual(['T2']); expect(result.knownRemaining).toBe(2)
  expect(result.forecastFinish).toBeNull(); expect(result.targetVarianceDays).toBeNull()
  expect(result.tasks.every(task => task.forecastFinish === null && task.indicator === 'Uncertain')).toBe(true)
})
test('A05 complete contributes zero despite old remaining; successor starts immediately on As-of', () => {
  const progress = status('T2', 'Complete')
  const result = forecastSchedule({ ...input, progress, remainingHours: { T2: 800, T9: 2 } })
  expect(result.knownRemaining).toBe(2); expect(result.tasks[1].startPosition).toBe(0)
  expect(result.tasks[1].forecastStart).toBe('2026-11-02')
})
test('A06 exact shared pool: dependency starts at predecessor exclusive finish, fractions carry over', () => {
  const result = forecastSchedule(input)
  expect(result.tasks[0].startPosition).toBe(0)
  expect(result.tasks[1].startPosition).toBe(result.tasks[0].finishPosition)
  expect(result.tasks[1].finishPosition).toBe(49 / 32)
  expect(result.forecastFinish).toBe('2026-11-03')
})
const independent: TaskInput[] = ['T2', 'T9'].map(taskId => ({ taskId, name: taskId, description: '', independentStartMode: 'DEFAULT', durationHours: 2, predecessorTaskIds: [] }))
test('A07 priority is committed finish then manual order then stable ID; input/display order is irrelevant', () => {
  const run = (tasks: readonly TaskInput[], manualOrder: string[]) => forecastSchedule({ ...input, tasks, manualOrder, remainingHours: { T2: 1, T9: 1 } })
  expect(run(independent, ['T9', 'T2']).tasks.find(task => task.taskId === 'T9')!.startPosition).toBe(0)
  expect(run([...independent].reverse(), ['T2', 'T9']).tasks.find(task => task.taskId === 'T2')!.startPosition).toBe(0)
  expect(run([...independent].reverse(), []).tasks.find(task => task.taskId === 'T2')!.startPosition).toBe(0)
  const shorter = [{ ...independent[0], durationHours: 1 }, independent[1]]
  expect(run(shorter, ['T9', 'T2']).tasks[0].startPosition).toBe(0)
})
test('A08 blocked branch + descendants indeterminate; independent work can project; unblocking recalculates', () => {
  const progress = status('T2', 'Blocked')
  const blocked = forecastSchedule({ ...input, progress })
  expect(blocked.blockedTaskIds).toEqual(['T2']); expect(blocked.affectedTaskIds).toEqual(['T2', 'T9']); expect(blocked.forecastFinish).toBeNull()
  expect(blocked.tasks[1].reason).toContain('T2')
  const unblocked = status('T2', 'In Progress', progress)
  expect(forecastSchedule({ ...input, progress: unblocked }).state).toBe('Available')
  const independentBranch = forecastSchedule({ ...input, tasks: independent, progress })
  expect(independentBranch.tasks[1].forecastFinish).not.toBeNull()
})
test('A09 At Risk before or on committed finish, then A10 Late the day after regardless of improved forecast', () => {
  const low = { ...settings, classHoursPerStudent: .01, homeworkHoursPerStudent: 0, teamSize: 1 }
  const before = forecastSchedule({ ...input, settings: low })
  expect(before.tasks[0].indicator).toBe('At Risk')
  const finish = before.tasks[0].committedFinish
  expect(forecastSchedule({ ...input, settings: { ...low, asOfDate: finish } }).tasks[0].indicator).toBe('At Risk')
  expect(forecastSchedule({ ...input, settings: { ...settings, asOfDate: '2026-11-09' } }).tasks[0].indicator).toBe('Late')
})
test('A10 blocked/unknown overdue stays Late with uncertainty explanation; effort alone does not imply Late', () => {
  const result = forecastSchedule({ ...input, progress: status('T2', 'Blocked'), settings: { ...settings, asOfDate: '2026-12-01' } })
  expect(result.tasks[0].indicator).toBe('Late'); expect(result.tasks[0].explanation).toContain('Blocked')
  expect(forecastSchedule(input).tasks[0].indicator).toBe('On Schedule')
})
test('A11 historical Completed Late is immutable after committed dates move; legacy completion honest unknown', () => {
  const progress = status('T2', 'Complete', undefined, '2026-11-10', '2026-11-06')
  const result = forecastSchedule({ ...input, progress, tasks: input.tasks.map(task => ({ ...task, durationHours: task.durationHours + 300 })) })
  expect(result.tasks[0].indicator).toBe('Completed Late'); expect(result.tasks[0].explanation).toContain('2026-11-06')
  const ontime = status('T2', 'Complete', undefined, '2026-11-06', '2026-11-06')
  expect(forecastSchedule({ ...input, progress: ontime }).tasks[0].indicator).toBe('Completed on time')
  expect(forecastSchedule({ ...input, progress: status('T2', 'Complete') }).tasks[0].indicator).toBe('Completion timing unavailable')
})
test('A12 pure engine never changes WP1, baseline, settings or progress across recalculations', () => {
  const data = { ...input, baseline: workBaseline(), progress: status('T2', 'In Progress') }
  const before = JSON.stringify(data), committed = calculateSchedule(data.project, data.tasks)
  forecastSchedule(data); forecastSchedule({ ...data, settings: { ...settings, teamSize: 9 }, remainingHours: { T2: 500, T9: .01 } })
  expect(JSON.stringify(data)).toBe(before); expect(calculateSchedule(data.project, data.tasks)).toEqual(committed)
})
test('zero effort consumes no capacity, completion boundary day remains consistent; tiny capacity bounded by year 9999', () => {
  const oneDay = { ...settings, classHoursPerStudent: 7, homeworkHoursPerStudent: 0, teamSize: 1 }
  const result = forecastSchedule({ ...input, settings: oneDay, remainingHours: { T2: 1, T9: 0 } })
  expect(result.tasks[0].finishPosition).toBe(1); expect(result.tasks[1].startPosition).toBe(1)
  expect(result.forecastFinish).toBe('2026-11-02')
  const horizon = forecastSchedule({ ...input, settings: { ...oneDay, classHoursPerStudent: .01 }, remainingHours: { T2: 1_000_000, T9: 1 } })
  expect(horizon.state).toBe('Unavailable'); expect(horizon.forecastFinish).toBeNull()
})
test('today fallback is caller local date; missing/disabled settings never invent capacity', () => {
  expect(forecastSchedule({ ...input, settings: undefined }).state).toBe('Disabled')
  expect(forecastSchedule({ ...input, settings: { ...settings, asOfDate: undefined } }).asOfDate).toBe(input.today)
})
test('empty plans have no available project completion date', () => {
  const result = forecastSchedule({ ...input, tasks: [] })
  expect(result.state).toBe('Unavailable'); expect(result.forecastFinish).toBeNull(); expect(result.message).toContain('Add tasks')
})
