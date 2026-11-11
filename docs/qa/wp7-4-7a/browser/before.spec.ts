/** Run ONLY against archived WP7.4.7 source; asserts the old UI before capture. */
import { test, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { createLoadedTaskHistoryReader } from '../../../../src/history/selectedTaskHistory'
import { selectedHistoryFile } from '../../../../src/test/selectedHistoryFixture'
import { emptyProgress } from '../../../../src/progress/taskProgress'
const evidence = 'docs/qa/wp7-4-7a/evidence'
test('capture typed unavailable versus available-empty source mapping', async () => {
  const file = selectedHistoryFile(), rows = []
  for (const formatVersion of [1, 5] as const) for (const taskId of ['T1', 'T2', 'T3']) {
    const r = createLoadedTaskHistoryReader({ resourceId: 'before', formatVersion, taskIds: file.tasks.map(t => t.taskId), tracking: formatVersion === 1 ? emptyProgress() : file.taskProgress! })
    const opened = await r.open(taskId); if (opened.kind !== 'Opened') throw Error(opened.message)
    const page = await r.read(opened.session, { limit: 20, maxBytes: 128 * 1024 }); if (page.kind !== 'Page') throw Error(page.message)
    expect(page.availability).toBe(formatVersion === 1 ? 'Unavailable' : 'Available')
    rows.push({ formatVersion, taskId, availability: page.availability, coverage: page.coverage, returnedRows: page.items.length, hasMore: !!page.nextCursor })
    r.release(opened.session)
  }
  await mkdir(evidence, { recursive: true }); await writeFile(`${evidence}/source-state-before.json`, JSON.stringify(rows, null, 2) + '\n')
})
for (const [name, scenario, task] of [['rows', 'partial', 'T1'], ['empty', 'partial', 'T3'], ['unavailable', 'unavailable', 'T2']]) test(`before ${name} screenshot`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto('/docs/qa/wp7-4-7/qa/index.html')
  await page.getByLabel('Scenario', { exact: true }).selectOption(scenario)
  await page.getByLabel('Selected task', { exact: true }).selectOption(task)
  await page.getByRole('button', { name: 'Show history', exact: true }).click()
  await expect(page.getByText('Partial coverage.', { exact: true })).toBeVisible()
  await expect(page.getByText('Recorded transition history', { exact: true })).toBeVisible()
  const panel = page.locator('.selected-task-history')
  await mkdir(evidence, { recursive: true })
  await writeFile(`${evidence}/before-${name}.json`, JSON.stringify({ scenario, task, visibleText: await panel.innerText() }, null, 2) + '\n')
  await page.screenshot({ path: `${evidence}/before-${name}.png` })
})
