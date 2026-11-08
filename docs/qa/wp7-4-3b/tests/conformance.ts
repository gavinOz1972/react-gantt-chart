/** Reusable suite: calls only the port and explicit test-control injections.
 * Expected fixture invariants are authored separately from the adapter.
 */
import { describe, expect, test } from 'vitest'
import type {
  CommitRequest, CreateRequest, LoadedProject, ProjectRepository, RepositoryCursor,
  RepositoryFailure, RepositoryProjectId, SnapshotSemantics, TransactionId, WriteResult,
} from '../../../../src/repository/projectRepository'
import { deepFreeze, fixture, fixtureFingerprint, fixtureSemantics, next } from './fixtures'
import type { FixtureSnapshot } from './fixtures'

export interface ConformanceHarness {
  readonly repository: ProjectRepository<FixtureSnapshot>
  rejectNext(operation: 'load' | 'list' | 'create' | 'commit', failure: RepositoryFailure): void
  loseNextAcknowledgement(operation: 'create' | 'commit', committed: boolean): void
}
export type HarnessFactory = (namespace: string, semantics?: SnapshotSemantics<FixtureSnapshot>) => ConformanceHarness
const tx = (value: string) => value as TransactionId
const missingId = 'unallocated-resource' as RepositoryProjectId
const createRequest = (snapshot = fixture(), id = 'create-1', label = 'Shared label'): CreateRequest<FixtureSnapshot> => ({ transactionId: tx(id), label, snapshot })
const accepted = (result: WriteResult) => {
  expect(result.kind).toBe('Committed')
  if (result.kind !== 'Committed') throw new Error(JSON.stringify(result))
  return result
}
async function load(repository: ProjectRepository<FixtureSnapshot>, id: RepositoryProjectId): Promise<LoadedProject<FixtureSnapshot>> {
  const result = await repository.load(id)
  expect(result.kind).toBe('Loaded')
  if (result.kind !== 'Loaded') throw new Error(JSON.stringify(result))
  return result.project
}
function edit(project: LoadedProject<FixtureSnapshot>, id = 'edit-1'): CommitRequest<FixtureSnapshot> {
  return { projectId: project.projectId, expected: project.ref, transactionId: tx(id), candidate: next(project.snapshot, id) }
}
async function seeded(harness: ConformanceHarness, snapshot = fixture()) {
  const result = accepted(await harness.repository.create(deepFreeze(createRequest(snapshot))))
  return load(harness.repository, result.receipt.projectId)
}
const failures: readonly RepositoryFailure[] = [
  { kind: 'Validation', issues: [{ code: 'InjectedInvalid', message: 'Injected', path: ['fixture', 0] }] },
  { kind: 'AccessDenied', message: 'Injected policy denial; no authentication implemented.' },
  { kind: 'Unsupported', code: 'InjectedUnsupported', message: 'Not a browser feature probe.' },
  { kind: 'StorageFailure', code: 'InjectedCapacity', retryable: false, outcome: 'NotCommitted', message: 'No physical storage used.' },
  { kind: 'StorageFailure', code: 'InjectedBusy', retryable: true, outcome: 'NotCommitted', message: 'No physical lock used.' },
]

export function repositoryConformance(name: string, factory: HarnessFactory): void {
  describe(name, () => {
    test('C01 create/load preserves complete frozen snapshot, stable identity and revision17', async () => {
      const h = factory('C01'), snapshot = deepFreeze(fixture()), before = JSON.stringify(snapshot)
      const result = accepted(await h.repository.create(deepFreeze(createRequest(snapshot))))
      expect(result.currentRef).toEqual({ revision: 17, fingerprint: fixtureFingerprint(snapshot) })
      expect(await load(h.repository, result.receipt.projectId)).toEqual({ projectId: result.receipt.projectId, label: 'Shared label', snapshot, ref: result.currentRef })
      expect((await load(h.repository, result.receipt.projectId)).projectId).toBe(result.receipt.projectId)
      expect(result.receipt.projectId).not.toBe(snapshot.lineageId)
      expect(JSON.stringify(snapshot)).toBe(before)
    })
    test('C02 duplicate labels create independent copies; no overwrite by name', async () => {
      const h = factory('C02'), a = accepted(await h.repository.create(createRequest()))
      const b = accepted(await h.repository.create(createRequest(fixture(), 'create-2')))
      expect(a.receipt.projectId).not.toBe(b.receipt.projectId)
      expect((await load(h.repository, a.receipt.projectId)).snapshot).toEqual((await load(h.repository, b.receipt.projectId)).snapshot)
      expect(await h.repository.list({ limit: 100 })).toMatchObject({ kind: 'Listed', items: [{ projectId: a.receipt.projectId }, { projectId: b.receipt.projectId }] })
    })
    test('C03 list paginates stable IDs with opaque namespace-scoped cursor', async () => {
      const h = factory('C03'), ids: RepositoryProjectId[] = []
      for (let i = 0; i < 3; i++) ids.push(accepted(await h.repository.create(createRequest(fixture(), `create-${i}`))).receipt.projectId)
      const first = await h.repository.list({ limit: 2 })
      if (first.kind !== 'Listed') throw new Error(JSON.stringify(first))
      expect(first.items.map(item => item.projectId)).toEqual(ids.slice(0, 2))
      expect(first.nextCursor).toBeDefined()
      expect(await h.repository.list({ limit: 2, cursor: first.nextCursor })).toEqual({ kind: 'Listed', items: [{ projectId: ids[2], label: 'Shared label', ref: { revision: 17, fingerprint: fixtureFingerprint(fixture()) } }] })
      expect(await factory('other-C03').repository.list({ limit: 2, cursor: first.nextCursor })).toMatchObject({ kind: 'Validation' })
      expect(await h.repository.list({ limit: 2, cursor: 'invented' as RepositoryCursor })).toMatchObject({ kind: 'Validation' })
    })
    test.each([0, -1, 101, 1.5, NaN])('C04 invalid list limit %s rejects', async limit => {
      expect(await factory('C04').repository.list({ limit })).toMatchObject({ kind: 'Validation' })
    })
    test('C05 empty list and missing load/commit never recreate a resource', async () => {
      const h = factory('C05')
      expect(await h.repository.list({ limit: 10 })).toEqual({ kind: 'Listed', items: [] })
      expect(await h.repository.load(missingId)).toEqual({ kind: 'NotFound', projectId: missingId })
      expect(await h.repository.commit({ projectId: missingId, expected: { revision: 17, fingerprint: fixtureFingerprint(fixture()) }, transactionId: tx('missing'), candidate: next(fixture()) })).toEqual({ kind: 'NotFound', projectId: missingId })
      expect(await h.repository.list({ limit: 10 })).toEqual({ kind: 'Listed', items: [] })
    })
    test('C06 whole-snapshot edit advances once, retains baseline/task arrays/history order', async () => {
      const h = factory('C06'), project = await seeded(h), request = deepFreeze(edit(project)), before = JSON.stringify(request)
      const result = accepted(await h.repository.commit(request)), current = await load(h.repository, project.projectId)
      expect(result.receipt.committedRef).toEqual({ revision: 18, fingerprint: fixtureFingerprint(request.candidate) })
      expect(current.snapshot).toEqual(request.candidate)
      expect(current.snapshot.baseline).toEqual(fixture().baseline)
      expect(current.snapshot.tasks).toEqual(fixture().tasks)
      expect(current.snapshot.history.slice(0, 2)).toEqual(fixture().history)
      expect(JSON.stringify(request)).toBe(before)
    })
    test.each(['revision', 'fingerprint'] as const)('C07 stale expected %s rejects without mutation', async field => {
      const h = factory('C07'), project = await seeded(h), request = edit(project)
      const expected = field === 'revision' ? { ...project.ref, revision: 16 } : { ...project.ref, fingerprint: fixtureFingerprint(next(fixture())) }
      expect(await h.repository.commit(deepFreeze({ ...request, expected }))).toEqual({ kind: 'Conflict', code: 'StaleRevision', currentRef: project.ref })
      expect(await load(h.repository, project.projectId)).toEqual(project)
    })
    test('C08 two writers and exact retry: one acceptance, one conflict, no duplicate revision', async () => {
      const h = factory('C08'), project = await seeded(h)
      const first = deepFreeze({ ...edit(project, 'writer-A'), candidate: { ...next(project.snapshot, 'writer-A'), tasks: project.snapshot.tasks.map(task => task.id === 'T2' ? { ...task, name: 'Writer A edit' } : task) } })
      const second = deepFreeze({ ...edit(project, 'writer-B'), candidate: { ...next(project.snapshot, 'writer-B'), tasks: project.snapshot.tasks.map(task => task.id === 'T1' ? { ...task, name: 'Disjoint task edit' } : task) } })
      const results = await Promise.all([h.repository.commit(first), h.repository.commit(second)])
      expect(results.map(result => result.kind).sort()).toEqual(['Committed', 'Conflict'])
      const winner = results.find(result => result.kind === 'Committed')!
      const wonRequest = results[0].kind === 'Committed' ? first : second
      expect(results.find(result => result.kind === 'Conflict')).toMatchObject({ code: 'StaleRevision' })
      expect(await h.repository.commit(wonRequest)).toEqual({ kind: 'AlreadyCommitted', receipt: winner.receipt, currentRef: winner.currentRef })
      expect((await load(h.repository, project.projectId)).snapshot).toEqual(wonRequest.candidate)
    })
    test('C09 exact create retry returns its ID; changed label or candidate reuses no receipt', async () => {
      const h = factory('C09'), request = deepFreeze(createRequest()), result = accepted(await h.repository.create(request))
      expect(await h.repository.create(request)).toEqual({ kind: 'AlreadyCommitted', receipt: result.receipt, currentRef: result.currentRef })
      for (const changed of [{ ...request, label: 'Renamed' }, { ...request, label: '' }, { ...request, label: 'x'.repeat(121) }, { ...request, snapshot: { ...fixture(), remaining: 7 } }]) expect(await h.repository.create(deepFreeze(changed))).toMatchObject({ kind: 'Conflict', code: 'TransactionIdReuse' })
      expect(await h.repository.list({ limit: 100 })).toMatchObject({ kind: 'Listed', items: [{ projectId: result.receipt.projectId }] })
    })
    test.each(['candidate', 'expectedRevision', 'expectedFingerprint'] as const)('C10 commit retry with changed %s is TransactionIdReuse', async changed => {
      const h = factory('C10'), project = await seeded(h), request = edit(project)
      accepted(await h.repository.commit(request))
      const attempt = changed === 'candidate' ? { ...request, candidate: { ...request.candidate, remaining: 9 } }
        : { ...request, expected: changed === 'expectedRevision' ? { ...project.ref, revision: 16 } : { ...project.ref, fingerprint: fixtureFingerprint(next(fixture())) } }
      expect(await h.repository.commit(deepFreeze(attempt))).toMatchObject({ kind: 'Conflict', code: 'TransactionIdReuse' })
      expect((await load(h.repository, project.projectId)).snapshot).toEqual(request.candidate)
    })
    test('C11 old receipt retains committed18 while currentRef is19; create retry also reconciles', async () => {
      const h = factory('C11'), project = await seeded(h), request = edit(project), first = accepted(await h.repository.commit(request))
      const second = accepted(await h.repository.commit(edit(await load(h.repository, project.projectId), 'edit-2')))
      expect(await h.repository.commit(request)).toEqual({ kind: 'AlreadyCommitted', receipt: first.receipt, currentRef: second.currentRef })
      expect(await h.repository.create(createRequest())).toMatchObject({ kind: 'AlreadyCommitted', receipt: { committedRef: { revision: 17 } }, currentRef: second.currentRef })
      expect((await load(h.repository, project.projectId)).snapshot.logicalRevision).toBe(19)
    })
    test('C12 create/commit/resource scopes are distinct', async () => {
      const h = factory('C12'), a = await seeded(h), b = accepted(await h.repository.create(createRequest(fixture(), 'create-2')))
      const results = await Promise.all([h.repository.commit(edit(a, 'create-1')), h.repository.commit(edit(await load(h.repository, b.receipt.projectId), 'create-1'))])
      results.forEach(accepted)
      expect((await load(h.repository, a.projectId)).snapshot.logicalRevision).toBe(18)
      expect((await load(h.repository, b.receipt.projectId)).snapshot.logicalRevision).toBe(18)
    })
    test('C13 copy to another namespace preserves logical history and cannot retarget source commands', async () => {
      const a = factory('C13-source'), b = factory('C13-target'), source = await seeded(a)
      const transfer = deepFreeze(structuredClone(source.snapshot)), result = accepted(await b.repository.create(createRequest(transfer)))
      expect(result.receipt.projectId).not.toBe(source.projectId)
      expect(result.receipt.committedRef).toEqual(source.ref)
      const target = await load(b.repository, result.receipt.projectId)
      expect(target.snapshot).toEqual(source.snapshot)
      expect(await b.repository.commit(edit(source))).toEqual({ kind: 'NotFound', projectId: source.projectId })
      accepted(await b.repository.commit(edit(target)))
      expect(await load(a.repository, source.projectId)).toEqual(source)
      expect((await load(b.repository, target.projectId)).snapshot.logicalRevision).toBe(18)
    })
    test('C14 copied history is not a transferred transport receipt', async () => {
      const a = factory('C14-source'), b = factory('C14-target'), project = await seeded(a)
      accepted(await a.repository.commit(edit(project, 'historical-command')))
      const exported = (await load(a.repository, project.projectId)).snapshot
      const imported = accepted(await b.repository.create(createRequest(exported, 'copy')))
      const target = await load(b.repository, imported.receipt.projectId)
      const request = edit(target, 'historical-command')
      expect(await b.repository.commit(request)).toMatchObject({ kind: 'Validation' }) // duplicate historical fixture event, never a source receipt
      expect(await load(b.repository, target.projectId)).toEqual(target)
    })
    for (const operation of ['create', 'commit', 'load', 'list'] as const) {
      test.each(failures.map(failure => [failure.kind === 'StorageFailure' ? `${failure.kind}/${failure.code}` : failure.kind, failure] as const))(`C15 ${operation} injected %s is typed and unchanged`, async (_, failure) => {
        const h = factory(`C15-${operation}`), project = await seeded(h), request = deepFreeze(edit(project)), before = JSON.stringify(request)
        h.rejectNext(operation, deepFreeze(failure))
        const result = operation === 'create' ? await h.repository.create(deepFreeze(createRequest(fixture(), 'failure-create')))
          : operation === 'commit' ? await h.repository.commit(request)
            : operation === 'load' ? await h.repository.load(project.projectId) : await h.repository.list({ limit: 10 })
        expect(result).toEqual(failure)
        expect(await load(h.repository, project.projectId)).toEqual(project)
        expect(await h.repository.list({ limit: 10 })).toMatchObject({ kind: 'Listed', items: [{ projectId: project.projectId }] })
        expect(JSON.stringify(request)).toBe(before)
      })
    }
    for (const operation of ['create', 'commit'] as const) {
      test.each([false, true])(`C16 ${operation} OutcomeUnknown with committed=%s reconciles exact request`, async committed => {
        const h = factory(`C16-${operation}-${committed}`), project = await seeded(h)
        h.loseNextAcknowledgement(operation, committed)
        const request = deepFreeze(edit(project))
        const create = deepFreeze(createRequest(fixture(), 'unknown-create'))
        const unknown = operation === 'create' ? await h.repository.create(create) : await h.repository.commit(request)
        expect(unknown).toEqual({ kind: 'OutcomeUnknown', transactionId: operation === 'create' ? create.transactionId : request.transactionId, message: expect.any(String) })
        if (operation === 'commit') expect((await load(h.repository, project.projectId)).snapshot.logicalRevision).toBe(committed ? 18 : 17)
        const reconciled = operation === 'create' ? await h.repository.create(create) : await h.repository.commit(request)
        expect(reconciled.kind).toBe(committed ? 'AlreadyCommitted' : 'Committed')
        if (reconciled.kind !== 'Committed' && reconciled.kind !== 'AlreadyCommitted') throw new Error(JSON.stringify(reconciled))
        const retry = operation === 'create' ? await h.repository.create(create) : await h.repository.commit(request)
        expect(retry).toEqual({ kind: 'AlreadyCommitted', receipt: reconciled.receipt, currentRef: reconciled.currentRef })
        expect((await load(h.repository, reconciled.receipt.projectId)).snapshot.logicalRevision).toBe(operation === 'create' ? 17 : 18)
        if (operation === 'create') {
          const listing = await h.repository.list({ limit: 10 })
          expect(listing.kind === 'Listed' && listing.items).toHaveLength(2)
        }
      })
    }
    test('C17 cancelling before dispatch requires no repository call', async () => {
      const h = factory('C17'), project = await seeded(h), discarded = deepFreeze(edit(project))
      expect(discarded.candidate.logicalRevision).toBe(18)
      // No cancellation method exists: the caller does not dispatch its draft.
      expect(await load(h.repository, project.projectId)).toEqual(project)
    })
    test.each(['baseline', 'opaque', 'originalWP1', 'remove', 'history', 'order', 'lineage'] as const)('C18 fixture invariant %s rejects frozen candidate', async changed => {
      const h = factory('C18'), project = await seeded(h), candidate = next(project.snapshot)
      const bad: FixtureSnapshot = changed === 'baseline' ? { ...candidate, baseline: { ...candidate.baseline!, id: 'replacement' } }
        : changed === 'opaque' ? { ...candidate, baseline: { ...candidate.baseline!, opaque: { tokens: ['changed'] } } }
          : changed === 'originalWP1' ? { ...candidate, baseline: { ...candidate.baseline!, originalWP1: { ...candidate.baseline!.originalWP1, hours: 8 } } }
            : changed === 'remove' ? { ...candidate, baseline: null }
              : changed === 'history' ? { ...candidate, history: [{ id: 'edited', detail: 'rewritten' }] }
                : changed === 'order' ? { ...candidate, history: [...candidate.history].reverse() }
                  : { ...candidate, lineageId: 'rewritten-lineage' }
      const request = deepFreeze({ ...edit(project), candidate: bad }), before = JSON.stringify(request)
      expect(await h.repository.commit(request)).toMatchObject({ kind: 'Validation' })
      expect(await load(h.repository, project.projectId)).toEqual(project)
      expect(JSON.stringify(request)).toBe(before)
    })
    test('C19 known-lineage copy cannot remove or replace established baseline', async () => {
      const h = factory('C19'), project = await seeded(h)
      for (const baseline of [null, { ...fixture().baseline!, id: 'other-baseline' }]) expect(await h.repository.create(deepFreeze(createRequest({ ...fixture(), baseline }, 'bad-copy')))).toMatchObject({ kind: 'Validation' })
      expect(await load(h.repository, project.projectId)).toEqual(project)
    })
    test('C20 no baseline remains absent when no established lineage baseline is known', async () => {
      const h = factory('C20'), project = await seeded(h, { ...fixture(), baseline: null })
      accepted(await h.repository.commit(deepFreeze(edit(project))))
      expect((await load(h.repository, project.projectId)).snapshot.baseline).toBeNull()
    })
    test.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN])('C21 create rejects invalid logical revision %s', async logicalRevision => {
      const h = factory('C21')
      expect(await h.repository.create(deepFreeze(createRequest(fixture(logicalRevision))))).toMatchObject({ kind: 'Validation' })
      expect(await h.repository.list({ limit: 10 })).toEqual({ kind: 'Listed', items: [] })
    })
    test.each([17, 19, 18.5, Number.MAX_SAFE_INTEGER + 1])('C22 commit rejects non-next/unsafe revision %s', async logicalRevision => {
      const h = factory('C22'), project = await seeded(h)
      expect(await h.repository.commit(deepFreeze({ ...edit(project), candidate: { ...next(project.snapshot), logicalRevision } }))).toMatchObject({ kind: 'Validation' })
      expect(await load(h.repository, project.projectId)).toEqual(project)
    })
    test('C23 maximum safe revision loads/copies but cannot increment; receipt replay still works', async () => {
      const h = factory('C23'), input = deepFreeze(createRequest(fixture(Number.MAX_SAFE_INTEGER))), result = accepted(await h.repository.create(input))
      const project = await load(h.repository, result.receipt.projectId)
      expect(await h.repository.commit(deepFreeze(edit(project)))).toMatchObject({ kind: 'Validation' })
      expect(await h.repository.create(input)).toMatchObject({ kind: 'AlreadyCommitted', currentRef: project.ref })
      expect(await load(h.repository, project.projectId)).toEqual(project)
    })
    test('C24 outputs and caller-owned inputs never alias accepted memory or receipts', async () => {
      const h = factory('C24'), input = structuredClone(createRequest()), result = accepted(await h.repository.create(input))
      // Next mutations deliberately emulate an unsafe caller outside readonly types.
      ;(input.snapshot.baseline!.opaque.tokens as string[]).push('caller mutation')
      const project = await load(h.repository, result.receipt.projectId)
      ;(project.snapshot.tasks[0] as { name: string }).name = 'output mutation'
      ;(project.ref as { revision: number }).revision = 99
      ;(result.receipt.committedRef as { revision: number }).revision = 66
      const listing = await h.repository.list({ limit: 10 })
      if (listing.kind !== 'Listed') throw new Error(JSON.stringify(listing))
      ;(listing.items[0].ref as { revision: number }).revision = 88
      expect((await load(h.repository, result.receipt.projectId)).snapshot).toEqual(fixture())
      expect((await load(h.repository, result.receipt.projectId)).ref.revision).toBe(17)
      expect(await h.repository.create(createRequest())).toMatchObject({ kind: 'AlreadyCommitted', receipt: { committedRef: { revision: 17 } } })
    })
    test('C25 accepted commit detaches candidate and replay/failure results', async () => {
      const h = factory('C25'), project = await seeded(h), request = edit(project), committed = accepted(await h.repository.commit(request))
      ;(request.candidate.history as { id: string; detail: string }[]).push({ id: 'caller mutation', detail: 'bad' })
      ;(committed.currentRef as { revision: number }).revision = 1
      const retryRequest = edit(project), replay = await h.repository.commit(retryRequest)
      expect(replay).toMatchObject({ kind: 'AlreadyCommitted', currentRef: { revision: 18 } })
      if (replay.kind !== 'AlreadyCommitted') throw new Error('Expected replay')
      ;(replay.receipt.committedRef as { revision: number }).revision = 10
      const conflict = await h.repository.commit(edit(project, 'stale'))
      if (conflict.kind !== 'Conflict' || !conflict.currentRef) throw new Error('Expected stale conflict')
      ;(conflict.currentRef as { revision: number }).revision = 90
      expect((await load(h.repository, project.projectId)).snapshot).toEqual(next(fixture(), 'edit-1'))
      expect(await h.repository.commit(retryRequest)).toMatchObject({ kind: 'AlreadyCommitted', receipt: { committedRef: { revision: 18 } } })
    })
    test.each(['fingerprint', 'validation'] as const)('C26 throwing injected %s boundary rejects before mutation', async boundary => {
      let throwing = false
      const semantics: SnapshotSemantics<FixtureSnapshot> = {
        fingerprint(snapshot) { if (throwing && boundary === 'fingerprint') throw new Error('injected'); return fixtureFingerprint(snapshot) },
        validateCreate(snapshot, known) { if (throwing && boundary === 'validation') throw new Error('injected'); return fixtureSemantics.validateCreate(snapshot, known) },
        validateCommit(previous, candidate, known) { if (throwing && boundary === 'validation') throw new Error('injected'); return fixtureSemantics.validateCommit(previous, candidate, known) },
      }
      const h = factory('C26', semantics), project = await seeded(h)
      throwing = true
      expect(await h.repository.commit(deepFreeze(edit(project)))).toMatchObject({ kind: 'StorageFailure', outcome: 'NotCommitted' })
      expect(await h.repository.create(deepFreeze(createRequest(fixture(), 'fail-create')))).toMatchObject({ kind: 'StorageFailure', outcome: 'NotCommitted' })
      throwing = false
      expect(await load(h.repository, project.projectId)).toEqual(project)
    })
    test.each(['emptyLabel', 'longLabel', 'emptyCreateId', 'emptyCommitId'] as const)('C27 %s rejects without state or receipt mutation', async bad => {
      const h = factory('C27'), project = await seeded(h)
      const result = bad === 'emptyCommitId'
        ? await h.repository.commit(deepFreeze({ ...edit(project), transactionId: tx(' ') }))
        : await h.repository.create(deepFreeze({ ...createRequest(fixture(), 'bad-create'),
          ...(bad === 'emptyLabel' ? { label: ' ' } : bad === 'longLabel' ? { label: 'x'.repeat(121) } : { transactionId: tx(' ') }) }))
      expect(result).toMatchObject({ kind: 'Validation' })
      expect(await load(h.repository, project.projectId)).toEqual(project)
      const listing = await h.repository.list({ limit: 10 })
      expect(listing.kind === 'Listed' && listing.items).toHaveLength(1)
    })
  })
}
