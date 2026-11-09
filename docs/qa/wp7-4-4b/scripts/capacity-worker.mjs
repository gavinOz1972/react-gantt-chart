// Fresh-process measurements of test-only probes/reference code, NOT full codec validation.
import { readFileSync, writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { lexicalProbe, referenceCanonicalize as canonicalize, sha, prefix } from './probe.mjs'
const input = process.argv[2], output = process.argv[3], timings = {}, memory = []
const sample = phase => memory.push({ phase, ...process.memoryUsage() })
const measure = (name, action) => { const start = performance.now(), value = action(); timings[name] = performance.now() - start; sample(name); return value }
global.gc?.()
const start = performance.now()
const bytes = measure('read', () => readFileSync(input))
const scan = measure('lexicalScan', () => lexicalProbe(bytes))
const file = measure('jsonParse', () => JSON.parse(bytes.toString('utf8')))
const counts = measure('selectedShapeChecks', () => {
  const c = file.snapshot.current, ids = new Set(c.tasks.map(t => t.taskId)), active = new Set(c.tasks.filter(t => c.lifecycle[t.taskId].kind === 'Active').map(t => t.taskId))
  if (ids.size !== c.tasks.length || Object.keys(c.lifecycle).length !== ids.size) throw Error('Synthetic identity mismatch')
  for (const t of c.tasks) if (active.has(t.taskId) ? t.predecessorTaskIds.some(p => !active.has(p)) : t.predecessorTaskIds.length) throw Error('Synthetic active graph mismatch')
  if (Object.keys(c.working.reference.state.commitments).length !== active.size) throw Error('Synthetic working projection mismatch')
  for (const r of c.scopeReviews) if (r.targetLogicalRevision !== r.sourceLogicalRevision + 1 || new Set(r.affectedTaskIds).size !== r.affectedTaskIds.length) throw Error('Synthetic review mismatch')
  return { tasks: ids.size, active: active.size, retired: ids.size - active.size, logs: c.workTracking.entries.length, criteria: Object.values(c.progress.tasks).reduce((n,p) => n+p.criteria.length,0), lifecycleDecisions: Object.values(c.lifecycle).reduce((n,l) => n+l.decisions.length,0), archivedDependencies: c.archivedDependencies.length, scopeReviews: c.scopeReviews.length, historyEvents: file.snapshot.history.events.length }
})
const canonicalSnapshot = measure('canonicalSnapshot', () => canonicalize(file.snapshot))
const D = measure('hash', () => sha(Buffer.concat([prefix, Buffer.from(canonicalSnapshot)])))
if (D !== file.integrity.snapshotSha256) throw Error('Synthetic digest mismatch')
const canonicalFile = measure('canonicalFile', () => canonicalize(file))
const pipelineMs = performance.now() - start, pipelineResource = process.resourceUsage()
const size = text => Buffer.byteLength(text, 'utf8')
const sectionValues = Object.fromEntries(Object.entries(file.snapshot.current).map(([key,value]) => [key,size(canonicalize(value))]))
const rootSections = Object.fromEntries(Object.entries(file.snapshot).map(([key,value]) => [key,size(canonicalize(value))]))
const cSize = rootSections.current
writeFileSync(output, JSON.stringify({ qualificationOnly:true, timings, pipelineMs, peakRssKiB:pipelineResource.maxRSS, memorySamples:memory, sizes:{prettyFile:bytes.length,canonicalFile:size(canonicalFile),canonicalSnapshot:size(canonicalSnapshot),fileEnvelopeOverhead:size(canonicalFile)-size(canonicalSnapshot),rootSections,currentSectionValues:sectionValues,currentFramingOverhead:cSize-Object.values(sectionValues).reduce((a,b)=>a+b,0)}, scan, counts, inputSha256:sha(bytes), snapshotSha256:D, fullSchemaValidationMeasured:false })+'\n')
