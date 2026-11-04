import { readFileSync } from 'node:fs'
import type { ProjectSettings, TaskInput } from '../../src/domain'
import { establishBaseline } from '../../src/baseline/baseline'
import { createProjectFile } from '../../src/persistence/projectFile'
import type { ProgressTracking } from '../../src/progress/taskProgress'
import { transitionTask } from '../../src/progress/taskProgress'

export interface PaperScenario { id: string; asOf: string; inputs: { project: ProjectSettings; tasks: TaskInput[] }; progress: ProgressTracking; expectedProjectDate: string | null }
const paper = JSON.parse(readFileSync('docs/qa/wp7-3-1/evidence/scenario-evidence.json', 'utf8')) as { cases: PaperScenario[] }
export const scenario = (id: string) => paper.cases.find(c => c.id === id)!
export function caseFile(id: string, beforeCompletion = false) {
  const c = scenario(id), input = { ...structuredClone(c.inputs), nextTaskNumber: c.inputs.tasks.length + 1 }
  input.project.name = `WP732 DISPOSABLE ${id}`
  input.tasks = input.tasks.map(t => ({ ...t, name: `${t.taskId} ${t.taskId === 'T1' ? 'Design approval' : t.taskId === 'T2' ? 'Build successor' : 'Parallel review'}` }))
  const baseline = establishBaseline(input, `WP732-${id}`, '2026-11-01T12:00:00.000Z')
  if (!baseline.ok) throw new Error(JSON.stringify(baseline.errors))
  let progress = c.progress
  if (beforeCompletion) {
    progress = { ...progress, tasks: Object.fromEntries(Object.entries(progress.tasks).filter(([key]) => key !== 'T1')), events: progress.events.filter(e => e.taskId !== 'T1') }
    const started = transitionTask(progress, 'T1', { target: 'In Progress', eventId: 'WP732-STARTED-T1', date: '2026-11-02', recordedAt: '2026-11-02T12:00:00.000Z' }, input.tasks.map(t => t.taskId))
    if (!started.ok) throw new Error(JSON.stringify(started.errors))
    progress = started.value
  }
  const result = createProjectFile({ ...input, taskProgress: progress, baseline: baseline.value,
    workTracking: { schemaVersion: 1, entries: [], remainingHours: Object.fromEntries(input.tasks.map(t => [t.taskId, t.durationHours])) },
    forecastSettings: { schemaVersion: 1, enabled: true, classHoursPerStudent: 28, homeworkHoursPerStudent: 0, teamSize: 1, asOfDate: c.asOf } }, '2026-11-10T12:00:00.000Z')
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}
