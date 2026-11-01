// @vitest-environment node
import { expect, test } from 'vitest'
import { decodeProgress, emptyProgress, progressForTask, replaceCriteria, transitionTask } from '../progress/taskProgress'
import type { ProgressTracking } from '../progress/taskProgress'
import { workBaseline, workData, workRecords, workTimestamp } from '../test/workFixture'
import { createProjectFile, decodeProject, parseProject, projectFingerprint, serializeProject } from './projectFile'
import { LOCAL_PROJECTS_KEY, readLocalProjects, saveLocalProject } from './localProjects'

const ids = workData.tasks.map(task => task.taskId)
const timestamp = '2026-11-01T12:00:00.000Z'
function valid(result: ReturnType<typeof decodeProgress>): ProgressTracking { if (!result.ok) throw new Error(JSON.stringify(result.errors)); return result.value }
function progress() {
  let data = valid(replaceCriteria(emptyProgress(), 'T2', [{ criterionId: 'C-1', text: 'Checks pass with valid data', checked: true }], ids))
  data = { ...data, definitionOfDone: 'Tests pass and evidence is recorded' }
  data = valid(transitionTask(data, 'T2', { target: 'Complete', eventId: 'E-1', date: '2026-10-30', recordedAt: timestamp, completionAcknowledged: true, note: 'Demo notes in class folder' }, ids))
  return valid(transitionTask(data, 'T9', { target: 'Blocked', eventId: 'E-2', date: '2026-11-01', recordedAt: timestamp, reason: 'Waiting for publication access' }, ids))
}
function file() {
  const result = createProjectFile({ ...workData, baseline: workBaseline(), workTracking: workRecords(), taskProgress: progress() }, timestamp)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}
function storage() {
  const values = new Map<string, string>()
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

test('A12 local and JSON round trips retain status, DoD, criteria, history IDs/snapshots, blocked reason, work and baseline', () => {
  const original = file()
  expect(original.schemaVersion).toBe(4)
  expect(parseProject(serializeProject(original))).toEqual({ ok: true, value: original })
  const local = storage()
  expect(saveLocalProject(local, 'Status plan', original).ok).toBe(true)
  const loaded = readLocalProjects(local)
  if (!loaded.ok) throw new Error('Load failed')
  expect(loaded.projects[0].plan).toEqual(original)
  expect(Object.isFrozen(loaded.projects[0].plan.taskProgress!.events[0].criteriaSnapshot)).toBe(true)
})

test.each([1, 2, 3])('A01 format %i imports with safe defaults, no history and no automatic saved-copy rewrite', version => {
  const legacy = { format: 'react-gantt-chart', schemaVersion: version, createdBy: 'React Gantt Chart', savedAt: workTimestamp, ...workData,
    ...(version >= 2 ? { baseline: workBaseline() } : {}), ...(version >= 3 ? { workTracking: workRecords() } : {}) }
  const raw = JSON.stringify({ schemaVersion: 1, projects: [{ name: 'Legacy', savedAt: workTimestamp, plan: legacy }] })
  const local = storage(); local.values.set(LOCAL_PROJECTS_KEY, raw)
  const loaded = readLocalProjects(local)
  if (!loaded.ok) throw new Error('Legacy load failed')
  expect(loaded.projects[0].plan.schemaVersion).toBe(version)
  expect(loaded.projects[0].plan).not.toHaveProperty('taskProgress')
  expect(progressForTask(loaded.projects[0].plan.taskProgress ?? emptyProgress(), 'T2')).toEqual({ status: 'Not Started', criteria: [] })
  expect(local.values.get(LOCAL_PROJECTS_KEY)).toBe(raw)
  expect(saveLocalProject(local, 'New copy', file()).ok).toBe(true)
  expect(JSON.parse(local.values.get(LOCAL_PROJECTS_KEY)!).projects.find((entry: { name: string }) => entry.name === 'Legacy').plan).toEqual(legacy)
})

test.each([
  { ...progress(), tasks: { T2: { status: 'Ready for Review', criteria: [] } } },
  { ...progress(), events: [...progress().events, progress().events[0]] },
  { ...progress(), events: [{ ...progress().events[0], taskId: 'missing' }] },
  { ...progress(), events: [{ ...progress().events[0], criteriaSnapshot: [{ criterionId: 'C-1', text: 'Changed criterion', checked: false }] }] },
  { ...progress(), schemaVersion: 99 },
  null,
])('A13 invalid progress payload rejects import/save without damaging storage %#', taskProgress => {
  const local = storage(); saveLocalProject(local, 'Safe', file())
  const before = local.values.get(LOCAL_PROJECTS_KEY)
  const corrupt = { ...file(), taskProgress }
  expect(decodeProject(corrupt).ok).toBe(false)
  expect(saveLocalProject(local, 'Safe', corrupt as ReturnType<typeof file>, true).ok).toBe(false)
  expect(local.values.get(LOCAL_PROJECTS_KEY)).toBe(before)
})

test('old format cannot carry progress; explicit status or DoD updates dirty the project, empty defaults do not', () => {
  expect(decodeProject({ ...file(), schemaVersion: 3 }).ok).toBe(false)
  expect(projectFingerprint(workData)).toBe(projectFingerprint({ ...workData, taskProgress: emptyProgress() }))
  expect(projectFingerprint(workData)).not.toBe(projectFingerprint({ ...workData, taskProgress: progress() }))
  expect(projectFingerprint(workData)).not.toBe(projectFingerprint({ ...workData, taskProgress: { ...emptyProgress(), definitionOfDone: 'Tests pass' } }))
})
