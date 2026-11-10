import { describe, expect, test } from 'vitest'
import goldenText from '../evidence/legacy-goldens.json?raw'
import { base, baseline, legacyCases, status } from './legacyFixtures'
import { observeLegacy } from './observeLegacy'
import type { LegacyObservation } from './observeLegacy'
import { referenceFor, seedFor } from './portFixture'
import { ContractGap, impactGaps, observeProjected, selectedStatusHistory } from './projectedReadModel'
import { ReferenceOperationalHistoryRepository } from '../../wp7-4-5/tests/referenceOperationalHistoryRepository'
import { fixtureFingerprint, edit } from '../../wp7-4-5/tests/fixtures'
import { validateFixtureChange } from '../../wp7-4-5/tests/fixtureSemantics'
import { decodeProgress, progressFingerprint, removeTaskProgress } from '../../../../src/progress/taskProgress'
import { projectFingerprint, createProjectFile, parseProject, serializeProject } from '../../../../src/persistence/projectFile'
import { decodeBaseline } from '../../../../src/baseline/baseline'
import { removeTaskWork } from '../../../../src/workTracking/workTracking'
import type { OperationalHistoryRepository, ReadResult } from '../../../../src/repository/operationalHistoryRepository'
const frames = legacyCases()
const goldens = JSON.parse(goldenText) as { id: string; output: LegacyObservation }[]
const normalized = (value: unknown): unknown => JSON.parse(JSON.stringify(value))
function value<T>(r: ReadResult<T>) { expect(r.kind).toBe('Read'); if (r.kind !== 'Read') throw new Error(r.kind); return r.value }
async function open(repo: OperationalHistoryRepository, c: typeof frames[number]) { const s = await repo.openRead(seedFor(c).resourceId); if (s.kind !== 'Opened') throw new Error(s.kind); return s.session }
export function overrides(repo: OperationalHistoryRepository, methods: Partial<OperationalHistoryRepository> = {}, calls: string[] = []): OperationalHistoryRepository {
  return new Proxy(repo, { get(target, key) {
    const replacement = methods[key as keyof OperationalHistoryRepository], original = Reflect.get(target, key) as unknown
    const fn = replacement ?? original
    return typeof fn === 'function' ? (...args: unknown[]) => { calls.push(String(key)); return Reflect.apply(fn, replacement ? methods : target, args) } : fn
  } })
}
export function consumerParity() {
  describe('WP7.4.6 independent consumer characterization', () => {
    test.each(frames)('B01 $id existing outputs remain equal to pre-adaptation golden', c => {
      expect(normalized(observeLegacy(c))).toEqual(goldens.find(g => g.id === c.id)!.output)
    })
    test.each(frames)('N01 $id normal read proves supported subsets or reports a visible gap/difference', async c => {
      const original = goldens.find(g => g.id === c.id)!.output, source = referenceFor(c), session = await open(source, c), calls: string[] = []
      const repo = overrides(source, { async queryHistory() { throw new Error('Forbidden all-history fallback during normal read') }, async queryRetainedTasks() { throw new Error('Forbidden full-registry detail fetch') } }, calls)
      const projected = await observeProjected(repo, session, c.asOf)
      if (c.lifecycle === 'Retired') {
        expect(projected.schedule).not.toEqual(original.schedule)
        expect(projected.schedule.ok && projected.schedule.tasks.some(t => t.taskId === 'T1')).toBe(false)
        // Approved active-population evolution, not legacy App parity.
      } else {
        for (const key of ['schedule', 'critical', 'network', 'effort'] as const) expect(normalized(projected[key])).toEqual(original[key])
        if (c.id === 'missing-history-invalid') { expect(projected.forecastGaps).toContain('CompletionEvidenceMissing'); expect(projected.forecast).toBeNull() }
        else for (const key of ['forecast', 'health', 'baselineMarkers'] as const) expect(normalized(projected[key])).toEqual(original[key])
      }
      expect(projected.progressImpact).toEqual({ kind: 'Gap', codes: impactGaps })
      expect(projected.selectedWorkEntries).toEqual({ kind: 'Gap', code: 'WorkEntryQueryMissing' })
      expect(calls.filter(n => n === 'loadOperational')).toHaveLength(1); expect(calls.filter(n => n === 'readOriginalBaseline')).toHaveLength(1)
      expect(calls.filter(n => n === 'readHistoricalRecord').length).toBeLessThanOrEqual(c.tasks.filter(t => c.progress.tasks[t.taskId]?.status === 'Complete').length)
      expect(calls).not.toContain('queryHistory'); expect(calls).not.toContain('queryRetainedTasks')
    })
    test.each(frames)('D01 $id selected detail pages preserve original event rows and coverage conditionally', async c => {
      const repo = referenceFor(c), session = await open(repo, c), result = await selectedStatusHistory(repo, session, 'T1', 1, 20)
      expect(result.kind).toBe('Available'); expect(normalized(result.items)).toEqual(goldens.find(g => g.id === c.id)!.output.selectedStatusEvents)
      if (result.kind === 'Available') expect(result.coverage.kind).toBe(c.coverage)
    })
    test('A01 ordinal slots and shared-capacity risk labels have independent assertions', async () => {
      const created = goldens.find(g => g.id === 'created')!.output
      expect(created.schedule.ok && created.schedule.tasks.find(t => t.taskId === 'T1')?.finishBoundary).toEqual({ date: '2026-11-05', afterHour: 2 })
      expect(created.schedule.ok && created.schedule.tasks.find(t => t.taskId === 'T2')?.startSlot).toEqual({ date: '2026-11-05', hour: 3 })
      expect(created.forecast.weeklyCapacity).toBe(24); expect(created.forecast.knownRemaining).toBe(10)
      expect(goldens.find(g => g.id === 'at-risk')!.output.health.project.label).toBe('At Risk')
      expect(goldens.find(g => g.id === 'late-project')!.output.health.project.label).toBe('Late')
      expect(goldens.find(g => g.id === 'zero-capacity')!.output.forecast.state).toBe('Unavailable')
      const auto = frames.find(c => c.id === 'automatic-as-of')!, repo = referenceFor(auto)
      expect((await observeProjected(repo, await open(repo, auto), auto.asOf)).forecast?.asOfDate).toBe('2026-11-09')
    })
    test('A02 full project completion preserves qualified completion date and zero future effort', async () => {
      let c = baseline(base('all-complete'))
      c = status(status(status(c, 'Complete'), 'Complete', 'T2'), 'Complete', 'T3', '2026-11-02')
      const original = observeLegacy(c), repo = referenceFor(c), projected = await observeProjected(repo, await open(repo, c), c.asOf)
      expect(original.health.project).toMatchObject({ label: 'Completed', completed: true, completionDate: '2026-11-05', knownRemaining: 0 })
      expect(projected.forecast).toEqual(original.forecast); expect(projected.health).toEqual(original.health)
    })
    test('G01 identical operational data cannot distinguish reopened from never-completed legacy impact', async () => {
      const a = frames.find(c => c.id === 'reopened')!, b = frames.find(c => c.id === 'never-completed')!
      const ra = referenceFor(a), rb = referenceFor(b), va = value(await ra.loadOperational(await open(ra, a))), vb = value(await rb.loadOperational(await open(rb, b)))
      expect(va).toEqual(vb)
      const ia = goldens.find(g => g.id === a.id)!.output.impact, ib = goldens.find(g => g.id === b.id)!.output.impact
      expect(ia.ok && ia.tasks.find(t => t.taskId === 'T1')!.reopened).toBe(true)
      expect(ib.ok && ib.tasks.find(t => t.taskId === 'T1')!.reopened).toBe(false)
    })
    test('G02 assumed legacy status origin is lost even when current status values match', async () => {
      const a = frames.find(c => c.id === 'created')!, b = { ...a, id: 'explicit-default', progress: { ...a.progress, tasks: { T1: { status: 'Not Started' as const, criteria: [] } } } }
      const ra = referenceFor(a), rb = referenceFor(b)
      expect(value(await ra.loadOperational(await open(ra, a)))).toEqual(value(await rb.loadOperational(await open(rb, b))))
      const ia = observeLegacy(a).impact, ib = observeLegacy(b).impact
      expect(ia.ok && ia.tasks.find(t => t.taskId === 'T1')!.assumedStatus).toBe(true)
      expect(ib.ok && ib.tasks.find(t => t.taskId === 'T1')!.assumedStatus).toBe(false)
    })
    test('G03 current guidance/dirty state cannot be recovered from operational data', async () => {
      const a = frames.find(c => c.id === 'created')!, b = { ...a, id: 'new-guidance', progress: { ...a.progress, definitionOfDone: 'Changed current guidance' } }
      const ra = referenceFor(a), rb = referenceFor(b)
      expect(value(await ra.loadOperational(await open(ra, a)))).toEqual(value(await rb.loadOperational(await open(rb, b))))
      expect(progressFingerprint(a.progress)).not.toEqual(progressFingerprint(b.progress))
      const data = (c: typeof a) => ({ project: c.project, tasks: c.tasks, nextTaskNumber: 4, taskProgress: c.progress })
      expect(projectFingerprint(data(a))).not.toBe(projectFingerprint(data(b)))
    })
    test('G04 work detail metadata and old correction trail are not encoded by recorded totals', async () => {
      const a = frames.find(c => c.id === 'work-corrected')!, b = { ...a, id: 'edited-description', work: { ...a.work, entries: a.work.entries.map(e => ({ ...e, contributor: 'Different contributor', description: 'Different same-hour detail' })) } }
      const ra = referenceFor(a), rb = referenceFor(b)
      expect(value(await ra.loadOperational(await open(ra, a)))).toEqual(value(await rb.loadOperational(await open(rb, b))))
      expect(observeLegacy(a).selectedEntries).not.toEqual(observeLegacy(b).selectedEntries)
      expect(observeLegacy(a).effort[0]).toEqual(['T1', { actualHours: 1.75, remainingHours: 5, forecastHours: 6.75, baselineHours: 5, varianceHours: 1.75 }])
      expect(observeLegacy(a).selectedEntries.map(e => e.entryId)).toEqual(['W1', 'W3'])
      expect(a.work.entries.find(e => e.entryId === 'W1')!.hours).toBe(1.5)
    })
    test('G05 current known Actual Start has no legacy impact input and is not synthesized into history', async () => {
      const c = frames.find(c => c.id === 'never-completed')!, seed = seedFor(c)
      seed.tasks[0] = { ...seed.tasks[0], facts: { ...seed.tasks[0].facts, start: { kind: 'Known', date: '2026-11-02', recordedAt: null, actorLabel: null, sourceRecordId: null } } }
      const repo = new ReferenceOperationalHistoryRepository('known-start', [seed], { fingerprint: fixtureFingerprint, validate: validateFixtureChange }), session = await open(repo, c)
      expect(value(await repo.loadOperational(session)).facts.T1.start.kind).toBe('Known')
      const old = observeLegacy(c).impact; expect(old.ok && old.tasks[0].state).toBe('Unknown')
      expect((await observeProjected(repo, session, c.asOf)).progressImpact.kind).toBe('Gap')
    })
    test('G06 missing history is an existing decoder failure, not a normalized successful plan', async () => {
      const c = frames.find(c => c.id === 'missing-history-invalid')!
      expect(decodeProgress(c.progress, c.order).ok).toBe(false)
      expect(observeLegacy(c).impact.ok).toBe(false)
      const repo = referenceFor(c), result = await observeProjected(repo, await open(repo, c), c.asOf)
      expect(result.forecastGaps).toEqual(['CompletionEvidenceMissing'])
    })
    test('G07 legacy immediate forecast release and calendar PA future/same-day handling remain distinct', () => {
      const complete = goldens.find(g => g.id === 'complete')!.output
      expect(complete.forecast.tasks.find(t => t.taskId === 'T2')!.forecastStart).toBe('2026-11-02')
      expect(complete.impact.ok && complete.impact.tasks.find(t => t.taskId === 'T1')!.completion?.future).toBe(true)
      expect(complete.impact.ok && complete.impact.tasks.find(t => t.taskId === 'T2')!.state).toBe('Unknown')
      const same = goldens.find(g => g.id === 'same-day-actuals')!.output.impact
      expect(same.ok && same.tasks.find(t => t.taskId === 'T2')!.warnings.some(w => w.includes('same-date actual dependency order is unverified'))).toBe(true)
    })
    test('G08 physical legacy deletion removes evidence; target retirement preserves it', () => {
      const c = frames.find(c => c.id === 'complete')!
      expect(removeTaskProgress(c.progress, 'T1').events).toHaveLength(0)
      const work = frames.find(c => c.id === 'work-corrected')!.work
      expect(removeTaskWork(work, 'T1').entries).toHaveLength(0)
      // No replacement of current Delete behaviour is authorized by this assessment.
    })
    test('G09 legacy timestamp replay rejects skew even though sequence-based DTO reads can retain it', async () => {
      const source = frames.find(c=>c.id==='complete')!, c = { ...source, id: 'clock-skew', progress: { ...source.progress, events: source.progress.events.map((e,i)=>i ? {...e,recordedAt:'2026-11-08T15:00:00.000Z'} : e) } }
      const checked = decodeProgress(c.progress,c.order); expect(checked.ok).toBe(false)
      if(!checked.ok)expect(checked.errors[0].code).toBe('INVALID_STATUS_EVENT_DATE')
      const repo=referenceFor(c),detail=await selectedStatusHistory(repo,await open(repo,c),'T1')
      expect(detail.items.map(e=>e.eventId)).toEqual(c.progress.events.slice().reverse().map(e=>e.eventId))
      // This is a version/clock-policy discrepancy, not legacy decoder parity.
    })
    test('G10 legacy known-field baseline decoding cannot serve as a full opaque-value copy boundary', async () => {
      const c=frames.find(c=>c.id==='created')!,seed=seedFor(c)
      const raw={...c.baseline!,opaqueExtra:{mustRetain:'opaque evidence'}}
      seed.baseline={kind:'Present',baselineId:'B-parity-original',value:JSON.parse(JSON.stringify(raw))}
      const decoded=decodeBaseline(raw);expect(decoded.ok).toBe(true)
      if(decoded.ok)expect('opaqueExtra' in decoded.value).toBe(false)
      const repo=new ReferenceOperationalHistoryRepository('opaque-B',[seed],{fingerprint:fixtureFingerprint,validate:validateFixtureChange}),s=await open(repo,c)
      await observeProjected(repo,s,c.asOf)
      const result=value(await repo.readOriginalBaseline(s));expect(result.kind==='Present'&&result.value).toEqual(raw)
    })
    test('D02 detail paging stays pinned after a concurrent accepted name edit', async () => {
      const c = frames.find(c => c.id === 'reopened')!, repo = referenceFor(c), session = await open(repo, c)
      const before = await selectedStatusHistory(repo, session, 'T1', 1, 1); expect(before.kind).toBe('MoreAvailable')
      const accepted = await repo.commitChange(edit(repo.inspectAccepted(seedFor(c).resourceId), 'concurrent'))
      expect(accepted.kind).toBe('CommitAccepted')
      expect((await selectedStatusHistory(repo, session, 'T1', 1, 10)).items).toEqual(goldens.find(g => g.id === c.id)!.output.selectedStatusEvents)
      expect(session.ref.revision).toBe(17)
    })
    test('D03 Unsupported, unavailable, expired and oversized reads are explicit detail outcomes', async () => {
      const c = frames.find(c => c.id === 'reopened')!, repo = referenceFor(c), session = await open(repo, c)
      const unsupported = overrides(repo, { async queryHistory() { return { kind: 'Unsupported', code: 'NoProvider', message: 'Test capability gap' } } })
      expect((await selectedStatusHistory(unsupported, session, 'T1')).kind).toBe('Failure')
      const seed = seedFor(c); seed.historyAvailable = false
      const absent = new ReferenceOperationalHistoryRepository('unavailable', [seed], { fingerprint: fixtureFingerprint, validate: validateFixtureChange })
      expect((await selectedStatusHistory(absent, await open(absent, c), 'T1')).kind).toBe('Unavailable')
      const tooLarge = overrides(repo, { async queryHistory() { return { kind: 'RecordTooLarge', recordId: 'large', requiredBytes: 200000, maxBytes: 1000 } } })
      expect(await selectedStatusHistory(tooLarge, session, 'T1')).toMatchObject({ kind: 'Failure', code: 'RecordTooLarge' })
      await repo.releaseRead(session); expect(await selectedStatusHistory(repo, session, 'T1')).toMatchObject({ kind: 'Failure', code: 'ReadExpired' })
    })
    test('D04 generic/unrecognised payload and conflicting completion evidence are gaps, not invented transitions', async () => {
      const c = frames.find(c => c.id === 'complete')!, repo = referenceFor(c), session = await open(repo, c)
      const unknown = overrides(repo, { async readHistoricalRecord(s, id, b, signal) { const r = await repo.readHistoricalRecord(s,id,b,signal); return r.kind === 'Read' && r.value.recordType === 'Event' ? { ...r, value: { ...r.value, payload: { opaque: true } } } : r } })
      expect((await observeProjected(unknown, session, c.asOf)).forecastGaps).toContain('LegacyPayloadUnspecified')
      const seed = seedFor(c), task = seed.tasks[0]
      seed.tasks[0] = { ...task, facts: { ...task.facts, committedAtCompletion: { kind: 'Known', date: '2026-11-04', recordedAt: null, actorLabel: null, sourceRecordId: c.progress.events.at(-1)!.eventId } } }
      const bad = new ReferenceOperationalHistoryRepository('conflicting', [seed], { fingerprint: fixtureFingerprint, validate: validateFixtureChange })
      expect((await observeProjected(bad, await open(bad,c), c.asOf)).forecastGaps).toContain('InconsistentCompletionEvidence')
    })
    test('D05 mixed revision replies reject rather than switching to a newer view', async () => {
      const c = frames[1], repo = referenceFor(c), session = await open(repo,c)
      const mixed = overrides(repo, { async loadOperational(s, signal) { const r = await repo.loadOperational(s,signal); return r.kind === 'Read' ? { ...r, watermark: { ...r.watermark, ref: { ...r.watermark.ref, revision: 99 } } } : r } })
      await expect(observeProjected(mixed, session, c.asOf)).rejects.toEqual(new ContractGap('InconsistentPinnedRead'))
    })
    test('D06 retirement and restore episode references stay available without becoming active phantom edges', async () => {
      for (const id of ['retired','restored']) {
        const c = frames.find(c => c.id===id)!, repo = referenceFor(c), s = await open(repo,c)
        const result = value(await repo.queryRetirementEpisodes(s, { lifecycle: 'Any', resolution: 'Any', scope: 'AllEpisodes', date: {basis:'effectiveDate',includeUndated:true},sort:'recordingAsc' }, {limit:10,maxBytes:100000}))
        expect(result.items).toHaveLength(1); expect(result.items[0].archives[0].recordId).toBe('AR-T1-T2')
        expect(result.items[0].restoration.kind).toBe(id==='restored'?'Restored':'Unrestored')
      }
    })
    test('P01 current full-document export/fingerprint still needs global guidance, work details and history', () => {
      const c = frames.find(c => c.id==='work-corrected')!
      const result = createProjectFile({project:c.project,tasks:c.tasks,nextTaskNumber:4,baseline:c.baseline,workTracking:c.work,taskProgress:c.progress,forecastSettings:c.settings}, '2026-11-10T15:00:00.000Z')
      expect(result.ok).toBe(true)
      if(result.ok) {const copy=parseProject(serializeProject(result.value));expect(copy).toEqual(result);expect(result.value.schemaVersion).toBe(5)}
      expect(c.work.entries.find(e=>e.entryId==='W1')!.updatedAt).not.toBe(c.work.entries.find(e=>e.entryId==='W1')!.createdAt)
    })
    test('A03 dense fixture classifies every existing active edge without making a memory/I/O claim', () => {
      const d=goldens.find(g=>g.id==='dense100')!.output
      expect(d.critical.ok&&d.critical.relationships.length).toBe(1034)
      expect(d.schedule.ok&&d.schedule.tasks.length).toBe(100)
      expect(d.network!.edges.length).toBe(1034)
    })
  })
}
