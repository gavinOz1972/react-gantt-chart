/** Compiled through the test bridge, never called. Expected errors pin port types. */
import type { CommitRequest, LoadedProject, TransactionId, WriteResult } from '../../../../src/repository/projectRepository'

type MutableExample = { logicalRevision: number; nested: { ids: string[] } }
export function assertReadonlyPortTypes(project: LoadedProject<MutableExample>, request: CommitRequest<MutableExample>, result: WriteResult): void {
  // @ts-expect-error opaque repository IDs cannot become transaction IDs
  const wrongId: TransactionId = project.projectId
  void wrongId
  // @ts-expect-error accepted reference is readonly
  project.ref.revision = 2
  // @ts-expect-error nested domain data stays readonly even for a mutable S
  project.snapshot.nested.ids.push('mutate')
  // @ts-expect-error candidate data is recursively readonly
  request.candidate.nested.ids[0] = 'mutate'
  if (result.kind === 'Committed' || result.kind === 'AlreadyCommitted') {
    // @ts-expect-error committed receipt reference is readonly
    result.receipt.committedRef.revision = 3
  }
  if (result.kind === 'StorageFailure') {
    // @ts-expect-error definitive storage failure cannot also be an uncertain success
    const outcome: 'MayHaveCommitted' = result.outcome
    void outcome
  }
}
