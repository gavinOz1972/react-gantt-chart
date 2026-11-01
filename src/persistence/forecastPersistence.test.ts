// @vitest-environment node
import { expect, test } from 'vitest'
import { workBaseline, workData, workRecords, workTimestamp } from '../test/workFixture'
import { forecastSchedule } from '../forecast/forecast'
import { emptyProgress, transitionTask } from '../progress/taskProgress'
import { createProjectFile, decodeProject, parseProject, projectFingerprint, serializeProject } from './projectFile'
import { LOCAL_PROJECTS_KEY, readLocalProjects, saveLocalProject } from './localProjects'
const settings = { schemaVersion: 1 as const, enabled: true, classHoursPerStudent: 3, homeworkHoursPerStudent: 5, teamSize: 4, asOfDate: '2026-11-02' }
function file() {
  const progress = transitionTask(emptyProgress(), 'T2', { target: 'Complete', eventId: 'E-1', date: '2026-11-09', recordedAt: workTimestamp, completionAcknowledged: true, noCriteriaAcknowledged: true, committedFinishDateAtCompletion: '2026-11-06' }, ['T2', 'T9'])
  if (!progress.ok) throw new Error('Invalid progress fixture')
  const result = createProjectFile({ ...workData, baseline: workBaseline(), workTracking: workRecords(), taskProgress: progress.value, forecastSettings: settings }, workTimestamp)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}
const storage = () => {
  const values = new Map<string, string>()
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}
test('A11/A14 version 5 JSON and local round trips preserve assumptions/history, derive projections on load', () => {
  const original = file(), local = storage()
  expect(original.schemaVersion).toBe(5)
  const parsed = parseProject(serializeProject(original)); expect(parsed).toEqual({ ok: true, value: original })
  expect(original).not.toHaveProperty('forecastFinish')
  expect(saveLocalProject(local, 'Forecast', original).ok).toBe(true)
  const read = readLocalProjects(local); if (!read.ok) throw new Error('Read failed')
  expect(read.projects[0].plan).toEqual(original)
  const result = forecastSchedule({ ...read.projects[0].plan, settings: original.forecastSettings, progress: original.taskProgress, remainingHours: original.workTracking!.remainingHours, today: '2027-01-01' })
  expect(result.tasks[0].indicator).toBe('Completed Late'); expect(result.asOfDate).toBe(settings.asOfDate)
  expect(result.tasks[1].forecastFinish).toBeNull()
})
test.each([1, 2, 3, 4])('A14 legacy format %i has unset forecasting and untouched original saved copy', version => {
  const legacy = { ...workData, format: 'react-gantt-chart', schemaVersion: version, createdBy: 'React Gantt Chart', savedAt: workTimestamp }
  const local = storage(), raw = JSON.stringify({ schemaVersion: 1, projects: [{ name: 'Legacy', savedAt: workTimestamp, plan: legacy }] })
  local.values.set(LOCAL_PROJECTS_KEY, raw)
  const read = readLocalProjects(local); if (!read.ok) throw new Error('Legacy read failed')
  expect(read.projects[0].plan.forecastSettings).toBeUndefined(); expect(local.values.get(LOCAL_PROJECTS_KEY)).toBe(raw)
  expect(saveLocalProject(local, 'New copy', file()).ok).toBe(true)
  expect(JSON.parse(local.values.get(LOCAL_PROJECTS_KEY)!).projects[0].plan).toEqual(legacy)
})
test.each([null, { ...settings, teamSize: -1 }, { ...settings, classHoursPerStudent: NaN }, { ...settings, asOfDate: '2026-02-29' }, { ...settings, schemaVersion: 99 }])('PS02 malformed assumptions cannot overwrite a saved project %#', forecastSettings => {
  const local = storage(); saveLocalProject(local, 'Safe', file())
  const before = local.values.get(LOCAL_PROJECTS_KEY)
  expect(decodeProject({ ...file(), forecastSettings }).ok).toBe(false)
  expect(saveLocalProject(local, 'Safe', { ...file(), forecastSettings } as ReturnType<typeof file>, true).ok).toBe(false)
  expect(local.values.get(LOCAL_PROJECTS_KEY)).toBe(before)
})
test('completion snapshot survives current date edits and affects dirty detection; malformed contexts rejected', () => {
  const original = file(), event = original.taskProgress!.events[0]
  const changed = { ...original, taskProgress: { ...original.taskProgress!, events: [{ ...event, committedFinishDateAtCompletion: '2026-11-10' }] } }
  expect(projectFingerprint(original)).not.toBe(projectFingerprint(changed))
  expect(decodeProject({ ...original, taskProgress: { ...original.taskProgress, events: [{ ...event, committedFinishDateAtCompletion: 'bad' }] } }).ok).toBe(false)
  const ordinary = transitionTask(emptyProgress(), 'T2', { target: 'In Progress', eventId: 'E-2', date: '2026-11-01', recordedAt: workTimestamp }, ['T2'])
  if (!ordinary.ok) throw new Error('Invalid transition fixture')
  expect(decodeProject({ ...original, taskProgress: { ...ordinary.value, events: [{ ...ordinary.value.events[0], committedFinishDateAtCompletion: '2026-11-06' }] } }).ok).toBe(false)
  expect(projectFingerprint(workData)).not.toBe(projectFingerprint({ ...workData, forecastSettings: settings }))
  expect(decodeProject({ ...original, schemaVersion: 4 }).ok).toBe(false)
})
