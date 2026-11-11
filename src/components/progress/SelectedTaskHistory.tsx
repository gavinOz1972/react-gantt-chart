import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { HISTORY_MAX_BYTES, HISTORY_PAGE_SIZE, sameHistoryWatermark } from '../../history/selectedTaskHistory'
import type { HistoryFailure, HistoryFailureCode, HistoryPage, HistorySession, SelectedTaskHistoryReader, TransitionRow } from '../../history/selectedTaskHistory'
import './selectedTaskHistory.css'

interface View {
  reader?: SelectedTaskHistoryReader; phase: 'Closed' | 'Loading' | 'Ready' | 'Failed'
  page?: HistoryPage; session?: HistorySession; rows: readonly TransitionRow[]; error?: HistoryFailure; fallback?: boolean; canFallback?: boolean
  feedback?: { attempt: number; action: 'Retry' | 'Refresh'; previousProblem?: HistoryFailureCode | 'Unavailable' }
}
const closed: View = { phase: 'Closed', rows: [] }
function actionFeedback(view: View) {
  if (!view.feedback) return undefined
  const prefix = `${view.feedback.action} attempt ${view.feedback.attempt}`
  if (view.phase === 'Loading') return `${prefix}: reading history…`
  if (view.phase === 'Failed') return `${prefix} finished. ${view.error?.code === view.feedback.previousProblem ? 'The same history problem is still present.' : 'History could not be displayed.'} Project data has not changed.`
  if (view.phase === 'Ready') return view.page?.availability === 'Unavailable'
    ? `${prefix} finished. History is ${view.feedback.previousProblem === 'Unavailable' ? 'still ' : ''}unavailable.`
    : `${prefix} finished. History was read successfully.`
  return undefined
}
function friendlyDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}
function recordedLocal(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value))
}
function errorCopy(code: HistoryFailureCode) {
  switch (code) {
    case 'InvalidPayload': return { title: 'Unable to display task history', explanation: 'Some historical information is invalid; project data has not changed.', action: 'Retry reading history' }
    case 'ReadExpired': case 'InvalidCursor': return { title: 'History needs to be refreshed.', action: 'Refresh history' }
    case 'RecordTooLarge': return { title: 'This history entry is too large to display here.', action: 'Retry reading history' }
    case 'MixedWatermark': return { title: 'History has changed—refresh to view a consistent version.', action: 'Refresh history' }
    case 'Cancelled': return { title: 'Reading history was cancelled.', action: 'Retry reading history' }
    case 'Unsupported': return { title: 'History is not supported for this source.', action: 'Retry reading history' }
  }
}
function HistoryEntry({ row }: { row: TransitionRow }) {
  const event = row.event, longReason = !!event.reason && event.reason.length > 160
  return <li data-history-event={event.eventId}>
    <strong>Changed from {event.fromStatus} to {event.toStatus}</strong>
    <p className="history-effective-date"><time dateTime={event.date}>{friendlyDate(event.date)}</time></p>
    {event.reason !== undefined && <p>Reason: {longReason ? event.reason.slice(0, 160).trimEnd() + '…' : event.reason}</p>}
    <details className="history-entry-details"><summary>More about this change</summary>
      {longReason && <p>Full reason: {event.reason}</p>}
      {event.note !== undefined && <p>Note / evidence: {event.note === '' ? '(empty note recorded)' : event.note}</p>}
      <p>Effective date: <time dateTime={event.date}>{friendlyDate(event.date)}</time> (date only; time unknown).</p>
      <p>Recorded (local time): <time dateTime={event.recordedAt}>{recordedLocal(event.recordedAt)}</time>.</p>
      {event.toStatus === 'Complete' && <>
        <p>Historical completion details. The current task status is shown above.</p>
        <p>Historical completion acknowledgement: recorded. {event.noCriteriaAcknowledged === true && 'No formal criteria explicitly acknowledged.'}</p>
        <p>Committed finish at completion: {event.committedFinishDateAtCompletion ? friendlyDate(event.committedFinishDateAtCompletion) : 'Unknown'}</p>
        <p>Project guidance at completion: {event.definitionOfDone === '' ? '(empty wording recorded)' : event.definitionOfDone ?? 'Unknown'}</p>
        {!!event.criteriaSnapshot?.length && <ul>{event.criteriaSnapshot.map(c => <li key={c.criterionId}>{c.text} — satisfied</li>)}</ul>}
      </>}
    </details>
  </li>
}
function HistoryDetails({ page, session, rows, error, changed }: { page?: HistoryPage; session?: HistorySession; rows: readonly TransitionRow[]; error?: HistoryFailure; changed: boolean }) {
  const source = page?.source ?? session?.source
  return <details className="history-provenance"><summary>History Audit Data</summary>
    <p>These local records do not verify identity or provide a tamper-proof audit trail.</p>
    {changed ? <p>Read diagnostics: the source changed; the previous read was released and its pages discarded.</p> : <>
      {source ? <p>Source: loaded legacy plan. Format {source.formatVersion}, progress version {source.progressVersion}. Pages belong to one pinned in-memory read.</p> : <p>Source details are unavailable until a read opens.</p>}
      {session && <p>Read resource: {session.watermark.resourceId}. Selected task: {session.taskId}.</p>}
      {page ? <>
        <p>Availability: {page.availability}. Coverage: {page.coverage.kind}. {page.coverage.reason}</p>
        <p>Source positions belong to this loaded read, not permanent sequence IDs across edits. Separate decision IDs and actor identity are Unknown in legacy records.</p>
      </> : <p>Availability and coverage have not been returned for this read.</p>}
      {error && <p>Read diagnostics: {error.code}. {error.message}</p>}
      {!!rows.length && <ol>{rows.map(row => <li key={row.event.eventId} data-history-metadata={row.event.eventId}>
        <strong>Event ID: {row.event.eventId}</strong>
        <dl><div><dt>Source position</dt><dd>{row.sequence}</dd></div>
          <div><dt>Effective date (ISO)</dt><dd>{row.event.date} — date only; time Unknown</dd></div>
          <div><dt>Recorded time (exact UTC)</dt><dd>{row.event.recordedAt}</dd></div>
          <div><dt>Decision / reference ID</dt><dd>{row.decisionId ?? 'Unknown'}</dd></div>
          <div><dt>Actor</dt><dd>{row.actor ?? 'Unknown'}</dd></div></dl>
        <p>Original retained record, including available attestation and reference metadata:</p><pre>{JSON.stringify(row.event, null, 2)}</pre>
      </li>)}</ol>}
    </>}
  </details>
}
export function SelectedTaskHistory({ taskId, reader, fallback }: { taskId: string; reader: SelectedTaskHistoryReader; fallback: ReactNode }) {
  const regionId = useId(), [view, setView] = useState<View>(closed)
  const active = useRef<{ reader: SelectedTaskHistoryReader; session: HistorySession } | null>(null)
  const pending = useRef<AbortController | null>(null), generation = useRef(0)
  const attempts = useRef(0)
  function stop() {
    generation.current++; pending.current?.abort(); pending.current = null
    if (active.current) { active.current.reader.release(active.current.session); active.current = null }
  }
  useEffect(() => () => {
    generation.current++; pending.current?.abort(); pending.current = null
    if (active.current) { active.current.reader.release(active.current.session); active.current = null }
    attempts.current = 0
  }, [reader])
  const changed = view.phase !== 'Closed' && view.reader !== reader
  const busy = view.phase === 'Loading' && !changed
  async function load(more = false, action?: 'Retry' | 'Refresh') {
    if (busy || pending.current && !pending.current.signal.aborted) return
    if (!more) stop()
    const controller = new AbortController(), requestId = ++generation.current
    pending.current = controller
    const previous = more ? view.rows : [], cursor = more ? view.page?.nextCursor : undefined
    const feedback: View['feedback'] = action ? { action, attempt: ++attempts.current, previousProblem: view.reader === reader ? view.error?.code ?? (view.page?.availability === 'Unavailable' ? 'Unavailable' : undefined) : undefined } : undefined
    setView({ reader, phase: 'Loading', rows: previous, page: more ? view.page : undefined, session: more ? view.session : undefined, feedback })
    const current = () => !controller.signal.aborted && generation.current === requestId
    try {
      let session = more ? active.current?.session : undefined
      if (!session) {
        const opened = await reader.open(taskId, controller.signal)
        if (!current()) { if (opened.kind === 'Opened') reader.release(opened.session); return }
        if (opened.kind === 'Failure') { setView({ reader, phase: 'Failed', rows: previous, error: opened, feedback }); return }
        session = opened.session; active.current = { reader, session }
      }
      const page = await reader.read(session, { cursor, limit: HISTORY_PAGE_SIZE, maxBytes: HISTORY_MAX_BYTES }, controller.signal)
      if (!current()) return
      if (page.kind === 'Failure') { setView({ reader, phase: 'Failed', rows: previous, page: more ? view.page : undefined, session, error: page, canFallback: true, feedback }); return }
      if (!sameHistoryWatermark(page.watermark, session.watermark) || page.taskId !== taskId || page.items.some(r => r.taskId !== taskId || r.event.taskId !== taskId) || page.items.length > HISTORY_PAGE_SIZE || page.deliveredBytes > HISTORY_MAX_BYTES || page.items.some((r, i) => i ? r.sequence >= page.items[i - 1].sequence : previous.length > 0 && r.sequence >= previous[previous.length - 1].sequence)) {
        setView({ reader, phase: 'Failed', rows: [], session, error: { kind: 'Failure', code: 'MixedWatermark', message: 'These rows do not belong to the same selected-task read. Refresh history; no revisions were combined.' }, feedback }); return
      }
      setView({ reader, phase: 'Ready', rows: [...previous, ...page.items], page, session, canFallback: true, feedback })
    } catch {
      if (current()) setView({ reader, phase: 'Failed', rows: previous, page: more ? view.page : undefined, session: active.current?.session, canFallback: !!active.current, error: { kind: 'Failure', code: 'Unsupported', message: 'History could not be read. Your loaded plan is unchanged.' }, feedback })
    } finally { if (current()) pending.current = null }
  }
  function hide() { stop(); attempts.current = 0; setView(closed) }
  const safeFallback = view.canFallback && (view.error && ['Unsupported', 'ReadExpired', 'RecordTooLarge'].includes(view.error.code) || view.page?.availability === 'Unavailable')
  const failureCopy = view.error ? errorCopy(view.error.code) : undefined
  const unavailable = view.page?.availability === 'Unavailable'
  const feedbackText = actionFeedback(view)
  const recoveryAction = changed ? 'Refresh' : failureCopy ? failureCopy.action === 'Refresh history' ? 'Refresh' : 'Retry' : busy && view.feedback ? view.feedback.action : view.phase === 'Ready' && !unavailable ? 'Refresh' : 'Retry'
  return <section className="selected-task-history" aria-label="Selected task transition history">
    <button type="button" className="quiet" aria-expanded={view.phase !== 'Closed'} aria-controls={regionId} onClick={() => view.phase === 'Closed' ? void load() : hide()}>{view.phase === 'Closed' ? 'Show history' : 'Hide history'}</button>
    {view.phase !== 'Closed' && <div id={regionId} className="selected-history-content" aria-busy={busy}>
      <h4>Task history</h4>
      <p className="muted">Recorded changes. The current task status is shown above.</p>
      {changed ? <p role="status">History has changed—refresh to view a consistent version.</p> : <>
        {busy && !view.feedback && <p role="status">Loading recorded transitions…</p>}
        {feedbackText && <p role="status" aria-live="polite" aria-atomic="true" data-history-read-feedback>{feedbackText}</p>}
        {failureCopy ? <p role="alert"><strong>{failureCopy.title}</strong>{failureCopy.explanation && <><br />{failureCopy.explanation}</>}</p>
          : unavailable ? <p role="status"><strong>History unavailable.</strong><br />This project contains no accessible recorded history for this task.</p>
            : view.page && !busy && !view.rows.length && <p>No recorded history for this task.</p>}
        {view.page?.availability === 'Available' && <p className="history-coverage">Some earlier history may be unavailable</p>}
        <ol className="selected-history-rows">{view.rows.map(row => <HistoryEntry key={row.event.eventId} row={row} />)}</ol>
        {view.phase === 'Ready' && view.page?.availability === 'Available' && (view.page.nextCursor
          ? <button type="button" className="quiet" onClick={() => void load(true)}>Load more history</button>
          : !!view.rows.length && <p>No more recorded entries.</p>)}
        {safeFallback && !view.fallback && <button type="button" className="quiet" onClick={() => setView(previous => ({ ...previous, fallback: true }))}>Show loaded legacy history</button>}
        {view.fallback && <div><p role="status">Showing the original loaded history without paging. Earlier or unrecorded changes may be unavailable.</p>{fallback}</div>}
      </>}
      {(changed || view.phase === 'Failed' || unavailable || view.feedback) && <button type="button" className="quiet" aria-disabled={busy} onClick={() => void load(false, recoveryAction)}>{recoveryAction === 'Refresh' ? 'Refresh history' : 'Retry reading history'}</button>}
      <HistoryDetails page={changed ? undefined : view.page} session={changed ? undefined : view.session} rows={changed ? [] : view.rows} error={changed ? undefined : view.error} changed={changed} />
    </div>}
  </section>
}
