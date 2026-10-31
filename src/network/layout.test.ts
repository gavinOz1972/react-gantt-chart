// @vitest-environment node
import { expect, test } from 'vitest'
import { analyzeCriticalPath } from '../domain'
import type { ProjectSettings, TaskInput } from '../domain'
import { layoutNetwork, NODE_HEIGHT, NODE_WIDTH } from './layout'

const project: ProjectSettings = { projectId: 'P', name: 'Network', projectStartDate: '2026-11-02', targetEndDate: '2026-12-01', workingWeekdays: [1, 4], workingHoursPerDay: 2 }
const make = (taskId: string, durationHours: number, predecessorTaskIds: string[] = []): TaskInput => ({ taskId, name: `Task ${taskId} with a descriptive title that needs truncation`, description: '', durationHours, predecessorTaskIds, independentStartMode: 'DEFAULT' })
const tasks = [make('A', 1), make('B', 3), make('C', 1, ['A', 'B']), make('D', 1, ['C'])]
function layout(source = tasks) {
  const analysis = analyzeCriticalPath(project, source)
  if (!analysis.ok) throw new Error(JSON.stringify(analysis.errors))
  return layoutNetwork(source, analysis)
}

test('A08 multiple roots and joins produce all directed edges and nonoverlapping nodes', () => {
  const result = layout()
  expect(result.nodes).toHaveLength(4)
  expect(result.edges.map(edge => [edge.predecessorId, edge.successorId])).toEqual([['A', 'C'], ['B', 'C'], ['C', 'D']])
  for (const a of result.nodes) for (const b of result.nodes) {
    if (a.taskId === b.taskId) continue
    expect(a.x + NODE_WIDTH <= b.x || b.x + NODE_WIDTH <= a.x || a.y + NODE_HEIGHT <= b.y || b.y + NODE_HEIGHT <= a.y).toBe(true)
  }
  for (const edge of result.edges) expect(edge.minX).toBeLessThan(edge.maxX)
  expect(result.nodes.every(node => node.nameLines.length <= 2 && node.nameLines.every(line => line.length <= 29))).toBe(true)
})

test('layout is stable after source reordering, and never changes task inputs', () => {
  const snapshot = structuredClone(tasks)
  expect(layout([...tasks].reverse())).toEqual(layout())
  expect(tasks).toEqual(snapshot)
})

test('critical relationships come directly from domain analysis', () => {
  expect(layout().edges.map(edge => [edge.predecessorId, edge.critical])).toEqual([['A', false], ['B', true], ['C', true]])
})
