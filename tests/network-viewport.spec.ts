import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { networkPlan, openPlan, task } from './wp5-2-fixtures'

const network = (page: Page) => page.getByRole('region', { name: 'Network / Critical Path', exact: true })
const canvas = (page: Page) => page.getByRole('region', { name: 'Scrollable dependency network', exact: true })
const node = (page: Page, id: string) => page.getByRole('button', { name: new RegExp(`^Network task ${id} `) })
const transform = (page: Page) => network(page).locator('.network-svg').evaluate(element => ['data-zoom', 'data-pan-x', 'data-pan-y'].map(name => Number(element.getAttribute(name))))
async function open(page: Page, plan: unknown = networkPlan) {
  await openPlan(page, plan)
  await page.getByRole('button', { name: 'Network / Critical Path', exact: true }).click()
}
async function allNodesFit(page: Page, count: number) {
  await expect(network(page).locator('.network-node-box')).toHaveCount(count)
  const boxes = await network(page).locator('.network-node-box').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect(), viewport = node.closest('svg')!.getBoundingClientRect()
    return { x: rect.left - viewport.left, y: rect.top - viewport.top, right: rect.right - viewport.left, bottom: rect.bottom - viewport.top, width: viewport.width, height: viewport.height }
  }))
  for (const box of boxes) { expect(box.x).toBeGreaterThan(1); expect(box.y).toBeGreaterThan(1); expect(box.right).toBeLessThan(box.width - 1); expect(box.bottom).toBeLessThan(box.height - 1) }
}
async function connectorsAttached(page: Page) {
  const endpoints = await network(page).locator('.network-edge[aria-label]').evaluateAll(paths => paths.map(element => {
    const path = element as SVGPathElement
    const [, from, to] = path.getAttribute('aria-label')!.match(/^Network dependency (.+) to (.+)$/)!
    const root = path.closest('svg')!
    const source = root.querySelector(`.network-node[data-task-id="${from}"] .network-node-box`)?.getBoundingClientRect()
    const target = root.querySelector(`.network-node[data-task-id="${to}"] .network-node-box`)?.getBoundingClientRect()
    const start = path.getPointAtLength(0).matrixTransform(path.getScreenCTM()!), end = path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM()!)
    return source && target ? { startX: start.x, startY: start.y, endX: end.x, endY: end.y, source: { right: source.right, top: source.top, bottom: source.bottom }, target: { left: target.left, top: target.top, bottom: target.bottom } } : null
  }).filter(Boolean))
  expect(endpoints.length).toBeGreaterThan(0)
  for (const edge of endpoints) {
    expect(edge!.startX).toBeCloseTo(edge!.source.right, 1); expect(edge!.endX).toBeCloseTo(edge!.target.left, 1)
    expect(edge!.startY).toBeGreaterThanOrEqual(edge!.source.top); expect(edge!.startY).toBeLessThanOrEqual(edge!.source.bottom)
    expect(edge!.endY).toBeGreaterThanOrEqual(edge!.target.top); expect(edge!.endY).toBeLessThanOrEqual(edge!.target.bottom)
  }
}

test('first opening and Fit centre all nodes, labels and attached connectors at desktop and narrow widths', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await open(page)
  await allNodesFit(page, 7); await connectorsAttached(page)
  const critical = await network(page).locator('.network-node').evaluateAll(nodes => nodes.map(node => [node.getAttribute('data-task-id'), node.getAttribute('data-critical')]))
  await network(page).screenshot({ path: 'docs/review/wp5-2-network-fit.png' })
  await network(page).getByRole('button', { name: 'Zoom in', exact: true }).click()
  await network(page).getByRole('combobox', { name: 'Network zoom', exact: true }).selectOption('1.5')
  await node(page, 'T1').click()
  await network(page).getByRole('button', { name: 'Go to selected node', exact: true }).click()
  await connectorsAttached(page)
  await network(page).screenshot({ path: 'docs/review/wp5-2-network-zoomed.png' })
  await expect(node(page, 'T1')).toHaveAttribute('aria-pressed', 'true')
  await network(page).getByRole('button', { name: 'Fit to View', exact: true }).click()
  await allNodesFit(page, 7)
  expect(await network(page).locator('.network-node').evaluateAll(nodes => nodes.map(node => [node.getAttribute('data-task-id'), node.getAttribute('data-critical')]))).toEqual(critical)
  await page.setViewportSize({ width: 780, height: 900 }); await allNodesFit(page, 7); await connectorsAttached(page)
  await network(page).screenshot({ path: 'docs/review/wp5-2-network-narrow-fit.png' })
})

test('visible zoom buttons work by keyboard, respect limits and leave normal page scrolling alone', async ({ page }) => {
  await open(page)
  const plus = network(page).getByRole('button', { name: 'Zoom in', exact: true }), minus = network(page).getByRole('button', { name: 'Zoom out', exact: true })
  const before = await transform(page)
  await plus.focus(); await page.keyboard.press('Enter')
  expect((await transform(page))[0]).toBeGreaterThan(before[0])
  await minus.focus(); await page.keyboard.press('Space')
  expect((await transform(page))[0]).toBeCloseTo(before[0])
  for (let index = 0; index < 30 && await plus.isEnabled(); index++) await plus.click()
  await expect(plus).toBeDisabled(); expect((await transform(page))[0]).toBe(3)
  for (let index = 0; index < 40 && await minus.isEnabled(); index++) await minus.click()
  await expect(minus).toBeDisabled(); expect((await transform(page))[0]).toBe(0.05)
  await network(page).getByRole('button', { name: 'Fit to View', exact: true }).click()
  const fitted = await transform(page)
  await canvas(page).hover()
  const scrollBefore = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, 300)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollBefore)
  expect(await transform(page)).toEqual(fitted)
})

test('background dragging pans without changing selection; node gestures do not pan and endpoints remain attached', async ({ page }) => {
  await open(page); await node(page, 'T1').click()
  const before = await transform(page), box = (await canvas(page).boundingBox())!
  await page.mouse.move(box.x + 10, box.y + 10); await page.mouse.down()
  await page.mouse.move(box.x + 130, box.y + 70, { steps: 8 }); await page.mouse.up()
  const panned = await transform(page)
  expect(panned[0]).toBe(before[0]); expect(panned[1] - before[1]).toBeCloseTo(120, 0); expect(panned[2] - before[2]).toBeCloseTo(60, 0)
  await expect(node(page, 'T1')).toHaveAttribute('aria-pressed', 'true')
  const nodeBox = (await node(page, 'T1').boundingBox())!
  await page.mouse.move(nodeBox.x + 40, nodeBox.y + 40); await page.mouse.down(); await page.mouse.move(nodeBox.x + 70, nodeBox.y + 60, { steps: 5 }); await page.mouse.up()
  expect(await transform(page)).toEqual(panned)
  await connectorsAttached(page)
  await page.getByRole('button', { name: 'Select T7 in chart', exact: true }).click()
  await network(page).getByRole('button', { name: 'Go to selected node', exact: true }).click()
  await expect(node(page, 'T7')).toBeInViewport(); await node(page, 'T7').click()
  await expect(page.getByLabel('Selected task details')).toContainText('T7')
  await expect(node(page, 'T7')).toHaveAttribute('aria-pressed', 'true')
})

test('network viewport survives view/tab changes without dirtying saved inputs, and a loaded project gets a fresh fit', async ({ page }) => {
  await openPlan(page, networkPlan)
  await page.getByRole('tab', { name: 'Files', exact: true }).click()
  await page.getByLabel('Saved plan name', { exact: true }).fill('Viewport review')
  await page.getByRole('button', { name: 'Save As', exact: true }).click()
  await page.getByRole('tab', { name: 'Workspace', exact: true }).click()
  const dates = await page.locator('.gantt-bar').evaluateAll(bars => bars.map(bar => bar.getAttribute('aria-label')))
  await page.getByRole('button', { name: 'Network / Critical Path', exact: true }).click()
  await network(page).getByRole('combobox', { name: 'Network zoom', exact: true }).selectOption('1.5')
  await canvas(page).focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown')
  const chosen = await transform(page)
  await page.getByRole('button', { name: 'Gantt', exact: true }).click()
  await page.getByRole('button', { name: 'Network / Critical Path', exact: true }).click()
  expect(await transform(page)).toEqual(chosen)
  await page.getByRole('tab', { name: 'Files', exact: true }).click(); await page.getByRole('tab', { name: 'Workspace', exact: true }).click()
  expect(await transform(page)).toEqual(chosen)
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  expect(await page.locator('.gantt-bar').evaluateAll(bars => bars.map(bar => bar.getAttribute('aria-label')))).toEqual(dates)
  await page.getByRole('tab', { name: 'Files', exact: true }).click()
  const replacement = { ...networkPlan, project: { ...networkPlan.project, projectId: 'OTHER' }, tasks: [task(1)], nextTaskNumber: 2 }
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'other.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(replacement)) })
  await expect(node(page, 'T1')).toBeVisible(); await allNodesFit(page, 1)
  expect((await transform(page))[0]).toBe(1)
})

for (const kind of ['empty', 'one', 'disconnected', 'deep', 'large'] as const) test(`Fit handles ${kind} networks without clipping or excessive DOM`, async ({ page }) => {
  const tasks = kind === 'empty' ? [] : kind === 'one' ? [task(1)] : kind === 'deep' ? Array.from({ length: 25 }, (_, index) => task(index + 1, 1, index ? [index] : [])) : Array.from({ length: kind === 'large' ? 1000 : 16 }, (_, index) => task(index + 1, 1))
  await open(page, { ...networkPlan, tasks, nextTaskNumber: tasks.length + 1 })
  if (!tasks.length) { await expect(network(page).getByRole('button', { name: 'Fit to View', exact: true })).toBeDisabled(); return }
  if (kind === 'large') {
    await expect(network(page).getByText(/Overview of 1000 tasks/)).toBeVisible()
    expect(await network(page).locator('*').count()).toBeLessThan(300)
    await page.getByRole('button', { name: 'Select T999 in chart', exact: true }).click()
    await network(page).getByRole('button', { name: 'Go to selected node', exact: true }).click()
    await expect(node(page, 'T999')).toBeInViewport()
    expect(await network(page).locator('*').count()).toBeLessThan(300)
  } else await allNodesFit(page, tasks.length)
})
