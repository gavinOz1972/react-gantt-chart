import { expect, test } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { selectedHistoryFile } from '../../../../src/test/selectedHistoryFixture'
import { openPlan } from '../../../../tests/wp5-2-fixtures'
import type { Page } from '@playwright/test'

const details = (page: Page) => page.locator('.task-status-panel')
async function selectTask(page: Page, id: string) { await page.getByRole('button', { name: `Inspect ${id} History task ${id.slice(1)}`, exact: true }).click() }
async function exported(page: Page) {
  await page.getByRole('tab', { name: 'Files', exact: true }).click()
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  return JSON.parse(await readFile((await (await pending).path())!, 'utf8'))
}
test('enabled App starts collapsed; keyboard paging and hide preserve selection, drafts and exact project data', async ({ page }) => {
  const file = selectedHistoryFile()
  await openPlan(page, file); await selectTask(page, 'T1')
  const panel = details(page), before = await page.locator('.gantt-scroll').evaluate(e => ({ x: e.scrollLeft, y: e.scrollTop }))
  await expect(panel.getByRole('button', { name: 'Show history' })).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('[data-history-event]')).toHaveCount(0)
  await panel.getByRole('button', { name: 'Add criterion' }).click()
  await panel.getByRole('textbox', { name: 'Completion criterion', exact: true }).fill('Uncommitted wording')
  const show = panel.getByRole('button', { name: 'Show history' }); await show.focus(); await page.keyboard.press('Enter')
  await expect(panel.getByRole('button', { name: 'Hide history' })).toBeFocused(); await expect(page.locator('[data-history-event]')).toHaveCount(20)
  await expect(panel.getByText('Recorded changes. The current task status is shown above.')).toBeVisible()
  await expect(panel.locator('[data-history-event]').first()).toHaveAttribute('data-history-event', 'H-43')
  await panel.locator('[data-history-event="H-42"] summary').click()
  await expect(panel).toContainText('Original <guidance> & wording.')
  await expect(panel.locator('img')).toHaveCount(0)
  await panel.getByRole('button', { name: 'Load more history' }).click(); await expect(page.locator('[data-history-event]')).toHaveCount(40)
  await panel.getByRole('button', { name: 'Load more history' }).click(); await expect(page.locator('[data-history-event]')).toHaveCount(43)
  await expect(panel.getByText('No more recorded entries.')).toBeVisible()
  await expect(panel.getByRole('combobox', { name: 'T1 status in details', exact: true })).toHaveValue('In Progress')
  await expect(panel.getByRole('textbox', { name: 'Completion criterion', exact: true })).toHaveValue('Uncommitted wording')
  await panel.getByRole('button', { name: 'Hide history' }).click()
  await panel.getByRole('button', { name: 'Cancel criterion' }).click()
  const after = await page.locator('.gantt-scroll').evaluate(e => ({ x: e.scrollLeft, y: e.scrollTop }))
  expect(after).toEqual(before)
  const output = await exported(page); const { savedAt, ...expected } = file; void savedAt
  const { savedAt: exportedAt, ...actual } = output; void exportedAt
  expect(actual).toEqual(expected)
})
for (const width of [780, 1280, 1440]) test(`40-task app at ${width}px keeps actions accessible and history contained`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 1000 }); await openPlan(page, selectedHistoryFile()); await selectTask(page, 'T1')
  await details(page).getByRole('button', { name: 'Show history' }).click(); await expect(page.locator('[data-history-event]')).toHaveCount(20)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.getByRole('button', { name: 'Duplicate T1', exact: true })).toBeVisible()
  const directory = String(testInfo.project.metadata.historyEvidenceDirectory ?? 'docs/qa/wp7-4-7/evidence')
  await mkdir(directory, { recursive: true })
  await details(page).screenshot({ path: `${directory}/history-${width}.png` })
})
for (const scenario of ['partial', 'empty', 'unavailable', 'invalid', 'unsupported', 'expired', 'oversized', 'mixed', 'cancelled'] as const) test(`isolated ${scenario} QA is explicit and recoverable`, async ({ page }) => {
  await page.goto('/docs/qa/wp7-4-7/qa/index.html')
  await page.getByLabel('Scenario', { exact: true }).selectOption(scenario)
  await page.getByRole('button', { name: 'Show history' }).click()
  const text = { partial: 'Some earlier history may be unavailable', empty: 'No recorded history for this task.', unavailable: 'History unavailable.', invalid: 'Unable to display task history', mixed: 'History has changed—refresh to view a consistent version.', oversized: 'This history entry is too large to display here.', cancelled: 'Reading history was cancelled.', expired: 'History needs to be refreshed.', unsupported: 'History is not supported for this source.' }[scenario]
  await expect(page.getByText(text, { exact: true })).toBeVisible()
  if (['unsupported', 'expired', 'oversized', 'unavailable'].includes(scenario)) {
    await page.getByRole('button', { name: 'Show loaded legacy history' }).click()
    await expect(page.getByText(/Showing the original loaded history/)).toBeVisible()
    if (scenario === 'unavailable') await expect(page.getByText('No status events recorded.')).toBeVisible()
    if (scenario === 'oversized') {
      await expect(page.locator('[data-status-event="H-42"] ul li')).toHaveCount(300)
      await expect(page.locator('[data-status-event="H-43"]')).toHaveCount(0)
    }
  }
  if (!['partial', 'empty'].includes(scenario)) await expect(page.getByRole('button', { name: ['expired', 'mixed'].includes(scenario) ? 'Refresh history' : 'Retry reading history' })).toBeVisible()
})
test('delayed read cannot cross task changes; concurrent source requires explicit refresh', async ({ page }) => {
  await page.goto('/docs/qa/wp7-4-7/qa/index.html'); await page.getByLabel('Scenario', { exact: true }).selectOption('delayed')
  await page.getByRole('button', { name: 'Show history' }).click(); await expect(page.getByText('Loading recorded transitions…')).toBeVisible()
  await page.getByLabel('Selected task', { exact: true }).selectOption('T2')
  await page.getByRole('button', { name: 'Show history' }).click()
  await expect(page.locator('[data-history-event]')).toHaveCount(2)
  await expect(page.locator('[data-history-event]').first()).toHaveAttribute('data-history-event', 'H-45')
  await page.getByRole('button', { name: 'Simulate source change' }).click()
  await expect(page.getByText('History has changed—refresh to view a consistent version.')).toBeVisible(); await expect(page.locator('[data-history-event]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Refresh history' }).click(); await expect(page.locator('[data-history-event]')).toHaveCount(2)
})
for (const version of [1, 2, 3, 4, 5] as const) test(`format ${version} view preserves exact export contents and saved source; reload collapses disclosure`, async ({ page }) => {
  const file = selectedHistoryFile(); file.schemaVersion = version
  if (version < 5) delete file.forecastSettings
  if (version < 4) delete file.taskProgress
  if (version < 3) delete file.workTracking
  if (version < 2) delete file.baseline
  await openPlan(page, file)
  const before = await exported(page)
  await page.getByLabel('Saved plan name', { exact: true }).fill(`History format ${version}`)
  await page.getByRole('button', { name: 'Save As', exact: true }).click()
  const savedSource = await page.evaluate(() => localStorage.getItem('react-gantt-chart:projects:v1'))
  await page.getByRole('tab', { name: 'Workspace', exact: true }).click(); await selectTask(page, 'T1')
  await details(page).getByRole('button', { name: 'Show history' }).click()
  await expect(details(page).getByText('Some earlier history may be unavailable')).toBeVisible()
  await details(page).getByRole('button', { name: 'Hide history' }).click()
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('react-gantt-chart:projects:v1'))).toBe(savedSource)
  const after = await exported(page); const { savedAt: a, ...expected } = before; const { savedAt: b, ...actual } = after; void a; void b
  expect(actual).toEqual(expected)
  await page.reload(); await page.getByLabel('Saved plans', { exact: true }).selectOption(`History format ${version}`)
  await page.getByRole('button', { name: 'Load project', exact: true }).click(); await selectTask(page, 'T1')
  await expect(details(page).getByRole('button', { name: 'Show history' })).toHaveAttribute('aria-expanded', 'false')
})
