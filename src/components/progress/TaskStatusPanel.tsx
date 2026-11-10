import { useEffect, useMemo, useState } from 'react'
import type { TaskInput } from '../../domain'
import { latestCompletion, progressForTask } from '../../progress/taskProgress'
import type { CompletionCriterion, ProgressTracking, TaskStatus } from '../../progress/taskProgress'
import { TaskStatusControl } from './TaskStatusControl'
import type { TaskHealth } from '../../progress/healthPresentation'
import { TaskHealthBadge } from './HealthBadge'
import { LegacyTaskHistory } from './LegacyTaskHistory'
import { SelectedTaskHistory } from './SelectedTaskHistory'
import { createLoadedTaskHistoryReader } from '../../history/selectedTaskHistory'
import { selectedTaskHistoryEnabled } from '../../history/featureFlag'

interface CriterionDraft { criterionId?: string; text: string; error?: string }
export function TaskStatusPanel({ task, tracking, disabled, statusDisabled, onRequest, onCriteria, onDraftChange, onSelect, health, historyContext }: {
  task?: TaskInput; tracking: ProgressTracking; disabled: boolean; statusDisabled: boolean
  onRequest: (task: TaskInput, target: TaskStatus, trigger: HTMLElement) => void
  onCriteria: (taskId: string, criteria: readonly CompletionCriterion[]) => string | undefined
  onDraftChange: (dirty: boolean) => void; onSelect: (id: string) => void
  health?: TaskHealth
  historyContext?: { resourceId: string; formatVersion: 1 | 2 | 3 | 4 | 5; tasks: readonly TaskInput[] }
}) {
  const [drafts, setDrafts] = useState<Record<string, CriterionDraft>>({})
  const [notice, setNotice] = useState('')
  const dirty = Object.keys(drafts).length > 0
  useEffect(() => { onDraftChange(dirty) }, [dirty, onDraftChange])
  const current = task ? progressForTask(tracking, task.taskId) : undefined
  const draft = task && Object.hasOwn(drafts, task.taskId) ? drafts[task.taskId] : undefined
  const completion = task ? latestCompletion(tracking, task.taskId) : undefined
  const historyEnabled = selectedTaskHistoryEnabled()
  const resourceId = historyContext?.resourceId, formatVersion = historyContext?.formatVersion, historyTasks = historyContext?.tasks
  const historyReader = useMemo(() => historyEnabled && resourceId && formatVersion && historyTasks
    ? createLoadedTaskHistoryReader({ resourceId, formatVersion, taskIds: historyTasks.map(t => t.taskId), tracking }) : undefined,
  [historyEnabled, resourceId, formatVersion, historyTasks, tracking])
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
      {historyReader ? <SelectedTaskHistory key={`${resourceId}:${task.taskId}`} taskId={task.taskId} reader={historyReader} fallback={<LegacyTaskHistory taskId={task.taskId} tracking={tracking} open />} />
        : <LegacyTaskHistory taskId={task.taskId} tracking={tracking} />}
    </>}
    <p className="save-notice" role="status">{notice}</p>
  </section>
}
