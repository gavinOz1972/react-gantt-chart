import { calculateSchedule, dateToOrdinal, ordinalToDate } from '../domain'
import type { ProjectSettings, TaskInput } from '../domain'
import { compareIds, orderTasks } from '../domain/graph'
import type { Baseline } from '../baseline/baseline'
import { emptyProgress, latestCompletion, progressForTask } from '../progress/taskProgress'
import type { ProgressTracking } from '../progress/taskProgress'
import { decodeForecastSettings } from './settings'
import type { ForecastSettings } from './settings'

export type Indicator = 'On Schedule' | 'At Risk' | 'Late' | 'Completed Late' | 'Completed on time' | 'Completion timing unavailable' | 'Uncertain'
export interface TaskForecast {
  taskId: string; committedFinish: string; baselineFinish: string | null
  forecastStart: string | null; forecastFinish: string | null
  /** Exclusive continuous offsets in calendar days from As-of, before display rounding. */
  startPosition: number | null; finishPosition: number | null
  reason: string; indicator: Indicator; explanation: string
}
export interface Forecast {
  state: 'Disabled' | 'Available' | 'Partial' | 'Unavailable'; message: string
  asOfDate: string; weeklyCapacity: number; targetDays: number; capacityThroughTarget: number | null
  knownRemaining: number; unknownTaskIds: string[]; blockedTaskIds: string[]; affectedTaskIds: string[]
  forecastFinish: string | null; targetVarianceDays: number | null; capacitySurplus: number | null
  committedFinish: string | null; baselineFinish: string | null; tasks: TaskForecast[]
}
export interface ForecastInput {
  project: ProjectSettings; tasks: readonly TaskInput[]; manualOrder?: readonly string[]
  remainingHours: Readonly<Record<string, number | null>>; progress?: ProgressTracking
  baseline?: Baseline; settings?: ForecastSettings; today: string
}

/**
 * A single pool, uniform over seven calendar days, allocated by committed finish,
 * manual order, then code-point ID. Integer units (1/700 hour) avoid daily rounding:
 * daily budget = weekly hundredths; task cost = remaining hundredths * 7.
 * Whole runs of identical daily allocations are batched arithmetically. No actual
 * logs, WP1 slots, baseline inputs or caller objects are modified/read as capacity.
 * Inclusive target interval; a finish exactly at midnight belongs to the prior day.
 */
export function forecastSchedule(input: ForecastInput): Forecast {
  const { project, tasks, baseline, remainingHours, settings, today } = input
  const progress = input.progress ?? emptyProgress()
  const schedule = calculateSchedule(project, tasks)
  const output: Forecast = { state: 'Disabled', message: 'Enable forecasting in Project Settings.', asOfDate: settings?.asOfDate ?? today,
    weeklyCapacity: 0, targetDays: 0, capacityThroughTarget: null, knownRemaining: 0, unknownTaskIds: [], blockedTaskIds: [], affectedTaskIds: [],
    forecastFinish: null, targetVarianceDays: null, capacitySurplus: null, committedFinish: schedule.ok ? schedule.projectCompletion?.date ?? null : null, baselineFinish: baseline?.schedule.projectCompletion?.date ?? null, tasks: [] }
  if (!settings?.enabled) return output
  const checked = decodeForecastSettings(settings)
  if (!checked.ok || !schedule.ok) return { ...output, state: 'Unavailable', message: checked.ok ? 'The committed schedule must be valid.' : checked.errors[0].message }
  let asOf: number
  try { asOf = dateToOrdinal(output.asOfDate) } catch { return { ...output, state: 'Unavailable', message: 'Invalid As-of date.' } }
  const budget = (Math.round(settings.classHoursPerStudent * 100) + Math.round(settings.homeworkHoursPerStudent * 100)) * settings.teamSize
  output.weeklyCapacity = budget / 100
  output.targetDays = Math.max(0, dateToOrdinal(project.targetEndDate) - asOf + 1)
  const targetUnits = budget * output.targetDays
  output.capacityThroughTarget = Number.isSafeInteger(targetUnits) ? targetUnits / 700 : null
  const byId = new Map(tasks.map(task => [task.taskId, task]))
  const committed = new Map(schedule.tasks.map(task => [task.taskId, task]))
  const costs = new Map<string, number>()
  const reasons = new Map<string, string>()
  const complete = new Set(tasks.filter(task => progressForTask(progress, task.taskId).status === 'Complete').map(task => task.taskId))
  let remainingUnits = 0
  for (const task of tasks) {
    if (complete.has(task.taskId)) { costs.set(task.taskId, 0); continue }
    const remaining = Object.hasOwn(remainingHours, task.taskId) ? remainingHours[task.taskId] : null
    if (remaining === null || !Number.isFinite(remaining) || remaining < 0 || Math.abs(remaining * 100 - Math.round(remaining * 100)) > 1e-6) {
      output.unknownTaskIds.push(task.taskId); reasons.set(task.taskId, `Unknown remaining effort: ${task.taskId}.`)
    } else { const units = Math.round(remaining * 100) * 7; costs.set(task.taskId, units); remainingUnits += units }
    if (progressForTask(progress, task.taskId).status === 'Blocked') { output.blockedTaskIds.push(task.taskId); reasons.set(task.taskId, `Blocked: ${task.taskId}; restart date unknown.`) }
  }
  output.knownRemaining = remainingUnits / 700
  output.capacitySurplus = Number.isSafeInteger(targetUnits) && Number.isSafeInteger(remainingUnits) ? (targetUnits - remainingUnits) / 700 : null
  for (const id of orderTasks(tasks).order) {
    if (complete.has(id)) continue
    const inherited = byId.get(id)!.predecessorTaskIds.find(pred => reasons.has(pred))
    if (inherited && !reasons.has(id)) reasons.set(id, `Indeterminate predecessor ${inherited}. ${reasons.get(inherited)}`)
  }
  output.affectedTaskIds = [...reasons.keys()].sort(compareIds)
  const ranks = new Map((input.manualOrder ?? tasks.map(task => task.taskId)).map((id, index) => [id, index]))
  const priority = (a: string, b: string) => {
    const ca = committed.get(a)!, cb = committed.get(b)!
    const rank = (id: string) => ranks.get(id) ?? Number.MAX_SAFE_INTEGER
    return compareIds(ca.finishDate, cb.finishDate) || ca.finishBoundary.afterHour - cb.finishBoundary.afterHour || rank(a) - rank(b) || compareIds(a, b)
  }
  const done = new Set(complete), pending = new Set(tasks.filter(task => !done.has(task.taskId) && !reasons.has(task.taskId)).map(task => task.taskId))
  const positions = new Map<string, { start: number; finish: number; startDate: string; finishDate: string }>()
  let cursor = 0
  const maxDate = dateToOrdinal('9999-12-31')
  if (budget > 0 && Number.isSafeInteger(remainingUnits)) while (pending.size) {
    const ready = [...pending].filter(id => byId.get(id)!.predecessorTaskIds.every(pred => done.has(pred))).sort(priority)
    if (!ready.length) break
    const id = ready[0], cost = costs.get(id)!, end = cursor + cost
    const finishDay = Math.floor(Math.max(0, end - 1) / budget)
    // Zero effort occupies no day and may finish at its predecessor's boundary.
    const startDay = cost === 0 ? finishDay : Math.floor(cursor / budget)
    if (!Number.isSafeInteger(end) || asOf + finishDay > maxDate) { reasons.set(id, 'Projection exceeds supported year 9999.'); pending.delete(id); continue }
    positions.set(id, { start: cursor / budget, finish: end / budget, startDate: ordinalToDate(asOf + startDay), finishDate: ordinalToDate(asOf + finishDay) })
    cursor = end; done.add(id); pending.delete(id)
  }
  for (const task of tasks) {
    const id = task.taskId, finish = committed.get(id)!.finishDate, position = positions.get(id), event = latestCompletion(progress, id)
    const completed = complete.has(id)
    const forecastFinish = completed ? event?.date ?? null : position?.finishDate ?? null
    const reason = completed ? 'Complete: zero future effort; dependencies satisfied immediately.' : reasons.get(id) ?? (budget === 0 ? 'Zero declared capacity.' : !position ? 'Projection unavailable: predecessor or numeric/date limit.' : 'Shared capacity projection; seven-day uniform approximation.')
    let indicator: Indicator, explanation: string
    if (completed) {
      indicator = !event?.committedFinishDateAtCompletion ? 'Completion timing unavailable' : event.date > event.committedFinishDateAtCompletion ? 'Completed Late' : 'Completed on time'
      explanation = event?.committedFinishDateAtCompletion ? `Effective completion ${event.date}; committed finish at completion ${event.committedFinishDateAtCompletion}.` : 'This legacy completion has no historical committed-finish snapshot.'
    } else if (output.asOfDate > finish) { indicator = 'Late'; explanation = `As-of is after committed finish ${finish}. ${!forecastFinish ? reason : ''}` }
    else if (!forecastFinish) { indicator = 'Uncertain'; explanation = reason }
    else if (forecastFinish > finish) { indicator = 'At Risk'; explanation = 'Projected finish is after committed finish, which has not passed.' }
    else { indicator = 'On Schedule'; explanation = 'Projected finish is on or before committed finish; that date has not passed.' }
    output.tasks.push({ taskId: id, committedFinish: finish, baselineFinish: baseline?.schedule.tasks.find(task => task.taskId === id)?.finishDate ?? null,
      forecastStart: completed ? null : position?.startDate ?? null, forecastFinish, startPosition: position?.start ?? null, finishPosition: position?.finish ?? null, reason, indicator, explanation })
  }
  const partial = output.affectedTaskIds.length > 0
  const unavailable = tasks.length === 0 || budget === 0 || output.tasks.some(task => !task.forecastFinish) || output.capacityThroughTarget === null
  output.state = partial ? 'Partial' : unavailable ? 'Unavailable' : 'Available'
  output.message = partial ? 'Incomplete estimates or blocked dependencies: no definitive project finish or feasibility verdict.' : !tasks.length ? 'Add tasks to project a completion date.' : unavailable ? 'Forecast dates unavailable. Check capacity and projection limits.' : 'Approximate planning projection; capacity is shared, not a delivery promise.'
  if (!partial && !unavailable && output.tasks.length) {
    output.forecastFinish = output.tasks.map(task => task.forecastFinish!).sort(compareIds).at(-1)!
    output.targetVarianceDays = dateToOrdinal(output.forecastFinish) - dateToOrdinal(project.targetEndDate)
  }
  return output
}
