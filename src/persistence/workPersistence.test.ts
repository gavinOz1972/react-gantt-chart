// @vitest-environment node
import { expect, test } from 'vitest'
import { workBaseline, workData, workEntry, workRecords, workTimestamp } from '../test/workFixture'
import { emptyWorkTracking } from '../workTracking/workTracking'
import { createProjectFile, decodeProject, parseProject, projectFingerprint, serializeProject } from './projectFile'
import { LOCAL_PROJECTS_KEY, readLocalProjects, saveLocalProject } from './localProjects'

function file() {
  const result = createProjectFile({ ...workData, baseline: workBaseline(), workTracking: { ...workRecords(), remainingHours: { T2: 0, T9: null } } }, workTimestamp)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}
function storage() {
  const values = new Map<string, string>()
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

test('A09 JSON and named Save/Load preserve logs/IDs, metadata, baseline and explicit zero versus unknown', () => {
  const original = file()
  expect(original.schemaVersion).toBe(4)
  const parsed = parseProject(serializeProject(original))
  expect(parsed).toEqual({ ok: true, value: original })
  const local = storage()
  expect(saveLocalProject(local, 'Work plan', original).ok).toBe(true)
  const loaded = readLocalProjects(local)
  if (!loaded.ok) throw new Error('Load failed')
  expect(loaded.projects[0].plan).toEqual(original)
  expect(loaded.projects[0].plan.workTracking!.remainingHours).toEqual({ T2: 0, T9: null })
  expect(loaded.projects[0].plan.baseline).toEqual(workBaseline())
})

test.each([1, 2])('A10 format %i loads with no invented work or estimates and no automatic rewrite', version => {
  const { baseline, workTracking: _work, ...inputs } = file()
  void _work
  const legacy = { ...inputs, schemaVersion: version, ...(version === 2 ? { baseline } : {}) }
  const local = storage()
  const raw = JSON.stringify({ schemaVersion: 1, projects: [{ name: 'Legacy', savedAt: workTimestamp, plan: legacy }] })
  local.values.set(LOCAL_PROJECTS_KEY, raw)
  const loaded = readLocalProjects(local)
  if (!loaded.ok) throw new Error('Legacy load failed')
  expect(loaded.projects[0].plan.schemaVersion).toBe(version)
  expect(loaded.projects[0].plan).not.toHaveProperty('workTracking')
  expect(local.values.get(LOCAL_PROJECTS_KEY)).toBe(raw)
  const backup = parseProject(serializeProject(loaded.projects[0].plan))
  expect(backup.ok && backup.value.schemaVersion).toBe(version)
  expect(saveLocalProject(local, 'New copy', file()).ok).toBe(true)
  const untouched = JSON.parse(local.values.get(LOCAL_PROJECTS_KEY)!).projects.find((item: { name: string }) => item.name === 'Legacy')
  expect(untouched.plan).toEqual(legacy)
})

test.each([
  { workTracking: null },
  { workTracking: { ...workRecords(), schemaVersion: 2 } },
  { workTracking: { ...workRecords(), entries: [workEntry(), workEntry()] } },
  { workTracking: { ...workRecords(), entries: [workEntry('W-BAD', 1, '2026-10-28', 'T999')] } },
  { workTracking: { ...workRecords(), entries: [{ ...workEntry(), hours: 0 }] } },
  { workTracking: { ...workRecords(), remainingHours: { T999: 1 } } },
  { schemaVersion: 2 }, { schemaVersion: 1 },
])('A11 corrupt work records fail atomically before overwriting the saved project %#', change => {
  const local = storage()
  saveLocalProject(local, 'Safe', file())
  const before = local.values.get(LOCAL_PROJECTS_KEY)
  const corrupt = { ...file(), ...change }
  expect(decodeProject(corrupt).ok).toBe(false)
  expect(saveLocalProject(local, 'Safe', corrupt as ReturnType<typeof file>, true).ok).toBe(false)
  expect(local.values.get(LOCAL_PROJECTS_KEY)).toBe(before)
})

test('effort changes dirty the project while sorting entries/estimate object keys and unknown defaults do not', () => {
  const original = file()
  expect(projectFingerprint(original)).not.toBe(projectFingerprint({ ...original, workTracking: { ...workRecords(), remainingHours: { T2: 5 } } }))
  expect(projectFingerprint(original)).toBe(projectFingerprint({ ...original, workTracking: { ...original.workTracking!, entries: [...original.workTracking!.entries].reverse(), remainingHours: { T9: null, T2: 0 } } }))
  expect(projectFingerprint(workData)).toBe(projectFingerprint({ ...workData, workTracking: emptyWorkTracking() }))
  expect(projectFingerprint(workData)).toBe(projectFingerprint({ ...workData, workTracking: { ...emptyWorkTracking(), remainingHours: { T2: null } } }))
  expect(projectFingerprint(workData)).not.toBe(projectFingerprint({ ...workData, workTracking: { ...emptyWorkTracking(), remainingHours: { T2: 0 } } }))
})
