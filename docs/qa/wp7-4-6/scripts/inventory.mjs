/** Exhaustive src inventory: hashes/imports/calls/typed data reads + lexical search.
 * This is source tracing, not a proof of absent dynamic runtime side effects.
 */
import { readFileSync,readdirSync,writeFileSync } from 'node:fs'
import { resolve,relative,dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import ts from 'typescript'
const pkg=resolve(dirname(fileURLToPath(import.meta.url)),'..'),repo=resolve(pkg,'../../..'),local=p=>relative(repo,p).replaceAll('\\','/'),sha=b=>createHash('sha256').update(b).digest('hex')
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(dir,e.name)):[resolve(dir,e.name)])}
function role(p){
  if(/\.test\.[^/]+$|\/__tests__\/|\/__fixtures__\/|^src\/test\//.test(p))return 'test-utility-or-runner'
  if(!/\.tsx?$/.test(p))return 'non-executable-source-document-or-style'
  if(p.startsWith('src/repository/'))return 'unused-capability'
  if(p.startsWith('src/planning/'))return 'unused-evaluator'
  if(p==='src/App.tsx')return 'runtime-orchestration'
  if(p.startsWith('src/persistence/'))return 'full-document-persistence'
  if(p==='src/progress/taskProgress.ts')return 'status-history-owner'
  if(p==='src/workTracking/workTracking.ts')return 'work-entry-owner'
  if(p==='src/progress/healthPresentation.ts'||p==='src/forecast/forecast.ts'||p.startsWith('src/projection/'))return 'calculation-with-history'
  if(p==='src/forecast/settings.ts')return 'current-assumption-validation'
  if(p.startsWith('src/timeline/'))return 'derived-timeline'
  if(p.startsWith('src/network/'))return 'derived-network'
  if(p.startsWith('src/baseline/'))return 'immutable-baseline'
  if(p.startsWith('src/domain/'))return 'schedule-critical-calendar'
  if(/useLocalDate\.ts$|\/localDate\.ts$/.test(p))return 'clock-not-history'
  if(p.startsWith('src/components/'))return 'presentation-or-input-control'
  if(p==='src/taskManagement.ts')return 'current-task-selector'
  if(p.startsWith('src/types/'))return 'type-only-contract'
  if(p==='src/main.tsx')return 'entry'
  throw Error('Unclassified source '+p)
}
const configFile=ts.readConfigFile(repo+'/tsconfig.app.json',ts.sys.readFile),config=ts.parseJsonConfigFileContent(configFile.config,ts.sys,repo),program=ts.createProgram(config.fileNames,config.options),checker=program.getTypeChecker(),files=[]
const pattern=/\.events\b|\.entries\b|\bhistory\b|latestCompletion|decodeProgress|progressFingerprint|projectFingerprint|chronologicalEntries|effortSummary|\bbaseline\b|workTracking|taskProgress/i
for(const filename of walk(repo+'/src').sort()){
  const p=local(filename),raw=readFileSync(filename),text=raw.toString('utf8'),row={path:p,role:role(p),sha256:sha(raw),canonicalLfSha256:sha(text.replaceAll('\r\n','\n')),imports:[],calls:[],typedFieldReads:[],lexicalMatches:[]}
  const source=program.getSourceFile(filename)
  if(source){
    const position=n=>source.getLineAndCharacterOfPosition(n.getStart(source)).line+1
    for(const i of ts.preProcessFile(text).importedFiles){const found=ts.resolveModuleName(i.fileName,filename,config.options,ts.sys).resolvedModule;row.imports.push({specifier:i.fileName,resolved:found&&!found.isExternalLibraryImport?local(found.resolvedFileName):null})}
    function declaration(symbol){if(!symbol)return;if(symbol.flags&ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);const d=symbol.declarations?.[0];if(!d)return;const owner=local(d.getSourceFile().fileName);if(owner.startsWith('src/')||owner.startsWith('docs/qa/'))return {symbol:symbol.getName(),owner,declarationLine:d.getSourceFile().getLineAndCharacterOfPosition(d.getStart()).line+1}}
    function visit(n){
      if(ts.isCallExpression(n)){const d=declaration(checker.getSymbolAtLocation(n.expression));if(d)row.calls.push({line:position(n),...d})}
      if(ts.isPropertyAccessExpression(n)){const d=declaration(checker.getSymbolAtLocation(n.name));if(d&&/src\/(progress|workTracking|persistence|baseline|repository)\//.test(d.owner))row.typedFieldReads.push({line:position(n),expression:n.getText(source),...d})}
      ts.forEachChild(n,visit)
    }visit(source)
  }
  text.split(/\r?\n/).forEach((s,i)=>{if(pattern.test(s))row.lexicalMatches.push({line:i+1,text:s.trim()})})
  files.push(row)
}
const graph=new Set()
function reachable(p){if(graph.has(p))return;graph.add(p);const f=files.find(f=>f.path===p);for(const i of f?.imports??[])if(i.resolved?.startsWith('src/')&&/\.tsx?$/.test(i.resolved))reachable(i.resolved)}reachable('src/main.tsx')
const runtime=files.filter(f=>graph.has(f.path)),directOwners=runtime.filter(f=>f.typedFieldReads.some(r=>r.symbol==='events'||r.symbol==='entries'))
const data={assessmentOnly:true,clientDate:'2026-11-10',recordedAtUTC:new Date().toISOString(),method:'Every src file hashed/classified; TS program resolves imports, call symbols and typed field declarations; complementary lexical search includes comments/indirect baseline/history names. DOM events/Object.entries are not automatically labelled status/work history.',counts:{allSourceFiles:files.length,typedCodeFiles:files.filter(f=>/\.tsx?$/.test(f.path)).length,staticAppImportClosureIncludingTypes:runtime.length,testFilesAndUtilities:files.filter(f=>f.role==='test-utility-or-runner').length,classifiedFiles:files.length},applicationGraph:[...graph].sort(),directEmbeddedArrayReaders:directOwners.map(f=>f.path),files,negativeFindings:['No runtime report/PDF engine or status-meeting route found in the enumerated tree; earlier meeting workflow is documentation','No runtime operational/history repository consumer; source test bridge is test-only','No normal editor data bus/store framework beyond React state/props/callbacks'],limitations:['Static src tracing; dynamic external library internals are outside this inventory','Application import closure conservatively includes type-only imports; it is not an executed-module count','Lexical matches include false positives for manual review; resolved typed reads/call sites disambiguate them','New assessment helpers live outside src and are indexed by the test bridge/import audit, not claimed as current application consumers']}
writeFileSync(pkg+'/evidence/consumer-inventory.json',JSON.stringify(data,null,2)+'\n')
console.log('Source files: '+files.length+'; typed: '+data.counts.typedCodeFiles+'; static App import closure including types: '+runtime.length+'; test files/utilities: '+data.counts.testFilesAndUtilities)
console.log('Direct embedded array readers: '+data.directEmbeddedArrayReaders.join(', '))
