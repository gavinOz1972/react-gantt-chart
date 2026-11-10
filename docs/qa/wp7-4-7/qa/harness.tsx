/** Isolated development-only owner fixture; not an application route/provider. */
import { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SelectedTaskHistory } from '../../../../src/components/progress/SelectedTaskHistory'
import { LegacyTaskHistory } from '../../../../src/components/progress/LegacyTaskHistory'
import { createLoadedTaskHistoryReader } from '../../../../src/history/selectedTaskHistory'
import type { HistoryFailureCode, SelectedTaskHistoryReader } from '../../../../src/history/selectedTaskHistory'
import { selectedTaskHistoryEnabled } from '../../../../src/history/featureFlag'
import { selectedHistoryFile } from '../../../../src/test/selectedHistoryFixture'
import { emptyProgress } from '../../../../src/progress/taskProgress'
import type { ProgressTracking } from '../../../../src/progress/taskProgress'
import '../../../../src/styles/global.css'
export type Scenario = 'partial' | 'empty' | 'unavailable' | 'invalid' | 'unsupported' | 'expired' | 'oversized' | 'mixed' | 'cancelled' | 'delayed'
const scenarios: readonly Scenario[] = ['partial', 'empty', 'unavailable', 'invalid', 'unsupported', 'expired', 'oversized', 'mixed', 'cancelled', 'delayed']
const file = selectedHistoryFile(), taskIds = file.tasks.map(t => t.taskId)
function readerFor(scenario: Scenario, revision: number): { reader: SelectedTaskHistoryReader; tracking: ProgressTracking } {
  const tracking = scenario === 'unavailable' || scenario === 'empty' ? emptyProgress() : structuredClone(file.taskProgress!)
  if (scenario === 'invalid') Object.assign(tracking.events[0], { recordedAt: null })
  if (scenario === 'oversized') {
    const large = Array.from({ length: 300 }, (_, i) => ({ criterionId: `Large-${i}`, text: 'Reviewed evidence '.repeat(26), checked: true }))
    Object.assign(tracking, { events: tracking.events.filter(e => e.eventId !== 'H-43') })
    Object.assign(tracking.events.find(e => e.toStatus === 'Complete')!, { criteriaSnapshot: large })
    Object.assign(tracking.tasks.T1, { status: 'Complete', criteria: large })
  }
  const reader = createLoadedTaskHistoryReader({ resourceId: `synthetic:${revision}`, formatVersion: scenario === 'unavailable' ? 1 : 5, taskIds, tracking })
  const original = reader.read
  reader.read = async (session, request, signal) => {
    if (scenario === 'delayed') await new Promise(resolve => setTimeout(resolve, 700))
    const code: HistoryFailureCode | undefined = scenario === 'unsupported' ? 'Unsupported' : scenario === 'expired' ? 'ReadExpired' : scenario === 'cancelled' ? 'Cancelled' : undefined
    if (code) return { kind: 'Failure', code, message: `Synthetic ${code} scenario. Your projects are not involved.` }
    const result = await original(session, request, signal)
    return scenario === 'mixed' && result.kind === 'Page' ? { ...result, watermark: { ...result.watermark, revisionToken: {} } } : result
  }
  return { reader, tracking }
}
export function HistoryQA() {
  const [scenario, setScenario] = useState<Scenario>('partial'), [taskId, setTaskId] = useState('T1'), [revision, setRevision] = useState(1)
  const probe = useMemo(() => readerFor(scenario, revision), [scenario, revision])
  return <main className="app-shell"><section className="panel">
    <h1>Selected history — synthetic QA</h1><p>This isolated preview reads no saved projects and performs no writes. It is not an application history provider.</p>
    <label>Scenario<select aria-label="Scenario" value={scenario} onChange={e => setScenario(e.target.value as Scenario)}>{scenarios.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
    <label>Selected task<select aria-label="Selected task" value={taskId} onChange={e => setTaskId(e.target.value)}>{taskIds.map(id => <option key={id}>{id}</option>)}</select></label>
    <button type="button" className="quiet" onClick={() => setRevision(r => r + 1)}>Simulate source change</button>
    <p>Normal fixture: T1 is reopened, T2 is blocked, T3–T40 have no retained transitions. All timestamps intentionally tie. Missing dates are rejected, not guessed.</p>
    <SelectedTaskHistory key={`${taskId}:${scenario}`} taskId={taskId} reader={probe.reader} fallback={<LegacyTaskHistory tracking={probe.tracking} taskId={taskId} open />} />
  </section></main>
}
const root = createRoot(document.getElementById('root')!)
root.render(selectedTaskHistoryEnabled() ? <HistoryQA /> : <p>QA disabled. Set VITE_SELECTED_TASK_HISTORY=true on the development server to use this isolated preview.</p>)
