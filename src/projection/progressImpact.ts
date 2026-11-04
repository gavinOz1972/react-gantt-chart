import { calculateSchedule, createWorkingCalendar, createWorkingTimeIndex, dateToOrdinal, ordinalToDate, SchedulingError } from '../domain'
import type { FinishBoundary, ProjectSettings, ScheduledTask, TaskInput, WorkingSlot } from '../domain'
import { compareIds, orderTasks } from '../domain/graph'
import { decodeProgress, progressForTask } from '../progress/taskProgress'
import type { ProgressTracking, StatusEvent, TaskStatus } from '../progress/taskProgress'

export type ImpactCause = 'As-of' | 'Completion readiness'
export interface CompletionFact {
  date: string; eventId: string; reference?: string; active: boolean; future: boolean
  historical: 'Late' | 'Early' | 'On date' | 'Unknown'; calendarDays: number | null
}
export interface BindingConstraint {
  kind: 'Committed floor' | 'As-of' | 'Predecessor'; slot: WorkingSlot; predecessorId?: string; eventId?: string
}
export interface TaskImpact {
  taskId: string; status: TaskStatus; committed: ScheduledTask; completion?: CompletionFact
  assumedStatus: boolean; reopened: boolean; state: 'Known' | 'Complete' | 'Unknown'
  start: WorkingSlot | null; finish: FinishBoundary | null; shiftSlots: string | null
  binding: BindingConstraint[]; causes: ImpactCause[]; warnings: string[]; uncertainty: string[]
  dateOrderBreaches: string[]
}
export type ProgressImpact = { ok: false; message: string } | {
  ok: true; ruleVersion: 1; asOf: string; tasks: TaskImpact[]; conflicts: string[]
  project: { date: string | null; knownDate: string | null; finish: FinishBoundary | null; committedDate: string | null; committedFinish: FinishBoundary | null; shiftSlots: string | null; calendarDays: number | null; actual: boolean; uncertain: boolean }
  drivingTaskIds: string[]; drivingLinks: string[]
}

/** Pure dependency/calendar outlook. No person-hours, resource pool or clock input. */
export function calculateProgressImpact({ project, tasks, progress, asOf }: {
  project: ProjectSettings; tasks: readonly TaskInput[]; progress: ProgressTracking; asOf: string
}): ProgressImpact {
  try {
    dateToOrdinal(asOf, 'Progress-adjusted As-of')
    const schedule = calculateSchedule(project, tasks)
    if (!schedule.ok) return { ok: false, message: schedule.errors.map(e => e.message).join(' ') }
    const decoded = decodeProgress(progress, tasks.map(t => t.taskId))
    if (!decoded.ok) return { ok: false, message: decoded.errors.map(e => e.message).join(' ') }
    const calendar = createWorkingCalendar(project), time = createWorkingTimeIndex(project)
    const asOfSlot = calendar.firstSlotOnOrAfter(asOf)
    const byId = new Map(tasks.map(t => [t.taskId, t]))
    const committed = new Map(schedule.tasks.map(t => [t.taskId, t]))
    const completions = new Map<string, StatusEvent>()
    for (const event of decoded.value.events) if (event.toStatus === 'Complete') completions.set(event.taskId, event)
    const outlook = new Map<string, TaskImpact>(), conflicts: string[] = []
    for (const id of orderTasks(tasks).order) {
      const task = byId.get(id)!, current = committed.get(id)!
      const status = progressForTask(decoded.value, id).status, event = completions.get(id)
      const delta = event?.committedFinishDateAtCompletion ? dateToOrdinal(event.date) - dateToOrdinal(event.committedFinishDateAtCompletion) : null
      const completion: CompletionFact | undefined = event ? {
        date: event.date, eventId: event.eventId, reference: event.committedFinishDateAtCompletion,
        active: status === 'Complete', future: event.date > asOf,
        historical: delta === null ? 'Unknown' : delta > 0 ? 'Late' : delta < 0 ? 'Early' : 'On date', calendarDays: delta,
      } : undefined
      const item: TaskImpact = { taskId: id, status, committed: current, completion,
        assumedStatus: !Object.hasOwn(decoded.value.tasks, id), reopened: !!event && status !== 'Complete',
        state: 'Unknown', start: null, finish: null, shiftSlots: null, binding: [], causes: [], warnings: [], uncertainty: [], dateOrderBreaches: [] }
      outlook.set(id, item)
      if (task.independentStartMode === 'MANUAL') item.warnings.push(task.predecessorTaskIds.length
        ? `Retained manual date ${task.requestedStartDate} is inactive while predecessors control readiness.`
        : `Independent manual date ${task.requestedStartDate} is a not-before release included in the committed floor, not a fixed appointment.`)
      for (const predId of [...task.predecessorTaskIds].sort(compareIds)) {
        const pred = outlook.get(predId)!
        if (pred.completion?.active && !pred.completion.future) {
          if (current.startDate < pred.completion.date) item.dateOrderBreaches.push(predId)
          else if (current.startDate === pred.completion.date) item.warnings.push(`${predId}: same-date committed handoff is unverified; actual time is not recorded.`)
          if (completion?.active && !completion.future) {
            if (completion.date < pred.completion.date) {
              const warning = `Recorded completion order conflicts: ${id} ${completion.date} before predecessor ${predId} ${pred.completion.date}.`
              conflicts.push(warning); item.warnings.push(warning)
            } else if (completion.date === pred.completion.date) item.warnings.push(`${predId} and ${id}: same-date actual dependency order is unverified.`)
          }
        }
      }
      if (status === 'Complete') {
        if (completion && !completion.future) item.state = 'Complete'
        else item.uncertainty.push('Future-effective completion relative to PA As-of; not an observed fact in this context.')
        continue
      }
      if (status !== 'Not Started' || item.reopened) {
        item.uncertainty.push(item.reopened ? 'Reopened: old completion is history; remaining scheduled slots are unknown.' : status === 'Blocked' ? 'Blocked: restart date and remaining scheduled slots are unknown.' : 'In Progress: actual start and remaining scheduled slots are unknown.')
        continue
      }
      const bounds: BindingConstraint[] = [{ kind: 'Committed floor', slot: current.startSlot }, { kind: 'As-of', slot: asOfSlot }]
      for (const predId of [...task.predecessorTaskIds].sort(compareIds)) {
        const pred = outlook.get(predId)!
        if (pred.state === 'Complete' && pred.completion) {
          bounds.push({ kind: 'Predecessor', predecessorId: predId, eventId: pred.completion.eventId,
            slot: calendar.firstSlotOnOrAfter(ordinalToDate(dateToOrdinal(pred.completion.date) + 1)) })
        } else if (pred.state === 'Known' && pred.finish) {
          bounds.push({ kind: 'Predecessor', predecessorId: predId, slot: calendar.slotAfter(pred.finish) })
        } else item.uncertainty.push(`${predId}: required predecessor readiness is Unknown.`)
      }
      if (item.uncertainty.length) continue
      const maximum = bounds.reduce((n, bound) => { const i = time.startIndex(bound.slot); return i > n ? i : n }, 0n)
      item.binding = bounds.filter(b => time.startIndex(b.slot) === maximum)
      item.start = time.slotAt(maximum)
      item.finish = calendar.advanceWorkingSlots(item.start, task.durationHours)
      item.shiftSlots = String(maximum - time.startIndex(current.startSlot))
      item.state = 'Known'
      if (item.shiftSlots !== '0') {
        const causes = new Set<ImpactCause>()
        for (const bound of item.binding) {
          if (bound.kind === 'As-of') causes.add('As-of')
          if (bound.predecessorId) {
            const pred = outlook.get(bound.predecessorId)!
            if (bound.eventId) causes.add('Completion readiness')
            else for (const cause of pred.causes) causes.add(cause)
          }
        }
        item.causes = [...causes].sort()
      }
    }
    const results = [...outlook.values()].sort((a, b) => compareIds(a.taskId, b.taskId))
    const endpoint = (t: TaskImpact) => t.state === 'Complete' ? t.completion!.date : t.finish?.date
    const dates = results.flatMap(t => endpoint(t) ? [endpoint(t)!] : [])
    const knownDate = dates.sort().at(-1) ?? null
    const uncertain = conflicts.length > 0 || results.some(t => t.state === 'Unknown')
    const onLastDate = knownDate ? results.filter(t => endpoint(t) === knownDate) : []
    const dateOnly = onLastDate.some(t => t.state === 'Complete')
    const lastBoundary = onLastDate.reduce<FinishBoundary | null>((last, t) => t.finish && (!last || time.finishIndex(t.finish) > time.finishIndex(last)) ? t.finish : last, null)
    // Same date is not a tie when both planned slot boundaries are known.
    // With a date-only actual, retain possible ties without inventing its hour.
    const controlling = dateOnly ? onLastDate : onLastDate.filter(t => t.finish && lastBoundary && time.finishIndex(t.finish) === time.finishIndex(lastBoundary))
    const actual = results.length > 0 && results.every(t => t.state === 'Complete')
    // An actual date tying the maximum carries no hour. Never manufacture one.
    const finish = !uncertain && !dateOnly ? lastBoundary : null
    const drivers = new Set<string>(), links = new Set<string>()
    const stack = uncertain ? [] : controlling.map(t => t.taskId)
    while (stack.length) {
      const id = stack.pop()!
      if (drivers.has(id)) continue
      drivers.add(id)
      for (const b of outlook.get(id)!.binding) if (b.predecessorId) {
        links.add(JSON.stringify([b.predecessorId, id])); stack.push(b.predecessorId)
      }
    }
    const committedDate = schedule.projectCompletion?.date ?? null
    return { ok: true, ruleVersion: 1, asOf, tasks: results, conflicts,
      project: { date: uncertain ? null : knownDate, knownDate, finish, committedDate, committedFinish: schedule.projectCompletion,
        shiftSlots: finish && schedule.projectCompletion ? String(time.finishIndex(finish) - time.finishIndex(schedule.projectCompletion)) : null,
        calendarDays: !uncertain && knownDate && committedDate ? dateToOrdinal(knownDate) - dateToOrdinal(committedDate) : null, actual, uncertain },
      drivingTaskIds: [...drivers].sort(compareIds), drivingLinks: [...links].sort(compareIds) }
  } catch (error) {
    if (!(error instanceof SchedulingError)) throw error
    return { ok: false, message: error.message }
  }
}

export function impactDescription(item: TaskImpact, asOf: string): string {
  const fact = item.completion
  const historical = !fact ? '' : `Actual completion ${fact.date}; time not recorded${fact.active ? '' : '; historical, reopened'}${fact.future ? '; future-effective relative to PA As-of' : ''}. ${fact.reference ? `${fact.historical === 'On date' ? 'On committed date' : fact.historical === 'Late' ? `Historically late by ${fact.calendarDays} calendar days` : `Completed ${Math.abs(fact.calendarDays!)} calendar days early`} versus saved committed finish ${fact.reference}.` : 'Historical commitment unavailable; historical lateness Unknown.'} `
  const dates = item.finish && item.start ? `PA ${item.start.date} slot ${item.start.hour} to ${item.finish.date} after slot ${item.finish.afterHour}; +${item.shiftSlots} scheduled slots versus current commitment. Full committed scheduled duration. ${item.causes.length ? `Movement: ${item.causes.join(' and ')}. ` : ''}Binding constraints: ${item.binding.map(b => `${b.kind}${b.predecessorId ? ` ${b.predecessorId}` : ''}${b.eventId ? ` (event ${b.eventId}; next working date, conservative)` : ''} ${b.slot.date} slot ${b.slot.hour}`).join('; ')}. ` : item.state === 'Unknown' ? `PA Unknown: ${item.uncertainty.join(' ')} ` : ''
  return `${item.taskId}. ${historical}${dates}${item.dateOrderBreaches.length ? `Committed start date precedes recorded actual completion of ${item.dateOrderBreaches.join(', ')}. ` : ''}${item.warnings.join(' ')} PA As-of ${asOf}, start-of-date. ${item.assumedStatus ? 'Default Not Started is a planning assumption, not verified no-work. ' : ''}Date-only readiness is conservative; no actual finish hour is inferred. PA is separate from the shared-capacity effort forecast.`
}
