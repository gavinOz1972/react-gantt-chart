import { useEffect, useRef } from 'react'
import type { TaskInput } from '../domain'

export function DeleteTaskDialog({ task, affected, error, workEntryCount = 0, hasRemainingEstimate = false, statusEventCount = 0, criterionCount = 0, onConfirm, onCancel }: {
  task: TaskInput; affected: readonly TaskInput[]; error: string; onConfirm: () => void; onCancel: () => void
  workEntryCount?: number; hasRemainingEstimate?: boolean
  statusEventCount?: number; criterionCount?: number
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    cancel.current?.focus()
    return () => element.close()
  }, [])
  return <dialog ref={dialog} aria-labelledby="delete-task-heading" onCancel={event => { event.preventDefault(); onCancel() }}>
    <h2 id="delete-task-heading">Delete {task.taskId} — {task.name}?</h2>
    <p>This removes the task from this project.</p>
    {(statusEventCount > 0 || criterionCount > 0) && <p className="work-deletion-warning">This also removes its current status, {criterionCount} criteria and {statusEventCount} status/completion history records. Export JSON before deleting if you need to retain this history. The approved baseline remains unchanged.</p>}
    {(workEntryCount > 0 || hasRemainingEstimate) && <p className="work-deletion-warning"><strong>This also removes {workEntryCount} work {workEntryCount === 1 ? 'entry' : 'entries'}{hasRemainingEstimate ? ' and its remaining-effort estimate' : ''} for {task.taskId}.</strong> Export JSON first if you need to keep this work history. Other tasks’ work and any original baseline remain unchanged.</p>}
    {affected.length ? <><p>The following predecessor links will also be removed. These tasks will be kept and recalculated:</p>
      <ul>{affected.map(entry => <li key={entry.taskId}>{entry.taskId} — {entry.name}: remove predecessor {task.taskId}</li>)}</ul></> : <p>No other task depends on it.</p>}
    {error && <p role="alert" className="field-error">{error}</p>}
    <div className="form-actions"><button ref={cancel} type="button" className="quiet" onClick={onCancel}>Keep task</button>
      <button type="button" className="danger" onClick={onConfirm}>{affected.length ? 'Delete task and remove links' : 'Delete task'}</button></div>
  </dialog>
}
