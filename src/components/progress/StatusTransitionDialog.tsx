import { useState } from 'react'
import type { TaskInput } from '../../domain'
import type { CompletionCriterion, TaskProgress, TaskStatus, TransitionRequest } from '../../progress/taskProgress'
import { ConfirmDialog } from '../ConfirmDialog'
import { formatEffort, parseEffort } from '../../workTracking/workTracking'

import { localDate } from './localDate'

export function StatusTransitionDialog({ task, current, target, definitionOfDone, previousRemaining, onCommit, onCancel }: {
  task: TaskInput; current: TaskProgress; target: TaskStatus; definitionOfDone: string
  previousRemaining: number | null
  onCommit: (request: TransitionRequest, remainingDecision?: { hours: number | null }) => string | undefined; onCancel: () => void
}) {
  const [date, setDate] = useState(localDate)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<readonly CompletionCriterion[]>(() => current.criteria.map(item => ({ ...item })))
  const [ack, setAck] = useState(false)
  const [noCriteriaAck, setNoCriteriaAck] = useState(false)
  const [error, setError] = useState('')
  const [remainingChoice, setRemainingChoice] = useState<'confirm' | 'revise' | 'unknown' | ''>('')
  const [revisedRemaining, setRevisedRemaining] = useState(previousRemaining === null ? '' : String(previousRemaining))
  const completing = target === 'Complete'
  const reopening = current.status === 'Complete'
  const unchecked = items.some(item => !item.checked)
  function submit() {
    let decision: { hours: number | null } | undefined
    if (reopening) {
      if (!remainingChoice) { setError('Choose how to reassess remaining effort.'); return }
      if (remainingChoice === 'revise') {
        const parsed = parseEffort(revisedRemaining, true)
        if (!revisedRemaining.trim() || !parsed.ok) { setError(parsed.ok ? 'Enter a revised amount, or explicitly choose Unknown.' : parsed.errors[0].message); return }
        decision = { hours: parsed.value }
      } else decision = { hours: remainingChoice === 'unknown' ? null : previousRemaining }
    }
    const request = { target, eventId: `E-${crypto.randomUUID()}`, date: completing ? date : localDate(), recordedAt: new Date().toISOString(), reason, note,
      ...(completing ? { criteria: items, completionAcknowledged: ack, noCriteriaAcknowledged: noCriteriaAck } : {}), reopenAcknowledged: reopening }
    const problem = reopening ? onCommit(request, decision) : onCommit(request)
    if (problem) setError(problem)
  }
  return <ConfirmDialog title={completing ? `Mark ${task.taskId} Complete?` : reopening ? `Reopen ${task.taskId} to ${target}?` : `Block ${task.taskId}?`}
    confirmLabel={completing ? 'Confirm completion' : reopening ? 'Reopen task' : 'Set Blocked'} confirmDisabled={completing ? unchecked || !ack || (!items.length && !noCriteriaAck) : reopening && !remainingChoice} onConfirm={submit} onCancel={onCancel}>
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
      {reopening && <><p>Reopening preserves every previous completion record, its original checklist and recorded work. Reassess all unfinished person-hours before continuing.</p>
        <p>Retained previous estimate (suggestion): <strong>{previousRemaining === null ? 'Unknown' : `${formatEffort(previousRemaining)} h`}</strong>. This is not a dated historical estimate.</p>
        <fieldset className="reopening-remaining"><legend>Remaining effort reassessment</legend>
          <label><input type="radio" name="reopening-remaining" value="confirm" disabled={previousRemaining === null} checked={remainingChoice === 'confirm'} onChange={() => { setRemainingChoice('confirm'); setError('') }} />Confirm suggested amount{previousRemaining === null ? ' (no known amount)' : `: ${formatEffort(previousRemaining)} h`}</label>
          <label><input type="radio" name="reopening-remaining" value="revise" checked={remainingChoice === 'revise'} onChange={() => { setRemainingChoice('revise'); setError('') }} />Enter a revised amount</label>
          {remainingChoice === 'revise' && <label>Reassessed remaining effort (hours)<input type="text" inputMode="decimal" value={revisedRemaining} onChange={event => { setRevisedRemaining(event.target.value); setError('') }} /></label>}
          <label><input type="radio" name="reopening-remaining" value="unknown" checked={remainingChoice === 'unknown'} onChange={() => { setRemainingChoice('unknown'); setError('') }} />Declare remaining effort Unknown</label>
        </fieldset></>}
      <label>{reopening ? target === 'Blocked' ? 'Reopening and blocked reason' : 'Reopening reason' : 'Blocked reason'}<textarea autoFocus rows={3} value={reason} onChange={event => setReason(event.target.value)} aria-describedby="transition-reason-help" /></label>
      <small id="transition-reason-help">Required, 3–500 characters.{target === 'Blocked' ? ' Explain what prevents progress; this becomes the active blocked reason.' : ''}</small>
    </>}
    {error && <p className="field-error" role="alert">{error}</p>}
  </ConfirmDialog>
}
