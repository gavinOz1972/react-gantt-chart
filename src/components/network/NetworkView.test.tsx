import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { analyzeCriticalPath, calculateSchedule } from '../../domain'
import type { ProjectSettings, TaskInput } from '../../domain'
import { NetworkView } from './NetworkView'
import App from '../../App'

const project: ProjectSettings = { projectId: 'P', name: 'Network', projectStartDate: '2026-11-02', targetEndDate: '2026-12-01', workingWeekdays: [1, 4], workingHoursPerDay: 2 }
const make = (taskId: string, durationHours: number, predecessorTaskIds: string[] = []): TaskInput => ({ taskId, name: taskId, description: '', durationHours, predecessorTaskIds, independentStartMode: 'DEFAULT' })
function Harness({ duration = 1, invalid = false }: { duration?: number; invalid?: boolean }) {
  const tasks = [make('A', invalid ? 0 : duration), make('B', 3), make('C', 1, ['A', 'B'])]
  const result = calculateSchedule(project, tasks)
  const [selected, setSelected] = useState<string | null>(null)
  return <NetworkView tasks={tasks} result={result} analysis={analyzeCriticalPath(project, tasks, result)} selectedTaskId={selected} onSelect={setSelected} />
}

test('network shows every node/join, slack and critical edge emphasis, and keyboard inspection', () => {
  render(<Harness />)
  expect(screen.getAllByRole('button', { name: /^Network task / })).toHaveLength(3)
  expect(screen.getByRole('button', { name: /^Network task A / })).toHaveAttribute('data-critical', 'false')
  const b = screen.getByRole('button', { name: /^Network task B / })
  expect(b).toHaveAttribute('data-critical', 'true')
  expect(screen.getByRole('img', { name: 'Network dependency B to C' })).toHaveAttribute('data-critical', 'true')
  fireEvent.keyDown(b, { key: 'Enter' })
  expect(b).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByLabelText('Selected task details')).toHaveTextContent('0 working hours, measured against calculated completion')
  fireEvent.change(screen.getByLabelText('Network zoom'), { target: { value: '0.5' } })
  expect(b).toHaveAttribute('aria-pressed', 'true')
})

test('live changes replace critical classifications and invalid data hides all stale nodes', () => {
  const { rerender } = render(<Harness />)
  rerender(<Harness duration={5} />)
  expect(screen.getByRole('button', { name: /^Network task A / })).toHaveAttribute('data-critical', 'true')
  expect(screen.getByRole('button', { name: /^Network task B / })).toHaveAttribute('data-critical', 'false')
  rerender(<Harness invalid />)
  expect(screen.queryByRole('button', { name: /^Network task / })).not.toBeInTheDocument()
  expect(screen.getByText(/Network unavailable/)).toBeInTheDocument()
})

test('A09 switching Gantt/network preserves shared task selection and Gantt mode', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
  fireEvent.change(screen.getByLabelText(/^Task name/), { target: { value: 'Research' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }))
  fireEvent.click(screen.getByRole('button', { name: 'Compressed' }))
  fireEvent.click(screen.getByRole('button', { name: /^T1 Research:/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Network / Critical Path' }))
  expect(screen.getByRole('button', { name: /^Network task T1 Research:/ })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Gantt' }))
  expect(screen.getByRole('button', { name: 'Compressed' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: /^T1 Research:/ })).toHaveAttribute('aria-pressed', 'true')
})

test('large independent-root networks window their DOM and can navigate to an offscreen selection', () => {
  const tasks = Array.from({ length: 1000 }, (_, index) => make(`T${index + 1}`, 1))
  const result = calculateSchedule(project, tasks)
  const analysis = analyzeCriticalPath(project, tasks, result)
  const { container } = render(<NetworkView tasks={tasks} result={result} analysis={analysis} selectedTaskId="T999" onSelect={() => {}} />)
  expect(screen.getAllByRole('button', { name: /^Network task / }).length).toBeLessThan(10)
  expect(container.querySelectorAll('*').length).toBeLessThan(300)
  fireEvent.click(screen.getByRole('button', { name: 'Go to selected node' }))
  expect(screen.getByRole('button', { name: /^Network task T999 / })).toBeInTheDocument()
  expect(container.querySelectorAll('*').length).toBeLessThan(300)
})
