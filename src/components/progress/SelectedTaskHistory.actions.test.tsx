import { describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SelectedTaskHistory } from './SelectedTaskHistory'
import { createLoadedTaskHistoryReader } from '../../history/selectedTaskHistory'
import { selectedHistoryFile } from '../../test/selectedHistoryFixture'
import { emptyProgress } from '../../progress/taskProgress'
import { scenarioReader } from '../../../docs/qa/wp7-4-7b/tests/scenarioReaders'

const file = selectedHistoryFile()
const validReader = () => createLoadedTaskHistoryReader({ resourceId: 'valid-read', formatVersion: 5, taskIds: file.tasks.map(t => t.taskId), tracking: file.taskProgress! })
const show = () => fireEvent.click(screen.getByRole('button', { name: 'Show history' }))
const feedback = () => document.querySelector('[data-history-read-feedback]')
function delayedRetry() {
  const source = scenarioReader('expired'), read = source.reader.read
  let finish!: () => void, signal: AbortSignal | undefined
  source.reader.read = async (...args) => {
    const result = await read(...args)
    if (source.metrics.pageReads !== 2) return result
    signal = args[2]
    return new Promise(done => { finish = () => done(result) })
  }
  return { ...source, finish: () => finish(), getSignal: () => signal, pending: () => !!finish }
}
describe('WP7.4.7b action lifecycle', () => {
  test.each(['invalid', 'expired', 'oversized', 'mixed'] as const)('%s reports repeated attempts while preserving safeguards and data', async scenario => {
    const { reader, metrics, tracking } = scenarioReader(scenario), before = JSON.stringify(tracking)
    render(<SelectedTaskHistory taskId="T1" reader={reader} fallback={null} />); show()
    const primary = (await screen.findByRole('alert')).textContent
    expect(feedback()).toBeNull()
    const action = scenario === 'invalid' || scenario === 'oversized' ? 'Retry reading history' : 'Refresh history'
    fireEvent.click(screen.getByRole('button', { name: action }))
    await waitFor(() => expect(feedback()).toHaveTextContent('attempt 1 finished. The same history problem is still present. Project data has not changed.'))
    expect(screen.getByRole('alert')).toHaveTextContent(primary!)
    expect(metrics.opens).toBe(2); expect(metrics.pageReads).toBe(scenario === 'invalid' ? 0 : 2)
    if (scenario !== 'invalid') { expect(metrics.sessions[0]).not.toBe(metrics.sessions[1]); expect(metrics.releases).toBe(1) }
    fireEvent.click(screen.getByRole('button', { name: action }))
    await waitFor(() => expect(feedback()).toHaveTextContent('attempt 2 finished.'))
    expect(metrics.opens).toBe(3); expect(JSON.stringify(tracking)).toBe(before)
    expect(document.querySelectorAll('[data-history-event]')).toHaveLength(0)
  })
  test('rapid clicks admit one pending attempt, show progress and preserve recovery-button focus', async () => {
    const r = delayedRetry(); render(<SelectedTaskHistory taskId="T1" reader={r.reader} fallback={null} />); show()
    await screen.findByRole('alert')
    const button = screen.getByRole('button', { name: 'Refresh history' }); button.focus()
    act(() => { fireEvent.click(button); fireEvent.click(button) })
    await waitFor(() => expect(r.pending()).toBe(true))
    expect(r.metrics.opens).toBe(2); expect(button).toHaveAttribute('aria-disabled', 'true'); expect(button).toHaveFocus()
    expect(feedback()).toHaveTextContent('Refresh attempt 1: reading history')
    await act(async () => r.finish())
    expect(feedback()).toHaveTextContent('Refresh attempt 1 finished. The same history problem is still present.')
    expect(button).toHaveAttribute('aria-disabled', 'false'); expect(button).toHaveFocus()
  })
  test('a refreshed eligible source can succeed without changing any project field', async () => {
    const r = validReader(), original = r.read, open = vi.spyOn(r, 'open'), release = vi.spyOn(r, 'release'), before = JSON.stringify(file)
    vi.spyOn(r, 'read').mockResolvedValueOnce({ kind: 'Failure', code: 'ReadExpired', message: 'Initial expired read.' }).mockImplementation(original)
    render(<SelectedTaskHistory taskId="T1" reader={r} fallback={null} />); show(); await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh history' }))
    await waitFor(() => expect(feedback()).toHaveTextContent('Refresh attempt 1 finished. History was read successfully.'))
    expect(open).toHaveBeenCalledTimes(2); expect(release).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument(); expect(document.querySelectorAll('[data-history-event]')).toHaveLength(20)
    expect(JSON.stringify(file)).toBe(before)
  })
  test('source change cancels pending feedback and requires a fresh consistent read', async () => {
    const r = delayedRetry(), rendered = render(<SelectedTaskHistory taskId="T1" reader={r.reader} fallback={null} />); show(); await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh history' })); await waitFor(() => expect(r.pending()).toBe(true))
    rendered.rerender(<SelectedTaskHistory taskId="T1" reader={validReader()} fallback={null} />)
    expect(r.getSignal()?.aborted).toBe(true); expect(feedback()).toBeNull()
    await act(async () => r.finish()); expect(feedback()).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Refresh history' }))
    await waitFor(() => expect(feedback()).toHaveTextContent('Refresh attempt 1 finished. History was read successfully.'))
  })
  test('task switch discards late outcome and never shows another task feedback or records', async () => {
    const r = delayedRetry(), rendered = render(<SelectedTaskHistory key="T1" taskId="T1" reader={r.reader} fallback={null} />); show(); await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh history' })); await waitFor(() => expect(r.pending()).toBe(true))
    rendered.rerender(<SelectedTaskHistory key="T2" taskId="T2" reader={validReader()} fallback={null} />)
    expect(r.getSignal()?.aborted).toBe(true); await act(async () => r.finish())
    expect(feedback()).toBeNull(); show(); await screen.findByText('No more recorded entries.')
    expect(feedback()).toBeNull(); expect([...document.querySelectorAll('[data-history-event]')].map(e => e.getAttribute('data-history-event'))).toEqual(['H-45', 'H-44'])
  })
  test('hide cancels pending read and resets the visible attempt count', async () => {
    const r = delayedRetry(); render(<SelectedTaskHistory taskId="T1" reader={r.reader} fallback={null} />); show(); await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh history' })); await waitFor(() => expect(r.pending()).toBe(true))
    fireEvent.click(screen.getByRole('button', { name: 'Hide history' })); expect(r.getSignal()?.aborted).toBe(true)
    await act(async () => r.finish()); expect(feedback()).toBeNull()
    show(); await screen.findByRole('alert'); fireEvent.click(screen.getByRole('button', { name: 'Refresh history' }))
    await waitFor(() => expect(feedback()).toHaveTextContent('Refresh attempt 1 finished.'))
  })
  test('unavailable stays distinct from success and empty after retry', async () => {
    const r = createLoadedTaskHistoryReader({ resourceId: 'older-source', formatVersion: 1, taskIds: ['T1'], tracking: emptyProgress() })
    render(<SelectedTaskHistory taskId="T1" reader={r} fallback={null} />); show(); await screen.findByText('History unavailable.')
    fireEvent.click(screen.getByRole('button', { name: 'Retry reading history' }))
    await waitFor(() => expect(feedback()).toHaveTextContent('Retry attempt 1 finished. History is still unavailable.'))
    expect(screen.queryByText('No recorded history for this task.')).not.toBeInTheDocument()
  })
  test.each(['throw', 'cancel'] as const)('%s after retry terminates feedback honestly', async kind => {
    const r = validReader(), read = vi.spyOn(r, 'read').mockResolvedValueOnce({ kind: 'Failure', code: 'ReadExpired', message: 'First failure.' })
    if (kind === 'throw') read.mockRejectedValueOnce(new Error('Synthetic exception'))
    else read.mockResolvedValueOnce({ kind: 'Failure', code: 'Cancelled', message: 'Synthetic cancellation.' })
    render(<SelectedTaskHistory taskId="T1" reader={r} fallback={null} />); show(); await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh history' }))
    await waitFor(() => expect(feedback()).toHaveTextContent('Refresh attempt 1 finished. History could not be displayed. Project data has not changed.'))
    expect(screen.getByRole('button', { name: 'Retry reading history' })).toBeEnabled()
  })
  test('History Audit Data retains native disclosure and original metadata', async () => {
    render(<SelectedTaskHistory taskId="T1" reader={validReader()} fallback={null} />); show(); await screen.findByRole('button', { name: 'Load more history' })
    const summary = screen.getByText('History Audit Data', { exact: true }), disclosure = summary.closest('details')!
    expect(disclosure).not.toHaveAttribute('open'); fireEvent.click(summary); expect(disclosure).toHaveAttribute('open')
    expect(disclosure).toHaveTextContent('2026-11-09T15:00:00.000Z'); expect(disclosure).toHaveTextContent('completionAcknowledged')
    expect(disclosure).toHaveTextContent('C1'); expect(disclosure).toHaveTextContent('Unknown')
  })
})
