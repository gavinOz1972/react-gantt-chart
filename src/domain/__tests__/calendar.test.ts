// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { createWorkingCalendar, dateToOrdinal, ordinalToDate, SchedulingError, validateCalendar } from '../calendar'
import type { Weekday } from '../../types/scheduling'

describe('date-only arithmetic', () => {
  test.each(['0001-01-01', '0099-12-31', '0100-03-01', '1900-03-01', '2000-02-29', '2026-03-08', '2026-11-01', '9999-12-31'])('round trips %s without a locale or time zone', date => {
    expect(ordinalToDate(dateToOrdinal(date))).toBe(date)
  })
  test.each(['2026-02-29', '1900-02-29', '0000-01-01', '10000-01-01', '2026-13-01', '2026-04-31', '2026-01-00', '30/10/2026', '2026-1-01', '2026-10-30T00:00:00Z', ''])('rejects %s explicitly', date => {
    expect(() => dateToOrdinal(date)).toThrow(SchedulingError)
  })
  test('leap, century and year transitions', () => {
    expect(ordinalToDate(dateToOrdinal('2000-02-28') + 1)).toBe('2000-02-29')
    expect(ordinalToDate(dateToOrdinal('1900-02-28') + 1)).toBe('1900-03-01')
    expect(ordinalToDate(dateToOrdinal('2026-12-31') + 1)).toBe('2027-01-01')
    expect(() => ordinalToDate(-1)).toThrow(SchedulingError)
    expect(() => ordinalToDate(dateToOrdinal('9999-12-31') + 1)).toThrow(SchedulingError)
  })
})

describe('working calendar', () => {
  const calendar = createWorkingCalendar({ workingWeekdays: [1, 4], workingHoursPerDay: 2 })
  test('rolls over selected weekdays and returns an exclusive boundary', () => {
    expect(calendar.advanceWorkingSlots({ date: '2026-11-02', hour: 1 }, 3)).toEqual({ date: '2026-11-05', afterHour: 1 })
    expect(calendar.slotAfter({ date: '2026-11-05', afterHour: 1 })).toEqual({ date: '2026-11-05', hour: 2 })
    expect(calendar.slotAfter({ date: '2026-11-05', afterHour: 2 })).toEqual({ date: '2026-11-09', hour: 1 })
    expect(calendar.nextWorkingDate('2026-11-03')).toBe('2026-11-05')
    expect(calendar.nextWorkingDate('2026-11-02')).toBe('2026-11-02')
  })
  test('handles DST weekends using date-only steps', () => {
    const daily = createWorkingCalendar({ workingWeekdays: [0, 1, 2, 3, 4, 5, 6], workingHoursPerDay: 1 })
    expect(daily.advanceWorkingSlots({ date: '2026-03-07', hour: 1 }, 3)).toEqual({ date: '2026-03-09', afterHour: 1 })
    expect(daily.advanceWorkingSlots({ date: '2026-10-31', hour: 1 }, 3)).toEqual({ date: '2026-11-02', afterHour: 1 })
  })
  test.each([[], [1, 1], [-1], [7], [1.5]].map(days => ({ days })))('rejects invalid weekday selection $days', ({ days }) => {
    expect(validateCalendar({ workingWeekdays: days as Weekday[], workingHoursPerDay: 2 })[0].field).toBe('workingWeekdays')
  })
  test.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid daily hours %s', hours => {
    expect(() => createWorkingCalendar({ workingWeekdays: [1], workingHoursPerDay: hours })).toThrow(SchedulingError)
  })
  test('validates helper inputs and keeps copied calendar settings', () => {
    const days: Weekday[] = [1]
    const copied = createWorkingCalendar({ workingWeekdays: days, workingHoursPerDay: 2 })
    days.push(2)
    expect(copied.nextWorkingDate('2026-11-03')).toBe('2026-11-09')
    expect(() => calendar.advanceWorkingSlots({ date: '2026-11-03', hour: 1 }, 1)).toThrow(SchedulingError)
    expect(() => calendar.advanceWorkingSlots({ date: '2026-11-02', hour: 3 }, 1)).toThrow(SchedulingError)
    expect(() => calendar.advanceWorkingSlots({ date: '2026-11-02', hour: 1 }, 0)).toThrow(SchedulingError)
    expect(() => calendar.slotAfter({ date: '2026-11-02', afterHour: 0 })).toThrow(SchedulingError)
  })
  test('optimized advancement agrees with a UTC slot-by-slot oracle across calendar combinations', () => {
    // The oracle is deliberately separate from production ordinal/week-jump arithmetic.
    for (const days of [[1], [0, 6], [1, 4], [1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5, 6]] as Weekday[][]) {
      for (const hours of [1, 2, 8]) {
        const tested = createWorkingCalendar({ workingWeekdays: days, workingHoursPerDay: hours })
        const date = new Date('2026-10-29T00:00:00Z')
        while (!days.includes(date.getUTCDay() as Weekday)) date.setUTCDate(date.getUTCDate() + 1)
        const startDate = date.toISOString().slice(0, 10)
        for (const startHour of [1, hours]) {
          for (const duration of [1, 2, 3, 17, 200, 1000]) {
            const cursor = new Date(date)
            let hour = startHour
            for (let occupied = 1; occupied < duration; occupied++) {
              if (++hour > hours) {
                hour = 1
                do { cursor.setUTCDate(cursor.getUTCDate() + 1) } while (!days.includes(cursor.getUTCDay() as Weekday))
              }
            }
            expect(tested.advanceWorkingSlots({ date: startDate, hour: startHour }, duration)).toEqual({ date: cursor.toISOString().slice(0, 10), afterHour: hour })
          }
        }
      }
    }
  })
})
