import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { selectedHistoryFile } from '../../../../src/test/selectedHistoryFixture'
import { openPlan } from '../../../../tests/wp5-2-fixtures'
const evidence = 'docs/qa/wp7-4-7a/evidence'
async function qa(page: Page, scenario: string, task = 'T1') {
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto('/docs/qa/wp7-4-7/qa/index.html')
  await page.getByLabel('Scenario', { exact: true }).selectOption(scenario)
  await page.getByLabel('Selected task', { exact: true }).selectOption(task)
  await page.getByRole('button', { name: 'Show history', exact: true }).click()
}
async function screenshot(page: Page, name: string) {
  await mkdir(evidence, { recursive: true }); await page.screenshot({ path: `${evidence}/after-${name}.png` })
}
test('student summary and keyboard disclosures preserve readable dates, local zone and exact evidence', async ({ page }) => {
  await qa(page, 'partial')
  const row = page.locator('[data-history-event="H-42"]')
  await expect(row.getByText('Changed from In Progress to Complete', { exact: true })).toBeVisible()
  await expect(row.locator('.history-effective-date')).toHaveText('Nov 5, 2026')
  await expect(page.locator('.history-provenance')).not.toHaveAttribute('open', '')
  await expect(row.getByText('Project guidance at completion: Original <guidance> & wording.')).toBeHidden()
  await screenshot(page, 'rows')
  await row.locator('summary').focus(); await page.keyboard.press('Enter')
  await expect(row.locator('summary')).toBeFocused()
  await expect(row.getByText('Project guidance at completion: Original <guidance> & wording.')).toBeVisible()
  await expect(row.getByText(/Recorded \(local time\):/)).toContainText('CST')
  await expect(row.getByText(/Historical completion details/)).toBeVisible()
  await expect(page.locator('img')).toHaveCount(0)
  await row.evaluate(e => e.scrollIntoView({ block: 'start' })); await screenshot(page, 'entry')
  await page.getByText('History details', { exact: true }).focus(); await page.keyboard.press('Enter')
  const metadata = page.locator('[data-history-metadata="H-42"]')
  await expect(metadata).toBeVisible(); await expect(metadata).toContainText('2026-11-09T15:00:00.000Z')
  await expect(metadata).toContainText('C1'); await expect(metadata).toContainText('Unknown')
  await page.locator('.history-provenance').evaluate(e => e.scrollIntoView({ block: 'start' }))
  await screenshot(page, 'details')
})
test('available empty T3 has the exact primary, with one visible Partial note', async ({ page }) => {
  await qa(page, 'partial', 'T3')
  await expect(page.getByText('No recorded history for this task.', { exact: true })).toBeVisible()
  await expect(page.getByText('History unavailable.', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Some earlier history may be unavailable', { exact: true })).toHaveCount(1)
  await screenshot(page, 'empty')
  await page.getByText('History details', { exact: true }).click()
  await expect(page.getByText(/Availability: Available. Coverage: Partial/)).toBeVisible()
})
for (const task of ['T1', 'T2', 'T3']) test(`QA7.4.7-002 unavailable ${task} never maps to empty/Partial primary`, async ({ page }) => {
  await qa(page, 'unavailable', task)
  await expect(page.getByText('History unavailable.', { exact: true })).toBeVisible()
  await expect(page.getByText('No recorded history for this task.', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Some earlier history may be unavailable', { exact: true })).toHaveCount(0)
  if (task === 'T2') await screenshot(page, 'unavailable')
  await page.getByText('History details', { exact: true }).click()
  await expect(page.getByText(/Availability: Unavailable. Coverage: Partial/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry reading history', exact: true })).toBeVisible()
})
for (const width of [780, 1280, 1440]) test(`40-task primary hierarchy and actions fit ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 }); await openPlan(page, selectedHistoryFile())
  await page.getByRole('button', { name: 'Inspect T1 History task 1', exact: true }).click()
  await page.getByRole('button', { name: 'Show history', exact: true }).click()
  await expect(page.locator('[data-history-event]')).toHaveCount(20)
  await expect(page.locator('.task-status-panel').getByRole('combobox', { name: 'T1 status in details', exact: true })).toHaveValue('In Progress')
  await expect(page.getByRole('button', { name: 'Duplicate T1', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.locator('.task-status-panel').evaluate(e => e.scrollIntoView({ block: 'start' }))
  await screenshot(page, `app-${width}`)
})
for (const [scenario, primary, action, diagnostic] of [
  ['invalid', 'Unable to display task history', 'Retry reading history', 'InvalidPayload'],
  ['expired', 'History needs to be refreshed.', 'Refresh history', 'ReadExpired'],
  ['oversized', 'This history entry is too large to display here.', 'Retry reading history', 'RecordTooLarge'],
  ['mixed', 'History has changed—refresh to view a consistent version.', 'Refresh history', 'MixedWatermark'],
]) test(`${scenario} keeps concise primary separate from diagnostic evidence`, async ({ page }) => {
  await qa(page, scenario)
  await expect(page.getByText(primary, { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: action, exact: true })).toBeVisible()
  const details = page.locator('.history-provenance')
  await expect(details.getByText(new RegExp(`Read diagnostics: ${diagnostic}`))).toBeHidden()
  await details.locator('summary').click()
  await expect(details.getByText(new RegExp(`Read diagnostics: ${diagnostic}`))).toBeVisible()
})
