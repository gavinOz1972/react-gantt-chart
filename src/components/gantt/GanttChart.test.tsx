import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { calculateSchedule } from '../../domain'
import type { ProjectSettings, ScheduleResult, TaskInput } from '../../domain'
import { GanttChart } from './GanttChart'
import App from '../../App'

const project: ProjectSettings = { projectId: 'P1', name: 'Chart example', projectStartDate: '2026-11-02', targetEndDate: '2026-11-09', workingWeekdays: [1, 4], workingHoursPerDay: 2 }
const task = (taskId: string, durationHours = 3, predecessorTaskIds: string[] = []): TaskInput => ({ taskId, name: taskId, description: '', durationHours, predecessorTaskIds, independentStartMode: 'DEFAULT' })
const initialTasks = [task('T1'), task('T2', 1, ['T1']), task('T3')]
function Harness({ tasks = initialTasks, settings = project, result = calculateSchedule(settings, tasks) }: { tasks?: TaskInput[]; settings?: ProjectSettings; result?: ScheduleResult }) {
  const [selected, setSelected] = useState<string | null>(null)
  return <GanttChart project={settings} tasks={tasks} result={result} selectedTaskId={selected} onSelect={setSelected} previewing={false} />
}
const bar = (id: string) => screen.getByRole('button', { name: new RegExp(`^${id} ${id}:`) })

test('A01/A02 expanded hatch span and working segments switch to an exact three-slot solid bar', () => {
  render(<Harness />)
  expect(screen.getByRole('button', { name: 'Expanded' })).toHaveAttribute('aria-pressed', 'true')
  expect(bar('T1')).toHaveAttribute('data-end', '3.5')
  expect(bar('T1').querySelector('.gantt-bar-outline')).toHaveAttribute('width', '336')
  expect(bar('T1').querySelectorAll('[data-kind=working]')).toHaveLength(2)
  expect(bar('T1').querySelector('.gantt-bar-outline')?.getAttribute('fill')).toContain('url(#')
  fireEvent.click(screen.getByRole('button', { name: 'Compressed' }))
  expect(bar('T1')).toHaveAttribute('data-end', '3')
  expect(bar('T1').querySelector('.gantt-bar-outline')).toHaveAttribute('width', '120')
  expect(bar('T1').querySelector('.gantt-bar-outline')).toHaveAttribute('fill', '#24779b')
  expect(screen.getByText(/Date jumps in the header/)).toBeInTheDocument()
})

test('A04/A06/A07 updated results redraw connectors immediately and remove only the unchecked link', () => {
  const { rerender } = render(<Harness tasks={[task('T1', 1), task('T2', 3), task('T3', 1, ['T1', 'T2'])]} />)
  expect(screen.getAllByRole('img', { name: /^Dependency/ })).toHaveLength(2)
  const before = screen.getByRole('img', { name: 'Dependency T1 to T3' }).getAttribute('d')
  rerender(<Harness tasks={[task('T1', 5), task('T2', 3), task('T3', 1, ['T1', 'T2'])]} />)
  expect(screen.getByRole('img', { name: 'Dependency T1 to T3' }).getAttribute('d')).not.toBe(before)
  rerender(<Harness tasks={[task('T1', 5), task('T2', 3), task('T3', 1, ['T1'])]} />)
  expect(screen.queryByRole('img', { name: 'Dependency T2 to T3' })).not.toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Dependency T1 to T3' })).toBeInTheDocument()
})

test('A09 keyboard selection and details persist through mode and scale changes', () => {
  render(<Harness />)
  fireEvent.keyDown(bar('T1'), { key: 'Enter' })
  expect(bar('T1')).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText('3 working hours total')).toBeInTheDocument()
  const dates = screen.getByLabelText('Selected task details').textContent
  for (const mode of ['Compressed', 'Expanded', 'Compressed']) {
    fireEvent.click(screen.getByRole('button', { name: mode }))
    expect(bar('T1')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Selected task details').textContent).toBe(dates)
  }
  fireEvent.change(screen.getByLabelText('Scale'), { target: { value: 'week' } })
  expect(bar('T1')).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByLabelText('Selected task details').textContent).toBe(dates)
  const link = screen.getByRole('img', { name: 'Dependency T1 to T2' })
  fireEvent.focus(link)
  expect(screen.getByRole('status')).toHaveTextContent('Dependency T1 to T2')
})

test('A10 long projects render bounded visible rows and dates, and preserve scrolling alignment', () => {
  const tasks = Array.from({ length: 1000 }, (_, index) => task(`T${index + 1}`, 1))
  const { container } = render(<Harness tasks={tasks} settings={{ ...project, targetEndDate: '2099-12-31' }} />)
  expect(screen.getAllByRole('button', { name: /^Inspect T/ }).length).toBeLessThan(15)
  expect(container.querySelectorAll('*').length).toBeLessThan(1200)
  const region = screen.getByRole('region', { name: 'Scrollable Gantt timeline' })
  fireEvent.scroll(region, { target: { scrollTop: 5200, scrollLeft: 6000 } })
  expect(screen.queryByRole('button', { name: 'Inspect T1 T1' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Inspect T101 T101' })).toBeInTheDocument()
  expect(container.querySelectorAll('*').length).toBeLessThan(1500)
})

test('A11 empty and invalid results remove all stale bars and connectors', () => {
  const { rerender } = render(<Harness />)
  expect(bar('T1')).toBeInTheDocument()
  rerender(<Harness result={{ ok: false, errors: [{ code: 'INVALID_DURATION', field: 'durationHours', message: 'Invalid hours' }] }} />)
  expect(screen.getByText(/Timeline unavailable/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^T1 T1:/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('img', { name: /^Dependency/ })).not.toBeInTheDocument()
  rerender(<Harness tasks={[]} />)
  expect(screen.getByText(/No tasks to plot yet/)).toBeInTheDocument()
})

test('table and bar selection are linked without replacing the WP2 editor', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
  fireEvent.change(screen.getByLabelText(/^Task name/), { target: { value: 'Research' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }))
  fireEvent.click(screen.getByRole('button', { name: /^T1 Research:/ }))
  expect(screen.getByRole('row', { name: 'T1 Research' })).toHaveAttribute('aria-selected', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Select T1 in chart' }))
  expect(screen.getByRole('button', { name: /^T1 Research:/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.queryByLabelText(/^Task name/)).not.toBeInTheDocument()
})
