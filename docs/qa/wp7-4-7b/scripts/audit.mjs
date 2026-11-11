import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import ts from 'typescript'
const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), repo = path.resolve(pkg, '../../..')
const base = '22bfd6a3afff6f78e977d9fde55405de9983cabd'
const git = (...args) => execFileSync('git', ['-c', 'safe.directory=' + repo.replaceAll('\\', '/'), ...args], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 10 * 1024 * 1024 })
const sha = b => createHash('sha256').update(b).digest('hex'), lf = b => b.toString('utf8').replaceAll('\r\n', '\n')
const check = (v, m) => { if (!v) throw Error(m) }
const existing = ['src/components/progress/SelectedTaskHistory.tsx', 'src/components/progress/selectedTaskHistory.css', 'src/components/progress/SelectedTaskHistory.ux.test.tsx', 'docs/qa/wp7-4-7a/browser/history-ux.spec.ts', 'docs/qa/wp7-4-7a/OWNER-DISPOSITION.md']
const added = ['src/components/progress/SelectedTaskHistory.actions.test.tsx']
const allowed = p => p.startsWith('docs/qa/wp7-4-7b/') || existing.includes(p) || added.includes(p)
check(git('branch', '--show-current').toString().trim() === 'feature/wp7-stabilization', 'Wrong branch')
const manifestPath = repo + '/.wp747b-before.log', manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null
if (manifest) for (const f of manifest.hashes) check(sha(fs.readFileSync(repo + '/' + f.path)) === f.sha256, 'Owner edit changed: ' + f.path)
const owner = new Set(manifest?.hashes.map(f => f.path) ?? [])
const changed = git('diff', '--name-only', base).toString().trim().split(/\r?\n/).filter(Boolean)
for (const p of changed) check(allowed(p) || owner.has(p), 'Out-of-scope change: ' + p)
for (const p of git('ls-files', '--others', '--exclude-standard').toString().trim().split(/\r?\n/).filter(Boolean)) check(allowed(p), 'Unexpected untracked file: ' + p)
const sourceFiles = git('ls-tree', '-r', '--name-only', base, '--', 'src').toString().trim().split(/\r?\n/)
for (const p of sourceFiles) if (!existing.includes(p)) check(lf(fs.readFileSync(repo + '/' + p)) === lf(git('show', base + ':' + p)), 'Protected source changed: ' + p)
const component = 'src/components/progress/SelectedTaskHistory.tsx'
const entry = s => s.slice(s.indexOf('function HistoryEntry('), s.indexOf('function HistoryDetails('))
check(entry(lf(fs.readFileSync(repo + '/' + component))) === entry(lf(git('show', base + ':' + component))), 'More about this change behavior changed')
const css = 'src/components/progress/selectedTaskHistory.css'
check(lf(fs.readFileSync(repo + '/' + css)).replace(/^\.selected-history-content > button\[aria-disabled=true\].*\n/m, '') === lf(git('show', base + ':' + css)), 'CSS change exceeds busy recovery button')
const config = ts.readConfigFile(repo + '/tsconfig.app.json', ts.sys.readFile)
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, repo).options, graph = new Set()
function visit(p) { if (graph.has(p)) return; graph.add(p); for (const i of ts.preProcessFile(fs.readFileSync(p, 'utf8')).importedFiles) { const r = ts.resolveModuleName(i.fileName, p, options, ts.sys).resolvedModule; if (r && !r.isExternalLibraryImport && /\.tsx?$/.test(r.resolvedFileName)) visit(r.resolvedFileName) } }
visit(repo + '/src/main.tsx')
const imports = [...graph].map(p => path.relative(repo, p).replaceAll('\\', '/')).sort()
const prior = JSON.parse(git('show', base + ':docs/qa/wp7-4-7a/evidence/scope-audit.json').toString())
check(JSON.stringify(imports) === JSON.stringify(prior.staticImportClosureIncludingTypes), 'App import graph changed')
const disposition = fs.readFileSync(repo + '/docs/qa/wp7-4-7a/OWNER-DISPOSITION.md', 'utf8')
check(disposition.includes('Gavin Osborne accepted WP7.4.7a') && disposition.includes('R07 remains pending'), 'Owner disposition mismatch')
const refs = { main: 'a6a1c32c22a2bf074b161e52d523443602843dd7', 'v1.0-pre-progress': 'a4157bc84392c770c27111da58d779948b110a56', 'v1.0-pre-progress^{}': 'abb85011dafc9fb0876953e3132880e025ef65da', 'v1.1-pre-stabilization': '134305f2205eb993ab76672c2d2469d48d91a609', 'v1.1-pre-stabilization^{}': 'af96d3b257ddfdcbc7f26a968401d634d210aef6' }
for (const [ref, id] of Object.entries(refs)) check(git('rev-parse', ref).toString().trim() === id, 'Protected reference changed: ' + ref)
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.resolve(p, e.name)) : [path.resolve(p, e.name)])
const required = ['README.md', 'INVESTIGATION.md', 'VERIFICATION.md', 'OWNER-RUNBOOK.md']
for (const p of required) check(fs.existsSync(pkg + '/' + p), 'Missing documentation: ' + p)
for (const p of walk(pkg).filter(p => p.endsWith('.md'))) for (const m of fs.readFileSync(p, 'utf8').matchAll(/\]\(([^)]+)\)/g)) { const target = m[1].split('#')[0], resolved = path.resolve(path.dirname(p), target); if (target && !/^[a-z]+:\/\//i.test(target) && resolved !== path.resolve(pkg, 'evidence/scope-audit.json')) check(fs.existsSync(resolved), 'Broken link: ' + target) }
const output = { clientDate: '2026-11-11', recordedAtUTC: new Date().toISOString(), base, branch: 'feature/wp7-stabilization', preservedOwnerEdits: manifest?.hashes.length ?? 'Initial manifest unavailable', existingChangedPaths: existing, newSourcePaths: added, scopeHashes: [...existing, ...added].map(p => ({ path: p, sha256: sha(fs.readFileSync(repo + '/' + p)) })), unchangedPriorSourceFiles: sourceFiles.filter(p => !existing.includes(p)).length, moreAboutThisChangeFunctionAndStylesUnchanged: true, appImportGraphUnchanged: true, staticImportClosureIncludingTypes: imports, protectedLocalRefs: refs, priorAssets: prior.currentAssets, currentAssets: walk(repo + '/dist').map(p => ({ path: path.relative(repo + '/dist', p).replaceAll('\\', '/'), bytes: fs.statSync(p).size, sha256: sha(fs.readFileSync(p)) })), requiredDocuments: required, changedTrackedPaths: changed, ownerStatus: { WP747a: 'Owner accepted', 'UX7.4.7-001': 'Closed by owner', 'QA7.4.7-002': 'Closed by owner', WP747b: 'Pending owner review', R07: 'Pending final review', moreAboutObservation: 'Deferred; unchanged' } }
fs.writeFileSync(pkg + '/evidence/scope-audit.json', JSON.stringify(output, null, 2) + '\n')
console.log('Scope verified: ' + output.unchangedPriorSourceFiles + ' prior source files unchanged; More about this change/import graph unchanged; owner edits preserved: ' + output.preservedOwnerEdits)
