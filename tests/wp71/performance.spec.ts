import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { openPlan } from '../wp5-2-fixtures'
import { studentFile } from './studentFixture'

test.use({ timezoneId: 'America/Regina', viewport: { width: 1440, height: 900 } })
test('E13 - forty-task observational input/chart/save latency and freeze detection', async ({ page, browser }, info) => {
  test.setTimeout(90_000)
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  const input = studentFile({ count: 40 }); await openPlan(page, input)
  await page.getByRole('tab', { name: 'Files', exact: true }).click()
  await page.getByLabel('Saved plan name', { exact: true }).fill('WP71 DISPOSABLE performance')
  await page.getByRole('button', { name: 'Save As', exact: true }).click()
  await page.getByRole('tab', { name: 'Workspace', exact: true }).click()
  await page.getByRole('button', { name: 'Select T20 in chart', exact: true }).click()
  await page.getByRole('button', { name: 'Go to selected task', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).check(); await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  await page.evaluate(() => {
    const metrics = { ticks: 0, longTasks: [] as number[], storageWriteMs: [] as number[] }
    Object.assign(window, { __wp71Perf: metrics })
    setInterval(() => metrics.ticks++, 16)
    new PerformanceObserver(list => metrics.longTasks.push(...list.getEntries().map(entry => entry.duration))).observe({ type: 'longtask' })
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) { const start = performance.now(); try { return original.call(this, key, value) } finally { metrics.storageWriteMs.push(performance.now() - start) } }
  })
  const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable')
  const before = await cdp.send('Performance.getMetrics')
  const interactions: Record<string, number> = {}
  async function measure(label: string, action: () => Promise<unknown>, ready: () => Promise<unknown> = async () => {}) {
    const start = await page.evaluate(() => performance.now())
    await action(); await ready()
    const end = await page.evaluate(() => new Promise<number>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now())))))
    interactions[label] = end - start
  }
  await page.getByRole('button', { name: 'Edit Selected T20 remaining effort', exact: true }).click()
  await page.getByLabel('Selected T20 remaining effort', { exact: true }).fill('13')
  await measure('remainingEnterToPaint', () => page.getByLabel('Selected T20 remaining effort', { exact: true }).press('Enter'), () => expect(page.getByRole('region', { name: 'Project health', exact: true })).toContainText('229 person-hours'))
  await measure('weekScaleToPaint', () => page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption('week'))
  await measure('compressedModeToPaint', () => page.getByRole('button', { name: 'Compressed', exact: true }).click())
  await measure('scrollToPaint', () => page.getByRole('region', { name: 'Scrollable Gantt timeline', exact: true }).evaluate(element => { element.scrollTop = 1000; element.scrollLeft = 300 }))
  await measure('saveToSavedPaint', () => page.getByRole('button', { name: 'Save', exact: true }).click(), () => expect(page.getByText('Saved locally', { exact: true })).toBeVisible())
  const observed = await page.evaluate(() => ({ ...(window as unknown as { __wp71Perf: { ticks: number; longTasks: number[]; storageWriteMs: number[] } }).__wp71Perf,
    userAgent: navigator.userAgent, logicalProcessors: navigator.hardwareConcurrency, viewport: { width: innerWidth, height: innerHeight }, horizontalPageOverflow: document.documentElement.scrollWidth > innerWidth }))
  expect(observed.ticks).toBeGreaterThan(0); expect(errors).toEqual([]); expect(observed.horizontalPageOverflow).toBe(false)
  await expect(page.getByRole('region', { name: 'Project health', exact: true })).toContainText('Projected completion2026-12-29')
  const after = await cdp.send('Performance.getMetrics')
  const deltas = Object.fromEntries(after.metrics.filter(metric => ['ScriptDuration', 'TaskDuration', 'LayoutCount', 'RecalcStyleCount'].includes(metric.name)).map(metric => [metric.name, metric.value - (before.metrics.find(item => item.name === metric.name)?.value ?? 0)]))
  const result = { recordedAtUTC: new Date().toISOString(), node: process.version, browser: browser.version(), scenarioTimezone: 'America/Regina', taskCount: 40, workerMode: process.env.WP71_PERF_MODE ?? 'regression', repeat: info.repeatEachIndex,
    method: 'Automation wall-clock start through action, visible-result assertion and two animation frames; includes Playwright actionability/scroll overhead. Observational, not a physical-laptop benchmark.',
    interactionsMs: interactions, ...observed, cdpDeltas: deltas, errors }
  const directory = 'docs/qa/wp7-1/evidence'; await mkdir(directory, { recursive: true })
  await writeFile(`${directory}/performance-${result.workerMode}-${info.repeatEachIndex}.json`, JSON.stringify(result, null, 2) + '\n')
  await info.attach('performance-observations.json', { contentType: 'application/json', body: JSON.stringify(result, null, 2) })
  if (info.repeatEachIndex === 0) await page.screenshot({ path: `${directory}/e13-forty-task.png`, fullPage: true })
})
