import { mkdir, readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { historyAsOf, historyFile } from '../../src/test/historyFixture'
import type { HistoryCase } from '../../src/test/historyFixture'
import type { ProjectFile } from '../../src/persistence/projectFile'
import { openPlan } from '../wp5-2-fixtures'
import { studentFile } from '../wp71/studentFixture'

test.use({ viewport: { width: 1440, height: 1050 }, timezoneId: 'America/Regina', actionTimeout: 10_000 })
const directory = 'docs/qa/wp7-3-3/evidence'
const chart = (page: Page) => page.getByRole('region', { name: 'Gantt chart', exact: true })
const summary = (page: Page) => chart(page).getByRole('region', { name: 'Progress-adjusted outlook', exact: true })
async function open(page: Page, kind: HistoryCase, mode = 'Expanded') {
  await openPlan(page, historyFile(kind))
  await page.getByLabel('PA As-of', { exact: true }).fill(historyAsOf(kind))
  await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption('day')
  await page.getByRole('button', { name: mode, exact: true }).click()
}
async function screenshot(page: Page, name: string) {
  await mkdir(directory, { recursive: true })
  await chart(page).screenshot({ path: `${directory}/${name}.png` })
}
async function exported(page: Page): Promise<ProjectFile> {
  await page.getByRole('tab', { name: 'Files', exact: true }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  return JSON.parse(await readFile((await (await pending).path())!, 'utf8'))
}
for (const mode of ['Expanded', 'Compressed']) {
  test(`1/2 ${mode} - prominent actual lateness and primary Monday PA, conservative release link`, async ({ page }) => {
    await open(page, 'late', mode)
    const overrun = page.locator('.historical-overrun[data-task-id="T1"]')
    await expect(overrun).toBeVisible(); await expect(overrun).toHaveAttribute('data-reference-date', '2026-11-02')
    await expect(overrun).toHaveAttribute('data-calendar-days', '4')
    await expect(overrun).toHaveAttribute('aria-label', /not continuous work, actual effort/)
    await expect(page.locator('.actual-date-marker[data-task-id="T1"]')).toHaveAttribute('data-actual-date', '2026-11-06')
    await expect(page.locator('.gantt-row-label').first()).toContainText('Completed late +4 calendar days')
    const pa = page.locator('.pa-primary[data-task-id="T2"]')
    await expect(pa).toBeVisible(); await expect(pa).toHaveAttribute('data-start-date', '2026-11-09')
    const ref = page.locator('.gantt-bar[data-task-id="T2"]')
    await expect(ref).toHaveAttribute('data-presentation', 'committed-reference')
    expect(await pa.locator('rect').first().getAttribute('height')).toBe('20')
    expect(await ref.locator('.gantt-bar-outline').getAttribute('height')).toBe('6')
    await expect(page.locator('.pa-dependency[data-successor="T2"]')).toHaveAttribute('data-release-date', '2026-11-09')
    await expect(page.locator('.pa-dependency[data-successor="T2"]')).toHaveAttribute('aria-label', /time unknown.*not an actual finish hour/)
    await expect(page.getByRole('img', { name: 'Dependency T1 to T2', exact: true })).toHaveAttribute('aria-description', /Committed dependency reference/)
    await expect(summary(page)).toContainText('Shifted PA tasks: T2')
    await screenshot(page, `01-late-${mode.toLowerCase()}`)
  })
  test(`3 ${mode} - future completion is warned, Unknown has no invented shifted relation`, async ({ page }) => {
    await open(page, 'future', mode)
    await expect(summary(page)).toContainText('Future-effective completion: T1')
    await expect(page.locator('.actual-date-marker')).toHaveAttribute('data-future', 'true')
    await expect(page.locator('.pa-primary')).toHaveCount(0)
    await expect(page.locator('.pa-dependency')).toHaveCount(0)
    await expect(page.locator('.uncertain-dependency')).toContainText('Deps ? T1 to T2')
    await expect(summary(page)).toContainText('Project outlook Unknown')
    await screenshot(page, `03-future-${mode.toLowerCase()}`)
  })
  test(`4 ${mode} - red overrun remains when parallel margin absorbs successor shift`, async ({ page }) => {
    await open(page, 'absorbed', mode)
    await expect(page.locator('.historical-overrun')).toBeVisible()
    await expect(summary(page)).toContainText('Project outlook unchanged: 2026-11-10')
    await expect(summary(page)).toContainText('no modelled project finish delay')
    await screenshot(page, `04-absorbed-${mode.toLowerCase()}`)
  })
  test(`8 ${mode} - weekend actual and elapsed overrun retain date-only precision`, async ({ page }) => {
    await open(page, 'weekend', mode)
    await expect(page.locator('.historical-overrun')).toHaveAttribute('data-calendar-days', '1')
    await expect(page.locator('.historical-overrun')).toHaveAttribute('data-collapsed', String(mode === 'Compressed'))
    await expect(page.locator('.actual-date-marker')).toHaveAttribute('data-actual-date', '2026-11-07')
    await expect(page.locator('.actual-release-bound')).toHaveAttribute('data-release-date', '2026-11-09')
    await screenshot(page, `08-weekend-${mode.toLowerCase()}`)
  })
}
for (const kind of ['started', 'blocked', 'reopened', 'conflict'] as const) test(`6 ${kind} - no fabricated primary duration or precise shifted connector`, async ({ page }) => {
  await open(page, kind)
  await expect(summary(page)).toContainText('Project outlook Unknown')
  await expect(page.locator('.pa-dependency')).toHaveCount(0)
  await expect(page.locator('.uncertain-dependency')).toBeVisible()
  if (kind === 'conflict') await expect(page.locator('.actual-date-marker[data-task-id="T2"]')).toHaveAttribute('data-actual-date', '2026-11-03')
  else await expect(page.locator('.pa-primary')).toHaveCount(0)
  await screenshot(page, `06-${kind}`)
})
for (const kind of ['on-time', 'early', 'missing-reference'] as const) test(`7 ${kind} - actual precedence without fabricated late interval`, async ({ page }) => {
  await open(page, kind)
  await expect(page.locator('.actual-date-marker')).toBeVisible()
  await expect(page.locator('.historical-overrun')).toHaveCount(0)
  await expect(page.locator('.gantt-bar[data-task-id="T1"]')).toHaveAttribute('data-presentation', 'committed-reference')
  if (kind === 'missing-reference') await expect(page.locator('.gantt-row-label').first()).toContainText('Historical comparison unavailable')
  if (kind === 'on-time') { await expect(page.locator('.gantt-bar[data-task-id="T2"]')).toHaveAttribute('data-presentation', 'pa-equals-commitment'); await expect(page.locator('.pa-primary')).toHaveCount(0) }
})
test('4 leaf - task overrun is visible with no successors', async ({ page }) => {
  await open(page, 'leaf')
  await expect(page.locator('.historical-overrun')).toBeVisible()
  await expect(summary(page)).toContainText('No downstream movement is modelled')
  await expect(page.locator('.pa-dependency')).toHaveCount(0)
})
test('5 ties and changed driving branch preserve committed CPM', async ({ page }) => {
  await open(page, 'tied')
  await expect(page.locator('.pa-dependency[data-successor="T3"]')).toHaveCount(2)
  await expect(page.locator('.actual-release-bound')).toHaveCount(2)
  await screenshot(page, '05-tied-releases')
  await open(page, 'driver')
  await page.getByLabel('Highlight Critical Path', { exact: true }).check()
  await expect(page.locator('.gantt-bar[data-task-id="T3"]')).toHaveAttribute('data-critical', 'true')
  await expect(page.locator('.gantt-bar[data-task-id="T2"]')).toHaveAttribute('data-critical', 'false')
  await expect(summary(page)).toContainText('Outlook-driving constraints: T1, T2')
  await screenshot(page, '05-changed-driver')
})
for (const mode of ['Expanded', 'Compressed']) for (let mask = 0; mask < 8; mask++) test(`10 ${mode} - actual, overrun and PA survive overlay mask ${mask}`, async ({ page }) => {
  await open(page, 'late', mode)
  for (const [index, label] of ['Show Baseline', 'Show Forecast', 'Highlight Critical Path'].entries()) await page.getByLabel(label, { exact: true }).setChecked(!!(mask & (1 << index)))
  await expect(page.locator('.historical-overrun')).toBeVisible()
  await expect(page.locator('.pa-primary')).toBeVisible()
  await expect(page.locator('.actual-date-marker')).toBeVisible()
  await expect(page.locator('.actual-release-bound')).toBeVisible()
  if (mask === 7) {
    const band = await page.locator('.historical-overrun .elapsed-delay-band').boundingBox()
    const baseline = await page.locator('.baseline-overlay[data-task-id="T1"] rect').boundingBox()
    const forecast = await page.locator('.forecast-overlay[data-task-id="T1"]').boundingBox()
    expect(baseline!.y).toBeGreaterThan(band!.y + band!.height)
    expect(forecast!.y + forecast!.height).toBeLessThan(band!.y)
    await screenshot(page, `10-all-layers-${mode.toLowerCase()}`)
  }
})
for (const count of [30, 40] as const) test(`10 ${count}-task narrow keyboard navigation and noncolor meaning`, async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 1000 })
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  await openPlan(page, studentFile({ count })); await page.getByLabel('PA As-of', { exact: true }).fill('2026-11-09')
  await page.getByRole('button', { name: 'Go to impact', exact: true }).focus(); await page.keyboard.press('Enter')
  const scroll = page.getByRole('region', { name: 'Scrollable Gantt timeline', exact: true })
  await expect(scroll).toBeFocused(); await page.keyboard.press('PageDown')
  expect(await page.locator('.gantt-row').count()).toBeLessThan(count)
  await expect(chart(page)).toContainText('C: secondary current committed reference')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await screenshot(page, `10-${count}-narrow`)
  expect(errors).toEqual([])
})
test('10 completion immediately redraws overrun and primary PA; keyboard selects actual evidence', async ({ page }) => {
  await open(page, 'before')
  await page.getByRole('button', { name: /^Inspect T1 / }).click()
  await page.getByLabel('T1 status in chart', { exact: true }).selectOption('Complete')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Effective completion date', { exact: true }).fill('2026-11-06')
  await dialog.getByLabel('I acknowledge that no formal completion criteria were recorded.', { exact: true }).check()
  await dialog.getByLabel('I confirm this task is complete.', { exact: true }).check()
  await dialog.getByRole('button', { name: 'Confirm completion', exact: true }).click()
  await expect(page.locator('.historical-overrun')).toHaveAttribute('data-calendar-days', '4')
  await expect(page.locator('.pa-primary')).toHaveAttribute('data-start-date', '2026-11-09')
  await expect(page.locator('.actual-release-bound')).toHaveAttribute('data-release-date', '2026-11-09')
  await expect(summary(page)).toContainText('Shifted PA tasks: T2')
  await page.locator('.historical-overrun').focus(); await page.keyboard.press('Enter')
  await expect(page.getByLabel('T1 status in chart', { exact: true })).toHaveValue('Complete')
  await screenshot(page, '10-immediate-completion')
})
for (const version of [1, 2, 3, 4, 5]) test(`9 format${version} sources round-trip without new presentation fields`, async ({ page }) => {
  const source = historyFile('late')
  const file = { ...source, schemaVersion: version, baseline: version >= 2 ? source.baseline : undefined, workTracking: version >= 3 ? source.workTracking : undefined, taskProgress: version >= 4 ? source.taskProgress : undefined, forecastSettings: version >= 5 ? source.forecastSettings : undefined }
  await openPlan(page, file); await page.getByLabel('PA As-of', { exact: true }).fill('2026-11-06')
  const out = await exported(page)
  expect(out.tasks).toEqual(source.tasks); expect(out.baseline).toEqual(file.baseline)
  if (version >= 4) expect(out.taskProgress).toEqual(source.taskProgress)
  expect(JSON.stringify(out)).not.toContain('elapsedOverrun'); expect(JSON.stringify(out)).not.toContain('paAsOf')
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'roundtrip.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(out)) })
  await page.getByRole('button', { name: 'Replace current project', exact: true }).click()
  await page.getByLabel('PA As-of', { exact: true }).fill('2026-11-06')
  if (version >= 4) await expect(page.locator('.historical-overrun')).toHaveAttribute('data-calendar-days', '4')
})
