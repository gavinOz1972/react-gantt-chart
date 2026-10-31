import { calculateSchedule } from '../domain'
import type { ProjectSettings, TaskInput, Weekday } from '../domain'
import { SORT_MODES } from '../taskManagement'
import type { DuplicateOrigins, SortMode } from '../taskManagement'

export interface PlanInputs { project: ProjectSettings; tasks: readonly TaskInput[]; nextTaskNumber: number; manualOrder: readonly string[]; sortMode: SortMode; duplicateOrigins: DuplicateOrigins }
export interface PersistenceIssue { code: string; message: string }
export type InputsResult = { ok: true; value: PlanInputs } | { ok: false; errors: readonly PersistenceIssue[] }
export const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const string = (value: unknown): value is string => typeof value === 'string'
const failure = (code: string, message: string): InputsResult => ({ ok: false, errors: [{ code, message }] })
export const validTimestamp = (value: unknown): value is string => string(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value

/** Shared source validation for the current plan and the independent baseline. */
export function decodePlanInputs(value: unknown): InputsResult {
  if (!record(value)) return failure('INVALID_STRUCTURE', 'Project inputs must be an object.')
  const p = value.project
  if (!record(p) || !string(p.projectId) || !string(p.name) || !string(p.projectStartDate) || !string(p.targetEndDate) || !Array.isArray(p.workingWeekdays) || !p.workingWeekdays.every(day => typeof day === 'number') || typeof p.workingHoursPerDay !== 'number') {
    return failure('INVALID_STRUCTURE', 'Project fields are missing or have incorrect types. Import an exported project file.')
  }
  const project: ProjectSettings = { projectId: p.projectId, name: p.name, projectStartDate: p.projectStartDate, targetEndDate: p.targetEndDate,
    workingWeekdays: [...p.workingWeekdays] as Weekday[], workingHoursPerDay: p.workingHoursPerDay }
  if (!Array.isArray(value.tasks)) return failure('INVALID_STRUCTURE', 'The project file must contain a tasks array.')
  const tasks: TaskInput[] = []
  for (const [index, task] of value.tasks.entries()) {
    if (!record(task) || !string(task.taskId) || !string(task.name) || !string(task.description) || typeof task.durationHours !== 'number' || !Array.isArray(task.predecessorTaskIds) || !task.predecessorTaskIds.every(string)) {
      return failure('INVALID_STRUCTURE', `Task ${index + 1} has missing fields or incorrect field types.`)
    }
    const fields = { taskId: task.taskId, name: task.name, description: task.description, durationHours: task.durationHours, predecessorTaskIds: [...task.predecessorTaskIds] }
    if (task.independentStartMode === 'DEFAULT' && task.requestedStartDate === undefined) tasks.push({ ...fields, independentStartMode: 'DEFAULT' })
    else if (task.independentStartMode === 'MANUAL' && string(task.requestedStartDate)) tasks.push({ ...fields, independentStartMode: 'MANUAL', requestedStartDate: task.requestedStartDate })
    else return failure('INVALID_STRUCTURE', `Task ${task.taskId} must use DEFAULT without a requested date, or MANUAL with a requestedStartDate.`)
  }
  if (!Number.isSafeInteger(value.nextTaskNumber) || Number(value.nextTaskNumber) < 1 || Number(value.nextTaskNumber) >= Number.MAX_SAFE_INTEGER) return failure('INVALID_ID_COUNTER', 'nextTaskNumber must be a positive safe integer below the ID limit.')
  for (const task of tasks) {
    if (/^T\d+$/.test(task.taskId)) {
      const number = Number(task.taskId.slice(1))
      if (!Number.isSafeInteger(number) || number >= Number(value.nextTaskNumber)) return failure('INVALID_ID_COUNTER', 'nextTaskNumber must exceed every existing numeric T task ID, so IDs cannot be reused.')
    }
  }
  const schedule = calculateSchedule(project, tasks)
  if (!schedule.ok) return { ok: false, errors: schedule.errors.map(error => ({ code: error.code, message: `${error.taskId ? `${error.taskId}: ` : ''}${error.field}: ${error.message}` })) }
  const ids = new Set(tasks.map(task => task.taskId))
  const manualOrder = value.manualOrder === undefined ? tasks.map(task => task.taskId) : value.manualOrder
  if (!Array.isArray(manualOrder) || !manualOrder.every(string) || manualOrder.length !== tasks.length || new Set(manualOrder).size !== tasks.length || manualOrder.some(id => !ids.has(id))) return failure('INVALID_MANUAL_ORDER', 'manualOrder must list every task ID exactly once, without unknown or duplicate IDs.')
  const sortMode = value.sortMode === undefined ? 'manual' : value.sortMode
  if (!SORT_MODES.includes(sortMode as SortMode)) return failure('INVALID_SORT_MODE', 'sortMode must be manual, start, name or duration.')
  const origins = value.duplicateOrigins === undefined ? {} : value.duplicateOrigins
  if (!record(origins) || Object.entries(origins).some(([id, origin]) => !ids.has(id) || !string(origin) || !origin.trim() || id === origin || (/^T\d+$/.test(origin) && (!Number.isSafeInteger(Number(origin.slice(1))) || Number(origin.slice(1)) >= Number(value.nextTaskNumber))))) return failure('INVALID_COPY_METADATA', 'duplicateOrigins must map surviving copies to distinct previously allocated task IDs below nextTaskNumber.')
  return { ok: true, value: { project, tasks, nextTaskNumber: Number(value.nextTaskNumber), manualOrder: [...manualOrder], sortMode: sortMode as SortMode, duplicateOrigins: { ...origins } as Record<string, string> } }
}
