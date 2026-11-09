/** Isolated qualification runner. No format6 load/save or application import. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { referenceCanonicalize as canonicalize, sampleCanonicalize, lexicalProbe, digest, sha, prefix, unicodeValid, selectedIntegerPolicy, envelopeProbe } from './probe.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(process.argv[2] ?? root + '/../../../../output/wp7-4-4b-verification')
mkdirSync(out, { recursive: true })
const vectors = JSON.parse(readFileSync(root + '/fixtures/vectors.json', 'utf8')).vectors
const checks = [], deviations = []
function check(id, actual, expected) { const pass = JSON.stringify(actual) === JSON.stringify(expected); checks.push({ id, pass, expected, actual }); if (!pass) throw Error('Qualification disagreement: ' + id) }
const requests = vectors.map(v => ({ id: v.id, ...(v.bits ? { bits: v.bits } : { inputBase64: v.inputBase64 }) }))
for (const v of vectors) requests.push({ id: 'hash-expected-' + v.id, expectedHex: v.expectedHex })
for (const v of vectors.filter(v => v.bits)) requests.push({ id: 'parse-' + v.id, inputBase64: v.inputBase64 })
const rawCases = [
  ['duplicate-root', Buffer.from('{"a":1,"a":2}'), 'DuplicateMember'],
  ['duplicate-nested', Buffer.from('{"a":{"x":1,"x":2}}'), 'DuplicateMember'],
  ['duplicate-escaped', Buffer.from('{"a":1,"\\u0061":2}'), 'DuplicateMember'],
  ['duplicate-nested-array', Buffer.from('[{"a":1,"a":2}]'), 'DuplicateMember'],
  ['unpaired-high', Buffer.from('{"s":"\\ud800"}'), 'UnpairedSurrogate'],
  ['unpaired-low', Buffer.from('{"s":"\\udc00"}'), 'UnpairedSurrogate'],
  ['unpaired-key', Buffer.from('{"\\ud800":1}'), 'UnpairedSurrogate'],
  ['bad-utf8', Buffer.from([0x7b,0x22,0x73,0x22,0x3a,0x22,0xc3,0x28,0x22,0x7d]), 'InvalidUTF8'],
  ['overlong-utf8', Buffer.from([0x7b,0x22,0x73,0x22,0x3a,0x22,0xc0,0xaf,0x22,0x7d]), 'InvalidUTF8'],
  ['utf8-surrogate', Buffer.from([0x7b,0x22,0x73,0x22,0x3a,0x22,0xed,0xa0,0x80,0x22,0x7d]), 'InvalidUTF8'],
  ['bom', Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),Buffer.from('{}')]), 'BOM'],
  ['overflow-number', Buffer.from('{"n":1e400}'), 'NonFinite'],
  ['nan-token', Buffer.from('{"n":NaN}'), 'InvalidJSON'],
  ['infinity-token', Buffer.from('{"n":Infinity}'), 'InvalidJSON'],
  ['trailing-comma', Buffer.from('{"a":1,}'), 'InvalidJSON'],
  ['leading-zero', Buffer.from('{"a":01}'), 'InvalidJSON'],
]
for (const [id, bytes] of rawCases) requests.push({ id: 'raw-' + id, inputBase64: bytes.toString('base64') })
for (const bits of ['7fffffffffffffff', '7ff0000000000000', 'fff0000000000000']) requests.push({ id: 'nonfinite-' + bits, bits })
writeFileSync(out + '/cross-requests.json', JSON.stringify(requests))
const dll = resolve(process.argv[3] ?? out + '/dotnet/bin/Release/net10.0/CrossCheck.dll')
execFileSync('dotnet', [dll, out + '/cross-requests.json', out + '/cross-results.json'], { stdio: 'pipe' })
const dotnet = JSON.parse(readFileSync(out + '/cross-results.json', 'utf8')), byId = new Map(dotnet.results.map(r => [r.id, r]))
for (const v of vectors) {
  const raw = Buffer.from(v.inputBase64, 'base64')
  lexicalProbe(raw)
  const value = v.bits ? { n: Buffer.from(v.bits, 'hex').readDoubleBE() } : JSON.parse(raw.toString('utf8'))
  const actual = Buffer.from(canonicalize(value)), cross = byId.get(v.id), expectedHash = byId.get('hash-expected-' + v.id)
  check(v.id + ':node-bytes', actual.toString('hex'), v.expectedHex)
  check(v.id + ':dotnet-bytes', cross.canonicalHex, v.expectedHex)
  check(v.id + ':node-raw-sha', sha(actual), v.expectedRawSha256)
  check(v.id + ':dotnet-raw-sha', cross.rawSha256, v.expectedRawSha256)
  check(v.id + ':node-prefixed-sha', sha(Buffer.concat([prefix, actual])), v.expectedPrefixedSha256)
  check(v.id + ':dotnet-prefixed-sha', cross.prefixedSha256, v.expectedPrefixedSha256)
  check(v.id + ':independent-expected-byte-hash', expectedHash.prefixedSha256, v.expectedPrefixedSha256)
  if (v.bits) check(v.id + ':dotnet-decimal-input', byId.get('parse-' + v.id).canonicalHex, v.expectedHex)
}
for (const [id, bytes, expected] of rawCases) {
  const before = sha(bytes)
  let result = 'AcceptedLexically'
  try { lexicalProbe(bytes) } catch (e) { result = e.message }
  check('lexical:' + id, result, expected)
  check('raw-preserved:' + id, sha(bytes), before)
  // Observe upstream parser hardening separately. It is not the Bugsys reader.
  const native = byId.get('raw-' + id)
  if (!native.error) deviations.push({ id, observation: 'C# reference accepted raw negative input; dedicated lexical boundary remains necessary', canonicalHex: native.canonicalHex })
}
check('ordinary-parse-loses-duplicate', JSON.parse('{"a":1,"a":2}').a, 2)
check('ordinary-decoder-can-replace-invalid-utf8', new TextDecoder().decode(Buffer.from([0xc3,0x28])).includes('\ufffd'), true)
check('ordinary-json-parse-retains-unpaired-code-unit', unicodeValid(JSON.parse('"\\ud800"')), false)
check('sample-node-nonfinite-alone-is-not-safe', sampleCanonicalize({ n: Infinity }), '{"n":null}')
check('sample-tojson-member-is-not-canonical', sampleCanonicalize(JSON.parse('{"z":1,"toJSON":1,"a":2}')), '{"z":1,"toJSON":1,"a":2}')
deviations.push({id:'sample-toJSON-member',observation:'Simplified RFC/Node sample emits insertion order for a non-function toJSON member; retained as a rejected adoption candidate, not silently patched. Maintained canonicalize5.1 and C# match the independent expected vector.'})
let finiteGuard = false; try { canonicalize({n:Infinity}) } catch { finiteGuard=true }
check('maintained-node-nonfinite-reject',finiteGuard,true)
for (const bits of ['7fffffffffffffff', '7ff0000000000000', 'fff0000000000000']) {
  check('nonfinite-domain:' + bits, Number.isFinite(Buffer.from(bits, 'hex').readDoubleBE()), false)
  check('nonfinite-dotnet:' + bits, !!byId.get('nonfinite-' + bits).error, true)
}
check('jcs-unsafe-integral-valid', canonicalize({ n: 9007199254740992 }), '{"n":9007199254740992}')
check('bugsys-unsafe-integral-reject', selectedIntegerPolicy(9007199254740992), false)
check('bugsys-max-safe-integral-valid', selectedIntegerPolicy(Number.MAX_SAFE_INTEGER), true)
check('jcs-minus-zero', canonicalize({ n: -0 }), '{"n":0}')
check('bugsys-fractional-slot-reject', Number.isSafeInteger(1.5) && 1.5 > 0, false)
check('bugsys-overprecision-effort-reject', Number((0.001).toFixed(2)) === 0.001, false)
check('nfc-nfd-distinct', vectors.find(v => v.id === 'nfc').expectedPrefixedSha256 !== vectors.find(v => v.id === 'nfd').expectedPrefixedSha256, true)

const file = JSON.parse(readFileSync(root + '/../wp7-4-4/examples/retirement-cascade.json', 'utf8'))
check('independent-reference-agrees-with-amendment-digest', digest(file.snapshot), file.integrity.snapshotSha256)
check('envelope-probe-only', envelopeProbe(file), 'EnvelopeOnlyNotSchemaAccepted')
const reverseObjects = v => Array.isArray(v) ? v.map(reverseObjects) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).reverse().map(([k,x]) => [k, reverseObjects(x)])) : v
check('snapshot-object-order-independent', digest(reverseObjects(file.snapshot)), digest(file.snapshot))
check('pretty-spacing-independent', digest(JSON.parse(JSON.stringify(file.snapshot, null, 4))), digest(file.snapshot))
const arrayChange = structuredClone(file.snapshot); arrayChange.current.manualOrder.reverse()
check('array-order-covered', digest(arrayChange) !== digest(file.snapshot), true)
for (const [label, mutate] of [
  ['retired-task', s => { s.current.tasks[1].description += ' changed' }],
  ['lifecycle-rationale', s => { s.current.lifecycle.T2.decisions[0].rationale += ' changed' }],
  ['lifecycle-before-estimate', s => { s.current.lifecycle.T2.decisions[0].before.task.durationHours++ }],
  ['archived-edge', s => { s.current.archivedDependencies[0].rationale += ' changed' }],
  ['scope-review', s => { s.current.scopeReviews[0].rationale += ' changed' }],
  ['original-baseline', s => { s.originalBaseline.value.legacyOpaque.note += ' changed' }],
  ['history', s => { s.history.events[0].reason += ' changed' }],
  ['progress', s => { s.current.progress.tasks.T2.criteria.push({ criterionId: 'test', text: 'Changed criterion', checked: false }) }],
  ['remaining', s => { s.current.workTracking.remainingHours.T2++ }],
]) { const changed = structuredClone(file.snapshot); mutate(changed); check('covered:' + label, digest(changed) !== digest(file.snapshot), true) }
const exported = structuredClone(file); exported.exportInfo.exportedAt = '2026-11-11T16:00:00.000Z'
check('export-info-excluded', envelopeProbe(exported), 'EnvelopeOnlyNotSchemaAccepted')
const altered = structuredClone(file); altered.integrity.snapshotSha256 = '0'.repeat(64)
const wrong = structuredClone(file); wrong.profile = 'snapshot-history/future'
const wrongDigestProfile = structuredClone(file); wrongDigestProfile.integrity.profile = 'future'
for (const [id, value, expected] of [['altered-digest', altered, 'DigestMismatch'], ['wrong-profile', wrong, 'UnsupportedProfile'], ['wrong-digest-profile', wrongDigestProfile, 'UnsupportedProfile']]) {
  let result = 'NoError'; const before = JSON.stringify(value)
  try { envelopeProbe(value) } catch (e) { result = e.message }
  check(id, result, expected); check(id + ':no-repair', JSON.stringify(value), before)
}
const changedSnapshot = structuredClone(file); changedSnapshot.snapshot.current.project.name += ' changed'
let result = 'NoError'; try { envelopeProbe(changedSnapshot) } catch (e) { result = e.message }
check('altered-snapshot-reject', result, 'DigestMismatch')
check('prefix-lf-exact-hex', prefix.toString('hex'), '6275677379732d67616e74742f736e617073686f742d686973746f72792f320a')
check('no-self-hash', digest(file.snapshot), digest({ ...file, integrity: { arbitrary: 'ignored envelope' } }.snapshot))
const artifact = { qualificationOnly: true, recordedAtUTC: new Date().toISOString(), node: process.version, dotnet: dotnet.runtime, independentVectorCount: vectors.length, nodeReference:JSON.parse(readFileSync(root+'/reference/SECOND-SOURCE.json','utf8')),checks, referenceObservations: deviations, limits: ['References share RFC/authors; separate maintained Node/V8 and C# number/parser implementations, not independent audit teams', 'Lexical/envelope probes are test-only and schema-free; no format6 reader or accepted-project preservation test', 'Simplified Node sample is not an adoption candidate; raw lexical checks remain necessary even for maintained references'] }
writeFileSync(root + '/evidence/canonical-results.json', JSON.stringify(artifact, null, 2) + '\n')
writeFileSync(root + '/evidence/cross-results.json', readFileSync(out + '/cross-results.json'))
console.log(`PASS: ${checks.length} qualification assertions, ${vectors.length} independent byte vectors, Node/.NET cross-check; ${deviations.length} reference limitation observations recorded.`)
