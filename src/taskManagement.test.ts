// @vitest-environment node
import { expect, test } from 'vitest'
import { analyzeCriticalPath, calculateSchedule } from './domain'
import type { TaskInput } from './domain'
import { initialProject } from './components/projectEntry'
import { displayTasks, duplicateTask, insertCopy, moveBefore } from './taskManagement'
import { createProjectFile, decodeProject, parseProject, projectFingerprint, serializeProject } from './persistence/projectFile'
import { deleteLocalProject, readLocalProjects, saveLocalProject } from './persistence/localProjects'

const tasks: TaskInput[] = [
  { taskId: 'T2', name: 'Zulu', description: 'First line\nSecond line', durationHours: 5, predecessorTaskIds: [], independentStartMode: 'MANUAL', requestedStartDate: '2026-11-05' },
  { taskId: 'T7', name: 'Alpha', description: '', durationHours: 2, predecessorTaskIds: [], independentStartMode: 'DEFAULT' },
  { taskId: 'T9', name: 'Join', description: 'Retained date', durationHours: 1, predecessorTaskIds: ['T2', 'T7'], independentStartMode: 'MANUAL', requestedStartDate: '2026-11-12' },
]
const ids = (rows: readonly TaskInput[]) => rows.map(task => task.taskId)
const data = { project: initialProject, tasks, nextTaskNumber: 12 }
function file() { const created = createProjectFile(data); if (!created.ok) throw Error('Fixture invalid'); return created.value }

test('A01–A04 successor can precede predecessors without changing source, WP1, CPM or network relationships', () => {
  const snapshot = structuredClone(tasks)
  const schedule = calculateSchedule(initialProject, tasks)
  const cpm = analyzeCriticalPath(initialProject, tasks)
  const order = moveBefore(ids(tasks), 'T9', 'T2')
  const displayed = displayTasks(tasks, order, 'manual', schedule)
  expect(ids(displayed)).toEqual(['T9', 'T2', 'T7'])
  expect(tasks).toEqual(snapshot)
  expect(calculateSchedule(initialProject, displayed)).toEqual(schedule)
  expect(analyzeCriticalPath(initialProject, displayed)).toEqual(cpm)
  expect(ids(displayTasks(tasks, order, 'start', schedule))).toEqual(['T7', 'T2', 'T9'])
  expect(ids(displayTasks(tasks, order, 'name', schedule))).toEqual(['T7', 'T9', 'T2'])
  expect(ids(displayTasks(tasks, order, 'duration', schedule))).toEqual(['T9', 'T7', 'T2'])
  expect(ids(displayTasks(tasks, order, 'manual', schedule))).toEqual(order)
})

test('sort ties preserve manual order and compare start hours as numbers', () => {
  const equal: TaskInput[] = tasks.map(task => ({ taskId: task.taskId, description: task.description, name: 'Same', durationHours: 1, predecessorTaskIds: [], independentStartMode: 'DEFAULT' }))
  const result = calculateSchedule(initialProject, equal)
  for (const mode of ['start', 'duration', 'name'] as const) expect(ids(displayTasks(equal, ['T9', 'T7', 'T2'], mode, result))).toEqual(['T9', 'T7', 'T2'])
  const hours = { ...initialProject, workingHoursPerDay: 12 }
  const serial = [equal[0], { ...equal[1], durationHours: 9, predecessorTaskIds: ['T2'] }, { ...equal[2], predecessorTaskIds: ['T7'] }]
  expect(ids(displayTasks(serial, ['T9', 'T7', 'T2'], 'start', calculateSchedule(hours, serial)))).toEqual(['T2', 'T7', 'T9'])
})

test('A06–A08 copies incoming links and retained MANUAL settings, never outgoing links, and inserts into manual arrangement while sorted', () => {
  const copy = duplicateTask(tasks[2], 'T12', tasks)
  expect(copy).toEqual({ ...tasks[2], taskId: 'T12', name: 'Join (Copy)' })
  expect(copy.predecessorTaskIds).not.toBe(tasks[2].predecessorTaskIds)
  const originalCopy = duplicateTask(tasks[0], 'T13', [...tasks, copy])
  const all = [...tasks, copy, originalCopy]
  expect(all[2].predecessorTaskIds).toEqual(['T2', 'T7'])
  expect(originalCopy.predecessorTaskIds).toEqual([])
  const order = insertCopy(['T9', 'T7', 'T2'], 'T2', 'T13')
  expect(order).toEqual(['T9', 'T7', 'T2', 'T13'])
  expect(calculateSchedule(initialProject, all).ok).toBe(true)
  expect(duplicateTask(tasks[2], 'T14', all).name).toBe('Join (Copy 2)')
})

test('A16 legacy schema 1 files migrate from prior array order and preserve the consumed-ID counter', () => {
  const legacy = { ...file(), manualOrder: undefined, sortMode: undefined, duplicateOrigins: undefined }
  const decoded = decodeProject(legacy)
  expect(decoded.ok).toBe(true)
  if (!decoded.ok) return
  expect(decoded.value.manualOrder).toEqual(['T2', 'T7', 'T9'])
  expect(decoded.value.sortMode).toBe('manual')
  expect(decoded.value.nextTaskNumber).toBe(12)
  expect(calculateSchedule(decoded.value.project, decoded.value.tasks)).toEqual(calculateSchedule(initialProject, tasks))
})

test('A05/A16 local and JSON round trips retain order, sort, deleted-ID high-water mark and copy provenance', () => {
  const copy = duplicateTask(tasks[0], 'T12', tasks)
  const created = createProjectFile({ ...data, tasks: [...tasks.slice(1).map(task => ({ ...task, predecessorTaskIds: task.predecessorTaskIds.filter(id => id !== 'T2') })), copy], nextTaskNumber: 15, manualOrder: ['T9', 'T12', 'T7'], sortMode: 'duration', duplicateOrigins: { T12: 'T2' } })
  expect(created.ok).toBe(true)
  if (!created.ok) return
  // T2 has been deleted; it is still a consumed ID represented by copy provenance.
  const parsed = parseProject(serializeProject(created.value))
  expect(parsed).toEqual(created)
  const map = new Map<string, string>()
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value) } }
  expect(saveLocalProject(storage, 'Ordered', created.value).ok).toBe(true)
  const library = readLocalProjects(storage)
  expect(library.ok).toBe(true)
  if (library.ok) expect(library.projects[0].plan).toEqual(created.value)
  expect(deleteLocalProject(storage, 'Ordered', false).ok).toBe(false)
  expect(projectFingerprint(created.value)).not.toBe(projectFingerprint({ ...created.value, sortMode: 'manual' }))
})

test.each([
  { manualOrder: ['T2', 'T7'] }, { manualOrder: ['T2', 'T7', 'T7'] }, { manualOrder: ['T2', 'T7', 'unknown'] },
  { manualOrder: 'T2' }, { sortMode: 'random' }, { sortMode: 0 }, { sortMode: null }, { duplicateOrigins: null },
  { duplicateOrigins: { T9: 'T9' } }, { duplicateOrigins: { absent: 'T1' } }, { duplicateOrigins: { T9: 'T12' } },
  { duplicateOrigins: { T9: 1 } }, { nextTaskNumber: 9 },
])('rejects malformed order/sort/copy/allocator metadata: %j', metadata => {
  expect(decodeProject({ ...file(), ...metadata }).ok).toBe(false)
})
