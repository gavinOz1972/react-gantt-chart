import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from '../App'
import { readLocalProjects } from '../persistence/localProjects'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())
function setup() {
  render(<App />)
  fireEvent.click(screen.getByRole('tab', { name: 'Workspace' }))
  fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
  fireEvent.change(screen.getByLabelText(/^Task name/), { target: { value: 'Research' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }))
}
function edit(value: string, key = 'Enter') {
  fireEvent.click(screen.getByRole('button', { name: 'Edit T1 remaining effort' }))
  const input = screen.getByLabelText('T1 remaining effort', { exact: true })
  fireEvent.change(input, { target: { value } })
  fireEvent.keyDown(input, { key })
}

test('table quick entry distinguishes unknown/zero, synchronizes selected chart/details and saves the existing format', () => {
  setup()
  const trigger = () => screen.getByRole('button', { name: 'Edit T1 remaining effort' })
  expect(trigger()).toHaveTextContent('Unknown')
  edit('0')
  expect(trigger()).toHaveTextContent('0 h')
  fireEvent.click(screen.getByRole('button', { name: 'Select T1 in chart' }))
  expect(screen.getByRole('button', { name: 'Edit Selected T1 remaining effort' })).toHaveTextContent('0 h')
  expect(screen.getByLabelText('Remaining effort (hours)', { exact: true })).toHaveValue('0')
  fireEvent.click(screen.getByRole('tab', { name: 'Files' }))
  fireEvent.change(screen.getByLabelText('Saved plan name'), { target: { value: 'Quick entry' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save As' }))
  const saved = readLocalProjects(localStorage)
  if (!saved.ok) throw new Error('Save failed')
  expect(saved.projects[0].plan.schemaVersion).toBe(5)
  expect(saved.projects[0].plan.workTracking!.remainingHours.T1).toBe(0)
  fireEvent.click(screen.getByRole('tab', { name: 'Workspace' }))
  edit('')
  expect(trigger()).toHaveTextContent('Unknown')
  expect(screen.getByLabelText('Remaining effort (hours)', { exact: true })).toHaveValue('')
})

test('invalid commits retain the draft and stored value; Escape and pointer Cancel never commit', () => {
  setup(); edit('5')
  edit('-1')
  expect(screen.getByRole('alert')).toHaveTextContent('zero or a positive number')
  expect(screen.getByLabelText('T1 remaining effort', { exact: true })).toHaveValue('-1')
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  fireEvent.keyDown(screen.getByLabelText('T1 remaining effort', { exact: true }), { key: 'Escape' })
  expect(screen.getByRole('button', { name: 'Edit T1 remaining effort' })).toHaveTextContent('5 h')
  fireEvent.click(screen.getByRole('button', { name: 'Edit T1 remaining effort' }))
  fireEvent.change(screen.getByLabelText('T1 remaining effort', { exact: true }), { target: { value: '9' } })
  fireEvent.click(screen.getByRole('button', { name: 'Cancel T1 remaining effort' }))
  expect(screen.getByRole('button', { name: 'Edit T1 remaining effort' })).toHaveTextContent('5 h')
})

test('invalid chart drafts survive task selection changes and can be resumed or cancelled without changing the estimate', () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'Duplicate T1' }))
  fireEvent.click(screen.getByRole('button', { name: 'Select T1 in chart' }))
  fireEvent.click(screen.getByRole('button', { name: 'Edit Selected T1 remaining effort' }))
  const input = screen.getByLabelText('Selected T1 remaining effort', { exact: true })
  fireEvent.change(input, { target: { value: 'invalid' } })
  fireEvent.blur(input)
  fireEvent.click(screen.getByRole('button', { name: 'Select T2 in chart' }))
  fireEvent.click(screen.getByRole('button', { name: 'Resume remaining edit for T1' }))
  expect(screen.getByLabelText('Selected T1 remaining effort', { exact: true })).toHaveValue('invalid')
  fireEvent.keyDown(screen.getByLabelText('Selected T1 remaining effort', { exact: true }), { key: 'Escape' })
  expect(within(screen.getByRole('region', { name: 'Selected chart task' })).getByRole('button', { name: 'Edit Selected T1 remaining effort' })).toHaveTextContent('Unknown')
})
