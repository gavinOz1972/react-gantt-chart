import { expect, test } from '@playwright/test'

test('home page loads without browser errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveTitle('React Gantt Chart')
  await expect(page.getByRole('heading', { level: 1, name: 'React Gantt Chart' })).toBeVisible()
  expect(errors).toEqual([])
})
