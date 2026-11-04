import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const fixture = {
  format: 'react-gantt-chart', schemaVersion: 1, createdBy: 'React Gantt Chart', savedAt: '2026-10-31T12:00:00.000Z',
  project: { projectId: 'WP5-1-DEMO', name: 'Workspace usability review', projectStartDate: '2026-11-02', targetEndDate: '2026-12-18', workingWeekdays: [1, 4, 5], workingHoursPerDay: 3 },
  tasks: [
    { taskId: 'T1', name: 'Research', description: 'Read sources\nRecord questions', durationHours: 5, predecessorTaskIds: [], independentStartMode: 'DEFAULT' },
    { taskId: 'T2', name: 'Implementation', description: '', durationHours: 2, predecessorTaskIds: [], independentStartMode: 'DEFAULT' },
    { taskId: 'T3', name: 'Testing', description: '', durationHours: 1, predecessorTaskIds: ['T2'], independentStartMode: 'DEFAULT' },
  ], nextTaskNumber: 4,
}
const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click()
const trigger = (page: Page, id: string) => page.getByRole('button', { name: `${id} predecessors`, exact: true })
const choice = (page: Page, task: string, pred: string) => page.getByRole('checkbox', { name: new RegExp(`^${task} predecessor ${pred} `) })
const popup = (page: Page) => page.getByRole('group', { name: /predecessor selection$/ })
const bar = (page: Page, id: string) => page.getByRole('button', { name: new RegExp(`^${id} .*working hours; starts`) })
const details = (page: Page) => page.getByRole('region', { name: 'Task details', exact: true })
async function open(page: Page) {
  await page.goto('/')
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'wp5-1.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) })
  await expect(page.getByRole('tab', { name: 'Workspace', exact: true })).toHaveAttribute('aria-selected', 'true')
}
const top = (locator: ReturnType<Page['locator']>) => locator.evaluate(element => element.getBoundingClientRect().top + window.scrollY)

test('A01–A03 hierarchy, shared details and full editor remain below timeline; switching preserves zoom/mode/selection', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await open(page)
  const overview = page.getByRole('region', { name: 'Project overview', exact: true })
  const gantt = page.getByRole('region', { name: 'Gantt chart', exact: true })
  const tasks = page.getByRole('region', { name: 'Tasks & schedule', exact: true })
  expect(await top(overview)).toBeLessThan(await top(gantt))
  expect(await top(gantt)).toBeLessThan(await top(tasks))
  expect(await top(tasks)).toBeLessThan(await top(details(page)))
  await expect(gantt.getByText('01 / Timeline', { exact: true })).toBeVisible()
  await expect(tasks.getByText('02 / Tasks & Schedule', { exact: true })).toBeVisible()
  await expect(details(page).getByText('03 / Task Details', { exact: true })).toBeVisible()
  // Automatic PA summary adds height. Establish the pre-click position with
  // the actual target in view, excluding Playwright's actionability scroll.
  await bar(page, 'T1').scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  await bar(page, 'T1').click()
  expect(await page.evaluate(() => scrollY)).toBe(before)
  await expect(details(page).getByLabel('Selected task details', { exact: true })).toContainText('T1 — Research')
  await expect(gantt.getByLabel('Selected task details', { exact: true })).toHaveCount(0)
  await page.getByRole('row', { name: 'T2 Implementation', exact: true }).getByText('after hour 2 that day', { exact: true }).click()
  await expect(details(page).getByLabel('Selected task details', { exact: true })).toContainText('T2 — Implementation')
  await expect(details(page)).toContainText('Total slack')
  await page.getByRole('button', { name: 'Compressed', exact: true }).click()
  await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption('day')
  await page.getByRole('button', { name: 'Edit T2', exact: true }).click()
  expect(await top(page.getByRole('region', { name: 'Edit task T2', exact: true }))).toBeGreaterThan(await top(gantt))
  await tab(page, 'Files'); await tab(page, 'Workspace')
  await expect(page.getByLabel(/^Task name/)).toHaveValue('Implementation')
  await expect(page.getByRole('button', { name: 'Compressed', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('combobox', { name: 'Scale', exact: true })).toHaveValue('day')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Network / Critical Path', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Network / Critical Path', exact: true }).getByText('01 / Timeline', { exact: true })).toBeVisible()
  await expect(details(page).getByLabel('Selected task details', { exact: true })).toContainText('T2 — Implementation')
})

test('A04/A05 staged multi-select commits on Done or real keyboard Space/Enter, with focus returned to its trigger', async ({ page }) => {
  await open(page)
  const before = await bar(page, 'T2').getAttribute('aria-label')
  await trigger(page, 'T2').click(); await choice(page, 'T2', 'T1').check()
  await expect(bar(page, 'T2')).toHaveAttribute('aria-label', before!)
  await expect(page.getByRole('img', { name: 'Dependency T1 to T2', exact: true })).toHaveCount(0)
  await popup(page).getByRole('button', { name: 'Done', exact: true }).click()
  await expect(popup(page)).toHaveCount(0); await expect(trigger(page, 'T2')).toBeFocused()
  await expect(bar(page, 'T2')).not.toHaveAttribute('aria-label', before!)
  await expect(page.getByRole('img', { name: 'Dependency T1 to T2', exact: true })).toHaveCount(1)
  await trigger(page, 'T3').focus(); await page.keyboard.press('Enter')
  await choice(page, 'T3', 'T1').focus(); await page.keyboard.press('Space')
  await expect(choice(page, 'T3', 'T1')).toBeChecked()
  await expect(page.getByRole('img', { name: 'Dependency T1 to T3', exact: true })).toHaveCount(0)
  await page.keyboard.press('Enter')
  await expect(popup(page)).toHaveCount(0); await expect(trigger(page, 'T3')).toBeFocused()
  await expect(page.getByRole('img', { name: 'Dependency T1 to T3', exact: true })).toHaveCount(1)
})

test('A06/A09 outside pointer commits without activating Delete or another task action', async ({ page }) => {
  // Keep the disabled Delete target outside the portal and in view. A forced
  // click skips hit testing, so a scrolled/covered coordinate can hit the picker.
  await page.setViewportSize({ width: 2000, height: 1800 })
  await open(page)
  await trigger(page, 'T2').click(); await choice(page, 'T2', 'T1').check()
  await page.getByRole('button', { name: 'Delete T3', exact: true }).click({ force: true })
  await expect(popup(page)).toHaveCount(0); await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('[data-task-row]')).toHaveCount(3)
  await expect(page.getByRole('img', { name: 'Dependency T1 to T2', exact: true })).toHaveCount(1)
  await expect(trigger(page, 'T2')).toBeFocused()
  await trigger(page, 'T2').click(); await choice(page, 'T2', 'T1').uncheck()
  await page.getByRole('heading', { name: 'Tasks & schedule', exact: true }).click()
  await expect(popup(page)).toHaveCount(0)
  await expect(page.getByRole('img', { name: 'Dependency T1 to T2', exact: true })).toHaveCount(0)
})

test('A07/A08 Escape/Cancel preserve saved status; invalid cyclic drafts remain open with the valid graph intact', async ({ page }) => {
  await open(page); await tab(page, 'Files')
  await page.getByLabel('Saved plan name', { exact: true }).fill('WP5.1 clean baseline')
  await page.getByRole('button', { name: 'Save As', exact: true }).click(); await tab(page, 'Workspace')
  const before = await bar(page, 'T2').getAttribute('aria-label')
  await trigger(page, 'T2').click(); await choice(page, 'T2', 'T1').check(); await page.keyboard.press('Escape')
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  await expect(bar(page, 'T2')).toHaveAttribute('aria-label', before!)
  await trigger(page, 'T2').click(); await choice(page, 'T2', 'T3').check()
  await popup(page).getByRole('button', { name: 'Done', exact: true }).click()
  await expect(popup(page).getByRole('alert')).toContainText(/cycle/i)
  await expect(popup(page)).toBeVisible(); await expect(bar(page, 'T2')).toHaveAttribute('aria-label', before!)
  await page.getByRole('button', { name: 'Delete T1', exact: true }).click({ force: true })
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(popup(page)).toBeVisible()
  await popup(page).getByRole('button', { name: 'Cancel', exact: true }).focus(); await page.keyboard.press('Enter')
  await expect(popup(page)).toHaveCount(0); await expect(trigger(page, 'T2')).toBeFocused()
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  await expect(bar(page, 'T2')).toHaveAttribute('aria-label', before!)
})

test('full task form uses the same staged picker; Enter commits selection without submitting the form', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Edit T2', exact: true }).click()
  const editor = page.getByRole('region', { name: 'Edit task T2', exact: true })
  const before = await bar(page, 'T2').getAttribute('aria-label')
  await editor.getByRole('button', { name: 'T2 predecessors', exact: true }).click()
  await choice(page, 'T2', 'T1').check(); await expect(bar(page, 'T2')).toHaveAttribute('aria-label', before!)
  await page.keyboard.press('Enter')
  await expect(editor).toBeVisible(); await expect(bar(page, 'T2')).not.toHaveAttribute('aria-label', before!)
  await expect(editor.getByRole('button', { name: 'T2 predecessors', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Save task', exact: true }).click()
  await expect(editor).toHaveCount(0)
})

test('desktop and narrow screenshots demonstrate chart→tasks→details, editor placement and the unclipped picker', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await open(page)
  await page.getByRole('checkbox', { name: 'Highlight Critical Path', exact: true }).check()
  await bar(page, 'T1').click()
  await page.screenshot({ path: 'docs/review/wp5-1-workspace.png', fullPage: true })
  await page.getByRole('button', { name: 'Edit T2', exact: true }).click()
  await page.screenshot({ path: 'docs/review/wp5-1-editor.png', fullPage: true })
  await page.getByRole('region', { name: 'Edit task T2', exact: true }).getByRole('button', { name: 'T2 predecessors', exact: true }).click()
  await choice(page, 'T2', 'T1').check()
  await page.screenshot({ path: 'docs/review/wp5-1-dependencies.png', fullPage: true })
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.setViewportSize({ width: 780, height: 1000 })
  await page.getByRole('button', { name: 'Compressed', exact: true }).click()
  await trigger(page, 'T2').click(); await choice(page, 'T2', 'T1').check()
  const bounds = (await popup(page).boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(780)
  expect(bounds.y).toBeGreaterThanOrEqual(0); expect(bounds.y + bounds.height).toBeLessThanOrEqual(1000)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'docs/review/wp5-1-narrow-picker.png', fullPage: true })
  await page.keyboard.press('Enter')
  await page.screenshot({ path: 'docs/review/wp5-1-narrow-workspace.png', fullPage: true })
})
