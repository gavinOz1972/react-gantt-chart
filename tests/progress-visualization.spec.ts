import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createProjectFile } from '../src/persistence/projectFile'
import type { ProjectData, ProjectFile } from '../src/persistence/projectFile'
import { workBaseline, workData, workRecords, workTimestamp } from '../src/test/workFixture'
import { establishBaseline } from '../src/baseline/baseline'
import { emptyProgress, transitionTask } from '../src/progress/taskProgress'
import { openPlan } from './wp5-2-fixtures'

const settings = { schemaVersion: 1 as const, enabled: true, classHoursPerStudent: 7, homeworkHoursPerStudent: 0, teamSize: 1, asOfDate: '2026-11-02' }
function plan(patch: Partial<ProjectData> = {}): ProjectFile {
  const result = createProjectFile({ ...workData, tasks: workData.tasks.map(task => task.taskId === 'T2' ? { ...task, durationHours: 5 } : task), baseline: workBaseline(),
    workTracking: { ...workRecords(), remainingHours: { T2: 25, T9: 10 } }, forecastSettings: settings, ...patch }, workTimestamp)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}
const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click()
const chart = (page: Page) => page.getByRole('region', { name: 'Gantt chart', exact: true })
const health = (page: Page) => page.getByRole('region', { name: 'Project health', exact: true })
const selected = (page: Page) => page.getByRole('region', { name: 'Selected chart task', exact: true })
const overlay = (page: Page, kind: string, id = 'T2') => page.locator(`[data-overlay="${kind}"][data-task-id="${id}"]`)
const scroller = (page: Page) => page.getByRole('region', { name: 'Scrollable Gantt timeline', exact: true })
async function bars(page: Page) { return page.locator('.gantt-bar').evaluateAll(elements => elements.map(element => [element.getAttribute('data-task-id'), element.getAttribute('data-start'), element.getAttribute('data-end')])) }
async function remaining(page: Page, id: string, hours: string, source = 'chart') {
  const label = `${source === 'chart' ? 'Selected ' : ''}${id} remaining effort`
  await page.getByRole('button', { name: `Edit ${label}`, exact: true }).click()
  await page.getByLabel(label, { exact: true }).fill(hours); await page.getByLabel(label, { exact: true }).press('Enter')
}
async function exportFile(page: Page): Promise<ProjectFile> {
  await tab(page, 'Files'); const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  const file = await pending; return JSON.parse(await readFile((await file.path())!, 'utf8'))
}

test('A01/A03 defaults are off, chart stays first; missing baseline is explained and details expand accessibly', async ({ page }) => {
  await openPlan(page, plan({ baseline: undefined }))
  await expect(page.getByRole('checkbox', { name: 'Show Baseline', exact: true })).toBeDisabled()
  await expect(chart(page)).toContainText('Establish a baseline')
  await expect(page.getByRole('checkbox', { name: 'Show Forecast', exact: true })).not.toBeChecked()
  await expect(page.locator('[data-overlay]')).toHaveCount(0)
  const details = health(page).locator('details')
  await expect(details).not.toHaveAttribute('open', '')
  await details.locator('summary').focus(); await page.keyboard.press('Enter'); await expect(details).toHaveAttribute('open', '')
  const positions = await page.evaluate(() => [document.querySelector('.gantt-panel')!.getBoundingClientRect().top, document.querySelector('.forecast-summary')!.getBoundingClientRect().top])
  expect(positions[0]).toBeLessThan(positions[1])
})

for (const mode of ['Expanded', 'Compressed']) for (const scale of ['hour', 'day', 'week']) test(`A02/A04/A06/A07 ${mode} ${scale}: guides preserve committed geometry, identity, scroll and selection`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await openPlan(page, plan())
  await page.getByRole('button', { name: mode, exact: true }).click()
  await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption(scale)
  await page.locator('.gantt-bar[data-task-id="T2"]').click()
  const before = await bars(page)
  await scroller(page).evaluate(element => { element.scrollLeft = 50 })
  const left = await scroller(page).evaluate(element => element.scrollLeft)
  await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).check()
  expect(await scroller(page).evaluate(element => element.scrollLeft)).toBe(left)
  expect(await bars(page)).toEqual(before)
  await expect(overlay(page, 'baseline')).toHaveAttribute('data-finish-date', '2026-11-06')
  expect(Number(await overlay(page, 'baseline').getAttribute('data-end-unit'))).toBeCloseTo(mode === 'Expanded' ? 4 + 2 / 3 : 8)
  await expect(overlay(page, 'baseline', 'T9')).toHaveAttribute('data-finish-date', '2026-11-09')
  await expect(overlay(page, 'forecast')).toHaveAttribute('data-finish-date', '2026-11-26')
  expect(Number(await overlay(page, 'forecast').getAttribute('data-end-unit'))).toBe(mode === 'Expanded' ? 25 : 33)
  await expect(selected(page)).toContainText('T2')
  await expect(chart(page).getByLabel('Overlay legend', { exact: true })).toContainText('originally approved')
  await expect(page.getByRole('button', { name: 'Inspect T2 Research', exact: true })).toHaveAttribute('aria-description', /Baseline:.*2026-11-06.*committed finish 2026-11-05.*forecast finish 2026-11-26/)
  await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).uncheck()
  await expect(overlay(page, 'baseline')).toHaveCount(0); await expect(overlay(page, 'forecast')).toHaveCount(1)
  await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).uncheck()
  expect(await bars(page)).toEqual(before)
})

test('A04/A05/A07 earlier forecasts, omitted dates and clipped ranges are explicit and live without moving bars', async ({ page }) => {
  await openPlan(page, plan())
  await page.locator('.gantt-bar[data-task-id="T2"]').click()
  const before = await bars(page)
  await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  await remaining(page, 'T2', '1')
  await expect(overlay(page, 'forecast')).toHaveAttribute('data-finish-date', '2026-11-02')
  await expect(overlay(page, 'forecast')).toHaveAttribute('data-end-unit', '1')
  await remaining(page, 'T2', '2')
  await page.getByRole('button', { name: 'Compressed', exact: true }).click()
  await expect(overlay(page, 'forecast')).toHaveAttribute('data-finish-date', '2026-11-03')
  await expect(overlay(page, 'forecast')).toHaveAttribute('data-omitted', 'true')
  await expect(overlay(page, 'forecast')).toHaveAttribute('aria-label', /nonworking date omitted.*collapsed calendar boundary/)
  await remaining(page, 'T2', '1000')
  await expect(overlay(page, 'forecast')).toHaveAttribute('data-clipped', 'after-range')
  await expect(overlay(page, 'forecast')).toHaveAttribute('aria-label', /after range: clipped edge/)
  await remaining(page, 'T2', '25')
  await tab(page, 'Project Settings'); await page.getByLabel('Team size', { exact: true }).fill('10'); await tab(page, 'Workspace')
  await expect(overlay(page, 'forecast')).toHaveAttribute('data-finish-date', '2026-11-04')
  await page.getByRole('button', { name: 'Expanded', exact: true }).click()
  expect(await bars(page)).toEqual(before)
})

test('A08/A09/A10/A11 blocking and unknown effort suppress green health and fabricated endpoints; unblocking restores them', async ({ page }) => {
  await openPlan(page, plan()); await page.locator('.gantt-bar[data-task-id="T2"]').click()
  await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  const status = page.getByRole('combobox', { name: 'T2 status in chart', exact: true })
  await status.selectOption('Blocked'); await page.getByLabel('Blocked reason', { exact: true }).fill('Awaiting data access')
  await page.getByRole('button', { name: 'Set Blocked', exact: true }).click()
  await expect(overlay(page, 'forecast')).toHaveCount(0); await expect(overlay(page, 'forecast', 'T9')).toHaveCount(0)
  await expect(health(page).getByRole('status')).toContainText('Uncertain')
  await expect(health(page)).toContainText('Indeterminate'); await expect(health(page)).toContainText('Currently Blocked1')
  await expect(page.getByRole('button', { name: 'Inspect T2 Research', exact: true })).toHaveAttribute('aria-description', /Schedule Uncertain; work status Blocked/)
  await status.selectOption('In Progress'); await expect(overlay(page, 'forecast')).toHaveCount(1)
  await expect(health(page).getByRole('status')).toContainText('On Track')
  await remaining(page, 'T9', '', 'table')
  await expect(health(page).getByRole('status')).toContainText('Uncertain'); await expect(health(page)).toContainText('Forecast: Partial')
  await expect(health(page)).toContainText('(partial)'); await expect(overlay(page, 'forecast', 'T9')).toHaveCount(0)
  await remaining(page, 'T9', '10', 'table')
  await tab(page, 'Project Settings'); await page.getByLabel('Forecast As-of date', { exact: true }).fill('2026-11-10'); await tab(page, 'Workspace')
  await expect(selected(page).locator('.task-health').first()).toContainText('Late')
  await expect(health(page)).toContainText('Currently Late2')
})

test('A11/A12 historical completion stays historical, counts exclude completed tasks and health uses completion evidence', async ({ page }) => {
  let progress = emptyProgress()
  for (const id of ['T2', 'T9']) {
    const result = transitionTask(progress, id, { target: 'Complete', eventId: `E-${id}`, date: '2026-11-10', recordedAt: workTimestamp, completionAcknowledged: true, noCriteriaAcknowledged: true, committedFinishDateAtCompletion: '2026-11-06' }, ['T2', 'T9'])
    if (!result.ok) throw new Error('Invalid completion fixture')
    progress = result.value
  }
  await openPlan(page, plan({ taskProgress: progress }))
  await page.locator('.gantt-bar[data-task-id="T2"]').click()
  await expect(selected(page).locator('.task-health').first()).toContainText('Completed Late')
  await expect(health(page).getByRole('status')).toContainText('Completed:')
  await expect(health(page)).toContainText('Recorded completion2026-11-10')
  await expect(health(page)).toContainText('Currently Late0')
  await expect(page.getByRole('region', { name: 'Status & completion', exact: true }).locator('.task-health')).toContainText('Completed Late')
})

test('A02/A07 date ranges clip honestly and deleting a current row preserves the original baseline entry', async ({ page }) => {
  const input = plan({ project: { ...workData.project, projectStartDate: '2026-11-12' }, workTracking: { ...workRecords(), remainingHours: { T2: 1, T9: 1 } } })
  await openPlan(page, input)
  await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).check(); await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  await expect(overlay(page, 'baseline')).toHaveAttribute('data-clipped', 'before-range')
  await expect(overlay(page, 'forecast')).toHaveAttribute('data-clipped', 'before-range')
  await page.getByRole('button', { name: 'Delete T9', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete task', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Inspect T9 Publish', exact: true })).toHaveCount(0)
  await expect(overlay(page, 'baseline', 'T9')).toHaveCount(0)
  await tab(page, 'Project Settings'); await page.getByRole('button', { name: 'View Baseline', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Read-only baseline tasks', exact: true })).toContainText('T9')
  expect((await exportFile(page)).baseline).toEqual(input.baseline)
})

test('A02/A13/A15 ID associations survive sort, duplicate, Close and explicit save/JSON round trips; toggles reset on load', async ({ page }) => {
  const input = plan(); await openPlan(page, input)
  await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).check(); await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  await page.getByRole('combobox', { name: 'Task order', exact: true }).selectOption('name')
  await expect(overlay(page, 'baseline')).toHaveAttribute('data-finish-date', '2026-11-06')
  await page.getByRole('combobox', { name: 'Task order', exact: true }).selectOption('manual')
  await page.getByRole('button', { name: 'Move T2 up', exact: true }).click()
  await expect(overlay(page, 'baseline')).toHaveAttribute('data-finish-date', '2026-11-06')
  await page.getByRole('checkbox', { name: 'Highlight Critical Path', exact: true }).check()
  await page.locator('.gantt-bar[data-task-id="T2"]').click()
  await selected(page).getByRole('button', { name: 'Close selected task details', exact: true }).click()
  await expect(selected(page)).toHaveCount(0); await expect(overlay(page, 'baseline')).toHaveCount(1)
  const before = await exportFile(page)
  expect(before.baseline).toEqual(input.baseline); expect(before.tasks).toEqual(input.tasks); expect(before.workTracking).toEqual(input.workTracking); expect(before.forecastSettings).toEqual(input.forecastSettings)
  expect(before).not.toHaveProperty('showForecast')
  await page.getByLabel('Saved plan name', { exact: true }).fill('Progress overlays'); await page.getByRole('button', { name: 'Save As', exact: true }).click()
  await page.reload(); await page.getByLabel('Saved plans', { exact: true }).selectOption('Progress overlays'); await page.getByRole('button', { name: 'Load project', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Show Baseline', exact: true })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Show Forecast', exact: true })).not.toBeChecked()
  await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).check(); await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  await tab(page, 'Files'); await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'overlays.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(before)) })
  await expect(page.getByRole('checkbox', { name: 'Show Forecast', exact: true })).not.toBeChecked()
  await page.getByRole('button', { name: 'Duplicate T2', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).check()
  await expect(overlay(page, 'baseline', 'T20')).toHaveCount(0)
  await expect(selected(page)).toContainText('New since baseline')
  await expect(page.getByRole('button', { name: /^Inspect T20 / })).toHaveAttribute('aria-description', /work status Not Started/)
  await expect(page.getByRole('button', { name: /^Inspect T20 / })).not.toHaveAttribute('aria-description', /Schedule Uncertain|forecast finish/)
})

test('A07/A14 long labels and 25 virtual rows stay scrollable and keyboard accessible at desktop/narrow widths', async ({ page }) => {
  const tasks = Array.from({ length: 25 }, (_, index) => ({ taskId: `T${index + 1}`, name: `Work package ${index + 1}: a very long task name with review, implementation and verification details`, description: '', durationHours: 3, predecessorTaskIds: index ? [`T${index}`] : [], independentStartMode: 'DEFAULT' as const }))
  const data = { ...workData, project: { ...workData.project, targetEndDate: '2027-02-28' }, tasks, nextTaskNumber: 26, manualOrder: tasks.map(task => task.taskId) }
  const baseline = establishBaseline(data, 'BL-LONG', workTimestamp)
  if (!baseline.ok) throw new Error('Invalid long fixture')
  const input = plan({ ...data, baseline: baseline.value, workTracking: { schemaVersion: 1, entries: [], remainingHours: Object.fromEntries(tasks.map(task => [task.taskId, 3])) } })
  await page.setViewportSize({ width: 1440, height: 1100 }); await openPlan(page, input)
  for (const width of [1440, 600]) {
    await page.setViewportSize({ width, height: 1100 })
    const baselineToggle = page.getByRole('checkbox', { name: 'Show Baseline', exact: true })
    await baselineToggle.focus(); if (!(await baselineToggle.isChecked())) await page.keyboard.press('Space')
    await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
    await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption('week')
    await scroller(page).evaluate(element => { element.scrollTop = 900; element.scrollLeft = 150 })
    await expect(page.getByRole('button', { name: /^Inspect T1 / })).toHaveCount(0)
    await page.getByRole('button', { name: 'Select T20 in chart', exact: true }).click()
    await page.getByRole('button', { name: 'Go to selected task', exact: true }).click()
    await expect(page.locator('.gantt-row-label').first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await page.locator('.gantt-row-label').count()).toBeLessThan(20)
    await page.screenshot({ path: `docs/review/wp6-5-long-${width}.png`, fullPage: true })
    await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).uncheck()
    await expect(chart(page).locator('.gantt-row-label .health-badge')).toHaveCount(0)
    await expect(page.locator('[data-overlay="forecast"]')).toHaveCount(0)
  }
})

test('A04/A06 owner evidence of combined guides and compact project health', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 }); await openPlan(page, plan())
  await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption('week')
  await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).check(); await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  await page.locator('.gantt-bar[data-task-id="T2"]').click()
  await page.screenshot({ path: 'docs/review/wp6-5-combined-expanded.png', fullPage: true })
  await page.getByRole('button', { name: 'Compressed', exact: true }).click()
  await page.screenshot({ path: 'docs/review/wp6-5-combined-compressed.png', fullPage: true })
})
