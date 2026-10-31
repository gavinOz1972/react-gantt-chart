import type { CalendarSettings, FinishBoundary, ScheduleError, WorkingSlot } from '../types/scheduling'

/** Calendar helpers throw this error; calculateSchedule converts it to an error result. */
export class SchedulingError extends Error {
  readonly detail: ScheduleError
  constructor(detail: ScheduleError) {
    super(detail.message)
    this.name = 'SchedulingError'
    this.detail = detail
  }
}

function fail(code: ScheduleError['code'], field: string, message: string): never {
  throw new SchedulingError({ code, field, message })
}

const leap = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
const monthLengths = (year: number) => [31, leap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const daysBeforeYear = (year: number) => {
  const previous = year - 1
  return 365 * previous + Math.floor(previous / 4) - Math.floor(previous / 100) + Math.floor(previous / 400)
}
const MAX_ORDINAL = daysBeforeYear(10000) - 1

/** Zero-based days from 0001-01-01. No Date, locale, clock, or time-zone APIs. */
export function dateToOrdinal(date: string, field = 'date'): number {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return fail('INVALID_DATE', field, `${field} must be a calendar date in YYYY-MM-DD format.`)
  }
  const [year, month, day] = date.split('-').map(Number)
  const lengths = monthLengths(year)
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > lengths[month - 1]) {
    return fail('INVALID_DATE', field, `${field} is not a valid Gregorian calendar date: ${date}.`)
  }
  return daysBeforeYear(year) + lengths.slice(0, month - 1).reduce((a, b) => a + b, 0) + day - 1
}

export function ordinalToDate(ordinal: number): string {
  if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal > MAX_ORDINAL) {
    return fail('DATE_OUT_OF_RANGE', 'date', 'The schedule exceeds the supported date range 0001-01-01 through 9999-12-31.')
  }
  let low = 1
  let high = 10000
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2)
    if (daysBeforeYear(middle) <= ordinal) low = middle
    else high = middle
  }
  let day = ordinal - daysBeforeYear(low)
  let month = 0
  const lengths = monthLengths(low)
  while (day >= lengths[month]) day -= lengths[month++]
  return `${String(low).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}`
}

export function validateCalendar(settings: CalendarSettings): ScheduleError[] {
  const errors: ScheduleError[] = []
  const days = settings.workingWeekdays
  if (!Array.isArray(days) || days.length === 0 || days.some(day => !Number.isInteger(day) || day < 0 || day > 6) || new Set(days).size !== days.length) {
    errors.push({ code: 'INVALID_CALENDAR', field: 'workingWeekdays', message: 'Select at least one unique weekday, using integers 0 (Sunday) through 6 (Saturday).' })
  }
  if (!Number.isSafeInteger(settings.workingHoursPerDay) || settings.workingHoursPerDay <= 0) {
    errors.push({ code: 'INVALID_CALENDAR', field: 'workingHoursPerDay', message: 'workingHoursPerDay must be a positive safe whole number of hours.' })
  }
  return errors
}

/** Copies settings; methods cannot observe later edits to the source calendar. */
export function createWorkingCalendar(settings: CalendarSettings) {
  const errors = validateCalendar(settings)
  if (errors.length) throw new SchedulingError(errors[0])
  const days = new Set<number>(settings.workingWeekdays)
  const hours = settings.workingHoursPerDay
  const isWorking = (ordinal: number) => days.has((ordinal + 1) % 7)

  function nextOrdinal(ordinal: number): number {
    while (ordinal <= MAX_ORDINAL && !isWorking(ordinal)) ordinal++
    ordinalToDate(ordinal) // Check range even if a working day was found.
    return ordinal
  }

  function checkSlot(date: string, hour: number): number {
    const ordinal = dateToOrdinal(date)
    if (!isWorking(ordinal) || !Number.isSafeInteger(hour) || hour < 1 || hour > hours) {
      return fail('INVALID_SLOT', 'slot', 'The slot must be on a selected weekday and within the numbered daily working hours.')
    }
    return ordinal
  }

  function nextWorkingDate(date: string): string {
    return ordinalToDate(nextOrdinal(dateToOrdinal(date)))
  }

  function firstSlotOnOrAfter(date: string): WorkingSlot {
    return { date: nextWorkingDate(date), hour: 1 }
  }

  function advanceWorkingSlots(start: WorkingSlot, durationHours: number): FinishBoundary {
    let ordinal = checkSlot(start.date, start.hour)
    if (!Number.isSafeInteger(durationHours) || durationHours <= 0) {
      return fail('INVALID_DURATION', 'durationHours', 'durationHours must be a positive safe whole number of hours.')
    }
    // BigInt prevents rounding when individually valid safe-integer inputs are added.
    const last = BigInt(start.hour - 1) + BigInt(durationHours - 1)
    const dayCount = last / BigInt(hours)
    if (dayCount > BigInt(MAX_ORDINAL)) return fail('DATE_OUT_OF_RANGE', 'durationHours', 'The duration extends beyond year 9999.')
    let workingDays = Number(dayCount)
    // Jump whole working weeks, then inspect at most six dates.
    ordinal += Math.floor(workingDays / days.size) * 7
    workingDays %= days.size
    while (workingDays > 0) {
      ordinal++
      if (isWorking(ordinal)) workingDays--
    }
    return { date: ordinalToDate(ordinal), afterHour: Number(last % BigInt(hours)) + 1 }
  }

  function slotAfter(finish: FinishBoundary): WorkingSlot {
    const ordinal = checkSlot(finish.date, finish.afterHour)
    if (finish.afterHour < hours) return { date: finish.date, hour: finish.afterHour + 1 }
    return { date: ordinalToDate(nextOrdinal(ordinal + 1)), hour: 1 }
  }

  return { nextWorkingDate, firstSlotOnOrAfter, advanceWorkingSlots, slotAfter }
}
