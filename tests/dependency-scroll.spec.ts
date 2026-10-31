import { expect, test } from '@playwright/test'

for (const viewport of [{ width: 1440, height: 900 }, { width: 780, height: 700 }]) {
  test(`all 40 predecessor choices scroll with wheel and keyboard at ${viewport.width}px`, async ({ page }, info) => {
    await page.setViewportSize(viewport)
    const tasks = Array.from({ length: 40 }, (_, index) => ({ taskId: `T${index + 1}`, name: `Task ${index + 1} with a longer planning title to verify wrapped choices`, description: '', durationHours: 1, predecessorTaskIds: [], independentStartMode: 'DEFAULT' }))
    const plan = { format: 'react-gantt-chart', schemaVersion: 1, createdBy: 'React Gantt Chart', savedAt: '2026-10-31T12:00:00.000Z',
      project: { projectId: 'SCROLL-REVIEW', name: 'Long predecessor list', projectStartDate: '2026-11-02', targetEndDate: '2026-12-18', workingWeekdays: [1, 4, 5], workingHoursPerDay: 3 }, tasks, nextTaskNumber: 41 }
    await page.goto('/')
    await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'scroll-review.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(plan)) })
    await page.getByRole('button', { name: 'T1 predecessors', exact: true }).click()
    const popup = page.getByRole('group', { name: 'T1 predecessor selection', exact: true })
    const choices = popup.locator('.dependency-choices')
    const before = await choices.evaluate(element => ({ height: element.clientHeight, content: element.scrollHeight, top: element.scrollTop }))
    expect(before.content).toBeGreaterThan(before.height)
    await choices.hover()
    await page.mouse.wheel(0, 5000)
    await expect.poll(() => choices.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
    const last = popup.getByRole('checkbox', { name: /^T1 predecessor T40 / })
    await expect(last).toBeInViewport()
    await last.check()
    await expect(popup.getByRole('button', { name: 'Done', exact: true })).toBeInViewport()
    await expect(popup.getByRole('button', { name: 'Cancel', exact: true })).toBeInViewport()
    await page.screenshot({ path: info.outputPath(`predecessor-scroll-${viewport.width}.png`) })
    await popup.getByRole('button', { name: 'Done', exact: true }).click()
    await expect(popup).toHaveCount(0)
    await expect(page.locator('[data-task-row="T1"]')).toContainText('T40')
    await page.getByRole('button', { name: 'T1 predecessors', exact: true }).click()
    await expect(popup.getByRole('checkbox', { name: /^T1 predecessor T2 / })).toBeFocused()
    for (let index = 0; index < 38; index++) await page.keyboard.press('Tab')
    await expect(last).toBeFocused()
    await expect(last).toBeInViewport()
    await page.keyboard.press('Space')
    await page.keyboard.press('Escape')
    await expect(popup).toHaveCount(0)
    await expect(page.locator('[data-task-row="T1"]')).toContainText('T40')
  })
}
