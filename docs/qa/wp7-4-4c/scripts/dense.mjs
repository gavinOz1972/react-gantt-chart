/** Synthetic high-fan-out assessment recipe, not an application change workflow. */
import { createServer } from 'vite'
import { resolve,dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeSynthetic } from '../../wp7-4-4b/scripts/synthetic.mjs'
import { clone,operational,differences,sha,jcs } from './illustrations.mjs'
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..')
const actor={source:'User',actorLabel:null,application:'WP7.4.4c synthetic study'}
const rationale='Synthetic explicit successor review; not measured student behaviour. '.repeat(8).slice(0,500)
export async function dense({name,cycles,edits=0}) {
  const s=await makeSynthetic({name,tasks:100,cycles:0,edits:0,logs:4,criteria:4,text:500}),c=s.current
  s.logicalRevision=1;s.history={coverage:{kind:'Partial',reason:'Known recorded-state coverage begins at this synthetic study seed; no earlier reconstruction claimed.'},nextSequence:1,events:[]}
  c.lifecycle={};c.scopeReviews=[];c.archivedDependencies=[]
  for(let i=0;i<c.tasks.length;i++) {
    const t=c.tasks[i];t.durationHours=2;t.description=rationale
    t.predecessorTaskIds=i===0?[]:[...new Set(['T1',...Array.from({length:Math.min(10,i)},(_,k)=>'T'+(i-k))])]
    c.lifecycle[t.taskId]={kind:'Active',lastDecisionId:null,decisions:[]}
  }
  const original=clone(c.tasks),baselineLoader=await createServer({root:repo,configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',cacheDir:resolve(repo,'../output/wp7-4-4c-verification/vite-cache')})
  const series=[],expected=[],states=[]
  try {
    const {establishBaseline}=await baselineLoader.ssrLoadModule('/src/baseline/baseline.ts')
    const {calculateSchedule}=await baselineLoader.ssrLoadModule('/src/domain/index.ts')
    const result=establishBaseline({project:c.project,tasks:clone(original),nextTaskNumber:101,manualOrder:clone(c.manualOrder),sortMode:'manual',duplicateOrigins:{}},'B-'+name,'2026-11-02T15:00:00.000Z')
    if(!result.ok)throw Error(JSON.stringify(result.errors));s.originalBaseline={kind:'Present',interpretation:'WP1-v1',value:clone(result.value)}
    const baselineHash=sha(jcs(s.originalBaseline))
    function working() {
      const tasks=c.tasks.filter(t=>c.lifecycle[t.taskId].kind==='Active'),schedule=calculateSchedule(c.project,tasks)
      if(!schedule.ok)throw Error(JSON.stringify(schedule.errors))
      const state={revisionId:'W-'+s.logicalRevision,ruleVersion:1,calendar:{workingWeekdays:clone(c.project.workingWeekdays),workingHoursPerDay:c.project.workingHoursPerDay},constraints:{},commitments:{}}
      const decisions=[]
      for(const row of schedule.tasks) {
        const id=row.taskId,d='D-'+s.logicalRevision+'-'+id
        state.constraints[id]={notBefore:clone(row.startSlot),origin:'Confirmed',decisionId:d}
        state.commitments[id]={kind:'Known',start:clone(row.startSlot),finish:clone(row.finishBoundary),decisionId:d}
        decisions.push({decisionId:d,taskId:id,predecessorIds:clone(tasks.find(t=>t.taskId===id).predecessorTaskIds),outcome:'KeepAndMove',reason:rationale,sourceEventId:null})
      }
      c.working={kind:'Reviewed',reference:{interpretation:'WP742-v1',reviewDate:c.project.projectStartDate,reviewTimezone:'America/Regina',acceptedAt:'2026-11-10T15:00:00.000Z',inputs:{project:clone(c.project),tasks:clone(tasks)},state,decisions}}
    }
    function event(kind,taskIds,payload,id) {s.history.events.push({eventId:id,sequence:s.history.nextSequence++,recordedInRevision:s.logicalRevision,recordedAt:new Date(Date.UTC(2026,10,10,15,0,s.logicalRevision)).toISOString(),effectiveDate:c.project.projectStartDate,attribution:clone(actor),taskIds,supersedesEventId:null,reason:rationale,kind,payload:clone(payload)})}
    working(); const base=operational(s);states.push(clone(base));expected.push({revision:1,sha256:sha(jcs(base))})
    for(let n=0;n<cycles*2+edits;n++) {
      const before=operational(s),from=s.logicalRevision++,R=s.logicalRevision,task=c.tasks[0],life=c.lifecycle.T1
      let kind
      if(n<cycles*2) {
        const retiring=n%2===0,operation=retiring?'Retire':'Restore',reviewId='REVIEW-'+R,sourceEventId='E-REVIEW-'+R,dId='LIFE-'+R,recordedAt=new Date(Date.UTC(2026,10,10,15,0,R)).toISOString()
        const ref=c.working.reference,state=ref.state
        const decision={decisionId:dId,taskId:'T1',operation,priorDecisionId:life.lastDecisionId,reviewId,recordedInRevision:R,effectiveDate:c.project.projectStartDate,recordedAt,attribution:clone(actor),rationale,sourceEventId:'E-'+dId,before:{task:clone(task),progress:clone(c.progress.tasks.T1),actuals:clone(c.actuals.T1),remainingHours:c.workTracking.remainingHours.T1,working:state.commitments.T1?{workingRevisionId:state.revisionId,calendar:clone(state.calendar),constraint:clone(state.constraints.T1),commitment:clone(state.commitments.T1)}:null}}
        life.kind=retiring?'Retired':'Active';life.lastDecisionId=dId;life.decisions.push(decision)
        const archives=[],added=[]
        for(const successor of c.tasks.slice(1)) {
          if(retiring) {const a={archiveId:'ARCH-'+R+'-'+successor.taskId,predecessorTaskId:'T1',successorTaskId:successor.taskId,archivedInRevision:R,reviewId,rationale,sourceEventId};archives.push(a);c.archivedDependencies.push(a);successor.predecessorTaskIds=successor.predecessorTaskIds.filter(p=>p!=='T1')}
          else {successor.predecessorTaskIds=clone(original.find(t=>t.taskId===successor.taskId).predecessorTaskIds);added.push({predecessorTaskId:'T1',successorTaskId:successor.taskId,reinstatesArchiveIds:[c.archivedDependencies.findLast(a=>a.successorTaskId===successor.taskId).archiveId]})}
        }
        working()
        const outcomes=c.tasks.map(t=>({taskId:t.taskId,outcome:t.taskId==='T1'?(retiring?'Retire':'Restore'):(retiring?'RemoveAndSchedule':'ReplacePredecessors'),removedPredecessorIds:t.taskId==='T1'||!retiring?[]:['T1'],confirmedPredecessorIds:clone(t.predecessorTaskIds),plan:c.lifecycle[t.taskId].kind==='Retired'?{kind:'Retired'}:{kind:'Planned',notBefore:clone(c.working.reference.state.constraints[t.taskId].notBefore)},rationale}))
        const review={reviewId,operation:retiring?'Retirement':'Restoration',reviewDate:c.project.projectStartDate,recordedAt,attribution:clone(actor),rationale,sourceLogicalRevision:from,targetLogicalRevision:R,retiredTaskIds:retiring?['T1']:[],restoredTaskIds:retiring?[]:['T1'],affectedTaskIds:outcomes.map(o=>o.taskId),successorDecisions:outcomes,archivedDependencyIds:archives.map(a=>a.archiveId),addedDependencies:added,resultingWorkingRevisionId:c.working.reference.state.revisionId,sourceEventId}
        c.scopeReviews.push(review);kind=retiring?'TaskRetired':'TaskRestored';event(kind,['T1'],{decision},decision.sourceEventId);event('ScopeReview',clone(c.manualOrder),{review},sourceEventId)
      } else {
        const index=(n-cycles*2)%100,t=c.tasks[index];t.description='Review '+n+': '+rationale
        kind='SourceEdit';event(kind,[t.taskId],{fields:['tasks'],summary:t.description},'E-TEXT-'+R)
      }
      const after=operational(s),changes=differences(before,after)
      series.push({from,to:R,recordedAt:new Date(Date.UTC(2026,10,10,15,0,R)).toISOString(),kind,changes})
      states.push(clone(after));expected.push({revision:R,sha256:sha(jcs(after))})
      if(sha(jcs(s.originalBaseline))!==baselineHash)throw Error('Synthetic baseline mutated')
    }
    return {snapshot:s,recordedState:{base,coverage:'Recorded states since synthetic seed only; not effective-date truth',revisions:series,expected},states,graph:{tasks:100,initialEdges:original.reduce((n,t)=>n+t.predecessorTaskIds.length,0),rootDirectSuccessors:99,uniqueDownstream:99,affectedPerScopeReview:100,maxPredecessors:Math.max(...original.map(t=>t.predecessorTaskIds.length))},baselineHash}
  } finally {await baselineLoader.close()}
}
