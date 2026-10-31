import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { calculateSchedule } from '../domain'
import type { TaskInput } from '../domain'
import { DependencyPicker } from './DependencyPicker'
import { dependencyError, initialProject, replaceTask } from './projectEntry'

const source: TaskInput[] = [
  { taskId: 'T1', name: 'Research', description: '', durationHours: 5, predecessorTaskIds: [], independentStartMode: 'DEFAULT' },
  { taskId: 'T2', name: 'Implementation', description: '', durationHours: 1, predecessorTaskIds: [], independentStartMode: 'DEFAULT' },
  { taskId: 'T3', name: 'Testing', description: '', durationHours: 1, predecessorTaskIds: ['T2'], independentStartMode: 'DEFAULT' },
]
function Harness({ committed = vi.fn(), deleted = vi.fn(), submitted = vi.fn() }) {
  const [tasks, setTasks] = useState(source)
  const [pending, setPending] = useState(false)
  const task = tasks[1]
  const result = calculateSchedule(initialProject, tasks)
  return <><h1>Workspace</h1><form onSubmit={event => { event.preventDefault(); submitted() }}>
    <input aria-label="Unrelated input" />
    <DependencyPicker taskId={task.taskId} tasks={tasks} selected={task.predecessorTaskIds} onDraftChange={setPending}
      optionError={ids => dependencyError(initialProject, tasks, task, ids)?.message} onCommit={ids => {
        committed(ids)
        const next = replaceTask(tasks, { ...task, predecessorTaskIds: ids })
        const checked = calculateSchedule(initialProject, next)
        if (!checked.ok) return checked.errors.map(error => error.message).join(' ')
        setTasks(next)
      }} />
    <button type="submit">Submit form</button></form>
    <button type="button" onClick={deleted}>Delete another task</button>
    <output aria-label="Committed sources">{JSON.stringify(tasks)}</output>
    <output aria-label="Schedule">{JSON.stringify(result)}</output>
    <output aria-label="Pending selection">{String(pending)}</output>
  </>
}
const open = () => fireEvent.click(screen.getByRole('button', { name: 'T2 predecessors' }))
const choice = (id: string) => screen.getByRole('checkbox', { name: new RegExp(`^T2 predecessor ${id} `) })
const panel = () => screen.queryByRole('group', { name: 'T2 predecessor selection' })
const choose = (id: string) => fireEvent.click(choice(id))

test('Done commits a multi-checkbox draft exactly once; closing/reopening copies the committed set', () => {
  const committed = vi.fn(); render(<Harness committed={committed} />)
  const before = screen.getByLabelText('Schedule').textContent
  open(); choose('T1'); choose('T1'); choose('T1')
  expect(screen.getByLabelText('Schedule')).toHaveTextContent(before!)
  expect(committed).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
  expect(panel()).not.toBeInTheDocument(); expect(committed).toHaveBeenCalledExactlyOnceWith(['T1'])
  expect(screen.getByLabelText('Schedule').textContent).not.toBe(before)
  expect(screen.getByRole('button', { name: 'T2 predecessors' })).toHaveFocus()
  open(); expect(choice('T1')).toBeChecked()
})

test.each(['Enter', 'Escape', 'Cancel'])('%s finishes only the picker, restores focus and respects commit/cancel semantics', action => {
  const committed = vi.fn(), submitted = vi.fn(); render(<Harness committed={committed} submitted={submitted} />)
  const before = screen.getByLabelText('Schedule').textContent
  open(); choose('T1')
  if (action === 'Cancel') fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  else fireEvent.keyDown(choice('T1'), { key: action })
  expect(panel()).not.toBeInTheDocument(); expect(submitted).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'T2 predecessors' })).toHaveFocus()
  if (action === 'Enter') expect(committed).toHaveBeenCalledExactlyOnceWith(['T1'])
  else { expect(committed).not.toHaveBeenCalled(); expect(screen.getByLabelText('Schedule')).toHaveTextContent(before!) }
  expect(screen.getByLabelText('Pending selection')).toHaveTextContent('false')
})

test('outside pointer commits before closing the portal and consumes the subsequent destructive click', () => {
  const committed = vi.fn(), deleted = vi.fn(); render(<Harness committed={committed} deleted={deleted} />)
  open(); choose('T1')
  const button = screen.getByRole('button', { name: 'Delete another task' })
  fireEvent.pointerDown(button); fireEvent.pointerUp(button); fireEvent.click(button, { detail: 1 })
  expect(panel()).not.toBeInTheDocument(); expect(committed).toHaveBeenCalledExactlyOnceWith(['T1'])
  expect(deleted).not.toHaveBeenCalled()
  fireEvent.click(button); expect(deleted).toHaveBeenCalledOnce()
})

test('outside assistive click without pointerdown commits once and does not activate the other control', () => {
  const committed = vi.fn(), deleted = vi.fn(); render(<Harness committed={committed} deleted={deleted} />)
  open(); choose('T1'); fireEvent.click(screen.getByRole('button', { name: 'Delete another task' }))
  expect(committed).toHaveBeenCalledExactlyOnceWith(['T1']); expect(deleted).not.toHaveBeenCalled()
  expect(panel()).not.toBeInTheDocument()
})

test('outside harmless click and focus exit finish a draft without submitting unrelated controls', () => {
  const committed = vi.fn(), submitted = vi.fn(); render(<Harness committed={committed} submitted={submitted} />)
  open(); choose('T1'); fireEvent.click(screen.getByRole('heading', { name: 'Workspace' }))
  expect(committed).toHaveBeenCalledExactlyOnceWith(['T1'])
  open(); choose('T1'); fireEvent.focusIn(screen.getByLabelText('Unrelated input'))
  expect(panel()).not.toBeInTheDocument(); expect(committed).toHaveBeenCalledTimes(2)
  fireEvent.keyDown(screen.getByLabelText('Unrelated input'), { key: 'Enter' })
  fireEvent.submit(screen.getByRole('button', { name: 'Submit form' }).closest('form')!)
  expect(submitted).toHaveBeenCalledOnce()
})

test('cyclic draft rejects atomically, stays open through outside attempts, and can be corrected before Done', () => {
  const deleted = vi.fn(); render(<Harness deleted={deleted} />)
  const before = screen.getByLabelText('Schedule').textContent
  open(); expect(choice('T2')).toBeDisabled(); choose('T1'); choose('T3')
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
  expect(screen.getByRole('alert')).toHaveTextContent(/cycle/i); expect(panel()).toBeInTheDocument()
  expect(screen.getByLabelText('Schedule')).toHaveTextContent(before!)
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Delete another task' })); fireEvent.click(screen.getByRole('button', { name: 'Delete another task' }), { detail: 1 })
  expect(deleted).not.toHaveBeenCalled(); expect(panel()).toBeInTheDocument()
  choose('T3'); fireEvent.click(screen.getByRole('button', { name: 'Done' }))
  expect(panel()).not.toBeInTheDocument(); expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Schedule').textContent).not.toBe(before)
})

test('opening and finishing without changes does not commit or change pending state', () => {
  const committed = vi.fn(); render(<Harness committed={committed} />)
  open(); expect(screen.getByLabelText('Pending selection')).toHaveTextContent('false')
  fireEvent.click(screen.getByRole('button', { name: 'Done' })); expect(committed).not.toHaveBeenCalled()
})

test('an outside pointer without a click cannot swallow a later keyboard Cancel', () => {
  render(<Harness />); open(); choose('T3')
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
  expect(screen.getByRole('alert')).toHaveTextContent(/cycle/i)
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Delete another task' }))
  fireEvent.pointerUp(screen.getByRole('button', { name: 'Delete another task' }))
  const cancel = screen.getByRole('button', { name: 'Cancel' })
  fireEvent.keyDown(cancel, { key: 'Enter' }); fireEvent.click(cancel, { detail: 0 })
  expect(panel()).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'T2 predecessors' })).toHaveFocus()
})
