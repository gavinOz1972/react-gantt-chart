import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createProjectFile } from '../src/persistence/projectFile'
import type { ProjectData, ProjectFile } from '../src/persistence/projectFile'
import { emptyProgress, transitionTask } from '../src/progress/taskProgress'
import { workBaseline, workData, workRecords, workTimestamp } from '../src/test/workFixture'
import { openPlan } from './wp5-2-fixtures'

const settings = { schemaVersion: 1 as const, enabled: true, classHoursPerStudent: 28, homeworkHoursPerStudent: 0, teamSize: 1, asOfDate: '2026-11-02' }
function plan(patch: Partial<ProjectData> = {}) {
  const result = createProjectFile({ ...workData, tasks: workData.tasks.map(task => task.taskId === 'T2' ? { ...task, durationHours: 3 } : task), baseline: workBaseline(),
    forecastSettings: settings, workTracking: { ...workRecords(), remainingHours: { T2: 20, T9: 4 } }, ...patch }, workTimestamp)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}
const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click()
const chart = (page: Page) => page.getByRole('region', { name: 'Gantt chart', exact: true })
const selected = (page: Page) => page.getByRole('region', { name: 'Selected chart task', exact: true })
const projectHealth = (page: Page) => page.getByRole('region', { name: 'Project health', exact: true })
const row = (page: Page) => page.getByRole('button', { name: 'Inspect T2 Research', exact: true })
const toggle = (page: Page) => page.getByRole('checkbox', { name: 'Show Forecast', exact: true })
const marker = (page: Page) => page.locator('[data-overlay="forecast"][data-task-id="T2"]')
async function bars(page: Page) { return page.locator('.gantt-bar').evaluateAll(elements => elements.map(element => [element.getAttribute('data-task-id'), element.getAttribute('data-start'), element.getAttribute('data-end')])) }
async function exported(page: Page): Promise<ProjectFile> {
  await tab(page, 'Files'); const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  const file = await pending; return JSON.parse(await readFile((await file.path())!, 'utf8'))
}

for (const mode of ['Expanded', 'Compressed']) for (const scale of ['hour', 'day', 'week']) test(`A01/A03/A04/A08 ${mode} ${scale}: forecast checkbox governs row/tooltip/badge visibility without moving bars or baseline`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await openPlan(page, plan())
  await page.getByRole('button', { name: mode, exact: true }).click()
  await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption(scale)
  await page.locator('.gantt-bar[data-task-id="T2"]').click()
  const before = await bars(page), healthBefore = await projectHealth(page).textContent()
  await expect(toggle(page)).not.toBeChecked()
  await expect(page.locator('[data-overlay="forecast"]')).toHaveCount(0)
  await expect(chart(page).locator('.gantt-row-label .health-badge')).toHaveCount(0)
  await expect(row(page)).not.toHaveAttribute('aria-description', /Forecast Slip|Ahead of Plan|forecast finish/)
  expect((await page.locator('.gantt-bar title').allTextContents()).join(' ')).not.toContain('forecast finish')
  await expect(selected(page).locator('.health-badge')).toHaveCount(0)
  await expect(selected(page)).toContainText('Forecast finish2026-11-06')
  await expect(projectHealth(page).getByRole('status')).toContainText('On Track')

  await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).check()
  await expect(page.locator('[data-overlay="baseline"][data-task-id="T2"]')).toHaveAttribute('data-finish-date', '2026-11-06')
  const scroll = page.getByRole('region', { name: 'Scrollable Gantt timeline', exact: true })
  await scroll.evaluate(element => { element.scrollLeft = 20 })
  const left = await scroll.evaluate(element => element.scrollLeft)
  await toggle(page).focus(); await page.keyboard.press('Space')
  await expect(marker(page)).toHaveAttribute('data-finish-date', '2026-11-06')
  await expect(marker(page).locator('text')).toHaveText('FF')
  await expect(row(page).locator('.health-badge')).toHaveAttribute('aria-label', 'Forecast Slip')
  await expect(selected(page).locator('.task-health').first()).toContainText('Forecast Slip')
  await expect(row(page)).toHaveAttribute('aria-description', /Schedule Forecast Slip.*committed finish 2026-11-02.*forecast finish 2026-11-06/)
  await expect(projectHealth(page).getByRole('status')).toContainText('On Track')
  expect(await scroll.evaluate(element => element.scrollLeft)).toBe(left)
  if (mode === 'Expanded' && scale === 'day') await page.screenshot({ path: 'docs/review/wp6-5-1-forecast-on.png', fullPage: true })
  await toggle(page).uncheck()
  await expect(marker(page)).toHaveCount(0); await expect(row(page).locator('.health-badge')).toHaveCount(0)
  await expect(selected(page).locator('.health-badge')).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Show Baseline', exact: true })).toBeChecked()
  await expect(page.getByRole('img', { name: 'Dependency T2 to T9', exact: true })).toHaveCount(1)
  expect(await bars(page)).toEqual(before)
  expect(await projectHealth(page).textContent()).toBe(healthBefore)
  if (mode === 'Expanded' && scale === 'day') await page.screenshot({ path: 'docs/review/wp6-5-1-forecast-off.png', fullPage: true })
})

test('A02 actual Blocked and Late indications remain when the forecast annotations are hidden', async ({ page }) => {
  const progress = transitionTask(emptyProgress(), 'T2', { target: 'Blocked', eventId: 'E-BLOCK', date: '2026-11-06', recordedAt: workTimestamp, reason: 'Waiting for approval' }, ['T2', 'T9'])
  if (!progress.ok) throw new Error('Invalid blocked fixture')
  await openPlan(page, plan({ taskProgress: progress.value, forecastSettings: { ...settings, asOfDate: '2026-11-06' } }))
  await expect(toggle(page)).not.toBeChecked()
  await expect(row(page).locator('.health-badge')).toHaveAttribute('aria-label', 'Late')
  await expect(row(page).getByLabel('Work status: Blocked', { exact: true })).toBeVisible()
  await expect(row(page)).toHaveAttribute('aria-description', /Schedule Late; work status Blocked/)
  await expect(row(page)).not.toHaveAttribute('aria-description', /forecast finish|Uncertain/)
  await page.locator('.gantt-bar[data-task-id="T2"]').click()
  await expect(selected(page).locator('.task-health').first()).toContainText('LateBlocked')
  await expect(marker(page)).toHaveCount(0)
  await page.getByRole('checkbox', { name: 'Highlight Critical Path', exact: true }).check()
  await expect(page.locator('.gantt-bar[data-task-id="T2"]')).toHaveAttribute('data-critical', 'true')
  await tab(page, 'Project Settings'); await page.getByLabel('Team size', { exact: true }).fill('1.5'); await tab(page, 'Workspace')
  await expect(row(page).locator('.health-badge')).toHaveAttribute('aria-label', 'Late')
  await expect(row(page).getByLabel('Work status: Blocked', { exact: true })).toBeVisible()
})

test('A04 project At Risk remains reserved for delivery past target, independently of task Forecast Slip', async ({ page }) => {
  await openPlan(page, plan({ project: { ...workData.project, targetEndDate: '2026-11-05' } }))
  await expect(projectHealth(page).getByRole('status')).toContainText('At Risk')
  await expect(row(page).locator('.health-badge')).toHaveCount(0)
  await toggle(page).check()
  await expect(row(page).locator('.health-badge')).toHaveAttribute('aria-label', 'Forecast Slip')
  await expect(projectHealth(page).getByRole('status')).toContainText('At Risk')
})

for (const mode of ['Expanded', 'Compressed']) test(`A05/A06 ${mode}: FF left of the whole committed bar means an earlier finish, with dates and variance`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const tasks = workData.tasks.map(task => task.taskId === 'T2' ? { ...task, independentStartMode: 'MANUAL' as const, requestedStartDate: '2026-11-12', durationHours: 3 } : task)
  await openPlan(page, plan({ tasks, workTracking: { ...workRecords(), remainingHours: { T2: 4, T9: 4 } } }))
  await page.getByRole('button', { name: mode, exact: true }).click(); await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption('day')
  await page.locator('.gantt-bar[data-task-id="T2"]').click(); await toggle(page).check()
  await expect(row(page).locator('.health-badge')).toHaveAttribute('aria-label', 'Ahead of Plan')
  await expect(selected(page)).not.toContainText('Forecast Slip')
  await expect(marker(page)).toHaveAttribute('aria-label', /FF \(Forecast Finish\).*Committed finish 2026-11-12; Forecast finish 2026-11-02; variance: 10 calendar days earlier.*4 person-hours/)
  await marker(page).focus(); await expect(marker(page)).toBeFocused()
  expect(Number(await marker(page).getAttribute('data-endpoint-x'))).toBeLessThan(Number(await page.locator('.gantt-bar[data-task-id="T2"] .gantt-bar-outline').getAttribute('x')))
  await page.screenshot({ path: `docs/review/wp6-5-1-earlier-${mode.toLowerCase()}.png`, fullPage: true })
})

test('A06/A07 remaining person-hours are distinct from calendar-date variance, including omitted compressed dates', async ({ page }) => {
  await openPlan(page, plan({ workTracking: { ...workRecords(), remainingHours: { T2: 12, T9: 4 } } }))
  await page.getByRole('button', { name: 'Compressed', exact: true }).click(); await toggle(page).check()
  await expect(marker(page)).toHaveAttribute('data-finish-date', '2026-11-04')
  await expect(marker(page)).toHaveAttribute('data-omitted', 'true')
  await expect(marker(page)).toHaveAttribute('aria-label', /Committed finish 2026-11-02; Forecast finish 2026-11-04; variance: 2 calendar days later.*12 person-hours.*not effort hours or scheduled working slots/)
  await expect(chart(page)).toContainText('FF means Forecast Finish, even to the left of a committed bar')
  await expect(chart(page)).toContainText('project At Risk compares against the project target')
  await expect(marker(page)).not.toHaveAttribute('aria-label', /6 hours/)
})

test('A09 hiding annotations preserves Enable forecasting; disabled overlay is explained and restores independently of baseline', async ({ page }) => {
  await openPlan(page, plan()); await toggle(page).check(); await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).check()
  await toggle(page).uncheck(); await tab(page, 'Project Settings')
  await expect(page.getByRole('checkbox', { name: 'Enable effort-based forecasting', exact: true })).toBeChecked()
  await tab(page, 'Workspace'); await toggle(page).check()
  await tab(page, 'Project Settings'); await page.getByRole('checkbox', { name: 'Enable effort-based forecasting', exact: true }).uncheck(); await tab(page, 'Workspace')
  await expect(toggle(page)).toBeDisabled(); await expect(marker(page)).toHaveCount(0)
  await expect(page.locator('#forecast-visibility-help')).toContainText('Enable effort-based forecasting in Project Settings')
  await expect(page.getByRole('checkbox', { name: 'Show Baseline', exact: true })).toBeChecked()
  await expect(page.locator('[data-overlay="baseline"]')).toHaveCount(2)
  await expect(projectHealth(page)).toContainText('Forecast: Disabled')
  await tab(page, 'Project Settings'); await page.getByRole('checkbox', { name: 'Enable effort-based forecasting', exact: true }).check(); await tab(page, 'Workspace')
  await expect(toggle(page)).toBeEnabled(); await expect(toggle(page)).toBeChecked(); await expect(marker(page)).toHaveCount(1)
})

test('A01/A03/A10 toggle-only save/export data is unchanged, Network and quick-edit/Close stay usable', async ({ page }) => {
  await openPlan(page, plan()); const before = await exported(page)
  await page.getByLabel('Saved plan name', { exact: true }).fill('Visual clarity'); await page.getByRole('button', { name: 'Save As', exact: true }).click()
  await tab(page, 'Workspace'); await toggle(page).check(); await toggle(page).uncheck()
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  const after = await exported(page)
  expect({ ...after, savedAt: before.savedAt }).toEqual(before)
  await tab(page, 'Workspace'); await page.getByRole('button', { name: 'Network / Critical Path', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Network task T2 / })).toBeVisible()
  await page.getByRole('button', { name: 'Gantt', exact: true }).click(); await expect(toggle(page)).not.toBeChecked()
  await page.locator('.gantt-bar[data-task-id="T2"]').click()
  await page.getByRole('button', { name: 'Edit Selected T2 remaining effort', exact: true }).click()
  await page.getByLabel('Selected T2 remaining effort', { exact: true }).fill('12'); await page.getByLabel('Selected T2 remaining effort', { exact: true }).press('Enter')
  await expect(selected(page)).toContainText('Forecast finish2026-11-04')
  await expect(marker(page)).toHaveCount(0)
  await selected(page).getByRole('button', { name: 'Close selected task details', exact: true }).click(); await expect(selected(page)).toHaveCount(0)
})
