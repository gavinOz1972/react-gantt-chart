/** Deterministic existing-domain inputs. No operational port/shim dependency. */
import { establishBaseline } from '../../../../src/baseline/baseline'
import type { Baseline } from '../../../../src/baseline/baseline'
import { emptyProgress, transitionTask } from '../../../../src/progress/taskProgress'
import type { ProgressTracking, TaskStatus } from '../../../../src/progress/taskProgress'
import { emptyWorkTracking, entryFromDraft } from '../../../../src/workTracking/workTracking'
import type { WorkTracking } from '../../../../src/workTracking/workTracking'
import type { ForecastSettings } from '../../../../src/forecast/settings'
import type { ProjectSettings, TaskInput } from '../../../../src/types/scheduling'
import { calculateSchedule } from '../../../../src/domain'

export const stamp = '2026-11-09T15:00:00.000Z'
export interface LegacyCase {
  id: string
  project: ProjectSettings
  tasks: TaskInput[]
  order: string[]
  progress: ProgressTracking
  work: WorkTracking
  settings: ForecastSettings
  baseline?: Baseline
  asOf: string
  coverage: 'CompleteSince' | 'Partial'
  lifecycle: 'Active' | 'Retired' | 'Restored'
  acceptedLegacyProgress: boolean
}
export function base(id = 'created', count = 3): LegacyCase {
  const project: ProjectSettings = { projectId: 'parity-project', name: 'Deterministic parity fixture', projectStartDate: '2026-11-02', targetEndDate: '2026-11-13', workingWeekdays: [1, 4, 5], workingHoursPerDay: 3 }
  const tasks: TaskInput[] = Array.from({ length: count }, (_, i) => ({ taskId: 'T' + (i + 1), name: 'Task ' + (i + 1), description: 'Authored characterization fixture', durationHours: [5, 3, 2][i % 3], predecessorTaskIds: i === 1 ? ['T1'] : [], independentStartMode: 'DEFAULT' }))
  const order = tasks.map(t => t.taskId), progress = { ...emptyProgress(), definitionOfDone: 'Reviewed deliverable guidance.' }
  const work = { ...emptyWorkTracking(), remainingHours: Object.fromEntries(tasks.map(t => [t.taskId, t.durationHours])) }
  return { id, project, tasks, order, progress, work, settings: { schemaVersion: 1, enabled: true, classHoursPerStudent: 4, homeworkHoursPerStudent: 2, teamSize: 4, asOfDate: '2026-11-02' }, asOf: '2026-11-02', coverage: 'CompleteSince', lifecycle: 'Active', acceptedLegacyProgress: true }
}
export function baseline(c: LegacyCase): LegacyCase {
  const result = establishBaseline({ project: c.project, tasks: c.tasks, nextTaskNumber: c.tasks.length + 1, manualOrder: c.order, sortMode: 'manual', duplicateOrigins: {} }, 'B-parity-original', '2026-11-02T14:00:00.000Z')
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return { ...c, baseline: result.value }
}
export function status(c: LegacyCase, target: TaskStatus, taskId = 'T1', date = '2026-11-05'): LegacyCase {
  const schedule = calculateSchedule(c.project, c.tasks)
  if (!schedule.ok) throw new Error('Invalid status fixture schedule')
  const committedFinish = schedule.tasks.find(t => t.taskId === taskId)!.finishDate
  const result = transitionTask(c.progress, taskId, { target, date, eventId: c.id + '-E' + c.progress.events.length, recordedAt: stamp,
    ...(target === 'Complete' ? { completionAcknowledged: true, noCriteriaAcknowledged: true, committedFinishDateAtCompletion: committedFinish, note: 'Explicit fixture confirmation' } : {}),
    ...(target === 'Blocked' || c.progress.tasks[taskId]?.status === 'Complete' ? { reason: 'Explicit reassessment rationale', reopenAcknowledged: true } : {}) }, c.tasks.map(t => t.taskId))
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return { ...c, progress: result.value }
}
export function legacyCases(): LegacyCase[] {
  const created = baseline(base()), complete = status(status({ ...created, id: 'complete' }, 'In Progress'), 'Complete')
  const reopened = status({ ...complete, id: 'reopened' }, 'In Progress')
  const neverCompleted = status(status(status({ ...created, id: 'never-completed' }, 'In Progress'), 'Blocked'), 'In Progress')
  const blocked = status({ ...created, id: 'blocked' }, 'Blocked')
  const legacyReferenceMissing = { ...complete, id: 'complete-no-reference', coverage: 'Partial' as const, progress: { ...complete.progress, events: complete.progress.events.map(e => { const { committedFinishDateAtCompletion, ...rest } = e; void committedFinishDateAtCompletion; return rest }) } }
  const tied = status(status(status({ ...created, id: 'timestamp-ties' }, 'In Progress'), 'Complete'), 'Complete', 'T3', '2026-11-02')
  const corrected = { ...created, id: 'work-corrected' }
  const first = entryFromDraft({ contributor: 'A', workDate: '2026-11-03', hours: '2', description: 'Initial authored work' }, 'T1', 'W1', stamp)
  if (!first.ok) throw new Error('Invalid work seed')
  const correction = entryFromDraft({ contributor: 'A', workDate: '2026-11-03', hours: '1.5', description: 'Corrected recorded work' }, 'T1', 'ignored', '2026-11-10T15:00:00.000Z', first.value)
  const extra = entryFromDraft({ contributor: 'B', workDate: '2026-11-03', hours: '.25', description: 'Additional recorded work' }, 'T1', 'W3', stamp)
  if (!correction.ok || !extra.ok) throw new Error('Invalid corrected work')
  corrected.work = { ...created.work, entries: [extra.value, correction.value] }
  const dense = base('dense100', 100)
  dense.project = { ...dense.project, targetEndDate: '2027-12-31' }
  dense.tasks = dense.tasks.map((t, i) => ({ ...t, durationHours: 2, predecessorTaskIds: i === 0 ? [] : [...new Set(['T1', ...Array.from({ length: Math.min(i, 10) }, (_, k) => 'T' + (i - k))])] }))
  dense.work = { ...dense.work, remainingHours: Object.fromEntries(dense.tasks.map(t => [t.taskId, 2])) }
  const retired = { ...created, id: 'retired', lifecycle: 'Retired' as const, tasks: created.tasks.map(t => ({ ...t, predecessorTaskIds: t.predecessorTaskIds.filter(p => p !== 'T1') })) }
  const { asOfDate, ...automatic } = created.settings; void asOfDate
  const sameDay = status(status({ ...created, id: 'same-day-actuals', asOf: '2026-11-09' }, 'Complete'), 'Complete', 'T2')
  return [base('empty', 0), created, complete, reopened, neverCompleted, blocked,
    { ...created, id: 'unknown-remaining', work: { ...created.work, remainingHours: { ...created.work.remainingHours, T3: null } } },
    { ...created, id: 'partial-history', coverage: 'Partial' }, legacyReferenceMissing, tied, corrected,
    { ...created, id: 'work-retracted', work: { ...created.work, entries: [] } },
    { ...base('no-baseline'), settings: { ...created.settings, asOfDate: '2026-11-09' }, asOf: '2026-11-09' },
    baseline(dense), retired, { ...created, id: 'restored', lifecycle: 'Restored' },
    { ...complete, id: 'missing-history-invalid', acceptedLegacyProgress: false, coverage: 'Partial', progress: { ...complete.progress, events: [] } },
    { ...created, id: 'forecast-disabled', settings: { ...created.settings, enabled: false } },
    { ...created, id: 'at-risk', settings: { ...created.settings, classHoursPerStudent: 0, homeworkHoursPerStudent: .1, teamSize: 1 } },
    { ...created, id: 'late-project', asOf: '2026-11-16', settings: { ...created.settings, asOfDate: '2026-11-16' } },
    { ...created, id: 'automatic-as-of', asOf: '2026-11-09', settings: automatic },
    { ...created, id: 'zero-capacity', settings: { ...created.settings, classHoursPerStudent: 0, homeworkHoursPerStudent: 0 } },
    sameDay, { ...complete, id: 'after-complete-release', asOf: '2026-11-09', settings: { ...complete.settings, asOfDate: '2026-11-09' } },
  ]
}
