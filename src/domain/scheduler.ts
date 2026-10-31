import type { EarlierDatePolicy, FinishBoundary, ProjectSettings, ScheduleError, SchedulePolicies, ScheduleResult, ScheduledTask, TaskInput } from '../types/scheduling'
import { createWorkingCalendar, dateToOrdinal, SchedulingError, validateCalendar } from './calendar'
import { compareIds, orderTasks } from './graph'

function validate(project: ProjectSettings, tasks: readonly TaskInput[], policies: SchedulePolicies): ScheduleError[] {
  const errors: ScheduleError[] = [...validateCalendar(project)]
  const add = (code: ScheduleError['code'], field: string, message: string, taskId?: string) => errors.push({ code, field, message, ...(taskId === undefined ? {} : { taskId }) })
  const date = (value: string, field: string, taskId?: string) => {
    try { return dateToOrdinal(value, field) }
    catch (error) {
      if (!(error instanceof SchedulingError)) throw error
      errors.push({ ...error.detail, ...(taskId === undefined ? {} : { taskId }) })
      return undefined
    }
  }
  const earlier = (policy: EarlierDatePolicy | undefined, field: string, code: ScheduleError['code'], message: string, taskId?: string) => {
    if (policy === undefined) add('POLICY_DECISION_REQUIRED', field, `${message} Choose ALLOW or REJECT explicitly in SchedulePolicies.`, taskId)
    else if (policy === 'REJECT') add(code, field, message, taskId)
  }
  for (const [field, policy] of Object.entries(policies)) {
    if (!['manualStartBeforeProject', 'targetEndBeforeProject'].includes(field) || (policy !== undefined && policy !== 'ALLOW' && policy !== 'REJECT')) {
      add('INVALID_POLICY', field, `Unknown policy or invalid value for ${field}; use ALLOW or REJECT.`)
    }
  }
  if (typeof project.projectId !== 'string' || !project.projectId.trim() || typeof project.name !== 'string' || !project.name.trim()) {
    add('INVALID_PROJECT', 'projectId/name', 'Provide a nonempty project identifier and name.')
  }
  const projectStart = date(project.projectStartDate, 'projectStartDate')
  const target = date(project.targetEndDate, 'targetEndDate')
  if (projectStart !== undefined && target !== undefined && target < projectStart) {
    earlier(policies.targetEndBeforeProject, 'targetEndDate', 'TARGET_END_BEFORE_PROJECT', 'The target end date precedes the project start date.')
  }
  const ids = new Set<string>()
  for (const task of tasks) {
    const taskId = task.taskId
    if (typeof task.taskId !== 'string' || !task.taskId.trim()) add('INVALID_TASK_ID', 'taskId', 'Provide a stable nonempty task identifier.')
    else if (ids.has(task.taskId)) add('DUPLICATE_TASK_ID', 'taskId', `Task identifier ${task.taskId} occurs more than once.`, task.taskId)
    ids.add(task.taskId)
    if (typeof task.name !== 'string' || !task.name.trim() || typeof task.description !== 'string') {
      add('INVALID_TASK', 'name/description', 'Provide a nonempty task name and a string description.', task.taskId)
    }
    if (!Number.isSafeInteger(task.durationHours) || task.durationHours <= 0) {
      add('INVALID_DURATION', 'durationHours', 'durationHours must be a positive safe whole number of hours.', task.taskId)
    }
    const validPredecessors = Array.isArray(task.predecessorTaskIds) && task.predecessorTaskIds.every(id => typeof id === 'string' && id.trim())
    if (!validPredecessors) add('INVALID_PREDECESSORS', 'predecessorTaskIds', 'Provide an array of nonempty predecessor task identifiers.', task.taskId)
    if (task.independentStartMode !== 'DEFAULT' && task.independentStartMode !== 'MANUAL') {
      add('INVALID_START_MODE', 'independentStartMode', 'Use DEFAULT or MANUAL independent start mode.', taskId)
    } else if (task.independentStartMode === 'MANUAL') {
      const requested = date(task.requestedStartDate, 'requestedStartDate', task.taskId)
      // Retained manual input is inactive while dependencies control the start.
      if (validPredecessors && !task.predecessorTaskIds.length && projectStart !== undefined && requested !== undefined && requested < projectStart) {
        earlier(policies.manualStartBeforeProject, 'requestedStartDate', 'MANUAL_START_BEFORE_PROJECT', 'The manual requested start precedes the project start date.', task.taskId)
      }
    }
  }
  return errors
}

function compareFinish(a: FinishBoundary, b: FinishBoundary): number {
  return compareIds(a.date, b.date) || a.afterHour - b.afterHour
}

/** Recalculate from source inputs after any edit. Returns no partial schedule on failure. */
export function calculateSchedule(project: ProjectSettings, tasks: readonly TaskInput[], policies: SchedulePolicies = {}): ScheduleResult {
  const errors = validate(project, tasks, policies)
  if (errors.length) return { ok: false, errors }
  const graph = orderTasks(tasks)
  if (graph.errors.length) return { ok: false, errors: graph.errors }
  const calendar = createWorkingCalendar(project)
  const inputs = new Map(tasks.map(task => [task.taskId, task]))
  const scheduled = new Map<string, ScheduledTask>()
  let projectCompletion: FinishBoundary | null = null
  for (const id of graph.order) {
    const task = inputs.get(id)!
    try {
      let latest: FinishBoundary | undefined
      for (const predecessor of task.predecessorTaskIds) {
        const finish = scheduled.get(predecessor)!.finishBoundary
        if (!latest || compareFinish(finish, latest) > 0) latest = finish
      }
      const startSlot = latest
        ? calendar.slotAfter(latest)
        : calendar.firstSlotOnOrAfter(task.independentStartMode === 'MANUAL' ? task.requestedStartDate : project.projectStartDate)
      const finishBoundary = calendar.advanceWorkingSlots(startSlot, task.durationHours)
      scheduled.set(id, {
        taskId: id,
        predecessorTaskIds: [...task.predecessorTaskIds].sort(compareIds),
        startSlot,
        finishBoundary,
        startDate: startSlot.date,
        finishDate: finishBoundary.date,
      })
      if (!projectCompletion || compareFinish(finishBoundary, projectCompletion) > 0) projectCompletion = finishBoundary
    } catch (error) {
      if (!(error instanceof SchedulingError)) throw error
      return { ok: false, errors: [{ ...error.detail, taskId: id }] }
    }
  }
  // Returned arrays are canonical regardless of dependency/input ordering.
  return { ok: true, tasks: [...scheduled.values()].sort((a, b) => compareIds(a.taskId, b.taskId)), projectCompletion }
}
