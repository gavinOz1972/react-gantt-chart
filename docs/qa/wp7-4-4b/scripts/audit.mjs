// Qualification scope audit. No project writes; --record writes evidence only.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
import { sha } from './probe.mjs'
const pkg=resolve(dirname(fileURLToPath(import.meta.url)),'..'),repo=resolve(pkg,'../../..'),prefix='docs/qa/wp7-4-4b/',base='4129c53d5e2f279810d31dc1f28d244e9d8c9344'
const git=(...args)=>execFileSync('git',['-c','safe.directory='+repo.replaceAll('\\','/'),...args],{cwd:repo,encoding:'utf8',stdio:['pipe','pipe','ignore']}).trim()
if(git('branch','--show-current')!=='feature/wp7-stabilization')throw Error('Wrong branch')
const sourceDiff=git('diff',base,'--name-only','--','src','package.json','package-lock.json','vite.config.ts','tsconfig.app.json','eslint.config.js','playwright.config.ts')
if(sourceDiff)throw Error('Application/source/config diff: '+sourceDiff)
const relativePath=path=>relative(repo,path).replaceAll('\\','/')
const configFile=ts.readConfigFile(repo+'/tsconfig.app.json',ts.sys.readFile),config=ts.parseJsonConfigFileContent(configFile.config,ts.sys,repo),visited=new Set()
function visit(path){path=resolve(path);if(visited.has(path))return;visited.add(path);for(const item of ts.preProcessFile(readFileSync(path,'utf8')).importedFiles){const found=ts.resolveModuleName(item.fileName,path,config.options,ts.sys).resolvedModule;if(found&&!found.isExternalLibraryImport&&relativePath(found.resolvedFileName).startsWith('src/'))visit(found.resolvedFileName)}}
visit(repo+'/src/main.tsx');const graph=[...visited].map(relativePath).sort()
if(graph.some(path=>path.includes('wp7-4-4b')||path.startsWith('src/repository/')||path==='src/planning/workingPlan.ts'))throw Error('Private module activated')
const pinned=[]
for(const manifest of ['SOURCES.json','SECOND-SOURCE.json']){const m=JSON.parse(readFileSync(pkg+'/reference/'+manifest,'utf8'));for(const f of m.files){const path=pkg+(manifest==='SOURCES.json'?'/':'/reference/')+f.localPath;if(sha(readFileSync(path))!==f.sha256)throw Error('Reference bytes changed: '+f.localPath);pinned.push(f.localPath)}}
const license=JSON.parse(readFileSync(pkg+'/reference/SOURCES.json','utf8')).officialLicense
if(sha(readFileSync(pkg+'/'+license.localPath))!==license.sha256)throw Error('Official license bytes changed')
for(const [name,hash] of Object.entries(JSON.parse(readFileSync(pkg+'/evidence/capacity-results.json','utf8')).recipeHashes))if(sha(readFileSync(pkg+'/scripts/'+name))!==hash)throw Error('Capacity recipe changed: '+name)
for(const [name,hash] of Object.entries(JSON.parse(readFileSync(pkg+'/evidence/verification.json','utf8')).evidenceHashes))if(sha(readFileSync(pkg+'/evidence/'+name))!==hash)throw Error('Recorded evidence changed: '+name)
const preserved=[]
if(existsSync(repo+'/.wp744b-before.log'))for(const f of JSON.parse(readFileSync(repo+'/.wp744b-before.log','utf8')).hashes){if(sha(readFileSync(repo+'/'+f.path))!==f.sha256)throw Error('Existing edit changed: '+f.path);preserved.push(f)}
const assets=folder=>readdirSync(folder).sort().map(name=>({name,sha256:sha(readFileSync(folder+'/'+name))}))
const currentAssets=assets(repo+'/dist/assets'),isolatedDir=resolve(process.argv.find(a=>a.startsWith('--app='))?.slice(6)??repo+'/../output/wp7-4-4b-verification/app')
if(JSON.stringify(currentAssets)!==JSON.stringify(assets(isolatedDir+'/dist/assets')))throw Error('Application asset bytes differ')
const documents=['README.md','CANONICAL-VECTORS.md','CAPACITY-REPORT.md','QUALIFICATION-MATRIX.md','R07-FINAL-RECOMMENDATIONS.md','VERIFICATION.md','OWNER-RUNBOOK.md']
let links=0
for(const doc of documents)for(const match of readFileSync(pkg+'/'+doc,'utf8').matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){const href=match[1];if(/^https?:/.test(href)||href.startsWith('#'))continue;const target=resolve(pkg,href.split('#')[0]);if(!existsSync(target)&&!(process.argv.includes('--record')&&target===resolve(pkg,'evidence/scope-audit.json')))throw Error('Broken link: '+doc+' '+href);links++}
const data={qualificationOnly:true,recordedAtUTC:new Date().toISOString(),branch:git('branch','--show-current'),sourceBase:base,applicationGraph:graph,qualificationImportsInApplication:0,applicationSourceConfigChanges:[],assetBytesIdentical:true,assets:currentAssets,pinnedReferenceFilesVerified:pinned,preExistingModifiedFilesVerified:preserved,documents,relativeLinksChecked:links,R07Final:false}
if(process.argv.includes('--record'))writeFileSync(pkg+'/evidence/scope-audit.json',JSON.stringify(data,null,2)+'\n')
console.log(`PASS: ${graph.length} application modules exclude qualification code; ${pinned.length} pinned sources match; assets identical; ${preserved.length} existing edits preserved; ${documents.length} docs/${links} links.`)
