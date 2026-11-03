// @vitest-environment node
import { expect, test } from 'vitest'
import { analyzeCriticalPath, calculateSchedule } from '../domain'
import { workBaseline, workData, workEntry, workRecords, workTimestamp } from '../test/workFixture'
import { chronologicalEntries, decodeWorkTracking, effortSummary, emptyWorkTracking, entryFromDraft, formatEffort, futureWorkWarning, parseEffort, removeTaskWork } from './workTracking'

test.each([10, 0, null])('Complete has zero effective work while preserving the stored estimate %s and recorded arithmetic', remaining => {
  const tracking = { ...workRecords(), remainingHours: { T2: remaining } }
  const before = JSON.stringify(tracking)
  expect(effortSummary(tracking, 'T2', workBaseline(), true)).toEqual({ actualHours: 5.75, remainingHours: 0, forecastHours: 5.75, baselineHours: 8, varianceHours: -2.25 })
  expect(JSON.stringify(tracking)).toBe(before)
  expect(effortSummary(tracking, 'T2').remainingHours).toBe(remaining)
})

test('A01/A02/A03/A05 actual, unknown, zero, effort at completion and baseline variance use permanent IDs', () => {
  expect(effortSummary(emptyWorkTracking(), 'T2', workBaseline())).toEqual({ actualHours: 0, remainingHours: null, forecastHours: null, baselineHours: 8, varianceHours: null })
  expect(effortSummary(workRecords(), 'T2', workBaseline())).toEqual({ actualHours: 5.75, remainingHours: 5, forecastHours: 10.75, baselineHours: 8, varianceHours: 2.75 })
  const zero = effortSummary({ ...workRecords(), remainingHours: { T2: 0 } }, 'T2', workBaseline())
  expect(zero).toEqual({ actualHours: 5.75, remainingHours: 0, forecastHours: 5.75, baselineHours: 8, varianceHours: -2.25 })
  expect(zero).not.toHaveProperty('status')
  expect(effortSummary(workRecords(), 'T2')).toMatchObject({ forecastHours: 10.75, baselineHours: null, varianceHours: null })
})

test('repeated fractional effort uses integer hundredths without display artifacts', () => {
  const tracking = { ...emptyWorkTracking(), entries: Array.from({ length: 100 }, (_, index) => workEntry(`W-${index}`, 0.1)), remainingHours: { T2: 0.2 } }
  expect(effortSummary(tracking, 'T2')).toMatchObject({ actualHours: 10, forecastHours: 10.2 })
  expect(formatEffort(0)).toBe('0'); expect(formatEffort(10)).toBe('10'); expect(formatEffort(10.2)).toBe('10.2')
  expect(formatEffort(0.29)).toBe('0.29')
})

test.each(['', ' ', 'NaN', 'Infinity', 'abc', '0', '-2', '1.001', '1.230', '1e2', '1000000.01'])('A04 rejects invalid work hour draft %j without coercion', text => {
  expect(parseEffort(text).ok).toBe(false)
})
test.each(['0.01', '.25', ' 2.25 ', '3.50', '1000000'])('accepts finite two-place decimal input %s', text => {
  expect(parseEffort(text)).toEqual({ ok: true, value: Number(text) })
})
test('remaining effort distinguishes unknown from zero and rejects negative/excessive precision', () => {
  expect(parseEffort('', true)).toEqual({ ok: true, value: null })
  expect(parseEffort('0', true)).toEqual({ ok: true, value: 0 })
  expect(parseEffort('-1', true).ok).toBe(false)
  expect(parseEffort('2.001', true).ok).toBe(false)
})

test('embedded editable actual or forecast totals cannot override evidence-derived effort', () => {
  const decoded = decodeWorkTracking({ ...workRecords(), actualHours: 999, forecastHours: 1 }, ['T2', 'T9'])
  if (!decoded.ok) throw new Error('Fixture invalid')
  expect(decoded.value).not.toHaveProperty('actualHours')
  expect(decoded.value).not.toHaveProperty('forecastHours')
  expect(effortSummary(decoded.value, 'T2')).toMatchObject({ actualHours: 5.75, forecastHours: 10.75 })
})

test('entry creation trims user text, permits historical work dates and preserves ID/createdAt on correction', () => {
  const draft = { contributor: '  Alex Student  ', workDate: '2020-02-29', hours: '2.25', description: '  Read and reviewed sources  ' }
  const original = JSON.stringify(draft)
  const created = entryFromDraft(draft, 'T2', 'W-NEW', workTimestamp)
  expect(created).toMatchObject({ ok: true, value: { entryId: 'W-NEW', contributor: 'Alex Student', description: 'Read and reviewed sources', hours: 2.25, workDate: '2020-02-29', createdAt: workTimestamp } })
  expect(JSON.stringify(draft)).toBe(original)
  if (!created.ok) return
  const updatedAt = '2026-11-01T01:00:00.000Z'
  const corrected = entryFromDraft({ ...draft, hours: '3.5' }, 'T2', 'DO-NOT-REPLACE', updatedAt, created.value)
  expect(corrected).toMatchObject({ ok: true, value: { entryId: 'W-NEW', hours: 3.5, createdAt: workTimestamp, updatedAt } })
})

test.each([
  { contributor: '' }, { contributor: ' '.repeat(3) }, { contributor: 'a'.repeat(81) },
  { description: '' }, { description: 'x' }, { description: 'x'.repeat(501) },
  { workDate: '' }, { workDate: '2026-02-30' }, { workDate: '0000-01-01' }, { workDate: '2026-2-01' },
])('A04 validates required user fields %#', change => {
  expect(entryFromDraft({ contributor: 'Alex', workDate: '2026-10-28', hours: '2.25', description: 'Read the sources', ...change }, 'T2', 'W-NEW', workTimestamp).ok).toBe(false)
})

test('future date warning is advisory and never changes the entry date', () => {
  expect(futureWorkWarning('2027-01-01', '2026-10-31')).toContain('future')
  expect(futureWorkWarning('2026-10-31', '2026-10-31')).toBeUndefined()
  expect(futureWorkWarning('2026-02-30', '2026-10-31')).toBeUndefined()
  const value = workEntry('W-FUTURE', 2, '2027-01-01')
  const decoded = decodeWorkTracking({ ...emptyWorkTracking(), entries: [value] }, ['T2'])
  expect(decoded).toMatchObject({ ok: true, value: { entries: [value] } })
})

test('correction cannot reassign an existing entry to another task', () => {
  expect(entryFromDraft({ contributor: 'Alex', workDate: '2026-10-28', hours: '1', description: 'Corrected the notes' }, 'T9', 'W-NEW', workTimestamp, workEntry())).toMatchObject({ ok: false, errors: [{ code: 'WORK_TASK_MISMATCH' }] })
})

test('A06 chronological sorting and correction/delete totals do not mutate caller-owned records', () => {
  const tracking = workRecords()
  const reversed = { ...tracking, entries: [...tracking.entries].reverse() }
  expect(chronologicalEntries(reversed, 'T2').map(entry => entry.entryId)).toEqual(['W-1', 'W-2'])
  expect(reversed.entries[0].entryId).toBe('W-2')
  const corrected = { ...tracking, entries: [workEntry('W-1', 1.5), tracking.entries[1]] }
  expect(effortSummary(corrected, 'T2').actualHours).toBe(5)
  expect(effortSummary({ ...corrected, entries: corrected.entries.slice(1) }, 'T2').actualHours).toBe(3.5)
})

test.each([
  null, { schemaVersion: 99 }, { ...workRecords(), entries: 'bad' }, { ...workRecords(), remainingHours: [] },
  { ...workRecords(), entries: [workEntry(), workEntry()] },
  { ...workRecords(), entries: [workEntry('W-ORPHAN', 1, '2026-10-28', 'missing')] },
  { ...workRecords(), entries: [{ ...workEntry(), hours: NaN }] },
  { ...workRecords(), entries: [{ ...workEntry(), hours: Infinity }] },
  { ...workRecords(), entries: [{ ...workEntry(), hours: 1.001 }] },
  { ...workRecords(), entries: [{ ...workEntry(), createdAt: 'bad' }] },
  { ...workRecords(), entries: [{ ...workEntry(), updatedAt: '2026-10-01T00:00:00.000Z' }] },
  { ...workRecords(), remainingHours: { missing: 1 } },
  { ...workRecords(), remainingHours: { T2: -1 } },
  { ...workRecords(), remainingHours: { T2: '2' } },
])('A11 malformed, duplicate or orphaned work data is rejected %#', value => {
  expect(decodeWorkTracking(value, ['T2', 'T9']).ok).toBe(false)
})

test('A08/A13 logging and remaining effort leave baseline, schedule, dependencies and critical path unchanged', () => {
  const baseline = workBaseline()
  const frozen = JSON.stringify(baseline)
  const schedule = calculateSchedule(workData.project, workData.tasks)
  const analysis = analyzeCriticalPath(workData.project, workData.tasks)
  const decoded = decodeWorkTracking(workRecords(), workData.tasks.map(task => task.taskId))
  if (!decoded.ok) throw new Error('Fixture invalid')
  effortSummary(decoded.value, 'T2', baseline)
  expect(JSON.stringify(baseline)).toBe(frozen)
  expect(calculateSchedule(workData.project, workData.tasks)).toEqual(schedule)
  expect(analyzeCriticalPath(workData.project, workData.tasks)).toEqual(analysis)
})

test('A11 deletion removes only the selected task work and preserves other logs; a new task has no inherited effort', () => {
  const original = { ...workRecords(), entries: [...workRecords().entries, workEntry('W-OTHER', 1, '2026-10-29', 'T9')], remainingHours: { T2: 5, T9: 0 } }
  const cleaned = removeTaskWork(original, 'T2')
  expect(cleaned.entries.map(entry => entry.entryId)).toEqual(['W-OTHER'])
  expect(cleaned.remainingHours).toEqual({ T9: 0 })
  expect(original.entries).toHaveLength(3)
  expect(effortSummary(cleaned, 'T20')).toMatchObject({ actualHours: 0, remainingHours: null, forecastHours: null })
})

test('import copies entry and estimate data without sharing references, including prototype-like permanent IDs', () => {
  const original = { ...emptyWorkTracking(), entries: [workEntry('W-SPECIAL', 0.29, '2026-10-28', 'constructor')], remainingHours: Object.fromEntries([['constructor', 0]]) }
  const decoded = decodeWorkTracking(original, ['constructor'])
  if (!decoded.ok) throw new Error('Fixture invalid')
  expect(decoded.value.entries[0]).not.toBe(original.entries[0])
  expect(decoded.value.remainingHours).not.toBe(original.remainingHours)
  expect(effortSummary(decoded.value, 'constructor')).toMatchObject({ actualHours: 0.29, remainingHours: 0, forecastHours: 0.29 })
})
