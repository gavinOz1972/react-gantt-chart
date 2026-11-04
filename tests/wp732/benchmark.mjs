import assert from 'node:assert/strict'
import { writeFile, mkdir } from 'node:fs/promises'
import { cpus } from 'node:os'
import { performance } from 'node:perf_hooks'
import { createServer } from 'vite'
const loader = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
const { calculateProgressImpact } = await loader.ssrLoadModule('/src/projection/progressImpact.ts')
const { emptyProgress, transitionTask } = await loader.ssrLoadModule('/src/progress/taskProgress.ts')
await loader.close()
const rows = []
for (const count of [30, 40, 60, 100]) for (const dense of [false, true]) {
  const project = { projectId: 'WP732-BENCH', name: 'DISPOSABLE benchmark', projectStartDate: '2026-11-02', targetEndDate: '2027-12-01', workingWeekdays: [1, 2, 3, 4, 5], workingHoursPerDay: 4 }
  const tasks = Array.from({ length: count }, (_, i) => ({ taskId: `T${i + 1}`, name: `Task ${i + 1}`, description: '', durationHours: 4,
    predecessorTaskIds: i === 0 ? [] : dense ? Array.from({ length: i }, (_, n) => `T${n + 1}`) : [`T${i}`], independentStartMode: 'DEFAULT' }))
  const progress = transitionTask(emptyProgress(), 'T1', { target: 'Complete', eventId: 'BENCH-E1', date: '2026-11-04', recordedAt: '2026-11-10T12:00:00.000Z', completionAcknowledged: true, noCriteriaAcknowledged: true, committedFinishDateAtCompletion: '2026-11-02' }, tasks.map(t => t.taskId))
  assert.equal(progress.ok, true)
  const inputs = { project, tasks, progress: progress.value, asOf: '2026-11-04' }, before = JSON.stringify(inputs)
  for (let n = 0; n < 25; n++) calculateProgressImpact(inputs)
  const samples = []
  for (let n = 0; n < 100; n++) {
    const start = performance.now(), result = calculateProgressImpact(inputs)
    samples.push(performance.now() - start)
    assert.equal(result.ok, true); assert.equal(result.project.uncertain, false)
  }
  samples.sort((a, b) => a - b)
  assert.equal(JSON.stringify(inputs), before)
  const row = { count, edges: tasks.reduce((n, t) => n + t.predecessorTaskIds.length, 0), dense, samples: samples.length, p50Ms: samples[50], p95Ms: samples[95], maxMs: samples.at(-1) }
  assert.ok(row.p95Ms < 50, `100-task design budget: ${JSON.stringify(row)}`)
  rows.push(row)
}
await mkdir('docs/qa/wp7-3-2/evidence', { recursive: true })
await writeFile('docs/qa/wp7-3-2/evidence/calculation-performance.json', JSON.stringify({ capturedAtUTC: new Date().toISOString(), node: process.version, cpu: cpus()[0]?.model, logicalProcessors: cpus().length,
  method: 'Node/Vite SSR pure calculation only, 25 warmups + 100 iterations per fixture. Includes existing schedule/progress validation and new projection. Observational on shared host; not browser paint or a physical student laptop.', rows }, null, 2) + '\n')
console.log(`PASS: ${rows.length} sparse/dense 30-100 task fixtures; all p95 <50ms; maximum p95 ${Math.max(...rows.map(r => r.p95Ms)).toFixed(2)}ms.`)
