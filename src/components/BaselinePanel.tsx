import { useRef, useState } from 'react'
import type { Baseline } from '../baseline/baseline'
import { ConfirmDialog } from './ConfirmDialog'

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export function BaselinePanel({ baseline, problems, onEstablish }: { baseline?: Baseline; problems: readonly string[]; onEstablish: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [viewing, setViewing] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  function close() { setConfirming(false); requestAnimationFrame(() => trigger.current?.focus()) }
  const completion = baseline?.schedule.projectCompletion
  return <section className="panel baseline-panel" aria-labelledby="baseline-heading">
    <div className="section-heading"><div><span className="eyebrow">Approved plan</span><h2 id="baseline-heading">Baseline plan</h2></div>
      {baseline ? <button type="button" className="quiet" aria-expanded={viewing} aria-controls="baseline-details" onClick={() => setViewing(value => !value)}>{viewing ? 'Hide baseline' : 'View Baseline'}</button>
        : <button ref={trigger} type="button" disabled={problems.length > 0} aria-describedby="baseline-explanation" onClick={() => setConfirming(true)}>Establish Baseline</button>}</div>
    <p id="baseline-explanation" className="muted">{baseline ? 'This original approved snapshot is read-only. Current Plan edits do not change it. Replacing or deleting a baseline is not available.' : 'No baseline established. Freeze the approved plan once, when you are ready. Your task editor and charts continue to use the editable Current Plan.'}</p>
    {!baseline && problems.length > 0 && <div className="baseline-problems" role="status"><p>Before establishing a baseline:</p><ul>{problems.map((message, index) => <li key={index}>{message}</li>)}</ul></div>}
    {baseline && <>
      <dl className="summary-grid baseline-summary">
        <div><dt>Established</dt><dd><time dateTime={baseline.establishedAt}>{new Date(baseline.establishedAt).toLocaleString()}</time></dd></div>
        <div><dt>Baseline tasks</dt><dd>{baseline.tasks.length}</dd></div>
        <div><dt>Planned hours</dt><dd>{baseline.tasks.reduce((sum, task) => sum + task.durationHours, 0)}</dd></div>
        <div><dt>Original completion</dt><dd>{completion ? <>{completion.date}<small>after hour {completion.afterHour}</small></> : 'No tasks'}</dd></div>
        <div><dt>Original target end</dt><dd>{baseline.project.targetEndDate}{completion && completion.date > baseline.project.targetEndDate && <small className="late">Completion exceeds target</small>}</dd></div>
      </dl>
      <div id="baseline-details" hidden={!viewing}>
        <h3>Frozen plan details</h3><p>{baseline.project.name} · Project {baseline.project.projectId}</p>
        <p>Start {baseline.project.projectStartDate} · {baseline.project.workingWeekdays.map(day => weekdays[day]).join(', ')} · {baseline.project.workingHoursPerDay} working hours per day</p>
        <p className="muted">Baseline ID: {baseline.baselineId}. Tasks are listed in the original manual order. Scroll the table horizontally to see all columns. Full snapshot fields are included in Export JSON.</p>
        <div className="baseline-table-scroll" role="region" aria-label="Read-only baseline tasks" tabIndex={0}><table className="baseline-table"><thead><tr><th>ID / Task</th><th>Hours</th><th>Predecessors</th><th>Independent start</th><th>Frozen start</th><th>Frozen finish</th></tr></thead>
          <tbody>{baseline.manualOrder.map(id => {
            const task = baseline.tasks.find(item => item.taskId === id)!
            const scheduled = baseline.schedule.tasks.find(item => item.taskId === id)!
            return <tr key={id}><th scope="row">{task.taskId} — {task.name}<small>{task.description}</small></th><td>{task.durationHours}</td><td>{task.predecessorTaskIds.join(', ') || 'None'}</td>
              <td>{task.independentStartMode}{task.independentStartMode === 'MANUAL' && <small>Retained date {task.requestedStartDate}</small>}</td>
              <td>{scheduled.startSlot.date}<small>hour {scheduled.startSlot.hour}</small></td><td>{scheduled.finishBoundary.date}<small>after hour {scheduled.finishBoundary.afterHour}</small></td></tr>
          })}</tbody></table></div>
      </div>
    </>}
    {confirming && <ConfirmDialog title="Establish approved baseline?" confirmLabel="Establish baseline" onCancel={close} onConfirm={() => { onEstablish(); close() }}>
      <p>This freezes the current project settings, tasks, manual order and calculated dates as your approved plan. Check that the plan is ready for approval.</p>
      <p>This project can have one original baseline. It cannot be edited, overwritten or deleted. Later edits apply only to the Current Plan. Use Save or Export JSON afterward to keep the snapshot.</p>
    </ConfirmDialog>}
  </section>
}
