// @vitest-environment node
import { expect, test } from 'vitest'
import { calculateSchedule } from '../domain'
import { dependencyError, initialProject, newTask, projectFromDraft, projectToDraft, removeTaskAndLinks, replaceTask, taskFromDraft, taskToDraft } from './projectEntry'

test('boundary round trips project and task records without date parsing or source mutation', () => {
  expect(projectFromDraft('P1', projectToDraft(initialProject))).toEqual(initialProject)
  const manual = { ...newTask('T9'), name: 'Manual', independentStartMode: 'MANUAL' as const, requestedStartDate: '2026-11-05' }
  const before = structuredClone(manual)
  const draft = taskToDraft(manual)
  draft.predecessorTaskIds.push('T1')
  expect(taskFromDraft(draft)).toEqual({ ...manual, predecessorTaskIds: ['T1'] })
  expect(manual).toEqual(before)
  expect(taskFromDraft(taskToDraft(newTask('T1')))).toEqual(newTask('T1'))
})

test('string numeric drafts preserve invalid values for WP1 to reject', () => {
  const task = taskToDraft({ ...newTask('T1'), name: 'Draft' })
  for (const durationHours of ['', '0', '-2', '0.5', 'invalid']) {
    expect(calculateSchedule(initialProject, [taskFromDraft({ ...task, durationHours })]).ok).toBe(false)
  }
  expect(calculateSchedule(projectFromDraft('P1', { ...projectToDraft(initialProject), workingHoursPerDay: '' }), []).ok).toBe(false)
})

test('ID replacement and removal keep unrelated tasks and retained manual fields', () => {
  const first = { ...newTask('T1'), name: 'First' }
  const second = { ...newTask('T2'), name: 'Second', predecessorTaskIds: ['T1'], independentStartMode: 'MANUAL' as const, requestedStartDate: '2026-11-05' }
  const tasks = [first, second]
  const copy = structuredClone(tasks)
  expect(replaceTask(tasks, { ...first, durationHours: 3 })).toEqual([{ ...first, durationHours: 3 }, second])
  expect(removeTaskAndLinks(tasks, 'T1')).toEqual([{ ...second, predecessorTaskIds: [] }])
  expect(tasks).toEqual(copy)
})

test('dependency validation delegates to WP1 for cycles and self-reference', () => {
  const a = { ...newTask('T1'), name: 'A' }
  const b = { ...newTask('T2'), name: 'B', predecessorTaskIds: ['T1'] }
  expect(dependencyError(initialProject, [a, b], a, ['T2'])?.code).toBe('DEPENDENCY_CYCLE')
  expect(dependencyError(initialProject, [a, b], a, ['T1'])?.code).toBe('SELF_DEPENDENCY')
  expect(dependencyError(initialProject, [a, b], b, [])).toBeUndefined()
})
