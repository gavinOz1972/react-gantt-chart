export interface Point { x: number; y: number }
export interface Size { width: number; height: number }
export interface Bounds extends Point, Size {}
export interface ViewTransform extends Point { scale: number }
export const MIN_NETWORK_ZOOM = 0.05
export const MAX_NETWORK_ZOOM = 3

/** Fit may use a smaller overview scale than manual zoom for very large graphs. */
export function fitNetwork(bounds: Bounds, viewport: Size, padding = 24): ViewTransform {
  if (bounds.width <= 0 || bounds.height <= 0 || viewport.width <= 0 || viewport.height <= 0) return { scale: 1, x: 0, y: 0 }
  const scale = Math.min(1, Math.max(1, viewport.width - padding * 2) / bounds.width, Math.max(1, viewport.height - padding * 2) / bounds.height)
  return { scale, x: (viewport.width - bounds.width * scale) / 2 - bounds.x * scale, y: (viewport.height - bounds.height * scale) / 2 - bounds.y * scale }
}

export function networkPoint(point: Point, view: ViewTransform): Point {
  return { x: (point.x - view.x) / view.scale, y: (point.y - view.y) / view.scale }
}
export function zoomNetwork(view: ViewTransform, scale: number, anchor: Point): ViewTransform {
  const next = Math.max(MIN_NETWORK_ZOOM, Math.min(MAX_NETWORK_ZOOM, scale))
  const world = networkPoint(anchor, view)
  return { scale: next, x: anchor.x - world.x * next, y: anchor.y - world.y * next }
}
export function panNetwork(view: ViewTransform, delta: Point): ViewTransform {
  return { ...view, x: view.x + delta.x, y: view.y + delta.y }
}
export function centerNetwork(view: ViewTransform, point: Point, viewport: Size, readable = false): ViewTransform {
  const scale = readable ? Math.max(0.75, view.scale) : view.scale
  return { scale, x: viewport.width / 2 - point.x * scale, y: viewport.height / 2 - point.y * scale }
}
export function networkWindow(view: ViewTransform, viewport: Size, overscan = 0): Bounds {
  const topLeft = networkPoint({ x: -overscan, y: -overscan }, view)
  return { ...topLeft, width: (viewport.width + overscan * 2) / view.scale, height: (viewport.height + overscan * 2) / view.scale }
}
export function hitNetworkNode<T extends Point>(nodes: readonly T[], point: Point, view: ViewTransform, size: Size): T | undefined {
  const world = networkPoint(point, view)
  return nodes.find(node => world.x >= node.x && world.x <= node.x + size.width && world.y >= node.y && world.y <= node.y + size.height)
}
