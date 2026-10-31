import type { Page } from '@playwright/test'

/** Existing regression scenarios now finish each dependency edit explicitly. */
export async function chooseDependency(page: Page, label: string, checked = true) {
  if (!await page.locator('.dependency-popover').count()) {
    const inlineOwner = label.match(/^(T\d+) predecessor /)?.[1]
    if (inlineOwner) await page.getByRole('button', { name: `${inlineOwner} predecessors`, exact: true }).click()
    else await page.locator('.editor').getByRole('button', { name: /predecessors$/ }).click()
  }
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const name = label.includes(' predecessor ') ? new RegExp(`^${escaped}$`) : new RegExp(` predecessor ${escaped}$`)
  await page.locator('.dependency-popover').getByRole('checkbox', { name }).setChecked(checked)
  await page.locator('.dependency-popover').getByRole('button', { name: 'Done', exact: true }).click()
}

export async function finishDependencies(page: Page) {
  if (await page.locator('.dependency-popover').count()) await page.locator('.dependency-popover').getByRole('button', { name: 'Done', exact: true }).click()
}
