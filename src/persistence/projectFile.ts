import { calculateSchedule } from '../domain'
import type { ProjectSettings, TaskInput, Weekday } from '../domain'
import { SORT_MODES } from '../taskManagement'
import type { DuplicateOrigins, SortMode } from '../taskManagement'

export const PROJECT_FORMAT = 'react-gantt-chart'
export const PROJECT_SCHEMA_VERSION = 1
export const MAX_PROJECT_BYTES = 10 * 1024 * 1024
export interface ProjectData { project: ProjectSettings; tasks: readonly TaskInput[]; nextTaskNumber: number; manualOrder?: readonly string[]; sortMode?: SortMode; duplicateOrigins?: DuplicateOrigins }
export interface ProjectFile extends ProjectData { format: typeof PROJECT_FORMAT; schemaVersion: 1; savedAt: string; createdBy: 'React Gantt Chart'; manualOrder: readonly string[]; sortMode: SortMode; duplicateOrigins: DuplicateOrigins }
export interface PersistenceIssue { code: string; message: string }
export type FileResult = { ok: true; value: ProjectFile } | { ok: false; errors: readonly PersistenceIssue[] }
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const string = (value: unknown): value is string => typeof value === 'string'
const failure = (code: string, message: string): FileResult => ({ ok: false, errors: [{ code, message }] })

/** Validates unknown file structure first, then delegates every schedule rule to WP1. */
export function decodeProject(value: unknown): FileResult {
  if (!record(value) || value.format !== PROJECT_FORMAT) return failure('INVALID_FORMAT', 'Choose a React Gantt Chart JSON project file.')
  if (value.schemaVersion !== PROJECT_SCHEMA_VERSION) return failure('UNSUPPORTED_VERSION', `Unsupported project schema version ${String(value.schemaVersion)}. This release supports version 1.`)
  if (!string(value.savedAt) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.savedAt) || !Number.isFinite(Date.parse(value.savedAt)) || new Date(value.savedAt).toISOString() !== value.savedAt || value.createdBy !== 'React Gantt Chart') return failure('INVALID_PROVENANCE', 'The project file needs its valid exported savedAt timestamp and createdBy identifier.')
  const p = value.project
  if (!record(p) || !string(p.projectId) || !string(p.name) || !string(p.projectStartDate) || !string(p.targetEndDate) || !Array.isArray(p.workingWeekdays) || !p.workingWeekdays.every(day => typeof day === 'number') || typeof p.workingHoursPerDay !== 'number') {
    return failure('INVALID_STRUCTURE', 'Project fields are missing or have incorrect types. Import an exported version 1 project file.')
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
  // Only known source fields are copied. Any embedded schedule/critical analysis is ignored.
  return { ok: true, value: { format: PROJECT_FORMAT, schemaVersion: 1, createdBy: 'React Gantt Chart', savedAt: value.savedAt,
    project, tasks, nextTaskNumber: Number(value.nextTaskNumber), manualOrder: [...manualOrder], sortMode: sortMode as SortMode, duplicateOrigins: { ...origins } as Record<string, string> } }
}

export function parseProject(text: string): FileResult {
  if (new TextEncoder().encode(text).byteLength > MAX_PROJECT_BYTES) return failure('FILE_TOO_LARGE', 'Project files are limited to 10 MiB. Reduce long descriptions or split the plan.')
  try { return decodeProject(JSON.parse(text)) }
  catch { return failure('INVALID_JSON', 'The file is not valid JSON. Select an unmodified exported project file.') }
}

export function createProjectFile(data: ProjectData, savedAt = new Date().toISOString()): FileResult {
  return decodeProject({ format: PROJECT_FORMAT, schemaVersion: PROJECT_SCHEMA_VERSION, createdBy: 'React Gantt Chart', savedAt,
    project: data.project, tasks: data.tasks, nextTaskNumber: data.nextTaskNumber, manualOrder: data.manualOrder, sortMode: data.sortMode, duplicateOrigins: data.duplicateOrigins })
}
export function serializeProject(file: ProjectFile): string { return JSON.stringify(file, null, 2) + '\n' }
export function projectFingerprint({ project, tasks, nextTaskNumber, manualOrder, sortMode, duplicateOrigins }: ProjectData): string {
  return JSON.stringify([project.projectId, project.name, project.projectStartDate, project.targetEndDate, [...project.workingWeekdays].sort((a, b) => a - b), project.workingHoursPerDay,
    [...tasks].sort((a, b) => a.taskId < b.taskId ? -1 : a.taskId > b.taskId ? 1 : 0).map(task => [task.taskId, task.name, task.description, task.durationHours, [...task.predecessorTaskIds].sort(), task.independentStartMode, task.independentStartMode === 'MANUAL' ? task.requestedStartDate : null]), nextTaskNumber,
    manualOrder ?? tasks.map(task => task.taskId), sortMode ?? 'manual', Object.entries(duplicateOrigins ?? {}).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)])
}
export function acceptsProjectFile(file: Pick<File, 'name' | 'type' | 'size'>): PersistenceIssue | undefined {
  if (!/\.json$/i.test(file.name) && file.type !== 'application/json') return { code: 'INVALID_FILE_TYPE', message: 'Choose a .json project file.' }
  if (file.size > MAX_PROJECT_BYTES) return { code: 'FILE_TOO_LARGE', message: 'Project files are limited to 10 MiB.' }
}
