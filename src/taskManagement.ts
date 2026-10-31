import type { ScheduleResult, TaskInput } from './domain'

export const SORT_MODES = ['manual', 'start', 'name', 'duration'] as const
export type SortMode = typeof SORT_MODES[number]
export type DuplicateOrigins = Readonly<Record<string, string>>

/** Presentation order never mutates source tasks or dependency identities. */
export function displayTasks(tasks: readonly TaskInput[], order: readonly string[], mode: SortMode, result: ScheduleResult): TaskInput[] {
  const rank = new Map(order.map((id, index) => [id, index]))
  const starts = new Map(result.ok ? result.tasks.map(task => [task.taskId, `${task.startDate}:${String(task.startSlot.hour).padStart(16, '0')}`]) : [])
  const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
  return [...tasks].sort((a, b) => {
    const tie = (rank.get(a.taskId) ?? tasks.length) - (rank.get(b.taskId) ?? tasks.length)
    if (mode === 'name') return compare(a.name.toLocaleLowerCase('en'), b.name.toLocaleLowerCase('en')) || tie
    if (mode === 'duration') return a.durationHours - b.durationHours || tie
    if (mode === 'start') return compare(starts.get(a.taskId) ?? '', starts.get(b.taskId) ?? '') || tie
    return tie
  })
}

export function moveBefore(order: readonly string[], id: string, before: string): string[] {
  if (id === before || !order.includes(id) || !order.includes(before)) return [...order]
  const next = order.filter(value => value !== id)
  next.splice(next.indexOf(before), 0, id)
  return next
}

export function insertCopy(order: readonly string[], original: string, copy: string): string[] {
  const next = [...order]
  next.splice(next.indexOf(original) + 1, 0, copy)
  return next
}

export function duplicateTask(task: TaskInput, taskId: string, tasks: readonly TaskInput[]): TaskInput {
  const names = new Set(tasks.map(entry => entry.name))
  let name = `${task.name} (Copy)`
  for (let number = 2; names.has(name); number++) name = `${task.name} (Copy ${number})`
  return { ...task, taskId, name, predecessorTaskIds: [...task.predecessorTaskIds] }
}
