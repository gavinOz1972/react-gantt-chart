/** Baseline observation of existing functions ONLY. No projected adapter import. */
import { analyzeCriticalPath, calculateSchedule } from '../../../../src/domain'
import { forecastSchedule } from '../../../../src/forecast/forecast'
import { healthPresentation } from '../../../../src/progress/healthPresentation'
import { calculateProgressImpact } from '../../../../src/projection/progressImpact'
import { decodeProgress } from '../../../../src/progress/taskProgress'
import { chronologicalEntries, effortSummary } from '../../../../src/workTracking/workTracking'
import { comparisonDescription } from '../../../../src/timeline/overlays'
import { historicalDates, historyCaption, hasPrimaryPA, subordinateCommitment } from '../../../../src/timeline/historyPresentation'
import { layoutNetwork } from '../../../../src/network/layout'
import type { LegacyCase } from './legacyFixtures'

export function observeLegacy(c: LegacyCase) {
  const schedule = calculateSchedule(c.project, c.tasks), critical = analyzeCriticalPath(c.project, c.tasks, schedule)
  const forecast = forecastSchedule({ project: c.project, tasks: c.tasks, manualOrder: c.order, remainingHours: c.work.remainingHours, progress: c.progress, baseline: c.baseline, settings: c.settings, today: c.asOf })
  const health = healthPresentation(c.project, c.tasks, schedule, forecast, c.progress, false, c.work.remainingHours)
  const impact = calculateProgressImpact({ project: c.project, tasks: c.tasks, progress: c.progress, asOf: c.asOf })
  const network = critical.ok ? layoutNetwork(c.tasks, critical) : null
  return {
    schedule, critical, forecast, health: { project: health.project, tasks: [...health.tasks] }, impact,
    baselineMarkers: schedule.ok ? schedule.tasks.map(t => comparisonDescription(t, c.baseline?.schedule.tasks.find(b => b.taskId === t.taskId), forecast.tasks.find(f => f.taskId === t.taskId), !!c.baseline, true)) : [],
    historyPresentation: impact.ok ? { dates: historicalDates(c.project, impact), rows: impact.tasks.map(t => ({ taskId: t.taskId, caption: historyCaption(t), primary: hasPrimaryPA(t), subordinate: subordinateCommitment(t) })) } : null,
    network: network ? { nodes: network.nodes, edges: network.edges.map(e => ({ key: e.key, critical: e.critical, predecessorId: e.predecessorId, successorId: e.successorId })), width: network.width, height: network.height } : null,
    effort: c.tasks.map(t => [t.taskId, effortSummary(c.work, t.taskId, c.baseline, c.progress.tasks[t.taskId]?.status === 'Complete')]),
    selectedEntries: chronologicalEntries(c.work, 'T1'),
    selectedStatusEvents: c.progress.events.filter(e => e.taskId === 'T1').slice().reverse(),
    progressValidation: decodeProgress(c.progress, c.tasks.map(t => t.taskId)),
  }
}
export type LegacyObservation = ReturnType<typeof observeLegacy>
