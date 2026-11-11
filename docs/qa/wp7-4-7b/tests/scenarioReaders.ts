/** Synthetic diagnostics only, using the unchanged loaded-legacy reader. */
import { createLoadedTaskHistoryReader } from '../../../../src/history/selectedTaskHistory'
import type { SelectedTaskHistoryReader } from '../../../../src/history/selectedTaskHistory'
import { selectedHistoryFile } from '../../../../src/test/selectedHistoryFixture'
export type FailureScenario = 'invalid' | 'expired' | 'oversized' | 'mixed'
export function scenarioReader(scenario: FailureScenario) {
  const file = selectedHistoryFile(), tracking = structuredClone(file.taskProgress!)
  if (scenario === 'invalid') Object.assign(tracking.events[0], { recordedAt: null })
  if (scenario === 'oversized') {
    const criteria = Array.from({ length: 300 }, (_, i) => ({ criterionId: `Large-${i}`, text: 'Reviewed evidence '.repeat(26), checked: true }))
    Object.assign(tracking, { events: tracking.events.filter(e => e.eventId !== 'H-43') })
    Object.assign(tracking.events.find(e => e.toStatus === 'Complete')!, { criteriaSnapshot: criteria })
    Object.assign(tracking.tasks.T1, { status: 'Complete', criteria })
  }
  const original = createLoadedTaskHistoryReader({ resourceId: 'action-diagnostic', formatVersion: 5, taskIds: file.tasks.map(t => t.taskId), tracking })
  const metrics = { opens: 0, pageReads: 0, releases: 0, sessions: [] as object[] }
  const reader: SelectedTaskHistoryReader = {
    async open(...args) { metrics.opens++; const result = await original.open(...args); if (result.kind === 'Opened') metrics.sessions.push(result.session.token); return result },
    async read(...args) {
      metrics.pageReads++
      if (scenario === 'expired') return { kind: 'Failure', code: 'ReadExpired', message: 'Synthetic source remains expired.' }
      const result = await original.read(...args)
      return scenario === 'mixed' && result.kind === 'Page' ? { ...result, watermark: { ...result.watermark, revisionToken: {} } } : result
    },
    release(session) { metrics.releases++; original.release(session) },
  }
  return { reader, metrics, tracking }
}
