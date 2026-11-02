import type { TaskInput } from '../../src/domain'
import { establishBaseline } from '../../src/baseline/baseline'
import { createProjectFile } from '../../src/persistence/projectFile'
import type { ProjectData, ProjectFile } from '../../src/persistence/projectFile'
import { emptyProgress } from '../../src/progress/taskProgress'

export const fixtureTimestamp = '2026-11-02T12:00:00.000Z'
const definitions: [string, number, number[], string?][] = [
  ['Agree project charter and team responsibilities', 4, []],
  ['Interview students about study-planning problems', 6, [1]],
  ['Define measurable acceptance criteria', 3, [2]],
  ['Write personas and accessibility needs', 4, [2]],
  ['Obtain permission for anonymous feedback', 2, [], '2026-11-05'],
  ['Sketch navigation and task-entry wireframes', 8, [3, 4]],
  ['Choose application architecture and boundaries', 6, [3]],
  ['Set up repository and automated checks', 4, [7]],
  ['Design durable task IDs and project schema', 6, [7]],
  ['Implement sign-in prototype for the demonstration', 8, [8, 9]],
  ['Implement working-calendar service', 8, [9]],
  ['Meet mentor to validate project assumptions', 2, [], '2026-11-13'],
  ['Implement task create edit and delete workflow', 10, [10, 11]],
  ['Implement dependency selection and validation', 8, [13]],
  ['Review keyboard and screen-reader accessibility', 6, [6, 13]],
  ['Run anonymous feedback sessions', 5, [5, 6]],
  ['Revise mockups from feedback evidence', 4, [16]],
  ['Render Gantt bars headers and dependencies', 12, [14, 17]],
  ['Build dated contributor work-log entry', 8, [13]],
  ['Add remaining-effort capacity forecast', 10, [19]],
  ['Prepare integration test fixtures', 6, [14, 19]],
  ['Run integrated scheduling and persistence checks', 10, [18, 20, 21]],
  ['Verify invalid-input and failure recovery', 6, [22]],
  ['Measure responsiveness with long dependencies', 8, [18, 20]],
  ['Rehearse stakeholder presentation', 3, [], '2026-11-18'],
  ['Check observable task-completion evidence', 4, [15, 23]],
  ['Write student runbook and known limitations', 5, [24, 26]],
  ['Deliver pilot demo and capture decisions', 4, [12, 25, 27]],
  ['Resolve accepted pilot review items', 8, [28]],
  ['Hand over project evidence and backups', 3, [29]],
]
const extraHours = [4, 6, 3, 8, 2, 5, 4, 6, 3, 4]
export function studentInputs(count: 30 | 40 = 30): ProjectData {
  const rows = count === 40 ? [...definitions, ...extraHours.map((hours, index): [string, number, number[]] => [`Extended review ${index + 1}: verify a long dependency chain and retain detailed student handover evidence`, hours, [30 + index]])] : definitions
  const tasks: TaskInput[] = rows.map(([name, durationHours, predecessors, date], index) => ({ taskId: `T${index + 1}`, name,
    description: `QA disposable student project: ${name}. Record observable evidence and reviewer notes before completing this task.`, durationHours,
    predecessorTaskIds: predecessors.map(id => `T${id}`), ...(date ? { independentStartMode: 'MANUAL' as const, requestedStartDate: date } : { independentStartMode: 'DEFAULT' as const }) }))
  return { project: { projectId: 'QA-WP71-STUDENT', name: 'WP7.1 DISPOSABLE - Campus Study Planner', projectStartDate: '2026-11-02', targetEndDate: '2027-02-26', workingWeekdays: [1, 2, 4, 5], workingHoursPerDay: 4 },
    tasks, nextTaskNumber: count + 1, manualOrder: tasks.map(task => task.taskId), sortMode: 'manual', duplicateOrigins: {} }
}
export const forecastAssumptions = { schemaVersion: 1 as const, enabled: true, classHoursPerStudent: 3, homeworkHoursPerStudent: 5, teamSize: 4, asOfDate: '2026-11-09' }
export function studentFile({ count = 30, baseline = true, estimates = true }: { count?: 30 | 40; baseline?: boolean; estimates?: boolean } = {}): ProjectFile {
  const inputs = studentInputs(count)
  const frozen = baseline ? establishBaseline(inputs, `QA-WP71-BASELINE-${count}`, fixtureTimestamp) : undefined
  if (frozen && !frozen.ok) throw new Error(JSON.stringify(frozen.errors))
  const result = createProjectFile({ ...inputs, ...(frozen?.ok ? { baseline: frozen.value } : {}), taskProgress: emptyProgress(),
    ...(estimates ? { workTracking: { schemaVersion: 1, entries: [], remainingHours: Object.fromEntries(inputs.tasks.map(task => [task.taskId, task.durationHours])) }, forecastSettings: forecastAssumptions } : {}) }, fixtureTimestamp)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}
export function legacyStudentFile(version: 1 | 2 | 3 | 4) {
  const modern = studentFile()
  return { format: modern.format, schemaVersion: version, createdBy: modern.createdBy, savedAt: modern.savedAt, ...studentInputs(),
    ...(version >= 2 ? { baseline: modern.baseline } : {}), ...(version >= 3 ? { workTracking: modern.workTracking } : {}), ...(version >= 4 ? { taskProgress: modern.taskProgress } : {}) }
}
