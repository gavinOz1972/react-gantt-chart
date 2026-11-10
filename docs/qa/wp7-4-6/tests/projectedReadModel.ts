/** Assessment-only compatibility probe. No App import, writer or history replay.
 * History-dependent gaps are values, never invented facts or hidden full scans.
 */
import { analyzeCriticalPath, calculateSchedule } from '../../../../src/domain'
import { forecastSchedule } from '../../../../src/forecast/forecast'
import { decodeForecastSettings } from '../../../../src/forecast/settings'
import { healthPresentation } from '../../../../src/progress/healthPresentation'
import { decodeBaseline } from '../../../../src/baseline/baseline'
import { comparisonDescription } from '../../../../src/timeline/overlays'
import { layoutNetwork } from '../../../../src/network/layout'
import type { OperationalHistoryRepository, ReadSession, ReadonlyValue, OperationalView, ReadResult } from '../../../../src/repository/operationalHistoryRepository'
import type { StatusEvent, ProgressTracking } from '../../../../src/progress/taskProgress'
import type { Baseline } from '../../../../src/baseline/baseline'
export type GapCode = 'CurrentGuidanceMissing' | 'PriorCompletionContextMissing' | 'AssumedStatusOriginMissing' | 'LegacyPayloadUnspecified' | 'CompletionEvidenceMissing' | 'InconsistentPinnedRead' | 'InconsistentCompletionEvidence' | 'LegacyBaselineUnavailable' | 'ForecastAssumptionsInvalid' | 'RecordedTotalUnavailable' | 'WorkEntryQueryMissing'
export class ContractGap extends Error {
  readonly code: GapCode
  constructor(code: GapCode) { super(code); this.code = code }
}
export const impactGaps: readonly GapCode[] = ['CurrentGuidanceMissing', 'PriorCompletionContextMissing', 'AssumedStatusOriginMissing']
export function legacyEvent(value: unknown): StatusEvent | undefined {
  if (!value || typeof value !== 'object' || !('legacyStatusEvent' in value)) return
  const e = value.legacyStatusEvent
  if (!e || typeof e !== 'object' || !('eventId' in e) || !('taskId' in e) || !('fromStatus' in e) || !('toStatus' in e) || !('date' in e) || !('recordedAt' in e)) return
  if (typeof e.eventId !== 'string' || typeof e.taskId !== 'string' || typeof e.date !== 'string' || typeof e.recordedAt !== 'string' || !['Not Started','In Progress','Blocked','Complete'].includes(String(e.toStatus))) return
  return structuredClone(e) as StatusEvent
}
function pinned<T>(r: ReadResult<T>, s: ReadSession): ReadonlyValue<T> {
  if (r.kind !== 'Read') throw new Error(r.kind)
  if (r.watermark.resourceId !== s.resourceId || r.watermark.ref.revision !== s.ref.revision || r.watermark.ref.fingerprint !== s.ref.fingerprint) throw new ContractGap('InconsistentPinnedRead')
  return r.value
}
/** Facade deliberately represents only the evidence the pure forecast reads.
 * It throws if a consumer starts reading absent global guidance. It does not
 * pretend the selected completion records are a complete replayable event log.
 */
function forecastOnlyProgress(op: ReadonlyValue<OperationalView>, evidence: readonly StatusEvent[]): ProgressTracking {
  return { schemaVersion: 1, tasks: op.progress, events: evidence,
    get definitionOfDone(): string { throw new ContractGap('CurrentGuidanceMissing') } }
}
export async function observeProjected(repo: OperationalHistoryRepository, session: ReadSession, today: string) {
  const op = pinned(await repo.loadOperational(session), session), readB = pinned(await repo.readOriginalBaseline(session), session)
  let baseline: Baseline | undefined
  if (readB.kind === 'Present') { const b = decodeBaseline(readB.value); if (!b.ok) throw new ContractGap('LegacyBaselineUnavailable'); baseline = b.value }
  const schedule = calculateSchedule(op.project, op.activeTasks), critical = analyzeCriticalPath(op.project, op.activeTasks, schedule)
  const network = critical.ok ? layoutNetwork(op.activeTasks, critical) : null
  const settings = decodeForecastSettings(op.forecastAssumptions)
  if (!settings.ok) throw new ContractGap('ForecastAssumptionsInvalid')
  const evidence: StatusEvent[] = [], gaps: GapCode[] = []
  for (const task of op.activeTasks) if (op.progress[task.taskId].status === 'Complete') {
    const fact = op.facts[task.taskId].completion
    if (fact.kind !== 'Known' || fact.sourceRecordId === null) { gaps.push('CompletionEvidenceMissing'); continue }
    const record = pinned(await repo.readHistoricalRecord(session, fact.sourceRecordId, 1024 * 1024), session)
    const e = record.recordType === 'Event' ? legacyEvent(record.payload) : undefined
    if (!e || record.recordType !== 'Event' || record.eventKind !== 'LegacyStatus' || !record.taskIds.includes(task.taskId)) { gaps.push('LegacyPayloadUnspecified'); continue }
    const commitment = op.facts[task.taskId].committedAtCompletion
    if (e.taskId !== task.taskId || e.toStatus !== 'Complete' || e.date !== fact.date || commitment.kind === 'Known' && e.committedFinishDateAtCompletion !== commitment.date) { gaps.push('InconsistentCompletionEvidence'); continue }
    evidence.push(e)
  }
  const progress = forecastOnlyProgress(op, evidence)
  const forecast = gaps.length ? null : forecastSchedule({ project: op.project, tasks: op.activeTasks, manualOrder: op.activeOrder, remainingHours: op.remainingHours, progress, baseline, settings: settings.value, today })
  const health = forecast ? healthPresentation(op.project, op.activeTasks, schedule, forecast, progress, false, op.remainingHours) : null
  const effort = op.activeTasks.map(t => {
    const total = op.recordedWork[t.taskId], complete = op.progress[t.taskId].status === 'Complete'
    if (total.kind !== 'RecordedSum') return [t.taskId, { kind: 'Gap', code: 'RecordedTotalUnavailable' }]
    const remaining = complete ? 0 : op.remainingHours[t.taskId], estimated = baseline?.tasks.find(b => b.taskId === t.taskId)?.durationHours ?? null
    const sum = remaining === null ? null : Math.round(total.hours * 100) + Math.round(remaining * 100)
    return [t.taskId, { actualHours: total.hours, remainingHours: remaining, forecastHours: sum === null ? null : sum / 100, baselineHours: estimated, varianceHours: sum === null || estimated === null ? null : (sum - Math.round(estimated * 100)) / 100 }]
  })
  return { schedule, critical, forecast, health: health ? { project: health.project, tasks: [...health.tasks] } : null,
    baselineMarkers: schedule.ok && forecast ? schedule.tasks.map(t => comparisonDescription(t, baseline?.schedule.tasks.find(b => b.taskId === t.taskId), forecast.tasks.find(f => f.taskId === t.taskId), !!baseline, true)) : null,
    network: network ? { nodes: network.nodes, edges: network.edges.map(e => ({ key: e.key, critical: e.critical, predecessorId: e.predecessorId, successorId: e.successorId })), width: network.width, height: network.height } : null,
    effort, forecastGaps: [...new Set(gaps)], progressImpact: { kind: 'Gap', codes: impactGaps }, selectedWorkEntries: { kind: 'Gap', code: 'WorkEntryQueryMissing' },
  }
}
/** Detail-only query: bounded per page and explicit maximum number of pages.
 * Partial/Unavailable/failure remain visible; no all-project history fallback.
 */
export async function selectedStatusHistory(repo: OperationalHistoryRepository, session: ReadSession, taskId: string, limit = 2, maxPages = 10) {
  const items: StatusEvent[] = []
  let cursor: import('../../../../src/repository/operationalHistoryRepository').HistoryCursor | undefined
  for (let page = 0; page < maxPages; page++) {
    const reply = await repo.queryHistory(session, { taskIds: [taskId], eventKinds: ['LegacyStatus'], date: { basis: 'recordedAt', includeUndated: true }, sort: 'sequenceDesc' }, { limit, maxBytes: 128 * 1024, cursor })
    if (reply.kind !== 'Read') return { kind: 'Failure' as const, code: reply.kind, items }
    const value = pinned(reply, session)
    if (value.availability === 'Unavailable') return { kind: 'Unavailable' as const, coverage: value.coverage, items }
    for (const record of value.items) { const event = legacyEvent(record.payload); if (!event || event.taskId !== taskId || !record.taskIds.includes(taskId)) return { kind: 'Gap' as const, code: 'LegacyPayloadUnspecified', items }; items.push(event) }
    cursor = value.nextCursor
    if (!cursor) return { kind: 'Available' as const, coverage: value.coverage, items }
  }
  return { kind: 'MoreAvailable' as const, items, cursor }
}
