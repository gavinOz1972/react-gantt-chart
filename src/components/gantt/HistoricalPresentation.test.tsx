import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { calculateSchedule } from '../../domain'
import { calculateProgressImpact } from '../../projection/progressImpact'
import { historyAsOf, historyFile } from '../../test/historyFixture'
import type { HistoryCase } from '../../test/historyFixture'
import { GanttChart } from './GanttChart'
import { ImpactSummary } from './ImpactSummary'
import { emptyProgress } from '../../progress/taskProgress'

function setup(kind: HistoryCase) {
  const file = historyFile(kind), onSelect = vi.fn(), source = JSON.stringify(file)
  const impact = calculateProgressImpact({ project: file.project, tasks: file.tasks, progress: file.taskProgress!, asOf: historyAsOf(kind) })
  const rendered = render(<GanttChart project={file.project} tasks={file.tasks} result={calculateSchedule(file.project, file.tasks)} selectedTaskId={null} onSelect={onSelect} previewing={false} impact={impact} paAsOf={historyAsOf(kind)} baseline={file.baseline} />)
  expect(JSON.stringify(file)).toBe(source)
  return { ...rendered, onSelect }
}
test('actual overrun and conditional PA are primary; current commitments are subordinate references', () => {
  const { container, onSelect } = setup('late')
  const a = container.querySelector('.gantt-bar[data-task-id="T1"]')!
  expect(a).toHaveAttribute('data-presentation', 'committed-reference')
  expect(a.querySelector('.gantt-bar-outline')).toHaveAttribute('height', '6')
  expect(container.querySelector('.historical-overrun')).toHaveAttribute('data-calendar-days', '4')
  expect(container.querySelector('.actual-date-marker')).toHaveAttribute('data-actual-date', '2026-11-06')
  fireEvent.keyDown(container.querySelector('.historical-overrun')!, { key: 'Enter' })
  expect(onSelect).toHaveBeenCalledWith('T1')
})
test('equal PA and commitment produce one labelled primary interval', () => {
  const { container } = setup('on-time')
  expect(container.querySelector('.gantt-bar[data-task-id="T2"]')).toHaveAttribute('data-presentation', 'pa-equals-commitment')
  expect(container.querySelector('.pa-outline[data-task-id="T2"]')).toBeNull()
  expect(container.querySelector('.historical-overrun')).toBeNull()
})
test('missing historical comparison is visible without a fabricated red extension', () => {
  const { container } = setup('missing-reference')
  expect(container.querySelector('.history-row-caption')).toHaveTextContent('Historical comparison unavailable')
  expect(container.querySelector('.historical-overrun')).toBeNull()
})
test('future-effective completion has no precise dependent interval or shifted connector', () => {
  const { container } = setup('future')
  expect(container.querySelector('.pa-unknown[data-task-id="T2"]')).not.toBeNull()
  expect(container.querySelector('.pa-primary')).toBeNull()
  expect(container.querySelector('.pa-dependency')).toBeNull()
  expect(container.querySelector('.uncertain-dependency')).toHaveAttribute('data-successor', 'T2')
  expect(container.querySelector('.actual-date-marker')).toHaveAttribute('data-future', 'true')
})
test('closed impact details keep large views bounded; every entry remains reachable on demand', async () => {
  const file = historyFile('late')
  const tasks = Array.from({ length: 120 }, (_, i) => ({ ...file.tasks[0], taskId: `T${i + 1}`, predecessorTaskIds: [] }))
  const impact = calculateProgressImpact({ project: file.project, tasks, progress: emptyProgress(), asOf: '2026-11-06' })
  const { container } = render(<ImpactSummary impact={impact} asOf="2026-11-06" />)
  expect(container.querySelectorAll('li')).toHaveLength(0)
  fireEvent.click(screen.getByText('Impact details (120 tasks)'))
  await waitFor(() => expect(container.querySelectorAll('li')).toHaveLength(50))
  fireEvent.click(screen.getByRole('button', { name: /Show 50 more impact details/ }))
  expect(container.querySelectorAll('li')).toHaveLength(100)
  fireEvent.click(screen.getByRole('button', { name: /Show 50 more impact details/ }))
  expect(container.querySelectorAll('li')).toHaveLength(120)
})
