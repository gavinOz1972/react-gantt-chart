import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import App from '../../App'
import { LOCAL_PROJECTS_KEY, readLocalProjects } from '../../persistence/localProjects'

function tab(name: string) { fireEvent.click(screen.getByRole('tab', { name })) }
function weekday(name: string) { tab('Project Settings'); return screen.getByRole('checkbox', { name }) }

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
beforeEach(() => localStorage.clear())
afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })
function field(name: string, value: string) { fireEvent.change(screen.getByLabelText(new RegExp(`^${name}`)), { target: { value } }) }
function setting(name: string, value: string) { tab('Project Settings'); field(name, value); fireEvent.blur(screen.getByLabelText(new RegExp(`^${name}`))) }
function add(name = 'Research', hours = '3') {
  tab('Workspace')
  fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
  field('Task name', name); field('Estimated duration', hours)
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }))
}
function save(name = 'Semester A') { tab('Files'); field('Saved plan name', name); fireEvent.click(screen.getByRole('button', { name: 'Save As' })) }
function load(name = 'Semester A') { tab('Files'); field('Saved plans', name); fireEvent.click(screen.getByRole('button', { name: 'Load project' })) }

test('A10 named save/new/load preserves custom calendar, manual date, descriptions and stable ID counter', () => {
  render(<App />)
  setting('Working hours per day', '3')
  for (const day of ['Tuesday', 'Wednesday']) fireEvent.click(weekday(day))
  add()
  tab('Workspace'); fireEvent.click(screen.getByRole('button', { name: 'Edit T1' }))
  field('Description', 'Keep my research notes'); field('Independent start date', '2026-11-05')
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }))
  add('Draft', '1')
  tab('Workspace'); fireEvent.click(screen.getByRole('button', { name: 'Edit T2' }))
  fireEvent.click(within(screen.getByRole('region', { name: 'Edit task T2' })).getByRole('button', { name: 'T2 predecessors' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'T2 predecessor T1 — Research' }))
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }))
  save()
  expect(screen.getByText('Saved locally', { exact: true })).toBeInTheDocument()
  tab('Files'); fireEvent.click(screen.getByRole('button', { name: 'New project' }))
  expect(screen.getByText('Your project starts with one task')).toBeInTheDocument()
  load()
  tab('Workspace'); expect(screen.getByRole('row', { name: 'T1 Research' })).toHaveTextContent('Keep my research notes')
  expect(screen.getByRole('row', { name: 'T2 Draft' })).toHaveTextContent('T1 — Research')
  expect(screen.getByLabelText(/^Working hours per day/)).toHaveValue(3)
  expect(weekday('Thursday')).toBeChecked()
  expect(weekday('Tuesday')).not.toBeChecked()
  tab('Workspace'); fireEvent.click(screen.getByRole('button', { name: 'Edit T1' }))
  expect(screen.getByLabelText(/^Independent start date/)).toHaveValue('2026-11-05')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  add('Third')
  expect(screen.getByRole('row', { name: 'T3 Third' })).toBeInTheDocument()
})

test('A13 loading over invalid pending task edits warns and cancellation preserves the draft', () => {
  render(<App />); add(); save()
  tab('Workspace'); fireEvent.click(screen.getByRole('button', { name: 'Edit T1' }))
  field('Estimated duration', '0')
  load()
  expect(screen.getByRole('dialog')).toHaveTextContent('Replace unsaved work?')
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
  expect(screen.getByLabelText(/^Estimated duration/)).toHaveValue(0)
  load()
  fireEvent.click(screen.getByRole('button', { name: 'Replace current project' }))
  expect(screen.queryByLabelText(/^Estimated duration/)).not.toBeInTheDocument()
  tab('Workspace'); expect(screen.getByRole('row', { name: 'T1 Research' })).toHaveTextContent('3')
  expect(screen.queryByText(/Timeline unavailable/)).not.toBeInTheDocument()
})

test('overwrite requires confirmation and Cancel leaves the saved file unchanged', () => {
  render(<App />); add(); save()
  const before = localStorage.getItem(LOCAL_PROJECTS_KEY)
  setting('Project name', 'Changed semester')
  tab('Files'); fireEvent.click(screen.getByRole('button', { name: 'Save As' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(localStorage.getItem(LOCAL_PROJECTS_KEY)).toBe(before)
  tab('Files'); fireEvent.click(screen.getByRole('button', { name: 'Save As' }))
  fireEvent.click(screen.getByRole('button', { name: 'Overwrite saved plan' }))
  const library = readLocalProjects(localStorage)
  expect(library.ok).toBe(true)
  if (library.ok) expect(library.projects[0].plan.project.name).toBe('Changed semester')
})

test('deleting a named browser copy confirms and leaves the open project intact and unsaved', () => {
  render(<App />); add(); save()
  tab('Files'); fireEvent.click(screen.getByRole('button', { name: 'Delete saved plan' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('open project and other saved plans will be kept')
  fireEvent.click(screen.getByRole('button', { name: 'Delete saved copy' }))
  tab('Workspace'); expect(screen.getByRole('row', { name: 'T1 Research' })).toBeInTheDocument()
  expect(screen.getByText('Unsaved changes', { exact: true })).toBeInTheDocument()
  expect(readLocalProjects(localStorage)).toEqual({ ok: true, projects: [] })
})

test.each([
  { text: '{broken', message: 'INVALID_JSON' },
  { text: JSON.stringify({ format: 'react-gantt-chart', schemaVersion: 99 }), message: 'UNSUPPORTED_VERSION' },
])('A12 $message import leaves open project and source data unchanged', async ({ text, message }) => {
  render(<App />); add(); save()
  const before = localStorage.getItem(LOCAL_PROJECTS_KEY)
  fireEvent.change(screen.getByLabelText('Import project JSON'), { target: { files: [new File([text], 'plan.json', { type: 'application/json' })] } })
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(message))
  tab('Workspace'); expect(screen.getByRole('row', { name: 'T1 Research' })).toBeInTheDocument()
  expect(localStorage.getItem(LOCAL_PROJECTS_KEY)).toBe(before)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('quota failure keeps previous saved-plan choices available and never marks open changes saved', () => {
  render(<App />); add(); save()
  setting('Project name', 'Unsaved revision')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
  save('Second copy')
  expect(screen.getByRole('alert')).toHaveTextContent('storage is full')
  expect(screen.getByRole('option', { name: 'Semester A' })).toBeInTheDocument()
  expect(screen.getByText('Unsaved changes', { exact: true })).toBeInTheDocument()
})

test('unsaved beforeunload warning clears only after a successful local save', () => {
  render(<App />); add()
  const dirty = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(dirty)
  expect(dirty.defaultPrevented).toBe(true)
  save()
  const saved = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(saved)
  expect(saved.defaultPrevented).toBe(false)
})
