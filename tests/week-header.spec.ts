import { expect, test } from '@playwright/test'
import { longPlan, openPlan } from './wp5-2-fixtures'

for (const width of [1440, 780]) for (const weekdays of [[1, 4, 5], [4], [1, 2, 3, 4, 5]]) {
  test(`week labels stay within measured spans at ${width}px with ${weekdays.length} working days`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 })
    await openPlan(page, { ...longPlan, project: { ...longPlan.project, workingWeekdays: weekdays } })
    const chart = page.getByRole('region', { name: 'Gantt chart', exact: true })
    await chart.getByRole('button', { name: 'Compressed', exact: true }).click()
    await chart.getByRole('combobox', { name: 'Scale', exact: true }).selectOption('week')
    const first = chart.locator('.gantt-bar[data-task-id="T1"]')
    const coordinates = [await first.getAttribute('data-start'), await first.getAttribute('data-end')]
    const scroll = chart.getByRole('region', { name: 'Scrollable Gantt timeline', exact: true })
    for (const fraction of [0, 0.37, 1]) {
      await scroll.evaluate((element, value) => { element.scrollLeft = (element.scrollWidth - element.clientWidth) * value; element.dispatchEvent(new Event('scroll')) }, fraction)
      await expect(chart.locator('[data-week-start]').first()).toHaveCount(1)
      const labels = await chart.locator('[data-week-start]').evaluateAll(groups => groups.map(group => {
        const text = group.querySelector('[data-week-label]') as SVGTextElement
        const left = Number(group.getAttribute('data-label-left')), right = Number(group.getAttribute('data-label-right'))
        return { left, right, x: Number(text.getAttribute('x')), measured: text.getComputedTextLength(), clipped: !!text.getAttribute('clip-path'), name: group.getAttribute('aria-label'), text: text.textContent }
      }))
      expect(labels.length).toBeGreaterThan(1)
      for (const label of labels) {
        expect(label.clipped).toBe(true); expect(label.name).toMatch(/^Week of \d{4}-\d{2}-\d{2}$/)
        if (label.text) { expect(label.x).toBeGreaterThanOrEqual(label.left); expect(label.x + label.measured).toBeLessThanOrEqual(label.right + 0.1) }
      }
      for (let index = 1; index < labels.length; index++) expect(labels[index].left).toBeGreaterThanOrEqual(labels[index - 1].right - 0.1)
    }
    await chart.getByRole('button', { name: 'Go to start', exact: true }).click()
    if (weekdays.length === 5) await expect(chart.locator('[data-week-label]').filter({ hasText: /^Week of [A-Z][a-z]{2} \d+, \d{4}$/ }).first()).toBeVisible()
    await first.click(); await expect(first).toHaveAttribute('aria-pressed', 'true')
    await page.setViewportSize({ width: width === 1440 ? 780 : 1440, height: 1000 })
    await expect(first).toHaveAttribute('data-start', coordinates[0]!)
    await expect(first).toHaveAttribute('data-end', coordinates[1]!)
    for (const scale of ['hour', 'day', 'week']) {
      await chart.getByRole('combobox', { name: 'Scale', exact: true }).selectOption(scale)
      await expect(first).toHaveAttribute('data-end', coordinates[1]!)
      await expect(first).toHaveAttribute('aria-pressed', 'true')
    }
    await page.setViewportSize({ width, height: 1000 })
    if (weekdays.length === 3) await chart.screenshot({ path: `docs/review/wp5-2-week-${width}.png` })
    else await chart.screenshot({ path: info.outputPath('one-working-day-week.png') })
    await chart.getByRole('button', { name: 'Expanded', exact: true }).click()
    await expect(chart.getByText(/^Week of/).first()).toBeVisible()
    await expect(first).toHaveAttribute('aria-pressed', 'true')
  })
}
