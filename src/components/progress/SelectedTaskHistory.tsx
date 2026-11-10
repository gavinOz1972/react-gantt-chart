import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { HISTORY_MAX_BYTES, HISTORY_PAGE_SIZE, sameHistoryWatermark } from '../../history/selectedTaskHistory'
import type { HistoryFailure, HistoryPage, HistorySession, SelectedTaskHistoryReader, TransitionRow } from '../../history/selectedTaskHistory'
import './selectedTaskHistory.css'

interface View {
  reader?: SelectedTaskHistoryReader; phase: 'Closed' | 'Loading' | 'Ready' | 'Failed'
  page?: HistoryPage; rows: readonly TransitionRow[]; error?: HistoryFailure; fallback?: boolean; canFallback?: boolean
}
const closed: View = { phase: 'Closed', rows: [] }
export function SelectedTaskHistory({ taskId, reader, fallback }: { taskId: string; reader: SelectedTaskHistoryReader; fallback: ReactNode }) {
  const regionId = useId(), [view, setView] = useState<View>(closed)
  const active = useRef<{ reader: SelectedTaskHistoryReader; session: HistorySession } | null>(null)
  const pending = useRef<AbortController | null>(null), generation = useRef(0)
  function stop() {
    generation.current++; pending.current?.abort(); pending.current = null
    if (active.current) { active.current.reader.release(active.current.session); active.current = null }
  }
  useEffect(() => () => {
    generation.current++; pending.current?.abort(); pending.current = null
    if (active.current) { active.current.reader.release(active.current.session); active.current = null }
  }, [reader])
  const changed = view.phase !== 'Closed' && view.reader !== reader
  const busy = view.phase === 'Loading' && !changed
  async function load(more = false) {
    if (busy) return
    if (!more) stop()
    const controller = new AbortController(), requestId = ++generation.current
    pending.current = controller
    const previous = more ? view.rows : [], cursor = more ? view.page?.nextCursor : undefined
    setView({ reader, phase: 'Loading', rows: previous, page: more ? view.page : undefined })
    const current = () => !controller.signal.aborted && generation.current === requestId
    try {
      let session = more ? active.current?.session : undefined
      if (!session) {
        const opened = await reader.open(taskId, controller.signal)
        if (!current()) { if (opened.kind === 'Opened') reader.release(opened.session); return }
        if (opened.kind === 'Failure') { setView({ reader, phase: 'Failed', rows: previous, error: opened }); return }
        session = opened.session; active.current = { reader, session }
      }
      const page = await reader.read(session, { cursor, limit: HISTORY_PAGE_SIZE, maxBytes: HISTORY_MAX_BYTES }, controller.signal)
      if (!current()) return
      if (page.kind === 'Failure') { setView({ reader, phase: 'Failed', rows: previous, error: page, canFallback: true }); return }
      if (!sameHistoryWatermark(page.watermark, session.watermark) || page.taskId !== taskId || page.items.some(r => r.taskId !== taskId || r.event.taskId !== taskId) || page.items.length > HISTORY_PAGE_SIZE || page.deliveredBytes > HISTORY_MAX_BYTES || page.items.some((r, i) => i ? r.sequence >= page.items[i - 1].sequence : previous.length > 0 && r.sequence >= previous[previous.length - 1].sequence)) {
        setView({ reader, phase: 'Failed', rows: [], error: { kind: 'Failure', code: 'MixedWatermark', message: 'These rows do not belong to the same selected-task read. Refresh history; no revisions were combined.' } }); return
      }
      setView({ reader, phase: 'Ready', rows: [...previous, ...page.items], page, canFallback: true })
    } catch {
      if (current()) setView({ reader, phase: 'Failed', rows: previous, canFallback: !!active.current, error: { kind: 'Failure', code: 'Unsupported', message: 'History could not be read. Your loaded plan is unchanged.' } })
    } finally { if (current()) pending.current = null }
  }
  function hide() { stop(); setView(closed) }
  const safeFallback = view.canFallback && (view.error && ['Unsupported', 'ReadExpired', 'RecordTooLarge'].includes(view.error.code) || view.page?.availability === 'Unavailable')
  return <section className="selected-task-history" aria-label="Selected task transition history">
    <button type="button" className="quiet" aria-expanded={view.phase !== 'Closed'} aria-controls={regionId} onClick={() => view.phase === 'Closed' ? void load() : hide()}>{view.phase === 'Closed' ? 'Show history' : 'Hide history'}</button>
    {view.phase !== 'Closed' && <div id={regionId} className="selected-history-content" aria-busy={busy}>
      <h4>Recorded transition history</h4>
      <p className="muted">Historical decisions, not current status. Actor identity and separate decision IDs are Unknown in legacy records. These records do not verify identity or provide a tamper-proof audit trail.</p>
      {changed ? <p role="status">The loaded source changed. Refresh history to read the current source; previous pages were discarded.</p> : <>
        {busy && <p role="status">Loading recorded transitions…</p>}
        {view.page && <>
          <p className="history-coverage"><strong>Partial coverage.</strong> {view.page.coverage.reason}</p>
          <p className="muted">Source: loaded legacy plan. Format {view.page.source.formatVersion}, progress version 1. Pages belong to one pinned in-memory read.</p>
          {view.page.availability === 'Unavailable' ? <p role="status">History unavailable: this older source did not retain task status history. An empty view does not prove that no decisions occurred.</p>
            : !busy && !view.rows.length && <p>No matching recorded transitions in this loaded source.</p>}
        </>}
        {view.error && <p role="alert">{view.error.code === 'Cancelled' ? 'History request cancelled. Refresh history to try again.' : view.error.message}</p>}
        <ol className="selected-history-rows">{view.rows.map(row => <li key={row.event.eventId} data-history-event={row.event.eventId}>
          <strong>Recorded transition: {row.event.fromStatus} → {row.event.toStatus}</strong>
          <dl><div><dt>Effective date</dt><dd><time dateTime={row.event.date}>{row.event.date}</time> (date only; time Unknown)</dd></div>
            <div><dt>Recorded time</dt><dd><time dateTime={row.event.recordedAt}>{row.event.recordedAt}</time></dd></div>
            <div><dt>Event ID / source position</dt><dd>{row.event.eventId} / {row.sequence}</dd></div>
            <div><dt>Decision ID / actor</dt><dd>Unknown / Unknown</dd></div></dl>
          {row.event.reason !== undefined && <p>Reason: {row.event.reason}</p>}
          {row.event.note !== undefined && <p>Note / evidence: {row.event.note}</p>}
          {row.event.toStatus === 'Complete' && <>
            <p>Historical completion acknowledgement: recorded. {row.event.noCriteriaAcknowledged === true && 'No formal criteria explicitly acknowledged.'}</p>
            <p>Committed finish at completion: {row.event.committedFinishDateAtCompletion ?? 'Unknown'}</p>
            <p>Project guidance at completion: {row.event.definitionOfDone === '' ? '(empty wording recorded)' : row.event.definitionOfDone ?? 'Unknown'}</p>
            {!!row.event.criteriaSnapshot?.length && <ul>{row.event.criteriaSnapshot.map(c => <li key={c.criterionId}>Criterion {c.criterionId}: {c.text} — satisfied</li>)}</ul>}
          </>}
        </li>)}</ol>
        {view.phase === 'Ready' && view.page?.availability === 'Available' && (view.page.nextCursor
          ? <button type="button" className="quiet" onClick={() => void load(true)}>Load more history</button>
          : <p>End of retained status history for this task; earlier or unrecorded decisions remain Unknown.</p>)}
        {safeFallback && !view.fallback && <button type="button" className="quiet" onClick={() => setView(previous => ({ ...previous, fallback: true }))}>Show loaded legacy history</button>}
        {view.fallback && <div><p role="status">Fallback: original already loaded legacy history. This is an unpaged local display, not a new fetch or proof of complete history.</p>{fallback}</div>}
      </>}
      {(changed || view.phase === 'Failed' || view.page?.availability === 'Unavailable') && <button type="button" className="quiet" onClick={() => void load()}>Refresh history</button>}
    </div>}
  </section>
}
