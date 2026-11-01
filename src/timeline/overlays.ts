import { dateToOrdinal } from '../domain'
import type { TimelineAxis } from './projection'
import type { TaskForecast } from '../forecast/forecast'
import type { ScheduledTask } from '../domain'

export function comparisonDescription(current: ScheduledTask, baseline?: ScheduledTask, forecast?: TaskForecast, hasBaseline = false) {
  return `Baseline: ${baseline ? `${baseline.startDate} hour ${baseline.startSlot.hour} to ${baseline.finishDate} after hour ${baseline.finishBoundary.afterHour}` : hasBaseline ? 'New since baseline' : 'Not established'}; committed finish ${current.finishDate} after hour ${current.finishBoundary.afterHour}; forecast finish ${forecast?.forecastFinish ?? 'Unavailable'}${forecast ? `. ${forecast.reason}` : '.'}`
}

/** Calendar fractions are visual coordinates, never scheduled work or capacity. */
export function overlayPoint(axis: TimelineAxis, date: string, fraction: number) {
  const ordinal = dateToOrdinal(date)
  if (ordinal < axis.startOrdinal) return { unit: 0, clipping: 'before-range', omitted: false }
  if (ordinal > axis.endOrdinal) return { unit: axis.totalUnits, clipping: 'after-range', omitted: false }
  const omitted = axis.mode === 'compressed' && !axis.isWorkingDay(ordinal)
  return { unit: axis.dayStart(ordinal) + (axis.dayEnd(ordinal) - axis.dayStart(ordinal)) * Math.max(0, Math.min(1, fraction)), clipping: '', omitted }
}
/** WP6.4 finishPosition is exclusive days from As-of; zero effort uses its boundary. */
export function forecastPoint(axis: TimelineAxis, task: TaskForecast) {
  if (!task.forecastFinish) return null
  const position = task.finishPosition
  const fraction = position === null ? 1 : position === 0 ? 0 : Number.isInteger(position) ? 1 : position - Math.floor(position)
  return overlayPoint(axis, task.forecastFinish, fraction)
}
export function clipOverlayPoint(point: ReturnType<typeof overlayPoint>, x: (unit: number) => number, width: number) {
  const raw = x(point.unit)
  const clipping = point.clipping || (raw < 0 ? 'before-view' : raw > width ? 'after-view' : '')
  return { x: clipping ? Math.max(5, Math.min(width - 5, raw)) : raw, clipping, omitted: point.omitted }
}
