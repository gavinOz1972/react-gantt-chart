import { useEffect, useRef } from 'react'
import type { ScheduleError, ScheduledTask, TaskInput } from '../domain'
import type { TaskDraft } from './projectEntry'
import { FieldError } from './EntryErrors'

export function TaskEditor({ draft, isNew, tasks, projectStartDate, scheduled, errors, linkError, optionError, onChange, onToggle, onSave, onCancel }: {
  draft: TaskDraft; isNew: boolean; tasks: readonly TaskInput[]; projectStartDate: string
  scheduled?: ScheduledTask; errors: readonly ScheduleError[]; linkError: string
  optionError: (id: string) => string | undefined
  onChange: (draft: TaskDraft) => void; onToggle: (id: string) => void; onSave: () => void; onCancel: () => void
}) {
  const nameInput = useRef<HTMLInputElement>(null)
  useEffect(() => { nameInput.current?.focus() }, [])
  const fieldError = (field: string) => <FieldError errors={errors} field={field} taskId={draft.taskId} id={`task-${field}-error`} />
  const invalid = (field: string) => errors.some(error => error.taskId === draft.taskId && error.field.split('/').includes(field))
  const independent = !draft.predecessorTaskIds.length
  return <section className="panel editor" aria-labelledby="task-editor-heading">
    <div className="section-heading"><div><span className="eyebrow">Task details</span><h2 id="task-editor-heading">{isNew ? 'Add task' : 'Edit task'} <span className="task-id">{draft.taskId}</span></h2></div>
      <span className="preview-label">Live preview</span></div>
    <p className="muted">Dates preview as you edit. Save to keep your changes, or Cancel to return to your saved tasks.</p>
    <form noValidate onSubmit={event => { event.preventDefault(); onSave() }}>
      <div className="editor-fields">
        <label>Task name<input ref={nameInput} value={draft.name} onChange={event => onChange({ ...draft, name: event.target.value })}
          aria-invalid={invalid('name')} aria-describedby="task-name-error" />{fieldError('name')}</label>
        <label>Estimated duration (hours)<input type="number" min="1" step="1" value={draft.durationHours}
          onChange={event => onChange({ ...draft, durationHours: event.target.value })} aria-invalid={invalid('durationHours')} aria-describedby="task-durationHours-error" />{fieldError('durationHours')}</label>
        <label className="wide">Description<textarea rows={2} value={draft.description} onChange={event => onChange({ ...draft, description: event.target.value })} /></label>
        <div className="wide">
          <details className="dependency-picker"><summary>Predecessors ({draft.predecessorTaskIds.length} selected)</summary>
            <fieldset><legend className="sr-only">Choose predecessor tasks</legend>
              {!tasks.length && <p className="muted">Save another task first to add a predecessor.</p>}
              {tasks.map(task => {
                const checked = draft.predecessorTaskIds.includes(task.taskId)
                const problem = task.taskId === draft.taskId ? 'A task cannot depend on itself.' : checked ? undefined : optionError(task.taskId)
                return <label className="dependency-option" key={task.taskId}>
                  <input type="checkbox" checked={checked} disabled={!!problem} onChange={() => onToggle(task.taskId)}
                    aria-describedby={problem ? `dependency-${task.taskId}-reason` : undefined} />
                  <span>{task.taskId} — {task.name}{problem && <small id={`dependency-${task.taskId}-reason`}>{problem}</small>}</span>
                </label>
              })}
            </fieldset>
          </details>
          <p className="selected-dependencies">{draft.predecessorTaskIds.length ? draft.predecessorTaskIds.map(id => `${id} — ${tasks.find(task => task.taskId === id)?.name ?? id}`).join('; ') : 'No predecessors. This task can start independently.'}</p>
          {linkError && <p className="field-error" role="alert">{linkError}</p>}
        </div>
        {independent ? <div className="wide start-fields">
          <label>Independent start date<input type="date" value={draft.independentStartMode === 'MANUAL' ? draft.requestedStartDate : projectStartDate}
            onChange={event => onChange({ ...draft, independentStartMode: 'MANUAL', requestedStartDate: event.target.value })}
            aria-invalid={invalid('requestedStartDate')} aria-describedby="task-requestedStartDate-error start-mode-help" />{fieldError('requestedStartDate')}</label>
          <button type="button" className="quiet" onClick={() => onChange({ ...draft, independentStartMode: 'DEFAULT', requestedStartDate: '' })}>Reset to Project Start</button>
          <p className="muted wide" id="start-mode-help">{draft.independentStartMode === 'DEFAULT' ? 'Following project start. Changing the project start will move this task.' : 'Manual date. This choice is retained when the project start changes.'} Nonworking dates advance to the next working day.</p>
        </div> : <div className="wide calculated-start">
          <span className="field-label">Calculated Start</span><output aria-label="Calculated Start">{scheduled ? `${scheduled.startDate} · hour ${scheduled.startSlot.hour}` : 'Unavailable — correct the entries above'}</output>
          <p className="muted">Starts after all selected predecessors finish. The start date is read-only.</p>
          {draft.independentStartMode === 'MANUAL' && <p className="muted">Retained independent date: {draft.requestedStartDate}. It will apply again if you remove all predecessors.</p>}
          <button type="button" className="quiet" onClick={() => onChange({ ...draft, independentStartMode: 'DEFAULT', requestedStartDate: '' })}>Reset to Project Start</button>
        </div>}
      </div>
      <div className="form-actions"><button type="submit" disabled={errors.length > 0}>Save task</button><button type="button" className="quiet" onClick={onCancel}>Cancel</button></div>
    </form>
  </section>
}
