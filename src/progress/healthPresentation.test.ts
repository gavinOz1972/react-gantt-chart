// @vitest-environment node
import { expect, test } from 'vitest'
import { calculateSchedule } from '../domain'
import { forecastSchedule } from '../forecast/forecast'
import { workData } from '../test/workFixture'
import { emptyProgress, transitionTask } from './taskProgress'
import type { ProgressTracking, TaskStatus } from './taskProgress'
import { healthPresentation, indicatorPresentation, isObservedHealth, taskHealthDescription } from './healthPresentation'

const settings = { schemaVersion: 1 as const, enabled: true, classHoursPerStudent: 3, homeworkHoursPerStudent: 5, teamSize: 4, asOfDate: '2026-11-02' }
const remaining = { T2: 5, T9: 2 }
function transition(progress: ProgressTracking, taskId: string, target: TaskStatus, date = '2026-11-10') {
  const next = transitionTask(progress, taskId, { target, eventId: `E-${progress.events.length}`, date, recordedAt: '2026-11-01T12:00:00.000Z', completionAcknowledged: true, noCriteriaAcknowledged: true, reason: 'Awaiting project decision', ...(target === 'Complete' ? { committedFinishDateAtCompletion: '2026-11-06' } : {}) }, ['T2', 'T9'])
  if (!next.ok) throw new Error(JSON.stringify(next.errors))
  return next.value
}
function present(progress = emptyProgress(), patch: Partial<Parameters<typeof forecastSchedule>[0]> = {}, invalid = false) {
  const data = { ...workData, settings, today: '2026-11-01', progress, remainingHours: remaining, ...patch }
  const result = forecastSchedule(data)
  return healthPresentation(data.project, data.tasks, calculateSchedule(data.project, data.tasks), result, progress, invalid, data.remainingHours)
}
test('available projection within target is On Track; task labels reuse WP6.4 assessment', () => {
  const health = present()
  expect(health.project).toMatchObject({ label: 'On Track', forecastState: 'Complete', blocked: 0, late: 0 })
  expect(health.tasks.get('T2')!.label).toBe('Ahead of Plan')
})
test('forecast past target is At Risk before/on target, Late after target with incomplete work', () => {
  const low = { ...settings, classHoursPerStudent: 1, homeworkHoursPerStudent: 0, teamSize: 1 }
  expect(present(undefined, { settings: low, remainingHours: { T2: 100, T9: 100 } }).project.label).toBe('At Risk')
  expect(present(undefined, { settings: { ...low, asOfDate: workData.project.targetEndDate }, remainingHours: { T2: 100, T9: 100 } }).project.label).toBe('At Risk')
  expect(present(undefined, { settings: { ...settings, asOfDate: '2026-12-19' } }).project.label).toBe('Late')
})
test('unknown effort is Partial/Uncertain; blocked and descendants are indeterminate, never green', () => {
  expect(present(undefined, { remainingHours: { T2: null, T9: 2 } }).project).toMatchObject({ label: 'Uncertain', forecastState: 'Partial' })
  const blocked = transition(emptyProgress(), 'T2', 'Blocked')
  const state = present(blocked)
  expect(state.project).toMatchObject({ label: 'Uncertain', availability: 'Indeterminate', blocked: 1 })
  expect(state.tasks.get('T2')).toMatchObject({ label: 'Uncertain', workStatus: 'Blocked' })
  expect(state.tasks.get('T9')!.label).toBe('Uncertain')
  expect(present(transition(blocked, 'T2', 'In Progress')).project.label).toBe('On Track')
})
test('blocking does not conceal independent Late assessment or project target lateness', () => {
  const blocked = transition(emptyProgress(), 'T2', 'Blocked')
  const state = present(blocked, { settings: { ...settings, asOfDate: '2026-12-19' } })
  expect(state.tasks.get('T2')).toMatchObject({ label: 'Late', workStatus: 'Blocked' })
  expect(state.project).toMatchObject({ label: 'Late', blocked: 1, late: 2, availability: 'Indeterminate' })
})
test.each([undefined, { ...settings, enabled: false }, { ...settings, classHoursPerStudent: 0, homeworkHoursPerStudent: 0 }])('disabled/zero capacity is unavailable and uncertain %#', value => {
  expect(present(undefined, { settings: value }).project).toMatchObject({ label: 'Uncertain', availability: 'Forecast Unavailable' })
})
test('invalid setting drafts suppress green assessments without changing accepted objects', () => {
  expect(present(undefined, {}, true).project).toMatchObject({ label: 'Uncertain', forecastState: 'Unavailable' })
  expect(present(undefined, {}, true).tasks.get('T2')!.label).toBe('Uncertain')
})
test('completed project uses latest effective completion, not active risk, even with forecasting disabled', () => {
  const progress = transition(transition(emptyProgress(), 'T2', 'Complete', '2026-11-08'), 'T9', 'Complete', '2026-11-10')
  const health = present(progress, { settings: undefined })
  expect(health.project).toMatchObject({ label: 'Completed', completed: true, completionDate: '2026-11-10', late: 0, knownRemaining: 0 })
  expect(health.tasks.get('T2')!.label).toBe('Completed Late')
  expect(present(progress, { project: { ...workData.project, targetEndDate: '2026-11-09' } }).project.label).toBe('Completed Late')
})
test('task historical lateness is retained after commitment changes; presentation never mutates data', () => {
  const progress = transition(emptyProgress(), 'T2', 'Complete')
  const before = JSON.stringify({ workData, progress, settings, remaining })
  const health = present(progress, { tasks: workData.tasks.map(task => ({ ...task, durationHours: task.durationHours + 100 })) })
  expect(health.tasks.get('T2')!.label).toBe('Completed Late')
  expect(JSON.stringify({ workData, progress, settings, remaining })).toBe(before)
})
test('disabled projection still shows saved remaining effort and known Late dates', () => {
  expect(present(undefined, { settings: undefined }).project.knownRemaining).toBe(7)
  expect(present(undefined, { settings: { ...settings, enabled: false, asOfDate: '2026-11-09' } }).tasks.get('T2')!.label).toBe('Late')
})
test('task Forecast Slip is separate from project At Risk; earlier/same-date predictions have distinct labels', () => {
  const result = present(undefined, { remainingHours: { T2: 100, T9: 2 } })
  expect(result.tasks.get('T2')!.label).toBe('Forecast Slip')
  expect(result.project.label).toBe('On Track')
  expect(indicatorPresentation('On Schedule', { forecastFinish: '2026-11-02', committedFinish: '2026-11-06' }).label).toBe('Ahead of Plan')
  expect(indicatorPresentation('On Schedule', { forecastFinish: '2026-11-06', committedFinish: '2026-11-06' }).label).toBe('On Track')
  expect(indicatorPresentation('Uncertain', { forecastFinish: null, committedFinish: '2026-11-06' }).label).toBe('Uncertain')
})
test.each(['Forecast Slip', 'Ahead of Plan', 'On Track', 'Uncertain'])('forecast-off chart descriptions omit predictive %s labels while retaining work status', label => {
  const health = { label, tone: 'uncertain' as const, workStatus: 'Blocked' as const, explanation: 'Predictive explanation' }
  expect(isObservedHealth(health)).toBe(false)
  expect(taskHealthDescription(health, false)).toBe('work status Blocked.')
  expect(taskHealthDescription(health, true)).toContain(label)
})
test.each(['Late', 'Completed Late', 'Completed on time'])('forecast-off retains observed %s', label => {
  const health = { label, tone: 'late' as const, workStatus: label === 'Late' ? 'In Progress' as const : 'Complete' as const, explanation: 'Historical evidence' }
  expect(isObservedHealth(health)).toBe(true)
  expect(taskHealthDescription(health, false)).toContain(label)
})
test('invalid forecast capacity drafts cannot erase actual lateness at the accepted As-of date', () => {
  expect(present(undefined, { settings: { ...settings, asOfDate: '2026-11-09' } }, true).tasks.get('T2')!.label).toBe('Late')
})
