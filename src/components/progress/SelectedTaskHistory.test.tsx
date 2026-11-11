import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SelectedTaskHistory } from './SelectedTaskHistory'
import { LegacyTaskHistory } from './LegacyTaskHistory'
import { TaskStatusPanel } from './TaskStatusPanel'
import { createLoadedTaskHistoryReader, HISTORY_MAX_BYTES } from '../../history/selectedTaskHistory'
import type { HistoryFailureCode } from '../../history/selectedTaskHistory'
import { selectedHistoryFile } from '../../test/selectedHistoryFixture'
import { emptyProgress } from '../../progress/taskProgress'
import { renderToStaticMarkup } from 'react-dom/server'
import originalPanel from '../../../docs/qa/wp7-4-7/evidence/original-panel.html?raw'

afterEach(() => vi.unstubAllEnvs())
const file = selectedHistoryFile(), tracking = file.taskProgress!
const makeReader = () => createLoadedTaskHistoryReader({ resourceId: 'project:1', formatVersion: 5, taskIds: file.tasks.map(t => t.taskId), tracking })
const fallback = <LegacyTaskHistory tracking={tracking} taskId="T1" open />
const props = { taskId: 'T1', fallback }
const show = () => fireEvent.click(screen.getByRole('button', { name: 'Show history' }))
describe('WP7.4.7 selected-task disclosure and safety', () => {
  test.each([false, true])('default-off / production gate (production=%s) matches original panel HTML exactly', production => {
    vi.stubEnv('DEV', !production); vi.stubEnv('VITE_SELECTED_TASK_HISTORY', production ? 'true' : undefined)
    const noop = () => undefined
    const html = renderToStaticMarkup(<TaskStatusPanel task={file.tasks[0]} tracking={tracking} disabled={false} statusDisabled={false} onRequest={noop} onCriteria={noop} onDraftChange={noop} onSelect={noop} historyContext={{ resourceId: 'p', formatVersion: 5, tasks: file.tasks }} />)
    expect(html + '\n').toBe(originalPanel)
  })
  test('collapsed means zero reads, no rows; show preserves focus and hide releases the session', async () => {
    const r = makeReader(), open = vi.spyOn(r, 'open'), read = vi.spyOn(r, 'read'), release = vi.spyOn(r, 'release')
    render(<SelectedTaskHistory {...props} reader={r} />)
    expect(open).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled()
    const button = screen.getByRole('button', { name: 'Show history' }); button.focus(); show()
    expect(await screen.findByText('Some earlier history may be unavailable')).toBeVisible()
    expect(button).toHaveFocus(); expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(open).toHaveBeenCalledWith('T1', expect.any(AbortSignal))
    expect(read.mock.calls[0][1]).toEqual({ cursor: undefined, limit: 20, maxBytes: HISTORY_MAX_BYTES })
    expect(document.querySelectorAll('[data-history-event]')).toHaveLength(20)
    fireEvent.click(screen.getByRole('button', { name: 'Hide history' }))
    expect(button).toHaveAttribute('aria-expanded', 'false'); expect(release).toHaveBeenCalledOnce()
    expect(document.querySelectorAll('[data-history-event]')).toHaveLength(0)
  })
  test('load more preserves source order, historical wording, attestation and safe escaping', async () => {
    render(<SelectedTaskHistory {...props} reader={makeReader()} />); show()
    fireEvent.click(await screen.findByRole('button', { name: 'Load more history' }))
    await waitFor(() => expect(document.querySelectorAll('[data-history-event]')).toHaveLength(40))
    fireEvent.click(screen.getByRole('button', { name: 'Load more history' }))
    await waitFor(() => expect(document.querySelectorAll('[data-history-event]')).toHaveLength(43))
    expect(screen.queryByRole('button', { name: 'Load more history' })).not.toBeInTheDocument()
    expect(screen.getByText(/No more recorded entries/)).toBeVisible()
    fireEvent.click(document.querySelector('[data-history-event="H-42"] summary')!)
    expect(screen.getByText('Project guidance at completion: Original <guidance> & wording.')).toBeVisible()
    expect(screen.getByText('Note / evidence: Literal <img src=x onerror=alert(1)> & note.')).toBeVisible()
    expect(document.querySelector('img')).toBeNull()
    expect(screen.getByText(/Historical completion acknowledgement: recorded/)).toBeVisible()
    expect([...document.querySelectorAll('[data-history-event]')].map(e => e.getAttribute('data-history-event'))).toEqual(tracking.events.filter(e => e.taskId === 'T1').slice().reverse().map(e => e.eventId))
  })
  test('source change requires explicit refresh and discards old pages', async () => {
    const old = makeReader(), release = vi.spyOn(old, 'release'), rendered = render(<SelectedTaskHistory {...props} reader={old} />); show()
    await screen.findByRole('button', { name: 'Load more history' })
    const next = makeReader(), open = vi.spyOn(next, 'open')
    rendered.rerender(<SelectedTaskHistory {...props} reader={next} />)
    expect(screen.getByText(/History has changed—refresh/)).toBeVisible(); expect(open).not.toHaveBeenCalled()
    expect(document.querySelectorAll('[data-history-event]')).toHaveLength(0); expect(release).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Refresh history' }))
    await screen.findByRole('button', { name: 'Load more history' }); expect(open).toHaveBeenCalledOnce()
  })
  test('late read after task switch is aborted/released and cannot contaminate the next selection', async () => {
    const r = makeReader(), original = r.read, release = vi.spyOn(r, 'release')
    let resolve!: () => void, signal: AbortSignal | undefined
    vi.spyOn(r, 'read').mockImplementation(async (s, q, a) => { signal = a; const page = await original(s, q, a); return new Promise(done => { resolve = () => done(page) }) })
    const rendered = render(<SelectedTaskHistory key="T1" {...props} reader={r} />); show()
    await waitFor(() => expect(resolve).toBeTypeOf('function'))
    rendered.rerender(<SelectedTaskHistory key="T2" taskId="T2" reader={makeReader()} fallback={null} />)
    expect(signal?.aborted).toBe(true); expect(release).toHaveBeenCalledOnce()
    await act(async () => resolve())
    expect(document.querySelectorAll('[data-history-event]')).toHaveLength(0)
    show(); expect(await screen.findByText(/No more recorded entries/)).toBeVisible()
    expect([...document.querySelectorAll('[data-history-event]')].map(e => e.getAttribute('data-history-event'))).toEqual(['H-45', 'H-44'])
  })
  test('hide while opening aborts and releases a subsequently opened session', async () => {
    const r = makeReader(), original = r.open, release = vi.spyOn(r, 'release')
    let finish!: () => void
    vi.spyOn(r, 'open').mockImplementation(async (id, signal) => { const result = await original(id, signal); return new Promise(done => { finish = () => done(result) }) })
    render(<SelectedTaskHistory {...props} reader={r} />); show()
    await waitFor(() => expect(finish).toBeTypeOf('function'))
    fireEvent.click(screen.getByRole('button', { name: 'Hide history' })); await act(async () => finish())
    expect(release).toHaveBeenCalledOnce(); expect(screen.queryByText('Task history')).not.toBeInTheDocument()
  })
  test.each(['Unsupported', 'InvalidPayload', 'ReadExpired', 'RecordTooLarge', 'Cancelled'] as const)('%s has explicit messaging, refresh and only safe opt-in fallback', async (code: HistoryFailureCode) => {
    const r = makeReader(); vi.spyOn(r, 'read').mockResolvedValue({ kind: 'Failure', code, message: `Qualified ${code} failure.` })
    render(<SelectedTaskHistory {...props} reader={r} />); show()
    expect(await screen.findByRole('alert')).toHaveTextContent(({ Unsupported: 'History is not supported for this source.', InvalidPayload: 'Unable to display task history', ReadExpired: 'History needs to be refreshed.', RecordTooLarge: 'This history entry is too large to display here.', Cancelled: 'Reading history was cancelled.', MixedWatermark: '', InvalidCursor: '' })[code])
    expect(screen.getByRole('button', { name: code === 'ReadExpired' ? 'Refresh history' : 'Retry reading history' })).toBeVisible()
    const button = screen.queryByRole('button', { name: 'Show loaded legacy history' })
    if (['Unsupported', 'ReadExpired', 'RecordTooLarge'].includes(code)) {
      expect(button).toBeVisible(); fireEvent.click(button!)
      expect(screen.getByText(/Showing the original loaded history/)).toBeVisible()
      expect(document.querySelectorAll('[data-status-event]')).toHaveLength(43)
      expect(r.read).toHaveBeenCalledOnce()
    } else expect(button).not.toBeInTheDocument()
  })
  test('mixed watermark is rejected rather than rendering or appending rows', async () => {
    const r = makeReader(), original = r.read
    vi.spyOn(r, 'read').mockImplementation(async (...a) => { const p = await original(...a); return p.kind === 'Page' ? { ...p, watermark: { ...p.watermark, revisionToken: {} } } : p })
    render(<SelectedTaskHistory {...props} reader={r} />); show()
    expect(await screen.findByRole('alert')).toHaveTextContent('History has changed—refresh')
    expect(document.querySelectorAll('[data-history-event]')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Show loaded legacy history' })).not.toBeInTheDocument()
  })
  test('unsupported opening without a validated session does not offer an unsafe fallback', async () => {
    const r = makeReader(); vi.spyOn(r, 'open').mockResolvedValue({ kind: 'Failure', code: 'Unsupported', message: 'Source could not be validated.' })
    render(<SelectedTaskHistory {...props} reader={r} />); show()
    expect(await screen.findByRole('alert')).toHaveTextContent('History is not supported for this source.')
    expect(screen.queryByRole('button', { name: 'Show loaded legacy history' })).not.toBeInTheDocument()
  })
  test.each([1, 5] as const)('format %s distinguishes Unavailable versus available empty without claiming completeness', async formatVersion => {
    const r = createLoadedTaskHistoryReader({ resourceId: 'old', formatVersion, taskIds: ['T1'], tracking: emptyProgress() })
    render(<SelectedTaskHistory {...props} reader={r} />); show()
    expect(await screen.findByText(formatVersion === 1 ? /^History unavailable\.$/ : /^No recorded history for this task\.$/)).toBeVisible()
    if (formatVersion === 5) expect(screen.getByText('Some earlier history may be unavailable')).toBeVisible()
    else expect(screen.queryByText('Some earlier history may be unavailable')).not.toBeInTheDocument()
  })
  test('viewing with a criterion draft preserves input, callbacks and entire source data; flag disable restores legacy', async () => {
    vi.stubEnv('DEV', true); vi.stubEnv('VITE_SELECTED_TASK_HISTORY', 'true')
    const before = JSON.stringify(file), onRequest = vi.fn(), onCriteria = vi.fn(), onDraftChange = vi.fn(), onSelect = vi.fn()
    const p = { task: file.tasks[0], tracking, disabled: false, statusDisabled: false, onRequest, onCriteria, onDraftChange, onSelect, historyContext: { resourceId: 'p', formatVersion: 5 as const, tasks: file.tasks } }
    const rendered = render(<TaskStatusPanel {...p} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add criterion' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Completion criterion' }), { target: { value: 'Uncommitted wording' } })
    const calls = onDraftChange.mock.calls.length
    show(); await screen.findByText('Some earlier history may be unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Hide history' }))
    expect(screen.getByRole('textbox', { name: 'Completion criterion' })).toHaveValue('Uncommitted wording')
    expect(onDraftChange).toHaveBeenCalledTimes(calls); expect(onRequest).not.toHaveBeenCalled(); expect(onCriteria).not.toHaveBeenCalled(); expect(onSelect).not.toHaveBeenCalled()
    expect(JSON.stringify(file)).toBe(before)
    vi.stubEnv('VITE_SELECTED_TASK_HISTORY', 'false'); rendered.rerender(<TaskStatusPanel {...p} />)
    expect(screen.queryByRole('button', { name: 'Show history' })).not.toBeInTheDocument()
    expect(screen.getByText('Transition history (43)')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Completion criterion' })).toHaveValue('Uncommitted wording')
  })
})
