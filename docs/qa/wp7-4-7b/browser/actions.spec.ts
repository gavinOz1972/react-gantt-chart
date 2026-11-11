import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import type { Page } from '@playwright/test'
const evidence = 'docs/qa/wp7-4-7b/evidence'
async function qa(page: Page, scenario: string) {
  await page.goto('/docs/qa/wp7-4-7/qa/index.html')
  await page.getByLabel('Scenario', { exact: true }).selectOption(scenario)
  await page.getByRole('button', { name: 'Show history', exact: true }).click()
}
for (const scenario of ['invalid', 'expired', 'oversized', 'mixed']) test(`${scenario} retry/refresh visibly completes even when the source problem persists`, async ({ page }) => {
  await qa(page, scenario)
  const primary = await page.getByRole('alert').textContent()
  const action = scenario === 'invalid' || scenario === 'oversized' ? 'Retry reading history' : 'Refresh history'
  await page.getByRole('button', { name: action, exact: true }).click()
  const feedback = page.locator('[data-history-read-feedback]')
  await expect(feedback).toContainText('attempt 1 finished. The same history problem is still present. Project data has not changed.')
  await expect(page.getByRole('alert')).toHaveText(primary!)
  await expect(page.locator('[data-history-event]')).toHaveCount(0)
  await page.getByRole('button', { name: action, exact: true }).click()
  await expect(feedback).toContainText('attempt 2 finished.')
  if (scenario === 'invalid') {
    await mkdir(evidence, { recursive: true }); await page.screenshot({ path: `${evidence}/retry-feedback.png` })
  }
})
test('rapid refresh shows progress, finishes once and retains keyboard focus', async ({ page }) => {
  await qa(page, 'delayed'); await expect(page.locator('[data-history-event]')).toHaveCount(20)
  await page.getByRole('button', { name: 'Simulate source change' }).click()
  const button = page.getByRole('button', { name: 'Refresh history', exact: true })
  await button.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Enter')
  await expect(page.locator('[data-history-read-feedback]')).toHaveText('Refresh attempt 1: reading history…')
  await expect(button).toHaveAttribute('aria-disabled', 'true'); await expect(button).toBeFocused()
  await expect(page.locator('[data-history-read-feedback]')).toHaveText('Refresh attempt 1 finished. History was read successfully.')
  await expect(button).toHaveAttribute('aria-disabled', 'false'); await expect(button).toBeFocused()
})
test('selection change during refresh drops the cancelled attempt and its late result', async ({ page }) => {
  await qa(page, 'delayed'); await expect(page.locator('[data-history-event]')).toHaveCount(20)
  await page.getByRole('button', { name: 'Simulate source change' }).click()
  await page.getByRole('button', { name: 'Refresh history', exact: true }).click()
  await expect(page.locator('[data-history-read-feedback]')).toContainText('reading history')
  await page.getByLabel('Selected task', { exact: true }).selectOption('T2')
  await page.getByRole('button', { name: 'Show history', exact: true }).click()
  await expect(page.locator('[data-history-event]')).toHaveCount(2)
  await expect(page.locator('[data-history-read-feedback]')).toHaveCount(0)
  await expect(page.locator('[data-history-event]').first()).toHaveAttribute('data-history-event', 'H-45')
})
test('History Audit Data is collapsed, keyboard accessible and retains the audit contents', async ({ page }) => {
  await qa(page, 'partial'); await expect(page.locator('[data-history-event]')).toHaveCount(20)
  const summary = page.getByText('History Audit Data', { exact: true }), disclosure = page.locator('.history-provenance')
  await expect(disclosure).not.toHaveAttribute('open', '')
  await summary.focus(); await page.keyboard.press('Enter'); await expect(summary).toBeFocused()
  await expect(disclosure).toHaveAttribute('open', '')
  await expect(disclosure).toContainText('Format 5, progress version 1')
  await expect(disclosure).toContainText('2026-11-09T15:00:00.000Z')
  await expect(disclosure).toContainText('C1'); await expect(disclosure).toContainText('completionAcknowledged')
  await disclosure.evaluate(e => e.scrollIntoView({ block: 'start' }))
  await mkdir(evidence, { recursive: true }); await page.screenshot({ path: `${evidence}/history-audit-data.png` })
})
