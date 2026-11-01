import { useState } from 'react'
import type { TaskInput } from '../../domain'
import type { CompletionCriterion, TaskProgress, TaskStatus, TransitionRequest } from '../../progress/taskProgress'
import { ConfirmDialog } from '../ConfirmDialog'

import { localDate } from './localDate'

export function StatusTransitionDialog({ task, current, target, definitionOfDone, onCommit, onCancel }: {
  task: TaskInput; current: TaskProgress; target: TaskStatus; definitionOfDone: string
  onCommit: (request: TransitionRequest) => string | undefined; onCancel: () => void
}) {
  const [date, setDate] = useState(localDate)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<readonly CompletionCriterion[]>(() => current.criteria.map(item => ({ ...item })))
  const [ack, setAck] = useState(false)
  const [noCriteriaAck, setNoCriteriaAck] = useState(false)
  const [error, setError] = useState('')
  const completing = target === 'Complete'
  const reopening = current.status === 'Complete'
  const unchecked = items.some(item => !item.checked)
  function submit() {
    const problem = onCommit({ target, eventId: `E-${crypto.randomUUID()}`, date: completing ? date : localDate(), recordedAt: new Date().toISOString(), reason, note,
      ...(completing ? { criteria: items, completionAcknowledged: ack, noCriteriaAcknowledged: noCriteriaAck } : {}), reopenAcknowledged: reopening })
    if (problem) setError(problem)
  }
  return <ConfirmDialog title={completing ? `Mark ${task.taskId} Complete?` : reopening ? `Reopen ${task.taskId} to ${target}?` : `Block ${task.taskId}?`}
    confirmLabel={completing ? 'Confirm completion' : reopening ? 'Reopen task' : 'Set Blocked'} confirmDisabled={completing && (unchecked || !ack || (!items.length && !noCriteriaAck))} onConfirm={submit} onCancel={onCancel}>
    <p><strong>{task.name}</strong> · {current.status} → {target}</p>
    {completing ? <>
      <label>Effective completion date<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
      {date > localDate() && <p className="work-warning">This completion date is in the future. Check it before confirming.</p>}
      {definitionOfDone && <div className="completion-guidance"><strong>Project Definition of Done</strong><p>{definitionOfDone}</p></div>}
      {items.length ? <fieldset className="completion-checklist"><legend>Completion criteria</legend>{items.map(item => <label key={item.criterionId}><input type="checkbox" checked={item.checked} onChange={event => setItems(previous => previous.map(entry => entry.criterionId === item.criterionId ? { ...entry, checked: event.target.checked } : entry))} /><span>{item.text}</span></label>)}</fieldset>
        : <p className="work-warning">No formal completion criteria were recorded for this task. Completion will record that explicit choice.</p>}
      {unchecked && <p className="field-error">Check every satisfied criterion before confirming completion. Unchecked criteria block completion.</p>}
      {!items.length && <label className="status-ack"><input type="checkbox" checked={noCriteriaAck} onChange={event => setNoCriteriaAck(event.target.checked)} />I acknowledge that no formal completion criteria were recorded.</label>}
      <label className="status-ack"><input type="checkbox" checked={ack} onChange={event => setAck(event.target.checked)} />{items.length ? 'I confirm all listed completion criteria are satisfied.' : 'I confirm this task is complete.'}</label>
      <label>Completion note or evidence reference (optional)<textarea rows={3} value={note} onChange={event => setNote(event.target.value)} aria-describedby="completion-note-help" /></label><small id="completion-note-help">Plain text, up to 1,000 characters. No attachment or identity verification.</small>
    </> : <>
      {reopening && <p>Reopening preserves every previous completion record and its original checklist. Work logs and remaining effort stay as entered.</p>}
      <label>{reopening ? target === 'Blocked' ? 'Reopening and blocked reason' : 'Reopening reason' : 'Blocked reason'}<textarea autoFocus rows={3} value={reason} onChange={event => setReason(event.target.value)} aria-describedby="transition-reason-help" /></label>
      <small id="transition-reason-help">Required, 3–500 characters.{target === 'Blocked' ? ' Explain what prevents progress; this becomes the active blocked reason.' : ''}</small>
    </>}
    {error && <p className="field-error" role="alert">{error}</p>}
  </ConfirmDialog>
}
