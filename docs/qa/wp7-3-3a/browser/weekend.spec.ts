import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { openPlan } from '../../../../tests/wp5-2-fixtures'

const evidence = 'docs/qa/wp7-3-3a/evidence'
const phase = process.env.WP733A_CAPTURE === 'before' ? 'before' : 'after'
for (const width of [1440, 600]) test(`reference screenshots at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1050 })
  const file = JSON.parse(await readFile('tests/fixtures/wp733/weekend.json', 'utf8'))
  await openPlan(page, file)
  await page.getByLabel('PA As-of', { exact: true }).fill('2026-11-07')
  await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption('day')
  await mkdir(evidence, { recursive: true })
  await page.getByRole('button', { name: /^Inspect T1 / }).click()
  for (const mode of ['Expanded', 'Compressed']) {
    await page.getByRole('button', { name: mode, exact: true }).click()
    await page.getByRole('button', { name: 'Go to selected task', exact: true }).click()
    const chart = page.getByRole('region', { name: 'Gantt chart', exact: true })
    const actual = page.locator('.actual-date-marker[data-task-id="T1"]')
    await expect(actual).toHaveAttribute('data-actual-date', '2026-11-07')
    await expect(page.locator('.actual-release-bound')).toHaveAttribute('data-release-date', '2026-11-09')
    await chart.screenshot({ path: `${evidence}/${phase}-${mode.toLowerCase()}-${width}.png` })
    await actual.scrollIntoViewIfNeeded()
    const box = (await actual.boundingBox())!
    const x = Math.max(0, Math.min(width - 280, box.x - 50)), y = Math.max(0, Math.min(940, box.y - 14))
    await page.screenshot({ path: `${evidence}/${phase}-${mode.toLowerCase()}-${width}-detail.png`, clip: { x, y, width: Math.min(280, width), height: 110 } })
    const drawing = await page.locator('.gantt-drawing').evaluate(node => node.outerHTML.replaceAll(/pattern-[^" ]+/g, 'pattern'))
    await writeFile(`${evidence}/${phase}-${mode.toLowerCase()}-${width}.svg.txt`, drawing)
  }
})

async function load(page: Page, scale = 'day', variant = 'weekend') {
  const file = JSON.parse(await readFile('tests/fixtures/wp733/weekend.json', 'utf8'))
  if (variant === 'missing') delete file.taskProgress.events[0].committedFinishDateAtCompletion
  if (variant === 'sunday') file.taskProgress.events[0].date = '2026-11-08'
  if (variant === 'calendar') { file.project.workingWeekdays = [1, 4, 5]; file.taskProgress.events[0].date = '2026-11-11' }
  await page.setViewportSize({ width: 600, height: 1050 })
  await openPlan(page, file)
  await page.getByLabel('PA As-of', { exact: true }).fill(file.taskProgress.events[0].date)
  await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption(scale)
  await page.getByRole('button', { name: 'Compressed', exact: true }).click()
  await page.getByRole('button', { name: /^Inspect T1 / }).click()
  await page.getByRole('button', { name: 'Go to selected task', exact: true }).click()
  return file
}
async function legible(page: Page) {
  const metrics = await page.locator('.collapsed-actual-marker').evaluate(node => {
    const rect = (selector: string) => { const b = node.querySelector<SVGGraphicsElement>(selector)!.getBBox(); return { x: b.x, y: b.y, right: b.x + b.width, bottom: b.y + b.height } }
    const drawing = node.closest('svg')!
    return { card: rect('.collapsed-actual-card'), date: rect('.collapsed-actual-date'), comparison: rect('.collapsed-actual-comparison'), width: Number(drawing.getAttribute('width')), releaseTop: drawing.querySelector<SVGGraphicsElement>('.actual-release-bound rect')?.getBBox().y }
  })
  expect(metrics.date.bottom).toBeLessThanOrEqual(metrics.comparison.y)
  for (const text of [metrics.date, metrics.comparison]) {
    expect(text.x).toBeGreaterThan(metrics.card.x); expect(text.right).toBeLessThan(metrics.card.right)
    expect(text.y).toBeGreaterThanOrEqual(metrics.card.y); expect(text.bottom).toBeLessThanOrEqual(metrics.card.bottom)
  }
  expect(metrics.card.x).toBeGreaterThanOrEqual(0); expect(metrics.card.right).toBeLessThanOrEqual(metrics.width)
  expect(metrics.releaseTop).toBeGreaterThan(metrics.card.bottom)
  return metrics
}
for (const scale of ['hour', 'day', 'week']) test(`collapsed date is readable, anchored and keyboard accessible at narrow ${scale} scale`, async ({ page }) => {
  await load(page, scale)
  const actual = page.locator('.collapsed-actual-marker')
  await expect(actual).toHaveAccessibleName(/Sat, Nov 7, 2026.*\+1 calendar day late.*not.*actual effort/)
  await expect(actual.locator('.collapsed-actual-date')).toHaveText('Actual Sat, Nov 7, 2026')
  await expect(actual.locator('.collapsed-actual-comparison')).toHaveText('+1 calendar day late')
  const anchor = Number(await actual.locator('.collapsed-actual-anchor').getAttribute('data-boundary-x'))
  const release = await page.locator('.actual-release-bound path').getAttribute('d')
  expect(release).toContain(`M ${anchor} `)
  await expect(page.locator('.pa-dependency')).toHaveAttribute('data-release-date', '2026-11-09')
  const metrics = await legible(page)
  await mkdir(evidence, { recursive: true })
  await writeFile(`${evidence}/layout-${scale}.json`, JSON.stringify(metrics, null, 2))
  await actual.focus(); await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /^Inspect T1 / })).toHaveAttribute('aria-pressed', 'false')
  await actual.focus(); await actual.press('Enter')
  await expect(page.getByRole('button', { name: /^Inspect T1 / })).toHaveAttribute('aria-pressed', 'true')
})
for (const variant of ['missing', 'sunday', 'calendar']) test(`omitted-date ${variant} preserves facts and qualifies historical comparison`, async ({ page }) => {
  await load(page, 'day', variant)
  await legible(page)
  const actual = page.locator('.collapsed-actual-marker')
  await expect(actual).toHaveAttribute('data-actual-date', variant === 'calendar' ? '2026-11-11' : variant === 'sunday' ? '2026-11-08' : '2026-11-07')
  await expect(actual.locator('.collapsed-actual-comparison')).toHaveText(variant === 'missing' ? 'Comparison unavailable' : variant === 'sunday' ? '+2 calendar days late' : '+5 calendar days late')
  if (variant === 'missing') await expect(page.locator('.historical-overrun')).toHaveCount(0)
  await expect(page.locator('.actual-release-bound')).toHaveAttribute('data-release-date', variant === 'calendar' ? '2026-11-12' : '2026-11-09')
})
test('all overlay combinations keep the collapsed label readable and JSON source unchanged', async ({ page }) => {
  const file = await load(page)
  for (let mask = 0; mask < 8; mask++) {
    await page.getByLabel('Show Baseline', { exact: true }).setChecked(!!(mask & 1))
    await page.getByLabel('Show Forecast', { exact: true }).setChecked(!!(mask & 2))
    await page.getByLabel('Highlight Critical Path', { exact: true }).setChecked(!!(mask & 4))
    await legible(page)
  }
  await page.getByRole('tab', { name: 'Files', exact: true }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  const actual = JSON.parse(await readFile((await (await download).path())!, 'utf8'))
  expect(actual).toEqual({ ...file, savedAt: actual.savedAt })
})
