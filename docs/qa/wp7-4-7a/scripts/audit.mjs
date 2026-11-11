import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import ts from 'typescript'
const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), repo = path.resolve(pkg, '../../..')
const base = '07faed745d66502033ab7a60ac9dfc612512fe8f'
const git = (...a) => execFileSync('git', ['-c', 'safe.directory=' + repo.replaceAll('\\', '/'), ...a], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 10 * 1024 * 1024 })
const sha = b => createHash('sha256').update(b).digest('hex'), lf = b => b.toString('utf8').replaceAll('\r\n', '\n')
const check = (condition, message) => { if (!condition) throw Error(message) }
const changedExisting = ['src/components/progress/SelectedTaskHistory.tsx', 'src/components/progress/selectedTaskHistory.css', 'src/components/progress/SelectedTaskHistory.test.tsx', 'docs/qa/wp7-4-7/browser/history.spec.ts']
const added = ['src/components/progress/SelectedTaskHistory.ux.test.tsx', 'docs/ux/BUGSYS-UX-ADVISOR.md']
const allowed = p => p.startsWith('docs/qa/wp7-4-7a/') || changedExisting.includes(p) || added.includes(p)
check(git('branch', '--show-current').toString().trim() === 'feature/wp7-stabilization', 'Wrong branch')
const manifestPath = repo + '/.wp747a-before.log', manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null
if (manifest) for (const f of manifest.hashes) check(sha(fs.readFileSync(repo + '/' + f.path)) === f.sha256, 'Owner edit changed: ' + f.path)
const owner = new Set(manifest?.hashes.map(f => f.path) ?? [])
const changed = git('diff', '--name-only', base).toString().trim().split(/\r?\n/).filter(Boolean)
for (const p of changed) check(allowed(p) || owner.has(p), 'Out-of-scope change: ' + p)
for (const p of git('ls-files', '--others', '--exclude-standard').toString().trim().split(/\r?\n/).filter(Boolean)) check(allowed(p), 'Unexpected untracked file: ' + p)
const originalSource = git('ls-tree', '-r', '--name-only', base, '--', 'src').toString().trim().split(/\r?\n/)
for (const p of originalSource) if (!changedExisting.includes(p)) check(lf(fs.readFileSync(repo + '/' + p)) === lf(git('show', base + ':' + p)), 'Protected source changed: ' + p)
const previousEvidence = JSON.parse(git('show', base + ':docs/qa/wp7-4-7/evidence/scope-audit.json').toString())
const options = ts.parseJsonConfigFileContent(ts.readConfigFile(repo + '/tsconfig.app.json', ts.sys.readFile).config, ts.sys, repo).options, graph = new Set()
function visit(file) {
  if (graph.has(file)) return
  graph.add(file)
  for (const i of ts.preProcessFile(fs.readFileSync(file, 'utf8')).importedFiles) {
    const found = ts.resolveModuleName(i.fileName, file, options, ts.sys).resolvedModule
    if (found && !found.isExternalLibraryImport && /\.tsx?$/.test(found.resolvedFileName)) visit(found.resolvedFileName)
  }
}
visit(repo + '/src/main.tsx')
const imports = [...graph].map(p => path.relative(repo, p).replaceAll('\\', '/')).sort()
check(JSON.stringify(imports) === JSON.stringify(previousEvidence.staticAppImportClosureIncludingTypes), 'App import graph changed')
const refs = { main: 'a6a1c32c22a2bf074b161e52d523443602843dd7', 'v1.0-pre-progress': 'a4157bc84392c770c27111da58d779948b110a56', 'v1.0-pre-progress^{}': 'abb85011dafc9fb0876953e3132880e025ef65da', 'v1.1-pre-stabilization': '134305f2205eb993ab76672c2d2469d48d91a609', 'v1.1-pre-stabilization^{}': 'af96d3b257ddfdcbc7f26a968401d634d210aef6' }
for (const [ref, id] of Object.entries(refs)) check(git('rev-parse', ref).toString().trim() === id, 'Protected ref changed: ' + ref)
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.resolve(p, e.name)) : [path.resolve(p, e.name)])
const required = ['README.md', 'UX-DECISIONS.md', 'OWNER-DISPOSITION.md', 'QA-REGRESSION.md', 'VERIFICATION.md', 'OWNER-RUNBOOK.md']
for (const f of required) check(fs.existsSync(pkg + '/' + f), 'Missing required doc: ' + f)
for (const f of walk(pkg).filter(p => p.endsWith('.md'))) for (const m of fs.readFileSync(f, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
  const target = m[1].split('#')[0], resolved = path.resolve(path.dirname(f), target)
  if (target && !/^[a-z]+:\/\//i.test(target) && resolved !== path.resolve(pkg, 'evidence/scope-audit.json')) check(fs.existsSync(resolved), 'Broken documentation link: ' + target)
}
const evidenceFiles = walk(pkg + '/evidence').filter(p => !p.endsWith('scope-audit.json')).map(p => ({ path: path.relative(pkg, p).replaceAll('\\', '/'), sha256: sha(fs.readFileSync(p)) }))
const output = { clientDate: '2026-11-10', recordedAtUTC: new Date().toISOString(), base, branch: 'feature/wp7-stabilization', preservedOwnerEdits: manifest?.hashes.length ?? 'Initial local manifest unavailable', changedExisting, added, unchangedPriorSourceFiles: originalSource.filter(p => !changedExisting.includes(p)).length, appImportGraphUnchanged: true, staticImportClosureIncludingTypes: imports, scopeHashes: [...changedExisting, ...added].map(p => ({ path: p, sha256: sha(fs.readFileSync(repo + '/' + p)) })), protectedLocalRefs: refs, priorAssets: previousEvidence.currentAssets, currentAssets: walk(repo + '/dist').map(p => ({ path: path.relative(repo + '/dist', p).replaceAll('\\', '/'), bytes: fs.statSync(p).size, sha256: sha(fs.readFileSync(p)) })), evidenceFiles, requiredDocuments: required, changedTrackedPaths: changed, findingStatuses: { 'UX7.4.7-001': 'Open pending human review', 'QA7.4.7-002': 'Open pending human review', R07: 'Pending final review' } }
fs.writeFileSync(pkg + '/evidence/scope-audit.json', JSON.stringify(output, null, 2) + '\n')
console.log('Scope verified: ' + output.unchangedPriorSourceFiles + ' prior source files unchanged; App import graph unchanged; preserved owner edits: ' + output.preservedOwnerEdits)
