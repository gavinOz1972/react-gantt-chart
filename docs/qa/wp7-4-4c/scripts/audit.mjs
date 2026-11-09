/** Read-only scope and independent graph audit; --record writes package evidence. */
import { readFileSync,writeFileSync,readdirSync,existsSync } from 'node:fs'
import { resolve,relative,dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
import { sha,jcs } from './illustrations.mjs'
const pkg=resolve(dirname(fileURLToPath(import.meta.url)),'..'),repo=resolve(pkg,'../../..'),base='1b35da8ed7e4d113557b992d7abe7a1a0c316e6d'
const git=(...args)=>execFileSync('git',['-c','safe.directory='+repo.replaceAll('\\','/'),...args],{cwd:repo,encoding:'utf8',stdio:['pipe','pipe','ignore']}).trim()
if(git('branch','--show-current')!=='feature/wp7-stabilization')throw Error('Wrong branch')
if(git('diff',base,'--name-only','--','src','package.json','package-lock.json','vite.config.ts','tsconfig.app.json','eslint.config.js','playwright.config.ts','docs/qa/wp7-4-4','docs/qa/wp7-4-4b'))throw Error('Protected source or prior contract changed')
const preservation=repo+'/.wp744c-before.log',preserved=[]
if(existsSync(preservation))for(const f of JSON.parse(readFileSync(preservation,'utf8')).hashes){if(sha(readFileSync(repo+'/'+f.path))!==f.sha256)throw Error('Existing edit changed: '+f.path);preserved.push(f)}
const report=JSON.parse(readFileSync(pkg+'/evidence/measurements.json','utf8'))
for(const [name,hash]of Object.entries(report.recipeHashes))if(sha(readFileSync(pkg+'/scripts/'+name))!==hash)throw Error('Measured recipe changed: '+name)
for(const [name,hash]of Object.entries(report.externalSourceHashes))if(sha(readFileSync(pkg+'/'+name))!==hash)throw Error('Measured external input changed: '+name)
const study=resolve(process.argv.find(a=>a.startsWith('--study='))?.slice(8)??repo+'/../output/wp7-4-4c-study'),graphs=[]
for(const row of report.rows.filter(r=>r.graph)) {
  const input=readFileSync(study+'/'+row.name+'-A.json')
  if(sha(input)!==row.options.A.runs[0].inputSha256)throw Error('Study bytes changed')
  const snapshot=JSON.parse(input).snapshot,tasks=snapshot.originalBaseline.value.tasks,ids=new Set(tasks.map(t=>t.taskId)),edges=new Map(tasks.map(t=>[t.taskId,[]]))
  for(const [i,t]of tasks.entries())for(const p of t.predecessorTaskIds){if(!ids.has(p)||tasks.findIndex(v=>v.taskId===p)>=i)throw Error('Missing/non-DAG predecessor');edges.get(p).push(t.taskId)}
  const closure=new Set(),pending=[...edges.get('T1')]
  while(pending.length){const id=pending.pop();if(closure.has(id))continue;closure.add(id);pending.push(...edges.get(id))}
  const observed={tasks:tasks.length,initialEdges:tasks.reduce((n,t)=>n+t.predecessorTaskIds.length,0),rootDirectSuccessors:edges.get('T1').length,uniqueDownstream:closure.size,affectedPerScopeReview:closure.size+1,maxPredecessors:Math.max(...tasks.map(t=>t.predecessorTaskIds.length))}
  if(jcs(observed)!==jcs(row.graph))throw Error('Fan-out metadata mismatch')
  for(const review of snapshot.current.scopeReviews)if(review.affectedTaskIds.length!==observed.affectedPerScopeReview||new Set(review.affectedTaskIds).size!==review.affectedTaskIds.length||review.successorDecisions.length!==observed.affectedPerScopeReview)throw Error('Closure review count mismatch')
  if(snapshot.current.archivedDependencies.length!==row.spec.cycles*observed.rootDirectSuccessors||snapshot.current.scopeReviews.length!==row.spec.cycles*2)throw Error('Retained episode/review growth mismatch')
  if(sha(jcs(snapshot.originalBaseline))!==row.baselineSha256)throw Error('Baseline binding mismatch')
  const checkpointDoc=JSON.parse(readFileSync(study+'/'+row.name+'-C.json','utf8'))
  for(const checkpoint of checkpointDoc.checkpoints)if(checkpoint.baselineSha256!==row.baselineSha256||sha(jcs(checkpoint.state))!==checkpoint.stateSha256)throw Error('Checkpoint provenance mismatch')
  graphs.push({name:row.name,observed,archivedEpisodes:snapshot.current.archivedDependencies.length,reviews:snapshot.current.scopeReviews.length,baselineSha256:row.baselineSha256,checkpointsVerified:checkpointDoc.checkpoints.length})
}
const visited=new Set(),configFile=ts.readConfigFile(repo+'/tsconfig.app.json',ts.sys.readFile),config=ts.parseJsonConfigFileContent(configFile.config,ts.sys,repo)
const local=path=>relative(repo,path).replaceAll('\\','/')
function visit(path){path=resolve(path);if(visited.has(path))return;visited.add(path);for(const i of ts.preProcessFile(readFileSync(path,'utf8')).importedFiles){const found=ts.resolveModuleName(i.fileName,path,config.options,ts.sys).resolvedModule;if(found&&!found.isExternalLibraryImport&&local(found.resolvedFileName).startsWith('src/'))visit(found.resolvedFileName)}}
visit(repo+'/src/main.tsx');const graph=[...visited].map(local).sort()
if(graph.some(p=>p.includes('wp7-4-4c')||p.startsWith('src/repository/')||p==='src/planning/workingPlan.ts'))throw Error('Private module activated')
const app=resolve(process.argv.find(a=>a.startsWith('--app='))?.slice(6)??repo+'/../output/wp7-4-4c-verification/app')
const assets=folder=>readdirSync(folder).sort().map(name=>({name,sha256:sha(readFileSync(folder+'/'+name))}))
const currentAssets=assets(repo+'/dist/assets');if(jcs(currentAssets)!==jcs(assets(app+'/dist/assets')))throw Error('App asset bytes differ')
const documents=['README.md','CURRENT-ARCHITECTURE-ASSESSMENT.md','ARCHITECTURE-COMPARISON.md','STORAGE-MEASUREMENTS.md','MEMORY-AND-REPOSITORY-CONTRACT.md','RECOMMENDATION.md','OWNER-DECISIONS.md','VERIFICATION.md'];let links=0
for(const doc of documents)for(const match of readFileSync(pkg+'/'+doc,'utf8').matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){const href=match[1];if(/^https?:/.test(href)||href.startsWith('#'))continue;const target=resolve(pkg,href.split('#')[0]);if(!existsSync(target)&&!(process.argv.includes('--record')&&target===resolve(pkg,'evidence/scope-audit.json')))throw Error('Broken link: '+doc+' '+href);links++}
const data={assessmentOnly:true,clientDate:'2026-11-09',recordedAtUTC:new Date().toISOString(),sourceBase:base,branch:git('branch','--show-current'),applicationGraph:graph,assessmentImportsInApplication:0,sourceConfigAndPriorContractChanges:[],assetsIdentical:true,assets:currentAssets,preExistingEditsVerified:preserved,recipeAndExternalHashesVerified:true,independentDenseGraphChecks:graphs,documents,relativeLinksChecked:links,R07Final:false}
if(process.argv.includes('--record'))writeFileSync(pkg+'/evidence/scope-audit.json',JSON.stringify(data,null,2)+'\n')
console.log(`PASS: ${graph.length} App modules; ${preserved.length} original edits preserved; unchanged assets/source/contracts; ${graphs.length} independently counted graphs; ${documents.length} docs/${links} local links.`)
