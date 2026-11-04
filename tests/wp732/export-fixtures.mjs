import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import assert from 'node:assert/strict'
const loader = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
const { caseFile } = await loader.ssrLoadModule('/tests/wp732/fixtures.ts')
const { parseProject } = await loader.ssrLoadModule('/src/persistence/projectFile.ts')
await loader.close()
const directory = 'tests/fixtures/wp732'
await mkdir(directory, { recursive: true })
const fixtures = [
  ['late-before-completion', 'L03', true], ['late-after-completion', 'L03'],
  ['slack-absorbed', 'L05'], ['changed-driver', 'L08'], ['started-unknown', 'L09'],
  ['blocked-unknown', 'L14b'], ['reopened-unknown', 'L13'], ['conflicting-history', 'L10'],
  ['same-day-precision', 'L01b'], ['as-of-only', 'L11b'], ['nonworking-actual', 'L12'],
  ['all-layers', 'L15'], ['roundtrip', 'L16'],
]
for (const [name, scenario, before] of fixtures) {
  const text = JSON.stringify(caseFile(scenario, before), null, 2) + '\n'
  assert.equal(parseProject(text).ok, true)
  await writeFile(`${directory}/${name}.json`, text)
}
console.log(`PASS: ${fixtures.length} fictional format-5 owner-review fixtures validate with existing parser.`)
