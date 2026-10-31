// @vitest-environment node
import { expect, test } from 'vitest'
import { createWorkingCalendar, createWorkingTimeIndex } from '../index'
import type { Weekday } from '../index'

test('working indices and inverse boundaries agree with WP1 slot advancement across calendars and rollovers', () => {
  for (const days of [[0], [1, 4], [0, 1, 2, 3, 4, 5, 6]] as Weekday[][]) {
    for (const hours of [1, 3, 8]) {
      const settings = { workingWeekdays: days, workingHoursPerDay: hours }
      const calendar = createWorkingCalendar(settings)
      const time = createWorkingTimeIndex(settings)
      for (const date of ['0099-12-28', '1900-02-27', '2000-02-27', '2026-03-07', '2026-10-31', '2026-12-31']) {
        for (const hour of [1, hours]) {
          const start = { date: calendar.nextWorkingDate(date), hour }
          expect(time.slotAt(time.startIndex(start))).toEqual(start)
          for (const duration of [1, 3, 17, 2000]) {
            const finish = calendar.advanceWorkingSlots(start, duration)
            expect(time.finishIndex(finish) - time.startIndex(start)).toBe(BigInt(duration))
            expect(time.boundaryAt(time.startIndex(start) + BigInt(duration))).toEqual(finish)
          }
        }
      }
    }
  }
})

test('calendar endpoints, invalid slots and copied settings retain explicit semantics', () => {
  const settings = { workingWeekdays: [0, 1, 2, 3, 4, 5, 6] as Weekday[], workingHoursPerDay: 2 }
  const time = createWorkingTimeIndex(settings)
  expect(time.slotAt(0n)).toEqual({ date: '0001-01-01', hour: 1 })
  const end = { date: '9999-12-31', afterHour: 2 }
  expect(time.boundaryAt(time.finishIndex(end))).toEqual(end)
  expect(() => time.slotAt(-1n)).toThrow()
  expect(() => time.slotAt(time.finishIndex(end))).toThrow()
  expect(() => time.startIndex({ date: '2026-11-02', hour: 0 })).toThrow()
  settings.workingHoursPerDay = 1
  settings.workingWeekdays.length = 0
  expect(time.slotAt(1n)).toEqual({ date: '0001-01-01', hour: 2 })
})
