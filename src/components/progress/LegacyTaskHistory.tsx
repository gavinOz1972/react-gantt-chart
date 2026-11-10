import type { ProgressTracking } from '../../progress/taskProgress'

/** Original loaded-history rendering, retained for the default and rollback path. */
export function LegacyTaskHistory({ taskId, tracking, open }: { taskId: string; tracking: ProgressTracking; open?: boolean }) {
  const events = tracking.events.filter(event => event.taskId === taskId)
  return <details className="status-history" open={open}><summary>Transition history ({events.length})</summary>
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
}
