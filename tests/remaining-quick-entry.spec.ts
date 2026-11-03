import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { ProjectFile } from '../src/persistence/projectFile'
import { workBaseline, workData, workEntry, workTimestamp } from '../src/test/workFixture'
import { openPlan } from './wp5-2-fixtures'

const fixture = { ...workData, schemaVersion: 3, format: 'react-gantt-chart', createdBy: 'React Gantt Chart', savedAt: workTimestamp, baseline: workBaseline(),
  workTracking: { schemaVersion: 1, entries: [workEntry('W-1', 3), workEntry('W-2', 3, '2026-10-29')], remainingHours: {} } }
const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click()
const row = (page: Page, id = 'T2') => page.locator(`[data-task-row="${id}"]`)
const button = (page: Page, id = 'T2', chart = false) => page.getByRole('button', { name: `Edit ${chart ? 'Selected ' : ''}${id} remaining effort`, exact: true })
const input = (page: Page, id = 'T2', chart = false) => page.getByLabel(`${chart ? 'Selected ' : ''}${id} remaining effort`, { exact: true })
const chartSummary = (page: Page) => page.getByRole('region', { name: 'Selected chart task', exact: true })
const work = (page: Page) => page.getByRole('region', { name: 'Work & effort', exact: true })
const bar = (page: Page, id = 'T2') => page.locator(`.gantt-bar[data-task-id="${id}"]`)
async function open(page: Page) { await openPlan(page, fixture) }
async function edit(page: Page, value: string, key = 'Enter', id = 'T2', chart = false) {
  await button(page, id, chart).click(); await input(page, id, chart).fill(value); await input(page, id, chart).press(key)
}
async function exported(page: Page): Promise<ProjectFile> {
  await tab(page, 'Files'); const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  const file = await pending
  return JSON.parse(await readFile((await file.path())!, 'utf8'))
}
async function save(page: Page) {
  await tab(page, 'Files'); await page.getByLabel('Saved plan name', { exact: true }).fill('Quick effort')
  await page.getByRole('button', { name: 'Save As', exact: true }).click(); await tab(page, 'Workspace')
}

test('A01/A02/A03 fast table entry uses Enter, natural Tab/Shift+Tab, Escape, valid blur and pointer Save/Cancel', async ({ page }) => {
  await open(page)
  await expect(page.getByRole('columnheader', { name: 'Remaining Effort', exact: true })).toBeVisible()
  await expect(button(page)).toHaveText('—UnknownEdit')
  await edit(page, '5')
  await expect(button(page)).toHaveText('5 hEdit')
  await expect(button(page)).toBeFocused()
  await button(page).click()
  expect(await input(page).evaluate(element => { const field = element as HTMLInputElement; return [field.selectionStart, field.selectionEnd] })).toEqual([0, 1])
  await input(page).fill('2.25'); await input(page).press('Tab')
  await expect(button(page)).toHaveText('2.25 hEdit')
  await expect(row(page).getByRole('button', { name: 'T2 predecessors', exact: true })).toBeFocused()
  await edit(page, '3', 'Shift+Tab')
  await expect(row(page).getByRole('button', { name: 'Edit T2 duration', exact: true })).toBeFocused()
  await edit(page, '99', 'Escape')
  await expect(button(page)).toHaveText('3 hEdit')
  await button(page).click(); await input(page).fill('0')
  await page.getByRole('button', { name: 'Save T2 remaining effort', exact: true }).click()
  await expect(button(page)).toHaveText('0 hEdit')
  await button(page).click(); await input(page).fill('19')
  await page.getByRole('button', { name: 'Cancel T2 remaining effort', exact: true }).click()
  await expect(button(page)).toHaveText('0 hEdit')
  await button(page).click(); await input(page).fill('1.5')
  await page.getByRole('heading', { name: 'Tasks & schedule', exact: true }).click()
  await expect(button(page)).toHaveText('1.5 hEdit')
  await edit(page, '')
  await expect(button(page)).toHaveText('—UnknownEdit')
  await expect(work(page)).toContainText('Select a saved task')
})

test('A02/A04 invalid blur/Enter/Tab keep the draft, prior estimate and usable focus; unchanged blur leaves a saved plan clean', async ({ page }) => {
  await open(page); await edit(page, '5'); await save(page)
  await button(page).click()
  await page.getByRole('heading', { name: 'Tasks & schedule', exact: true }).click()
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  for (const value of ['-1', 'Infinity', 'NaN', 'bad', '1.001']) {
    await button(page).click(); await input(page).fill(value); await input(page).press('Enter')
    await expect(row(page).getByRole('alert')).toContainText('two decimal places')
    await input(page).press('Tab'); await expect(input(page)).toBeFocused()
    await page.getByRole('heading', { name: 'Tasks & schedule', exact: true }).click()
    await expect(input(page)).toHaveValue(value)
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
    await input(page).press('Escape')
    await expect(button(page)).toHaveText('5 hEdit')
    await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  }
})

test('A05/A06/A07 table, chart and Task Details synchronize effort comparisons without changing actuals, baseline or Gantt pixels', async ({ page }) => {
  await open(page); await bar(page).click()
  const surface = page.locator('.gantt-surface')
  await page.getByRole('heading', { name: 'Gantt chart', exact: true }).click()
  const before = createHash('sha256').update(await surface.screenshot()).digest('hex')
  const geometry = await page.locator('.gantt-bar').evaluateAll(elements => elements.map(element => [element.getAttribute('aria-label'), element.getAttribute('data-start'), element.getAttribute('data-end'), element.getAttribute('data-critical')]))
  await edit(page, '5')
  await expect(button(page, 'T2', true)).toHaveText('5 hEdit')
  await expect(chartSummary(page)).toContainText('11 h')
  await expect(chartSummary(page)).toContainText('+3 h')
  await expect(work(page).locator('[data-effort="actual"]')).toHaveText('6 h')
  await expect(work(page).getByLabel('Remaining effort (hours)', { exact: true })).toHaveValue('5')
  await edit(page, '2', 'Enter', 'T2', true)
  await expect(button(page)).toHaveText('2 hEdit')
  await expect(chartSummary(page)).toContainText('Effort at completion (recorded data)8 h')
  await expect(chartSummary(page)).toContainText('Effort variance (recorded data)0 h')
  await expect(work(page).locator('[data-effort="forecast"]')).toHaveText('8 h')
  await expect(work(page).locator('[data-effort="variance"]')).toHaveText('0 h')
  await work(page).getByLabel('Remaining effort (hours)', { exact: true }).fill('4')
  await work(page).getByRole('button', { name: 'Save remaining estimate', exact: true }).click()
  await expect(button(page)).toHaveText('4 hEdit'); await expect(button(page, 'T2', true)).toHaveText('4 hEdit')
  await page.getByRole('heading', { name: 'Gantt chart', exact: true }).click()
  expect(createHash('sha256').update(await surface.screenshot()).digest('hex')).toBe(before)
  expect(await page.locator('.gantt-bar').evaluateAll(elements => elements.map(element => [element.getAttribute('aria-label'), element.getAttribute('data-start'), element.getAttribute('data-end'), element.getAttribute('data-critical')]))).toEqual(geometry)
  await page.getByRole('button', { name: 'Compressed', exact: true }).click()
  await edit(page, '2', 'Enter', 'T2', true)
  await expect(page.getByRole('button', { name: 'Compressed', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Expanded', exact: true }).click()
  const file = await exported(page)
  expect(file.tasks).toEqual(fixture.tasks); expect(file.project).toEqual(fixture.project)
  expect(file.baseline).toEqual(fixture.baseline); expect(file.workTracking!.entries).toEqual(fixture.workTracking.entries)
  expect(file.schemaVersion).toBe(5)
})

test('A08 remaining values keep permanent task identity through sorting, manual drag and changing chart selection', async ({ page }) => {
  await open(page); await edit(page, '2'); await edit(page, '0', 'Enter', 'T9')
  await page.getByRole('combobox', { name: 'Task order', exact: true }).selectOption('name')
  await expect(row(page, 'T2').getByRole('button', { name: 'Edit T2 remaining effort', exact: true })).toHaveText('2 hEdit')
  await page.getByRole('combobox', { name: 'Task order', exact: true }).selectOption('manual')
  await page.getByRole('button', { name: 'Drag T2 to reorder', exact: true }).dragTo(row(page, 'T9'))
  expect(await page.locator('[data-task-row]').evaluateAll(rows => rows.map(element => element.getAttribute('data-task-row')))).toEqual(['T2', 'T9'])
  for (const [id, value] of [['T2', '2'], ['T9', '0']]) {
    await bar(page, id).click(); await expect(button(page, id, true)).toHaveText(`${value} hEdit`)
  }
  expect((await exported(page)).workTracking!.remainingHours).toEqual({ T2: 2, T9: 0 })
})

test('A09 existing format round trips retain null versus zero and all original work records', async ({ page }) => {
  await open(page); await edit(page, '0'); await edit(page, '1', 'Enter', 'T9'); await edit(page, '', 'Enter', 'T9')
  await save(page)
  const original = await exported(page)
  expect(original.workTracking!.remainingHours).toEqual({ T2: 0, T9: null })
  await page.reload(); await page.getByLabel('Saved plans', { exact: true }).selectOption('Quick effort')
  await page.getByRole('button', { name: 'Load project', exact: true }).click()
  await expect(button(page)).toHaveText('0 hEdit'); await expect(button(page, 'T9')).toHaveText('—UnknownEdit')
  await tab(page, 'Files')
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'quick.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(original)) })
  await expect(button(page)).toHaveText('0 hEdit')
  expect((await exported(page)).workTracking).toEqual(original.workTracking)
})

test('A02/A08 invalid selected-chart drafts can be resumed after selecting another bar without changing either task', async ({ page }) => {
  await open(page); await bar(page).click(); await edit(page, 'invalid', 'Enter', 'T2', true)
  await bar(page, 'T9').click()
  await page.getByRole('button', { name: 'Resume remaining edit for T2', exact: true }).click()
  await expect(input(page, 'T2', true)).toHaveValue('invalid')
  await input(page, 'T2', true).press('Escape')
  await expect(button(page)).toHaveText('—UnknownEdit'); await expect(button(page, 'T9')).toHaveText('—UnknownEdit')
  expect((await exported(page)).workTracking!.remainingHours).toEqual({})
})

for (const width of [1440, 780, 600]) test(`A01/A05/A10 quick controls remain accessible without overlapping table columns at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 }); await open(page); await bar(page).click(); await edit(page, '5')
  await chartSummary(page).screenshot({ path: `docs/review/wp6-2-1-chart-${width}.png` })
  await button(page).click(); await input(page).fill('2.5')
  await page.getByRole('region', { name: 'Task schedule table', exact: true }).screenshot({ path: `docs/review/wp6-2-1-table-${width}.png` })
  expect((await row(page).locator('.task-text').boundingBox())!.width).toBeGreaterThanOrEqual(220)
  expect((await row(page).locator('.remaining-effort-cell').boundingBox())!.width).toBeGreaterThanOrEqual(160)
  expect(await page.evaluate(() => [...document.querySelectorAll('main *')].filter(element => element.getBoundingClientRect().right > innerWidth + 1 && !element.closest('.table-scroll,.gantt-scroll,.baseline-table-scroll')).map(element => [element.tagName, element.className, Math.round(element.getBoundingClientRect().width)]).slice(0, 12))).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await input(page).press('Enter')
  const chart = await page.getByRole('region', { name: 'Gantt chart', exact: true }).boundingBox()
  const tasks = await page.getByRole('region', { name: 'Tasks & schedule', exact: true }).boundingBox()
  expect(chart!.y).toBeLessThan(tasks!.y)
})
