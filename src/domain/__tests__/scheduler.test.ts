// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { calculateSchedule } from '../index'
import type { ProjectSettings, SchedulePolicies, ScheduleResult, TaskInput } from '../index'

const project: ProjectSettings = {
  projectId: 'P1', name: 'Semester project', projectStartDate: '2026-11-02',
  targetEndDate: '2026-12-31', workingWeekdays: [1, 4], workingHoursPerDay: 2,
}
const task = (taskId: string, durationHours = 1, predecessorTaskIds: readonly string[] = []): TaskInput => ({
  taskId, name: taskId, description: '', durationHours, predecessorTaskIds, independentStartMode: 'DEFAULT',
})
const manual = (taskId: string, requestedStartDate: string, durationHours = 1, predecessorTaskIds: readonly string[] = []): TaskInput => ({
  ...task(taskId, durationHours, predecessorTaskIds), independentStartMode: 'MANUAL', requestedStartDate,
})
function success(result: ScheduleResult) {
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result
}
function failure(result: ScheduleResult, code: string, field?: string) {
  expect(result.ok).toBe(false)
  if (result.ok) throw new Error('Expected failure')
  expect(result.errors).toEqual(expect.arrayContaining([expect.objectContaining({ code, ...(field ? { field } : {}) })]))
  expect(result).not.toHaveProperty('tasks')
  expect(result).not.toHaveProperty('projectCompletion')
  return result.errors
}
const find = (result: ScheduleResult, id: string) => success(result).tasks.find(task => task.taskId === id)!

describe('WP1 acceptance scenarios', () => {
  test('five-hour concurrent task occupies three hours Monday and two hours Thursday', () => {
    const result = calculateSchedule({ ...project, workingHoursPerDay: 3 }, [task('T1', 2), task('T2', 1, ['T1']), task('T3', 5)])
    expect(find(result, 'T3').startSlot).toEqual({ date: '2026-11-02', hour: 1 })
    expect(find(result, 'T3').finishBoundary).toEqual({ date: '2026-11-05', afterHour: 2 })
    expect(success(result).projectCompletion).toEqual({ date: '2026-11-05', afterHour: 2 })
  })
  test('A01 hour rollover', () => {
    const result = calculateSchedule(project, [task('T1', 3)])
    expect(find(result, 'T1')).toMatchObject({ startSlot: { date: '2026-11-02', hour: 1 }, finishBoundary: { date: '2026-11-05', afterHour: 1 }, startDate: '2026-11-02', finishDate: '2026-11-05' })
    expect(success(result).projectCompletion).toEqual({ date: '2026-11-05', afterHour: 1 })
  })
  test('A02 same-day successor', () => {
    const result = calculateSchedule({ ...project, workingHoursPerDay: 4 }, [task('B', 1, ['A']), task('A', 2)])
    expect(find(result, 'B').startSlot).toEqual({ date: '2026-11-02', hour: 3 })
  })
  test('A03 nonworking manual date advances to Thursday', () => {
    expect(find(calculateSchedule(project, [manual('T1', '2026-11-03')]), 'T1').startSlot).toEqual({ date: '2026-11-05', hour: 1 })
  })
  test('A04 project start edits move defaults and descendants while retaining manual inputs', () => {
    const tasks = [task('D'), task('DD', 1, ['D']), manual('M', '2026-11-12'), task('MD', 1, ['M'])]
    const before = calculateSchedule(project, tasks)
    const after = calculateSchedule({ ...project, projectStartDate: '2026-11-09' }, tasks)
    expect(find(before, 'D').startDate).toBe('2026-11-02')
    expect(find(after, 'D').startDate).toBe('2026-11-09')
    expect(find(after, 'DD').startSlot).toEqual({ date: '2026-11-09', hour: 2 })
    expect(find(after, 'M')).toEqual(find(before, 'M'))
    expect(find(after, 'MD')).toEqual(find(before, 'MD'))
    expect(tasks[2]).toMatchObject({ requestedStartDate: '2026-11-12' })
    const laterProjectStart = calculateSchedule({ ...project, projectStartDate: '2026-11-16' }, tasks, { manualStartBeforeProject: 'ALLOW' })
    expect(find(laterProjectStart, 'M')).toEqual(find(before, 'M'))
    expect(find(laterProjectStart, 'MD')).toEqual(find(before, 'MD'))
  })
  test('A05 all predecessors are required and order is canonical', () => {
    const tasks = [task('C', 1, ['B', 'A']), task('B', 5), task('A', 1)]
    const result = calculateSchedule(project, tasks)
    expect(find(result, 'C').startSlot).toEqual({ date: '2026-11-09', hour: 2 })
    expect(calculateSchedule(project, [tasks[2], tasks[0], tasks[1]])).toEqual(result)
    expect(calculateSchedule(project, [task('C', 1, ['A', 'B']), tasks[1], tasks[2]])).toEqual(result)
  })
  test('A06 dependency removal recalculates descendants without deleting any task', () => {
    const base = [task('A', 1), task('B', 5)]
    const descendant = task('D', 1, ['C'])
    const both = calculateSchedule(project, [...base, task('C', 1, ['A', 'B']), descendant])
    const one = calculateSchedule(project, [...base, task('C', 1, ['A']), descendant])
    const none = calculateSchedule(project, [...base, task('C'), descendant])
    expect(find(one, 'C').startSlot).toEqual({ date: '2026-11-02', hour: 2 })
    expect(find(one, 'B')).toEqual(find(both, 'B'))
    expect(find(one, 'D').startSlot).toEqual({ date: '2026-11-05', hour: 1 })
    expect(find(none, 'C').startSlot).toEqual({ date: '2026-11-02', hour: 1 })
    expect(success(none).tasks).toHaveLength(4)
    // A dependent task retains its independent MANUAL fields until the final link is removed.
    const withLink = calculateSchedule(project, [base[0], manual('C', '2026-11-12', 1, ['A'])])
    const withoutLink = calculateSchedule(project, [base[0], manual('C', '2026-11-12')])
    expect(find(withLink, 'C').startDate).toBe('2026-11-02')
    expect(find(withoutLink, 'C').startDate).toBe('2026-11-12')
  })
  test('A07 calendar edits change slots, descendants and completion', () => {
    const tasks = [task('A', 3), task('B', 1, ['A'])]
    expect(find(calculateSchedule(project, tasks), 'B').startSlot).toEqual({ date: '2026-11-05', hour: 2 })
    const moreHours = calculateSchedule({ ...project, workingHoursPerDay: 4 }, tasks)
    expect(find(moreHours, 'B').startSlot).toEqual({ date: '2026-11-02', hour: 4 })
    expect(success(moreHours).projectCompletion).toEqual({ date: '2026-11-02', afterHour: 4 })
    const otherDays = calculateSchedule({ ...project, workingWeekdays: [2, 5] }, tasks)
    expect(find(otherDays, 'A').startDate).toBe('2026-11-03')
    expect(success(otherDays).projectCompletion).toEqual({ date: '2026-11-06', afterHour: 2 })
  })
  test('A08 independent tasks overlap without resource leveling', () => {
    const result = success(calculateSchedule({ ...project, workingHoursPerDay: 8 }, [task('A', 8), task('B', 8)]))
    expect(result.tasks[0].startSlot).toEqual(result.tasks[1].startSlot)
    expect(result.tasks[0].finishBoundary).toEqual(result.tasks[1].finishBoundary)
    expect(result.projectCompletion).toEqual({ date: '2026-11-02', afterHour: 8 })
  })
  test('A09 cycles have deterministic closed cycle details, excluding blocked descendants', () => {
    const tasks = [task('A', 1, ['C']), task('B', 1, ['A']), task('C', 1, ['B']), task('D', 1, ['C'])]
    const errors = failure(calculateSchedule(project, tasks), 'DEPENDENCY_CYCLE')
    expect(errors[0].relatedTaskIds).toEqual(['A', 'B', 'C', 'A'])
    expect(calculateSchedule(project, [...tasks].reverse())).toEqual(calculateSchedule(project, tasks))
    failure(calculateSchedule(project, [task('A', 1, ['A'])]), 'SELF_DEPENDENCY')
    failure(calculateSchedule(project, [task('A', 1, ['absent'])]), 'MISSING_PREDECESSOR')
  })
  test.each([0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('A10 rejects duration %s with no partial output', duration => {
    failure(calculateSchedule(project, [task('valid'), task('bad', duration)]), 'INVALID_DURATION', 'durationHours')
  })
  test('A10 invalid calendar returns no partial dates', () => {
    failure(calculateSchedule({ ...project, workingWeekdays: [] }, [task('A')]), 'INVALID_CALENDAR', 'workingWeekdays')
  })
  test('A11 stability, source purity, and output ownership', () => {
    const source = structuredClone({ project, tasks: [task('B', 1, ['A']), manual('A', '2026-11-05')] })
    const snapshot = structuredClone(source)
    Object.freeze(source.project.workingWeekdays)
    Object.freeze(source.project)
    for (const entry of source.tasks) { Object.freeze(entry.predecessorTaskIds); Object.freeze(entry) }
    Object.freeze(source.tasks)
    const result = calculateSchedule(source.project, source.tasks)
    expect(calculateSchedule(source.project, source.tasks)).toEqual(result)
    expect(calculateSchedule(source.project, [...source.tasks].reverse())).toEqual(result)
    expect(source).toEqual(snapshot)
    expect(find(result, 'B').predecessorTaskIds).not.toBe(source.tasks[0].predecessorTaskIds)
  })
  test('A12 target edits never alter the schedule, including an explicitly allowed early target', () => {
    const tasks = [task('A', 200), task('B', 1, ['A'])]
    const result = calculateSchedule(project, tasks)
    expect(calculateSchedule({ ...project, targetEndDate: '2026-11-03' }, tasks)).toEqual(result)
    expect(calculateSchedule({ ...project, targetEndDate: '2026-10-01' }, tasks, { targetEndBeforeProject: 'ALLOW' })).toEqual(result)
  })
  test('A13 empty project has no invented completion date', () => {
    expect(calculateSchedule(project, [])).toEqual({ ok: true, tasks: [], projectCompletion: null })
    failure(calculateSchedule({ ...project, workingWeekdays: [] }, []), 'INVALID_CALENDAR')
  })
  test('A13 one-hour and exact day-end boundary retain last occupied date', () => {
    expect(find(calculateSchedule(project, [task('A')]), 'A').finishBoundary).toEqual({ date: '2026-11-02', afterHour: 1 })
    const result = calculateSchedule(project, [task('A', 2), task('B', 1, ['A'])])
    expect(find(result, 'A').finishDate).toBe('2026-11-02')
    expect(find(result, 'B').startSlot).toEqual({ date: '2026-11-05', hour: 1 })
  })
  test('A13 weekend rollover and long multiweek work', () => {
    const weekdays: ProjectSettings = { ...project, projectStartDate: '2026-11-06', workingWeekdays: [1, 2, 3, 4, 5], workingHoursPerDay: 8 }
    expect(find(calculateSchedule(weekdays, [task('A', 9)]), 'A').finishBoundary).toEqual({ date: '2026-11-09', afterHour: 1 })
    const long = calculateSchedule({ ...weekdays, projectStartDate: '2026-11-02' }, [task('A', 161)])
    expect(success(long).projectCompletion).toEqual({ date: '2026-11-30', afterHour: 1 })
  })
})

describe('input validation and owner choices', () => {
  test('reports invalid task field values and required manual dates', () => {
    failure(calculateSchedule({ ...project, projectId: '' }, []), 'INVALID_PROJECT')
    failure(calculateSchedule(project, [{ ...task('A'), name: '' }]), 'INVALID_TASK')
    failure(calculateSchedule(project, [{ ...task('A'), independentStartMode: 'unknown' } as unknown as TaskInput]), 'INVALID_START_MODE')
    failure(calculateSchedule(project, [{ ...task('A'), predecessorTaskIds: null } as unknown as TaskInput]), 'INVALID_PREDECESSORS')
    failure(calculateSchedule(project, [{ ...task('A'), independentStartMode: 'MANUAL' } as unknown as TaskInput]), 'INVALID_DATE', 'requestedStartDate')
  })
  test('rejects duplicate IDs and duplicate predecessor IDs', () => {
    failure(calculateSchedule(project, [task('A'), task('A')]), 'DUPLICATE_TASK_ID')
    failure(calculateSchedule(project, [task('A'), task('B', 1, ['A', 'A'])]), 'DUPLICATE_PREDECESSOR')
    failure(calculateSchedule(project, [task('')]), 'INVALID_TASK_ID')
  })
  test('dates are validated even when a dependent manual request is inactive', () => {
    failure(calculateSchedule({ ...project, projectStartDate: '2026-02-29' }, []), 'INVALID_DATE', 'projectStartDate')
    failure(calculateSchedule({ ...project, targetEndDate: 'invalid' }, []), 'INVALID_DATE', 'targetEndDate')
    failure(calculateSchedule(project, [task('A'), manual('B', 'invalid', 1, ['A'])]), 'INVALID_DATE', 'requestedStartDate')
  })
  test('earlier manual dates are rejected by default; explicit policy overrides remain supported', () => {
    const tasks = [manual('A', '2026-10-29'), task('B', 1, ['A'])]
    failure(calculateSchedule(project, tasks), 'MANUAL_START_BEFORE_PROJECT', 'requestedStartDate')
    expect(find(calculateSchedule(project, tasks, { manualStartBeforeProject: 'ALLOW' }), 'A').startDate).toBe('2026-10-29')
    failure(calculateSchedule(project, tasks, { manualStartBeforeProject: 'REJECT' }), 'MANUAL_START_BEFORE_PROJECT')
    // Dependency precedence applies even to a retained earlier manual request.
    expect(find(calculateSchedule(project, [task('B'), manual('A', '2026-10-29', 1, ['B'])]), 'A').startSlot).toEqual({ date: '2026-11-02', hour: 2 })
  })
  test('earlier target dates are rejected by default; explicit policy overrides remain supported', () => {
    const earlier = { ...project, targetEndDate: '2026-11-01' }
    failure(calculateSchedule(earlier, []), 'TARGET_END_BEFORE_PROJECT', 'targetEndDate')
    failure(calculateSchedule(earlier, [], { targetEndBeforeProject: 'REJECT' }), 'TARGET_END_BEFORE_PROJECT')
    expect(calculateSchedule(earlier, [], { targetEndBeforeProject: 'ALLOW' }).ok).toBe(true)
    failure(calculateSchedule(project, [], { targetEndBeforeProject: 'typo' } as unknown as SchedulePolicies), 'INVALID_POLICY')
  })
  test('omitted, empty, partial, and undefined policy options preserve rejection defaults', () => {
    const earlier = { ...project, targetEndDate: '2026-11-01' }
    const tasks = [manual('A', '2026-10-29')]
    for (const policies of [{}, { manualStartBeforeProject: undefined, targetEndBeforeProject: undefined }] satisfies SchedulePolicies[]) {
      const errors = failure(calculateSchedule(earlier, tasks, policies), 'MANUAL_START_BEFORE_PROJECT')
      expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'TARGET_END_BEFORE_PROJECT' })]))
    }
    failure(calculateSchedule(earlier, tasks, { manualStartBeforeProject: 'ALLOW' }), 'TARGET_END_BEFORE_PROJECT')
    failure(calculateSchedule(earlier, tasks, { targetEndBeforeProject: 'ALLOW' }), 'MANUAL_START_BEFORE_PROJECT')
  })
  test('dates equal to project start remain valid under rejection defaults', () => {
    expect(calculateSchedule({ ...project, targetEndDate: project.projectStartDate }, [manual('A', project.projectStartDate)]).ok).toBe(true)
  })
  test('moving project start past a manual request rejects without overwriting it', () => {
    const tasks = [manual('A', '2026-11-05')]
    const snapshot = structuredClone(tasks)
    failure(calculateSchedule({ ...project, projectStartDate: '2026-11-09' }, tasks), 'MANUAL_START_BEFORE_PROJECT')
    expect(tasks).toEqual(snapshot)
  })
  test('range exhaustion returns an actionable error without partial schedule', () => {
    const end: ProjectSettings = { ...project, projectStartDate: '9999-12-31', targetEndDate: '9999-12-31', workingWeekdays: [0, 1, 2, 3, 4, 5, 6], workingHoursPerDay: 1 }
    expect(find(calculateSchedule(end, [task('A')]), 'A').finishDate).toBe('9999-12-31')
    failure(calculateSchedule(end, [task('A'), task('B', 1, ['A'])]), 'DATE_OUT_OF_RANGE')
    failure(calculateSchedule(project, [task('A', Number.MAX_SAFE_INTEGER)]), 'DATE_OUT_OF_RANGE')
  })
})
