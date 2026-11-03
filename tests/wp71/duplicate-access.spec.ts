import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { openPlan } from '../wp5-2-fixtures'
import { studentFile } from './studentFixture'

test.use({ timezoneId: 'America/Regina', actionTimeout: 10_000 })
const directory = 'docs/qa/wp7-1/evidence'

async function layout(region: Locator) {
  return region.evaluate(element => {
    const box = element.getBoundingClientRect()
    const button = element.querySelector<HTMLButtonElement>('[aria-label="Duplicate T1"]')!
    const rect = button.getBoundingClientRect()
    const hint = element.previousElementSibling!
    return {
      viewport: { width: innerWidth, height: innerHeight },
      table: { left: box.left, right: box.right, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, scrollLeft: element.scrollLeft, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight },
      duplicate: { left: rect.left, right: rect.right, width: rect.width, disabled: button.disabled, label: button.getAttribute('aria-label'),
        withinHorizontalTableViewport: rect.left >= box.left && rect.right <= box.left + element.clientWidth,
        centreHit: document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest('button') === button },
      horizontalScrollHint: { text: hint.textContent, display: getComputedStyle(hint).display },
      duplicateControlCount: element.querySelectorAll('[aria-label^="Duplicate T"]').length,
    }
  })
}

for (const width of [1440, 1280, 780]) for (const method of ['pointer', 'keyboard']) {
  test(`QA71-005 regression - pinned Duplicate discovery and ${method} access at ${width}px`, async ({ page, browser }) => {
    await page.setViewportSize({ width, height: 900 })
    const input = studentFile(); await openPlan(page, input)
    const panel = page.locator('.tasks-panel')
    const region = page.getByRole('region', { name: 'Task schedule table', exact: true })
    // Bring only the panel into view, without locating/clicking the offscreen
    // action: Playwright button clicks otherwise auto-scroll and mask discovery.
    await panel.evaluate(element => element.scrollIntoView({ block: 'start' }))
    const initial = await layout(region)
    expect(initial.duplicateControlCount).toBe(30)
    expect(initial.duplicate.disabled).toBe(false)
    expect(initial.duplicate.withinHorizontalTableViewport).toBe(true)
    expect(initial.duplicate.centreHit).toBe(true)
    expect(initial.horizontalScrollHint.display).not.toBe('none')
    await mkdir(directory, { recursive: true })
    if (width === 1440) await page.screenshot({ path: `${directory}/qa71-005-${method}-initial.png` })
    const duplicate = page.getByRole('button', { name: 'Duplicate T1', exact: true })
    let tabCount = 0
    if (method === 'pointer') {
      await region.hover(); await page.mouse.wheel(1800, 0)
      await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
    } else {
      await region.focus()
      while (tabCount < 30 && !await duplicate.evaluate(element => element === document.activeElement)) {
        await page.keyboard.press('Tab'); tabCount++
      }
      await expect(duplicate).toBeFocused()
    }
    const revealed = await layout(region)
    expect(revealed.duplicate.withinHorizontalTableViewport).toBe(true)
    expect(revealed.duplicate.centreHit).toBe(true)
    if (width === 1440) await page.screenshot({ path: `${directory}/qa71-005-${method}-revealed.png` })
    if (method === 'pointer') await duplicate.click()
    else await page.keyboard.press('Enter')
    await expect(page.locator('[data-task-row="T31"]')).toHaveCount(1)
    await page.getByRole('tab', { name: 'Files', exact: true }).click()
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
    const downloaded = await pending
    const after = JSON.parse(await readFile((await downloaded.path())!, 'utf8'))
    expect(after.baseline).toEqual(input.baseline)
    expect(after.tasks.filter((task: { taskId: string }) => task.taskId !== 'T31')).toEqual(input.tasks)
    expect(after.tasks.find((task: { taskId: string }) => task.taskId === 'T31')).toMatchObject({ durationHours: 4, predecessorTaskIds: [] })
    expect(after.nextTaskNumber).toBe(32)
    await writeFile(`${directory}/qa71-005-${method}-${width}.json`, JSON.stringify({ capturedAtUTC: new Date().toISOString(), browser: browser.version(), method, initial, revealed, tabCount, duplicateCreated: 'T31', baselineUnchanged: true, originalTasksUnchanged: true }, null, 2) + '\n')
  })
}
