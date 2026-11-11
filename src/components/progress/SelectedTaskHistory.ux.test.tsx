import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { SelectedTaskHistory } from './SelectedTaskHistory'
import { createLoadedTaskHistoryReader } from '../../history/selectedTaskHistory'
import type { HistoryFailureCode } from '../../history/selectedTaskHistory'
import { emptyProgress } from '../../progress/taskProgress'
import { selectedHistoryFile } from '../../test/selectedHistoryFixture'

const file = selectedHistoryFile()
const reader = (formatVersion: 1 | 5 = 5, tracking = file.taskProgress!) => createLoadedTaskHistoryReader({ resourceId: 'ux-source', formatVersion, tracking, taskIds: file.tasks.map(t => t.taskId) })
const show = () => fireEvent.click(screen.getByRole('button', { name: 'Show history' }))
const details = () => fireEvent.click(screen.getByText('History details', { exact: true }))
describe('WP7.4.7a student-facing history hierarchy', () => {
  test('Available-zero has the exact empty primary and never becomes Unavailable', async () => {
    render(<SelectedTaskHistory taskId="T3" reader={reader()} fallback={null} />); show()
    expect(await screen.findByText('No recorded history for this task.', { exact: true })).toBeVisible()
    expect(screen.queryByText('History unavailable.', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByText('Some earlier history may be unavailable')).toBeVisible()
  })
  test('Partial-zero keeps the qualification visible while detailed coverage is collapsed', async () => {
    render(<SelectedTaskHistory taskId="T1" reader={reader(5, emptyProgress())} fallback={null} />); show()
    await screen.findByText('No recorded history for this task.')
    expect(screen.getAllByText('Some earlier history may be unavailable')).toHaveLength(1)
    const coverage = screen.getByText(/Availability: Available. Coverage: Partial/)
    expect(coverage).not.toBeVisible(); details(); expect(coverage).toBeVisible()
    expect(coverage).toHaveTextContent('Earlier deleted or unrecorded decisions and actor identity are unknown.')
  })
  test.each(['T1', 'T2', 'T3'])('Unavailable %s takes priority over zero rows and the Partial metadata', async taskId => {
    render(<SelectedTaskHistory taskId={taskId} reader={reader(1, emptyProgress())} fallback={null} />); show()
    expect(await screen.findByText('History unavailable.', { exact: true })).toBeVisible()
    expect(screen.queryByText('No recorded history for this task.')).not.toBeInTheDocument()
    expect(screen.queryByText('Some earlier history may be unavailable')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry reading history' })).toBeVisible()
    const metadata = screen.getByText(/Availability: Unavailable. Coverage: Partial/)
    expect(metadata).not.toBeVisible(); details(); expect(metadata).toBeVisible()
    expect(screen.getByText(/Format 1, progress version 1/)).toBeVisible()
  })
  test.each([
    ['InvalidPayload', 'Unable to display task history', 'Retry reading history'],
    ['ReadExpired', 'History needs to be refreshed.', 'Refresh history'],
    ['RecordTooLarge', 'This history entry is too large to display here.', 'Retry reading history'],
    ['MixedWatermark', 'History has changed—refresh to view a consistent version.', 'Refresh history'],
  ] as const)('%s has its own primary/action and optional exact diagnostics', async (code: HistoryFailureCode, primary, action) => {
    const r = reader(), open = vi.spyOn(r, 'open')
    vi.spyOn(r, 'read').mockResolvedValue({ kind: 'Failure', code, message: `Exact ${code} diagnostic.` })
    render(<SelectedTaskHistory taskId="T1" reader={r} fallback={null} />); show()
    expect(await screen.findByText(primary, { exact: true })).toBeVisible()
    if (code === 'InvalidPayload') expect(screen.getByText('Some historical information is invalid; project data has not changed.')).toBeVisible()
    const diagnostic = screen.getByText(`Read diagnostics: ${code}. Exact ${code} diagnostic.`)
    expect(diagnostic).not.toBeVisible(); details(); expect(diagnostic).toBeVisible()
    expect(screen.getByText(/Format 5, progress version 1/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: action }))
    await waitFor(() => expect(open).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(primary, { exact: true })).toBeVisible()
  })
  test('primary is a friendly dated change; historical wording, local time and exact provenance are disclosed separately', async () => {
    render(<SelectedTaskHistory taskId="T1" reader={reader()} fallback={null} />); show()
    await screen.findByRole('button', { name: 'Load more history' })
    const row = document.querySelector<HTMLElement>('[data-history-event="H-42"]')!
    expect(row.querySelector('strong')?.textContent).toBe('Changed from In Progress to Complete')
    expect(row.querySelector('.history-effective-date')?.textContent).toBe('Nov 5, 2026')
    expect(row.querySelector('details')).not.toHaveAttribute('open')
    const guidance = screen.getByText('Project guidance at completion: Original <guidance> & wording.')
    expect(guidance).not.toBeVisible(); fireEvent.click(row.querySelector('summary')!); expect(guidance).toBeVisible()
    expect(within(row).getByText(/Recorded \(local time\):/)).toBeVisible()
    expect(screen.getByText('Historical completion details. The current task status is shown above.')).toBeVisible()
    expect(document.querySelector('img')).toBeNull()
    const exact = document.querySelector('[data-history-metadata="H-42"]')!
    expect(exact).not.toBeVisible(); details(); expect(exact).toBeVisible()
    expect(exact).toHaveTextContent('2026-11-09T15:00:00.000Z')
    expect(exact).toHaveTextContent('C1'); expect(exact).toHaveTextContent('completionAcknowledged')
    expect(exact).toHaveTextContent('Unknown')
    expect(screen.getAllByText('Some earlier history may be unavailable')).toHaveLength(1)
  })
  test('long reason is summarized without changing the full escaped source wording', async () => {
    const p = structuredClone(file.taskProgress!), reason = 'Waiting <for review> & evidence. '.repeat(8)
    Object.assign(p.events.find(e => e.eventId === 'H-45')!, { reason }); Object.assign(p.tasks.T2, { blockedReason: reason })
    const before = JSON.stringify(p)
    render(<SelectedTaskHistory taskId="T2" reader={reader(5, p)} fallback={null} />); show()
    await screen.findByText('No more recorded entries.')
    const row = document.querySelector('[data-history-event="H-45"]')!
    expect(row.querySelector('p:not(.history-effective-date)')?.textContent).toMatch(/^Reason: .*…$/)
    const full = screen.getByText(`Full reason: ${reason.trim()}`, { exact: true })
    expect(full).not.toBeVisible(); fireEvent.click(row.querySelector('summary')!); expect(full).toBeVisible()
    expect(JSON.stringify(p)).toBe(before)
  })
  test('a page failure preserves the qualification of the previously delivered rows', async () => {
    const r = reader(), original = r.read
    vi.spyOn(r, 'read').mockImplementationOnce(original).mockResolvedValue({ kind: 'Failure', code: 'ReadExpired', message: 'Expired after first page.' })
    render(<SelectedTaskHistory taskId="T1" reader={r} fallback={null} />); show()
    fireEvent.click(await screen.findByRole('button', { name: 'Load more history' }))
    expect(await screen.findByText('History needs to be refreshed.')).toBeVisible()
    expect(document.querySelectorAll('[data-history-event]')).toHaveLength(20)
    expect(screen.getAllByText('Some earlier history may be unavailable')).toHaveLength(1)
  })
})
