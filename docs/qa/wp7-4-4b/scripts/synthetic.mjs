/** Deterministic synthetic fixture RECIPE ONLY, not a general lifecycle writer/model. */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const clone = value => structuredClone(value)
const actor = { source: 'User', actorLabel: null, application: 'Synthetic qualification recipe' }
const day = '2026-11-10', calendar = { workingWeekdays: [1, 2, 3, 4, 5], workingHoursPerDay: 4 }
export const families = [
  { name: 'class30', tasks: 30, cycles: 0, edits: 20, logs: 2, criteria: 3, text: 96 },
  { name: 'class40', tasks: 40, cycles: 1, edits: 40, logs: 4, criteria: 4, text: 192 },
  { name: 'class100', tasks: 100, cycles: 2, edits: 100, logs: 6, criteria: 5, text: 384 },
  { name: 'stress300', tasks: 300, cycles: 4, edits: 300, logs: 8, criteria: 6, text: 500 },
  { name: 'stress1000', tasks: 1000, cycles: 8, edits: 1000, logs: 10, criteria: 8, text: 500 },
  ...[0, 5, 20, 50].map(cycles => ({ name: 'growth100-c' + cycles, tasks: 100, cycles, edits: cycles * 10, logs: 4, criteria: 4, text: 500 })),
]
export async function makeSynthetic(options) {
  const { tasks: count, cycles, edits, logs, criteria, text } = options
  if (count % 5) throw Error('Recipe uses complete five-task diamond blocks')
  const seed = JSON.parse(readFileSync(root + '/../wp7-4-4/examples/retirement-restored.json', 'utf8')).snapshot
  const note = ('Synthetic explanatory text; not measured student workload. ').repeat(20).slice(0, text)
  const project = { ...seed.current.project, projectId: 'qualification-' + options.name, name: 'Synthetic ' + options.name }
  const c = { ...clone(seed.current), project, tasks: [], manualOrder: [], progress: { definitionOfDone: 'Synthetic explicit completion guidance.', tasks: {} }, actuals: {}, lifecycle: {}, archivedDependencies: [], scopeReviews: [], workTracking: { schemaVersion: 1, entries: [], remainingHours: {} }, working: clone(seed.current.working) }
  c.working.reference.inputs = { project: clone(project), tasks: [] }
  c.working.reference.state.constraints = {}; c.working.reference.state.commitments = {}; c.working.reference.decisions = []
  const originalTasks = [], events = [], retireParts = [], restoreParts = []
  for (let block = 0; block < count / 5; block++) {
    const ids = Object.fromEntries([1,2,3,4,5].map(i => ['T' + i, 'T' + (block * 5 + i)]))
    const shared = { 'REVIEW-cascade': 'REVIEW-initial-retire', 'REVIEW-restore': 'REVIEW-initial-restore', 'E-REVIEW-cascade': 'E-initial-retire', 'E-REVIEW-restore': 'E-initial-restore' }
    function rename(value) {
      if (Array.isArray(value)) return value.map(rename)
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [ids[k] ?? k, rename(v)]))
      if (typeof value !== 'string') return value
      if (ids[value]) return ids[value]
      if (shared[value]) return shared[value]
      if (/^(D-|E-|ARCH-|C-original)/.test(value)) return 'B' + block + '-' + value
      return value
    }
    const part = rename(seed.current)
    c.tasks.push(...part.tasks); c.manualOrder.push(...part.manualOrder)
    for (const field of ['actuals','lifecycle']) Object.assign(c[field], part[field])
    Object.assign(c.progress.tasks, part.progress.tasks); Object.assign(c.workTracking.remainingHours, part.workTracking.remainingHours)
    c.archivedDependencies.push(...part.archivedDependencies)
    Object.assign(c.working.reference.state.constraints, part.working.reference.state.constraints)
    Object.assign(c.working.reference.state.commitments, part.working.reference.state.commitments)
    c.working.reference.decisions.push(...part.working.reference.decisions)
    originalTasks.push(...rename(seed.originalBaseline.value.tasks))
    retireParts.push(part.scopeReviews[0]); restoreParts.push(part.scopeReviews[1])
    events.push(...rename(seed.history.events).filter(e => e.kind !== 'ScopeReview'))
  }
  c.nextTaskNumber = count + 1
  for (const task of c.tasks) {
    task.name = 'Task ' + task.taskId; task.description = note
    const state = c.progress.tasks[task.taskId], items = Array.from({ length: criteria }, (_, i) => ({ criterionId: `CR-${task.taskId}-${i}`, text: ('Criterion ' + i + ': ' + note).slice(0, 500), checked: state.status === 'Complete' }))
    state.criteria = clone(items)
    if (c.actuals[task.taskId].completion.kind === 'Known') {
      c.actuals[task.taskId].completion.attestation.criteriaSnapshot = clone(items)
      c.actuals[task.taskId].completion.attestation.noCriteriaAcknowledged = false
      c.actuals[task.taskId].completion.attestation.definitionOfDone = c.progress.definitionOfDone
    }
    for (const decision of c.lifecycle[task.taskId].decisions) {
      decision.before.task.name = task.name; decision.before.task.description = note
      decision.before.progress.criteria = clone(items)
    }
    for (let i = 0; i < logs; i++) c.workTracking.entries.push({ entryId: `LOG-${task.taskId}-${i}`, taskId: task.taskId, workDate: state.status === 'Complete' ? '2026-11-06' : '2026-11-09', contributor: 'Synthetic student ' + (i % 4), hours: 0.25, description: note.slice(0, 500), createdAt: '2026-11-10T15:00:00.000Z', updatedAt: '2026-11-10T15:00:00.000Z' })
  }
  const commonReview = (parts, id, eventId) => ({ ...clone(parts[0]), reviewId: id, sourceEventId: eventId, retiredTaskIds: parts.flatMap(p => p.retiredTaskIds), restoredTaskIds: parts.flatMap(p => p.restoredTaskIds), affectedTaskIds: parts.flatMap(p => p.affectedTaskIds), successorDecisions: parts.flatMap(p => p.successorDecisions), archivedDependencyIds: parts.flatMap(p => p.archivedDependencyIds), addedDependencies: parts.flatMap(p => p.addedDependencies) })
  const first = commonReview(retireParts, 'REVIEW-initial-retire', 'E-initial-retire'), second = commonReview(restoreParts, 'REVIEW-initial-restore', 'E-initial-restore')
  c.scopeReviews = [first, second]
  // Refresh repeated immutable lifecycle payloads after criterion/text authoring.
  for (const e of events) if (e.kind === 'TaskRetired' || e.kind === 'TaskRestored') e.payload.decision = clone(c.lifecycle[e.taskIds[0]].decisions.find(d => d.decisionId === e.payload.decision.decisionId))
  for (const review of c.scopeReviews) events.push({ eventId: review.sourceEventId, sequence: 0, recordedInRevision: review.targetLogicalRevision, recordedAt: review.recordedAt, effectiveDate: review.reviewDate, attribution: clone(actor), taskIds: [...c.manualOrder], supersedesEventId: null, reason: note, kind: 'ScopeReview', payload: { review: clone(review) } })
  events.sort((a,b) => a.recordedInRevision - b.recordedInRevision || (a.kind === 'ScopeReview' ? 1 : b.kind === 'ScopeReview' ? -1 : 0))
  events.forEach((e,i) => { e.sequence = i + 1 })
  // Fresh synthetic baseline only. Existing unchanged WP1 establishes this new
  // fixture's original baseline once; no user's baseline is read or regenerated.
  for (const task of originalTasks) { task.name = 'Task ' + task.taskId; task.description = note }
  const loader = await createServer({ root: resolve(root, '../../..'), configFile: false, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', cacheDir: resolve(root, '../../../../output/wp7-4-4b-verification/vite-cache') })
  let baseline
  try {
    const { establishBaseline } = await loader.ssrLoadModule('/src/baseline/baseline.ts')
    const result = establishBaseline({ project, tasks: originalTasks, nextTaskNumber: count + 1, manualOrder: [...c.manualOrder], sortMode: 'manual', duplicateOrigins: {} }, 'B-' + options.name, '2026-11-02T15:00:00.000Z')
    if (!result.ok) throw Error(JSON.stringify(result.errors))
    baseline = clone(result.value)
  } finally { await loader.close() }
  const s = { logicalRevision: 4, origin: { kind: 'New', createdAt: '2026-11-02T15:00:00.000Z', attribution: clone(actor) }, current: c, originalBaseline: { kind: 'Present', interpretation: 'WP1-v1', value: baseline }, history: { coverage: { kind: 'Partial', reason: 'Deterministic synthetic recipe starts from a current snapshot with earlier explanations unavailable.' }, nextSequence: events.length + 1, events } }
  const refreshWorking = version => {
    c.working.reference.state.revisionId = version
    c.working.reference.inputs = { project: clone(project), tasks: clone(c.tasks.filter(t => c.lifecycle[t.taskId].kind === 'Active')) }
    c.working.reference.acceptedAt = new Date(Date.UTC(2026,10,10,15,0,s.logicalRevision)).toISOString()
  }
  refreshWorking('W-restore')
  function append(kind, taskIds, payload, eventId, recordedAt) { s.history.events.push({ eventId, sequence: s.history.nextSequence++, recordedInRevision: s.logicalRevision, recordedAt, effectiveDate: kind === 'SourceEdit' ? null : day, attribution: clone(actor), taskIds, supersedesEventId: null, reason: note, kind, payload: clone(payload) }) }
  const subjects = c.tasks.filter(t => (Number(t.taskId.slice(1)) - 3) % 5 === 0).map(t => t.taskId)
  for (let round = 0; round < cycles; round++) for (const operation of ['Retire', 'Restore']) {
    const from = s.logicalRevision++, R = s.logicalRevision, reviewId = `REVIEW-${R}`, scopeEvent = `E-SCOPE-${R}`, recordedAt = new Date(Date.UTC(2026,10,10,15,0,R)).toISOString(), archives = [], added = [], retired = operation === 'Retire', outcomes = []
    for (const id of subjects) {
      const task = c.tasks.find(t => t.taskId === id), life = c.lifecycle[id], state = c.working.reference.state, decisionId = `LIFE-${R}-${id}`, eventId = `E-${decisionId}`, parent = 'T' + (Number(id.slice(1)) - 2)
      const beforeWorking = state.commitments[id] ? { workingRevisionId: state.revisionId, calendar: clone(calendar), constraint: clone(state.constraints[id]), commitment: clone(state.commitments[id]) } : null
      const decision = { decisionId, taskId: id, operation, priorDecisionId: life.lastDecisionId, reviewId, recordedInRevision: R, effectiveDate: day, recordedAt, attribution: clone(actor), rationale: note, sourceEventId: eventId, before: { task: clone(task), progress: clone(c.progress.tasks[id]), actuals: clone(c.actuals[id]), remainingHours: c.workTracking.remainingHours[id], working: beforeWorking } }
      life.kind = retired ? 'Retired' : 'Active'; life.lastDecisionId = decisionId; life.decisions.push(decision)
      if (retired) {
        for (const pred of task.predecessorTaskIds) { const a = { archiveId: `ARCH-${R}-${pred}-${id}`, predecessorTaskId: pred, successorTaskId: id, archivedInRevision: R, reviewId, rationale: note, sourceEventId: scopeEvent }; archives.push(a); c.archivedDependencies.push(a) }
        task.predecessorTaskIds = []; delete state.constraints[id]; delete state.commitments[id]; c.working.reference.decisions = c.working.reference.decisions.filter(d => d.taskId !== id)
      } else {
        task.predecessorTaskIds = [parent]
        added.push({ predecessorTaskId: parent, successorTaskId: id, reinstatesArchiveIds: [c.archivedDependencies.findLast(a => a.predecessorTaskId === parent && a.successorTaskId === id).archiveId] })
        const D = `D-W-${R}-${id}`
        state.constraints[id] = { notBefore: { date: '2026-11-11', hour: 1 }, origin: 'Confirmed', decisionId: D }
        state.commitments[id] = { kind: 'Known', start: { date: '2026-11-11', hour: 1 }, finish: { date: '2026-11-11', afterHour: 2 }, decisionId: D }
        c.working.reference.decisions.push({ decisionId: D, taskId: id, predecessorIds: [parent], outcome: 'KeepAndMove', reason: note, sourceEventId: null })
      }
      outcomes.push({ taskId: id, outcome: retired ? 'Retire' : 'Restore', removedPredecessorIds: retired ? [parent] : [], confirmedPredecessorIds: retired ? [] : [parent], plan: retired ? { kind: 'Retired' } : { kind: 'Planned', notBefore: { date: '2026-11-11', hour: 1 } }, rationale: note })
      if (!retired) for (const offset of [1,2]) { const child = 'T' + (Number(id.slice(1)) + offset); outcomes.push({ taskId: child, outcome: 'KeepCurrent', removedPredecessorIds: [], confirmedPredecessorIds: clone(c.tasks.find(t => t.taskId === child).predecessorTaskIds), plan: { kind: 'Planned', notBefore: { date: day, hour: 1 } }, rationale: note }) }
      append(retired ? 'TaskRetired' : 'TaskRestored', [id], { decision }, eventId, recordedAt)
    }
    refreshWorking('W-' + R)
    const review = { reviewId, operation: retired ? 'Retirement' : 'Restoration', reviewDate: day, recordedAt, attribution: clone(actor), rationale: note, sourceLogicalRevision: from, targetLogicalRevision: R, retiredTaskIds: retired ? [...subjects] : [], restoredTaskIds: retired ? [] : [...subjects], affectedTaskIds: outcomes.map(o => o.taskId), successorDecisions: outcomes, archivedDependencyIds: archives.map(a => a.archiveId), addedDependencies: added, resultingWorkingRevisionId: c.working.reference.state.revisionId, sourceEventId: scopeEvent }
    c.scopeReviews.push(review); append('ScopeReview', [...c.manualOrder], { review }, scopeEvent, recordedAt)
  }
  for (let i = 0; i < edits; i++) {
    s.logicalRevision++
    const id = c.manualOrder[i % count], summary = `Description review ${i}: ${note}`
    c.tasks.find(t => t.taskId === id).description = summary
    append('SourceEdit', [id], { fields: ['tasks'], summary }, 'E-TEXT-' + i, new Date(Date.UTC(2026,10,10,16,0,i)).toISOString())
  }
  return s
}
