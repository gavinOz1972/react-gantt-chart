/** Frozen-scope and preservation audit. Writes only the new QA evidence. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import ts from 'typescript'
const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), repo = path.resolve(pkg, '../../..')
const base = '678013e5ac57ba2efec5775ea1a780c5198d3932'
const git = (...a) => execFileSync('git', ['-c', 'safe.directory=' + repo.replaceAll('\\', '/'), ...a], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 10 * 1024 * 1024 })
const sha = b => createHash('sha256').update(b).digest('hex'), lf = b => b.toString('utf8').replaceAll('\r\n', '\n')
const check = (v, message) => { if (!v) throw Error(message) }
const modified = ['src/App.tsx', 'src/components/progress/TaskStatusPanel.tsx']
const added = ['src/history/featureFlag.ts', 'src/history/selectedTaskHistory.ts', 'src/history/selectedTaskHistory.test.ts', 'src/components/progress/LegacyTaskHistory.tsx', 'src/components/progress/SelectedTaskHistory.tsx', 'src/components/progress/SelectedTaskHistory.test.tsx', 'src/components/progress/selectedTaskHistory.css', 'src/test/selectedHistoryFixture.ts']
const allowed = p => p.startsWith('docs/qa/wp7-4-7/') || modified.includes(p) || added.includes(p)
check(git('branch', '--show-current').toString().trim() === 'feature/wp7-stabilization', 'Wrong branch')
const manifestPath = repo + '/.wp747-before.log', manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, '')) : null
if (manifest) for (const f of manifest.hashes) check(sha(fs.readFileSync(repo + '/' + f.path)) === f.sha256, 'Owner edit changed: ' + f.path)
const ownerPaths = new Set(manifest?.hashes.map(f => f.path) ?? [])
const changed = git('diff', '--name-only', base).toString().trim().split(/\r?\n/).filter(Boolean)
for (const p of changed) check(allowed(p) || ownerPaths.has(p), 'Out-of-scope tracked change: ' + p)
for (const p of git('ls-files', '--others', '--exclude-standard').toString().trim().split(/\r?\n/).filter(Boolean)) check(allowed(p), 'Unexpected new file: ' + p)
const originalFiles = git('ls-tree', '-r', '--name-only', base, '--', 'src').toString().trim().split(/\r?\n/)
for (const p of originalFiles) if (!modified.includes(p)) check(lf(fs.readFileSync(repo + '/' + p)) === lf(git('show', base + ':' + p)), 'Existing source changed: ' + p)
const app = lf(fs.readFileSync(repo + '/src/App.tsx')), originalApp = lf(git('show', base + ':src/App.tsx'))
check(app.replace(/^.*historyContext=\{\{ resourceId:.*\n/m, '') === originalApp, 'App change exceeds read-context prop')
const sourceEvidence = [...modified, ...added].map(p => ({ path: p, sha256: sha(fs.readFileSync(repo + '/' + p)) }))
const config = ts.readConfigFile(repo + '/tsconfig.app.json', ts.sys.readFile)
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, repo).options, graph = new Map()
function visit(p) {
  if (graph.has(p)) return
  const text = fs.readFileSync(p, 'utf8'), imports = []
  graph.set(p, imports)
  for (const i of ts.preProcessFile(text).importedFiles) {
    const resolved = ts.resolveModuleName(i.fileName, p, options, ts.sys).resolvedModule
    if (resolved && !resolved.isExternalLibraryImport && /\.tsx?$/.test(resolved.resolvedFileName)) { imports.push(resolved.resolvedFileName); visit(resolved.resolvedFileName) }
  }
}
visit(repo + '/src/main.tsx')
const closure = [...graph.keys()].map(p => path.relative(repo, p).replaceAll('\\', '/')).sort()
check(!closure.some(p => /\.test\.|\/test\/|docs\/qa|\/repository\//.test(p)), 'Test or repository capability entered App graph')
for (const p of ['src/history/selectedTaskHistory.ts', 'src/components/progress/SelectedTaskHistory.tsx']) check(!/\bfetch\s*\(|localStorage|sessionStorage|commitChange|onCriteria|onRequest/.test(fs.readFileSync(repo + '/' + p, 'utf8')), 'Write/storage dependency entered history slice')
const provenance = JSON.parse(fs.readFileSync(pkg + '/evidence/original-panel-provenance.json', 'utf8'))
check(sha(fs.readFileSync(pkg + '/evidence/original-panel.html')) === provenance.htmlSha256, 'Original HTML changed')
const fixture = fs.readFileSync(repo + '/src/test/selectedHistoryFixture.ts')
check(sha(fixture) === provenance.fixtureSha256 || sha(lf(fixture)) === provenance.fixtureSha256, 'Original fixture producer changed')
const originalPanel = git('show', base + ':src/components/progress/TaskStatusPanel.tsx')
check(sha(originalPanel) === provenance.originalPanelSha256 || sha(lf(originalPanel).replaceAll('\n', '\r\n')) === provenance.originalPanelSha256, 'Original capture source provenance mismatch')
const refs = { main: 'a6a1c32c22a2bf074b161e52d523443602843dd7', 'v1.0-pre-progress': 'a4157bc84392c770c27111da58d779948b110a56', 'v1.0-pre-progress^{}': 'abb85011dafc9fb0876953e3132880e025ef65da', 'v1.1-pre-stabilization': '134305f2205eb993ab76672c2d2469d48d91a609', 'v1.1-pre-stabilization^{}': 'af96d3b257ddfdcbc7f26a968401d634d210aef6' }
for (const [ref, id] of Object.entries(refs)) check(git('rev-parse', ref).toString().trim() === id, 'Protected ref changed: ' + ref)
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.resolve(p, e.name)) : [path.resolve(p, e.name)])
const assets = dir => fs.existsSync(dir) ? walk(dir).map(p => ({ path: path.relative(dir, p).replaceAll('\\', '/'), bytes: fs.statSync(p).size, sha256: sha(fs.readFileSync(p)) })) : []
const required = ['README.md', 'UI-ACCEPTANCE.md', 'CONTRACT-DELTA.md', 'VERIFICATION.md', 'OWNER-RUNBOOK.md']
for (const f of required) check(fs.existsSync(pkg + '/' + f), 'Required doc missing')
for (const f of walk(pkg).filter(p => p.endsWith('.md'))) for (const m of fs.readFileSync(f, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
  const target = m[1].split('#')[0], resolved = path.resolve(path.dirname(f), target)
  if (target && !/^[a-z]+:\/\//i.test(target) && resolved !== path.resolve(pkg, 'evidence/scope-audit.json')) check(fs.existsSync(resolved), 'Broken doc link: ' + target)
}
const output = { clientDate: '2026-11-10', recordedAtUTC: new Date().toISOString(), base, branch: 'feature/wp7-stabilization', preservedOwnerEdits: manifest?.hashes.length ?? 'Local before-manifest unavailable', unchangedExistingSourceFiles: originalFiles.length - modified.length, modifiedExistingSource: modified, addedSource: sourceEvidence.filter(f => added.includes(f.path)), sourceHashes: sourceEvidence, staticAppImportClosureIncludingTypes: closure, noTestsOrGenericRepositoryInApp: true, historyHasNoWriteOrStorageDependency: true, originalHtmlAndProducerVerified: true, protectedLocalReferences: refs, baselineAssets: assets(path.resolve(repo, '../output/wp7-4-7-verification/baseline/dist')), currentAssets: assets(repo + '/dist'), requiredDocuments: required, changedTrackedPaths: changed }
fs.writeFileSync(pkg + '/evidence/scope-audit.json', JSON.stringify(output, null, 2) + '\n')
console.log('Scope verified: ' + output.unchangedExistingSourceFiles + ' unchanged original src files; ' + modified.length + ' allowed modifications, ' + added.length + ' new src files; owner files preserved: ' + output.preservedOwnerEdits)
