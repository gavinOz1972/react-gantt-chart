import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, expect, test } from 'vitest'
import App from '../App'
import { readLocalProjects } from '../persistence/localProjects'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())
const tab = (name: string) => fireEvent.click(screen.getByRole('tab', { name }))
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const change = (name: string, value: string) => fireEvent.change(screen.getByLabelText(label => label.startsWith(name)), { target: { value } })
function add(name: string, hours = '1') {
  tab('Workspace'); click('Add task')
  change('Task name', name); change('Estimated duration (hours)', hours); click('Save task')
}
function edit(label: string, value: string, key = 'Enter') {
  click(`Edit ${label}`); change(label, value); fireEvent.keyDown(screen.getByLabelText(label), { key })
}
const order = () => screen.getAllByRole('row').slice(1).map(row => row.getAttribute('data-task-row'))
const bar = (id: string) => screen.getByRole('button', { name: new RegExp(`^${id} .*working hours; starts`) })

test('A02/A03/A05/A08 keyboard rearrangement, protected sorts, copies, deletion and durable ID allocation', () => {
  render(<App />); add('Zulu', '5'); add('Alpha', '2'); add('Third', '3')
  click('Move T3 up'); click('Move T3 up')
  expect(order()).toEqual(['T3', 'T1', 'T2'])
  fireEvent.change(screen.getByLabelText('Task order'), { target: { value: 'name' } })
  expect(order()).toEqual(['T2', 'T3', 'T1'])
  expect(screen.getByRole('button', { name: 'Drag T1 to reorder' })).toBeDisabled()
  expect(screen.getByText(/Reordering is disabled while sorted/)).toBeInTheDocument()
  click('Duplicate T1')
  expect(screen.getByLabelText('Task order')).toHaveValue('name')
  fireEvent.change(screen.getByLabelText('Task order'), { target: { value: 'manual' } })
  expect(order()).toEqual(['T3', 'T1', 'T4', 'T2'])
  click('Delete T3'); click('Delete task'); add('Next')
  expect(order()).toEqual(['T1', 'T4', 'T2', 'T5'])
  expect(screen.getByRole('row', { name: 'T4 Zulu (Copy)' })).toHaveTextContent('5')
})

test.each(['Enter', 'Tab', 'blur'])('A09 duration commits only at %s and recalculates immediately', key => {
  render(<App />); add('Research', '1')
  const before = bar('T1').getAttribute('data-end')
  click('Edit T1 duration'); change('T1 duration', '9')
  expect(bar('T1')).toHaveAttribute('data-end', before)
  const input = screen.getByLabelText('T1 duration')
  if (key === 'Enter') fireEvent.keyDown(input, { key })
  else { if (key === 'Tab') fireEvent.keyDown(input, { key }); fireEvent.blur(input) }
  expect(bar('T1').getAttribute('data-end')).not.toBe(before)
  expect(screen.queryByLabelText('T1 duration')).not.toBeInTheDocument()
})

test('A10/A13 invalid drafts preserve valid schedule, block saving and survive tabs until Escape', () => {
  render(<App />); add('Research', '5')
  const before = bar('T1').getAttribute('aria-label')
  edit('T1 duration', '0')
  expect(screen.getByRole('alert')).toHaveTextContent('positive safe whole number')
  expect(bar('T1')).toHaveAttribute('aria-label', before)
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  tab('Files'); tab('Workspace')
  expect(screen.getByLabelText('T1 duration')).toHaveValue(0)
  fireEvent.keyDown(screen.getByLabelText('T1 duration'), { key: 'Escape' })
  expect(bar('T1')).toHaveAttribute('aria-label', before)
  edit('T1 name', 'Changed', 'Escape')
  expect(screen.getByRole('row', { name: 'T1 Research' })).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('A11 multiline drafts support Enter/newline, Ctrl+Enter, Escape and blur', () => {
  render(<App />); add('Research')
  click('Edit T1 description'); change('T1 description', 'Line 1\nLine 2')
  expect(fireEvent.keyDown(screen.getByLabelText('T1 description'), { key: 'Enter' })).toBe(true)
  expect(screen.getByLabelText('T1 description')).toHaveValue('Line 1\nLine 2')
  fireEvent.keyDown(screen.getByLabelText('T1 description'), { key: 'Enter', ctrlKey: true })
  expect(screen.getByRole('button', { name: 'Edit T1 description' })).toHaveTextContent('Line 1 Line 2')
  edit('T1 description', 'Discard', 'Escape')
  click('Edit T1 description'); expect(screen.getByLabelText('T1 description')).toHaveValue('Line 1\nLine 2')
  change('T1 description', 'Third line'); fireEvent.blur(screen.getByLabelText('T1 description'))
  expect(screen.getByRole('button', { name: 'Edit T1 description' })).toHaveTextContent('Third line')
})

test('A12/A13 inline date/dependency commits are atomic; removing a predecessor preserves its task and retained date', () => {
  render(<App />); add('First', '5'); add('Second')
  edit('T2 independent start date', '2026-11-12')
  const second = within(screen.getByRole('row', { name: 'T2 Second' }))
  click('Select T2 in chart')
  fireEvent.click(second.getByRole('button', { name: 'T2 predecessors' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'T2 predecessor T1 — First' }))
  click('Done')
  expect(second.queryByRole('button', { name: 'Edit T2 independent start date' })).not.toBeInTheDocument()
  expect(second.getByText('Retained independent date: 2026-11-12')).toBeInTheDocument()
  click('T2 predecessors')
  expect(screen.getByRole('checkbox', { name: 'T2 predecessor T2 — Second' })).toBeDisabled()
  click('Cancel')
  click('T1 predecessors')
  fireEvent.click(screen.getByRole('checkbox', { name: 'T1 predecessor T2 — Second' }))
  click('Done'); expect(screen.getByRole('alert')).toHaveTextContent(/cycle/i); click('Cancel')
  click('T2 predecessors')
  fireEvent.click(screen.getByRole('checkbox', { name: 'T2 predecessor T1 — First' }))
  click('Done')
  expect(screen.getByRole('row', { name: 'T1 First' })).toBeInTheDocument()
  expect(second.getAllByText('2026-11-12')).toHaveLength(2)
  edit('T2 independent start date', '2026-11-01')
  expect(screen.getByRole('alert')).toHaveTextContent('manual requested start precedes')
  expect(second.getAllByText('2026-11-12')).toHaveLength(2)
})

test('A14/A15 Files→settings→Workspace, preserved Add draft and Save routes new plans; later Save uses known identity', () => {
  render(<App />)
  expect(screen.getAllByRole('tab').map(element => element.textContent)).toEqual(['Files', 'Project Settings', 'Workspace'])
  expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
  click('New project'); expect(screen.getByRole('tab', { name: 'Project Settings' })).toHaveAttribute('aria-selected', 'true')
  click('Next: Workspace →'); click('Add task'); change('Task name', 'Keep draft')
  tab('Files'); tab('Workspace'); expect(screen.getByLabelText('Task name')).toHaveValue('Keep draft')
  click('Save task'); click('Save')
  expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
  change('Saved plan name', 'Plan A'); click('Save As')
  tab('Workspace'); edit('T1 name', 'Renamed'); click('Save')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByText('Saved locally')).toBeInTheDocument()
  const library = readLocalProjects(localStorage)
  expect(library.ok).toBe(true)
  if (library.ok) { expect(library.projects).toHaveLength(1); expect(library.projects[0].name).toBe('Plan A'); expect(library.projects[0].plan.tasks[0].name).toBe('Renamed') }
  tab('Files'); fireEvent.change(screen.getByLabelText('Saved plans'), { target: { value: 'Plan A' } }); click('Load project')
  expect(screen.getByRole('tab', { name: 'Workspace' })).toHaveAttribute('aria-selected', 'true')
})
