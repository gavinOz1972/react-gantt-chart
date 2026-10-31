// @vitest-environment node
import { expect, test } from 'vitest'
import { analyzeCriticalPath, calculateSchedule, createWorkingTimeIndex } from '../index'
import type { CriticalPathResult, ProjectSettings, TaskInput } from '../index'

const project: ProjectSettings = { projectId: 'P1', name: 'CPM', projectStartDate: '2026-11-02', targetEndDate: '2026-12-31', workingWeekdays: [1, 4], workingHoursPerDay: 2 }
const task = (taskId: string, durationHours: number, predecessorTaskIds: string[] = []): TaskInput => ({ taskId, name: taskId, description: '', durationHours, predecessorTaskIds, independentStartMode: 'DEFAULT' })
function success(result: CriticalPathResult) {
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result
}

test('A01 simple chain has zero slack and exact earliest/latest dates', () => {
  const result = success(analyzeCriticalPath(project, [task('T1', 3), task('T2', 2, ['T1']), task('T3', 1, ['T2'])]))
  expect(result.tasks.map(task => task.totalSlackHours)).toEqual([0, 0, 0])
  expect(result.tasks.every(task => task.critical)).toBe(true)
  for (const task of result.tasks) { expect(task.latestStart).toEqual(task.earliestStart); expect(task.latestFinish).toEqual(task.earliestFinish) }
  expect(result.relationships.every(edge => edge.critical)).toBe(true)
  expect(result.projectCompletion).toEqual({ date: '2026-11-09', afterHour: 2 })
})

test('A02 parallel join gives shorter branch two working hours of slack', () => {
  const result = success(analyzeCriticalPath(project, [task('A', 1), task('B', 3), task('C', 1, ['A', 'B'])]))
  expect(result.tasks.map(task => [task.taskId, task.totalSlackHours, task.critical])).toEqual([['A', 2, false], ['B', 0, true], ['C', 0, true]])
  expect(result.tasks[0].latestStart).toEqual({ date: '2026-11-05', hour: 1 })
  expect(result.relationships.map(edge => [edge.predecessorId, edge.critical])).toEqual([['A', false], ['B', true]])
})

test('A03 equal branches are simultaneously critical', () => {
  const result = success(analyzeCriticalPath(project, [task('A', 3), task('B', 3), task('C', 1, ['A', 'B'])]))
  expect(result.tasks.every(task => task.critical)).toBe(true)
  expect(result.relationships.filter(edge => edge.critical)).toHaveLength(2)
})

test('A04 delayed manual root is a release, not added effort or an unrelated critical predecessor', () => {
  const manual: TaskInput = { ...task('M', 1), independentStartMode: 'MANUAL', requestedStartDate: '2026-11-12' }
  const result = success(analyzeCriticalPath(project, [task('A', 1), manual]))
  expect(result.tasks[0]).toMatchObject({ taskId: 'A', totalSlackHours: 6, critical: false, durationHours: 1 })
  expect(result.tasks[1]).toMatchObject({ taskId: 'M', totalSlackHours: 0, critical: true, durationHours: 1, releaseDelayHours: 6, releaseStart: { date: '2026-11-12', hour: 1 } })
  expect(result.projectCompletion).toEqual({ date: '2026-11-12', afterHour: 1 })
  expect(result.relationships).toHaveLength(0)
})

test('manual release on nonworking date advances through WP1; retained dependent manual fields stay inactive', () => {
  const tasks: TaskInput[] = [task('A', 3), { ...task('B', 1, ['A']), independentStartMode: 'MANUAL', requestedStartDate: '2026-12-01' }, { ...task('M', 1), independentStartMode: 'MANUAL', requestedStartDate: '2026-11-03' }]
  const result = success(analyzeCriticalPath(project, tasks))
  expect(result.tasks.find(task => task.taskId === 'M')?.releaseStart).toEqual({ date: '2026-11-05', hour: 1 })
  expect(result.tasks.find(task => task.taskId === 'M')?.releaseDelayHours).toBe(2)
  expect(result.tasks.find(task => task.taskId === 'B')?.releaseStart).toBeUndefined()
  expect(result.tasks.find(task => task.taskId === 'B')?.earliestStart).toEqual({ date: '2026-11-05', hour: 2 })
})

test('A05 target affects feasibility only; critical analysis is invariant', () => {
  const tasks = [task('A', 3), task('B', 1, ['A'])]
  expect(analyzeCriticalPath({ ...project, targetEndDate: '2026-11-02' }, tasks)).toEqual(analyzeCriticalPath(project, tasks))
})

test('a delayed manual root controls a join without making its earlier unrelated predecessor critical', () => {
  const tasks: TaskInput[] = [task('A', 1), { ...task('M', 1), independentStartMode: 'MANUAL', requestedStartDate: '2026-11-12' }, task('J', 1, ['A', 'M'])]
  const result = success(analyzeCriticalPath(project, tasks))
  expect(result.tasks.find(task => task.taskId === 'A')).toMatchObject({ totalSlackHours: 6, critical: false, durationHours: 1 })
  expect(result.tasks.find(task => task.taskId === 'M')).toMatchObject({ totalSlackHours: 0, critical: true, durationHours: 1, releaseDelayHours: 6 })
  expect(result.relationships.map(edge => [edge.predecessorId, edge.critical])).toEqual([['A', false], ['M', true]])
})

test('A06 backward working-slot arithmetic crosses nonworking days without calendar-day subtraction', () => {
  const result = success(analyzeCriticalPath(project, [task('A', 1), task('B', 5)]))
  expect(result.tasks[0]).toMatchObject({ totalSlackHours: 4, latestStart: { date: '2026-11-09', hour: 1 }, latestFinish: { date: '2026-11-09', afterHour: 1 } })
  const time = createWorkingTimeIndex(project)
  const start = { date: '2026-11-02', hour: 1 }
  expect(time.slotAt(time.startIndex(start) + 2n)).toEqual({ date: '2026-11-05', hour: 1 })
  expect(time.boundaryAt(time.startIndex(start) + 2n)).toEqual({ date: '2026-11-02', afterHour: 2 })
})

test('A07 extension changes the controlling branch and slack without changing source input', () => {
  const tasks = [task('A', 1), task('B', 3), task('C', 1, ['A', 'B'])]
  const before = structuredClone(tasks)
  const updated = success(analyzeCriticalPath(project, [{ ...tasks[0], durationHours: 5 }, tasks[1], tasks[2]]))
  expect(updated.tasks.find(task => task.taskId === 'A')?.critical).toBe(true)
  expect(updated.tasks.find(task => task.taskId === 'B')?.totalSlackHours).toBe(2)
  expect(tasks).toEqual(before)
})

test('stable ordering and purity preserve frozen inputs and supplied WP1 results', () => {
  const tasks = [task('C', 1, ['B', 'A']), task('B', 3), task('A', 1)]
  const schedule = calculateSchedule(project, tasks)
  const snapshot = structuredClone({ project, tasks, schedule })
  for (const entry of tasks) { Object.freeze(entry.predecessorTaskIds); Object.freeze(entry) }
  Object.freeze(tasks)
  const result = analyzeCriticalPath(project, tasks, schedule)
  expect(analyzeCriticalPath(project, [...tasks].reverse(), schedule)).toEqual(result)
  expect({ project, tasks, schedule }).toEqual(snapshot)
})

test('empty and invalid graphs produce explicit analysis contracts without partial slack', () => {
  expect(analyzeCriticalPath(project, [])).toEqual({ ok: true, tasks: [], relationships: [], topologicalTaskIds: [], projectCompletion: null })
  const result = analyzeCriticalPath(project, [task('A', 1, ['A'])])
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.errors[0].code).toBe('SELF_DEPENDENCY')
})

test('a stale supplied schedule is rejected when duration no longer matches', () => {
  const result = analyzeCriticalPath(project, [task('A', 5)], calculateSchedule(project, [task('A', 1)]))
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.errors[0].code).toBe('ANALYSIS_INPUT_MISMATCH')
})

test('analysis precision limits return an explicit error without partial task slack', () => {
  const huge = { ...project, workingHoursPerDay: Number.MAX_SAFE_INTEGER }
  const tasks: TaskInput[] = [task('A', 1), { ...task('M', 1), independentStartMode: 'MANUAL', requestedStartDate: '2026-11-09' }]
  expect(calculateSchedule(huge, tasks).ok).toBe(true)
  const result = analyzeCriticalPath(huge, tasks)
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.errors[0].code).toBe('ANALYSIS_RANGE_OVERFLOW')
  expect(result).not.toHaveProperty('tasks')
})
