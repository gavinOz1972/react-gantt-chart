import { useEffect, useState } from 'react'
import type { TaskInput } from '../../domain'
import { latestCompletion, progressForTask } from '../../progress/taskProgress'
import type { CompletionCriterion, ProgressTracking, TaskStatus } from '../../progress/taskProgress'
import { TaskStatusControl } from './TaskStatusControl'
import type { TaskHealth } from '../../progress/healthPresentation'
import { TaskHealthBadge } from './HealthBadge'

interface CriterionDraft { criterionId?: string; text: string; error?: string }
export function TaskStatusPanel({ task, tracking, disabled, statusDisabled, onRequest, onCriteria, onDraftChange, onSelect, health }: {
  task?: TaskInput; tracking: ProgressTracking; disabled: boolean; statusDisabled: boolean
  onRequest: (task: TaskInput, target: TaskStatus, trigger: HTMLElement) => void
  onCriteria: (taskId: string, criteria: readonly CompletionCriterion[]) => string | undefined
  onDraftChange: (dirty: boolean) => void; onSelect: (id: string) => void
  health?: TaskHealth
}) {
  const [drafts, setDrafts] = useState<Record<string, CriterionDraft>>({})
  const [notice, setNotice] = useState('')
  const dirty = Object.keys(drafts).length > 0
  useEffect(() => { onDraftChange(dirty) }, [dirty, onDraftChange])
  const current = task ? progressForTask(tracking, task.taskId) : undefined
  const draft = task && Object.hasOwn(drafts, task.taskId) ? drafts[task.taskId] : undefined
  const completion = task ? latestCompletion(tracking, task.taskId) : undefined
  const events = tracking.events.filter(event => event.taskId === task?.taskId)
  function cancel() { if (task) setDrafts(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => id !== task.taskId))) }
  function update(items: readonly CompletionCriterion[]) { if (!task) return; const problem = onCriteria(task.taskId, items); setNotice(problem ?? 'Completion checklist updated.'); return problem }
  function save() {
    if (!task || !draft || !current || disabled) return
    const item = { criterionId: draft.criterionId ?? `C-${crypto.randomUUID()}`, text: draft.text, checked: draft.criterionId ? current.criteria.find(item => item.criterionId === draft.criterionId)?.checked ?? false : false }
    const items = draft.criterionId ? current.criteria.map(entry => entry.criterionId === draft.criterionId ? item : entry) : [...current.criteria, item]
    const problem = update(items)
    if (problem) setDrafts(previous => ({ ...previous, [task.taskId]: { ...draft, error: problem } }))
    else cancel()
  }
  return <section className="task-status-panel" aria-labelledby="task-status-heading">
    <h3 id="task-status-heading">Status & completion</h3>
    {Object.keys(drafts).filter(id => id !== task?.taskId).map(id => <button type="button" className="quiet" key={id} onClick={() => onSelect(id)}>Resume criterion edit for {id}</button>)}
    {!task || !current ? <p className="muted">Select a saved task to manage status and completion criteria.</p> : <>
      <div className="task-status-summary"><strong>{task.taskId} — {task.name}</strong>{health && <TaskHealthBadge health={health} />}<label>Status<TaskStatusControl taskId={task.taskId} value={current.status} context="details" disabled={statusDisabled} onRequest={(target, trigger) => onRequest(task, target, trigger)} /></label>
        {current.status !== 'Complete' ? <button type="button" disabled={statusDisabled} onClick={event => onRequest(task, 'Complete', event.currentTarget)}>Mark Complete</button>
          : <button type="button" className="quiet" disabled={statusDisabled} onClick={event => onRequest(task, 'In Progress', event.currentTarget)}>Reopen task</button>}</div>
      {current.blockedReason && <p className="active-blocked-reason"><strong>Blocked reason:</strong> {current.blockedReason}</p>}
      {completion && <p className="completion-date"><strong>{current.status === 'Complete' ? 'Completed on' : 'Latest completion'}:</strong> <time dateTime={completion.date}>{completion.date}</time></p>}
      <p className="muted">Status changes are deliberate. Work hours and zero remaining effort do not complete a task.</p>
      <h4>Completion criteria</h4>
      {current.status === 'Complete' && <p className="muted">Reopen this task to revise its checklist. Past completion snapshots remain read-only.</p>}
      {!current.criteria.length ? <p className="muted">No formal completion criteria recorded.</p> : <ul className="task-criteria-list">{current.criteria.map(item => <li key={item.criterionId} data-criterion-id={item.criterionId}>
        <label><input type="checkbox" aria-label={`Criterion: ${item.text}`} checked={item.checked} disabled={disabled || current.status === 'Complete' || !!draft} onChange={event => update(current.criteria.map(entry => entry.criterionId === item.criterionId ? { ...entry, checked: event.target.checked } : entry))} /><span>{item.text}</span></label>
        <div><button type="button" className="quiet" disabled={disabled || current.status === 'Complete' || !!draft} aria-label={`Edit criterion ${item.criterionId}`} onClick={() => setDrafts(previous => ({ ...previous, [task.taskId]: { criterionId: item.criterionId, text: item.text } }))}>Edit criterion</button>
          <button type="button" className="danger-text" disabled={disabled || current.status === 'Complete' || !!draft} aria-label={`Delete criterion ${item.criterionId}`} onClick={() => update(current.criteria.filter(entry => entry.criterionId !== item.criterionId))}>Delete criterion</button></div>
      </li>)}</ul>}
      {!draft ? <button type="button" className="quiet" disabled={disabled || current.status === 'Complete'} onClick={() => setDrafts(previous => ({ ...previous, [task.taskId]: { text: '' } }))}>Add criterion</button>
        : <form className="criterion-form" noValidate onSubmit={event => { event.preventDefault(); save() }}>
          <label>Completion criterion<textarea aria-label="Completion criterion" autoFocus rows={2} value={draft.text} disabled={disabled} aria-describedby="criterion-help" onChange={event => setDrafts(previous => ({ ...previous, [task.taskId]: { ...draft, text: event.target.value, error: '' } }))} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); cancel() } }} /></label>
          <small id="criterion-help">Describe observable completion, 3–500 characters.</small>
          <div className="form-actions"><button type="submit" disabled={disabled}>Save criterion</button><button type="button" className="quiet" onClick={cancel}>Cancel criterion</button></div>
          {draft.error && <p role="alert" className="field-error">{draft.error}</p>}
        </form>}
      <details className="status-history"><summary>Transition history ({events.length})</summary>
        <p className="muted">Read-only records of deliberate decisions. These local records do not verify identity or provide a tamper-proof audit trail.</p>
        {!events.length ? <p>No status events recorded.</p> : <ol>{[...events].reverse().map(event => <li key={event.eventId} data-status-event={event.eventId}>
          <strong><time dateTime={event.date}>{event.date}</time> · {event.fromStatus} → {event.toStatus}</strong>
          {event.reason && <p>Reason: {event.reason}</p>}{event.note && <p>Note / evidence: {event.note}</p>}
          {event.committedFinishDateAtCompletion && <p>Committed finish at completion: {event.committedFinishDateAtCompletion}</p>}
          {event.criteriaSnapshot && <><p>Completion criteria attested:</p>{event.criteriaSnapshot.length ? <ul>{event.criteriaSnapshot.map(item => <li key={item.criterionId}>{item.text} — satisfied</li>)}</ul> : <p>No formal criteria were recorded; explicitly acknowledged at completion.</p>}
            {event.definitionOfDone && <p>Project guidance at completion: {event.definitionOfDone}</p>}</>}
          <small>Event {event.eventId} · Recorded {event.recordedAt}</small>
        </li>)}</ol>}
      </details>
    </>}
    <p className="save-notice" role="status">{notice}</p>
  </section>
}
