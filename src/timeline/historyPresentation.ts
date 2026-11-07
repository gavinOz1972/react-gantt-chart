import { createWorkingCalendar, dateToOrdinal, ordinalToDate, SchedulingError } from '../domain'
import type { ProjectSettings, WorkingSlot } from '../domain'
import type { ProgressImpact, TaskImpact } from '../projection/progressImpact'
import type { TimelineAxis, TimelineRow } from './projection'
import { overlayPoint } from './overlays'

// Presentation adapters only: consume PA results without changing any dates,
// statuses, history, graph, schedule or persistence fields.
export const PRIMARY_Y = 30
export const RELEASE_Y = 52
export const REFERENCE_Y = 68
export const BASELINE_Y = 84
export function hasHistoryConflict(item: TaskImpact) {
  return item.warnings.some(w => w.startsWith('Recorded completion order conflicts:'))
}
export function hasPrimaryPA(item: TaskImpact) {
  return item.status === 'Not Started' && item.state === 'Known' && !!item.start && !!item.finish
}
export function subordinateCommitment(item?: TaskImpact) {
  return !!item && (!hasPrimaryPA(item) || item.shiftSlots !== '0')
}
export function historyCaption(item: TaskImpact): string {
  const fact = item.completion
  if (fact) {
    const context = !fact.active ? 'History; reopened. ' : fact.future ? 'Future-effective. ' : ''
    const comparison = fact.historical === 'Late' ? `Completed late +${fact.calendarDays} calendar days` : fact.historical === 'Unknown' ? 'Historical comparison unavailable' : fact.historical === 'Early' ? 'Completed early' : 'Completed on committed date'
    return `${context}${comparison}. Actual ${fact.date}, date only.${item.state === 'Unknown' || hasHistoryConflict(item) ? ' PA Unknown / conflict.' : ''}`
  }
  return hasPrimaryPA(item) ? `PA ${item.start!.date} to ${item.finish!.date}; conditional${item.shiftSlots === '0' ? ', equals commitment' : ''}.` : 'PA Unknown: no trustworthy finish.'
}
function releaseBound(project: ProjectSettings, item: TaskImpact): WorkingSlot | null {
  if (item.state !== 'Complete' || !item.completion?.active || item.completion.future) return null
  try {
    return createWorkingCalendar(project).firstSlotOnOrAfter(ordinalToDate(dateToOrdinal(item.completion.date) + 1))
  } catch (error) {
    if (!(error instanceof SchedulingError)) throw error
    return null
  }
}
export function historicalDates(project: ProjectSettings, impact?: ProgressImpact): string[] {
  if (!impact?.ok) return []
  const byId = new Map(impact.tasks.map(t => [t.taskId, t]))
  const dates = impact.tasks.flatMap(t => [t.completion?.date, t.completion?.reference, t.start?.date, t.finish?.date].filter((d): d is string => !!d))
  for (const successor of impact.tasks) if (hasPrimaryPA(successor)) {
    for (const id of successor.committed.predecessorTaskIds) {
      const pred = byId.get(id)
      const bound = pred ? releaseBound(project, pred) : null
      if (bound) dates.push(bound.date)
    }
  }
  return dates
}
/** (historical date, actual date] at visual day edges, never actual hours. */
export function elapsedOverrun(axis: TimelineAxis, item: TaskImpact) {
  const fact = item.completion
  if (!fact?.reference || fact.historical !== 'Late' || !fact.calendarDays || fact.calendarDays <= 0) return null
  const start = overlayPoint(axis, fact.reference, 1), end = overlayPoint(axis, fact.date, 1)
  return { start, end, calendarDays: fact.calendarDays, collapsed: end.unit === start.unit,
    label: `${fact.active ? fact.future ? 'Future-effective recorded' : 'Completed late:' : 'Historical completed late:'} ${item.taskId}, +${fact.calendarDays} calendar days elapsed from saved committed finish ${fact.reference} to actual date ${fact.date}. Date-only display edges, no actual finish hour. Elapsed lateness, not continuous work, actual effort, scheduled slots or project delay.${axis.mode === 'compressed' ? ' Nonworking gaps are collapsed; length is not elapsed calendar time.' : ''}` }
}
export interface ImpactRelation {
  key: string; predecessorId: string; successorId: string; fromRow: number; toRow: number
  kind: 'actual-release' | 'projected' | 'unknown'; label: string
  fromUnit?: number; toUnit?: number; actualDate?: string; actualDateEdge?: number; release?: WorkingSlot
}
export function presentImpactRelations(axis: TimelineAxis, project: ProjectSettings, rows: readonly TimelineRow[], impact?: ProgressImpact): ImpactRelation[] {
  if (!impact?.ok) return []
  const byId = new Map(impact.tasks.map(t => [t.taskId, t]))
  const rowById = new Map(rows.map(r => [r.taskId, r]))
  // A staged graph preview must not create or remove an accepted PA relation.
  return rows.flatMap(row => (byId.get(row.taskId)?.committed.predecessorTaskIds ?? []).flatMap<ImpactRelation>(id => {
    const from = rowById.get(id), pred = byId.get(id), successor = byId.get(row.taskId)
    if (!from || !pred || !successor) return []
    const base = { key: JSON.stringify([id, row.taskId]), predecessorId: id, successorId: row.taskId, fromRow: from.index, toRow: row.index }
    if (successor.state === 'Unknown' || hasHistoryConflict(successor) || hasHistoryConflict(pred) || (successor.state !== 'Complete' && pred.state === 'Unknown')) {
      return [{ ...base, kind: 'unknown' as const, label: `Uncertain dependency ${id} to ${row.taskId}: PA readiness Unknown${hasHistoryConflict(successor) ? '; recorded completion order conflicts' : ''}. No precise shifted connector or actual start is implied. Committed graph is unchanged.` }]
    }
    // Completed successor facts are never moved or replaced by a PA relation.
    if (!hasPrimaryPA(successor)) return []
    const toUnit = axis.startAt(successor.start!)
    const release = releaseBound(project, pred)
    if (release) return [{ ...base, kind: 'actual-release' as const, fromUnit: axis.startAt(release), toUnit, release,
      actualDate: pred.completion!.date, actualDateEdge: overlayPoint(axis, pred.completion!.date, 1).unit,
      label: `Actual-to-PA dependency ${id} to ${row.taskId}: actual ${pred.completion!.date}, time unknown; conservative release ${release.date} slot ${release.hour}; PA starts ${successor.start!.date} slot ${successor.start!.hour}. R is a release bound, not an actual finish hour. Existing accepted dependency; no graph change or projected CPM.` }]
    if (hasPrimaryPA(pred) && (pred.shiftSlots !== '0' || successor.shiftSlots !== '0')) return [{ ...base, kind: 'projected' as const,
      fromUnit: axis.finishAt(pred.finish!), toUnit,
      label: `PA dependency ${id} to ${row.taskId}: planned PA finish ${pred.finish!.date} after slot ${pred.finish!.afterHour} to PA start ${successor.start!.date} slot ${successor.start!.hour}. Conditional window, not actual work or projected CPM. Existing accepted dependency; no graph change.` }]
    return []
  }))
}
