import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import assert from 'node:assert/strict'
const loader = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-wp733-fixtures', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
const { historyFile, historyAsOf } = await loader.ssrLoadModule('/src/test/historyFixture.ts')
const { parseProject } = await loader.ssrLoadModule('/src/persistence/projectFile.ts')
await loader.close()
const directory = 'tests/fixtures/wp733'
await mkdir(directory, { recursive: true })
const cases = ['late', 'before', 'future', 'absorbed', 'leaf', 'tied', 'driver', 'started', 'blocked', 'reopened', 'conflict', 'on-time', 'early', 'missing-reference', 'weekend']
const manifest = []
for (const kind of cases) {
  const file = historyFile(kind), text = JSON.stringify(file, null, 2) + '\n'
  assert.equal(parseProject(text).ok, true)
  await writeFile(`${directory}/${kind}.json`, text)
  manifest.push({ file: `${kind}.json`, paAsOf: historyAsOf(kind) })
}
await writeFile(`${directory}/manifest.json`, JSON.stringify({ purpose: 'WP733 fictional owner-review fixtures, not actual owner data', cases: manifest }, null, 2) + '\n')
console.log(`PASS: ${cases.length} fictional format-5 fixtures validated by the existing parser.`)
