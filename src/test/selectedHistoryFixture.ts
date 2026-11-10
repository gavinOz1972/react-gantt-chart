/** Synthetic owner/browser fixture: no real student or project information. */
import { establishBaseline } from '../baseline/baseline'
import type { ProjectFile } from '../persistence/projectFile'
import { transitionTask } from '../progress/taskProgress'
import type { ProgressTracking, TaskStatus } from '../progress/taskProgress'
import type { TaskInput } from '../domain'

export function selectedHistoryFile(count = 40): ProjectFile {
  const project = { projectId: 'WP747-HISTORY', name: 'Selected history review', projectStartDate: '2026-11-02', targetEndDate: '2027-03-01', workingWeekdays: [1, 4, 5] as const, workingHoursPerDay: 3 }
  const tasks: TaskInput[] = Array.from({ length: count }, (_, i) => ({ taskId: `T${i + 1}`, name: `History task ${i + 1}`, description: 'Synthetic owner test', durationHours: 5, predecessorTaskIds: [], independentStartMode: 'DEFAULT' }))
  let progress: ProgressTracking = { schemaVersion: 1, definitionOfDone: 'Original <guidance> & wording.', tasks: { T1: { status: 'Not Started', criteria: [{ criterionId: 'C1', text: 'Deliverable <reviewed> & accepted', checked: true }] } }, events: [] }
  function move(target: TaskStatus, taskId = 'T1') {
    const current = progress.tasks[taskId]?.status ?? 'Not Started'
    const result = transitionTask(progress, taskId, { target, eventId: `H-${progress.events.length + 1}`, date: '2026-11-05', recordedAt: '2026-11-09T15:00:00.000Z',
      ...(target === 'Blocked' || current === 'Complete' ? { reason: 'Waiting <on review> & evidence.', reopenAcknowledged: true } : {}),
      ...(target === 'Complete' ? { completionAcknowledged: true, noCriteriaAcknowledged: true, committedFinishDateAtCompletion: '2026-11-05', note: 'Literal <img src=x onerror=alert(1)> & note.' } : {}),
    }, tasks.map(t => t.taskId))
    if (!result.ok) throw Error(result.errors[0].message)
    progress = result.value
  }
  for (let i = 0; i < 41; i++) move(i % 2 ? 'Blocked' : 'In Progress')
  move('Complete'); move('In Progress')
  if (count > 1) { move('In Progress', 'T2'); move('Blocked', 'T2') }
  const baseline = establishBaseline({ project, tasks, nextTaskNumber: count + 1 }, 'B-WP747', '2026-11-02T14:00:00.000Z')
  if (!baseline.ok) throw Error(baseline.errors[0].message)
  return { format: 'react-gantt-chart', schemaVersion: 5, savedAt: '2026-11-10T15:00:00.000Z', createdBy: 'React Gantt Chart', project, tasks,
    nextTaskNumber: count + 1, manualOrder: tasks.map(t => t.taskId), sortMode: 'manual', duplicateOrigins: {}, baseline: baseline.value, taskProgress: progress,
    workTracking: { schemaVersion: 1, remainingHours: Object.fromEntries(tasks.map(t => [t.taskId, 5])), entries: [{ entryId: 'W-WP747', taskId: 'T1', workDate: '2026-11-05', contributor: 'Synthetic reviewer', hours: 1.5, description: 'Optional recorded work', createdAt: '2026-11-09T15:00:00.000Z', updatedAt: '2026-11-09T15:00:00.000Z' }] },
    forecastSettings: { schemaVersion: 1, enabled: true, classHoursPerStudent: 4, homeworkHoursPerStudent: 2, teamSize: 4, asOfDate: '2026-11-09' },
  }
}
