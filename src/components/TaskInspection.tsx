import type { ScheduledTask, TaskCriticalAnalysis, TaskInput } from '../domain'

export function TaskInspection({ task, scheduled, analysis }: { task: TaskInput; scheduled: ScheduledTask; analysis?: TaskCriticalAnalysis }) {
  return <div className="gantt-inspection" aria-label="Selected task details"><strong>{task.taskId} — {task.name}</strong>
    {analysis && <span className={analysis.critical ? 'critical-badge' : 'slack-badge'}>{analysis.critical ? 'Critical · zero slack' : `${analysis.totalSlackHours} working hours slack`}</span>}
    <dl><div><dt>Estimated duration</dt><dd>{task.durationHours} working hours total</dd></div>
      <div><dt>Calculated start</dt><dd>{scheduled.startDate}, hour {scheduled.startSlot.hour}</dd></div>
      <div><dt>Calculated finish</dt><dd>{scheduled.finishDate}, after hour {scheduled.finishBoundary.afterHour} that day</dd></div>
      <div><dt>Predecessors</dt><dd>{task.predecessorTaskIds.length ? task.predecessorTaskIds.join(', ') : 'None'}</dd></div>
      {analysis && <><div><dt>Total slack</dt><dd>{analysis.totalSlackHours} working hours, measured against calculated completion</dd></div>
        <div><dt>Latest allowable start</dt><dd>{analysis.latestStart.date}, hour {analysis.latestStart.hour}</dd></div>
        <div><dt>Latest allowable finish</dt><dd>{analysis.latestFinish.date}, after hour {analysis.latestFinish.afterHour} that day</dd></div>
        {analysis.releaseStart && <div><dt>Independent release / not before</dt><dd>{analysis.releaseStart.date}, hour {analysis.releaseStart.hour}{analysis.releaseDelayHours > 0 && <small>{analysis.releaseDelayHours} working slots after project start; this wait is not task effort.</small>}</dd></div>}</>}
    </dl>
  </div>
}
