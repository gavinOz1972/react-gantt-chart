/** Compile-only assertions. Never executed; no format6 model assertion. */
import type { OperationalHistoryRepository, ReadSession, OperationalView, AtomicChangeRequest, ReadonlyValue, HistoryCursor } from '../../../../src/repository/operationalHistoryRepository'
import type { ProjectRepository, ProjectSnapshot, RepositoryProjectId } from '../../../../src/repository/projectRepository'
export function assertOperationalTypes(port: OperationalHistoryRepository, session: ReadSession, view: OperationalView, request: AtomicChangeRequest, full: ProjectRepository<ProjectSnapshot>, resource: RepositoryProjectId) {
  // @ts-expect-error A purpose-based capability is not the existing full repository.
  const wrong: ProjectRepository<ProjectSnapshot> = port
  // @ts-expect-error Pinned references are readonly.
  session.ref.revision = 20
  // @ts-expect-error Registry summaries cannot mutate retained lifecycle.
  view.registry[0].lifecycle.kind = 'Retired'
  // @ts-expect-error Actual facts do not accept an inferred bare date.
  view.facts.T1.start = '2026-11-09'
  // @ts-expect-error Delta never replaces a baseline through a partial view.
  request.delta.baseline = { kind: 'Absent' }
  // @ts-expect-error Exact historical reconstruction is not this capability.
  port.reconstructRecordedState(session, 10)
  // @ts-expect-error Named snapshots remain FR-HIST-01 deferred.
  port.captureSnapshot(session, 'snapshot')
  // @ts-expect-error Partial operational values cannot be committed as full S.
  full.commit({ projectId: resource, expected: session.ref, transactionId: request.transactionId, candidate: view })
  void wrong
  const cursor = null as unknown as ReadonlyValue<HistoryCursor>
  const preservedBrand: HistoryCursor = cursor
  void preservedBrand
}
export async function assertBaselineReadonly(port: OperationalHistoryRepository<{ nested: { rows: string[] } }>, session: ReadSession) {
  const baseline = await port.readOriginalBaseline(session)
  if (baseline.kind === 'Read' && baseline.value.kind === 'Present') {
    // @ts-expect-error Generic baseline payloads are also deeply readonly.
    baseline.value.value.nested.rows.push('mutate')
  }
}
