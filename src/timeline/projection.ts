import { dateToOrdinal, ordinalToDate } from '../domain'
import type { FinishBoundary, ProjectSettings, ScheduledTask, TaskInput, WorkingSlot } from '../domain'

export type TimelineMode = 'expanded' | 'compressed'
export type TimelineZoom = 'hour' | 'day' | 'week'
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_DAY = dateToOrdinal('9999-12-31')

export interface TimelineAxis {
  mode: TimelineMode
  startOrdinal: number
  endOrdinal: number
  hoursPerDay: number
  totalUnits: number
  isWorkingDay: (ordinal: number) => boolean
  dayStart: (ordinal: number) => number
  dayEnd: (ordinal: number) => number
  ordinalAt: (unit: number) => number
  startAt: (slot: WorkingSlot) => number
  finishAt: (boundary: FinishBoundary) => number
}

/** Coordinate mapping only: it never calculates, repairs, or changes a schedule. */
export function createTimelineAxis(project: ProjectSettings, schedule: readonly ScheduledTask[], mode: TimelineMode): TimelineAxis {
  const hours = project.workingHoursPerDay
  const weekdays = new Set<number>(project.workingWeekdays)
  const startOrdinal = schedule.reduce((first, task) => Math.min(first, dateToOrdinal(task.startDate)), dateToOrdinal(project.projectStartDate))
  const last = schedule.reduce((end, task) => Math.max(end, dateToOrdinal(task.finishDate)), Math.max(dateToOrdinal(project.projectStartDate), dateToOrdinal(project.targetEndDate)))
  const endOrdinal = Math.min(MAX_DAY, last + 2)
  const isWorkingDay = (ordinal: number) => weekdays.has((ordinal + 1) % 7)

  function workingDaysBefore(ordinal: number): number {
    const days = ordinal - startOrdinal
    let count = Math.floor(days / 7) * weekdays.size
    const remainderStart = startOrdinal + Math.floor(days / 7) * 7
    for (let day = remainderStart; day < ordinal; day++) if (isWorkingDay(day)) count++
    return count
  }
  const dayStart = (ordinal: number) => mode === 'expanded' ? ordinal - startOrdinal : workingDaysBefore(ordinal) * hours
  const dayEnd = (ordinal: number) => dayStart(ordinal) + (mode === 'expanded' ? 1 : isWorkingDay(ordinal) ? hours : 0)
  const totalUnits = dayStart(endOrdinal + 1)
  if (!Number.isSafeInteger(totalUnits) || totalUnits < 1) throw new RangeError('The calendar range is too dense to display safely. Reduce the date range or daily hours.')

  function ordinalAt(unit: number): number {
    if (mode === 'expanded') return Math.min(endOrdinal, Math.max(startOrdinal, startOrdinal + Math.floor(unit)))
    const bounded = Math.max(0, Math.min(totalUnits - 1, unit))
    let low = startOrdinal
    let high = endOrdinal
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (dayEnd(middle) > bounded) high = middle
      else low = middle + 1
    }
    return low
  }
  return {
    mode, startOrdinal, endOrdinal, hoursPerDay: hours, totalUnits, isWorkingDay, dayStart, dayEnd, ordinalAt,
    startAt: slot => dayStart(dateToOrdinal(slot.date)) + (mode === 'expanded' ? (slot.hour - 1) / hours : slot.hour - 1),
    finishAt: finish => dayStart(dateToOrdinal(finish.date)) + (mode === 'expanded' ? finish.afterHour / hours : finish.afterHour),
  }
}

export interface TimelineDay { ordinal: number; date: string; weekday: string; working: boolean; start: number; end: number }
export function visibleHourTicks(axis: TimelineAxis, day: TimelineDay, left: number, right: number, scale: number): { hour: number; unit: number }[] {
  const slotUnits = (day.end - day.start) / axis.hoursPerDay
  const slotPixels = slotUnits * scale
  if (!day.working || slotPixels < 18) return []
  const first = Math.max(0, Math.floor((left - day.start) / slotUnits))
  const last = Math.min(axis.hoursPerDay - 1, Math.floor((right - day.start) / slotUnits))
  const step = Math.max(1, Math.ceil(30 / slotPixels))
  const count = Math.max(0, Math.min(100, Math.ceil((last - first + 1) / step)))
  return Array.from({ length: count }, (_, index) => {
    const slot = first + index * step
    return { hour: slot + 1, unit: day.start + slot * slotUnits }
  })
}
/** Only dates intersecting the visible window; never the whole project date range. */
export function visibleDays(axis: TimelineAxis, left: number, right: number): TimelineDay[] {
  const days: TimelineDay[] = []
  const first = axis.ordinalAt(left)
  const last = axis.ordinalAt(Math.min(right, axis.totalUnits - Number.EPSILON))
  for (let ordinal = first; ordinal <= last; ordinal++) {
    const working = axis.isWorkingDay(ordinal)
    if (axis.mode === 'compressed' && !working) continue
    days.push({ ordinal, date: ordinalToDate(ordinal), weekday: DAY_NAMES[(ordinal + 1) % 7], working,
      start: axis.dayStart(ordinal), end: axis.dayEnd(ordinal) })
  }
  return days
}

export interface TimelineRow { taskId: string; task: TaskInput; scheduled: ScheduledTask; index: number; start: number; end: number }
export interface TimelineLink { key: string; predecessorId: string; successorId: string; from: { x: number; row: number }; to: { x: number; row: number } }

export function projectTimeline(axis: TimelineAxis, tasks: readonly TaskInput[], schedule: readonly ScheduledTask[]): { rows: TimelineRow[]; links: TimelineLink[] } {
  const byId = new Map(schedule.map(task => [task.taskId, task]))
  const rows = tasks.flatMap((task, index) => {
    const scheduled = byId.get(task.taskId)
    return scheduled ? [{ taskId: task.taskId, task, scheduled, index, start: axis.startAt(scheduled.startSlot), end: axis.finishAt(scheduled.finishBoundary) }] : []
  })
  const rowById = new Map(rows.map(row => [row.taskId, row]))
  const links = rows.flatMap(row => row.scheduled.predecessorTaskIds.flatMap(id => {
    const predecessor = rowById.get(id)
    return predecessor ? [{ key: JSON.stringify([id, row.taskId]), predecessorId: id, successorId: row.taskId,
      from: { x: predecessor.end, row: predecessor.index }, to: { x: row.start, row: row.index } }] : []
  }))
  return { rows, links }
}

export interface TimelineSegment { start: number; end: number; kind: 'working' | 'nonworking' }
/** Clips the engine's elapsed span; working-day fractions use its existing slot boundaries. */
export function taskSegments(axis: TimelineAxis, row: TimelineRow, days: readonly TimelineDay[]): TimelineSegment[] {
  if (axis.mode === 'compressed') return [{ start: row.start, end: row.end, kind: 'working' }]
  return days.flatMap(day => {
    const start = Math.max(row.start, day.start)
    const end = Math.min(row.end, day.end)
    return end > start ? [{ start, end, kind: day.working ? 'working' as const : 'nonworking' as const }] : []
  })
}

export function pixelsPerUnit(axis: TimelineAxis, zoom: TimelineZoom): number {
  if (axis.mode === 'expanded') return zoom === 'hour' ? Math.max(96, Math.min(480, axis.hoursPerDay * 40)) : zoom === 'day' ? 96 : 28
  return zoom === 'hour' ? 40 : (zoom === 'day' ? 96 : 28) / axis.hoursPerDay
}

export const LABEL_WIDTH = 220
export const HEADER_HEIGHT = 72
export const ROW_HEIGHT = 52
export const MAX_SCROLL_WIDTH = 4_000_000

/** A bounded native scroll surface mapped to logical units for very long schedules. */
export function timelineWindow(totalUnits: number, scale: number, viewportWidth: number, scrollLeft: number) {
  const width = Math.max(200, viewportWidth)
  const scrollWidth = Math.max(width, Math.min(MAX_SCROLL_WIDTH, totalUnits * scale))
  const fraction = scrollWidth > width ? Math.max(0, Math.min(1, scrollLeft / (scrollWidth - width))) : 0
  const left = fraction * Math.max(0, totalUnits - width / scale)
  return { scrollWidth, left, right: Math.min(totalUnits, left + width / scale), width, x: (unit: number) => (unit - left) * scale }
}

/** Endpoint geometry stays attached to bar boundaries in either representation. */
export function connectorPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const middleY = (fromY + toY) / 2
  if (toX - fromX >= 24) {
    const middleX = (fromX + toX) / 2
    return `M ${fromX} ${fromY} H ${middleX} V ${toY} H ${toX}`
  }
  return `M ${fromX} ${fromY} H ${fromX + 12} V ${middleY} H ${toX - 12} V ${toY} H ${toX}`
}
