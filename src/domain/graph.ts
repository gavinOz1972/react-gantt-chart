import type { ScheduleError, TaskInput } from '../types/scheduling'

/** Code-point ordering, independent of locale and source array order. */
export const compareIds = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0

export function orderTasks(tasks: readonly TaskInput[]): { order: string[]; errors: ScheduleError[] } {
  const errors: ScheduleError[] = []
  const byId = new Map(tasks.map(task => [task.taskId, task]))
  const children = new Map(tasks.map(task => [task.taskId, [] as string[]]))
  for (const task of tasks) {
    const seen = new Set<string>()
    for (const id of task.predecessorTaskIds) {
      const context = { taskId: task.taskId, field: 'predecessorTaskIds', relatedTaskIds: [id] }
      if (seen.has(id)) errors.push({ ...context, code: 'DUPLICATE_PREDECESSOR', message: `Remove the repeated predecessor ${id} from task ${task.taskId}.` })
      seen.add(id)
      if (id === task.taskId) errors.push({ ...context, code: 'SELF_DEPENDENCY', message: `Task ${id} cannot depend on itself.` })
      else if (!byId.has(id)) errors.push({ ...context, code: 'MISSING_PREDECESSOR', message: `Task ${task.taskId} references missing predecessor ${id}.` })
      else children.get(id)!.push(task.taskId)
    }
  }
  if (errors.length) return { order: [], errors }
  for (const list of children.values()) list.sort(compareIds)
  const remaining = new Map(tasks.map(task => [task.taskId, task.predecessorTaskIds.length]))
  const ready = tasks.filter(task => !task.predecessorTaskIds.length).map(task => task.taskId).sort(compareIds)
  const order: string[] = []
  while (ready.length) {
    const id = ready.shift()!
    order.push(id)
    for (const child of children.get(id)!) {
      const count = remaining.get(child)! - 1
      remaining.set(child, count)
      if (count === 0) ready.push(child)
    }
    ready.sort(compareIds)
  }
  if (order.length === tasks.length) return { order, errors: [] }

  // Iterative DFS returns an actual closed cycle, excluding merely blocked descendants.
  const visited = new Set<string>()
  for (const root of [...byId.keys()].sort(compareIds)) {
    if (visited.has(root)) continue
    const stack = [{ id: root, next: 0 }]
    const active = new Map<string, number>([[root, 0]])
    visited.add(root)
    while (stack.length) {
      const frame = stack[stack.length - 1]
      const edges = children.get(frame.id)!
      if (frame.next === edges.length) {
        active.delete(frame.id)
        stack.pop()
        continue
      }
      const child = edges[frame.next++]
      const position = active.get(child)
      if (position !== undefined) {
        const cycle = [...stack.slice(position).map(entry => entry.id), child]
        return { order: [], errors: [{ code: 'DEPENDENCY_CYCLE', field: 'predecessorTaskIds', relatedTaskIds: cycle, message: `Remove a dependency to break this cycle: ${cycle.join(' -> ')}.` }] }
      }
      if (!visited.has(child)) {
        visited.add(child)
        active.set(child, stack.length)
        stack.push({ id: child, next: 0 })
      }
    }
  }
  throw new Error('Invalid graph state: a topological ordering failed without a cycle.')
}
