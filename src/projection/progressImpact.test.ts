// @vitest-environment node
import paperText from '../../docs/qa/wp7-3-1/evidence/scenario-evidence.json?raw'
import { describe, expect, test } from 'vitest'
import type { ProjectSettings, TaskInput, WorkingSlot, FinishBoundary } from '../domain'
import { analyzeCriticalPath, calculateSchedule } from '../domain'
import type { ProgressTracking } from '../progress/taskProgress'
import { emptyProgress, transitionTask } from '../progress/taskProgress'
import { calculateProgressImpact, impactDescription } from './progressImpact'
import { createProjectFile, parseProject, serializeProject } from '../persistence/projectFile'
import { establishBaseline } from '../baseline/baseline'
import { forecastSchedule } from '../forecast/forecast'

interface PaperCase {
  id: string; asOf: string; inputs?: { project: ProjectSettings; tasks: TaskInput[] }; tasks?: TaskInput[]; progress?: ProgressTracking
  manuallySpecifiedCandidate?: Record<string, { start: WorkingSlot | null; finish: FinishBoundary | null }>
  expectedProjectDate?: string | null; conditionalDate?: string | null
}
// WP7.3.1 paper answers predate the production calculation. Never regenerate
// expected dates with this implementation.
const paper = JSON.parse(paperText) as { cases: PaperCase[] }
const legacy = import.meta.glob<string>('../../tests/fixtures/wp71/legacy-format-*.json', { query: '?raw', import: 'default', eager: true })
const scenario = (id: string) => paper.cases.find(c => c.id === id)!
const run = (c: PaperCase) => calculateProgressImpact({ ...c.inputs!, progress: c.progress!, asOf: c.asOf })
const known = (c: PaperCase) => { const result = run(c); if (!result.ok) throw new Error(result.message); return result }
describe('WP7.3.1 independent L01-L16 answers', () => {
  for (const c of paper.cases) test(c.id, () => {
    if (c.id === 'L14c') {
      const result = calculateProgressImpact({ project: scenario('L01').inputs!.project, tasks: c.tasks!, asOf: c.asOf,
        progress: { ...emptyProgress(), tasks: { T1: { status: 'Complete', criteria: [] } } } })
      expect(result.ok).toBe(false); return
    }
    const before = JSON.stringify(c), committed = calculateSchedule(c.inputs!.project, c.inputs!.tasks)
    const critical = analyzeCriticalPath(c.inputs!.project, c.inputs!.tasks, committed)
    const result = known(c)
    for (const [id, expected] of Object.entries(c.manuallySpecifiedCandidate ?? {})) {
      const task = result.tasks.find(t => t.taskId === id)!
      expect(task.start).toEqual(expected.start); expect(task.finish).toEqual(expected.finish)
      if (!expected.finish) expect(task.state).toBe('Unknown')
    }
    expect(result.project.date).toBe(c.expectedProjectDate)
    if (c.conditionalDate) expect(result.project.knownDate).toBe(c.conditionalDate)
    expect(JSON.stringify(c)).toBe(before)
    expect(calculateSchedule(c.inputs!.project, c.inputs!.tasks)).toEqual(committed)
    expect(analyzeCriticalPath(c.inputs!.project, c.inputs!.tasks, committed)).toEqual(critical)
    expect(calculateProgressImpact({ ...c.inputs!, tasks: [...c.inputs!.tasks].reverse(), progress: c.progress!, asOf: c.asOf })).toEqual(result)
  })
})

test('precision-only movement, no historical late or confirmed same-date breach', () => {
  const result = known(scenario('L01b'))
  expect(result.tasks[0].completion?.historical).toBe('On date')
  expect(result.tasks[1].dateOrderBreaches).toEqual([])
  expect(result.tasks[1].shiftSlots).toBe('2')
  expect(impactDescription(result.tasks[1], result.asOf)).toContain('conservative')
})
test('As-of-only movement is not attributed to an unrelated late task', () => {
  const task = known(scenario('L11b')).tasks[1]
  expect(task.causes).toEqual(['As-of']); expect(task.binding.some(b => b.predecessorId === 'T1')).toBe(false)
})
test('all tied joins retained, committed critical analysis unchanged when driver changes', () => {
  expect(known(scenario('L06')).tasks[2].binding.filter(b => b.predecessorId).map(b => b.predecessorId)).toEqual(['T1', 'T2'])
  const c = scenario('L08'), result = known(c)
  expect(result.drivingTaskIds).toEqual(['T1', 'T2'])
  expect(result.drivingLinks).toEqual([JSON.stringify(['T1', 'T2'])])
  const critical = analyzeCriticalPath(c.inputs!.project, c.inputs!.tasks)
  if (!critical.ok) throw new Error('Expected committed CPM')
  expect(critical.tasks.filter(t => t.critical).map(t => t.taskId)).toEqual(['T3'])
})
test('old snapshot missing stays unknown; reopened marker is history; future facts uncertain', () => {
  expect(known(scenario('L14')).tasks[0].completion?.historical).toBe('Unknown')
  expect(known(scenario('L13')).tasks[0].completion?.active).toBe(false)
  expect(known(scenario('L14d')).project.uncertain).toBe(true)
  expect(known(scenario('L10')).conflicts).toHaveLength(1)
  expect(known(scenario('L10')).drivingLinks).toEqual([])
})
test('date-only controlling actual and fully-complete project never invent finish hour', () => {
  expect(known(scenario('L02')).project).toMatchObject({ actual: true, date: '2026-11-03', finish: null })
  expect(known(scenario('L11b')).project.finish).toBe(null)
})
test('same-date planned endpoints distinguish actual slot order and preserve only real finish ties', () => {
  const c = scenario('L01').inputs!
  const tasks = c.tasks.map((t, i) => ({ ...t, predecessorTaskIds: [], durationHours: i === 0 ? 2 : 4 }))
  const result = calculateProgressImpact({ project: c.project, tasks, progress: emptyProgress(), asOf: '2026-11-02' })
  expect(result.ok && result.drivingTaskIds).toEqual(['T2'])
  expect(result.ok && result.project.finish).toEqual({ date: '2026-11-02', afterHour: 4 })
  const tied = calculateProgressImpact({ project: c.project, tasks: tasks.map(t => ({ ...t, durationHours: 4 })), progress: emptyProgress(), asOf: '2026-11-02' })
  expect(tied.ok && tied.drivingTaskIds).toEqual(['T1', 'T2'])
})
test('date-only actual tying a planned finish retains possible drivers without fabricating actual hour', () => {
  const result = known(scenario('L11b'))
  expect(result.project.finish).toBeNull()
  expect(result.drivingTaskIds).toEqual(['T1', 'T2'])
})
test('same calendar date can still have a positive project finish-slot delay', () => {
  const c = scenario('L01b'), tasks: TaskInput[] = [...c.inputs!.tasks, { ...c.inputs!.tasks[1], taskId: 'T3', durationHours: 1, predecessorTaskIds: [], independentStartMode: 'MANUAL', requestedStartDate: '2026-11-03' }]
  const result = calculateProgressImpact({ project: c.inputs!.project, tasks, progress: c.progress!, asOf: c.asOf })
  expect(result.ok && result.project).toMatchObject({ date: '2026-11-03', calendarDays: 0, shiftSlots: '1', finish: { date: '2026-11-03', afterHour: 2 }, committedFinish: { date: '2026-11-03', afterHour: 1 } })
  expect(result.ok && result.drivingTaskIds).toEqual(['T1', 'T2'])
})
test('corrected effective dates follow recorded sequence, not maximum effective date', () => {
  const c = scenario('L03'), ids = c.inputs!.tasks.map(t => t.taskId)
  let tracking = c.progress!
  for (const [target, date, extra] of [
    ['In Progress', '2026-11-04', { reason: 'Correct completion date', reopenAcknowledged: true }],
    ['Complete', '2026-11-02', { completionAcknowledged: true, noCriteriaAcknowledged: true, committedFinishDateAtCompletion: '2026-11-02' }],
  ] as const) {
    const changed = transitionTask(tracking, 'T1', { target, date, eventId: `CORRECT-${target}`, recordedAt: '2026-11-10T12:00:00.000Z', ...extra }, ids)
    if (!changed.ok) throw new Error(JSON.stringify(changed.errors)); tracking = changed.value
  }
  const result = calculateProgressImpact({ ...c.inputs!, progress: tracking, asOf: '2026-11-02' })
  expect(result.ok && result.tasks[0].completion?.date).toBe('2026-11-02')
  expect(result.ok && result.tasks[1].finish?.date).toBe('2026-11-03')
})
test('immutable baseline, source save/reload and unchanged independent FF', () => {
  const c = scenario('L16'), inputs = { ...c.inputs!, nextTaskNumber: 3 }
  const frozen = establishBaseline(inputs, 'WP732-BL', '2026-11-01T12:00:00.000Z')
  if (!frozen.ok) throw new Error('Expected baseline')
  const settings = { schemaVersion: 1 as const, enabled: true, classHoursPerStudent: 28, homeworkHoursPerStudent: 0, teamSize: 1, asOfDate: c.asOf }
  const file = createProjectFile({ ...inputs, taskProgress: c.progress, baseline: frozen.value, workTracking: { schemaVersion: 1, entries: [], remainingHours: { T1: 4, T2: 4 } }, forecastSettings: settings }, '2026-11-10T12:00:00.000Z')
  if (!file.ok) throw new Error('Expected file')
  const bytes = serializeProject(file.value), result = known(c)
  const loaded = parseProject(bytes)
  if (!loaded.ok) throw new Error('Expected round trip')
  expect(calculateProgressImpact({ project: loaded.value.project, tasks: loaded.value.tasks, progress: loaded.value.taskProgress!, asOf: c.asOf })).toEqual(result)
  expect(serializeProject(file.value)).toBe(bytes); expect(loaded.value).toEqual(file.value)
  expect(bytes).not.toContain('drivingTaskIds'); expect(bytes).not.toContain('paAsOf')
  const ff = forecastSchedule({ ...inputs, progress: c.progress!, remainingHours: { T1: 4, T2: 4 }, settings, today: c.asOf })
  expect(ff.tasks.find(t => t.taskId === 'T2')?.forecastFinish).toBe('2026-11-04')
  expect(result.tasks[1].finish?.date).toBe('2026-11-05')
})
for (const version of [1, 2, 3, 4]) test(`legacy format ${version} remains calculable without invented history`, () => {
  const loaded = parseProject(legacy[`../../tests/fixtures/wp71/legacy-format-${version}.json`])
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors))
  const result = calculateProgressImpact({ project: loaded.value.project, tasks: loaded.value.tasks, progress: loaded.value.taskProgress ?? emptyProgress(), asOf: '2026-11-02' })
  expect(result.ok).toBe(true)
})
test('invalid date, cycles and range overflow fail atomically', () => {
  const c = scenario('L03')
  expect(calculateProgressImpact({ ...c.inputs!, progress: c.progress!, asOf: '' }).ok).toBe(false)
  const tasks = c.inputs!.tasks.map(t => ({ ...t, predecessorTaskIds: t.taskId === 'T1' ? ['T2'] : ['T1'] }))
  expect(calculateProgressImpact({ ...c.inputs!, tasks, progress: c.progress!, asOf: c.asOf }).ok).toBe(false)
  expect(calculateProgressImpact({ ...c.inputs!, tasks: c.inputs!.tasks.map(t => ({ ...t, durationHours: 8 })), progress: c.progress!, asOf: '9999-12-31' }).ok).toBe(false)
})
