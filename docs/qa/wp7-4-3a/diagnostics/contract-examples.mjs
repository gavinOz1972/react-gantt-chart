// NON-PRODUCTION contract examples over a toy snapshot, not a Bugsys repository
// adapter, format6 codec, HTTP client, browser store or domain implementation.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

const clone = value => structuredClone(value)
const canonical = value => JSON.stringify(sort(value))
function sort(value) {
  if (Array.isArray(value)) return value.map(sort)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sort(value[key])]))
  return value
}
const hash = value => createHash('sha256').update(canonical(value)).digest('hex')
const ref = snapshot => ({ revision: snapshot.logicalRevision, fingerprint: hash(snapshot) })
const failures = (kind, code) => ({ kind, code, outcome: 'NotCommitted' })
const checks = []
const pass = (id, details) => checks.push({ id, result: 'Pass', details })

class MemoryBacking {
  constructor(serialized) { this.serialized = serialized; this.rows = new Map() }
  get(id) { const value = this.rows.get(id); return value === undefined ? undefined : this.serialized ? JSON.parse(value) : clone(value) }
  all() { return [...this.rows.keys()].map(id => [id, this.get(id)]) }
  put(id, value) { this.rows.set(id, this.serialized ? JSON.stringify(value) : clone(value)) }
}
class ReferenceFake {
  constructor(namespace, serialized = false, backing = new MemoryBacking(serialized)) { this.namespace = namespace; this.backing = backing; this.fault = ''; this.coordination = true }
  async load(id) { const record = this.backing.get(id); return record ? { kind: 'Loaded', projectId: id, ref: ref(record.snapshot), snapshot: record.snapshot } : { kind: 'NotFound', projectId: id } }
  async list() { return { kind: 'Listed', items: this.backing.all().map(([id, r]) => ({ projectId: id, label: r.label, ref: ref(r.snapshot) })).sort((a, b) => a.projectId.localeCompare(b.projectId, 'en')) } }
  validate(snapshot) {
    if (snapshot?.model !== 'illustration/1') return failures('Unsupported', 'ToyModel')
    if (!Number.isSafeInteger(snapshot.logicalRevision) || snapshot.logicalRevision < 1 || !Array.isArray(snapshot.revisions) || snapshot.revisions.length !== snapshot.logicalRevision || snapshot.revisions.some((r, i) => r.revision !== i + 1) || !Array.isArray(snapshot.events) || !Array.isArray(snapshot.tasks)) return failures('Validation', 'ToyShape')
    for (const [, record] of this.backing.all()) if (record.snapshot.lineageId === snapshot.lineageId && record.snapshot.baseline && canonical(record.snapshot.baseline) !== canonical(snapshot.baseline)) return failures('Validation', 'KnownBaselineMismatch')
    return null
  }
  failureBeforeWrite() {
    if (!this.coordination) return failures('Unsupported', 'ConditionalWriteUnavailable')
    if (['quota', 'security'].includes(this.fault)) return failures('StorageFailure', this.fault)
    return null
  }
  async create(request) {
    const digest = hash({ operation: 'Create', label: request.label, snapshot: request.snapshot })
    const old = this.backing.all().find(([, r]) => r.createTransactionId === request.transactionId)
    if (old) return old[1].createDigest === digest ? { kind: 'AlreadyCreated', projectId: old[0], ref: ref(old[1].snapshot) } : failures('Conflict', 'TransactionIdReuse')
    const problem = this.validate(request.snapshot) ?? this.failureBeforeWrite()
    if (problem) return problem
    const id = `${this.namespace}-${this.backing.rows.size + 1}`
    this.backing.put(id, { label: request.label, snapshot: request.snapshot, createTransactionId: request.transactionId, createDigest: digest, receipts: [] })
    if (this.fault === 'after-write') return { kind: 'OutcomeUnknown', transactionId: request.transactionId }
    return { kind: 'Created', projectId: id, ref: ref(request.snapshot) }
  }
  async commit(request) {
    const record = this.backing.get(request.projectId)
    if (!record) return { kind: 'NotFound', projectId: request.projectId }
    const digest = hash({ operation: 'Commit', projectId: request.projectId, expected: request.expected, snapshot: request.snapshot })
    const receipt = record.receipts.find(r => r.transactionId === request.transactionId)
    if (receipt) return receipt.digest === digest ? { kind: 'AlreadyCommitted', receipt: clone(receipt), currentRef: ref(record.snapshot) } : failures('Conflict', 'TransactionIdReuse')
    if (canonical(ref(record.snapshot)) !== canonical(request.expected)) return failures('Conflict', 'StaleRevision')
    const problem = this.validate(request.snapshot) ?? this.failureBeforeWrite()
    if (problem) return problem
    const before = record.snapshot, next = request.snapshot, group = next.revisions.at(-1)
    if (next.lineageId !== before.lineageId || next.logicalRevision !== before.logicalRevision + 1 || canonical(next.revisions.slice(0, -1)) !== canonical(before.revisions) || canonical(next.events.slice(0, before.events.length)) !== canonical(before.events) || group.transactionId !== request.transactionId) return failures('Validation', 'RevisionOrAppendOnly')
    const completed = next.tasks.filter(t => t.status === 'Complete' && before.tasks.find(old => old.taskId === t.taskId)?.status !== 'Complete')
    if (completed.some(t => !next.events.slice(before.events.length).some(e => e.taskId === t.taskId)) || completed.length && !group.operations.includes('Completion')) return failures('Validation', 'PartialCompletion')
    if (canonical(next.tasks.map(t => t.predecessors)) !== canonical(before.tasks.map(t => t.predecessors)) && !group.operations.includes('DependencyDecision')) return failures('Validation', 'MissingDecision')
    record.snapshot = clone(next)
    const saved = { projectId: request.projectId, transactionId: request.transactionId, digest, ref: ref(next) }
    record.receipts.push(saved)
    this.backing.put(request.projectId, record) // toy single critical section, no await
    if (this.fault === 'after-write') return { kind: 'OutcomeUnknown', transactionId: request.transactionId }
    return { kind: 'Committed', receipt: saved, currentRef: ref(next) }
  }
}
const initial = () => ({ model: 'illustration/1', lineageId: 'P-portable', logicalRevision: 1, baseline: { baselineId: 'B-first', projectId: 'P-portable', original: 'unchanged' }, tasks: [{ taskId: 'T1', predecessors: [], status: 'In Progress' }, { taskId: 'T2', predecessors: ['T1'], status: 'Not Started' }], events: [], unresolved: [], revisions: [{ revision: 1, transactionId: 'seed', operations: ['Seed'] }] })
function next(snapshot, transactionId) {
  const candidate = clone(snapshot); candidate.logicalRevision++
  candidate.revisions.push({ revision: candidate.logicalRevision, transactionId, operations: [] })
  return candidate
}
function review(snapshot, transactionId) {
  const candidate = next(snapshot, transactionId)
  candidate.tasks[0].status = 'Complete'; candidate.tasks[1].predecessors = []
  candidate.events.push({ eventId: 'E1', taskId: 'T1', date: '2026-11-06', reference: '2026-11-02' })
  candidate.unresolved.push({ decisionId: 'U1', taskId: 'T2', reason: 'Actual Start evidence remains Unknown' })
  candidate.revisions.at(-1).operations = ['Completion', 'DependencyDecision', 'Unresolved']
  return candidate
}
const repo = new ReferenceFake('object'), start = initial(), source = canonical(start)
const created = await repo.create({ transactionId: 'create-one', label: 'Same name', snapshot: start })
assert.equal(created.kind, 'Created'); assert.equal(canonical(start), source)
pass('C01', 'One complete toy snapshot created; caller input unchanged.')
assert.equal((await repo.create({ transactionId: 'create-one', label: 'Same name', snapshot: start })).kind, 'AlreadyCreated')
pass('C02', 'Create retry uses same resource identity without an additional resource.')
assert.equal((await repo.create({ transactionId: 'create-one', label: 'Changed intent', snapshot: start })).kind, 'Conflict')
pass('C03', 'Create transaction ID reused for different intent conflicts.')
const copies = await Promise.all(['copy-a', 'copy-b'].map(transactionId => repo.create({ transactionId, label: 'Same name', snapshot: start })))
assert.ok(copies.every(c => c.kind === 'Created')); assert.notEqual(copies[0].projectId, copies[1].projectId)
assert.equal((await repo.list()).items.length, 3)
pass('C04', 'Two simulated simultaneous Save As commands with the same label create distinct stable IDs.')
assert.equal((await repo.load('absent')).kind, 'NotFound')
pass('C05', 'Load of missing resource returns NotFound.')
const loaded = await repo.load(created.projectId), candidate = review(loaded.snapshot, 'review-2')
const request = { projectId: created.projectId, expected: loaded.ref, transactionId: 'review-2', snapshot: candidate }
const saved = await repo.commit(request); assert.equal(saved.kind, 'Committed')
const after = await repo.load(created.projectId)
assert.equal(after.ref.revision, 2); assert.equal(after.snapshot.events.length, 1); assert.deepEqual(after.snapshot.tasks[1].predecessors, []); assert.equal(after.snapshot.unresolved.length, 1); assert.deepEqual(after.snapshot.baseline, start.baseline)
pass('C06', 'Completion, edge decision and Unresolved are one accepted revision2 with unchanged baseline.')
assert.equal((await repo.commit(request)).kind, 'AlreadyCommitted'); assert.equal((await repo.load(created.projectId)).snapshot.events.length, 1)
pass('C07', 'Identical conditional commit retry is idempotent, not a new event or revision.')
assert.equal((await repo.commit({ ...request, snapshot: { ...candidate, unresolved: [] } })).kind, 'Conflict')
pass('C08', 'Reused commit ID with changed complete candidate conflicts.')
const stale = { ...request, transactionId: 'stale-new', snapshot: review(loaded.snapshot, 'stale-new') }
assert.equal((await repo.commit(stale)).code, 'StaleRevision')
pass('C09', 'Old expected revision rejects without overwrite.')
const badBaseline = next(after.snapshot, 'baseline-change'); badBaseline.baseline.original = 'changed'
assert.equal((await repo.commit({ ...request, expected: after.ref, transactionId: 'baseline-change', snapshot: badBaseline })).code, 'KnownBaselineMismatch')
pass('C10', 'Changed baseline rejects before persistence.')
const removedBaseline = next(after.snapshot, 'baseline-remove'); delete removedBaseline.baseline
assert.equal((await repo.commit({ ...request, expected: after.ref, transactionId: 'baseline-remove', snapshot: removedBaseline })).kind, 'Validation')
pass('C11', 'Removing an existing baseline rejects.')
const badShape = next(after.snapshot, 'bad-shape'); badShape.logicalRevision = 0
assert.equal((await repo.commit({ ...request, expected: after.ref, transactionId: 'bad-shape', snapshot: badShape })).kind, 'Validation')
pass('C12', 'Malformed toy candidate rejects; not validation of actual Bugsys schema.')
assert.equal((await repo.create({ transactionId: 'unsupported', label: 'Unknown', snapshot: { model: 'future' } })).kind, 'Unsupported')
pass('C13', 'Unknown illustrative model returns Unsupported.')
assert.equal((await repo.commit({ ...request, projectId: 'missing' })).kind, 'NotFound')
pass('C14', 'Commit to missing resource never recreates it.')
const stable = canonical(await repo.load(created.projectId))
for (const fault of ['quota', 'security']) {
  repo.fault = fault
  const snap = next(after.snapshot, `fail-${fault}`)
  assert.equal((await repo.commit({ ...request, expected: after.ref, transactionId: `fail-${fault}`, snapshot: snap })).kind, 'StorageFailure')
  assert.equal(canonical(await repo.load(created.projectId)), stable)
  pass(fault === 'quota' ? 'C15' : 'C16', `Injected ${fault} failure before toy critical-section write leaves saved data unchanged.`)
}
repo.fault = ''; repo.coordination = false
assert.equal((await repo.commit({ ...request, expected: after.ref, transactionId: 'no-lock', snapshot: next(after.snapshot, 'no-lock') })).kind, 'Unsupported')
assert.equal(canonical(await repo.load(created.projectId)), stable)
repo.coordination = true
pass('C17', 'Simulated unavailable coordination fails closed; no real browser lock exercised.')
const cancelledDraft = next(after.snapshot, 'cancelled'); cancelledDraft.unresolved = []
assert.equal(canonical(await repo.load(created.projectId)), stable)
pass('C18', 'Preparing/cancelling a local draft without invoking commit makes no saved change.')
repo.fault = 'after-write'
const unknownRequest = { ...request, expected: after.ref, transactionId: 'lost-ack', snapshot: next(after.snapshot, 'lost-ack') }
assert.equal((await repo.commit(unknownRequest)).kind, 'OutcomeUnknown')
assert.equal((await repo.load(created.projectId)).ref.revision, 3)
repo.fault = ''
assert.equal((await repo.commit(unknownRequest)).kind, 'AlreadyCommitted')
pass('C19', 'Simulated write-before-publication/lost acknowledgement reconciles through retry; not a crash durability test.')
const now = await repo.load(created.projectId)
await repo.commit({ ...request, expected: now.ref, transactionId: 'later-4', snapshot: next(now.snapshot, 'later-4') })
const oldReceipt = await repo.commit(request)
assert.equal(oldReceipt.receipt.ref.revision, 2); assert.equal(oldReceipt.currentRef.revision, 4)
pass('C20', 'Old successful retry returns original receipt and current revision separately; no UI rollback to old candidate.')
const raceBase = await repo.load(created.projectId)
const two = await Promise.all(['left', 'right'].map(transactionId => repo.commit({ projectId: created.projectId, expected: raceBase.ref, transactionId, snapshot: next(raceBase.snapshot, transactionId) })))
assert.equal(two.filter(r => r.kind === 'Committed').length, 1); assert.equal(two.filter(r => r.kind === 'Conflict').length, 1)
pass('C21', 'One same-base write wins under the fake synchronous critical section; other conflicts. Not actual parallel browser proof.')
const beforeEventEdit = await repo.load(created.projectId), eventEdit = next(beforeEventEdit.snapshot, 'edit-history'); eventEdit.events[0].date = '2026-11-03'
assert.equal((await repo.commit({ projectId: created.projectId, expected: beforeEventEdit.ref, transactionId: 'edit-history', snapshot: eventEdit })).code, 'RevisionOrAppendOnly')
pass('C22', 'Rewriting old historical facts rejects; corrections must append.')
const portable = JSON.stringify({ kind: 'wp743a-illustration-only', exportedAt: '2026-11-07', snapshot: beforeEventEdit.snapshot })
const second = new ReferenceFake('serialized', true), imported = JSON.parse(portable)
const importedResult = await second.create({ transactionId: 'import-copy', label: 'Copied', snapshot: imported.snapshot })
const importedLoad = await second.load(importedResult.projectId)
assert.notEqual(importedResult.projectId, created.projectId); assert.deepEqual(importedLoad.snapshot, beforeEventEdit.snapshot); assert.deepEqual(importedLoad.ref, beforeEventEdit.ref)
pass('C23', 'Object-memory export -> serialized-memory import preserves toy lineage/task IDs/history/revision/baseline, with a new repository ID.')
assert.equal(hash(JSON.parse(JSON.stringify({ ...JSON.parse(portable), exportedAt: 'different' })).snapshot), hash(imported.snapshot))
pass('C24', 'Changing transport export metadata does not alter semantic snapshot fingerprint.')
const back = await repo.create({ transactionId: 'import-back', label: 'Same name', snapshot: importedLoad.snapshot })
assert.deepEqual((await repo.load(back.projectId)).snapshot, beforeEventEdit.snapshot)
pass('C25', 'Reverse fake-adapter transfer is lossless; no real API/DBMS or format6 exercised.')
const receiptless = { projectId: importedResult.projectId, expected: beforeEventEdit.ref, transactionId: 'cross-adapter-next', snapshot: next(importedLoad.snapshot, 'cross-adapter-next') }
assert.equal((await second.commit(receiptless)).kind, 'Committed')
pass('C26', 'Fresh imported resource can conditionally commit at the preserved logical revision; receipts are repository-local.')
const noEvent = initial(); noEvent.logicalRevision = 2; noEvent.revisions.push({ revision: 2, transactionId: 'partial', operations: ['Completion'] }); noEvent.tasks[0].status = 'Complete'
const partialRepo = new ReferenceFake('partial'), p = await partialRepo.create({ transactionId: 'p-create', label: 'P', snapshot: initial() })
assert.equal((await partialRepo.commit({ projectId: p.projectId, expected: p.ref, transactionId: 'partial', snapshot: noEvent })).code, 'PartialCompletion')
pass('C27', 'Toy completion without its evidence rejects as a whole, not partially applied.')
const beforeTamper = await partialRepo.load(p.projectId), raw = partialRepo.backing.get(p.projectId); raw.snapshot.unresolved.push('external write'); partialRepo.backing.put(p.projectId, raw)
assert.equal((await partialRepo.commit({ projectId: p.projectId, expected: beforeTamper.ref, transactionId: 'tamper-check', snapshot: next(beforeTamper.snapshot, 'tamper-check') })).code, 'StaleRevision')
pass('C28', 'Same counter with externally changed content fails fingerprint comparison; this is not cryptographic protection from external editing.')

// Read-only inspection of existing formats, not an invented format6 migration.
const loader = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-wp743a-contracts', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
let parseProject, serializeProject
try { ({ parseProject, serializeProject } = await loader.ssrLoadModule('/src/persistence/projectFile.ts')) } finally { await loader.close() }
for (let version = 1; version <= 5; version++) {
  const path = version < 5 ? `tests/fixtures/wp71/legacy-format-${version}.json` : 'tests/fixtures/wp733/late.json'
  const raw = await readFile(path, 'utf8'), decoded = parseProject(raw)
  assert.equal(decoded.ok, true); assert.equal(decoded.value.schemaVersion, version)
  const again = parseProject(serializeProject(decoded.value)); assert.equal(again.ok, true); assert.deepEqual(again.value, decoded.value)
  assert.equal(await readFile(path, 'utf8'), raw)
  pass(`L${version}`, `${path}: unchanged existing codec round-trip/source text. New format6 copy-upgrade remains a future acceptance test.`)
}
await mkdir('docs/qa/wp7-4-3a/evidence', { recursive: true })
await writeFile('docs/qa/wp7-4-3a/evidence/contract-examples.json', JSON.stringify({ designOnly: true, recordedAtUTC: new Date().toISOString(), node: process.version, checks, limits: ['Toy in-memory reference only, not production repository or domain validation', 'Serialized/object fake backings only, no real browser/API/DBMS substitutability proof', 'Faults/races/unknown acknowledgement simulated in one Node event loop', 'No format6 decoder, native storage mutation, baseline/source/user-data change or scheduling/domain logic change'] }, null, 2) + '\n')
console.log(`PASS: ${checks.length} illustrative checks (28 fake contract cases + five existing-format read-only checks); no production repository or format6 implemented.`)
