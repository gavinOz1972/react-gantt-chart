import { fireEvent, render } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { calculateSchedule } from '../../domain'
import { calculateProgressImpact } from '../../projection/progressImpact'
import { historyFile } from '../../test/historyFixture'
import { createTimelineAxis } from '../../timeline/projection'
import { historicalDates } from '../../timeline/historyPresentation'
import { ActualImpactOverlays } from './ActualImpactOverlays'

function setup(options: { date?: string; reference?: string; asOf?: string; mode?: 'compressed' | 'expanded'; offset?: number } = {}) {
  const date = options.date ?? '2026-11-07', reference = options.reference ?? '2026-11-06', asOf = options.asOf ?? date, mode = options.mode ?? 'compressed'
  const original = historyFile('weekend')
  const file = { ...original, taskProgress: { ...original.taskProgress!, events: original.taskProgress!.events.map(e => ({ ...e, date, committedFinishDateAtCompletion: reference || undefined })) } }
  const source = JSON.stringify(file), onSelect = vi.fn()
  const impact = calculateProgressImpact({ project: file.project, tasks: file.tasks, progress: file.taskProgress, asOf })
  const schedule = calculateSchedule(file.project, file.tasks)
  if (!impact.ok || !schedule.ok) throw new Error('Expected valid fixture')
  const axis = createTimelineAxis(file.project, schedule.tasks, mode, historicalDates(file.project, impact))
  const result = render(<svg><ActualImpactOverlays item={impact.tasks[0]} asOf={asOf} axis={axis} x={u => u * 4 + (options.offset ?? 0)} width={200} y={0} days={[]} gapPatternId="test-gap" onSelect={onSelect} /></svg>)
  expect(JSON.stringify(file)).toBe(source)
  return { ...result, onSelect }
}
test('collapsed weekend history is one keyboard target with the exact date and calendar-day meaning', () => {
  const { container, onSelect } = setup()
  const actual = container.querySelector('.collapsed-actual-marker')!
  expect(actual).toHaveAccessibleName(/Sat, Nov 7, 2026.*\+1 calendar day late.*not continuous work, actual effort/)
  expect(actual).toHaveAttribute('data-collapsed', 'true')
  expect(container.querySelectorAll('.historical-overrun')).toHaveLength(1)
  expect(actual.querySelectorAll('text')).toHaveLength(2)
  fireEvent.keyDown(actual, { key: 'Enter' }); fireEvent.keyDown(actual, { key: ' ' })
  expect(onSelect.mock.calls).toEqual([['T1'], ['T1']])
})
test('another omitted date preserves Sunday and two elapsed days, rather than the shared Monday boundary date', () => {
  const { container } = setup({ date: '2026-11-08' })
  expect(container.querySelector('.collapsed-actual-date')).toHaveTextContent('Actual Sun, Nov 8, 2026')
  expect(container.querySelector('.collapsed-actual-comparison')).toHaveTextContent('+2 calendar days late')
})
test('an omitted actual without the historical reference does not fabricate lateness', () => {
  const { container } = setup({ reference: '' })
  expect(container.querySelector('.collapsed-actual-date')).toHaveTextContent('Sat, Nov 7, 2026')
  expect(container.querySelector('.collapsed-actual-comparison')).toHaveTextContent('Comparison unavailable')
  expect(container.querySelector('.historical-overrun')).toBeNull()
})
test('future-effective omitted actual remains visibly qualified', () => {
  const { container } = setup({ asOf: '2026-11-06' })
  expect(container.querySelector('.collapsed-actual-date')).toHaveTextContent('Future A Sat, Nov 7, 2026')
  expect(container.querySelector('.actual-date-marker')).toHaveAttribute('data-future', 'true')
})
test('Expanded weekend retains the original whole-date bracket and separate overrun', () => {
  const { container } = setup({ mode: 'expanded' })
  expect(container.querySelector('.collapsed-actual-marker')).toBeNull()
  expect(container.querySelector('.actual-date-marker text')).toHaveTextContent('Actual')
  expect(container.querySelectorAll('.historical-overrun')).toHaveLength(1)
})
test('offscreen omitted dates qualify the correct viewport edge without moving the recorded date', () => {
  const left = setup({ offset: -200 })
  expect(left.container.querySelector('.collapsed-actual-date')).toHaveTextContent('< Actual Sat, Nov 7, 2026')
  left.unmount()
  const right = setup({ offset: 200 })
  expect(right.container.querySelector('.collapsed-actual-date')).toHaveTextContent('> Actual Sat, Nov 7, 2026')
  expect(right.container.querySelector('.actual-date-marker')).toHaveAttribute('data-actual-date', '2026-11-07')
})
