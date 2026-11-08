/** Narrow, independently authored TEST fixtures, NOT a format6 schema/replay. */
import type { Fingerprint, ProjectSnapshot, SnapshotSemantics, ValidationIssue } from '../../../../src/repository/projectRepository'

export interface FixtureSnapshot extends ProjectSnapshot {
  readonly fixture: 'repository-test-only'
  readonly lineageId: string
  readonly baseline: {
    readonly id: string
    readonly originalWP1: {
      readonly weekdays: readonly number[]
      readonly hours: number
      readonly taskIds: readonly string[]
      readonly finish: string
    }
    readonly opaque: { readonly tokens: readonly string[] }
  } | null
  readonly tasks: readonly { readonly id: string; readonly name: string; readonly predecessors: readonly string[] }[]
  readonly history: readonly { readonly id: string; readonly detail: string }[]
  readonly remaining: number | null
}

export function fixture(logicalRevision = 17): FixtureSnapshot {
  return {
    fixture: 'repository-test-only', logicalRevision, lineageId: 'portable-lineage-α',
    baseline: { id: 'original-B', originalWP1: { weekdays: [1, 4, 5], hours: 3, taskIds: ['T2', 'T1'], finish: '2026-11-05' }, opaque: { tokens: ['retained', 'Ω'] } },
    tasks: [{ id: 'T2', name: 'Second', predecessors: [] }, { id: 'T1', name: 'First', predecessors: ['T2'] }],
    history: [{ id: 'same-time-B', detail: 'first in source order' }, { id: 'same-time-A', detail: 'second in source order' }],
    remaining: 5,
  }
}
export function next(snapshot: FixtureSnapshot, eventId = 'next-event'): FixtureSnapshot {
  return { ...structuredClone(snapshot), logicalRevision: snapshot.logicalRevision + 1, remaining: 4,
    history: [...snapshot.history, { id: eventId, detail: 'fixture-only accepted edit' }] }
}
/** Intentionally exact ordered fixture JSON, not an approved semantic hash or
 * cross-language canonical profile. No format6 golden vectors are defined.
 */
export const fixtureFingerprint = (snapshot: FixtureSnapshot): Fingerprint => `fixture-only:${JSON.stringify(snapshot)}` as Fingerprint
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const issue = (code: string): ValidationIssue => ({ code, message: `Narrow fixture check: ${code}` })
function validate(snapshot: FixtureSnapshot, known: readonly FixtureSnapshot[]): readonly ValidationIssue[] {
  if (snapshot.fixture !== 'repository-test-only') return [issue('NotFixtureShape')]
  if (!snapshot.lineageId || !Array.isArray(snapshot.tasks) || !Array.isArray(snapshot.history)) return [issue('InvalidFixture')]
  if (new Set(snapshot.history.map(event => event.id)).size !== snapshot.history.length) return [issue('DuplicateFixtureEvent')]
  const baseline = known.find(item => item.lineageId === snapshot.lineageId && item.baseline !== null)?.baseline
  if (baseline && !equal(baseline, snapshot.baseline)) return [issue('KnownBaselineMismatch')]
  return []
}
/** This fake validates only declared fixture invariants; no graph, actuals,
 * criteria, commitment, grouped-history replay or full baseline semantics.
 */
export const fixtureSemantics: SnapshotSemantics<FixtureSnapshot> = {
  fingerprint: fixtureFingerprint,
  validateCreate: validate,
  validateCommit(accepted, candidate, known) {
    const issues = validate(candidate, known)
    if (issues.length) return issues
    if (candidate.lineageId !== accepted.lineageId) return [issue('LineageChanged')]
    if (accepted.baseline !== null && !equal(accepted.baseline, candidate.baseline)) return [issue('BaselineChanged')]
    if (!equal(accepted.history, candidate.history.slice(0, accepted.history.length))) return [issue('HistoryRewritten')]
    return []
  },
}
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
