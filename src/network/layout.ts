import type { CriticalPathResult, TaskInput } from '../domain'

export const NODE_WIDTH = 240
export const NODE_HEIGHT = 132
const COLUMN_STEP = NODE_WIDTH + 88
const ROW_STEP = NODE_HEIGHT + 48
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
export interface NetworkNode { taskId: string; x: number; y: number; level: number; nameLines: string[] }
export interface NetworkEdge { key: string; predecessorId: string; successorId: string; critical: boolean; path: string; minX: number; maxX: number; minY: number; maxY: number }

function nameLines(name: string): string[] {
  const text = name.trim()
  if (text.length <= 29) return [text]
  let split = text.lastIndexOf(' ', 29)
  if (split < 8) split = 29
  const rest = text.slice(split).trim()
  return [text.slice(0, split), rest.length > 29 ? `${rest.slice(0, 28)}…` : rest]
}

/** DAG layout is display geometry; levels are not dates or scheduled working hours. */
export function layoutNetwork(tasks: readonly TaskInput[], analysis: Extract<CriticalPathResult, { ok: true }>) {
  const byId = new Map(tasks.map(task => [task.taskId, task]))
  const levels = new Map<string, number>()
  const columns: string[][] = []
  for (const id of analysis.topologicalTaskIds) {
    const task = byId.get(id)!
    const level = task.predecessorTaskIds.reduce((maximum, parent) => Math.max(maximum, levels.get(parent)! + 1), 0)
    levels.set(id, level)
    ;(columns[level] ??= []).push(id)
  }
  const ranks = new Map<string, number>()
  for (const column of columns) {
    const parentRank = (id: string) => {
      const parents = byId.get(id)!.predecessorTaskIds
      return parents.length ? parents.reduce((sum, parent) => sum + ranks.get(parent)!, 0) / parents.length : 0
    }
    column.sort((a, b) => parentRank(a) - parentRank(b) || compare(a, b))
    column.forEach((id, index) => ranks.set(id, index))
  }
  const maxRows = columns.reduce((maximum, column) => Math.max(maximum, column.length), 0)
  const nodes: NetworkNode[] = columns.flatMap((column, level) => column.map((taskId, index) => ({
    taskId, level, x: 24 + level * COLUMN_STEP, y: 24 + ((maxRows - column.length) / 2 + index) * ROW_STEP, nameLines: nameLines(byId.get(taskId)!.name),
  })))
  const positions = new Map(nodes.map(node => [node.taskId, node]))
  const incoming = new Map(tasks.map(task => [task.taskId, [...task.predecessorTaskIds].sort(compare)]))
  const outgoing = new Map(tasks.map(task => [task.taskId, [] as string[]]))
  for (const relation of analysis.relationships) outgoing.get(relation.predecessorId)!.push(relation.successorId)
  for (const children of outgoing.values()) children.sort(compare)
  const port = (ids: string[], id: string) => (ids.indexOf(id) - (ids.length - 1) / 2) * Math.min(12, NODE_HEIGHT / (ids.length + 1))
  const edges: NetworkEdge[] = analysis.relationships.map(relation => {
    const source = positions.get(relation.predecessorId)!
    const target = positions.get(relation.successorId)!
    const fromX = source.x + NODE_WIDTH
    const fromY = source.y + NODE_HEIGHT / 2 + port(outgoing.get(source.taskId)!, target.taskId)
    const toX = target.x
    const toY = target.y + NODE_HEIGHT / 2 + port(incoming.get(target.taskId)!, source.taskId)
    const middleX = fromX + Math.max(24, (toX - fromX) / 2)
    return { ...relation, path: `M ${fromX} ${fromY} H ${middleX} V ${toY} H ${toX}`, minX: fromX, maxX: toX, minY: Math.min(fromY, toY), maxY: Math.max(fromY, toY) }
  })
  return { nodes, edges, width: columns.length ? 48 + (columns.length - 1) * COLUMN_STEP + NODE_WIDTH : 0,
    height: maxRows ? 48 + (maxRows - 1) * ROW_STEP + NODE_HEIGHT : 0 }
}
