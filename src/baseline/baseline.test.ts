// @vitest-environment node
import { expect, test } from 'vitest'
import { calculateSchedule } from '../domain'
import { establishBaseline, decodeBaseline } from './baseline'

import { baselineInputs, establishedAt, snapshot } from '../test/baselineFixture'

test('A04 captures all approved inputs, order, nonsequential IDs, retained dates and exact WP1 outputs even beyond target', () => {
  const baseline = snapshot()
  expect(baseline).toMatchObject(baselineInputs)
  const schedule = calculateSchedule(baseline.project, baseline.tasks)
  expect(schedule.ok).toBe(true)
  if (schedule.ok) expect(baseline.schedule).toEqual({ tasks: schedule.tasks, projectCompletion: schedule.projectCompletion })
  expect(baseline.schedule.projectCompletion!.date > baseline.project.targetEndDate).toBe(true)
  expect(baseline.establishedAt).toBe(establishedAt)
})

test('A05 snapshot is deeply isolated and frozen; changing or deleting source inputs never changes frozen dates', () => {
  const source = structuredClone(baselineInputs)
  const result = establishBaseline(source, 'BL-TEST', establishedAt)
  if (!result.ok) throw new Error('Invalid fixture')
  const before = JSON.stringify(result.value)
  source.project.workingWeekdays.push(2); source.project.targetEndDate = '2027-01-01'
  source.tasks[0].durationHours = 99; source.tasks[0].description = 'Changed'
  source.tasks[2].predecessorTaskIds.pop(); source.manualOrder.reverse(); source.tasks.splice(1, 1)
  expect(JSON.stringify(result.value)).toBe(before)
  expect(Object.isFrozen(source.tasks)).toBe(false)
  expect(Object.isFrozen(result.value)).toBe(true)
  expect(Object.isFrozen(result.value.project.workingWeekdays)).toBe(true)
  expect(Object.isFrozen(result.value.tasks[2].predecessorTaskIds)).toBe(true)
  expect(Object.isFrozen(result.value.schedule.tasks[0].startSlot)).toBe(true)
  expect(() => Object.assign(result.value.tasks[0], { durationHours: 88 })).toThrow(TypeError)
})

test('A03/A06 refuses empty or invalid inputs and refuses a second original baseline', () => {
  expect(establishBaseline({ ...baselineInputs, tasks: [], manualOrder: [] }, 'BL-TEST', establishedAt)).toMatchObject({ ok: false, errors: [{ code: 'BASELINE_EMPTY' }] })
  expect(establishBaseline({ ...baselineInputs, project: { ...baselineInputs.project, workingWeekdays: [] } }, 'BL-TEST', establishedAt).ok).toBe(false)
  expect(establishBaseline({ ...baselineInputs, tasks: [{ ...baselineInputs.tasks[0], durationHours: 0 }] }, 'BL-TEST', establishedAt).ok).toBe(false)
  expect(establishBaseline(baselineInputs, 'BL-NEW', establishedAt, snapshot())).toMatchObject({ ok: false, errors: [{ code: 'BASELINE_EXISTS' }] })
})

test('import creates a fresh frozen copy and metadata never influences schedule calculations', () => {
  const original = snapshot()
  const decoded = decodeBaseline(JSON.parse(JSON.stringify(original)))
  expect(decoded).toEqual({ ok: true, value: original })
  if (decoded.ok) { expect(decoded.value).not.toBe(original); expect(Object.isFrozen(decoded.value.tasks[0])).toBe(true) }
  const later = establishBaseline(baselineInputs, 'ANOTHER-ID', '2027-01-01T00:00:00.000Z')
  expect(later.ok && later.value.schedule).toEqual(original.schedule)
})

test.each([
  null,
  { schemaVersion: 99 },
  { ...snapshot(), baselineId: '' },
  { ...snapshot(), establishedAt: '2026-02-30T00:00:00.000Z' },
  { ...snapshot(), tasks: [{ ...baselineInputs.tasks[0], predecessorTaskIds: ['missing'] }] },
  { ...snapshot(), manualOrder: ['T2'] },
  { ...snapshot(), manualOrder: undefined },
  { ...snapshot(), schedule: { tasks: [], projectCompletion: null } },
  { ...snapshot(), schedule: { ...snapshot().schedule, projectCompletion: { date: '2026-11-02', afterHour: 1 } } },
])('A09 rejects malformed baseline %#', value => {
  const before = JSON.stringify(value)
  expect(decodeBaseline(value).ok).toBe(false)
  expect(JSON.stringify(value)).toBe(before)
})

test('frozen output validation is independent of JSON object property order', () => {
  const original = snapshot()
  const reordered = { ...original, schedule: { projectCompletion: original.schedule.projectCompletion, tasks: original.schedule.tasks.map(task => ({ finishDate: task.finishDate, startDate: task.startDate, finishBoundary: task.finishBoundary, startSlot: task.startSlot, predecessorTaskIds: task.predecessorTaskIds, taskId: task.taskId })) } }
  expect(decodeBaseline(reordered)).toEqual({ ok: true, value: original })
})
