// @vitest-environment node
import { expect, test } from 'vitest'
import { baselineInputs, establishedAt, snapshot } from '../test/baselineFixture'
import { createProjectFile, decodeProject, parseProject, projectFingerprint, serializeProject } from './projectFile'
import { LOCAL_PROJECTS_KEY, readLocalProjects, saveLocalProject, deleteLocalProject } from './localProjects'

function file(baseline = true) {
  const result = createProjectFile({ ...baselineInputs, baseline: baseline ? snapshot() : undefined } as Parameters<typeof createProjectFile>[0], establishedAt)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}
function storage() {
  const values = new Map<string, string>()
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

test('A07 JSON preserves the exact baseline separately from changed current inputs, deleted tasks and display order', () => {
  const original = file()
  const changed = { ...original, tasks: [{ ...original.tasks[0], durationHours: 19 }], manualOrder: ['T2'], project: { ...original.project, name: 'Current plan changed', workingHoursPerDay: 1, targetEndDate: '2027-01-01' } }
  const parsed = parseProject(serializeProject(changed))
  expect(parsed.ok).toBe(true)
  if (!parsed.ok) return
  expect(parsed.value.baseline).toEqual(original.baseline)
  expect(parsed.value.tasks[0].durationHours).toBe(19)
  expect(parsed.value.project.name).toBe('Current plan changed')
  expect(parsed.value.manualOrder).toEqual(['T2'])
  expect(parsed.value.baseline!.manualOrder).toEqual(['T15', 'T2', 'T9'])
  expect(parsed.value.baseline!.tasks.map(task => task.taskId)).toEqual(['T2', 'T9', 'T15'])
  expect(Object.isFrozen(parsed.value.baseline!.schedule)).toBe(true)
})

test('A07 local save/load preserves both layers exactly and baseline creation participates in dirty checks', () => {
  const local = storage()
  expect(projectFingerprint(file())).not.toBe(projectFingerprint(file(false)))
  expect(saveLocalProject(local, 'Approved', file()).ok).toBe(true)
  const loaded = readLocalProjects(local)
  if (!loaded.ok) throw new Error('Load failed')
  expect(loaded.projects[0].plan).toEqual(file())
  expect(projectFingerprint(loaded.projects[0].plan)).toBe(projectFingerprint(file()))
})

test('A08 legacy read is nondestructive, fabricates no baseline, and only explicit creation writes the current format', () => {
  const local = storage()
  const legacy = { ...file(false), schemaVersion: 1 }
  const { manualOrder: _order, sortMode: _sort, duplicateOrigins: _origins, ...oldest } = legacy
  void _order; void _sort; void _origins
  const original = JSON.stringify({ schemaVersion: 1, projects: [{ name: 'Legacy', savedAt: establishedAt, plan: { ...oldest, customLegacyField: 'Keep untouched' } }] })
  local.values.set(LOCAL_PROJECTS_KEY, original)
  const read = readLocalProjects(local)
  expect(read.ok).toBe(true)
  if (!read.ok) return
  expect(read.projects[0].plan.schemaVersion).toBe(1)
  expect(read.projects[0].plan).not.toHaveProperty('baseline')
  expect(local.values.get(LOCAL_PROJECTS_KEY)).toBe(original)
  expect(saveLocalProject(local, 'Other', file()).ok).toBe(true)
  const afterOtherSave = JSON.parse(local.values.get(LOCAL_PROJECTS_KEY)!)
  expect(afterOtherSave.projects.find((entry: { name: string }) => entry.name === 'Legacy').plan).toEqual({ ...oldest, customLegacyField: 'Keep untouched' })
  expect(deleteLocalProject(local, 'Other', true).ok).toBe(true)
  expect(JSON.parse(local.values.get(LOCAL_PROJECTS_KEY)!).projects[0].plan).toEqual({ ...oldest, customLegacyField: 'Keep untouched' })
  const migrated = createProjectFile(read.projects[0].plan, establishedAt)
  expect(migrated.ok && migrated.value.schemaVersion).toBe(3)
  expect(migrated.ok && migrated.value.baseline).toBeUndefined()
  expect(read.projects[0].plan.schemaVersion).toBe(1)
})

test.each([
  { baseline: null },
  { baseline: { ...snapshot(), schemaVersion: 99 } },
  { baseline: { ...snapshot(), project: { ...snapshot().project, projectId: 'OTHER' } } },
  { baseline: { ...snapshot(), schedule: {} } },
  { schemaVersion: 1 },
  { tasks: [{ ...baselineInputs.tasks[0], durationHours: 0 }] },
  { nextTaskNumber: 16 },
])('A09 corrupt independent layers or lowered historical counter reject save and leave storage intact %#', change => {
  const local = storage()
  saveLocalProject(local, 'Safe', file())
  const original = local.values.get(LOCAL_PROJECTS_KEY)
  const corrupt = { ...file(), ...change }
  expect(decodeProject(corrupt).ok).toBe(false)
  expect(saveLocalProject(local, 'Safe', corrupt as ReturnType<typeof file>, true).ok).toBe(false)
  expect(local.values.get(LOCAL_PROJECTS_KEY)).toBe(original)
})
