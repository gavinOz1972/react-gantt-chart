/** Read-only source/scope/preservation checks; writes only assessment evidence. */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..'), repo = resolve(pkg, '../../..')
const base = 'd0e99034c71dc6141ed8d56cad4f1a3be3627051', bridge = 'src/repository/operationalConsumerParity.test.tsx'
const git = (...args) => execFileSync('git', ['-c', 'safe.directory=' + repo.replaceAll('\\', '/'), ...args], { cwd: repo, maxBuffer: 10 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
const sha = b => createHash('sha256').update(b).digest('hex'), canonical = b => b.toString('utf8').replaceAll('\r\n', '\n')
const assert = (v, m) => { if (!v) throw Error(m) }
const inventory = JSON.parse(readFileSync(pkg + '/evidence/consumer-inventory.json', 'utf8'))
assert(git('branch', '--show-current').toString().trim() === 'feature/wp7-stabilization', 'Wrong branch')
const checkedSource = []
for (const f of inventory.files) {
  const current = readFileSync(repo + '/' + f.path)
  assert(sha(current) === f.sha256 || sha(canonical(current)) === f.canonicalLfSha256, 'Inventory drift: ' + f.path)
  if (f.path !== bridge) assert(canonical(current) === canonical(git('show', base + ':' + f.path)), 'Source changed: ' + f.path)
  checkedSource.push(f.path)
}
assert(!inventory.applicationGraph.includes(bridge), 'Bridge enters runtime graph')
for (const p of inventory.applicationGraph) {
  const f = inventory.files.find(f => f.path === p)
  assert(!f.imports.some(i => i.specifier.includes('wp7-4-6') || i.resolved === bridge), 'Assessment runtime import')
}
const provenance = JSON.parse(readFileSync(pkg + '/evidence/golden-provenance.json', 'utf8'))
assert(provenance.projectedAdapterExistedAtCapture === false, 'Oracle capture independence missing')
assert(sha(readFileSync(pkg + '/evidence/legacy-goldens.json')) === provenance.goldenSha256, 'Golden changed')
for (const [p, hash] of Object.entries(provenance.producerHashes)) assert(sha(readFileSync(pkg + '/' + p)) === hash, 'Producer drift: ' + p)
// Producer captured Windows export bytes. Source equality to Git was checked
// above. Accept only the original blob or its CRLF checkout representation.
for (const [p, hash] of Object.entries(provenance.existingSourceHashes)) {
  const original = git('show', base + ':' + p)
  assert(sha(original) === hash || sha(canonical(original).replaceAll('\n', '\r\n')) === hash, 'Original-source provenance drift: ' + p)
}
const manifestPath = repo + '/.wp746-before.log', manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, '')) : null
if (manifest) for (const f of manifest.hashes) assert(sha(readFileSync(repo + '/' + f.path)) === f.sha256, 'Owner edit changed: ' + f.path)
const ownerPaths = new Set(manifest?.hashes.map(f => f.path) ?? [])
const changed = git('diff', '--name-only', base).toString().trim().split(/\r?\n/).filter(Boolean)
for (const p of changed) assert(p === bridge || p.startsWith('docs/qa/wp7-4-6/') || ownerPaths.has(p), 'Out-of-scope tracked change: ' + p)
const protectedExpected = {
  'main': 'a6a1c32c22a2bf074b161e52d523443602843dd7',
  'v1.0-pre-progress': 'a4157bc84392c770c27111da58d779948b110a56',
  'v1.0-pre-progress^{}': 'abb85011dafc9fb0876953e3132880e025ef65da',
  'v1.1-pre-stabilization': '134305f2205eb993ab76672c2d2469d48d91a609',
  'v1.1-pre-stabilization^{}': 'af96d3b257ddfdcbc7f26a968401d634d210aef6',
}
for (const [ref, id] of Object.entries(protectedExpected)) assert(git('rev-parse', ref).toString().trim() === id, 'Protected ref changed: ' + ref)
function walk(p) { return readdirSync(p, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(resolve(p, e.name)) : [resolve(p, e.name)]) }
const originalDist = resolve(repo, '../output/wp7-4-6-verification/baseline-capture/dist')
const assets = existsSync(originalDist) ? walk(originalDist).map(p => {
  const path = relative(originalDist, p).replaceAll('\\', '/'), hash = sha(readFileSync(p))
  assert(sha(readFileSync(repo + '/dist/' + path)) === hash, 'Built asset changed: ' + path)
  return { path, sha256: hash }
}) : []
if (assets.length) assert(walk(repo + '/dist').length === assets.length, 'Extra build assets')
const required = ['README.md', 'CONSUMER-MATRIX.md', 'PARITY-VECTORS.md', 'INTEGRATION-OPTIONS.md', 'GAPS-AND-GATES.md', 'VERIFICATION.md', 'OWNER-RUNBOOK.md']
for (const f of required) assert(existsSync(pkg + '/' + f), 'Required document missing')
const brokenLinks = []
for (const file of walk(pkg).filter(p => p.endsWith('.md'))) {
  for (const match of readFileSync(file, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0]
    const resolved = resolve(dirname(file), target)
    if (target && !/^[a-z]+:\/\//i.test(target) && resolved !== resolve(pkg, 'evidence/scope-audit.json') && !existsSync(resolved)) brokenLinks.push({ file, target })
  }
}
assert(!brokenLinks.length, 'Broken documentation link: ' + JSON.stringify(brokenLinks))
const evidence = { assessmentOnly: true, clientDate: '2026-11-10', recordedAtUTC: new Date().toISOString(), base, branch: 'feature/wp7-stabilization', checkedSourceFiles: checkedSource.length, unchangedExistingSourceFiles: checkedSource.length - 1, staticAppImportClosureIncludingTypes: inventory.applicationGraph.length, noRuntimeAssessmentImport: true, producerAndGoldenHashesVerified: true, preservedOwnerEdits: manifest ? manifest.hashes.length : 'Initial local manifest unavailable; no preservation claim for prior machine', changedTrackedPaths: changed, protectedLocalReferences: protectedExpected, builtAssetsMatchStartingCommit: assets.length ? assets : 'Independent build unavailable on this checkout', requiredDocuments: required, brokenLinks }
writeFileSync(pkg + '/evidence/scope-audit.json', JSON.stringify(evidence, null, 2) + '\n')
console.log('Scope verified: ' + checkedSource.length + ' src files; ' + inventory.applicationGraph.length + ' static App imports including types; owner preservation: ' + (manifest?.hashes.length ?? 'not available') + '; matching assets: ' + assets.length)
