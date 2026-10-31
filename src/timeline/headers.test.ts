// @vitest-environment node
import { expect, test } from 'vitest'
import { dateToOrdinal } from '../domain'
import { createTimelineAxis, visibleDays } from './projection'
import { fitWeekLabel, visibleWeeks, weekLabelCandidates } from './headers'

const project = { projectId: 'P', name: 'Weekly spans', projectStartDate: '2026-11-04', targetEndDate: '2027-01-29', workingWeekdays: [1, 4, 5] as const, workingHoursPerDay: 3 }
test('partial and complete compressed weeks use existing working-slot boundaries without mutating the axis', () => {
  const axis = createTimelineAxis(project, [], 'compressed')
  const before = { start: axis.startAt({ date: '2026-11-05', hour: 2 }), finish: axis.finishAt({ date: '2027-01-29', afterHour: 3 }), total: axis.totalUnits }
  const weeks = visibleWeeks(axis, visibleDays(axis, 0, axis.totalUnits))
  expect(weeks.length).toBeGreaterThanOrEqual(12)
  expect(weeks[0]).toMatchObject({ date: '2026-11-02', start: 0, end: 6 })
  expect(weeks[1].end - weeks[1].start).toBe(9)
  for (let index = 1; index < weeks.length; index++) expect(weeks[index].start).toBe(weeks[index - 1].end)
  expect({ start: axis.startAt({ date: '2026-11-05', hour: 2 }), finish: axis.finishAt({ date: '2027-01-29', afterHour: 3 }), total: axis.totalUnits }).toEqual(before)
})
test('a scrolled fragment owns its full projected week, including a one-day working week', () => {
  const axis = createTimelineAxis({ ...project, workingWeekdays: [4] }, [], 'compressed')
  const left = axis.dayStart(dateToOrdinal('2026-12-10')) + 1
  const weeks = visibleWeeks(axis, visibleDays(axis, left, left + 5))
  expect(weeks[0].date).toBe('2026-12-07')
  expect(weeks[0].end - weeks[0].start).toBe(3)
  expect(weeks.every(week => week.end > week.start)).toBe(true)
})
test('expanded spans retain calendar columns and existing full label format', () => {
  const axis = createTimelineAxis(project, [], 'expanded')
  const weeks = visibleWeeks(axis, visibleDays(axis, 0, 21))
  expect(weeks[0].end - weeks[0].start).toBe(5)
  expect(weeks[1].end - weeks[1].start).toBe(7)
  expect(weekLabelCandidates('2026-11-02', false)[0]).toBe('Week of 2026-11-02')
})
test('adaptive labels use measured space, falling back to tooltip-only when none fits', () => {
  const candidates = weekLabelCandidates('2026-11-02', true)
  expect(candidates).toEqual(['Week of Nov 2, 2026', 'Nov 2', '11/2'])
  const widths = [112.4, 31.8, 20.2]
  const measure = (label: string) => widths[candidates.indexOf(label)]
  expect(fitWeekLabel(candidates, 113, measure)).toBe(candidates[0])
  expect(fitWeekLabel(candidates, 40, measure)).toBe(candidates[1])
  expect(fitWeekLabel(candidates, 21, measure)).toBe(candidates[2])
  expect(fitWeekLabel(candidates, 20, measure)).toBe('')
})
