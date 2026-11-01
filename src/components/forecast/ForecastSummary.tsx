import type { Forecast, TaskForecast } from '../../forecast/forecast'
import { indicatorPresentation } from '../../progress/healthPresentation'
import type { ProjectHealth } from '../../progress/healthPresentation'
import { HealthBadge } from '../progress/HealthBadge'
const hours = (n: number | null) => n === null ? 'Unavailable' : `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)} person-hours`
const dateVariance = (a: string | null, b: string | null) => a && b ? (a > b ? 'Later' : a < b ? 'Earlier' : 'Same date') : 'Unavailable'
export function ForecastSummary({ forecast, invalidDraft, health, target }: { forecast: Forecast; invalidDraft: boolean; health: ProjectHealth; target: string }) {
  return <section className="panel forecast-summary" aria-labelledby="forecast-heading">
    <div className="section-heading"><h2 id="forecast-heading">Project health</h2><HealthBadge {...health} /></div>
    <p className="health-outcome" role="status" aria-live="polite">{health.label}: {health.explanation}</p>
    <div className="health-context"><span>As-of <strong>{forecast.asOfDate}</strong></span><span title="Complete means forecast inputs are complete; it does not change task work status.">Forecast: <strong>{health.forecastState}</strong></span>{health.availability !== 'Projection available' && !health.completed && <span>{health.availability}</span>}</div>
    <dl className="health-metrics">
      <div><dt>{health.completed ? 'Recorded completion' : 'Projected completion'}</dt><dd>{health.completed ? health.completionDate ?? 'Unavailable' : invalidDraft ? 'Unavailable' : health.availability === 'Indeterminate' ? 'Indeterminate' : forecast.forecastFinish ?? 'Unavailable'}<small>Target {target}</small></dd></div>
      <div><dt>Known remaining / target capacity{health.forecastState === 'Partial' ? ' (partial)' : ''}</dt><dd>{hours(health.knownRemaining)} / {forecast.state === 'Disabled' || invalidDraft ? 'Unavailable' : hours(forecast.capacityThroughTarget)}</dd></div>
      <div><dt>Currently Blocked</dt><dd>{health.blocked}</dd></div><div><dt>Currently Late</dt><dd>{health.late}</dd></div>
    </dl>
    <details className="health-details"><summary>Forecast details and comparisons</summary>
    {invalidDraft ? <p role="status">Correct or revert invalid forecast entries in Project Settings.</p> : <>
      <p className="muted">{forecast.message}</p>
      {forecast.state !== 'Disabled' && <>
        <dl className="summary-grid">
          <div><dt>Forecast As-of</dt><dd>{forecast.asOfDate}</dd></div>
          <div><dt>Weekly team capacity</dt><dd>{hours(forecast.weeklyCapacity)}</dd></div>
          <div><dt>Known remaining effort</dt><dd>{hours(forecast.knownRemaining)}</dd></div>
          <div><dt>Capacity through target</dt><dd>{hours(forecast.capacityThroughTarget)}<small>{forecast.targetDays} calendar days, inclusive</small></dd></div>
          <div><dt>Baseline finish</dt><dd>{forecast.baselineFinish ?? 'Not established'}</dd></div>
          <div><dt>Current committed finish</dt><dd>{forecast.committedFinish ?? 'No tasks'}</dd></div>
          <div><dt>Projected completion</dt><dd>{forecast.forecastFinish ?? 'Unavailable'}</dd></div>
          <div><dt>Forecast versus target</dt><dd>{forecast.targetVarianceDays === null ? 'Unavailable' : forecast.targetVarianceDays === 0 ? 'On target date' : `${Math.abs(forecast.targetVarianceDays)} calendar days ${forecast.targetVarianceDays > 0 ? 'after' : 'before'} target`}</dd></div>
          <div><dt>Capacity surplus / shortfall{forecast.state === 'Partial' ? ' (known work only)' : ''}</dt><dd>{forecast.capacitySurplus === null ? 'Unavailable' : `${forecast.capacitySurplus < 0 ? 'Shortfall' : 'Surplus'}: ${hours(Math.abs(forecast.capacitySurplus))}`}</dd></div>
          <div><dt>Committed versus baseline</dt><dd>{dateVariance(forecast.committedFinish, forecast.baselineFinish)}</dd></div>
          <div><dt>Forecast versus baseline</dt><dd>{dateVariance(forecast.forecastFinish, forecast.baselineFinish)}</dd></div>
        </dl>
        {!!forecast.unknownTaskIds.length && <p className="forecast-warning">Unknown remaining ({forecast.unknownTaskIds.length}): {forecast.unknownTaskIds.join(', ')}.</p>}
        {!!forecast.blockedTaskIds.length && <p className="forecast-warning">Blocked; restart unknown: {forecast.blockedTaskIds.join(', ')}.</p>}
        {!!forecast.affectedTaskIds.length && <p className="muted">Indeterminate tasks, including downstream dependencies: {forecast.affectedTaskIds.join(', ')}. Totals are not a complete feasibility verdict.</p>}
        <small className="muted">Uniform seven-day shared capacity; approximate priority heuristic. Actual logs are historical evidence. Gantt bars show the committed schedule.</small>
      </>}
    </>}
    </details>
  </section>
}
export function TaskForecastSummary({ task, showForecastBadge = true }: { task: TaskForecast; showForecastBadge?: boolean }) {
  const actual = task.indicator === 'Late' || task.indicator.startsWith('Completed') || task.indicator === 'Completion timing unavailable'
  return <div className="task-forecast" aria-label={`${task.taskId} forecast comparison`}>
    <dl><div><dt>Baseline finish</dt><dd>{task.baselineFinish ?? 'Not established'}</dd></div><div><dt>Committed finish</dt><dd>{task.committedFinish}</dd></div><div><dt>Forecast finish</dt><dd>{task.forecastFinish ?? 'Unavailable'}</dd></div>{(showForecastBadge || actual) && <div><dt>Schedule indicator</dt><dd><HealthBadge {...indicatorPresentation(task.indicator, task)} explanation={task.explanation} /></dd></div>}</dl>
    <small>{task.explanation} {task.forecastFinish ? task.reason : ''} Schedule dates are separate from effort variance.</small>
  </div>
}
