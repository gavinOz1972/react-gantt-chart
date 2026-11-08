import { calculateSchedule } from '../../domain'
import type { ProjectSettings, TaskInput } from '../../types/scheduling'
import { emptyProgress } from '../../progress/taskProgress'
import type { WorkingInput, WorkingState } from '../workingPlan'

export type Shape = 'sparse' | 'diamond' | 'chain'
/** Existing WP1 supplies only the initial fixture plan, never the evaluator oracle. */
export function benchmarkInput(size: number, shape: Shape): WorkingInput {
  const project: ProjectSettings = { projectId: 'WP742-BENCHMARK', name: 'Fictional benchmark', projectStartDate: '2026-11-02', targetEndDate: '2027-01-29', workingWeekdays: [1, 2, 3, 4, 5], workingHoursPerDay: 4 }
  const id = (n: number) => `T${String(n).padStart(5, '0')}`
  const tasks: TaskInput[] = Array.from({ length: size }, (_, i) => ({ taskId: id(i), name: id(i), description: 'Disposable performance fixture', durationHours: 4, independentStartMode: 'DEFAULT', predecessorTaskIds: i === 0 || shape === 'sparse' ? [] : shape === 'chain' ? [id(i - 1)] : i % 3 ? [id(i - i % 3)] : [id(i - 2), id(i - 1)] }))
  const schedule = calculateSchedule(project, tasks)
  if (!schedule.ok) throw new Error(JSON.stringify(schedule.errors))
  const constraints: WorkingState['constraints'] = Object.fromEntries(schedule.tasks.map(t => [t.taskId, { notBefore: t.startSlot, origin: 'SeededLegacy', decisionId: `D-${t.taskId}` }]))
  const commitments: WorkingState['commitments'] = Object.fromEntries(schedule.tasks.map(t => [t.taskId, { kind: 'Known', start: t.startSlot, finish: t.finishBoundary, decisionId: `D-${t.taskId}` }]))
  return { project, tasks, progress: emptyProgress(), actualStarts: new Map(), current: { revisionId: 'W-before-benchmark', ruleVersion: 1, calendar: project, constraints, commitments }, proposedFloors: new Map(schedule.tasks.map(t => [t.taskId, t.startSlot])), holds: new Map(schedule.tasks.map(t => [t.taskId, t.startSlot])), affectedIds: tasks.map(t => t.taskId), reviewDate: '2026-11-06' }
}
