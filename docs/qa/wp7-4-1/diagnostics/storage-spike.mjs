// Isolated design diagnostic. No production adapter, format6 parser or evaluator.
import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const directory = 'docs/qa/wp7-4-1/evidence'
await mkdir(directory, { recursive: true })
const results = []
const pass = (id, details) => { results.push({ id, result: 'Pass', details }) }
const sha = value => createHash('sha256').update(value).digest('hex')
const loader = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-wp741-design', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
let persistence, library
try {
  persistence = await loader.ssrLoadModule('/src/persistence/projectFile.ts')
  library = await loader.ssrLoadModule('/src/persistence/localProjects.ts')
} finally { await loader.close() }
const fixtures = []
for (let version = 1; version <= 5; version++) {
  const path = version < 5 ? `tests/fixtures/wp71/legacy-format-${version}.json` : 'tests/fixtures/wp733/late.json'
  const raw = await readFile(path, 'utf8'), parsed = persistence.parseProject(raw)
  assert.equal(parsed.ok, true, path)
  assert.equal(parsed.value.schemaVersion, version)
  const roundTrip = persistence.parseProject(persistence.serializeProject(parsed.value))
  assert.equal(roundTrip.ok, true)
  assert.deepEqual(roundTrip.value, parsed.value)
  const current = persistence.createProjectFile(parsed.value, '2026-11-07T12:00:00.000Z')
  assert.equal(current.ok, true)
  assert.equal(current.value.schemaVersion, 5)
  const { schemaVersion: originalVersion, savedAt: originalSaved, ...originalData } = parsed.value
  const { schemaVersion: writtenVersion, savedAt: writtenSaved, ...writtenData } = current.value
  assert.deepEqual(writtenData, originalData)
  assert.equal(JSON.stringify(current.value.baseline), JSON.stringify(parsed.value.baseline))
  assert.equal(await readFile(path, 'utf8'), raw)
  fixtures.push({ path, version, sourceSha256: sha(raw), baselinePresent: !!parsed.value.baseline, decodedBaselineSerializationSha256: parsed.value.baseline ? sha(JSON.stringify(parsed.value.baseline)) : null })
  pass(`F${version}`, 'Existing parser/serializer and current-format5 write retain supported data and decoded baseline; original fixture bytes unchanged. Not a v6 migration test.')
}
const v5 = persistence.parseProject(await readFile('tests/fixtures/wp733/late.json', 'utf8')).value
const fake6 = { ...v5, schemaVersion: 6 }
assert.equal(persistence.decodeProject(fake6).ok, false)
pass('F6', 'Current production reader rejects version6; no new reader implemented.')
const unknown = persistence.decodeProject({ ...v5, guidedPlanning: { probe: true } })
assert.equal(unknown.ok, true)
assert.equal(Object.hasOwn(unknown.value, 'guidedPlanning'), false)
pass('F7', 'Current format5 known-field decoder drops an unknown section; confirms need for explicit versioning.')
const poisoned = JSON.stringify({ schemaVersion: 1, projects: [{ name: 'Diagnostic only', savedAt: fake6.savedAt, plan: fake6 }] })
assert.equal(library.readLocalProjects({ getItem: () => poisoned, setItem: () => { throw new Error('Must not write') } }).ok, false)
pass('F8', 'An unsupported record rejects the old whole-library read, without writing.')

const server = createHttpServer((request, response) => { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><html><title>WP741 isolated primitive spike</title><body>Disposable diagnostic only</body></html>') })
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
let environment
try {
  browser = await chromium.launch()
  const context = await browser.newContext({ timezoneId: 'America/Regina' })
  await context.addInitScript(() => {
    const KEY = 'wp741:diagnostic:v2', OLD = 'wp741:diagnostic:v1', LOCK = 'wp741:diagnostic:v2:writer'
    window.wp741 = {
      KEY, OLD, LOCK, accepted: null, events: [],
      reset() { localStorage.setItem(OLD, 'UNCHANGED LEGACY BYTES'); localStorage.setItem(KEY, JSON.stringify({ revision: 0, count: 0, receipts: [] })); this.accepted = localStorage.getItem(KEY) },
      read() { return JSON.parse(localStorage.getItem(KEY)) },
      async attempt({ expected = 0, id = 'T1', delta = 1, fail = '', noLocks = false } = {}) {
        if (noLocks || !navigator.locks?.request) return { kind: 'Unavailable' }
        try {
          return await navigator.locks.request(LOCK, { mode: 'exclusive', ifAvailable: true }, lock => {
            if (!lock) return { kind: 'Busy' }
            if (fail === 'read-denied') throw new DOMException('Injected accessor denial', 'SecurityError')
            const before = this.read(), intent = JSON.stringify({ expected, delta })
            const receipt = before.receipts.find(r => r.id === id)
            if (receipt) return { kind: receipt.intent === intent ? 'AlreadyApplied' : 'Collision' }
            if (before.revision !== expected) return { kind: 'Stale' }
            if (!Number.isSafeInteger(delta)) return { kind: 'Invalid' }
            const candidate = { revision: before.revision + 1, count: before.count + delta, receipts: [...before.receipts, { id, intent }] }
            const text = JSON.stringify(candidate)
            if (fail === 'quota') throw new DOMException('Injected write failure', 'QuotaExceededError')
            localStorage.setItem(KEY, text)
            if (fail === 'publication-omitted') return { kind: 'SavedBeforePublication' }
            this.accepted = text
            return { kind: 'Written' }
          })
        } catch (error) { return { kind: error.name } }
      },
      hold() { this.held = false; this.holding = navigator.locks.request(LOCK, { mode: 'exclusive' }, async () => { this.held = true; await new Promise(resolve => { this.release = resolve }) }) }
    }
    window.addEventListener('storage', event => window.wp741.events.push({ key: event.key, newValue: event.newValue }))
  })
  const url = `http://127.0.0.1:${server.address().port}/`
  let a = await context.newPage(), b = await context.newPage()
  await Promise.all([a.goto(url), b.goto(url)])
  environment = await a.evaluate(() => ({ secureContext: isSecureContext, locks: !!navigator.locks?.request, userAgent: navigator.userAgent }))
  environment.browser = browser.version()
  assert.equal(environment.locks, true)
  assert.equal(environment.secureContext, true)
  pass('B01', environment)
  await a.evaluate(() => window.wp741.reset())
  const original = await a.evaluate(() => localStorage.getItem(window.wp741.KEY))
  assert.equal((await a.evaluate(() => window.wp741.attempt({ noLocks: true }))).kind, 'Unavailable')
  assert.equal(await a.evaluate(() => localStorage.getItem(window.wp741.KEY)), original)
  pass('B02', 'Simulated unavailable lock blocks write; no unlocked fallback.')
  await a.evaluate(() => window.wp741.hold())
  await a.waitForFunction(() => window.wp741.held)
  assert.equal((await b.evaluate(() => window.wp741.attempt())).kind, 'Busy')
  assert.equal(await b.evaluate(() => localStorage.getItem(window.wp741.KEY)), original)
  await a.evaluate(async () => { window.wp741.release(); await window.wp741.holding })
  pass('B03', 'Actual same-origin exclusive lock prevents a cooperating second tab from entering its write callback.')
  const concurrent = await Promise.all([a.evaluate(() => window.wp741.attempt({ id: 'A' })), b.evaluate(() => window.wp741.attempt({ id: 'B' }))])
  assert.equal(concurrent.filter(r => r.kind === 'Written').length, 1)
  assert.ok(concurrent.some(r => ['Busy', 'Stale'].includes(r.kind)))
  assert.equal((await b.evaluate(() => window.wp741.read())).count, 1)
  pass('B04', { outcomes: concurrent, detail: 'One accepted same-revision write, no lost increment from two cooperating tabs.' })
  assert.equal((await b.evaluate(() => window.wp741.attempt({ id: 'STALE' }))).kind, 'Stale')
  pass('B05', 'Revision is rechecked inside lock; stale intent does not write.')
  await a.evaluate(() => window.wp741.reset())
  for (const fail of ['quota', 'read-denied']) {
    const before = await a.evaluate(() => localStorage.getItem(window.wp741.KEY))
    const outcome = await a.evaluate(fail => window.wp741.attempt({ fail }), fail)
    assert.equal(outcome.kind, fail === 'quota' ? 'QuotaExceededError' : 'SecurityError')
    assert.equal(await a.evaluate(() => localStorage.getItem(window.wp741.KEY)), before)
    assert.equal(await a.evaluate(() => window.wp741.accepted), before)
    pass(fail === 'quota' ? 'B06' : 'B07', 'Injected failure before write leaves key and accepted stand-in unchanged; not proof of all platform failure modes.')
  }
  const nativeQuota = await a.evaluate(() => {
    const before = localStorage.getItem(window.wp741.KEY)
    try { localStorage.setItem(window.wp741.KEY, 'X'.repeat(32 * 1024 * 1024)); return { error: null } }
    catch (error) { return { error: error.name, unchanged: before === localStorage.getItem(window.wp741.KEY) } }
  })
  assert.deepEqual(nativeQuota, { error: 'QuotaExceededError', unchanged: true })
  pass('B08', 'Actual oversized Chromium setItem throws QuotaExceededError and retains the previous key value.')
  const denied = await a.evaluate(async () => {
    const frame = document.createElement('iframe'); frame.sandbox = 'allow-scripts'
    frame.srcdoc = '<script>try { localStorage.getItem("probe"); parent.postMessage("unexpected", "*") } catch(e) { parent.postMessage(e.name, "*") }<\/script>'
    const result = await new Promise(resolve => { const listener = event => { if (event.source === frame.contentWindow) { removeEventListener('message', listener); resolve(event.data) } }; addEventListener('message', listener); document.body.append(frame) })
    frame.remove(); return result
  })
  assert.equal(denied, 'SecurityError')
  pass('B09', 'Actual opaque sandbox origin denies localStorage access. This is not a user privacy-setting compatibility test.')
  assert.equal((await a.evaluate(() => window.wp741.attempt({ fail: 'publication-omitted' }))).kind, 'SavedBeforePublication')
  assert.equal(await a.evaluate(() => window.wp741.accepted), original)
  await a.close()
  a = await context.newPage(); await a.goto(url)
  assert.equal((await a.evaluate(() => window.wp741.attempt())).kind, 'AlreadyApplied')
  assert.equal((await a.evaluate(() => window.wp741.read())).count, 1)
  pass('B10', 'Tab close after one successful write with publication omitted: reopened tab reads receipt and retry does not duplicate. Not a power-loss/process-crash durability test.')
  assert.equal((await a.evaluate(() => window.wp741.attempt({ delta: 2 }))).kind, 'Collision')
  pass('B11', 'Same transaction ID with different diagnostic intent rejected.')
  await a.evaluate(() => window.wp741.hold()); await a.waitForFunction(() => window.wp741.held)
  await a.close()
  await b.evaluate(() => navigator.locks.request(window.wp741.LOCK, { mode: 'exclusive', signal: AbortSignal.timeout(3000) }, () => true))
  assert.equal((await b.evaluate(() => window.wp741.attempt({ expected: 1, id: 'AFTER_CLOSE' }))).kind, 'Written')
  pass('B12', 'Closing lock-owning tab releases the actual Web Lock for a cooperating writer within a bounded wait; release is asynchronous, not immediate.')
  a = await context.newPage(); await a.goto(url)
  await a.evaluate(() => window.wp741.hold()); await a.waitForFunction(() => window.wp741.held)
  await b.evaluate(() => localStorage.setItem(window.wp741.KEY, JSON.stringify({ revision: 99, count: 99, receipts: [] })))
  assert.equal((await a.evaluate(() => window.wp741.read())).count, 99)
  await a.evaluate(async () => { window.wp741.release(); await window.wp741.holding })
  pass('B13', 'Negative control: a noncooperating raw setItem bypasses Web Locks. Coordination is not a storage security boundary.')
  assert.equal(await b.evaluate(() => localStorage.getItem(window.wp741.OLD)), 'UNCHANGED LEGACY BYTES')
  pass('B14', 'Independent legacy sentinel bytes unchanged throughout the primitive spike.')
  await context.close()
} finally {
  if (browser) await browser.close()
  await new Promise(resolve => server.close(resolve))
}
await writeFile(`${directory}/storage-spike.json`, JSON.stringify({ designOnly: true, recordedAtUTC: new Date().toISOString(), node: process.version, environment, fixtures, results, limits: ['Counter stand-in only; no format6 decoder, production adapter, evaluator or actual-start workflow', 'One Chromium build on loopback only; no Safari/Firefox/Edge-brand or classroom-device certification', 'No guarantee against noncooperating writers, eviction, browser clearing, power loss or multiple-key atomicity', 'No owner app/server/storage operated on'] }, null, 2) + '\n')
console.log(`PASS: ${results.length} design diagnostics (${fixtures.length} legacy format fixtures; native locks/two tabs/quota/denial and qualified failure simulations). No production behavior or format change.`)
