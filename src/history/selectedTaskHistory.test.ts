import { describe, expect, test, vi, afterEach } from 'vitest'
import { createLoadedTaskHistoryReader, HISTORY_MAX_BYTES, HISTORY_PAGE_SIZE, isLegacyTransition } from './selectedTaskHistory'
import type { HistorySession, HistorySource, SelectedTaskHistoryReader } from './selectedTaskHistory'
import { selectedHistoryFile } from '../test/selectedHistoryFixture'
import { decodeProgress, emptyProgress } from '../progress/taskProgress'
import type { ProgressTracking } from '../progress/taskProgress'
import { selectedTaskHistoryEnabled } from './featureFlag'

afterEach(() => vi.unstubAllEnvs())
const file = selectedHistoryFile()
export const source = (): HistorySource => ({ resourceId: 'loaded-project:1', formatVersion: 5, taskIds: file.tasks.map(t => t.taskId), tracking: file.taskProgress! })
async function open(reader: SelectedTaskHistoryReader, taskId = 'T1'): Promise<HistorySession> {
  const result = await reader.open(taskId); expect(result.kind).toBe('Opened')
  if (result.kind !== 'Opened') throw Error(result.message)
  return result.session
}
const request = { limit: HISTORY_PAGE_SIZE, maxBytes: HISTORY_MAX_BYTES }
describe('WP7.4.7 typed loaded legacy history', () => {
  test('flag defaults off, accepts only true in development, stays off in production', () => {
    vi.stubEnv('DEV', true); vi.stubEnv('VITE_SELECTED_TASK_HISTORY', undefined); expect(selectedTaskHistoryEnabled()).toBe(false)
    vi.stubEnv('VITE_SELECTED_TASK_HISTORY', '1'); expect(selectedTaskHistoryEnabled()).toBe(false)
    vi.stubEnv('VITE_SELECTED_TASK_HISTORY', 'true'); expect(selectedTaskHistoryEnabled()).toBe(true)
    vi.stubEnv('DEV', false); expect(selectedTaskHistoryEnabled()).toBe(false)
  })
  test('43 selected rows use three bounded pages, preserve tie order and exact source wording', async () => {
    const reader = createLoadedTaskHistoryReader(source()), s = await open(reader), rows = []
    let cursor
    do {
      const p = await reader.read(s, { ...request, cursor }); expect(p.kind).toBe('Page')
      if (p.kind !== 'Page') throw Error(p.message)
      expect(p.items.length).toBeLessThanOrEqual(20); expect(p.deliveredBytes).toBeLessThanOrEqual(HISTORY_MAX_BYTES)
      expect(p.deliveredBytes).toBe(new TextEncoder().encode(JSON.stringify(p.items)).byteLength)
      expect(p.watermark).toBe(s.watermark); expect(p.items.every(r => r.taskId === 'T1' && r.actor === null && r.decisionId === null)).toBe(true)
      expect(p.coverage.kind).toBe('Partial'); rows.push(...p.items); cursor = p.nextCursor
    } while (cursor)
    expect(rows.map(r => r.event)).toEqual(file.taskProgress!.events.filter(e => e.taskId === 'T1').slice().reverse())
    expect(rows).toHaveLength(43)
  })
  test('page mutation cannot change loaded source, baseline, work or future pages', async () => {
    const input = source(), before = JSON.stringify(file), reader = createLoadedTaskHistoryReader(input), s = await open(reader)
    const p = await reader.read(s, request)
    if (p.kind !== 'Page') throw Error(p.message)
    Object.assign(p.items[0].event, { note: 'Changed detached output' })
    expect(JSON.stringify(file)).toBe(before)
    const again = await reader.read(s, request); expect(again.kind === 'Page' && again.items[0].event.note).toBeUndefined()
  })
  test('a new immutable source cannot replace a pinned source or reuse its cursor', async () => {
    const reader = createLoadedTaskHistoryReader(source()), s = await open(reader), a = await reader.read(s, request)
    const other = createLoadedTaskHistoryReader({ ...source(), tracking: structuredClone(source().tracking) }), newer = await open(other)
    expect(await other.read(s, request)).toMatchObject({ code: 'ReadExpired' })
    if (a.kind !== 'Page') throw Error(a.message)
    expect(await other.read(newer, { ...request, cursor: a.nextCursor })).toMatchObject({ code: 'InvalidCursor' })
    expect(await reader.read(s, request)).toEqual(a)
  })
  test('release and expiry return ReadExpired; aborted dispatch stays Cancelled', async () => {
    let now = 0
    const r = createLoadedTaskHistoryReader(source(), { now: () => now, lifetimeMs: 100 }), s = await open(r)
    now = 100; expect(await r.read(s, request)).toMatchObject({ code: 'ReadExpired' })
    const next = await open(r); r.release(next); expect(await r.read(next, request)).toMatchObject({ code: 'ReadExpired' })
    const abort = new AbortController(); abort.abort()
    expect(await r.open('T1', abort.signal)).toMatchObject({ code: 'Cancelled' })
    expect(await r.read(s, request, abort.signal)).toMatchObject({ code: 'Cancelled' })
  })
  test('empty format5 is available/partial; pre-status format1 is unavailable', async () => {
    for (const version of [1, 5] as const) {
      const r = createLoadedTaskHistoryReader({ ...source(), formatVersion: version, tracking: emptyProgress() }), p = await r.read(await open(r), request)
      expect(p).toMatchObject({ kind: 'Page', availability: version === 1 ? 'Unavailable' : 'Available', items: [], coverage: { kind: 'Partial' } })
    }
  })
  test('oversized transition stays intact; smaller count/byte limits and cursors are enforced', async () => {
    const r = createLoadedTaskHistoryReader(source()), s = await open(r)
    expect(await r.read(s, { ...request, maxBytes: 2 })).toMatchObject({ code: 'RecordTooLarge' })
    expect(await r.read(s, { ...request, limit: 21 })).toMatchObject({ code: 'InvalidCursor' })
    expect(await r.read(s, { ...request, maxBytes: HISTORY_MAX_BYTES + 1 })).toMatchObject({ code: 'InvalidCursor' })
    const p = await r.read(s, { ...request, limit: 1 }); expect(p.kind === 'Page' && p.items).toHaveLength(1)
  })
  test('missing selected task and unsupported source are explicit failures', async () => {
    expect(await createLoadedTaskHistoryReader(source()).open('missing')).toMatchObject({ code: 'InvalidPayload' })
    const bad = { ...source(), tracking: { ...source().tracking, schemaVersion: 2 } as unknown as ProgressTracking }
    expect(await createLoadedTaskHistoryReader(bad).open('T1')).toMatchObject({ code: 'Unsupported' })
  })
  test('a valid legacy attestation larger than 128 KiB is explicitly refused without truncation', async () => {
    const p = structuredClone(file.taskProgress!), large = Array.from({ length: 300 }, (_, i) => ({ criterionId: `Large-${i}`, text: 'Reviewed evidence '.repeat(26), checked: true }))
    Object.assign(p, { events: p.events.filter(e => e.eventId !== 'H-43') })
    Object.assign(p.events.find(e => e.toStatus === 'Complete')!, { criteriaSnapshot: large })
    Object.assign(p.tasks.T1, { status: 'Complete', criteria: large })
    expect(decodeProgress(p, source().taskIds).ok).toBe(true)
    const r = createLoadedTaskHistoryReader({ ...source(), tracking: p })
    expect(await r.read(await open(r), request)).toMatchObject({ kind: 'Failure', code: 'RecordTooLarge' })
  })
  test.each([
    ['missing effective date', (e: Record<string, unknown>) => { delete e.date }],
    ['undated recording', (e: Record<string, unknown>) => { e.recordedAt = null }],
    ['invalid status', (e: Record<string, unknown>) => { e.toStatus = 'Finished' }],
    ['missing reason', (e: Record<string, unknown>) => { delete e.reason }],
    ['unchecked attestation', (e: Record<string, unknown>) => { e.completionAcknowledged = false }],
    ['missing original guidance', (e: Record<string, unknown>) => { delete e.definitionOfDone }],
    ['invalid completion reference', (e: Record<string, unknown>) => { e.committedFinishDateAtCompletion = 'not-a-date' }],
    ['nontext note', (e: Record<string, unknown>) => { e.note = { html: 'invalid' } }],
  ] as const)('%s rejected consistently with the legacy decoder', async (_name, mutate) => {
    const p = JSON.parse(JSON.stringify(file.taskProgress)) as ProgressTracking
    const complete = p.events.find(e => e.toStatus === 'Complete')!
    // Reopen requires reason; all other mutations target its historical completion.
    const target = _name === 'missing reason' ? p.events.at(-3)! : complete
    mutate(target as unknown as Record<string, unknown>)
    expect(decodeProgress(p, source().taskIds).ok).toBe(false)
    expect(await createLoadedTaskHistoryReader({ ...source(), tracking: p }).open('T1')).toMatchObject({ kind: 'Failure', code: 'InvalidPayload' })
  })
  test('clock skew, duplicate IDs and mismatched current state fail selected replay', async () => {
    for (const kind of ['clock', 'duplicate', 'current']) {
      const p = structuredClone(file.taskProgress!)
      if (kind === 'clock') Object.assign(p.events[1], { recordedAt: '2026-11-08T15:00:00.000Z' })
      if (kind === 'duplicate') Object.assign(p.events[1], { eventId: p.events[0].eventId })
      if (kind === 'current') Object.assign(p.tasks.T1, { status: 'Complete' })
      expect(decodeProgress(p, source().taskIds).ok).toBe(false)
      expect(await createLoadedTaskHistoryReader({ ...source(), tracking: p }).open('T1')).toMatchObject({ code: 'InvalidPayload' })
    }
  })
  test('valid completion criteria are required and unknown optional provenance is never synthesized', () => {
    const e = file.taskProgress!.events.find(e => e.toStatus === 'Complete')!
    expect(isLegacyTransition(e)).toBe(true)
    expect(isLegacyTransition({ ...e, criteriaSnapshot: [{ criterionId: 'C1', text: 'Reviewed', checked: false }] })).toBe(false)
    expect(isLegacyTransition({ ...e, criteriaSnapshot: [{ criterionId: 'C1', text: 'Reviewed', checked: true }, { criterionId: 'C1', text: 'Duplicate', checked: true }] })).toBe(false)
  })
})
