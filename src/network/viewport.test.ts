// @vitest-environment node
import { expect, test } from 'vitest'
import { centerNetwork, fitNetwork, hitNetworkNode, MAX_NETWORK_ZOOM, MIN_NETWORK_ZOOM, networkPoint, networkWindow, panNetwork, zoomNetwork } from './viewport'

test.each([{ width: 1200, height: 500 }, { width: 500, height: 280 }])('fit centres all graph bounds and margins in %j', viewport => {
  const bounds = { x: 20, y: 40, width: 4000, height: 1400 }
  const view = fitNetwork(bounds, viewport)
  const left = bounds.x * view.scale + view.x, right = (bounds.x + bounds.width) * view.scale + view.x
  const top = bounds.y * view.scale + view.y, bottom = (bounds.y + bounds.height) * view.scale + view.y
  expect(left).toBeGreaterThanOrEqual(23.99); expect(right).toBeLessThanOrEqual(viewport.width - 23.99)
  expect(top).toBeGreaterThanOrEqual(23.99); expect(bottom).toBeLessThanOrEqual(viewport.height - 23.99)
  expect((left + right) / 2).toBeCloseTo(viewport.width / 2)
  expect((top + bottom) / 2).toBeCloseTo(viewport.height / 2)
})
test('empty, one-node and extremely large graph fits remain finite', () => {
  expect(fitNetwork({ x: 0, y: 0, width: 0, height: 0 }, { width: 800, height: 500 })).toEqual({ scale: 1, x: 0, y: 0 })
  expect(fitNetwork({ x: 0, y: 0, width: 288, height: 180 }, { width: 800, height: 500 }).scale).toBe(1)
  const large = fitNetwork({ x: 0, y: 0, width: 288, height: 180000 }, { width: 800, height: 500 })
  expect(large.scale).toBeLessThan(MIN_NETWORK_ZOOM)
  expect(Object.values(large).every(Number.isFinite)).toBe(true)
})
test('zoom preserves the world point under its anchor, while pan changes translation only', () => {
  const view = { scale: 0.75, x: -200, y: 80 }, anchor = { x: 400, y: 200 }
  const before = networkPoint(anchor, view)
  const zoomed = zoomNetwork(view, 1.5, anchor)
  expect(networkPoint(anchor, zoomed)).toEqual(before)
  expect(panNetwork(zoomed, { x: 32, y: -20 })).toEqual({ ...zoomed, x: zoomed.x + 32, y: zoomed.y - 20 })
  expect(view).toEqual({ scale: 0.75, x: -200, y: 80 })
})
test('manual zoom limits and selected-node centring use the same inverse transform', () => {
  const view = { scale: 0.002, x: 10, y: 20 }, anchor = { x: 400, y: 200 }
  expect(zoomNetwork(view, 100, anchor).scale).toBe(MAX_NETWORK_ZOOM)
  expect(zoomNetwork(view, 0, anchor).scale).toBe(MIN_NETWORK_ZOOM)
  const focused = centerNetwork(view, { x: 200, y: 5000 }, { width: 800, height: 400 }, true)
  expect(focused.scale).toBe(0.75)
  expect(networkPoint(anchor, focused)).toEqual({ x: 200, y: 5000 })
})
test('viewport culling and hit testing stay correct after arbitrary zoom and pan', () => {
  const view = { scale: 1.7, x: -130, y: 75 }
  const bounds = networkWindow(view, { width: 800, height: 500 })
  expect(bounds.x).toBeCloseTo(130 / 1.7)
  const nodes = [{ x: 240, y: 100, id: 'correct' }, { x: 800, y: 100, id: 'other' }]
  const point = { x: 300 * view.scale + view.x, y: 150 * view.scale + view.y }
  expect(hitNetworkNode(nodes, point, view, { width: 240, height: 132 })?.id).toBe('correct')
  expect(hitNetworkNode(nodes, { x: 0, y: 0 }, view, { width: 240, height: 132 })).toBeUndefined()
})
