// @vitest-environment node
import { expect, test } from 'vitest'
import { analyzeCriticalPath, calculateSchedule } from '../domain'
import type { TaskInput } from '../domain'
import { acceptsProjectFile, createProjectFile, decodeProject, parseProject, projectFingerprint, serializeProject } from './projectFile'
import type { ProjectData } from './projectFile'

const data: ProjectData = {
  project: { projectId: 'P9', name: 'My saved semester', projectStartDate: '2026-11-02', targetEndDate: '2026-12-18', workingWeekdays: [1, 4, 5], workingHoursPerDay: 3 },
  tasks: [
    { taskId: 'T1', name: 'Research', description: 'Preserve notes', durationHours: 5, predecessorTaskIds: [], independentStartMode: 'MANUAL', requestedStartDate: '2026-11-05' },
    { taskId: 'T2', name: 'Parallel', description: '', durationHours: 2, predecessorTaskIds: [], independentStartMode: 'DEFAULT' },
    { taskId: 'T9', name: 'Join', description: 'Retained manual date', durationHours: 1, predecessorTaskIds: ['T1', 'T2'], independentStartMode: 'MANUAL', requestedStartDate: '2026-11-12' },
  ], nextTaskNumber: 12,
}
const timestamp = '2026-10-31T05:00:00.000Z'
function file() {
  const created = createProjectFile(data, timestamp)
  if (!created.ok) throw new Error(JSON.stringify(created.errors))
  return created.value
}

test('A10/A11 round trip preserves every source field and identical recomputed schedule/critical analysis', () => {
  const parsed = parseProject(serializeProject(file()))
  expect(parsed.ok).toBe(true)
  if (!parsed.ok) return
  expect(parsed.value).toMatchObject(data)
  expect(parsed.value.tasks).toEqual(data.tasks)
  expect(parsed.value.nextTaskNumber).toBe(12)
  expect(calculateSchedule(parsed.value.project, parsed.value.tasks)).toEqual(calculateSchedule(data.project, data.tasks))
  expect(analyzeCriticalPath(parsed.value.project, parsed.value.tasks)).toEqual(analyzeCriticalPath(data.project, data.tasks))
  expect(projectFingerprint(parsed.value)).toBe(projectFingerprint(data))
})

test('derived fields are excluded, untrusted embedded calculations are ignored, and source is unchanged', () => {
  const snapshot = structuredClone(data)
  const result = decodeProject({ ...file(), schedule: { tasks: [{ taskId: 'T1', startDate: '1900-01-01' }] }, analysis: { critical: false } })
  expect(result.ok).toBe(true)
  if (result.ok) { expect(result.value).not.toHaveProperty('schedule'); expect(result.value).not.toHaveProperty('analysis') }
  expect(data).toEqual(snapshot)
})

test.each(['', '{', 'null', '[]', '"project"'])('A12 malformed or wrong-shape input %s is rejected', text => {
  expect(parseProject(text).ok).toBe(false)
})
test('A12 schema/provenance incompatibility is actionable', () => {
  const version = decodeProject({ ...file(), schemaVersion: 99 })
  expect(version.ok).toBe(false)
  if (!version.ok) expect(version.errors[0].code).toBe('UNSUPPORTED_VERSION')
  expect(decodeProject({ ...file(), savedAt: '2026-02-30T00:00:00.000Z' }).ok).toBe(false)
})
test.each([
  { change: (tasks: TaskInput[]) => [...tasks, tasks[0]], code: 'DUPLICATE_TASK_ID' },
  { change: (tasks: TaskInput[]) => [{ ...tasks[0], predecessorTaskIds: ['absent'] }, ...tasks.slice(1)], code: 'MISSING_PREDECESSOR' },
  { change: (tasks: TaskInput[]) => [{ ...tasks[0], predecessorTaskIds: ['T9'] }, ...tasks.slice(1)], code: 'DEPENDENCY_CYCLE' },
  { change: (tasks: TaskInput[]) => [{ ...tasks[0], durationHours: 0 }, ...tasks.slice(1)], code: 'INVALID_DURATION' },
])('A12 delegates $code to WP1 validation', ({ change, code }) => {
  const result = decodeProject({ ...file(), tasks: change([...data.tasks]) })
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.errors.some(error => error.code === code)).toBe(true)
})
test('invalid dates/calendars and missing source fields fail before replacement', () => {
  expect(decodeProject({ ...file(), project: { ...data.project, projectStartDate: '2026-02-29' } }).ok).toBe(false)
  expect(decodeProject({ ...file(), project: { ...data.project, workingWeekdays: [] } }).ok).toBe(false)
  expect(decodeProject({ ...file(), project: { ...data.project, targetEndDate: '2026-11-01' } }).ok).toBe(false)
  expect(decodeProject({ ...file(), tasks: [{}] }).ok).toBe(false)
  expect(decodeProject({ ...file(), tasks: [{ ...data.tasks[0], independentStartMode: 'DEFAULT' }] }).ok).toBe(false)
})
test.each([0, 9, NaN, Number.MAX_SAFE_INTEGER])('rejects unsafe or reusable next task counter %s', nextTaskNumber => {
  expect(decodeProject({ ...file(), nextTaskNumber }).ok).toBe(false)
})
test('JSON file type and size checks explain invalid selections', () => {
  expect(acceptsProjectFile({ name: 'project.txt', type: 'text/plain', size: 10 })?.code).toBe('INVALID_FILE_TYPE')
  expect(acceptsProjectFile({ name: 'project.JSON', type: '', size: 10 })).toBeUndefined()
  expect(acceptsProjectFile({ name: 'project.json', type: 'application/json', size: 11 * 1024 * 1024 })?.code).toBe('FILE_TOO_LARGE')
})
