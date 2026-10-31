import { calculateSchedule } from '../domain'
import type { ProjectSettings, ScheduleError, TaskInput, Weekday } from '../domain'

/** Single boundary between editable string fields and WP1's typed input records. */
export interface ProjectDraft {
  name: string
  projectStartDate: string
  targetEndDate: string
  workingWeekdays: Weekday[]
  workingHoursPerDay: string
}
export interface TaskDraft {
  taskId: string
  name: string
  description: string
  durationHours: string
  predecessorTaskIds: string[]
  independentStartMode: 'DEFAULT' | 'MANUAL'
  requestedStartDate: string
}

export const initialProject: ProjectSettings = {
  projectId: 'P1', name: 'My semester project', projectStartDate: '2026-11-02',
  targetEndDate: '2026-12-18', workingWeekdays: [1, 2, 3, 4, 5], workingHoursPerDay: 4,
}

export function projectToDraft(project: ProjectSettings): ProjectDraft {
  return { name: project.name, projectStartDate: project.projectStartDate, targetEndDate: project.targetEndDate,
    workingWeekdays: [...project.workingWeekdays], workingHoursPerDay: String(project.workingHoursPerDay) }
}

export function projectFromDraft(projectId: string, draft: ProjectDraft): ProjectSettings {
  return { ...draft, projectId, workingWeekdays: [...draft.workingWeekdays], workingHoursPerDay: Number(draft.workingHoursPerDay) }
}

export function taskToDraft(task: TaskInput): TaskDraft {
  return { ...task, durationHours: String(task.durationHours), predecessorTaskIds: [...task.predecessorTaskIds],
    requestedStartDate: task.independentStartMode === 'MANUAL' ? task.requestedStartDate : '' }
}

export function taskFromDraft(draft: TaskDraft): TaskInput {
  const fields = { taskId: draft.taskId, name: draft.name, description: draft.description,
    durationHours: Number(draft.durationHours), predecessorTaskIds: [...draft.predecessorTaskIds] }
  return draft.independentStartMode === 'MANUAL'
    ? { ...fields, independentStartMode: 'MANUAL', requestedStartDate: draft.requestedStartDate }
    : { ...fields, independentStartMode: 'DEFAULT' }
}

export function newTask(taskId: string): TaskInput {
  return { taskId, name: '', description: '', durationHours: 1, predecessorTaskIds: [], independentStartMode: 'DEFAULT' }
}

export function replaceTask(tasks: readonly TaskInput[], task: TaskInput): TaskInput[] {
  return tasks.some(entry => entry.taskId === task.taskId)
    ? tasks.map(entry => entry.taskId === task.taskId ? task : entry)
    : [...tasks, task]
}

export function removeTaskAndLinks(tasks: readonly TaskInput[], taskId: string): TaskInput[] {
  return tasks.filter(task => task.taskId !== taskId).map(task => ({ ...task,
    predecessorTaskIds: task.predecessorTaskIds.filter(id => id !== taskId) }))
}

/** Uses valid saved metadata so an unfinished text field never blocks unchecking a link. */
export function dependencyError(project: ProjectSettings, tasks: readonly TaskInput[], seed: TaskInput, predecessors: readonly string[]): ScheduleError | undefined {
  const candidate = { ...seed, name: seed.name || 'New task', predecessorTaskIds: [...predecessors] }
  const result = calculateSchedule(project, replaceTask(tasks, candidate))
  if (result.ok) return undefined
  return result.errors.find(error => ['SELF_DEPENDENCY', 'DEPENDENCY_CYCLE', 'MISSING_PREDECESSOR', 'DUPLICATE_PREDECESSOR'].includes(error.code))
}
