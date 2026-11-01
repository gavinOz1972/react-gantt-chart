import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import type { ProjectFile } from '../src/persistence/projectFile'
import { workBaseline, workData, workRecords, workTimestamp } from '../src/test/workFixture'
import { LOCAL_PROJECTS_KEY } from '../src/persistence/localProjects'

const settings = { schemaVersion: 1, enabled: true, classHoursPerStudent: 4, homeworkHoursPerStudent: 2, teamSize: 4, asOfDate: '2026-11-02' }
const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click()
const summary = (page: Page) => page.getByRole('region', { name: 'Project health', exact: true })
async function downloaded(page: Page, button: string | RegExp): Promise<ProjectFile> {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: button, exact: typeof button === 'string' }).click()
  const file = await pending
  return JSON.parse(await readFile((await file.path())!, 'utf8'))
}
async function stored(page: Page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).projects[0].plan as ProjectFile, LOCAL_PROJECTS_KEY) }

for (const version of [1, 2, 3, 4, 5]) test(`QA01 capacity change then header Save from Project Settings, stored format ${version}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const plan = { ...workData, format: 'react-gantt-chart', schemaVersion: version, createdBy: 'React Gantt Chart', savedAt: workTimestamp,
    ...(version >= 2 ? { baseline: workBaseline() } : {}), ...(version >= 3 ? { workTracking: { ...workRecords(), remainingHours: { T2: 5, T9: 2 } } } : {}), ...(version === 5 ? { forecastSettings: settings } : {}) }
  await page.goto('/')
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: LOCAL_PROJECTS_KEY, value: JSON.stringify({ schemaVersion: 1, projects: [{ name: 'QA01 plan', savedAt: workTimestamp, plan }] }) })
  await page.reload()
  await page.getByLabel('Saved plans', { exact: true }).selectOption('QA01 plan')
  await page.getByRole('button', { name: 'Load project', exact: true }).click()
  if (version < 3) for (const [id, hours] of [['T2', '5'], ['T9', '2']]) {
    await page.getByRole('button', { name: `Edit ${id} remaining effort`, exact: true }).click()
    await page.getByLabel(`${id} remaining effort`, { exact: true }).fill(hours)
    await page.getByLabel(`${id} remaining effort`, { exact: true }).press('Enter')
  }
  await tab(page, 'Project Settings')
  await page.getByRole('checkbox', { name: 'Enable effort-based forecasting', exact: true }).check()
  await page.getByLabel('Class hours per student per week', { exact: true }).fill('4')
  await page.getByLabel('Homework hours per student per week', { exact: true }).fill('2')
  await page.getByLabel('Team size', { exact: true }).fill('4')
  await page.getByLabel('Forecast As-of date', { exact: true }).fill('2026-11-02')
  await expect(page.locator('.forecast-summary')).toContainText('24 person-hours')
  await expect(page.locator('.forecast-summary')).toContainText('2026-11-04')
  await page.getByLabel('Homework hours per student per week', { exact: true }).fill('5')
  const original = await stored(page)
  await expect(page.locator('.forecast-summary')).toContainText('36 person-hours')

  await page.evaluate(() => {
    const qa = { ticks: 0, writes: 0, writeMs: 0, stringifies: 0, stringifyMs: 0, mutations: 0, modalStack: '', longTasks: [] as number[] }
    Object.assign(window, { __saveQa: qa })
    setInterval(() => { qa.ticks++ }, 20)
    const write = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) { const start = performance.now(); try { qa.writes++; return write.call(this, key, value) } finally { qa.writeMs += performance.now() - start } }
    const stringify = JSON.stringify
    JSON.stringify = function (...args: Parameters<typeof JSON.stringify>) { const start = performance.now(); try { qa.stringifies++; return stringify(...args) } finally { qa.stringifyMs += performance.now() - start } }
    const modal = HTMLDialogElement.prototype.showModal
    HTMLDialogElement.prototype.showModal = function () { qa.modalStack = new Error('showModal caller').stack ?? ''; return modal.call(this) }
    new MutationObserver(records => { qa.mutations += records.length }).observe(document.getElementById('root')!, { subtree: true, childList: true, attributes: true, characterData: true })
    new PerformanceObserver(list => { qa.longTasks.push(...list.getEntries().map(entry => entry.duration)) }).observe({ type: 'longtask' })
  })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')
  const before = await cdp.send('Performance.getMetrics')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __saveQa: { ticks: number } }).__saveQa.ticks)).toBeGreaterThan(5)
  const diagnostic = await page.evaluate(() => ({
    ...(window as unknown as { __saveQa: object }).__saveQa,
    activeTab: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent,
    dialogs: [...document.querySelectorAll('dialog')].map(dialog => ({ open: dialog.open, modal: dialog.matches(':modal'), hiddenAncestor: dialog.closest('[hidden]')?.id ?? null,
      rect: dialog.getBoundingClientRect().toJSON(), visibility: getComputedStyle(dialog).visibility, display: getComputedStyle(dialog).display, text: dialog.textContent })),
  }))
  const after = await cdp.send('Performance.getMetrics')
  await info.attach('save-diagnostics.json', { contentType: 'application/json', body: JSON.stringify({ version, errors, diagnostic, before, after }, null, 2) })
  if (version < 5) {
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal).toContainText(`from format ${version} to format 5`)
    expect(diagnostic.dialogs[0]).toMatchObject({ open: true, modal: true, hiddenAncestor: null })
    expect(diagnostic.dialogs[0].rect.width).toBeGreaterThan(0)
    expect(await stored(page)).toEqual(original)
    expect(await downloaded(page, /^Export saved .* backup$/)).toEqual(original)
    await page.keyboard.press('Escape')
    await expect(modal).toHaveCount(0)
    expect(await stored(page)).toEqual(original)
    await expect(page.getByLabel('Homework hours per student per week', { exact: true })).toHaveValue('5')
    // Repeat the affected header-save path from Workspace as well as Settings.
    if (version === 4) await tab(page, 'Workspace')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(modal).toBeVisible()
    await page.getByRole('button', { name: 'Overwrite saved plan', exact: true }).click({ timeout: 3000 })
  }
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  const saved = await stored(page)
  expect(saved.schemaVersion).toBe(5)
  expect(saved.forecastSettings).toEqual({ ...settings, homeworkHoursPerStudent: 5 })
  expect(saved.baseline).toEqual(plan.baseline)
  expect(saved.tasks).toEqual(plan.tasks)
  expect(saved.workTracking!.entries).toEqual(plan.workTracking?.entries ?? [])
  expect(saved.workTracking!.remainingHours).toEqual({ T2: 5, T9: 2 })
  await tab(page, 'Workspace')
  await expect(summary(page)).toContainText('36 person-hours')
  await expect(summary(page)).toContainText('2026-11-03')
  await page.reload()
  await page.getByLabel('Saved plans', { exact: true }).selectOption('QA01 plan')
  await page.getByRole('button', { name: 'Load project', exact: true }).click()
  await expect(summary(page)).toContainText('36 person-hours')
  await tab(page, 'Files')
  const file = await downloaded(page, 'Export JSON')
  expect(file.forecastSettings).toEqual(saved.forecastSettings)
  expect(file.baseline).toEqual(saved.baseline)
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'qa01.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) })
  await expect(summary(page)).toContainText('36 person-hours')
  await expect(summary(page)).toContainText('2026-11-03')
  await tab(page, 'Project Settings')
  await expect(page.getByLabel('Homework hours per student per week', { exact: true })).toHaveValue('5')
  expect(errors).toEqual([])
})
