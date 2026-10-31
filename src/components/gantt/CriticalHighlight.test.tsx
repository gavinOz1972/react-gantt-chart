import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { analyzeCriticalPath, calculateSchedule } from '../../domain'
import type { ProjectSettings, TaskInput } from '../../domain'
import { GanttChart } from './GanttChart'

const project: ProjectSettings = { projectId: 'P', name: 'Critical', projectStartDate: '2026-11-02', targetEndDate: '2026-12-01', workingWeekdays: [1, 4], workingHoursPerDay: 2 }
const make = (taskId: string, durationHours: number, predecessorTaskIds: string[] = []): TaskInput => ({ taskId, name: taskId, description: '', durationHours, predecessorTaskIds, independentStartMode: 'DEFAULT' })
function Harness({ duration = 1 }: { duration?: number }) {
  const tasks = [make('A', duration), make('B', 3), make('C', 1, ['A', 'B'])]
  const result = calculateSchedule(project, tasks)
  const [highlight, setHighlight] = useState(true)
  const [selected, setSelected] = useState<string | null>('A')
  return <GanttChart project={project} tasks={tasks} result={result} analysis={analyzeCriticalPath(project, tasks, result)} selectedTaskId={selected}
    highlightCritical={highlight} onHighlightChange={setHighlight} onSelect={setSelected} previewing={false} />
}

test('critical highlighting preserves expanded hatching and compressed durations, with slack inspection', () => {
  render(<Harness />)
  const b = () => screen.getByRole('button', { name: /^B B:/ })
  expect(b()).toHaveAttribute('data-critical', 'true')
  expect(screen.getByRole('button', { name: /^A A:/ })).toHaveAttribute('data-critical', 'false')
  expect(b().querySelector('.gantt-bar-outline')?.getAttribute('fill')).toContain('url(#')
  expect(b().querySelector('[data-kind=working]')).toHaveAttribute('fill', '#aa3d32')
  expect(screen.getByText('2 working hours, measured against calculated completion')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Compressed' }))
  expect(b()).toHaveAttribute('data-end', '3')
  expect(b().querySelector('.gantt-bar-outline')).toHaveAttribute('fill', '#aa3d32')
  expect(screen.getByRole('img', { name: 'Dependency B to C' })).toHaveAttribute('data-critical', 'true')
  fireEvent.click(screen.getByRole('checkbox', { name: 'Highlight Critical Path' }))
  expect(b()).toHaveAttribute('data-critical', 'false')
  expect(b().querySelector('.gantt-bar-outline')).toHaveAttribute('fill', '#24779b')
})

test('live duration changes update the critical branch and relationship emphasis', () => {
  const { rerender } = render(<Harness />)
  expect(screen.getByRole('img', { name: 'Dependency B to C' })).toHaveAttribute('data-critical', 'true')
  rerender(<Harness duration={5} />)
  expect(screen.getByRole('button', { name: /^A A:/ })).toHaveAttribute('data-critical', 'true')
  expect(screen.getByRole('img', { name: 'Dependency B to C' })).toHaveAttribute('data-critical', 'false')
  expect(screen.getByRole('img', { name: 'Dependency A to C' })).toHaveAttribute('data-critical', 'true')
})
