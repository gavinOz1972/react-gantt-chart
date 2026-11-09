/** ASSESSMENT ONLY. Lossless illustrative factoring and recorded-state research.
 * Not a format, codec, migration, repository, lifecycle writer or production API.
 */
import { referenceCanonicalize as jcs, sha, digest } from '../../wp7-4-4b/scripts/probe.mjs'
export { jcs, sha, digest }
export const clone = value => structuredClone(value)
export const equal = (a,b) => jcs(a) === jcs(b)
export const bytes = value => Buffer.byteLength(jcs(value))

// One definition per immutable ID; references retain exact legacy /2 semantics.
export function factor(snapshot) {
  const current=clone(snapshot.current), records={decisions:{},reviews:{},archives:{},events:[]}
  function retain(table,key,value) {
    if (table[key] && !equal(table[key],value)) throw Error('Conflicting illustrative ID: '+key)
    table[key]=clone(value)
  }
  for(const life of Object.values(current.lifecycle)) {
    for(const decision of life.decisions) retain(records.decisions,decision.decisionId,decision)
    delete life.decisions
  }
  for(const review of current.scopeReviews) retain(records.reviews,review.reviewId,review)
  for(const archive of current.archivedDependencies) retain(records.archives,archive.archiveId,archive)
  // Retain ordering separately: /2 arrays are order-sensitive.
  const order={lifecycle:Object.fromEntries(Object.entries(snapshot.current.lifecycle).map(([id,l])=>[id,l.decisions.map(d=>d.decisionId)])),reviews:current.scopeReviews.map(r=>r.reviewId),archives:current.archivedDependencies.map(a=>a.archiveId)}
  delete current.scopeReviews; delete current.archivedDependencies
  for(const event of snapshot.history.events) {
    const copy=clone(event)
    if(event.kind==='TaskRetired'||event.kind==='TaskRestored') {
      const d=event.payload.decision; retain(records.decisions,d.decisionId,d)
      copy.payload={decisionRef:d.decisionId}
    } else if(event.kind==='ScopeReview') {
      const r=event.payload.review; retain(records.reviews,r.reviewId,r)
      copy.payload={reviewRef:r.reviewId}
    }
    records.events.push(copy)
  }
  return {assessmentEncoding:'B-ILLUSTRATION-NOT-A-PROJECT-FORMAT',logicalRevision:snapshot.logicalRevision,origin:clone(snapshot.origin),current,originalBaseline:clone(snapshot.originalBaseline),history:{coverage:clone(snapshot.history.coverage),nextSequence:snapshot.history.nextSequence},order,records,recordedState:null,checkpoints:[]}
}
export function expandEvent(doc,event) {
  const e=clone(event)
  if(e.payload.decisionRef) e.payload={decision:clone(doc.records.decisions[e.payload.decisionRef])}
  if(e.payload.reviewRef) e.payload={review:clone(doc.records.reviews[e.payload.reviewRef])}
  return e
}
export function materialize(doc) {
  const current=clone(doc.current)
  for(const [id,life] of Object.entries(current.lifecycle)) life.decisions=doc.order.lifecycle[id].map(key=>clone(doc.records.decisions[key]))
  current.scopeReviews=doc.order.reviews.map(key=>clone(doc.records.reviews[key]))
  current.archivedDependencies=doc.order.archives.map(key=>clone(doc.records.archives[key]))
  return {logicalRevision:doc.logicalRevision,origin:clone(doc.origin),current,originalBaseline:clone(doc.originalBaseline),history:{...clone(doc.history),events:doc.records.events.map(e=>expandEvent(doc,e))}}
}
export function operational(snapshot) {
  const c=clone(snapshot.current)
  for(const life of Object.values(c.lifecycle)) delete life.decisions
  delete c.scopeReviews; delete c.archivedDependencies
  return {logicalRevision:snapshot.logicalRevision,current:c}
}
// Exact stored-state changes, including before/after, over a finite known series.
// Array element identity here relies on the fixed recipe's stable order/length.
// Not a proposed general patch standard, transition validator or domain command.
export function differences(before,after,path=[],changes=[]) {
  if(equal(before,after)) return changes
  if(before && after && typeof before==='object' && typeof after==='object' && Array.isArray(before)===Array.isArray(after)) {
    if(Array.isArray(before) && before.length===after.length) {
      for(let i=0;i<before.length;i++) differences(before[i],after[i],[...path,i],changes)
      return changes
    }
    if(!Array.isArray(before) && equal(Object.keys(before).sort(),Object.keys(after).sort())) {
      for(const key of Object.keys(before)) differences(before[key],after[key],[...path,key],changes)
      return changes
    }
  }
  changes.push({path,before:clone(before),after:clone(after)})
  return changes
}
export function replay(state,revision) {
  if(state.logicalRevision!==revision.from || revision.to!==revision.from+1) throw Error('Revision discontinuity')
  const next=clone(state)
  for(const change of revision.changes) {
    let parent=next
    for(const key of change.path.slice(0,-1)) parent=parent[key]
    const key=change.path.at(-1)
    if(!equal(parent[key],change.before)) throw Error('Before-context mismatch')
    parent[key]=clone(change.after)
  }
  if(next.logicalRevision!==revision.to) throw Error('Missing revision update')
  return next
}
export function reconstruct(doc,target) {
  const recorded=doc.recordedState
  if(!recorded || target<recorded.base.logicalRevision || target>doc.logicalRevision) return {kind:'Unknown',reason:'Outside measured recorded-state coverage'}
  const checkpoint=[...doc.checkpoints].reverse().find(c=>c.state.logicalRevision<=target)
  const start=checkpoint?.state??recorded.base
  if(checkpoint && sha(jcs(start))!==checkpoint.stateSha256) throw Error('Checkpoint corruption')
  let state=clone(start),applied=0
  for(const revision of recorded.revisions) if(revision.to>state.logicalRevision && revision.to<=target) {state=replay(state,revision);applied++}
  return {kind:'KnownRecordedState',state,applied,startRevision:start.logicalRevision}
}
export function page(doc,option,query,cursor=0) {
  const events=option==='A'?doc.history.events:doc.records.events
  const matches=events.filter(e=>e.sequence>cursor && e.recordedInRevision<=query.watermark && e.taskIds.includes(query.taskId) && (!query.kind||e.kind===query.kind) && e.recordedAt!==null && e.recordedAt>=query.from && e.recordedAt<query.until)
  const selected=matches.slice(0,query.limit)
  return {items:selected.map(e=>option==='A'?clone(e):expandEvent(doc,e)),next:matches.length>query.limit?selected.at(-1).sequence:null,total:matches.length}
}
