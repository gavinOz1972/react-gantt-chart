import type { ProjectSettings, ScheduleResult, TaskInput } from '../domain'
import type { Forecast, Indicator } from '../forecast/forecast'
import { latestCompletion, progressForTask } from './taskProgress'
import type { ProgressTracking, TaskStatus } from './taskProgress'

export type HealthTone = 'good' | 'warning' | 'late' | 'uncertain' | 'complete'
export interface TaskHealth { label: string; tone: HealthTone; explanation: string; workStatus: TaskStatus }
export interface ProjectHealth { label: string; tone: HealthTone; explanation: string; forecastState: string; availability: string; blocked: number; late: number; completed: boolean; completionDate: string | null; knownRemaining: number }
export function indicatorPresentation(indicator: Indicator): Pick<TaskHealth, 'label' | 'tone'> {
  return { label: indicator === 'On Schedule' ? 'On Track' : indicator,
    tone: indicator === 'On Schedule' || indicator === 'Completed on time' ? 'good' : indicator === 'At Risk' ? 'warning' : indicator === 'Late' || indicator === 'Completed Late' ? 'late' : 'uncertain' }
}
/** Read-only labels/counts over accepted WP6.4 outputs; no capacity allocation or replanning. */
export function healthPresentation(project: ProjectSettings, tasks: readonly TaskInput[], schedule: ScheduleResult, forecast: Forecast, progress: ProgressTracking, invalidDraft = false, remainingHours: Readonly<Record<string, number | null>> = {}) {
  const forecastById = new Map(forecast.tasks.map(task => [task.taskId, task]))
  const committed = new Map(schedule.ok ? schedule.tasks.map(task => [task.taskId, task.finishDate]) : [])
  const taskHealth = new Map<string, TaskHealth>()
  for (const task of tasks) {
    const workStatus = progressForTask(progress, task.taskId).status
    const output = forecastById.get(task.taskId)
    let health: TaskHealth
    if (output && !invalidDraft) health = { ...indicatorPresentation(output.indicator), explanation: output.explanation, workStatus }
    else if (workStatus === 'Complete') {
      const completion = latestCompletion(progress, task.taskId)
      const indicator: Indicator = !completion?.committedFinishDateAtCompletion ? 'Completion timing unavailable' : completion.date > completion.committedFinishDateAtCompletion ? 'Completed Late' : 'Completed on time'
      health = { ...indicatorPresentation(indicator), workStatus, explanation: completion?.committedFinishDateAtCompletion ? `Completed ${completion.date}; committed finish at completion ${completion.committedFinishDateAtCompletion}.` : 'Complete; historical committed-finish context was not recorded.' }
    } else if (!invalidDraft && committed.has(task.taskId) && forecast.asOfDate > committed.get(task.taskId)!) health = { label: 'Late', tone: 'late', workStatus, explanation: `Unfinished as of ${forecast.asOfDate}, after committed finish ${committed.get(task.taskId)}.` }
    else health = { label: 'Uncertain', tone: 'uncertain', workStatus, explanation: invalidDraft ? 'Correct invalid forecast settings.' : workStatus === 'Blocked' ? 'Blocked restart is unknown; no forecast endpoint.' : 'Forecast unavailable; enable forecasting and supply valid capacity and remaining effort.' }
    taskHealth.set(task.taskId, health)
  }
  const blocked = [...taskHealth.values()].filter(task => task.workStatus === 'Blocked').length
  const late = [...taskHealth.values()].filter(task => task.label === 'Late').length
  const completed = tasks.length > 0 && tasks.every(task => progressForTask(progress, task.taskId).status === 'Complete')
  // Disabled forecasts do not compute totals; still show the explicit saved effort,
  // without inventing capacity or treating Complete tasks as future work.
  const knownRemaining = forecast.state !== 'Disabled' ? forecast.knownRemaining : tasks.reduce((sum, task) => sum + (progressForTask(progress, task.taskId).status === 'Complete' ? 0 : Math.round((remainingHours[task.taskId] ?? 0) * 100)), 0) / 100
  const completionDates = completed ? tasks.map(task => latestCompletion(progress, task.taskId)?.date) : []
  const completionDate = completed && completionDates.every((date): date is string => !!date) ? [...completionDates].sort().at(-1)! : null
  const availability = blocked || forecast.affectedTaskIds.some(id => !forecast.unknownTaskIds.includes(id)) ? 'Indeterminate' : invalidDraft || forecast.state !== 'Available' ? 'Forecast Unavailable' : 'Projection available'
  const forecastState = invalidDraft ? 'Unavailable' : forecast.state === 'Available' ? 'Complete' : forecast.state
  let outcome: Pick<ProjectHealth, 'label' | 'tone' | 'explanation'>
  if (completed) {
    const finish = completionDate
    outcome = { label: finish && finish > project.targetEndDate ? 'Completed Late' : 'Completed', tone: finish && finish > project.targetEndDate ? 'late' : 'complete', explanation: finish ? `All tasks complete. Latest effective completion ${finish}, ${finish > project.targetEndDate ? 'after' : 'on or before'} current target ${project.targetEndDate}. Historical task outcomes remain separate.` : 'All tasks complete; recorded completion timing is unavailable.' }
  } else if (!invalidDraft && tasks.length > 0 && forecast.asOfDate > project.targetEndDate) outcome = { label: 'Late', tone: 'late', explanation: `Work is incomplete and As-of ${forecast.asOfDate} is after project target ${project.targetEndDate}. ${availability !== 'Projection available' ? availability + '.' : ''}` }
  else if (!invalidDraft && forecast.state === 'Available' && forecast.forecastFinish && !blocked) outcome = forecast.forecastFinish > project.targetEndDate
    ? { label: 'At Risk', tone: 'warning', explanation: 'Projected completion is after the target, which has not passed.' }
    : { label: 'On Track', tone: 'good', explanation: 'The complete projection fits the current target; this is an approximate planning estimate.' }
  else outcome = { label: 'Uncertain', tone: 'uncertain', explanation: invalidDraft ? 'Correct or revert invalid forecast settings.' : blocked ? `${blocked} Blocked ${blocked === 1 ? 'task has' : 'tasks have'} no known restart; dependent paths are indeterminate.` : forecast.unknownTaskIds.length ? `${forecast.unknownTaskIds.length} unfinished ${forecast.unknownTaskIds.length === 1 ? 'task lacks' : 'tasks lack'} a remaining-effort estimate; no definitive delivery verdict.` : forecast.state === 'Disabled' ? 'Forecasting is disabled; enable valid assumptions to judge delivery.' : forecast.message }
  return { tasks: taskHealth, project: { ...outcome, blocked, late, completed, forecastState, availability, completionDate, knownRemaining } satisfies ProjectHealth }
}
