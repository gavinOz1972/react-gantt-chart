/** Reusable executable contract: public port + explicit test controls only. */
import { describe, expect, test } from 'vitest'
import type { RepositoryProjectId } from '../../../../src/repository/projectRepository'
import type { AtomicChangeRequest, ChangeResult, EpisodeFilter, EventRecord, HistoricalRecord, HistoryFilter, OperationalHistoryRepository, PageRequest, ReadResult, ReadSession, TaskFilter } from '../../../../src/repository/operationalHistoryRepository'
import { edit, exact, fixture, freeze, logWork, resource, scopeChange, stamp, transaction } from './fixtures'
import type { FixtureState } from './fixtures'

export interface Harness {
  repository: OperationalHistoryRepository
  inspect(id: RepositoryProjectId): FixtureState
  rejectNext(): void
  loseAcknowledgement(hook?: () => void): void
}
export interface Config { now?: () => number; ttlMs?: number; supportsPinning?: boolean; failure?: 'validate' | 'fingerprint' }
export type Factory = (name: string, seeds: readonly FixtureState[], config?: Config) => Harness
const budget: PageRequest = { limit: 100, maxBytes: 1024 * 1024 }
const history: HistoryFilter = { date: { basis: 'recordedAt', includeUndated: true }, sort: 'sequenceAsc' }
const tasks: TaskFilter = { lifecycle: 'Any', sort: 'id' }
const episodes: EpisodeFilter = { lifecycle: 'Any', resolution: 'Any', scope: 'AllEpisodes', date: { basis: 'effectiveDate', includeUndated: true }, sort: 'recordingAsc' }
const value = <T>(result: ReadResult<T>) => { expect(result.kind).toBe('Read'); if (result.kind !== 'Read') throw Error(exact(result)); return result.value }
const accepted = (result: ChangeResult) => { expect(result.kind).toBe('CommitAccepted'); if (result.kind !== 'CommitAccepted') throw Error(exact(result)); return result }
async function open(h: Harness, id = resource('stored-copy-1')): Promise<ReadSession> { const r = await h.repository.openRead(id); expect(r.kind).toBe('Opened'); if (r.kind !== 'Opened') throw Error(exact(r)); return r.session }
const current = (h: Harness) => h.inspect(resource('stored-copy-1'))
const replace = (r: AtomicChangeRequest, transform: (v: HistoricalRecord) => HistoricalRecord): AtomicChangeRequest => ({ ...r, appendRecords: r.appendRecords.map(transform) })

export function operationalHistoryConformance(name: string, factory: Factory): void {
  describe(name, () => {
    test('O01 operational projection excludes historical payloads and preserves qualified facts/totals', async () => {
      const seed = freeze(fixture()), before = exact(seed), h = factory('O01', [seed]), s = await open(h)
      const r = await h.repository.loadOperational(s), op = value(r)
      expect(Object.keys(op).sort()).toEqual(['project', 'activeTasks', 'activeOrder', 'registry', 'progress', 'facts', 'remainingHours', 'recordedWork', 'working', 'forecastAssumptions', 'nextTaskNumber', 'nextSequence'].sort())
      expect(op.registry).toHaveLength(5); expect(op.activeTasks).toHaveLength(5)
      expect(exact(op)).not.toContain('Prior authored explanation'); expect(exact(op)).not.toContain('preserve-me')
      expect(op.facts.T1.start).toMatchObject({ kind: 'Unknown' }); expect(op.recordedWork.T1).toEqual({ kind: 'RecordedSum', hours: 0, completeness: 'RecordedDataOnly', actualTotal: 'Unknown', throughRevision: 17 })
      if (r.kind === 'Read') expect(r.watermark).toMatchObject({ lineageId: 'portable-lineage', ref: s.ref, historyHighWatermark: 100 })
      expect(exact(seed)).toBe(before)
    })
    test('O02 original baseline is separate, opaque values retained, absent never auto-established', async () => {
      for (const absent of [false, true]) {
        const seed = fixture(); if (absent) seed.baseline = { kind: 'Absent' }
        const h = factory('O02' + absent, [seed]), s = await open(h)
        expect(value(await h.repository.readOriginalBaseline(s))).toEqual(seed.baseline)
        accepted(await h.repository.commitChange(edit(current(h))))
        expect(value(await h.repository.readOriginalBaseline(await open(h)))).toEqual(seed.baseline)
      }
    })
    test('O03 retained detail and selected evidence resolve by stable IDs; missing is explicit', async () => {
      const h = factory('O03', [fixture()]), s = await open(h)
      expect(value(await h.repository.readRetainedTask(s, 'T3')).input.predecessorTaskIds).toEqual(['T1', 'T5'])
      expect(value(await h.repository.readHistoricalRecord(s, 'event-z', 10000))).toMatchObject({ recordId: 'event-z', actorLabel: null })
      expect(await h.repository.readRetainedTask(s, 'missing')).toMatchObject({ kind: 'NotFound', entity: 'Task' })
      expect(await h.repository.readHistoricalRecord(s, 'missing', 10000)).toMatchObject({ kind: 'NotFound', entity: 'Record' })
    })
    test('O04 detached input/read/session/receipt values cannot alias accepted storage', async () => {
      const seed = fixture(), h = factory('O04', [seed]); seed.tasks = []; seed.records = []
      const s = await open(h), op = value(await h.repository.loadOperational(s)); (op.project as { name: string }).name = 'tampered'
      const b = value(await h.repository.readOriginalBaseline(s)); if (b.kind === 'Present') (b as { value: unknown }).value = null
      expect(value(await h.repository.loadOperational(s)).project.name).toBe('Fixture only')
      expect(value(await h.repository.readOriginalBaseline(s))).toEqual(fixture().baseline)
      const request = freeze(edit(current(h))), receipt = accepted(await h.repository.commitChange(request)); (receipt.receipt.committedRef as { revision: number }).revision = 999
      expect(accepted(await h.repository.commitChange(request)).receipt.committedRef.revision).toBe(18)
    })
    test('O05 semantic fingerprints exclude stored-copy routing and namespace identity', async () => {
      const a = fixture(), b = fixture(); b.resourceId = resource('second-copy')
      const h = factory('O05', [a, b]), first = await open(h), second = await open(h, b.resourceId)
      expect(first.ref).toEqual(second.ref); expect(first.lineageId).toBe(second.lineageId); expect(first.resourceId).not.toBe(second.resourceId)
      expect(first.originalBaseline).toEqual(second.originalBaseline)
    })
    test('O06 complete coverage is preserved as declared; known dates never gain inferred actor/recording time', async () => {
      const seed = fixture(); seed.coverage = { kind: 'CompleteSince', revision: 17 }
      seed.tasks[0] = { ...seed.tasks[0], facts: { ...seed.tasks[0].facts, start: { kind: 'Known', date: '2026-11-02', recordedAt: null, actorLabel: null, sourceRecordId: null } } }
      const h = factory('O06', [seed]); accepted(await h.repository.commitChange(edit(current(h))))
      const s = await open(h), op = value(await h.repository.loadOperational(s))
      expect(s.coverage).toEqual({ kind: 'CompleteSince', revision: 17 }); expect(op.facts.T1.start).toEqual(seed.tasks[0].facts.start)
    })
    test('O07 nested baseline and retained detail reads are deeply detached', async () => {
      const h = factory('O07', [fixture()]), s = await open(h), b = value(await h.repository.readOriginalBaseline(s)), t = value(await h.repository.readRetainedTask(s, 'T3'))
      if (b.kind === 'Present') (b.value as { opaque: { token: string } }).opaque.token = 'changed'
      ;(t.input.predecessorTaskIds as string[]).push('missing')
      expect(value(await h.repository.readOriginalBaseline(s))).toEqual(fixture().baseline)
      expect(value(await h.repository.readRetainedTask(s, 'T3')).input.predecessorTaskIds).toEqual(['T1', 'T5'])
    })
    test('P01 pinned history pages exclude a concurrent accepted append and retain old source ref', async () => {
      const h = factory('P01', [fixture()]), s = await open(h), first = value(await h.repository.queryHistory(s, history, { ...budget, limit: 1 }))
      accepted(await h.repository.commitChange(edit(current(h), 'concurrent')))
      const ids = first.items.map(e => e.recordId); let cursor = first.nextCursor
      while (cursor) { const page = value(await h.repository.queryHistory(s, history, { ...budget, limit: 1, cursor })); ids.push(...page.items.map(e => e.recordId)); cursor = page.nextCursor }
      expect(ids).toEqual(['undated', 'event-z', 'event-a']); expect(s.ref.revision).toBe(17)
      expect(value(await h.repository.queryHistory(await open(h), history, budget)).items).toHaveLength(4)
      expect(value(await h.repository.loadOperational(s)).activeTasks[1].name).toBe('Task 2')
    })
    test('P02 equal timestamps and overlapping task filters have stable sequence ties without duplicates', async () => {
      const h = factory('P02', [fixture()]), s = await open(h), f: HistoryFilter = { ...history, taskIds: ['T1', 'T3'], date: { basis: 'recordedAt', includeUndated: false }, sort: 'sequenceDesc' }
      const a = value(await h.repository.queryHistory(s, f, { ...budget, limit: 1 })), b = value(await h.repository.queryHistory(s, f, { ...budget, limit: 1, cursor: a.nextCursor }))
      expect([...a.items, ...b.items].map(e => e.recordId)).toEqual(['event-a', 'event-z']); expect(b.nextCursor).toBeUndefined()
    })
    test.each(['filter', 'sort', 'date', 'limit', 'bytes', 'session', 'method', 'resource'] as const)('P03 cursor binds %s', async mismatch => {
      const seed2 = fixture(); seed2.resourceId = resource('stored-copy-2')
      const h = factory('P03' + mismatch, [fixture(), seed2]), s = await open(h), p = { ...budget, limit: 1 }, a = value(await h.repository.queryHistory(s, history, p))
      let session = s, f = history, request = { ...p, cursor: a.nextCursor }
      if (mismatch === 'filter') f = { ...f, taskIds: ['T3'] }
      if (mismatch === 'sort') f = { ...f, sort: 'sequenceDesc' }
      if (mismatch === 'date') f = { ...f, date: { basis: 'effectiveDate', includeUndated: true } }
      if (mismatch === 'limit') request = { ...request, limit: 2 }
      if (mismatch === 'bytes') request = { ...request, maxBytes: 10000 }
      if (mismatch === 'session') session = await open(h)
      if (mismatch === 'resource') session = await open(h, seed2.resourceId)
      const result = mismatch === 'method' ? await h.repository.queryRetainedTasks(s, tasks, request) : await h.repository.queryHistory(session, f, request)
      expect(result.kind).toBe('InvalidCursor')
    })
    test('P04 distinct date bases, inclusive start/exclusive end and explicit undated handling', async () => {
      const h = factory('P04', [fixture()]), s = await open(h)
      expect(value(await h.repository.queryHistory(s, { ...history, date: { basis: 'recordedAt', from: stamp, until: stamp, includeUndated: false } }, budget)).items).toHaveLength(0)
      expect(value(await h.repository.queryHistory(s, { ...history, date: { basis: 'recordedAt', from: stamp, until: '2026-11-09T15:00:00.001Z', includeUndated: false } }, budget)).items).toHaveLength(2)
      expect(value(await h.repository.queryHistory(s, { ...history, date: { basis: 'effectiveDate', from: '2026-11-09', until: '2026-11-10', includeUndated: false } }, budget)).items).toHaveLength(2)
      expect(value(await h.repository.queryHistory(s, { ...history, date: { basis: 'effectiveDate', from: '2026-11-10', includeUndated: true } }, budget)).items.map(e => e.recordId)).toEqual(['undated'])
    })
    test('P05 empty available result is distinct from unavailable/partial evidence', async () => {
      const h = factory('P05', [fixture()]), s = await open(h)
      expect(value(await h.repository.queryHistory(s, { ...history, taskIds: ['missing'] }, budget))).toMatchObject({ items: [], availability: 'Available', coverage: { kind: 'Partial' } })
      const seed = fixture(); seed.historyAvailable = false; seed.records = []
      const missing = factory('P05missing', [seed]), m = await open(missing)
      expect(value(await missing.repository.queryHistory(m, history, budget))).toMatchObject({ items: [], availability: 'Unavailable', coverage: { kind: 'Partial' } })
      expect(await missing.repository.readHistoricalRecord(m, 'absent', 10000)).toMatchObject({ kind: 'Unsupported', code: 'HistoryUnavailable' })
      expect(value(await missing.repository.loadOperational(m)).facts.T1.completion).toMatchObject({ kind: 'Unknown' })
    })
    test.each([0, -1, 1.5, 101, NaN, Infinity])('P06 invalid page item bound %s rejects', async limit => {
      const h = factory('P06', [fixture()]); expect((await h.repository.queryHistory(await open(h), history, { ...budget, limit })).kind).toBe('ValidationFailure')
    })
    test.each([0, -1, 1.5, 1048577])('P07 invalid byte budget %s rejects', async maxBytes => {
      const h = factory('P07', [fixture()]); expect((await h.repository.queryRetainedTasks(await open(h), tasks, { ...budget, maxBytes })).kind).toBe('ValidationFailure')
    })
    test.each(['2026-02-30', 'not-date', '2026-11-09T00:00:00.000Z'])('P08 invalid effective-date bound %s rejects', async from => {
      const h = factory('P08', [fixture()]); expect((await h.repository.queryHistory(await open(h), { ...history, date: { basis: 'effectiveDate', from, includeUndated: false } }, budget)).kind).toBe('ValidationFailure')
    })
    test('P09 oversized single record and page fail honestly without truncation/state changes', async () => {
      const seed = fixture(), base = seed.records[1] as EventRecord
      seed.records.push({ ...base, recordId: 'large', sequence: 101, eventKind: 'Large', rationale: 'Long rationale ' + 'x'.repeat(20000), payload: { text: 'Ω'.repeat(20000) } }); seed.nextSequence = 102
      const h = factory('P09', [seed]), s = await open(h), before = current(h)
      expect(await h.repository.readHistoricalRecord(s, 'large', 1000)).toMatchObject({ kind: 'RecordTooLarge', recordId: 'large' })
      expect(await h.repository.queryHistory(s, { ...history, eventKinds: ['Large'] }, { ...budget, maxBytes: 1000 })).toMatchObject({ kind: 'RecordTooLarge', recordId: 'large' })
      expect(value(await h.repository.readHistoricalRecord(s, 'large', budget.maxBytes))).toEqual(seed.records.at(-1)); expect(current(h)).toEqual(before)
    })
    test('P10 response-byte budget creates a smaller complete page and stable continuation', async () => {
      const h = factory('P10', [fixture()]), s = await open(h), f = { ...history, date: { basis: 'recordedAt' as const, includeUndated: false } }
      const single = await h.repository.queryHistory(s, f, { ...budget, limit: 1 }); value(single)
      const maxBytes = new TextEncoder().encode(JSON.stringify(single)).length + 2
      const a = await h.repository.queryHistory(s, f, { ...budget, maxBytes }), p = value(a)
      expect(p.items).toHaveLength(1); expect(new TextEncoder().encode(JSON.stringify(a)).length).toBeLessThanOrEqual(maxBytes)
      expect(value(await h.repository.queryHistory(s, f, { ...budget, maxBytes, cursor: p.nextCursor })).items[0].recordId).toBe('event-a')
    })
    test('P11 retained-task name ties paginate by stable IDs and support exact lifecycle filters', async () => {
      const seed = fixture(); seed.tasks = seed.tasks.map(t => ({ ...t, input: { ...t.input, name: 'Same label' } }))
      const h = factory('P11', [seed]), s = await open(h), f: TaskFilter = { lifecycle: 'Active', sort: 'name' }, ids: string[] = []
      let cursor: PageRequest['cursor']
      do { const p = value(await h.repository.queryRetainedTasks(s, f, { ...budget, limit: 2, cursor })); ids.push(...p.items.map(t => t.taskId)); cursor = p.nextCursor } while (cursor)
      expect(ids).toEqual(['T1', 'T2', 'T3', 'T4', 'T5']); expect(value(await h.repository.queryRetainedTasks(s, { ...f, taskIds: ['absent'] }, budget)).items).toEqual([])
    })
    test('S01 expiration, idempotent release and unsupported pinning are explicit', async () => {
      let now = 0; const h = factory('S01', [fixture()], { now: () => now, ttlMs: 10 }), s = await open(h); now = 10
      expect((await h.repository.loadOperational(s)).kind).toBe('ReadExpired')
      expect((await h.repository.releaseRead(s)).kind).toBe('Released'); expect((await h.repository.releaseRead(s)).kind).toBe('Released')
      expect((await factory('S01unsupported', [fixture()], { supportsPinning: false }).repository.openRead(resource('stored-copy-1'))).kind).toBe('Unsupported')
    })
    test('S02 session metadata/resource/namespace cannot be forged or used after release', async () => {
      const h = factory('S02', [fixture()]), s = await open(h)
      expect((await h.repository.loadOperational({ ...s, historyHighWatermark: 999 })).kind).toBe('ValidationFailure')
      expect((await factory('S02other', [fixture()]).repository.loadOperational(s)).kind).toBe('NotFound')
      expect((await h.repository.openRead(resource('portable-lineage'))).kind).toBe('NotFound')
      await h.repository.releaseRead(s); expect((await h.repository.readOriginalBaseline(s)).kind).toBe('ReadExpired')
    })
    test('S03 cancellation before reads/new dispatch has no accepted mutation', async () => {
      const h = factory('S03', [fixture()]), s = await open(h), before = current(h), controller = new AbortController(); controller.abort()
      expect((await h.repository.openRead(before.resourceId, controller.signal)).kind).toBe('Cancelled')
      expect((await h.repository.queryHistory(s, history, budget, controller.signal)).kind).toBe('Cancelled')
      expect(await h.repository.commitChange(edit(before), controller.signal)).toMatchObject({ kind: 'NotCommitted', outcome: 'NotCommitted', reason: { kind: 'Cancelled' } })
      expect(current(h)).toEqual(before)
    })
    test('L01 retirement commits complete diamond closure, archives and linked episodes atomically', async () => {
      const h = factory('L01', [fixture()]), before = current(h), request = freeze(scopeChange(before, 'Retire')); accepted(await h.repository.commitChange(request))
      const s = await open(h), op = value(await h.repository.loadOperational(s)), row = value(await h.repository.queryRetirementEpisodes(s, episodes, budget)).items[0]
      expect(op.activeTasks.map(t => t.taskId)).toEqual(['T2', 'T3', 'T4', 'T5']); expect(op.registry[0].lifecycle.kind).toBe('Retired'); expect(op.activeTasks.find(t => t.taskId === 'T3')?.predecessorTaskIds).toEqual(['T5'])
      expect(row.review.affectedTaskIds).toEqual(['T1', 'T2', 'T3', 'T4']); expect(row.review.outcomes).toHaveLength(4); expect(row.archives).toHaveLength(2)
      expect(row.retirement.before).toEqual(before.tasks[0]); expect(row.retirement.actorLabel).toBeNull(); expect(row.restoration.kind).toBe('Unrestored')
      for (const record of [row.retirement, row.review, ...row.archives]) expect(value(await h.repository.readHistoricalRecord(s, record.recordId, 100000))).toEqual(record)
      expect(value(await h.repository.readOriginalBaseline(s))).toEqual(before.baseline); expect(current(h).nextSequence).toBe(103); expect(current(h).revision).toBe(18)
    })
    test.each([true, false])('L02 restoration retains episodes; reinstatement is explicitly chosen=%s', async reconnect => {
      const h = factory('L02' + reconnect, [fixture()]); accepted(await h.repository.commitChange(scopeChange(current(h), 'Retire')))
      const retiredSession = await open(h), restore = scopeChange(current(h), 'Restore')
      const r = reconnect ? restore : { ...restore, delta: { ...restore.delta, changedTasks: restore.delta.changedTasks.map(t => t.input.taskId === 'T1' ? t : { ...t, input: { ...t.input, predecessorTaskIds: t.input.predecessorTaskIds.filter(id => id !== 'T1') } }) }, appendRecords: restore.appendRecords.map(e => e.recordType === 'Review' ? { ...e, addedEdges: [], outcomes: e.outcomes.map(o => ({ ...o, predecessorIds: o.predecessorIds.filter(id => id !== 'T1') })) } : e) }
      accepted(await h.repository.commitChange(r)); const s = await open(h), row = value(await h.repository.queryRetirementEpisodes(s, episodes, budget)).items[0]
      expect(row.currentTask.lifecycle.kind).toBe('Active'); expect(row.restoration.kind).toBe('Restored'); expect(row.archives).toHaveLength(2)
      expect(value(await h.repository.loadOperational(s)).activeTasks.find(t => t.taskId === 'T2')!.predecessorTaskIds).toEqual(reconnect ? ['T1'] : [])
      expect(value(await h.repository.queryRetirementEpisodes(retiredSession, { ...episodes, lifecycle: 'Retired' }, budget)).items).toHaveLength(1)
      expect(value(await h.repository.queryRetirementEpisodes(s, { ...episodes, lifecycle: 'Retired' }, budget)).items).toHaveLength(0)
    })
    test('L03 repeat retirement preserves old restoration and latest/all episode filtering', async () => {
      const h = factory('L03', [fixture()]); for (const [op, suffix] of [['Retire', 'one'], ['Restore', 'two'], ['Retire', 'three']] as const) accepted(await h.repository.commitChange(scopeChange(current(h), op, suffix)))
      const s = await open(h), all = value(await h.repository.queryRetirementEpisodes(s, episodes, budget)).items
      expect(all).toHaveLength(2); expect(all[0].restoration.kind).toBe('Restored'); expect(all[0].currentTask.lifecycle.kind).toBe('Retired'); expect(all[1].restoration.kind).toBe('Unrestored')
      expect(value(await h.repository.queryRetirementEpisodes(s, { ...episodes, scope: 'LatestPerTask' }, budget)).items.map(e => e.retirement.recordId)).toEqual(['L-three'])
      expect(value(await h.repository.queryRetirementEpisodes(s, { ...episodes, resolution: 'Restored' }, budget)).items[0].retirement.recordId).toBe('L-one')
      expect(current(h).records.filter(r => r.recordType === 'Archive')).toHaveLength(4)
    })
    const invalidScopes: readonly [string, (r: AtomicChangeRequest) => AtomicChangeRequest][] = [
      ['missing successor outcome', r => replace(r, x => x.recordType === 'Review' ? { ...x, outcomes: x.outcomes.filter(o => o.taskId !== 'T4') } : x)],
      ['duplicate closure task', r => replace(r, x => x.recordType === 'Review' ? { ...x, affectedTaskIds: [...x.affectedTaskIds, 'T4'] } : x)],
      ['missing archive', r => ({ ...r, appendRecords: r.appendRecords.filter(x => x.recordId !== 'AR-Retire-T2') })],
      ['wrong common before input', r => replace(r, x => x.recordType === 'Lifecycle' ? { ...x, before: { ...x.before, input: { ...x.before.input, durationHours: 9 } } } : x)],
      ['wrong before working context', r => replace(r, x => x.recordType === 'Lifecycle' ? { ...x, beforeWorking: null } : x)],
      ['missing rationale', r => replace(r, x => x.recordType === 'Lifecycle' ? { ...x, rationale: null } : x)],
      ['missing date', r => replace(r, x => x.recordType === 'Lifecycle' ? { ...x, effectiveDate: null } : x)],
      ['mandatory event link absent', r => replace(r, x => x.recordType === 'Event' && x.eventKind === 'TaskRetired' ? { ...x, links: [] } : x)],
      ['stale review revision', r => replace(r, x => x.recordType === 'Review' ? { ...x, sourceRevision: 16 } : x)],
      ['unconfirmed successor graph', r => replace(r, x => x.recordType === 'Review' ? { ...x, outcomes: x.outcomes.map(o => ({ ...o, predecessorIds: [] })) } : x)],
      ['duplicate record identity', r => ({ ...r, appendRecords: [...r.appendRecords, r.appendRecords[0]] })],
      ['missing working review', r => ({ ...r, delta: { changedTasks: r.delta.changedTasks, activeOrder: r.delta.activeOrder } })],
      ['unknown current actor inference', r => replace(r, x => x.recordType === 'Event' ? { ...x, actorLabel: '' } : x)],
      ['retired dependency retained', r => ({ ...r, delta: { ...r.delta, changedTasks: r.delta.changedTasks.filter(t => t.input.taskId !== 'T2') } })],
    ]
    test.each(invalidScopes)('L04 rejects %s without moving any accepted data/counter', async (_name, alter) => {
      const h = factory('L04', [fixture()]), before = current(h)
      expect((await h.repository.commitChange(alter(scopeChange(before, 'Retire')))).kind).toBe('NotCommitted'); expect(current(h)).toEqual(before)
    })
    test('T01 two writers, stale revision and stale fingerprint reject atomically', async () => {
      const h = factory('T01', [fixture()]), before = current(h), a = edit(before, 'writerA'), b = edit(before, 'writerB')
      const results = await Promise.all([h.repository.commitChange(a), h.repository.commitChange(b)])
      expect(results.map(r => r.kind)).toEqual(['CommitAccepted', 'Conflict']); expect(current(h).revision).toBe(18)
      const next = edit(current(h), 'wrongFingerprint'); expect(await h.repository.commitChange({ ...next, expected: { ...next.expected, fingerprint: a.expected.fingerprint } })).toMatchObject({ kind: 'Conflict', code: 'StaleRevision' })
      expect(current(h).records.filter(r => r.recordId === 'E-writerB')).toHaveLength(0)
    })
    test('T02 exact retry preserves original receipt and reports possibly newer current head', async () => {
      const h = factory('T02', [fixture()]), request = freeze(edit(current(h), 'original')), first = accepted(await h.repository.commitChange(request))
      accepted(await h.repository.commitChange(edit(current(h), 'later')))
      const replay = accepted(await h.repository.commitChange(request)); expect(replay.receipt).toEqual(first.receipt); expect(replay.replayed).toBe(true); expect(replay.currentRef.revision).toBe(19)
      expect(await h.repository.commitChange({ ...request, delta: { ...request.delta, forecastAssumptions: { enabled: true } } })).toMatchObject({ kind: 'Conflict', code: 'TransactionIdReuse' })
      expect(current(h).records.filter(r => r.recordId === 'E-original')).toHaveLength(1)
    })
    test('T03 unknown acknowledgement and post-dispatch cancellation reconcile without duplicate evidence', async () => {
      const h = factory('T03', [fixture()]), request = edit(current(h), 'uncertain'), controller = new AbortController()
      h.loseAcknowledgement(() => controller.abort())
      expect(await h.repository.commitChange(request, controller.signal)).toMatchObject({ kind: 'OutcomeUnknown', transactionId: request.transactionId })
      const replay = accepted(await h.repository.commitChange(request, controller.signal)); expect(replay.replayed).toBe(true); expect(current(h).revision).toBe(18)
      expect(current(h).records.filter(r => r.recordId === 'E-uncertain')).toHaveLength(1)
    })
    test('T04 injected pre-publication failure leaves no orphan evidence or consumed intent', async () => {
      const h = factory('T04', [fixture()]), before = current(h), request = edit(before); h.rejectNext()
      expect((await h.repository.commitChange(request)).kind).toBe('NotCommitted'); expect(current(h)).toEqual(before)
      expect(value(await h.repository.queryHistory(await open(h), history, budget)).items).toHaveLength(3)
      accepted(await h.repository.commitChange(request)); expect(current(h).revision).toBe(18)
    })
    test.each(['validate', 'fingerprint'] as const)('T05 throwing %s boundary cannot publish a candidate', async failure => {
      const h = factory('T05', [fixture()], { failure }), before = current(h)
      expect((await h.repository.commitChange(edit(before))).kind).toBe('NotCommitted'); expect(current(h)).toEqual(before)
    })
    test('T06 partial operational replacement, baseline overwrite, unknown ID and sequence gaps reject', async () => {
      const h = factory('T06', [fixture()]), before = current(h), good = edit(before)
      const malformed = [
        { ...good, delta: { changedTasks: [{ input: before.tasks[0].input }] } },
        { ...good, delta: { ...good.delta, baseline: { kind: 'Absent' } } },
        replace(good, r => r.recordType === 'Event' ? { ...r, taskIds: ['missing'] } : r),
        replace(good, r => r.recordType === 'Event' ? { ...r, sequence: 999 } : r),
        { ...good, transactionId: transaction('') },
      ]
      for (const request of malformed) { expect((await h.repository.commitChange(request as AtomicChangeRequest)).kind).toBe('NotCommitted'); expect(current(h)).toEqual(before) }
    })
    test.each(['revision', 'sequence', 'allocation'] as const)('T07 counter %s overflow/decrease rejects safely', async counter => {
      const seed = fixture(); if (counter === 'revision') seed.revision = Number.MAX_SAFE_INTEGER; if (counter === 'sequence') seed.nextSequence = Number.MAX_SAFE_INTEGER
      const h = factory('T07', [seed]), before = current(h), request = edit(before)
      expect((await h.repository.commitChange(counter === 'allocation' ? { ...request, delta: { ...request.delta, nextTaskNumber: 1 } } : request)).kind).toBe('NotCommitted'); expect(current(h)).toEqual(before)
    })
    test('T08 explicit fresh allocation retains all existing entities and cannot reuse an old ID range', async () => {
      const h = factory('T08', [fixture()]), before = current(h), source = before.tasks[4], base = edit(before, 'newTask')
      const request: AtomicChangeRequest = { ...base, delta: { changedTasks: [{ ...source, input: { ...source.input, taskId: 'T6', name: 'New task' } }], nextTaskNumber: 7, activeOrder: [...before.activeOrder, 'T6'] }, appendRecords: base.appendRecords.map(r => ({ ...r, taskIds: ['T6'] })) }
      accepted(await h.repository.commitChange(request)); const s = await open(h)
      expect(value(await h.repository.loadOperational(s)).registry.map(t => t.taskId)).toEqual(['T1', 'T2', 'T3', 'T4', 'T5', 'T6'])
      expect(value(await h.repository.readOriginalBaseline(s))).toEqual(before.baseline)
    })
    test('T09 a graph edit cannot bypass the scope review with a generic SourceEdit', async () => {
      const h = factory('T09', [fixture()]), before = current(h), r = edit(before)
      expect((await h.repository.commitChange({ ...r, delta: { changedTasks: [{ ...before.tasks[2], input: { ...before.tasks[2].input, predecessorTaskIds: [] } }] } })).kind).toBe('NotCommitted')
      expect(current(h)).toEqual(before)
    })
    test('T10 malformed nonfinite evidence is rejected before fingerprint/publication', async () => {
      const h = factory('T10', [fixture()]), before = current(h), r = edit(before)
      expect((await h.repository.commitChange(replace(r, e => e.recordType === 'Event' ? { ...e, payload: { bad: NaN } } : e))).kind).toBe('NotCommitted'); expect(current(h)).toEqual(before)
    })
    test('W01 recorded work/corrections/retraction update aggregate atomically without deducing actuals/remaining/status', async () => {
      const h = factory('W01', [fixture()]), original = current(h).tasks[1]
      for (const [hours, id, prior, expected] of [[2.5, 'one', null, 2.5], [1.5, 'two', 'WORK-one', 1.5], [null, 'three', 'WORK-two', 0]] as const) {
        accepted(await h.repository.commitChange(logWork(current(h), hours, id, prior)))
        const s = await open(h), task = value(await h.repository.readRetainedTask(s, 'T2'))
        expect(task.recordedWork).toMatchObject({ kind: 'RecordedSum', hours: expected, actualTotal: 'Unknown', throughRevision: s.ref.revision })
        expect(task.facts).toEqual(original.facts); expect(task.progress).toEqual(original.progress); expect(task.remainingHours).toBe(4)
      }
      expect(current(h).records.filter(r => r.recordType === 'Work')).toHaveLength(3)
    })
    test('W02 unavailable work total stays qualified, never inferred as zero from missing history', async () => {
      const seed = fixture(); seed.workAvailable.T2 = false; seed.totals.T2 = { kind: 'Unavailable', reason: 'Work source incomplete' }
      const h = factory('W02', [seed]); accepted(await h.repository.commitChange(logWork(current(h), 2, 'new')))
      expect(value(await h.repository.loadOperational(await open(h))).recordedWork.T2).toEqual({ kind: 'Unavailable', reason: 'Work source incomplete' })
    })
    test('W03 competing correction/invalid hours reject without aggregate changes', async () => {
      const h = factory('W03', [fixture()]); accepted(await h.repository.commitChange(logWork(current(h), 2, 'base'))); accepted(await h.repository.commitChange(logWork(current(h), 1, 'correct', 'WORK-base')))
      const before = current(h)
      for (const request of [logWork(before, 3, 'fork', 'WORK-base'), logWork(before, -1, 'negative'), logWork(before, 1.234, 'precision')]) { expect((await h.repository.commitChange(request)).kind).toBe('NotCommitted'); expect(current(h)).toEqual(before) }
    })
    test('W04 unsafe recorded work/aggregate overflow rejects atomically', async () => {
      const h = factory('W04', [fixture()]), seed = current(h)
      expect((await h.repository.commitChange(logWork(seed, 1e308, 'unsafe'))).kind).toBe('NotCommitted'); expect(current(h)).toEqual(seed)
      accepted(await h.repository.commitChange(logWork(seed, 50_000_000_000_000, 'large'))); const before = current(h)
      expect((await h.repository.commitChange(logWork(before, 50_000_000_000_000, 'overflow'))).kind).toBe('NotCommitted'); expect(current(h)).toEqual(before)
    })
    test('W05 two correction branches in one candidate cannot fork immutable work history', async () => {
      const h = factory('W05', [fixture()]); accepted(await h.repository.commitChange(logWork(current(h), 2, 'base')))
      const before = current(h), a = logWork(before, 1, 'a', 'WORK-base'), b = logWork(before, 3, 'b', 'WORK-base')
      const r = { ...a, appendRecords: [...a.appendRecords, ...b.appendRecords.map(e => e.recordType === 'Event' ? { ...e, sequence: before.nextSequence + 1 } : e)] }
      expect((await h.repository.commitChange(r)).kind).toBe('NotCommitted'); expect(current(h)).toEqual(before)
    })
    test('E01 portable export is an explicit unpassed Unsupported gate; sink never receives bytes', async () => {
      const h = factory('E01', [fixture()]), chunks: Uint8Array[] = [], before = current(h)
      expect(await h.repository.exportPortable(await open(h), { async write(chunk) { chunks.push(chunk) } })).toMatchObject({ kind: 'Unsupported', code: 'PortableExportNotQualified' })
      expect(chunks).toEqual([]); expect(current(h)).toEqual(before)
    })
    test('E02 original B/current comparison needs no intermediate schedule construction', async () => {
      const h = factory('E02', [fixture()]); accepted(await h.repository.commitChange(scopeChange(current(h), 'Retire')))
      const s = await open(h), b = value(await h.repository.readOriginalBaseline(s)), op = value(await h.repository.loadOperational(s))
      expect(b).toEqual(fixture().baseline); expect(op.activeTasks.some(t => t.taskId === 'T1')).toBe(false); expect(op.registry.find(t => t.taskId === 'T1')?.lifecycle.kind).toBe('Retired')
      expect('reconstructRecordedState' in h.repository).toBe(false); expect('captureSnapshot' in h.repository).toBe(false)
    })
  })
}
