import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { performance } from 'node:perf_hooks'
import { createServer } from 'vite'
const loader = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-wp742-benchmark', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
let evaluateWorkingCandidate, benchmarkInput
try {
  ;({ evaluateWorkingCandidate } = await loader.ssrLoadModule('/src/planning/workingPlan.ts'))
  ;({ benchmarkInput } = await loader.ssrLoadModule('/src/planning/__fixtures__/benchmark.ts'))
} finally { await loader.close() }
const snapshot = value => JSON.stringify(value, (_, item) => item instanceof Map ? [...item] : item)
const cases = []
for (const size of [30, 40]) for (const shape of ['sparse', 'diamond', 'chain']) {
  const input = benchmarkInput(size, shape), before = snapshot(input), measurements = []
  for (let i = 0; i < 325; i++) {
    const start = performance.now(), result = evaluateWorkingCandidate(input), elapsed = performance.now() - start
    assert.equal(result.ok, true)
    assert.equal(result.candidates.length, size)
    assert.ok(result.candidates.every(c => c.kind === 'Known'))
    if (i >= 25) measurements.push(elapsed)
  }
  assert.equal(snapshot(input), before)
  measurements.sort((a, b) => a - b)
  const record = { tasks: size, shape, edges: input.tasks.reduce((n, t) => n + t.predecessorTaskIds.length, 0), warmup: 25, samples: measurements.length, p50Ms: measurements[Math.ceil(measurements.length * .5) - 1], p95Ms: measurements[Math.ceil(measurements.length * .95) - 1], maxMs: measurements.at(-1) }
  cases.push(record)
  console.log(JSON.stringify(record))
}
const longest = cases.reduce((a, b) => a.maxMs > b.maxMs ? a : b)
await mkdir('docs/qa/wp7-4-2/evidence', { recursive: true })
await writeFile('docs/qa/wp7-4-2/evidence/performance.json', JSON.stringify({ recordedAtUTC: new Date().toISOString(), node: process.version, platform: process.platform, cpu: os.cpus()[0]?.model, logicalProcessors: os.cpus().length, method: 'Whole evaluator call including source/history validation, graph and calendar;25 warmup plus300 measurements per fixture. Fixture creation and result assertions excluded from measured interval. Shared host, not isolated CPU.', cases, longestCase: longest, limits: 'Node observations only, no browser long-task/UI/classroom-device inference; evaluator remains unused by application.' }, null, 2) + '\n')
