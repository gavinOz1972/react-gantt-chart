// Read-only unless --record is explicitly supplied. No browser or user data.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'

const root = process.cwd()
const base = '4d32a4e8ccb61651f422cdb2de242e6d0297573e'
const prefix = 'docs/qa/wp7-4-3b/'
const port = 'src/repository/projectRepository.ts'
const bridge = 'src/repository/projectRepository.test.ts'
const git = (...args) => execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, ...args], { encoding: 'utf8' }).trim()
const normalized = path => relative(root, path).replaceAll('\\', '/')
if (git('branch', '--show-current') !== 'feature/wp7-stabilization') throw Error('Wrong branch')
const paths = [...new Set([
  ...git('diff', '--name-only', base).split('\n'),
  ...git('ls-files', '--others', '--exclude-standard').split('\n'),
].filter(Boolean))].sort()
if (paths.some(path => path !== port && path !== bridge && !path.startsWith(prefix))) throw Error(`Unexpected changed scope: ${paths.join(', ')}`)

const configFile = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile)
if (configFile.error) throw Error('Cannot read compiler configuration')
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root)
const visited = new Set()
function visit(path) {
  path = resolve(path)
  if (visited.has(path)) return
  visited.add(path)
  const imports = ts.preProcessFile(readFileSync(path, 'utf8')).importedFiles
  for (const entry of imports) {
    const resolved = ts.resolveModuleName(entry.fileName, path, config.options, ts.sys).resolvedModule
    if (resolved && !resolved.isExternalLibraryImport && normalized(resolved.resolvedFileName).startsWith('src/')) visit(resolved.resolvedFileName)
  }
}
visit('src/main.tsx')
const applicationGraph = [...visited].map(normalized).sort()
if (applicationGraph.some(path => path.startsWith('src/repository/') || path === 'src/planning/workingPlan.ts')) throw Error('Private code activated in application graph')
const portJS = ts.transpileModule(readFileSync(port, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, removeComments: true } }).outputText.trim()
if (portJS !== 'export {};') throw Error('Port contains runtime implementation')
// Search all existing source files too, including a presently unreachable consumer.
const sourceImports = []
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) { inspect(path); continue }
    if (!/\.[jt]sx?$/.test(path)) continue
    for (const imported of ts.preProcessFile(readFileSync(path, 'utf8')).importedFiles) {
      const resolved = ts.resolveModuleName(imported.fileName, path, config.options, ts.sys).resolvedModule
      if (resolved && normalized(resolved.resolvedFileName) === port) sourceImports.push(normalized(path))
    }
  }
}
inspect('src')
if (sourceImports.some(path => path !== bridge)) throw Error('Unexpected port consumer')

const priorBuild = JSON.parse(readFileSync(`${prefix}evidence/build-before.json`, 'utf8').replace(/^\uFEFF/, ''))
const currentBuild = readdirSync('dist/assets').sort().map(File => ({ File, SHA256: createHash('sha256').update(readFileSync(`dist/assets/${File}`)).digest('hex').toUpperCase() }))
const sortedPrior = [...priorBuild].sort((a, b) => a.File.localeCompare(b.File))
if (JSON.stringify(sortedPrior) !== JSON.stringify(currentBuild)) throw Error('Application asset bytes differ from pre-change build')
const requirementPath = '../react-gantt-chart/docs/WP_Req/Bugsys_WP7_4_3b_Repository_Port_Conformance.docx'
const requirementSHA256 = createHash('sha256').update(readFileSync(requirementPath)).digest('hex')
if (requirementSHA256 !== 'a8df94919e78642cc7daeca33439d5cd0a81730a0d4d5922ab77206e2bae60b3') throw Error('Requirement differs')
const required = ['README.md', 'CONTRACT-TRACEABILITY.md', 'CONFORMANCE-MATRIX.md', 'VERIFICATION.md', 'ACCEPTANCE.md', 'OWNER-RUNBOOK.md']
let links = 0
const linkTargets = []
for (const file of required) {
  const body = readFileSync(`${prefix}${file}`, 'utf8')
  for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1]
    if (/^https?:/.test(href) || href.startsWith('#')) continue
    const target = resolve(prefix, href.split('#')[0])
    linkTargets.push(target)
    const generatingReport = process.argv.includes('--record') && target === resolve(prefix, 'evidence/scope-review.json')
    if (!existsSync(target) && !generatingReport) throw Error(`Broken link ${file}: ${href}`)
    links++
  }
}
if (/\[x\]/i.test(readFileSync(`${prefix}ACCEPTANCE.md`, 'utf8'))) throw Error('Unexpected checked owner acceptance')
const report = {
  recordedAtUTC: new Date().toISOString(), base, branch: git('branch', '--show-current'),
  changedPaths: paths, onlyBoundedNewCodeAndPackage: true, productionPortConsumers: [],
  sourcePortConsumers: sourceImports, applicationGraph, portEmitsRuntimeImplementation: false,
  workingEvaluatorStillUnused: true, applicationAssetsByteIdentical: true, assets: currentBuild,
  requirementSHA256, requiredDocuments: required, localLinksChecked: links, ownerAcceptanceChecked: false,
  unchanged: ['existing source/engines/codec/storage/config/dependencies', 'historical evidence/acceptance', 'baseline/user data'],
}
if (process.argv.includes('--record')) writeFileSync(`${prefix}evidence/scope-review.json`, JSON.stringify(report, null, 2) + '\n')
for (const target of linkTargets) if (!existsSync(target)) throw Error(`Missing final linked artifact: ${target}`)
console.log(`PASS: bounded new scope; ${applicationGraph.length} application modules exclude port/reference/evaluator; identical app assets; ${required.length} documents/${links} local links; owner acceptance unchecked.`)
