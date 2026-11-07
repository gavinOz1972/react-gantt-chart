import { establishBaseline } from '../baseline/baseline'
import { createProjectFile } from '../persistence/projectFile'
import { emptyProgress, transitionTask } from '../progress/taskProgress'
import type { TaskStatus, TransitionRequest } from '../progress/taskProgress'
import type { TaskInput } from '../domain'

export type HistoryCase = 'late' | 'before' | 'future' | 'absorbed' | 'leaf' | 'tied' | 'driver' | 'started' | 'blocked' | 'reopened' | 'conflict' | 'on-time' | 'early' | 'missing-reference' | 'weekend'
/** Fictional owner-review inputs, independent of presentation calculations. */
export function historyFile(kind: HistoryCase = 'late') {
  const task = (taskId: string, durationHours = 4, predecessorTaskIds: string[] = [], requestedStartDate?: string): TaskInput => ({
    taskId, name: taskId === 'T1' ? 'Design approval' : taskId === 'T2' ? 'Build successor' : 'Parallel review', description: 'WP733 DISPOSABLE review only.', durationHours, predecessorTaskIds,
    ...(requestedStartDate ? { independentStartMode: 'MANUAL' as const, requestedStartDate } : { independentStartMode: 'DEFAULT' as const }),
  })
  let tasks = [task('T1'), task('T2', 4, ['T1'])]
  if (kind === 'leaf') tasks = [task('T1')]
  if (kind === 'absorbed') tasks.push(task('T3', 8, [], '2026-11-09'))
  if (kind === 'driver') tasks.push(task('T3', 8, [], '2026-11-03'))
  if (kind === 'tied') tasks = [task('T1'), task('T2', 8), task('T3', 4, ['T1', 'T2'])]
  if (kind === 'weekend') tasks = [task('T1', 20), task('T2', 4, ['T1'])]
  const project = { projectId: `WP733-${kind}`, name: `WP733 DISPOSABLE ${kind}`, projectStartDate: '2026-11-02', targetEndDate: '2026-11-20', workingWeekdays: [1, 2, 3, 4, 5] as const, workingHoursPerDay: 4 }
  const inputs = { project, tasks, nextTaskNumber: tasks.length + 1, manualOrder: tasks.map(t => t.taskId), sortMode: 'manual' as const, duplicateOrigins: {} }
  const baseline = establishBaseline(inputs, `WP733-BL-${kind}`, '2026-11-01T12:00:00.000Z')
  if (!baseline.ok) throw new Error(JSON.stringify(baseline.errors))
  let progress = emptyProgress(), sequence = 0
  const transition = (taskId: string, target: TaskStatus, date: string, extra: Partial<TransitionRequest> = {}) => {
    const next = transitionTask(progress, taskId, { target, date, eventId: `WP733-E${++sequence}`, recordedAt: kind === 'before' ? '2026-11-02T12:00:00.000Z' : '2026-11-10T12:00:00.000Z', ...extra }, tasks.map(t => t.taskId))
    if (!next.ok) throw new Error(JSON.stringify(next.errors))
    progress = next.value
  }
  const complete = (id: string, date: string, reference?: string) => transition(id, 'Complete', date, { completionAcknowledged: true, noCriteriaAcknowledged: true, ...(reference ? { committedFinishDateAtCompletion: reference } : {}) })
  if (kind === 'before') transition('T1', 'In Progress', '2026-11-02')
  else complete('T1', kind === 'on-time' || kind === 'early' ? '2026-11-02' : kind === 'weekend' ? '2026-11-07' : '2026-11-06', kind === 'missing-reference' ? undefined : kind === 'early' ? '2026-11-03' : kind === 'weekend' ? '2026-11-06' : '2026-11-02')
  if (kind === 'tied') complete('T2', '2026-11-06', '2026-11-03')
  if (kind === 'driver') complete('T3', '2026-11-04', '2026-11-04')
  if (kind === 'started') transition('T2', 'In Progress', '2026-11-06')
  if (kind === 'blocked') transition('T2', 'Blocked', '2026-11-06', { reason: 'No trustworthy restart date.' })
  if (kind === 'reopened') transition('T1', 'In Progress', '2026-11-06', { reason: 'Further approval checks required.', reopenAcknowledged: true })
  if (kind === 'conflict') complete('T2', '2026-11-03', '2026-11-03')
  const file = createProjectFile({ ...inputs, baseline: baseline.value, taskProgress: progress,
    workTracking: { schemaVersion: 1, entries: [], remainingHours: Object.fromEntries(tasks.map(t => [t.taskId, t.durationHours])) },
    forecastSettings: { schemaVersion: 1, enabled: true, classHoursPerStudent: 28, homeworkHoursPerStudent: 0, teamSize: 1, asOfDate: historyAsOf(kind) },
  }, '2026-11-10T12:00:00.000Z')
  if (!file.ok) throw new Error(JSON.stringify(file.errors))
  return file.value
}
export function historyAsOf(kind: HistoryCase) {
  return kind === 'future' ? '2026-11-04' : kind === 'on-time' || kind === 'early' ? '2026-11-02' : kind === 'weekend' ? '2026-11-07' : '2026-11-06'
}
