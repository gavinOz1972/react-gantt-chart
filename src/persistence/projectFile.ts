import type { ProjectSettings, TaskInput } from '../domain'
import { decodeBaseline } from '../baseline/baseline'
import type { Baseline } from '../baseline/baseline'
import { decodePlanInputs, record, validTimestamp } from './planInputs'
import type { PersistenceIssue, PlanInputs } from './planInputs'
export type { PersistenceIssue } from './planInputs'
import type { DuplicateOrigins, SortMode } from '../taskManagement'
import { decodeWorkTracking } from '../workTracking/workTracking'
import type { WorkTracking } from '../workTracking/workTracking'
import { decodeProgress, progressFingerprint } from '../progress/taskProgress'
import type { ProgressTracking } from '../progress/taskProgress'
import { decodeForecastSettings } from '../forecast/settings'
import type { ForecastSettings } from '../forecast/settings'

export const PROJECT_FORMAT = 'react-gantt-chart'
export const PROJECT_SCHEMA_VERSION = 5
export const MAX_PROJECT_BYTES = 10 * 1024 * 1024
export interface ProjectData { project: ProjectSettings; tasks: readonly TaskInput[]; nextTaskNumber: number; manualOrder?: readonly string[]; sortMode?: SortMode; duplicateOrigins?: DuplicateOrigins; baseline?: Baseline; workTracking?: WorkTracking; taskProgress?: ProgressTracking; forecastSettings?: ForecastSettings }
export interface ProjectFile extends PlanInputs { format: typeof PROJECT_FORMAT; schemaVersion: 1 | 2 | 3 | 4 | 5; savedAt: string; createdBy: 'React Gantt Chart'; baseline?: Baseline; workTracking?: WorkTracking; taskProgress?: ProgressTracking; forecastSettings?: ForecastSettings }
export const projectVersionLabel = (version: ProjectFile['schemaVersion']) => ({ 1: 'WP5', 2: 'WP6.1', 3: 'WP6.2', 4: 'WP6.3', 5: 'WP6.4' })[version]
export type FileResult = { ok: true; value: ProjectFile } | { ok: false; errors: readonly PersistenceIssue[] }
const failure = (code: string, message: string): FileResult => ({ ok: false, errors: [{ code, message }] })

/** Validates unknown file structure first, then delegates every schedule rule to WP1. */
export function decodeProject(value: unknown): FileResult {
  if (!record(value) || value.format !== PROJECT_FORMAT) return failure('INVALID_FORMAT', 'Choose a React Gantt Chart JSON project file.')
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2 && value.schemaVersion !== 3 && value.schemaVersion !== 4 && value.schemaVersion !== 5) return failure('UNSUPPORTED_VERSION', 'Unsupported project schema version. This release reads versions 1 through 5.')
  if (value.schemaVersion < 5 && value.forecastSettings !== undefined) return failure('INVALID_FORECAST_PROJECT_VERSION', 'Forecast assumptions require project format 5.')
  if (!validTimestamp(value.savedAt) || value.createdBy !== 'React Gantt Chart') return failure('INVALID_PROVENANCE', 'The project file needs its valid exported savedAt timestamp and createdBy identifier.')
  if (value.schemaVersion === 1 && value.baseline !== undefined) return failure('INVALID_BASELINE_VERSION', 'A baseline requires project schema version 2. Version 1 files cannot contain a baseline.')
  if (value.schemaVersion < 3 && value.workTracking !== undefined) return failure('INVALID_WORK_PROJECT_VERSION', 'Work tracking requires project format 3 or later. Older files cannot contain work tracking data.')
  if (value.schemaVersion < 4 && value.taskProgress !== undefined) return failure('INVALID_PROGRESS_PROJECT_VERSION', 'Task status, criteria and history require project format 4.')
  const inputs = decodePlanInputs(value)
  if (!inputs.ok) return inputs
  let baseline: Baseline | undefined
  if (value.baseline !== undefined) {
    const decoded = decodeBaseline(value.baseline)
    if (!decoded.ok) return decoded
    baseline = decoded.value
    if (baseline.project.projectId !== inputs.value.project.projectId) return failure('BASELINE_PROJECT_MISMATCH', 'The baseline belongs to a different project identity.')
    if (inputs.value.nextTaskNumber < baseline.nextTaskNumber) return failure('INVALID_ID_COUNTER', 'nextTaskNumber cannot go below the baseline allocation counter, including deleted task IDs.')
  }
  let workTracking: WorkTracking | undefined
  if (value.workTracking !== undefined) {
    const decoded = decodeWorkTracking(value.workTracking, inputs.value.tasks.map(task => task.taskId))
    if (!decoded.ok) return decoded
    workTracking = decoded.value
  }
  let taskProgress: ProgressTracking | undefined
  if (value.taskProgress !== undefined) {
    const decoded = decodeProgress(value.taskProgress, inputs.value.tasks.map(task => task.taskId))
    if (!decoded.ok) return decoded
    taskProgress = decoded.value
  }
  let forecastSettings: ForecastSettings | undefined
  if (value.forecastSettings !== undefined) {
    const decoded = decodeForecastSettings(value.forecastSettings)
    if (!decoded.ok) return decoded
    forecastSettings = decoded.value
  }
  return { ok: true, value: { ...inputs.value, format: PROJECT_FORMAT, schemaVersion: value.schemaVersion, createdBy: 'React Gantt Chart', savedAt: value.savedAt, ...(baseline ? { baseline } : {}), ...(workTracking ? { workTracking } : {}), ...(taskProgress ? { taskProgress } : {}), ...(forecastSettings ? { forecastSettings } : {}) } }
}

export function parseProject(text: string): FileResult {
  if (new TextEncoder().encode(text).byteLength > MAX_PROJECT_BYTES) return failure('FILE_TOO_LARGE', 'Project files are limited to 10 MiB. Reduce long descriptions or split the plan.')
  try { return decodeProject(JSON.parse(text)) }
  catch { return failure('INVALID_JSON', 'The file is not valid JSON. Select an unmodified exported project file.') }
}

export function createProjectFile(data: ProjectData, savedAt = new Date().toISOString()): FileResult {
  return decodeProject({ format: PROJECT_FORMAT, schemaVersion: PROJECT_SCHEMA_VERSION, createdBy: 'React Gantt Chart', savedAt,
    project: data.project, tasks: data.tasks, nextTaskNumber: data.nextTaskNumber, manualOrder: data.manualOrder, sortMode: data.sortMode, duplicateOrigins: data.duplicateOrigins, baseline: data.baseline, workTracking: data.workTracking, taskProgress: data.taskProgress, forecastSettings: data.forecastSettings })
}
export function serializeProject(file: ProjectFile): string { return JSON.stringify(file, null, 2) + '\n' }
export function projectFingerprint({ project, tasks, nextTaskNumber, manualOrder, sortMode, duplicateOrigins, baseline, workTracking, taskProgress, forecastSettings }: ProjectData): string {
  return JSON.stringify([project.projectId, project.name, project.projectStartDate, project.targetEndDate, [...project.workingWeekdays].sort((a, b) => a - b), project.workingHoursPerDay,
    [...tasks].sort((a, b) => a.taskId < b.taskId ? -1 : a.taskId > b.taskId ? 1 : 0).map(task => [task.taskId, task.name, task.description, task.durationHours, [...task.predecessorTaskIds].sort(), task.independentStartMode, task.independentStartMode === 'MANUAL' ? task.requestedStartDate : null]), nextTaskNumber,
    manualOrder ?? tasks.map(task => task.taskId), sortMode ?? 'manual', Object.entries(duplicateOrigins ?? {}).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0), baseline ?? null,
    [...(workTracking?.entries ?? [])].sort((a, b) => a.entryId.localeCompare(b.entryId)).map(entry => [entry.entryId, entry.taskId, entry.workDate, entry.contributor, entry.hours, entry.description, entry.createdAt, entry.updatedAt]),
    Object.entries(workTracking?.remainingHours ?? {}).filter(([, hours]) => hours !== null).sort(([a], [b]) => a.localeCompare(b)), progressFingerprint(taskProgress), forecastSettings ?? null])
}
export function acceptsProjectFile(file: Pick<File, 'name' | 'type' | 'size'>): PersistenceIssue | undefined {
  if (!/\.json$/i.test(file.name) && file.type !== 'application/json') return { code: 'INVALID_FILE_TYPE', message: 'Choose a .json project file.' }
  if (file.size > MAX_PROJECT_BYTES) return { code: 'FILE_TOO_LARGE', message: 'Project files are limited to 10 MiB.' }
}
