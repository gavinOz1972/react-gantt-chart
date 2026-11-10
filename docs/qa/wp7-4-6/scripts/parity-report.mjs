/** Records outcomes, including non-parity/gaps. Never regenerates legacy goldens. */
import {readFileSync,writeFileSync}from'node:fs'
import{resolve,dirname}from'node:path'
import{fileURLToPath}from'node:url'
import{createServer}from'vite'
const pkg=resolve(dirname(fileURLToPath(import.meta.url)),'..'),repo=resolve(pkg,'../../..'),goldens=JSON.parse(readFileSync(pkg+'/evidence/legacy-goldens.json','utf8'))
const server=await createServer({root:repo,configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',cacheDir:resolve(repo,'../output/wp7-4-6-verification/report-cache')})
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b)
try{
  const{legacyCases}=await server.ssrLoadModule('/docs/qa/wp7-4-6/tests/legacyFixtures.ts'),{referenceFor,seedFor}=await server.ssrLoadModule('/docs/qa/wp7-4-6/tests/portFixture.ts'),{observeProjected,selectedStatusHistory}=await server.ssrLoadModule('/docs/qa/wp7-4-6/tests/projectedReadModel.ts'),rows=[]
  for(const c of legacyCases()){
    const original=goldens.find(g=>g.id===c.id).output,source=referenceFor(c),opened=await source.openRead(seedFor(c).resourceId);if(opened.kind!=='Opened')throw Error(opened.kind)
    const calls=[],repo=new Proxy(source,{get(t,k){const f=Reflect.get(t,k);return typeof f==='function'?(...args)=>{calls.push(String(k));return Reflect.apply(f,t,args)}:f}})
    const projected=await observeProjected(repo,opened.session,c.asOf),normalCalls=[...calls],detail=await selectedStatusHistory(repo,opened.session,'T1',1,20),fields={}
    for(const key of ['schedule','critical','network','effort','forecast','health','baselineMarkers']){
      fields[key]=projected[key]===null?{status:'Gap',codes:projected.forecastGaps}:{status:equal(projected[key],original[key])?'ConditionalParity':c.lifecycle==='Retired'?'ApprovedTargetPopulationDifference':'UnexpectedDifference'}
    }
    fields.progressImpact={status:'UnprovenContractGap',codes:projected.progressImpact.codes}
    fields.selectedWorkEntries={status:'UnprovenContractGap',codes:['WorkEntryQueryMissing']}
    fields.selectedStatusRows={status:detail.kind==='Available'&&equal(detail.items,original.selectedStatusEvents)?'ConditionalParity':'Gap',coverage:detail.coverage??null,condition:'Requires explicit fixture legacyStatusEvent payload; not guaranteed by generic EventRecord payload'}
    rows.push({id:c.id,acceptedLegacyProgress:c.acceptedLegacyProgress,taskCount:c.tasks.length,fields,normalCalls,noNormalHistoryQuery:!normalCalls.includes('queryHistory'),purposeCompletionReads:normalCalls.filter(n=>n==='readHistoricalRecord').length})
  }
  const unexpected=rows.flatMap(r=>Object.entries(r.fields).filter(([,v])=>v.status==='UnexpectedDifference').map(([field])=>({id:r.id,field})))
  const report={assessmentOnly:true,clientDate:'2026-11-10',recordedAtUTC:new Date().toISOString(),cases:rows.length,rows,unexpectedDifferences:unexpected,semantics:'Conditional subset parity is not application-wide readiness. Tests that correctly expose a gap/difference may pass while semantic parity remains unproven.',normalReadMemoryOrPhysicalIOQualified:false}
  writeFileSync(pkg+'/evidence/parity-results.json',JSON.stringify(report,null,2)+'\n')
  if(unexpected.length)throw Error(JSON.stringify(unexpected))
  console.log('Recorded '+rows.length+' cases: zero unexpected subset differences; progress impact/work-detail gaps and retired population differences remain visible.')
}finally{await server.close()}
