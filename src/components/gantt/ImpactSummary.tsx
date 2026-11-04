import type { ProgressImpact } from '../../projection/progressImpact'
import { impactDescription } from '../../projection/progressImpact'

export function ImpactSummary({ impact, asOf, onAsOfChange, onToday, onGo, previewing = false }: {
  impact: ProgressImpact; asOf: string; onAsOfChange?: (value: string) => void; onToday?: () => void
  onGo?: (id: string) => void; previewing?: boolean
}) {
  if (!impact.ok) return <div className="pa-summary" role="region" aria-label="Progress-adjusted outlook">
    {onAsOfChange && <label>PA As-of<input type="date" value={asOf} onChange={e => onAsOfChange(e.target.value)} /></label>}
    <p role="status">Progress-adjusted outlook unavailable: {impact.message}</p>
  </div>
  const shifted = impact.tasks.filter(t => t.shiftSlots !== null && t.shiftSlots !== '0')
  const late = impact.tasks.filter(t => t.completion?.active && !t.completion.future && t.completion.historical === 'Late')
  const unknown = impact.tasks.filter(t => t.state === 'Unknown')
  const breaches = impact.tasks.filter(t => t.dateOrderBreaches.length)
  const relevant = impact.tasks.filter(t => t.completion || t.state === 'Unknown' || shifted.includes(t))
  const go = shifted[0] ?? unknown[0] ?? relevant[0]
  const sameFinish = impact.project.calendarDays === 0 && impact.project.shiftSlots === '0'
  return <section className="pa-summary" aria-label="Progress-adjusted outlook">
    <div className="pa-controls"><strong>Progress-adjusted outlook · PA</strong>
      {onAsOfChange ? <label>PA As-of<input type="date" value={asOf} onChange={e => onAsOfChange(e.target.value)} /></label> : <span>PA As-of {asOf}</span>}
      {onToday && <button type="button" className="quiet" onClick={onToday}>Use today for PA</button>}
      {onGo && <button type="button" className="quiet" disabled={!go} onClick={() => go && onGo(go.taskId)}>Go to impact</button>}
    </div>
    <div role="status" aria-label="Progress-adjusted summary" aria-live="polite" aria-atomic="true" className="pa-verdict">
      <p>{!impact.tasks.length ? 'No tasks to project yet.' : impact.project.uncertain ? 'Project outlook Unknown: required evidence is missing or recorded facts conflict.' : impact.project.actual ? `Actual project finish ${impact.project.date}; compared with current committed ${impact.project.committedDate}. Actual finish time is unrecorded.` : sameFinish ? `Project outlook unchanged: ${impact.project.date}.` : impact.project.calendarDays === 0 ? impact.project.finish ? `Conditional project outlook ${impact.project.date} after slot ${impact.project.finish.afterHour}; current committed after slot ${impact.project.committedFinish?.afterHour} (${impact.project.shiftSlots?.startsWith('-') ? '' : '+'}${impact.project.shiftSlots} scheduled slots; same calendar date).` : `Project outlook date unchanged: ${impact.project.date}; finish time is unverified.` : `Conditional project outlook ${impact.project.date}; current committed ${impact.project.committedDate} (${impact.project.calendarDays! > 0 ? '+' : ''}${impact.project.calendarDays} calendar days).`}</p>
      <p>{late.length} historically late {late.length === 1 ? 'completion' : 'completions'}; {shifted.length} shifted {shifted.length === 1 ? 'task' : 'tasks'}; {unknown.length} Unknown.
        {shifted.some(t => t.causes.includes('Completion readiness')) && ' Completion readiness changes downstream dates.'}
        {shifted.some(t => t.causes.includes('As-of')) && ' As-of-driven movement is labelled separately.'}
        {shifted.length > 0 && sameFinish && ' Movement is absorbed by existing margin or calendar gaps; no modelled project finish delay.'}
        {late.length > 0 && !shifted.length && !unknown.length && ' No downstream movement is modelled.'}
        {breaches.length > 0 && ` ${breaches.length} committed start date(s) precede a recorded predecessor completion.`}
      </p>
      {impact.conflicts.map(warning => <p key={warning}>{warning}</p>)}
    </div>
    <p className="muted">A = actual completion date, time unrecorded. PA uses next-working-day readiness and full scheduled durations for Not Started tasks; conservative movement is not an observed delay. As-of is start-of-date, independent of effort forecast As-of.{previewing && ' PA uses the accepted plan; current task/calendar edits are previews.'}</p>
    {relevant.length > 0 && <details className="pa-details"><summary>Impact details ({relevant.length} tasks)</summary>
      <ul>{relevant.map(item => <li key={item.taskId}><p>{impactDescription(item, impact.asOf)}</p>{onGo && <button type="button" className="quiet" onClick={() => onGo(item.taskId)}>Go to impact {item.taskId}</button>}</li>)}</ul>
    </details>}
    {!!impact.drivingTaskIds.length && <p className="muted">Outlook-driving constraints: {impact.drivingTaskIds.join(', ')}. Committed critical path remains a separate analysis.</p>}
  </section>
}
