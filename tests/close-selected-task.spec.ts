import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { longPlan, openPlan } from './wp5-2-fixtures'

const summary = (page: Page) => page.getByRole('region', { name: 'Selected chart task', exact: true })
const bar = (page: Page, id = 'T1') => page.locator(`.gantt-bar[data-task-id="${id}"]`)
async function exported(page: Page) {
  await page.getByRole('tab', { name: 'Files', exact: true }).click()
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  const file = await pending
  return JSON.parse(await readFile((await file.path())!, 'utf8'))
}
test('Close only dismisses selection, keeps saved fields/scroll/scale/mode, and the same or another bar reopens details', async ({ page }) => {
  await openPlan(page, longPlan)
  await page.getByRole('button', { name: 'Compressed', exact: true }).click()
  await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption('day')
  await bar(page).click()
  await page.getByRole('combobox', { name: 'T1 status in chart', exact: true }).selectOption('In Progress')
  await page.getByRole('button', { name: 'Edit Selected T1 remaining effort', exact: true }).click()
  await page.getByLabel('Selected T1 remaining effort', { exact: true }).fill('5'); await page.getByLabel('Selected T1 remaining effort', { exact: true }).press('Enter')
  const before = await exported(page)
  await page.getByRole('tab', { name: 'Workspace', exact: true }).click()
  const scroll = page.getByRole('region', { name: 'Scrollable Gantt timeline', exact: true })
  await scroll.evaluate(element => { element.scrollLeft = 120 })
  const left = await scroll.evaluate(element => element.scrollLeft)
  await summary(page).getByRole('button', { name: 'Close selected task details', exact: true }).click()
  await expect(summary(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Go to start', exact: true })).toBeFocused()
  expect(await scroll.evaluate(element => element.scrollLeft)).toBe(left)
  await expect(page.getByRole('button', { name: 'Compressed', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('combobox', { name: 'Scale', exact: true })).toHaveValue('day')
  await bar(page).click(); await expect(summary(page)).toContainText('Task 1')
  await bar(page, 'T2').click(); await expect(summary(page)).toContainText('Task 2')
  await summary(page).focus(); await page.keyboard.press('Escape')
  const after = await exported(page)
  expect({ ...after, savedAt: before.savedAt }).toEqual(before)
})
test('Escape cancels a nested quick edit and confirmation before it dismisses passive selection', async ({ page }) => {
  await openPlan(page, longPlan); await bar(page).click()
  await page.getByRole('button', { name: 'Edit Selected T1 remaining effort', exact: true }).click()
  await page.getByLabel('Selected T1 remaining effort', { exact: true }).fill('99')
  await expect(summary(page).getByRole('button', { name: 'Close selected task details', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape'); await expect(summary(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit Selected T1 remaining effort', exact: true })).toContainText('Unknown')
  await page.keyboard.press('Escape'); await expect(summary(page)).toHaveCount(0)
  await bar(page).click(); await page.getByRole('combobox', { name: 'T1 status in chart', exact: true }).selectOption('Complete')
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(summary(page)).toBeVisible()
})
test('closing a chart selection preserves an unrelated active table draft and its focus', async ({ page }) => {
  await openPlan(page, longPlan); await bar(page).click()
  await page.getByRole('button', { name: 'Edit T2 duration', exact: true }).click()
  const field = page.getByLabel('T2 duration', { exact: true }); await field.fill('0')
  await summary(page).getByRole('button', { name: 'Close selected task details', exact: true }).click()
  await expect(summary(page)).toHaveCount(0); await expect(field).toHaveValue('0'); await expect(field).toBeFocused()
  await field.press('Escape')
})
test('Close is visible and keyboard usable at narrow width in both Gantt modes', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 }); await openPlan(page, longPlan)
  for (const mode of ['Expanded', 'Compressed']) {
    await page.getByRole('button', { name: mode, exact: true }).click(); await bar(page).click()
    const close = summary(page).getByRole('button', { name: 'Close selected task details', exact: true })
    await close.focus(); await page.keyboard.press('Enter'); await expect(summary(page)).toHaveCount(0)
  }
})
