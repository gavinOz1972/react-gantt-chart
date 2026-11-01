import { useEffect, useRef, useState } from 'react'
import type { TaskInput } from '../domain'
import type { Baseline } from '../baseline/baseline'
import { chronologicalEntries, CONTRIBUTOR_LIMIT, effortSummary, entryFromDraft, formatEffort, futureWorkWarning, parseEffort, WORK_DESCRIPTION_LIMIT } from '../workTracking/workTracking'
import type { WorkDraft, WorkEntry, WorkTracking } from '../workTracking/workTracking'
import { ConfirmDialog } from './ConfirmDialog'

interface EntryForm extends WorkDraft { entryId?: string; error?: string }
function today() {
  const date = new Date()
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function TaskWorkPanel({ task, tracking, baseline, disabled, onChange, onDraftChange, onSelect }: {
  task?: TaskInput; tracking: WorkTracking; baseline?: Baseline; disabled: boolean
  onChange: (value: WorkTracking) => string | undefined; onDraftChange: (dirty: boolean) => void; onSelect: (id: string) => void
}) {
  const [drafts, setDrafts] = useState<Record<string, EntryForm>>({})
  const [remainingDrafts, setRemainingDrafts] = useState<Record<string, string>>({})
  const [remainingErrors, setRemainingErrors] = useState<Record<string, string>>({})
  const [deleting, setDeleting] = useState<WorkEntry | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')
  const addButton = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLButtonElement | null>(null)
  const pendingIds = [...new Set([...Object.keys(drafts), ...Object.keys(remainingDrafts)])]
  const dirty = pendingIds.length > 0
  useEffect(() => { onDraftChange(dirty) }, [dirty, onDraftChange])
  const id = task?.taskId
  const draft = id && Object.hasOwn(drafts, id) ? drafts[id] : undefined
  const hasRemainingDraft = !!id && Object.hasOwn(remainingDrafts, id)
  const remainingError = id && Object.hasOwn(remainingErrors, id) ? remainingErrors[id] : ''
  const summary = id ? effortSummary(tracking, id, baseline) : undefined
  const entries = id ? chronologicalEntries(tracking, id) : []
  function clearEntry(taskId: string) { setDrafts(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== taskId))) }
  function clearRemaining(taskId: string) {
    setRemainingDrafts(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== taskId)))
    setRemainingErrors(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== taskId)))
  }
  function restoreFocus() { requestAnimationFrame(() => (returnFocus.current?.isConnected ? returnFocus.current : addButton.current)?.focus()) }
  function cancelEntry() { if (id) clearEntry(id); setNotice('Work entry changes cancelled.'); restoreFocus() }
  function changeDraft(change: Partial<EntryForm>) { if (id && draft) setDrafts(previous => ({ ...previous, [id]: { ...draft, ...change, error: change.error ?? '' } })) }
  function saveEntry() {
    if (!id || !draft || disabled) return
    const previous = draft.entryId ? tracking.entries.find(entry => entry.entryId === draft.entryId) : undefined
    const created = entryFromDraft(draft, id, `W-${crypto.randomUUID()}`, new Date().toISOString(), previous)
    if (!created.ok) { changeDraft({ error: created.errors.map(error => error.message).join(' ') }); return }
    const next = previous ? tracking.entries.map(entry => entry.entryId === previous.entryId ? created.value : entry) : [...tracking.entries, created.value]
    const problem = onChange({ ...tracking, entries: next })
    if (problem) { setDrafts(current => ({ ...current, [id]: { ...draft, error: problem } })); return }
    clearEntry(id); setNotice(previous ? 'Work entry updated. Totals recalculated.' : 'Work entry added. Totals recalculated.'); restoreFocus()
  }
  function saveRemaining() {
    if (!id || !hasRemainingDraft || disabled) return
    const parsed = parseEffort(remainingDrafts[id], true)
    const problem = parsed.ok ? onChange({ ...tracking, remainingHours: { ...tracking.remainingHours, [id]: parsed.value } }) : parsed.errors.map(error => error.message).join(' ')
    if (problem) { setRemainingErrors(previous => ({ ...previous, [id]: problem })); return }
    clearRemaining(id); setNotice('Remaining effort estimate saved. Zero does not mark the task complete.')
  }
  const warning = draft ? futureWorkWarning(draft.workDate, today()) : undefined
  return <section className="work-panel" aria-labelledby="work-heading">
    <div className="section-heading"><div><h3 id="work-heading">Work & effort</h3><p className="muted">Record effort in person-hours. Scheduled working time and dates stay independent.</p></div>
      {task && <button ref={addButton} type="button" disabled={disabled || !!draft} onClick={event => {
        returnFocus.current = event.currentTarget; setNotice('')
        setDrafts(previous => ({ ...previous, [task.taskId]: { workDate: today(), contributor: '', hours: '', description: '' } }))
      }}>Add work entry</button>}</div>
    {pendingIds.length > 0 && <div className="work-pending"><p className="muted">Unsubmitted effort edits are kept per task. Finish or cancel them before saving the project.</p>
      {pendingIds.filter(taskId => taskId !== id).map(taskId => <button key={taskId} type="button" className="quiet" onClick={() => onSelect(taskId)}>Resume edits for {taskId}</button>)}</div>}
    {!task || !summary ? <p className="muted">Select a saved task to record work and estimate remaining effort.</p> : <>
      <p className="work-task-identity"><strong>{task.taskId} — {task.name}</strong></p>
      <dl className="effort-summary">
        <div><dt>Actual effort</dt><dd data-effort="actual">{formatEffort(summary.actualHours)} h</dd></div>
        <div><dt>Remaining effort</dt><dd data-effort="remaining">{summary.remainingHours === null ? 'Unknown' : `${formatEffort(summary.remainingHours)} h`}</dd></div>
        <div><dt>Effort at completion</dt><dd data-effort="forecast">{summary.forecastHours === null ? 'Not available' : `${formatEffort(summary.forecastHours)} h`}</dd></div>
        <div><dt>Baseline estimate</dt><dd data-effort="baseline">{summary.baselineHours === null ? 'No baseline' : `${formatEffort(summary.baselineHours)} h`}</dd></div>
        <div><dt>Effort variance</dt><dd data-effort="variance">{summary.varianceHours === null ? 'Not available' : `${summary.varianceHours > 0 ? '+' : ''}${formatEffort(summary.varianceHours)} h`}</dd></div>
      </dl>
      <p className="muted">Effort at completion = actual + known remaining effort. Variance compares that total with this task’s original baseline estimate; positive means over estimate, negative means under. This is an effort comparison, not a predicted finish date.</p>
      {disabled && <p className="muted">Finish or cancel task/settings edits before changing work records.</p>}
      <form className="remaining-form" noValidate onSubmit={event => { event.preventDefault(); saveRemaining() }}>
        <label>Remaining effort (hours)<input type="text" inputMode="decimal" disabled={disabled} value={hasRemainingDraft ? remainingDrafts[id!] : summary.remainingHours === null ? '' : String(summary.remainingHours)} aria-describedby="remaining-help remaining-error" aria-invalid={!!remainingError}
          onChange={event => { setRemainingDrafts(previous => ({ ...previous, [id!]: event.target.value })); setRemainingErrors(previous => ({ ...previous, [id!]: '' })) }}
          onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); clearRemaining(id!) } }} /></label>
        <p id="remaining-help" className="muted">Leave blank for unknown. Zero explicitly estimates no effort remains; it does not mark the task Complete. Use at most two decimal places.</p>
        {hasRemainingDraft && <div className="form-actions"><button type="submit" disabled={disabled}>Save remaining estimate</button><button type="button" className="quiet" onClick={() => clearRemaining(id!)}>Cancel estimate</button></div>}
        <p id="remaining-error" className="field-error" role={remainingError ? 'alert' : undefined}>{remainingError}</p>
      </form>
      {draft && <form className="work-entry-form" noValidate aria-labelledby="work-entry-heading" onSubmit={event => { event.preventDefault(); saveEntry() }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); cancelEntry() } }}>
        <h4 id="work-entry-heading">{draft.entryId ? 'Edit work entry' : 'Add work entry'}</h4>
        <fieldset disabled={disabled}><div className="work-fields">
          <label>Contributor<input aria-label="Contributor" autoFocus value={draft.contributor} aria-describedby="contributor-help work-entry-error" onChange={event => changeDraft({ contributor: event.target.value })} /><small id="contributor-help">Project-local name, 1–{CONTRIBUTOR_LIMIT} characters.</small></label>
          <label>Work date<input aria-label="Work date" type="date" value={draft.workDate} aria-describedby="work-date-help work-entry-error" onChange={event => changeDraft({ workDate: event.target.value })} /><small id="work-date-help">Historical dates are allowed.</small></label>
          <label>Work hours<input aria-label="Work hours" type="text" inputMode="decimal" value={draft.hours} aria-describedby="work-hours-help work-entry-error" onChange={event => changeDraft({ hours: event.target.value })} /><small id="work-hours-help">Positive hours, up to two decimal places.</small></label>
          <label className="wide">Work performed<textarea aria-label="Work performed" value={draft.description} rows={3} aria-describedby="description-help work-entry-error" onChange={event => changeDraft({ description: event.target.value })} /><small id="description-help">Describe the work, 3–{WORK_DESCRIPTION_LIMIT} characters.</small></label>
        </div></fieldset>
        {warning && <p className="work-warning" role="status">{warning}</p>}
        {draft.error && <p id="work-entry-error" className="field-error" role="alert">{draft.error}</p>}
        <div className="form-actions"><button type="submit" disabled={disabled}>Save work entry</button><button type="button" className="quiet" onClick={cancelEntry}>Cancel work entry</button></div>
      </form>}
      <h4>Work sessions</h4>
      <p className="muted">Oldest work date first. Entries can be corrected; contributor names are not verified identities.</p>
      {!entries.length ? <p className="muted">No work entries yet.</p> : <ol className="work-log">{entries.map(entry => <li key={entry.entryId} data-work-entry={entry.entryId}>
        <div className="work-log-heading"><strong><time dateTime={entry.workDate}>{entry.workDate}</time> · {entry.contributor} · {formatEffort(entry.hours)} h</strong>
          <div className="work-log-actions"><button type="button" className="quiet" disabled={disabled || !!draft} aria-label={`Edit work entry ${entry.entryId}`} onClick={event => {
            returnFocus.current = event.currentTarget; setNotice(''); setDrafts(previous => ({ ...previous, [id!]: { entryId: entry.entryId, contributor: entry.contributor, workDate: entry.workDate, hours: String(entry.hours), description: entry.description } }))
          }}>Edit entry</button><button type="button" className="danger-text" disabled={disabled || !!draft} aria-label={`Delete work entry ${entry.entryId}`} onClick={event => { returnFocus.current = event.currentTarget; setDeleteError(''); setDeleting(entry) }}>Delete entry</button></div>
        </div><p>{entry.description}</p>{futureWorkWarning(entry.workDate, today()) && <p className="work-warning">Future work date — check this entry.</p>}
      </li>)}</ol>}
    </>}
    <p role="status" className="save-notice">{notice}</p>
    {deleting && <ConfirmDialog title="Delete work entry?" confirmLabel="Delete work entry" onCancel={() => { setDeleting(null); restoreFocus() }} onConfirm={() => {
      const problem = onChange({ ...tracking, entries: tracking.entries.filter(entry => entry.entryId !== deleting.entryId) })
      if (problem) { setDeleteError(problem); return }
      setDeleting(null); setNotice('Work entry deleted. Totals recalculated.'); restoreFocus()
    }}><p>Remove {formatEffort(deleting.hours)} h by {deleting.contributor} on {deleting.workDate} from {deleting.taskId}? Actual effort and effort comparisons will be recalculated.</p><p>{deleting.description}</p>{deleteError && <p role="alert">{deleteError}</p>}</ConfirmDialog>}
  </section>
}
