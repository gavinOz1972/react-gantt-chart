/** Reproducible isolated synthetic capacity qualification; no production acceptance. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import os from 'node:os'
import { makeSynthetic, families } from './synthetic.mjs'
import { digest, lexicalProbe, sha } from './probe.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), workspace = resolve(root,'../../../..')
const out = resolve(process.argv[2] ?? workspace + '/output/wp7-4-4b-capacity')
if (relative(workspace + '/output', out).startsWith('..') || relative(workspace + '/output', out) === '') throw Error('Use an isolated child of workspace/output')
if (existsSync(out) && !existsSync(out + '/.qualification-owner.json')) throw Error('Refuse to overwrite unowned output directory')
mkdirSync(out,{recursive:true})
writeFileSync(out+'/.qualification-owner.json',JSON.stringify({task:'WP7.4.4b',syntheticOnly:true}))
const runs=3, rows=[], boundaryChecks=[]
const median = values => [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)]
for (const options of families) {
  const t=performance.now(), snapshot=await makeSynthetic(options)
  const file={format:'react-gantt-chart',schemaVersion:6,profile:'snapshot-history/2',exportInfo:{application:'React Gantt Chart',exportedAt:'2026-11-10T18:00:00.000Z'},snapshot,integrity:{profile:'bugsys-jcs-sha256/1',snapshotSha256:digest(snapshot)}}
  const path=out+'/'+options.name+'.pretty.json'
  writeFileSync(path,JSON.stringify(file,null,2)+'\n')
  const generationMs=performance.now()-t, results=[]
  // One fresh-process warmup, then three fresh-process measurements. Reads are
  // from OS cache after fixture generation, never characterized as cold disk.
  for(let i=-1;i<runs;i++){
    const target=out+'/'+options.name+'.run'+i+'.json'
    execFileSync(process.execPath,['--expose-gc',root+'/scripts/capacity-worker.mjs',path,target],{stdio:'pipe',maxBuffer:1024*1024})
    if(i>=0)results.push(JSON.parse(readFileSync(target,'utf8')))
  }
  const phases=Object.keys(results[0].timings), timingSummary=Object.fromEntries(phases.map(phase=>[phase,{min:Math.min(...results.map(r=>r.timings[phase])),median:median(results.map(r=>r.timings[phase])),max:Math.max(...results.map(r=>r.timings[phase]))}]))
  rows.push({options,generationMs,sizes:results[0].sizes,counts:results[0].counts,scan:results[0].scan,inputSha256:results[0].inputSha256,snapshotSha256:results[0].snapshotSha256,timingSummary,pipelineMs:{min:Math.min(...results.map(r=>r.pipelineMs)),median:median(results.map(r=>r.pipelineMs)),max:Math.max(...results.map(r=>r.pipelineMs))},peakRssKiB:{min:Math.min(...results.map(r=>r.peakRssKiB)),median:median(results.map(r=>r.peakRssKiB)),max:Math.max(...results.map(r=>r.peakRssKiB))},runs:results})
  console.log(`${options.name}: pretty=${results[0].sizes.prettyFile} canonical=${results[0].sizes.canonicalFile}; pipeline median=${rows.at(-1).pipelineMs.median.toFixed(1)}ms`)
}
const cap=10*1024*1024, base=readFileSync(out+'/class30.pretty.json')
for(const delta of [-1,0,1]){
  const bytes=Buffer.concat([base,Buffer.alloc(cap+delta-base.length,0x20)]), before=sha(bytes);let actual='Pass'
  try{lexicalProbe(bytes,{maxBytes:cap,maxDepth:64})}catch(e){actual=e.message}
  const expected=delta>0?'FileTooLarge':'Pass';if(actual!==expected||sha(bytes)!==before)throw Error('Byte boundary mismatch')
  boundaryChecks.push({id:'bytes-'+(cap+delta),kind:'Valid project JSON plus trailing whitespace; lexical/resource probe only',bytes:bytes.length,inputSha256:before,expected,actual,rawBytesUnchanged:true})
}
for(const depth of [63,64,65]){
  const bytes=Buffer.from('['.repeat(depth)+'null'+']'.repeat(depth));let actual='Pass',observed
  try{observed=lexicalProbe(bytes,{maxBytes:cap,maxDepth:64}).maxDepth}catch(e){actual=e.message}
  const expected=depth>64?'NestingTooDeep':'Pass';if(actual!==expected||(observed!==undefined&&observed!==depth))throw Error('Depth boundary mismatch')
  boundaryChecks.push({id:'depth-'+depth,kind:'Schema-free nested array probe, not a valid project',depth,inputSha256:sha(bytes),expected,actual,observedDepth:observed??null})
}
for(const [id,value,expected]of [
  ['large-flat-array',Array.from({length:100000},(_,i)=>i),{depth:1,items:100000}],
  ['large-flat-string',{message:'x'.repeat(8*1024*1024)},{depth:1,units:8*1024*1024}],
  ['many-unique-ids',{ids:Array.from({length:100000},(_,i)=>'ID-'+i),nextSequence:Number.MAX_SAFE_INTEGER},{depth:2,items:100000}],
]){
  const bytes=Buffer.from(JSON.stringify(value)),s=lexicalProbe(bytes,{maxBytes:cap,maxDepth:64})
  if(s.maxDepth!==expected.depth||(expected.items!==undefined&&s.arrayItems!==expected.items)||(expected.units!==undefined&&s.maxStringUnits!==expected.units))throw Error('Structural probe mismatch')
  boundaryChecks.push({id,kind:'Schema-free structural stress, not domain acceptance',bytes:bytes.length,inputSha256:sha(bytes),scan:s,expected,actual:'Pass'})
}
const report={qualificationOnly:true,recordedAtUTC:new Date().toISOString(),environment:{node:process.version,v8:process.versions.v8,platform:process.platform,release:os.release(),arch:process.arch,cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,totalRamBytes:os.totalmem()},methodology:{warmups:1,measuredFreshProcesses:runs,osCache:'Warm after fixture generation; no cold-disk claim',memory:'Fresh child process maxRSS plus sampled phase RSS/heap/external bytes; not browser peak',timing:'read/lexical scan/JSON.parse/selected shape checks/reference snapshot canonicalization/hash/full-file canonicalization; full schema validation absent',reference:'Maintained canonicalize5.1 pinned in SECOND-SOURCE.json; reference allocations are implementation-specific'},recipeHashes:Object.fromEntries(['synthetic.mjs','capacity.mjs','capacity-worker.mjs','probe.mjs'].map(n=>[n,sha(readFileSync(root+'/scripts/'+n))])),rows,boundaryChecks,proposedNotExecuted:['Production format6 reader rejection retains accepted project/ref/baseline','Full semantic/lifecycle/correction validation timings','UI responsiveness, async cancellation and mobile/managed-browser memory','Physical storage quota, DBMS limits and real save atomicity'],syntheticOutputsNotCommitted:true}
writeFileSync(root+'/evidence/capacity-results.json',JSON.stringify(report,null,2)+'\n')
console.log(`PASS: ${rows.length} synthetic families x ${runs} measured runs; ${boundaryChecks.length} lexical/resource/structural boundary checks.`)
