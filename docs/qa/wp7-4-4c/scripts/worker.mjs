/** Fresh process, assessment-only Node measurements. No domain acceptance or SQL. */
import { readFileSync,writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { jcs,sha,bytes,operational,page,reconstruct } from './illustrations.mjs'
const [input,output,option,mode]=process.argv.slice(2),timings={},memory=[]
const measure=(phase,action)=>{const start=performance.now(),value=action();timings[phase]=performance.now()-start;memory.push({phase,...process.memoryUsage(),maxRssKiB:process.resourceUsage().maxRSS});return value}
global.gc?.()
const raw=measure('read',()=>readFileSync(input)),doc=measure('parse',()=>JSON.parse(raw.toString('utf8')))
const beforeWorkMaxRssKiB=process.resourceUsage().maxRSS
let query=null,reconstruction=null,sections=null
if(mode==='full') {
  const snapshot=option==='A'?doc.snapshot:null,revision=snapshot?.logicalRevision??doc.logicalRevision
  const q={taskId:'T1',kind:'ScopeReview',from:'2026-11-01T00:00:00.000Z',until:'2026-12-01T00:00:00.000Z',watermark:revision,limit:20}
  query=measure('historyPageScan',()=>page(snapshot??doc,option,q))
  query={returned:query.items.length,remainingMatches:query.total,next:query.next,resultSha256:sha(jcs(query))}
  const recorded=doc.recordedState
  if(option!=='A' && recorded) {
    const span=doc.logicalRevision-recorded.base.logicalRevision,targets=[recorded.base.logicalRevision+Math.floor(span*0.9),doc.logicalRevision]
    reconstruction=measure('reconstruction',()=>targets.map(target=>{
      const t=performance.now(),r=reconstruct(doc,target),expected=recorded.expected.find(x=>x.revision===target),actual=sha(jcs(r.state))
      if(r.kind!=='KnownRecordedState'||actual!==expected.sha256)throw Error('Reconstruction mismatch')
      return {target,ms:performance.now()-t,applied:r.applied,startRevision:r.startRevision,stateSha256:actual}
    }))
  } else reconstruction={kind:'NotClaimed',reason:option==='A'?'Explanatory /2 history is not a complete replay log':'No before/after series was captured for the reused fixture'}
  // Each contribution is canonical value bytes; subset fields are labelled.
  sections=option==='A'?{currentIncludingInlineHistory:bytes(snapshot.current),operationalSubset:bytes(operational(snapshot)),baseline:bytes(snapshot.originalBaseline),explanatoryEvents:bytes(snapshot.history.events),lifecycleDecisionSubset:bytes(Object.values(snapshot.current.lifecycle).flatMap(l=>l.decisions)),beforeContextSubset:bytes(Object.values(snapshot.current.lifecycle).flatMap(l=>l.decisions.map(d=>d.before))),reviewsSubset:bytes(snapshot.current.scopeReviews),archivesSubset:bytes(snapshot.current.archivedDependencies)}:{current:bytes(doc.current),baseline:bytes(doc.originalBaseline),decisions:bytes(doc.records.decisions),beforeContextSubset:bytes(Object.values(doc.records.decisions).map(d=>d.before)),reviews:bytes(doc.records.reviews),archives:bytes(doc.records.archives),explanatoryEvents:bytes(doc.records.events),recordedBase:doc.recordedState?bytes(doc.recordedState.base):0,recordedRevisionChanges:doc.recordedState?bytes(doc.recordedState.revisions):0,checkpoints:bytes(doc.checkpoints),ordering:bytes(doc.order)}
}
const canonical=measure('canonicalBytes',()=>jcs(doc))
const result={assessmentOnly:true,option,mode,rawUtf8Bytes:raw.length,canonicalUtf8Bytes:Buffer.byteLength(canonical),inputSha256:sha(raw),timings,memory,parsePeakRssKiB:beforeWorkMaxRssKiB,pipelinePeakRssKiB:process.resourceUsage().maxRSS,query,reconstruction,sections,fullValidationMeasured:false}
writeFileSync(output,JSON.stringify(result)+'\n')
