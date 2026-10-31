import { createWorkingCalendar, SchedulingError } from './calendar'
import { compareIds, orderTasks } from './graph'
import { calculateSchedule } from './scheduler'
import { createWorkingTimeIndex } from './workingTime'
import type { CriticalPathResult, TaskCriticalAnalysis } from '../types/criticalPath'
import type { ProjectSettings, ScheduleResult, TaskInput, WorkingSlot } from '../types/scheduling'

/** Backward-pass analysis of the current WP1 result. Manual root starts are releases, not effort. */
export function analyzeCriticalPath(project: ProjectSettings, tasks: readonly TaskInput[], schedule: ScheduleResult = calculateSchedule(project, tasks)): CriticalPathResult {
  if (!schedule.ok) return { ok: false, errors: schedule.errors }
  const graph = orderTasks(tasks)
  if (graph.errors.length) return { ok: false, errors: graph.errors }
  const mismatch = (message: string): CriticalPathResult => ({ ok: false, errors: [{ code: 'ANALYSIS_INPUT_MISMATCH', field: 'schedule', message }] })
  if (new Set(tasks.map(task => task.taskId)).size !== tasks.length || schedule.tasks.length !== tasks.length) return mismatch('Provide the current WP1 result for these exact source tasks.')
  if (!tasks.length) return schedule.projectCompletion === null
    ? { ok: true, tasks: [], relationships: [], topologicalTaskIds: [], projectCompletion: null }
    : mismatch('An empty schedule must not contain a project completion date.')
  if (!schedule.projectCompletion) return mismatch('A nonempty valid schedule must include project completion.')

  try {
    const time = createWorkingTimeIndex(project)
    const calendar = createWorkingCalendar(project)
    const source = new Map(tasks.map(task => [task.taskId, task]))
    const scheduled = new Map(schedule.tasks.map(task => [task.taskId, task]))
    const children = new Map(tasks.map(task => [task.taskId, [] as string[]]))
    const starts = new Map<string, bigint>()
    const finishes = new Map<string, bigint>()
    const releases = new Map<string, WorkingSlot>()
    const completion = time.finishIndex(schedule.projectCompletion)
    for (const task of tasks) {
      const dates = scheduled.get(task.taskId)
      if (!dates) return mismatch(`The schedule is missing ${task.taskId}. Recalculate it before analysis.`)
      if (!Number.isSafeInteger(task.durationHours) || task.durationHours <= 0) return mismatch(`Recalculate ${task.taskId} with a valid positive whole-hour duration first.`)
      const start = time.startIndex(dates.startSlot)
      const finish = time.finishIndex(dates.finishBoundary)
      if (finish - start !== BigInt(task.durationHours) || finish > completion || JSON.stringify([...dates.predecessorTaskIds].sort(compareIds)) !== JSON.stringify([...task.predecessorTaskIds].sort(compareIds))) {
        return mismatch(`Schedule data for ${task.taskId} does not match its duration, relationships or completion. Recalculate it first.`)
      }
      starts.set(task.taskId, start)
      finishes.set(task.taskId, finish)
      for (const id of task.predecessorTaskIds) children.get(id)!.push(task.taskId)
    }
    if ([...finishes.values()].reduce((maximum, finish) => finish > maximum ? finish : maximum, 0n) !== completion) return mismatch('Project completion must equal the latest scheduled task finish.')
    for (const task of tasks) {
      if (task.predecessorTaskIds.some(id => finishes.get(id)! > starts.get(task.taskId)!)) return mismatch(`Predecessors for ${task.taskId} finish after its scheduled start.`)
      if (!task.predecessorTaskIds.length) {
        const release = calendar.firstSlotOnOrAfter(task.independentStartMode === 'MANUAL' ? task.requestedStartDate : project.projectStartDate)
        if (time.startIndex(release) > starts.get(task.taskId)!) return mismatch(`Task ${task.taskId} starts before its independent release constraint. Recalculate the schedule first.`)
        releases.set(task.taskId, release)
      }
    }
    const latestStarts = new Map<string, bigint>()
    const latestFinishes = new Map<string, bigint>()
    for (const id of [...graph.order].reverse()) {
      const successors = children.get(id)!
      const latestFinish = successors.reduce((minimum, child) => latestStarts.get(child)! < minimum ? latestStarts.get(child)! : minimum, completion)
      const latestStart = latestFinish - BigInt(source.get(id)!.durationHours)
      if (latestStart < starts.get(id)!) return mismatch(`The current schedule for ${id} cannot fit before its project completion.`)
      latestStarts.set(id, latestStart)
      latestFinishes.set(id, latestFinish)
    }
    const safeHours = (hours: bigint): number => {
      if (hours < 0n || hours > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Slack or release delay exceeds safe whole-hour precision. Reduce the calendar range or daily hours.')
      return Number(hours)
    }
    const projectStart = time.startIndex(calendar.firstSlotOnOrAfter(project.projectStartDate))
    const analysis: TaskCriticalAnalysis[] = [...source.values()].sort((a, b) => compareIds(a.taskId, b.taskId)).map(task => {
      const dates = scheduled.get(task.taskId)!
      const earliestStart = starts.get(task.taskId)!
      const latestStart = latestStarts.get(task.taskId)!
      const release = releases.get(task.taskId)
      return {
        taskId: task.taskId, durationHours: task.durationHours,
        earliestStart: { ...dates.startSlot }, earliestFinish: { ...dates.finishBoundary },
        latestStart: time.slotAt(latestStart), latestFinish: time.boundaryAt(latestFinishes.get(task.taskId)!),
        totalSlackHours: safeHours(latestStart - earliestStart), critical: latestStart === earliestStart,
        ...(release ? { releaseStart: release } : {}), releaseDelayHours: release ? safeHours(time.startIndex(release) > projectStart ? time.startIndex(release) - projectStart : 0n) : 0,
      }
    })
    const critical = new Set(analysis.filter(task => task.critical).map(task => task.taskId))
    const relationships = [...source.values()].sort((a, b) => compareIds(a.taskId, b.taskId)).flatMap(task => [...task.predecessorTaskIds].sort(compareIds).map(id => ({
      key: JSON.stringify([id, task.taskId]), predecessorId: id, successorId: task.taskId,
      critical: critical.has(id) && critical.has(task.taskId) && finishes.get(id) === starts.get(task.taskId),
    })))
    return { ok: true, tasks: analysis, relationships, topologicalTaskIds: [...graph.order], projectCompletion: { ...schedule.projectCompletion } }
  } catch (error) {
    if (error instanceof SchedulingError) return { ok: false, errors: [error.detail] }
    if (error instanceof RangeError) return { ok: false, errors: [{ code: 'ANALYSIS_RANGE_OVERFLOW', field: 'calendar', message: error.message }] }
    throw error
  }
}
