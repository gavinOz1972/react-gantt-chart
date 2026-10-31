import { ordinalToDate } from '../domain'
import type { TimelineAxis, TimelineDay } from './projection'

/** Week spans use the existing axis; labels never allocate or resize columns. */
export function visibleWeeks(axis: TimelineAxis, days: readonly TimelineDay[]) {
  const mondays = new Set(days.map(day => Math.max(0, day.ordinal - ((day.ordinal + 1) % 7 + 6) % 7)))
  return [...mondays].map(monday => ({ monday, date: ordinalToDate(monday),
    start: axis.dayStart(Math.max(axis.startOrdinal, monday)), end: axis.dayEnd(Math.min(axis.endOrdinal, monday + 6)),
  })).filter(week => week.end > week.start)
}

export function weekLabelCandidates(date: string, compressed: boolean) {
  const [year, month, day] = date.split('-').map(Number)
  const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]
  return [compressed ? `Week of ${monthName} ${day}, ${year}` : `Week of ${date}`, `${monthName} ${day}`, `${month}/${day}`]
}

/** The browser supplies measured SVG text widths, rather than fixed breakpoints. */
export function fitWeekLabel(candidates: readonly string[], available: number, measure: (text: string) => number) {
  return candidates.find(text => measure(text) <= Math.max(0, available)) ?? ''
}
