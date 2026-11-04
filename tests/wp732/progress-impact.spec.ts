import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { caseFile, scenario } from './fixtures'
import { openPlan } from '../wp5-2-fixtures'
import { studentFile } from '../wp71/studentFixture'
import type { ProjectFile } from '../../src/persistence/projectFile'

test.use({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/Regina', actionTimeout: 10_000 })
const directory = 'docs/qa/wp7-3-2/evidence'
const gantt = (page: Page) => page.getByRole('region', { name: 'Gantt chart', exact: true })
const summary = (page: Page) => gantt(page).getByRole('region', { name: 'Progress-adjusted outlook', exact: true })
const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click()
async function openCase(page: Page, id: string, before = false) {
  await openPlan(page, caseFile(id, before))
  await page.getByLabel('PA As-of', { exact: true }).fill(scenario(id).asOf)
}
async function shot(page: Page, name: string) {
  await mkdir(directory, { recursive: true }); await gantt(page).screenshot({ path: `${directory}/${name}.png` })
}
async function exported(page: Page): Promise<ProjectFile> {
  await tab(page, 'Files'); const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  return JSON.parse(await readFile((await (await pending).path())!, 'utf8'))
}
test('A J - completion immediately updates marker, successor and project summary with toggles off', async ({ page }) => {
  await openCase(page, 'L03', true)
  await expect(summary(page)).toContainText('Project outlook Unknown')
  await expect(page.locator('.pa-outline[data-task-id="T2"]')).toHaveCount(0)
  await page.getByRole('button', { name: /^Inspect T1 / }).click()
  await page.getByLabel('T1 status in chart', { exact: true }).selectOption('Complete')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Effective completion date', { exact: true }).fill('2026-11-04')
  await dialog.getByLabel('I acknowledge that no formal completion criteria were recorded.', { exact: true }).check()
  await dialog.getByLabel('I confirm this task is complete.', { exact: true }).check()
  await dialog.getByRole('button', { name: 'Confirm completion', exact: true }).click()
  // No refresh, tab, toggle or selection action between completion and assertions.
  await expect(page.locator('.actual-date-marker[data-task-id="T1"]')).toHaveAttribute('data-actual-date', '2026-11-04')
  await expect(page.locator('.pa-outline[data-task-id="T2"]')).toHaveAttribute('data-start-date', '2026-11-05')
  await expect(summary(page)).toContainText('Conditional project outlook 2026-11-05')
  await expect(summary(page)).toContainText('1 historically late completion')
  for (const label of ['Show Baseline', 'Show Forecast', 'Highlight Critical Path']) await expect(page.getByLabel(label, { exact: true })).not.toBeChecked()
  await shot(page, 'a-j-immediate')
})
test('B - shifted successor, absorbed slack and no modelled project delay', async ({ page }) => {
  await openCase(page, 'L05')
  await expect(summary(page)).toContainText('Project outlook unchanged: 2026-11-05')
  await expect(summary(page)).toContainText('no modelled project finish delay')
  await expect(page.locator('.pa-outline[data-task-id="T2"]')).toHaveAttribute('data-finish-date', '2026-11-04')
  await shot(page, 'b-slack-absorbed')
})
for (const id of ['L09', 'L14b', 'L13', 'L10']) test(`C - ${id} missing or contradictory evidence stays Unknown`, async ({ page }) => {
  await openCase(page, id)
  await expect(summary(page)).toContainText('Project outlook Unknown')
  if (id !== 'L10') {
    await expect(page.locator('.pa-unknown').first()).toBeVisible()
    await expect(page.locator('.pa-outline')).toHaveCount(0)
  } else await expect(summary(page)).toContainText('Recorded completion order conflicts')
  if (id === 'L13') await expect(page.locator('.actual-date-marker[data-task-id="T1"]')).toHaveAttribute('data-active', 'false')
  await shot(page, `c-${id.toLowerCase()}`)
})
test('D - same-day completion uses next working day without historical lateness claim', async ({ page }) => {
  await openCase(page, 'L01b')
  await expect(summary(page)).toContainText('0 historically late completions')
  await expect(page.locator('.pa-outline[data-task-id="T2"]')).toHaveAttribute('data-start-date', '2026-11-03')
  await expect(summary(page)).toContainText('conservative movement is not an observed delay')
  await shot(page, 'd-date-only-precision')
})
test('same-date project slot delay is not mislabelled as absorbed slack', async ({ page }) => {
  const source = caseFile('L01b')
  const file = { ...source, tasks: [...source.tasks, { ...source.tasks[1], taskId: 'T3', name: 'Parallel reference', durationHours: 1, predecessorTaskIds: [], independentStartMode: 'MANUAL', requestedStartDate: '2026-11-03' }], nextTaskNumber: 4, manualOrder: ['T1', 'T2', 'T3'] }
  await openPlan(page, file); await page.getByLabel('PA As-of', { exact: true }).fill('2026-11-02')
  await expect(summary(page)).toContainText('+1 scheduled slots; same calendar date')
  await expect(summary(page)).not.toContainText('no modelled project finish delay')
  await shot(page, 'same-date-project-slot-delay')
})
test('E - changed outlook driver preserves committed critical highlighting and Network facts', async ({ page }) => {
  await openCase(page, 'L08')
  await expect(summary(page)).toContainText('Outlook-driving constraints: T1, T2')
  await page.getByLabel('Highlight Critical Path', { exact: true }).check()
  await expect(page.locator('.gantt-bar[data-task-id="T3"]')).toHaveAttribute('data-critical', 'true')
  await expect(page.locator('.gantt-bar[data-task-id="T2"]')).toHaveAttribute('data-critical', 'false')
  await shot(page, 'e-changed-driver-gantt')
  await page.getByRole('button', { name: 'Network / Critical Path', exact: true }).click()
  await expect(page.locator('.network-node[data-task-id="T3"]')).toHaveAttribute('data-critical', 'true')
  await expect(page.locator('.network-node[data-task-id="T2"]')).toContainText('PA shifted')
  await page.getByRole('region', { name: 'Network / Critical Path', exact: true }).screenshot({ path: `${directory}/e-network.png` })
})
test('F - As-of-only shift stays independent of unrelated late completion and FF control', async ({ page }) => {
  await openCase(page, 'L11b')
  await expect(page.locator('.pa-outline[data-task-id="T2"]')).toHaveAttribute('data-cause', 'As-of')
  await expect(summary(page)).toContainText('As-of-driven movement is labelled separately')
  const original = (await exported(page)).forecastSettings
  await tab(page, 'Workspace'); await page.getByLabel('PA As-of', { exact: true }).fill('2026-11-05')
  expect((await exported(page)).forecastSettings).toEqual(original)
})
test('G - save/reload/export/import preserves facts and reproduces PA with external As-of', async ({ page }) => {
  const source = caseFile('L16'); await openCase(page, 'L16')
  await tab(page, 'Files'); await page.getByLabel('Saved plan name', { exact: true }).fill('WP732 DISPOSABLE roundtrip')
  await page.getByRole('button', { name: 'Save As', exact: true }).click()
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  await page.reload(); await page.getByLabel('Saved plans', { exact: true }).selectOption('WP732 DISPOSABLE roundtrip')
  await page.getByRole('button', { name: 'Load project', exact: true }).click()
  const localToday = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })
  await expect(page.getByLabel('PA As-of', { exact: true })).toHaveValue(localToday)
  await page.getByLabel('PA As-of', { exact: true }).fill('2026-11-04')
  await expect(summary(page)).toContainText('Conditional project outlook 2026-11-05')
  const out = await exported(page)
  expect({ ...out, savedAt: source.savedAt }).toEqual(source)
  expect(JSON.stringify(out)).not.toContain('paAsOf'); expect(JSON.stringify(out)).not.toContain('drivingTaskIds')
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'roundtrip.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(out)) })
  await page.getByLabel('PA As-of', { exact: true }).fill('2026-11-04')
  await expect(page.locator('.pa-outline[data-task-id="T2"]')).toHaveAttribute('data-finish-date', '2026-11-05')
})
for (const mask of [0, 1, 2, 3, 4, 5, 6, 7]) test(`H - actual and PA automatic in overlay combination ${mask}`, async ({ page }) => {
  await openCase(page, 'L15')
  for (const [index, label] of ['Show Baseline', 'Show Forecast', 'Highlight Critical Path'].entries()) await page.getByLabel(label, { exact: true }).setChecked(!!(mask & (1 << index)))
  await expect(page.locator('.actual-date-marker[data-task-id="T1"]')).toBeVisible()
  await expect(page.locator('.pa-outline[data-task-id="T2"]')).toBeVisible()
  await expect(summary(page)).toContainText('Conditional project outlook 2026-11-05')
  if (mask === 7) { await expect(page.locator('.forecast-overlay[data-task-id="T2"]')).toHaveAttribute('data-finish-date', '2026-11-04'); await shot(page, 'h-all-layers') }
})
test('nonworking actual date, keyboard access, long-range Go to impact and context retention', async ({ page }) => {
  await openCase(page, 'L12')
  await page.getByRole('button', { name: 'Compressed', exact: true }).click()
  await expect(page.locator('.actual-date-marker[data-task-id="T1"]')).toHaveAttribute('data-omitted', 'true')
  await page.locator('.actual-date-marker[data-task-id="T1"]').focus(); await page.keyboard.press('Enter')
  await expect(page.getByLabel('T1 status in chart', { exact: true })).toBeVisible()
  await shot(page, 'nonworking-compressed')
  const file = caseFile('L03') // source is frozen; construct a copy
  const far = { ...file, taskProgress: { ...file.taskProgress!, events: file.taskProgress!.events.map(e => ({ ...e, date: '2028-06-01' })) } }
  await tab(page, 'Files'); await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'far.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(far)) })
  await page.getByRole('button', { name: 'Replace current project', exact: true }).click()
  await page.getByLabel('PA As-of', { exact: true }).fill('2028-06-01')
  const region = page.getByRole('region', { name: 'Scrollable Gantt timeline', exact: true })
  await expect.poll(() => region.evaluate(e => e.scrollLeft)).toBe(0)
  await summary(page).getByRole('button', { name: 'Go to impact', exact: true }).click()
  await expect.poll(() => region.evaluate(e => e.scrollLeft)).toBeGreaterThan(0)
  await expect(page.locator('.pa-outline[data-task-id="T2"]')).toHaveAttribute('data-start-date', '2028-06-02')
  const before = await region.evaluate(e => e.scrollLeft)
  await page.getByLabel('PA As-of', { exact: true }).fill('2028-06-02')
  expect(Math.abs(await region.evaluate(e => e.scrollLeft) - before)).toBeLessThan(2)
})
for (const count of [30, 40] as const) test(`I - ${count} tasks stay virtualized and keyboard discoverable`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  const start = performance.now(); await openPlan(page, studentFile({ count }))
  await page.getByLabel('PA As-of', { exact: true }).fill('2026-11-09')
  await expect(summary(page)).toContainText('As-of-driven movement')
  const scroll = page.getByRole('region', { name: 'Scrollable Gantt timeline', exact: true })
  await scroll.focus(); await page.keyboard.press('PageDown')
  expect(await page.locator('.gantt-row').count()).toBeLessThan(count)
  await expect(scroll).toBeFocused()
  await shot(page, `i-${count}-tasks`)
  await mkdir(directory, { recursive: true }); await writeFile(`${directory}/i-${count}-browser.json`, JSON.stringify({ count, readyMilliseconds: performance.now() - start, renderedRows: await page.locator('.gantt-row').count(), pageErrors: errors }, null, 2) + '\n')
  expect(errors).toEqual([])
})
