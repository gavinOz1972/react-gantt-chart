import { calculateSchedule, createWorkingCalendar, createWorkingTimeIndex, dateToOrdinal, ordinalToDate, SchedulingError } from '../domain'
import type { CalendarSettings, FinishBoundary, ProjectSettings, TaskInput, WorkingSlot } from '../types/scheduling'
import { compareIds, orderTasks } from '../domain/graph'
import { decodeProgress, progressForTask } from '../progress/taskProgress'
import type { ProgressTracking, StatusEvent } from '../progress/taskProgress'

/** Read models only. No file format, revision writer or application consumer. */
export type Commitment =
  | { readonly kind: 'Known'; readonly start: WorkingSlot; readonly finish: FinishBoundary; readonly decisionId: string }
  | { readonly kind: 'ReferenceOnly'; readonly start: WorkingSlot | null; readonly finish: FinishBoundary | null; readonly reason: string; readonly decisionId: string }
export interface WorkingState {
  readonly revisionId: string
  readonly ruleVersion: 1
  readonly calendar: CalendarSettings
  readonly constraints: Readonly<Record<string, { readonly notBefore: WorkingSlot; readonly origin: 'SeededLegacy' | 'Confirmed'; readonly decisionId: string }>>
  readonly commitments: Readonly<Record<string, Commitment>>
}
export type ActualStart = { readonly kind: 'Known'; readonly date: string; readonly eventId: string } | { readonly kind: 'Unknown' }
export interface WorkingInput {
  readonly project: Readonly<ProjectSettings>
  readonly tasks: readonly TaskInput[]
  readonly progress: Readonly<ProgressTracking>
  readonly actualStarts: ReadonlyMap<string, ActualStart>
  readonly current: Readonly<WorkingState>
  readonly proposedFloors: ReadonlyMap<string, WorkingSlot>
  readonly holds: ReadonlyMap<string, WorkingSlot | null>
  readonly affectedIds: readonly string[]
  readonly reviewDate: string
}
export interface Issue { readonly code: string; readonly taskId?: string; readonly relatedIds?: readonly string[]; readonly message: string }
export interface Bound {
  readonly kind: 'Project' | 'Floor' | 'Hold' | 'ReviewDate' | 'Predecessor'
  readonly slot: WorkingSlot
  readonly predecessorId?: string
  readonly eventId?: string
  readonly precision: 'PlannedSlot' | 'ConservativeActualDate'
  /** Distinguish the two floor sources without inventing another bound kind. */
  readonly source?: 'NotBefore' | 'IndependentRoot'
}
export type Candidate =
  | { readonly kind: 'Known'; readonly taskId: string; readonly notBefore: WorkingSlot; readonly start: WorkingSlot; readonly finish: FinishBoundary; readonly binding: readonly Bound[] }
  | { readonly kind: 'Unknown'; readonly taskId: string; readonly reasons: readonly string[]; readonly lowerBounds: readonly Bound[] }
  | { readonly kind: 'ActualOnly'; readonly taskId: string; readonly actualDate: string; readonly release: WorkingSlot | null }
  | { readonly kind: 'Retained'; readonly taskId: string; readonly currentCommitment: Commitment; readonly feasibilityIssues: readonly string[] }
export type WorkingResult = { readonly ok: false; readonly issues: readonly Issue[] } | {
  readonly ok: true; readonly ruleVersion: 1; readonly topologicalIds: readonly string[]
  readonly candidates: readonly Candidate[]; readonly requiredReviewIds: readonly string[]; readonly conflicts: readonly string[]
  readonly project: { readonly kind: 'Actual' | 'Conditional' | 'Unknown'; readonly date: string | null; readonly finish: FinishBoundary | null; readonly uncertain: boolean }
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const recordsArray = (value: unknown): boolean => Array.isArray(value) && value.every(record)
const own = (value: object, id: string) => Object.hasOwn(value, id)
const sameSlot = (a: WorkingSlot, b: WorkingSlot) => a.date === b.date && a.hour === b.hour
const slot = (value: WorkingSlot): WorkingSlot => ({ date: value.date, hour: value.hour })
function copyCommitment(value: Commitment): Commitment {
  return value.kind === 'Known'
    ? { ...value, start: slot(value.start), finish: { ...value.finish } }
    : { ...value, start: value.start ? slot(value.start) : null, finish: value.finish ? { ...value.finish } : null }
}
function failure(issues: readonly Issue[]): WorkingResult {
  return { ok: false, issues: [...issues].sort((a, b) => compareIds(a.taskId ?? '', b.taskId ?? '') || compareIds(a.code, b.code) || compareIds(a.message, b.message)) }
}
const invalid = (code: string, message: string, taskId?: string): WorkingResult => failure([{ code, message, ...(taskId === undefined ? {} : { taskId }) }])
function mapLike(value: unknown): boolean {
  return value !== null && typeof value === 'object' && ['get', 'has', 'keys', 'entries'].every(key => typeof (value as Record<string, unknown>)[key] === 'function') && typeof (value as ReadonlyMap<unknown, unknown>)[Symbol.iterator] === 'function'
}

/** Pure explicit-input proposal. Never advances/severs/attests/commits on a caller's behalf. */
export function evaluateWorkingCandidate(input: WorkingInput): WorkingResult {
  try {
    if (!record(input) || !record(input.project) || !recordsArray(input.tasks)) return invalid('INVALID_INPUT', 'Provide project and task records.')
    // Reuse established source validation only; its scheduled dates are not W*.
    const validated = calculateSchedule(input.project, input.tasks)
    if (!validated.ok) return failure(validated.errors.map(e => ({ code: e.code, message: e.message, taskId: e.taskId, relatedIds: e.relatedTaskIds })))
    dateToOrdinal(input.reviewDate, 'Review date')
    const ids = new Set(input.tasks.map(t => t.taskId)), byId = new Map(input.tasks.map(t => [t.taskId, t]))
    const decoded = decodeProgress(input.progress, [...ids].sort(compareIds))
    if (!decoded.ok) return failure(decoded.errors)
    if (![input.actualStarts, input.proposedFloors, input.holds].every(mapLike)) return invalid('INVALID_MAP', 'Use read-only map inputs for facts, floors and explicit holds.')
    if (!Array.isArray(input.affectedIds) || input.affectedIds.some(id => !ids.has(id)) || new Set(input.affectedIds).size !== input.affectedIds.length) return invalid('INVALID_AFFECTED_IDS', 'Affected IDs must be unique current task IDs.')
    const affected = new Set(input.affectedIds), current = input.current
    if (!record(current) || current.ruleVersion !== 1 || typeof current.revisionId !== 'string' || !current.revisionId || !record(current.calendar) || !record(current.constraints) || !record(current.commitments)) return invalid('INVALID_CURRENT', 'Provide a version1 current working read model.')
    const calendar = createWorkingCalendar(input.project), time = createWorkingTimeIndex(input.project)
    const oldTime = createWorkingTimeIndex(current.calendar)
    const checkSlot = (value: WorkingSlot, index = time) => {
      if (!record(value) || typeof value.date !== 'string' || typeof value.hour !== 'number') throw new SchedulingError({ code: 'INVALID_SLOT', field: 'slot', message: 'Provide a planned working date and numbered hour.' })
      return index.startIndex(value)
    }
    const checkFinish = (value: FinishBoundary, index = time) => {
      if (!record(value) || typeof value.date !== 'string' || typeof value.afterHour !== 'number') throw new SchedulingError({ code: 'INVALID_SLOT', field: 'finish', message: 'Provide a planned finish boundary.' })
      return index.finishIndex(value)
    }
    for (const id of Object.keys(current.constraints).sort(compareIds)) {
      const constraint = current.constraints[id]
      if (!record(constraint) || !['SeededLegacy', 'Confirmed'].includes(constraint.origin) || typeof constraint.decisionId !== 'string') return invalid('INVALID_CURRENT', 'Invalid old constraint.', id)
      checkSlot(constraint.notBefore, oldTime)
      if (!own(current.commitments, id)) return invalid('INVALID_CURRENT', 'Old constraint has no commitment.', id)
    }
    for (const id of Object.keys(current.commitments).sort(compareIds)) {
      const old = current.commitments[id]
      if (!own(current.constraints, id) || !record(old) || !['Known', 'ReferenceOnly'].includes(old.kind) || typeof old.decisionId !== 'string') return invalid('INVALID_CURRENT', 'Invalid old commitment.', id)
      if (old.kind === 'Known' || old.start !== null) checkSlot(old.start!, oldTime)
      if (old.kind === 'Known' || old.finish !== null) checkFinish(old.finish!, oldTime)
      if (old.start && old.finish && oldTime.finishIndex(old.finish) <= oldTime.startIndex(old.start)) return invalid('INVALID_CURRENT', 'Old finish must follow its planned start.', id)
      if (old.kind === 'ReferenceOnly' && (typeof old.reason !== 'string' || !old.reason.trim())) return invalid('INVALID_CURRENT', 'An unverified reference needs a reason.', id)
    }
    for (const map of [input.actualStarts, input.proposedFloors, input.holds]) for (const id of map.keys()) if (!ids.has(id)) return invalid('UNKNOWN_INPUT_ID', 'A map references a missing candidate task.', String(id))
    for (const id of [...ids].sort(compareIds)) {
      if (!input.proposedFloors.has(id)) return invalid('MISSING_FLOOR', 'Every candidate task needs a floor.', id)
      const floor = input.proposedFloors.get(id)!
      checkSlot(floor)
      const unchanged = own(current.constraints, id) && sameSlot(floor, current.constraints[id].notBefore)
      if (!unchanged && (floor.date < input.reviewDate || floor.date < input.project.projectStartDate)) return invalid('PAST_PLANNED_FLOOR', 'A new or changed floor cannot precede review/project start.', id)
      if (!affected.has(id) && (!unchanged || !own(current.commitments, id))) return invalid('UNAFFECTED_EDIT', 'New tasks or changed floors must be explicitly affected.', id)
      if (affected.has(id) && !input.holds.has(id)) return invalid('MISSING_HOLD', 'Choose an exact Keep hold or explicit null replacement.', id)
      if (input.holds.has(id) && input.holds.get(id) !== null) {
        const hold = input.holds.get(id)!, old = own(current.commitments, id) ? current.commitments[id] : undefined
        checkSlot(hold)
        if (old?.kind !== 'Known' || !sameSlot(hold, old.start)) return invalid('INVALID_HOLD', 'Keep must match the exact prior Known start.', id)
      }
      const fact = input.actualStarts.get(id)
      if (fact !== undefined) {
        if (!record(fact) || !['Known', 'Unknown'].includes(fact.kind)) return invalid('INVALID_ACTUAL_START', 'Use a date-only Known fact or Unknown.', id)
        if (fact.kind === 'Known') {
          dateToOrdinal(fact.date)
          if (typeof fact.eventId !== 'string' || !fact.eventId.trim()) return invalid('INVALID_ACTUAL_START', 'A known start needs its evidence ID.', id)
        }
      }
    }

    const completions = new Map<string, StatusEvent>()
    for (const event of decoded.value.events) if (event.toStatus === 'Complete') completions.set(event.taskId, event)
    const active = (id: string) => progressForTask(decoded.value, id).status === 'Complete' ? completions.get(id) : undefined
    const order = orderTasks(input.tasks).order, results = new Map<string, Candidate>()
    type Ready = { finish?: FinishBoundary; actualDate?: string; release: WorkingSlot | null; eventId?: string }
    const readiness = new Map<string, Ready>(), required = new Set<string>(), conflicts = new Set<string>()
    const maxDate = dateToOrdinal('9999-12-31')
    for (const id of order) {
      const task = byId.get(id)!, status = progressForTask(decoded.value, id).status, completion = active(id)
      const startFact = input.actualStarts.get(id), historical = completions.get(id)
      if (startFact?.kind === 'Known' && completion && startFact.date > completion.date) conflicts.add(`${id}: actual start ${startFact.date} follows completion ${completion.date}.`)
      for (const predecessor of [...task.predecessorTaskIds].sort(compareIds)) {
        const pred = active(predecessor)
        if (!pred || pred.date > input.reviewDate) continue
        if (completion && completion.date <= input.reviewDate && completion.date < pred.date) conflicts.add(`${id}: completion ${completion.date} precedes retained predecessor ${predecessor} completion ${pred.date}.`)
        if (startFact?.kind === 'Known' && startFact.date <= input.reviewDate && startFact.date < pred.date) conflicts.add(`${id}: actual start ${startFact.date} precedes retained predecessor ${predecessor} completion ${pred.date}.`)
      }
      if (completion && completion.date <= input.reviewDate) {
        const ordinal = dateToOrdinal(completion.date)
        // A valid last-date leaf is representable even when no later release exists.
        let release: WorkingSlot | null = null
        if (ordinal < maxDate) {
          try { release = calendar.firstSlotOnOrAfter(ordinalToDate(ordinal + 1)) }
          catch (error) { if (!(error instanceof SchedulingError) || error.detail.code !== 'DATE_OUT_OF_RANGE') throw error }
        }
        results.set(id, { kind: 'ActualOnly', taskId: id, actualDate: completion.date, release })
        readiness.set(id, { actualDate: completion.date, release, eventId: completion.eventId })
        continue
      }
      const unknown = completion ? 'Completion is future-effective relative to review date.'
        : historical ? 'Reopened: old completion is history; remaining scheduled duration is Unknown.'
          : status !== 'Not Started' ? `${status}: remaining scheduled duration/restart is Unknown.`
            : startFact?.kind === 'Known' ? 'Actual Start evidence is inconsistent with ordinary Not Started or future-effective.' : null
      if (unknown) {
        if (status === 'Not Started' && !historical && startFact?.kind === 'Known' && startFact.date <= input.reviewDate) conflicts.add(`${id}: attested start conflicts with ordinary Not Started.`)
        results.set(id, { kind: 'Unknown', taskId: id, reasons: [unknown], lowerBounds: [] })
        continue
      }
      const floor = input.proposedFloors.get(id)!
      const bounds: Bound[] = [
        { kind: 'Project', slot: calendar.firstSlotOnOrAfter(input.project.projectStartDate), precision: 'PlannedSlot' },
        { kind: 'Floor', source: 'NotBefore', slot: slot(floor), precision: 'PlannedSlot' },
      ]
      if (!task.predecessorTaskIds.length && task.independentStartMode === 'MANUAL') bounds.push({ kind: 'Floor', source: 'IndependentRoot', slot: calendar.firstSlotOnOrAfter(task.requestedStartDate), precision: 'PlannedSlot' })
      if (affected.has(id)) {
        bounds.push({ kind: 'ReviewDate', slot: calendar.firstSlotOnOrAfter(input.reviewDate), precision: 'PlannedSlot' })
        const hold = input.holds.get(id)
        if (hold) bounds.push({ kind: 'Hold', slot: slot(hold), precision: 'PlannedSlot' })
      }
      const reasons: string[] = []
      for (const predecessor of [...task.predecessorTaskIds].sort(compareIds)) {
        const pred = readiness.get(predecessor)
        if (!pred) {
          reasons.push(`${predecessor}: required readiness is Unknown.`)
          if (!affected.has(predecessor)) required.add(predecessor)
        } else {
          const release = pred.finish ? calendar.slotAfter(pred.finish) : pred.release
          if (!release) throw new SchedulingError({ code: 'DATE_OUT_OF_RANGE', field: 'release', taskId: id, message: `${predecessor}: no supported working date after the actual completion.` })
          bounds.push({ kind: 'Predecessor', slot: slot(release), predecessorId: predecessor, ...(pred.eventId ? { eventId: pred.eventId } : {}), precision: pred.actualDate ? 'ConservativeActualDate' : 'PlannedSlot' })
        }
      }
      if (!affected.has(id)) {
        const old = current.commitments[id]
        if (old.kind !== 'Known') reasons.push('The old promise is ReferenceOnly, not a supported future commitment.')
        else {
          try {
            const startIndex = checkSlot(old.start), finishIndex = checkFinish(old.finish)
            if (old.start.date < input.reviewDate) reasons.push('Past unfinished promise requires prerequisite review.')
            if (finishIndex - startIndex !== BigInt(task.durationHours)) reasons.push('Changed duration/calendar requires review of this promise.')
            if (bounds.some(b => time.startIndex(b.slot) > startIndex)) reasons.push('Retained constraints require a later start; no automatic revision.')
          } catch (error) { if (!(error instanceof SchedulingError)) throw error; reasons.push('Old promise is not valid on the candidate calendar; review required.') }
        }
        results.set(id, { kind: 'Retained', taskId: id, currentCommitment: copyCommitment(old), feasibilityIssues: reasons })
        if (!reasons.length && old.kind === 'Known') readiness.set(id, { finish: { ...old.finish }, release: null })
        else required.add(id)
        continue
      }
      if (reasons.length) { results.set(id, { kind: 'Unknown', taskId: id, reasons, lowerBounds: bounds }); continue }
      const maximum = bounds.reduce((n, b) => time.startIndex(b.slot) > n ? time.startIndex(b.slot) : n, 0n)
      const start = time.slotAt(maximum), finish = calendar.advanceWorkingSlots(start, task.durationHours)
      results.set(id, { kind: 'Known', taskId: id, notBefore: slot(floor), start, finish, binding: bounds.filter(b => time.startIndex(b.slot) === maximum) })
      // Compute a planned release only when a successor actually needs it.
      readiness.set(id, { finish, release: null })
    }
    const candidates = [...results.values()].sort((a, b) => compareIds(a.taskId, b.taskId))
    const uncertain = conflicts.size > 0 || candidates.some(c => c.kind === 'Unknown' || c.kind === 'Retained' && c.feasibilityIssues.length > 0)
    const endpoints = [...readiness.values()].flatMap<{ date: string; actual: boolean; finish: FinishBoundary | null }>(r => r.actualDate ? [{ date: r.actualDate, actual: true, finish: null }] : r.finish ? [{ date: r.finish.date, actual: false, finish: r.finish }] : [])
    const date = endpoints.map(e => e.date).sort().at(-1) ?? null
    const controlling = endpoints.filter(e => e.date === date)
    const latest = controlling.reduce<FinishBoundary | null>((last, e) => e.finish && (!last || time.finishIndex(e.finish) > time.finishIndex(last)) ? e.finish : last, null)
    const allActual = candidates.length > 0 && candidates.every(c => c.kind === 'ActualOnly')
    return { ok: true, ruleVersion: 1, topologicalIds: order, candidates, requiredReviewIds: [...required].sort(compareIds), conflicts: [...conflicts].sort(compareIds),
      project: { kind: uncertain ? 'Unknown' : allActual ? 'Actual' : 'Conditional', date: uncertain ? null : date, finish: uncertain || controlling.some(e => e.actual) ? null : latest, uncertain } }
  } catch (error) {
    if (error instanceof SchedulingError) return invalid(error.detail.code, error.message, error.detail.taskId)
    if (error instanceof TypeError) return invalid('INVALID_INPUT', 'Malformed evaluator input; no candidate calculated.')
    throw error
  }
}
