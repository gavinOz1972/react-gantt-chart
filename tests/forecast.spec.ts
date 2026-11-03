import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { ProjectFile } from '../src/persistence/projectFile'
import { workBaseline, workData, workRecords, workTimestamp } from '../src/test/workFixture'
import { openPlan } from './wp5-2-fixtures'

const fixture = { ...workData, schemaVersion: 4, format: 'react-gantt-chart', createdBy: 'React Gantt Chart', savedAt: workTimestamp, baseline: workBaseline(), workTracking: workRecords() }
const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click()
const summary = (page: Page) => page.getByRole('region', { name: 'Project health', exact: true })
const chart = (page: Page) => page.getByRole('region', { name: 'Selected chart task', exact: true })
const comparison = (page: Page) => chart(page).getByLabel('T2 forecast comparison', { exact: true })
async function configure(page: Page) {
  await tab(page, 'Project Settings')
  await page.getByRole('checkbox', { name: 'Enable effort-based forecasting', exact: true }).check()
  await page.getByLabel('Class hours per student per week', { exact: true }).fill('3')
  await page.getByLabel('Homework hours per student per week', { exact: true }).fill('5')
  await page.getByLabel('Team size', { exact: true }).fill('4')
  await page.getByRole('radio', { name: /^Fixed/ }).check()
  await page.getByLabel('Forecast As-of date', { exact: true }).fill('2026-11-02')
  await tab(page, 'Workspace')
}
async function remaining(page: Page, id: string, value: string, source = 'table') {
  const label = `${source === 'chart' ? 'Selected ' : ''}${id} remaining effort`
  await page.getByRole('button', { name: `Edit ${label}`, exact: true }).click()
  await page.getByLabel(label, { exact: true }).fill(value); await page.getByLabel(label, { exact: true }).press('Enter')
}
async function exported(page: Page): Promise<ProjectFile> {
  await tab(page, 'Files'); const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  const result = await pending; return JSON.parse(await readFile((await result.path())!, 'utf8'))
}
async function geometry(page: Page) { return page.locator('.gantt-bar').evaluateAll(elements => elements.map(e => [e.getAttribute('data-task-id'), e.getAttribute('data-start'), e.getAttribute('data-end')])) }

test('A01/A04/A12/A13 live quick entry, capacity, target and dependency projections preserve committed bars and baseline', async ({ page }) => {
  await openPlan(page, fixture); await expect(summary(page)).toContainText('Disabled')
  const before = await geometry(page)
  await configure(page)
  await expect(summary(page)).toContainText('32 person-hours'); await expect(summary(page)).toContainText('Unknown remaining (1): T9')
  await expect(summary(page)).toContainText('Partial')
  await remaining(page, 'T9', '2'); await expect(summary(page)).toContainText('Forecast: Complete')
  await expect(summary(page)).toContainText('2026-11-03')
  await page.locator('.gantt-bar[data-task-id="T2"]').click()
  await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  await expect(comparison(page)).toContainText('Ahead of Plan')
  await remaining(page, 'T2', '100', 'chart')
  await expect(comparison(page)).toContainText('Forecast Slip'); await expect(summary(page)).toContainText('102 person-hours')
  expect(await geometry(page)).toEqual(before)
  await tab(page, 'Project Settings'); await page.getByLabel('Team size', { exact: true }).fill('10'); await tab(page, 'Workspace')
  await expect(comparison(page)).toContainText('2026-11-10')
  await chart(page).getByRole('button', { name: 'Close selected task details', exact: true }).click(); await expect(chart(page)).toHaveCount(0)
  const file = await exported(page)
  expect(file.baseline).toEqual(fixture.baseline); expect(file.tasks).toEqual(fixture.tasks); expect(file.workTracking!.entries).toEqual(fixture.workTracking.entries)
  expect(file.forecastSettings!.teamSize).toBe(10); expect(file).not.toHaveProperty('forecastFinish')
})

test('A03 invalid drafts disable saves and forecasts; correcting or reverting restores safe settings', async ({ page }) => {
  await openPlan(page, fixture); await configure(page); await tab(page, 'Project Settings')
  await page.getByLabel('Team size', { exact: true }).fill('1.5')
  await expect(page.getByRole('alert')).toContainText('whole number')
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
  await tab(page, 'Workspace'); await expect(summary(page)).toContainText('Correct or revert invalid')
  await tab(page, 'Project Settings'); await page.getByRole('button', { name: 'Revert invalid forecast entries', exact: true }).click()
  await expect(page.getByLabel('Team size', { exact: true })).toHaveValue('4')
  await page.getByLabel('Class hours per student per week', { exact: true }).fill('0'); await page.getByLabel('Homework hours per student per week', { exact: true }).fill('0')
  await tab(page, 'Workspace'); await expect(summary(page)).toContainText('Projected completionUnavailable')
  await page.locator('.gantt-bar[data-task-id="T2"]').click(); await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check(); await expect(comparison(page)).toContainText('Uncertain')
})

test('A08/A10/A11 statuses and completion history keep date evidence after current edits and JSON import', async ({ page }) => {
  await openPlan(page, fixture); await configure(page); await remaining(page, 'T9', '2')
  await page.locator('.gantt-bar[data-task-id="T2"]').click()
  await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  const control = page.getByRole('combobox', { name: 'T2 status in chart', exact: true })
  await control.selectOption('Blocked'); await page.getByLabel('Blocked reason', { exact: true }).fill('Awaiting approval')
  await page.getByRole('button', { name: 'Set Blocked', exact: true }).click()
  await expect(summary(page)).toContainText('Indeterminate tasks, including downstream dependencies: T2, T9')
  await expect(comparison(page)).toContainText('Uncertain')
  await control.selectOption('In Progress'); await expect(summary(page)).toContainText('Forecast: Complete')
  await tab(page, 'Project Settings'); await page.getByLabel('Forecast As-of date', { exact: true }).fill('2026-11-09'); await tab(page, 'Workspace')
  await expect(comparison(page)).toContainText('Late')
  await control.selectOption('Complete'); const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Effective completion date', { exact: true }).fill('2026-11-10')
  for (const check of await dialog.getByRole('checkbox').all()) await check.check()
  await dialog.getByRole('button', { name: 'Confirm completion', exact: true }).click()
  await expect(comparison(page)).toContainText('Completed Late'); await expect(summary(page)).toContainText('Known remaining effort2 person-hours')
  await page.getByRole('button', { name: 'Edit T2 duration', exact: true }).click(); await page.getByLabel('T2 duration', { exact: true }).fill('100'); await page.getByLabel('T2 duration', { exact: true }).press('Enter')
  await expect(comparison(page)).toContainText('Completed Late')
  const file = await exported(page)
  expect(file.taskProgress!.events.at(-1)!.committedFinishDateAtCompletion).toBe('2026-11-06')
  expect(file.baseline).toEqual(fixture.baseline)
  await page.goto('/'); await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'forecast.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) })
  await page.locator('.gantt-bar[data-task-id="T2"]').click(); await expect(comparison(page)).toContainText('Completed Late')
})

test('A14 safe local reopen, legacy backup and malformed forecast import retain the current plan', async ({ page }) => {
  await openPlan(page, fixture); await configure(page); await remaining(page, 'T9', '2')
  await tab(page, 'Files'); await expect(page.getByRole('button', { name: 'Export WP6.3 backup', exact: true })).toBeVisible()
  await page.getByLabel('Saved plan name', { exact: true }).fill('Forecast review'); await page.getByRole('button', { name: 'Save As', exact: true }).click()
  await page.reload(); await page.getByLabel('Saved plans', { exact: true }).selectOption('Forecast review'); await page.getByRole('button', { name: 'Load project', exact: true }).click()
  await expect(summary(page)).toContainText('2026-11-03')
  const file = await exported(page)
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...file, forecastSettings: { ...file.forecastSettings, teamSize: -1 } })) })
  await expect(page.getByRole('alert')).toContainText('INVALID_FORECAST_SETTINGS')
  expect((await exported(page)).forecastSettings).toEqual(file.forecastSettings)
})

for (const width of [1440, 600]) test(`forecast comparison and Close remain usable at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 }); await openPlan(page, fixture); await configure(page)
  await remaining(page, 'T9', '2'); await page.locator('.gantt-bar[data-task-id="T2"]').click()
  await expect(comparison(page)).toContainText('Baseline finish2026-11-06')
  await expect(summary(page)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `docs/review/wp6-4-forecast-${width}.png`, fullPage: true })
  const close = chart(page).getByRole('button', { name: 'Close selected task details', exact: true }); await close.focus(); await page.keyboard.press('Enter'); await expect(chart(page)).toHaveCount(0)
})
