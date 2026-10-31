import { dateToOrdinal, ordinalToDate, SchedulingError, validateCalendar } from './calendar'
import type { CalendarSettings, FinishBoundary, WorkingSlot } from '../types/scheduling'

const MAX_ORDINAL = dateToOrdinal('9999-12-31')

/** Global integer working-slot coordinates. BigInt avoids intermediate precision loss. */
export function createWorkingTimeIndex(settings: CalendarSettings) {
  const errors = validateCalendar(settings)
  if (errors.length) throw new SchedulingError(errors[0])
  const weekdays = new Set<number>(settings.workingWeekdays)
  const dailyHours = settings.workingHoursPerDay
  const hours = BigInt(dailyHours)
  const working = (day: number) => weekdays.has((day + 1) % 7)
  function daysBefore(day: number): number {
    const weeks = Math.floor(day / 7)
    let count = weeks * weekdays.size
    for (let ordinal = weeks * 7; ordinal < day; ordinal++) if (working(ordinal)) count++
    return count
  }
  function startIndex(slot: WorkingSlot): bigint {
    const ordinal = dateToOrdinal(slot.date)
    if (!working(ordinal) || !Number.isSafeInteger(slot.hour) || slot.hour < 1 || slot.hour > dailyHours) {
      throw new SchedulingError({ code: 'INVALID_SLOT', field: 'slot', message: 'Use a selected working date and a valid numbered work hour.' })
    }
    return BigInt(daysBefore(ordinal)) * hours + BigInt(slot.hour - 1)
  }
  function finishIndex(finish: FinishBoundary): bigint {
    return startIndex({ date: finish.date, hour: finish.afterHour }) + 1n
  }
  function slotAt(index: bigint): WorkingSlot {
    const workday = index / hours
    if (index < 0n || workday >= BigInt(daysBefore(MAX_ORDINAL + 1))) {
      throw new SchedulingError({ code: 'DATE_OUT_OF_RANGE', field: 'slot', message: 'Working-slot analysis exceeds the supported calendar date range.' })
    }
    let low = 0
    let high = MAX_ORDINAL
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (BigInt(daysBefore(middle + 1)) > workday) high = middle
      else low = middle + 1
    }
    return { date: ordinalToDate(low), hour: Number(index % hours) + 1 }
  }
  function boundaryAt(index: bigint): FinishBoundary {
    const last = slotAt(index - 1n)
    return { date: last.date, afterHour: last.hour }
  }
  return { startIndex, finishIndex, slotAt, boundaryAt }
}
