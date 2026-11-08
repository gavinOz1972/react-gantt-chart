import type { ProjectSettings, TaskInput, WorkingSlot } from '../../types/scheduling'
import { emptyProgress, transitionTask } from '../../progress/taskProgress'
import type { TaskStatus } from '../../progress/taskProgress'
import type { WorkingInput, WorkingState } from '../workingPlan'

// Supplied old plans and expected answers are literals, never evaluator output.
export const date = (day: number) => `2026-11-${String(day).padStart(2, '0')}`
export const at = (day: number, hour = 1): WorkingSlot => ({ date: date(day), hour })
export interface Row { id: string; duration: number; start: number; end: number; hour?: number; after?: number; floor?: number; predecessors?: string[]; manual?: number }
export function fixture(rows: Row[], review = 6, projectStart = 2, weekdays = [1, 2, 3, 4, 5]): WorkingInput {
  const project: ProjectSettings = { projectId: 'WP742-DISPOSABLE', name: 'Pure evaluator fixture', projectStartDate: date(projectStart), targetEndDate: '2027-01-29', workingWeekdays: weekdays as ProjectSettings['workingWeekdays'], workingHoursPerDay: 4 }
  const tasks: TaskInput[] = rows.map(row => ({ taskId: row.id, name: row.id, description: 'Fictional hand-specified plan', durationHours: row.duration, predecessorTaskIds: row.predecessors ?? [], ...(row.manual ? { independentStartMode: 'MANUAL' as const, requestedStartDate: date(row.manual) } : { independentStartMode: 'DEFAULT' as const }) }))
  const constraints: WorkingState['constraints'] = Object.fromEntries(rows.map((r, i) => [r.id, { notBefore: at(r.floor ?? r.start), origin: 'SeededLegacy', decisionId: `D${i}` }]))
  const commitments: WorkingState['commitments'] = Object.fromEntries(rows.map((r, i) => [r.id, { kind: 'Known', start: at(r.start, r.hour), finish: { date: date(r.end), afterHour: r.after ?? 4 }, decisionId: `D${i}` }]))
  return { project, tasks, progress: emptyProgress(), actualStarts: new Map(), current: { revisionId: 'W-before', ruleVersion: 1, calendar: project, constraints, commitments }, proposedFloors: new Map(rows.map(r => [r.id, at(r.floor ?? r.start)])), holds: new Map(), affectedIds: [], reviewDate: date(review) }
}
export function move(input: WorkingInput, id: string, target: TaskStatus, day: number, reference?: number): WorkingInput {
  const next = transitionTask(input.progress, id, { target, date: date(day), eventId: `E${input.progress.events.length}`, recordedAt: '2026-11-30T12:00:00.000Z', completionAcknowledged: true, noCriteriaAcknowledged: true, reopenAcknowledged: true, reason: 'Explicit fictional decision', ...(reference ? { committedFinishDateAtCompletion: date(reference) } : {}) }, input.tasks.map(t => t.taskId))
  if (!next.ok) throw new Error(next.errors.map(e => e.message).join(' '))
  return { ...input, progress: next.value }
}
export function affected(input: WorkingInput, ids: string[], keep = false): WorkingInput {
  return { ...input, affectedIds: ids, holds: new Map(ids.map(id => [id, keep ? input.current.commitments[id].start! : null])) }
}
export function floor(input: WorkingInput, id: string, day: number, hour = 1): WorkingInput {
  return { ...input, proposedFloors: new Map([...input.proposedFloors, [id, at(day, hour)]]) }
}
export function early(): WorkingInput {
  return move(fixture([{ id: 'A', duration: 20, start: 9, end: 13 }, { id: 'B', duration: 4, start: 16, end: 16, predecessors: ['A'] }, { id: 'C', duration: 4, start: 17, end: 17, predecessors: ['B'] }], 11, 9), 'A', 'Complete', 11, 13)
}
export function caseInput(id: string): WorkingInput {
  switch (id) {
    case 'C01': return floor(affected(move(fixture([{ id: 'A', duration: 4, start: 2, end: 2 }, { id: 'B', duration: 4, start: 3, end: 3, predecessors: ['A'] }], 9), 'A', 'Complete', 9, 2), ['B']), 'B', 9)
    case 'C02': return affected(fixture([{ id: 'P', duration: 2, start: 9, end: 9, after: 2, manual: 9 }, { id: 'B', duration: 2, start: 9, hour: 3, end: 9, floor: 9, predecessors: ['P'] }], 9), ['B'])
    case 'C03': return affected(fixture([{ id: 'P', duration: 1, start: 9, end: 9, after: 1, manual: 9 }, { id: 'B', duration: 2, start: 9, hour: 3, end: 9, floor: 9, predecessors: ['P'] }], 9), ['B'], true)
    case 'C04': return { ...caseInput('C03'), holds: new Map([['B', null]]) }
    case 'C05': return affected(move(fixture([{ id: 'A', duration: 4, start: 2, end: 2 }, { id: 'P', duration: 2, start: 9, end: 9, after: 2, manual: 9 }, { id: 'J', duration: 2, start: 9, hour: 3, end: 9, floor: 9, predecessors: ['A', 'P'] }]), 'A', 'Complete', 6, 2), ['J'])
    case 'C06': case 'E14': return floor(affected(move(move(fixture([{ id: 'A', duration: 4, start: 2, end: 2 }, { id: 'B', duration: 4, start: 2, end: 2 }, { id: 'J', duration: 4, start: 3, end: 3, predecessors: ['A', 'B'] }]), 'A', 'Complete', 6, 2), 'B', 'Complete', 6, 2), ['J']), 'J', 6)
    case 'C07': return affected(move(fixture([{ id: 'A', duration: 4, start: 2, end: 2 }, { id: 'B', duration: 4, start: 3, end: 3, predecessors: ['A'] }, { id: 'C', duration: 4, start: 4, end: 4, predecessors: ['B'] }]), 'A', 'Complete', 6, 2), ['B', 'C'], true)
    case 'C08': return affected(early(), ['B'], true)
    case 'C08-advance': return floor(affected(early(), ['B']), 'B', 12)
    case 'C09': {
      // P's unspecified duration/start is8 slots Nov12-13, a known future window.
      const value = fixture([{ id: 'A', duration: 20, start: 9, end: 13 }, { id: 'P', duration: 8, start: 12, end: 13, manual: 12 }, { id: 'B', duration: 4, start: 16, end: 16, predecessors: ['A', 'P'] }], 11, 9)
      return floor(affected(move(value, 'A', 'Complete', 11, 13), ['B']), 'B', 12)
    }
    case 'C10': return { ...caseInput('C08-advance'), reviewDate: date(16) }
    case 'C11': return affected(early(), ['B']) // Explicit null hold does not remove the retained availability floor16.
    case 'C12': return affected(move(fixture([{ id: 'A', duration: 4, start: 2, end: 2 }, { id: 'B', duration: 4, start: 5, end: 5, predecessors: ['A'] }], 2, 2, [1, 4, 5]), 'A', 'Complete', 2, 2), ['B']) // Requested Tue3 is supplied normalized to Thu5, per approved Slot interface.
    case 'E13': return affected(move(fixture([{ id: 'A', duration: 4, start: 2, end: 2 }, { id: 'B', duration: 4, start: 3, end: 3, predecessors: ['A'] }, { id: 'C', duration: 4, start: 3, end: 3, predecessors: ['A'] }, { id: 'D', duration: 4, start: 4, end: 4, predecessors: ['B', 'C'] }]), 'A', 'Complete', 6, 2), ['B', 'C', 'D'], true)
    case 'E15': return affected(fixture([{ id: 'P', duration: 4, start: 2, end: 2 }, { id: 'J', duration: 4, start: 3, end: 3, predecessors: ['P'] }]), ['J'])
    case 'E18': return { ...caseInput('C01'), reviewDate: date(6), proposedFloors: new Map([['A', at(2)], ['B', at(3)]]) }
    default: throw new Error(`Unknown literal fixture ${id}`)
  }
}
export const literalAnswers = [
  ['C01', 'B', 10, 1, 10, 4], ['C02', 'B', 9, 3, 9, 4],
  ['C03', 'B', 9, 3, 9, 4], ['C04', 'B', 9, 2, 9, 3],
  ['C05', 'J', 9, 3, 9, 4], ['C06', 'J', 9, 1, 9, 4],
  ['C07', 'B', 9, 1, 9, 4], ['C07', 'C', 10, 1, 10, 4],
  ['C08', 'B', 16, 1, 16, 4], ['C08-advance', 'B', 12, 1, 12, 4],
  ['C09', 'B', 16, 1, 16, 4], ['C11', 'B', 16, 1, 16, 4],
  ['C12', 'B', 5, 1, 5, 4], ['E13', 'B', 9, 1, 9, 4],
  ['E13', 'C', 9, 1, 9, 4], ['E13', 'D', 10, 1, 10, 4],
  ['E14', 'J', 9, 1, 9, 4],
] as const
