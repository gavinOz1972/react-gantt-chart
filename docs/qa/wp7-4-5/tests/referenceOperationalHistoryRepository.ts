/** TEST-ONLY semantic oracle. Entire fixture data lives in memory; no storage,
 * production codec/JCS, lazy physical I/O, durable transaction or auth claim.
 */
import type { Fingerprint, RepositoryProjectId, RevisionRef, TransactionReceipt, ValidationIssue } from '../../../../src/repository/projectRepository'
import type { ArchiveRecord, AtomicChangeRequest, ChangeResult, DateFilter, EpisodeFilter, EventRecord, HistoryCursor, HistoryFilter, OperationalHistoryRepository, OperationalView, Page, PageRequest, PortableSink, ReadFailure, ReadResult, ReadSession, ReadSessionId, ReadWatermark, RetainedTask, RetirementEpisode, TaskFilter, TaskSummary } from '../../../../src/repository/operationalHistoryRepository'
import { clone, exact } from './fixtures'
import type { FixtureState } from './fixtures'
import { validDate } from './fixtureSemantics'

export interface ReferenceOptions {
  fingerprint(value: unknown): Fingerprint
  validate(accepted: FixtureState, candidate: FixtureState, request: AtomicChangeRequest): readonly ValidationIssue[]
  now?: () => number
  ttlMs?: number
  supportsPinning?: boolean
}
type ReceiptEntry = { intent: string; receipt: TransactionReceipt }
type Accepted = { state: FixtureState; ref: RevisionRef; receipts: Map<string, ReceiptEntry> }
type Pinned = { session: ReadSession; state: FixtureState | null }
type Live = { session: ReadSession; state: FixtureState }
type Key = readonly (string | number)[]
type CursorValue = { sessionId: ReadSessionId; query: string; key: Key }
let instances = 0
const positive = (n: number) => Number.isSafeInteger(n) && n > 0
const failure = (code: string): ReadFailure => ({ kind: 'ValidationFailure', issues: [{ code, message: 'Reference boundary: ' + code }] })
const compare = (a: Key, b: Key) => { for (let i = 0; i < a.length; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1 } return 0 }
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length
const summary = (t: FixtureState['tasks'][number]): TaskSummary => ({ taskId: t.input.taskId, name: t.input.name, lifecycle: clone(t.lifecycle) })

export class ReferenceOperationalHistoryRepository implements OperationalHistoryRepository {
  private readonly resources = new Map<RepositoryProjectId, Accepted>()
  private readonly sessions = new Map<ReadSessionId, Pinned>()
  private readonly cursors = new Map<HistoryCursor, CursorValue>()
  private readonly namespace: string
  private sessionNumber = 0
  private cursorNumber = 0
  private rejectOnce = false
  private uncertainOnce = false
  private afterPublish?: () => void
  private readonly options: ReferenceOptions
  private clock(): number { return this.options.now?.() ?? performance.now() }
  constructor(namespace: string, trustedSeeds: readonly FixtureState[], options: ReferenceOptions) {
    this.namespace = namespace + ':instance:' + ++instances
    this.options = options
    if (!positive(options.ttlMs ?? 60_000)) throw new Error('Invalid test session lifetime')
    for (const seed of trustedSeeds) {
      if (this.resources.has(seed.resourceId)) throw new Error('Duplicate test resource')
      const state = clone(seed)
      this.resources.set(seed.resourceId, { state, ref: { revision: state.revision, fingerprint: options.fingerprint(clone(state)) }, receipts: new Map() })
    }
  }
  /** Test controls only; never part of the compiled capability. */
  inspectAccepted(id: RepositoryProjectId): FixtureState { return clone(this.resources.get(id)!.state) }
  rejectNextCommit(): void { this.rejectOnce = true }
  loseNextAcknowledgement(afterPublish?: () => void): void { this.uncertainOnce = true; this.afterPublish = afterPublish }
  private watermark(session: ReadSession): ReadWatermark {
    const { resourceId, lineageId, ref, originalBaseline, historyHighWatermark, coverage } = session
    return clone({ resourceId, lineageId, ref, originalBaseline, historyHighWatermark, coverage })
  }
  private probe(session: ReadSession, signal?: AbortSignal): Live | ReadFailure {
    if (signal?.aborted) return { kind: 'Cancelled', outcome: 'NotDispatched' }
    const pinned = this.sessions.get(session?.sessionId)
    if (!pinned) return { kind: 'NotFound', entity: 'Session', id: session?.sessionId ?? '' }
    try { if (exact(pinned.session) !== exact(session)) return failure('SessionMetadataMismatch') } catch { return failure('SessionMetadataMismatch') }
    if (pinned.state === null || this.clock() >= pinned.session.expiresAt) {
      pinned.state = null
      return { kind: 'ReadExpired', sessionId: session.sessionId }
    }
    return { session: pinned.session, state: pinned.state }
  }
  private read<T>(live: Live, value: T): ReadResult<T> { return clone({ kind: 'Read', value, watermark: this.watermark(live.session) }) as ReadResult<T> }
  async openRead(resourceId: RepositoryProjectId, signal?: AbortSignal) {
    if (signal?.aborted) return { kind: 'Cancelled' as const, outcome: 'NotDispatched' as const }
    if (this.options.supportsPinning === false) return { kind: 'Unsupported' as const, code: 'PinnedReadUnsupported', message: 'Explicit test capability setting' }
    const accepted = this.resources.get(resourceId)
    if (!accepted) return { kind: 'NotFound' as const, entity: 'Project' as const, id: resourceId }
    const s = accepted.state, baseline = s.baseline
    let originalBaseline: ReadSession['originalBaseline']
    try { originalBaseline = baseline.kind === 'Absent' ? { kind: 'Absent' } : { kind: 'Present', baselineId: baseline.baselineId, fingerprint: this.options.fingerprint(clone(baseline.value)) } } catch { return failure('BaselineReadBoundaryFailure') }
    const session: ReadSession = { sessionId: `${this.namespace}:session:${++this.sessionNumber}` as ReadSessionId,
      resourceId, lineageId: s.lineageId, ref: clone(accepted.ref), originalBaseline,
      historyHighWatermark: s.nextSequence - 1, coverage: clone(s.coverage), expiresAt: this.clock() + (this.options.ttlMs ?? 60_000) }
    this.sessions.set(session.sessionId, { session: clone(session), state: clone(s) })
    return { kind: 'Opened' as const, session: clone(session) }
  }
  async releaseRead(session: ReadSession) {
    const pinned = this.sessions.get(session?.sessionId)
    if (!pinned) return { kind: 'NotFound' as const, entity: 'Session' as const, id: session?.sessionId ?? '' }
    try { if (exact(pinned.session) !== exact(session)) return failure('SessionMetadataMismatch') } catch { return failure('SessionMetadataMismatch') }
    pinned.state = null
    for (const [id, cursor] of this.cursors) if (cursor.sessionId === session.sessionId) this.cursors.delete(id)
    return { kind: 'Released' as const }
  }
  async loadOperational(session: ReadSession, signal?: AbortSignal): Promise<ReadResult<OperationalView>> {
    const live = this.probe(session, signal); if ('kind' in live) return live
    const s = live.state, active = s.tasks.filter(t => t.lifecycle.kind === 'Active')
    return this.read(live, { project: s.project, activeTasks: active.map(t => t.input), activeOrder: s.activeOrder, registry: s.tasks.map(summary),
      progress: Object.fromEntries(active.map(t => [t.input.taskId, t.progress])), facts: Object.fromEntries(active.map(t => [t.input.taskId, t.facts])),
      remainingHours: Object.fromEntries(active.map(t => [t.input.taskId, t.remainingHours])), recordedWork: Object.fromEntries(active.map(t => [t.input.taskId, s.totals[t.input.taskId]])),
      working: s.working, forecastAssumptions: s.forecastAssumptions, nextTaskNumber: s.nextTaskNumber, nextSequence: s.nextSequence })
  }
  async readOriginalBaseline(session: ReadSession, signal?: AbortSignal) {
    const live = this.probe(session, signal); return 'kind' in live ? live : this.read(live, live.state.baseline)
  }
  async readRetainedTask(session: ReadSession, taskId: string, signal?: AbortSignal): Promise<ReadResult<RetainedTask>> {
    const live = this.probe(session, signal); if ('kind' in live) return live
    const task = live.state.tasks.find(t => t.input.taskId === taskId)
    return task ? this.read(live, { ...task, recordedWork: live.state.totals[taskId] }) : { kind: 'NotFound', entity: 'Task', id: taskId }
  }
  private ids(value: readonly string[] | undefined) { return value === undefined || Array.isArray(value) && value.every(id => typeof id === 'string' && !!id.trim()) && new Set(value).size === value.length }
  private date(filter: DateFilter): boolean {
    return !!filter && ['recordedAt', 'effectiveDate'].includes(filter.basis) && typeof filter.includeUndated === 'boolean'
      && (filter.from === undefined || validDate(filter.from, filter.basis === 'recordedAt')) && (filter.until === undefined || validDate(filter.until, filter.basis === 'recordedAt'))
      && !(filter.from !== undefined && filter.until !== undefined && filter.from > filter.until)
  }
  private matches(value: string | null, filter: DateFilter) { return value === null ? filter.includeUndated : (filter.from === undefined || value >= filter.from) && (filter.until === undefined || value < filter.until) }
  private paginate<T>(live: Live, query: unknown, request: PageRequest, items: readonly T[], key: (item: T) => Key, direction = 1, available = true, id: (item: T) => string): ReadResult<Page<T>> {
    if (!request || !positive(request.limit) || request.limit > 100 || !positive(request.maxBytes) || request.maxBytes > 1024 * 1024) return failure('PageBounds')
    const queryKey = exact({ query, limit: request.limit, maxBytes: request.maxBytes }), cursor = request.cursor === undefined ? undefined : this.cursors.get(request.cursor)
    if (request.cursor !== undefined && (!cursor || cursor.sessionId !== live.session.sessionId || cursor.query !== queryKey)) return { kind: 'InvalidCursor', message: 'Session/resource/watermark/filter/sort/page mismatch' }
    const ordered = [...items].sort((a, b) => compare(key(a), key(b)) * direction).filter(item => !cursor || compare(key(item), cursor.key) * direction > 0)
    const selected: T[] = [], token = `${this.namespace}:cursor:${this.cursorNumber + 1}` as HistoryCursor
    const response = (values: T[], more: boolean) => this.read(live, { items: values, ...(more ? { nextCursor: token } : {}), availability: available ? 'Available' as const : 'Unavailable' as const, coverage: live.state.coverage })
    for (const item of ordered.slice(0, request.limit)) {
      const candidate = [...selected, item], more = candidate.length < ordered.length
      if (bytes(response(candidate, more)) > request.maxBytes) {
        if (!selected.length) return { kind: 'RecordTooLarge', recordId: id(item), requiredBytes: bytes(response(candidate, more)), maxBytes: request.maxBytes }
        break
      }
      selected.push(item)
    }
    const more = selected.length < ordered.length, result = response(selected, more)
    if (bytes(result) > request.maxBytes) return failure('PageMetadataTooLarge')
    if (more) { this.cursorNumber++; this.cursors.set(token, { sessionId: live.session.sessionId, query: queryKey, key: key(selected.at(-1)!) }) }
    return result
  }
  async queryRetainedTasks(session: ReadSession, filter: TaskFilter, page: PageRequest, signal?: AbortSignal) {
    const live = this.probe(session, signal); if ('kind' in live) return live
    if (!filter || !this.ids(filter.taskIds) || !['Any', 'Active', 'Retired'].includes(filter.lifecycle) || !['id', 'name'].includes(filter.sort)) return failure('TaskFilter')
    const rows = live.state.tasks.map(summary).filter(t => (filter.taskIds === undefined || filter.taskIds.includes(t.taskId)) && (filter.lifecycle === 'Any' || filter.lifecycle === t.lifecycle.kind))
    return this.paginate(live, { method: 'tasks', filter }, page, rows, t => filter.sort === 'id' ? [t.taskId] : [t.name, t.taskId], 1, true, t => t.taskId)
  }
  async queryHistory(session: ReadSession, filter: HistoryFilter, page: PageRequest, signal?: AbortSignal) {
    const live = this.probe(session, signal); if ('kind' in live) return live
    if (!filter || !this.ids(filter.taskIds) || !this.ids(filter.eventKinds) || !this.date(filter.date) || !['sequenceAsc', 'sequenceDesc'].includes(filter.sort)) return failure('HistoryFilter')
    const rows = live.state.historyAvailable ? live.state.records.filter((r): r is EventRecord => r.recordType === 'Event').filter(e => (filter.taskIds === undefined || filter.taskIds.some(id => e.taskIds.includes(id))) && (filter.eventKinds === undefined || filter.eventKinds.includes(e.eventKind)) && this.matches(e[filter.date.basis], filter.date)) : []
    return this.paginate(live, { method: 'history', filter }, page, rows, e => [e.sequence, e.recordId], filter.sort === 'sequenceAsc' ? 1 : -1, live.state.historyAvailable, e => e.recordId)
  }
  async queryRetirementEpisodes(session: ReadSession, filter: EpisodeFilter, page: PageRequest, signal?: AbortSignal) {
    const live = this.probe(session, signal); if ('kind' in live) return live
    if (!filter || !this.ids(filter.taskIds) || !this.date(filter.date) || !['Any', 'Active', 'Retired'].includes(filter.lifecycle) || !['Any', 'Restored', 'Unrestored'].includes(filter.resolution) || !['AllEpisodes', 'LatestPerTask'].includes(filter.scope) || !['recordingAsc', 'recordingDesc'].includes(filter.sort)) return failure('EpisodeFilter')
    const s = live.state, rows: RetirementEpisode[] = []
    for (const retirement of s.records) if (retirement.recordType === 'Lifecycle' && retirement.operation === 'Retire') {
      const current = s.tasks.find(t => t.input.taskId === retirement.taskId)!, review = s.records.find(r => r.recordId === retirement.reviewId), restore = s.records.find(r => r.recordType === 'Lifecycle' && r.operation === 'Restore' && r.priorDecisionId === retirement.recordId)
      if (review?.recordType !== 'Review') return failure('MissingRetirementReview')
      if (filter.scope === 'LatestPerTask' && s.records.some(r => r.recordType === 'Lifecycle' && r.operation === 'Retire' && r.taskId === retirement.taskId && r.recordedInRevision! > retirement.recordedInRevision!)) continue
      if (filter.taskIds !== undefined && !filter.taskIds.includes(retirement.taskId) || filter.lifecycle !== 'Any' && current.lifecycle.kind !== filter.lifecycle || filter.resolution !== 'Any' && (restore ? 'Restored' : 'Unrestored') !== filter.resolution || !this.matches(retirement[filter.date.basis], filter.date)) continue
      rows.push({ retirement, currentTask: summary(current), restoration: restore?.recordType === 'Lifecycle' ? { kind: 'Restored', decision: restore } : { kind: 'Unrestored' }, archives: s.records.filter((r): r is ArchiveRecord => r.recordType === 'Archive' && r.reviewId === retirement.reviewId && (r.predecessorId === retirement.taskId || r.successorId === retirement.taskId)), review })
    }
    return this.paginate(live, { method: 'episodes', filter }, page, rows, r => [r.retirement.recordedInRevision ?? 0, r.retirement.recordId], filter.sort === 'recordingAsc' ? 1 : -1, s.historyAvailable, r => r.retirement.recordId)
  }
  async readHistoricalRecord(session: ReadSession, recordId: string, maxBytes: number, signal?: AbortSignal) {
    const live = this.probe(session, signal); if ('kind' in live) return live
    if (!positive(maxBytes) || maxBytes > 1024 * 1024) return failure('RecordBudget')
    const record = live.state.records.find(r => r.recordId === recordId)
    if (!record) return live.state.historyAvailable ? { kind: 'NotFound' as const, entity: 'Record' as const, id: recordId } : { kind: 'Unsupported' as const, code: 'HistoryUnavailable', message: 'Missing historical data is not an empty complete record' }
    const result = this.read(live, record)
    return bytes(result) <= maxBytes ? result : { kind: 'RecordTooLarge' as const, recordId, requiredBytes: bytes(result), maxBytes }
  }
  private totals(state: FixtureState) {
    const work = state.records.filter(r => r.recordType === 'Work'), superseded = new Set(work.flatMap(r => r.correctsRecordId === null ? [] : [r.correctsRecordId]))
    for (const task of state.tasks) {
      const id = task.input.taskId
      state.workAvailable[id] ??= true
      const sum = work.filter(r => r.taskId === id && !superseded.has(r.recordId) && r.operation !== 'Retract').reduce((n, r) => { const next = n + Math.round(r.hours! * 100); if (!Number.isSafeInteger(next)) throw new Error('Recorded aggregate overflow'); return next }, 0)
      state.totals[id] = state.workAvailable[id] ? { kind: 'RecordedSum', hours: sum / 100, completeness: 'RecordedDataOnly', actualTotal: 'Unknown', throughRevision: state.revision } : { kind: 'Unavailable', reason: state.totals[id]?.kind === 'Unavailable' ? state.totals[id].reason : 'Recorded-work source unavailable' }
    }
  }
  async commitChange(input: AtomicChangeRequest, signal?: AbortSignal): Promise<ChangeResult> {
    const rejected = (reason: ReadFailure): ChangeResult => ({ kind: 'NotCommitted', reason, outcome: 'NotCommitted' })
    let prepared: Accepted, receipt: TransactionReceipt, id: RepositoryProjectId
    try {
      const request = clone(input), accepted = this.resources.get(request.resourceId)
      if (!accepted) return rejected({ kind: 'NotFound', entity: 'Project', id: request.resourceId })
      if (typeof request.transactionId !== 'string' || !request.transactionId.trim()) return rejected(failure('TransactionId'))
      const intent = exact(request), previous = accepted.receipts.get(request.transactionId)
      if (previous) return previous.intent === intent ? clone({ kind: 'CommitAccepted', receipt: previous.receipt, currentRef: accepted.ref, replayed: true }) : { kind: 'Conflict', code: 'TransactionIdReuse', currentRef: clone(accepted.ref) }
      // An aborted retry must not relabel an already committed intent as rollback.
      if (signal?.aborted) return rejected({ kind: 'Cancelled', outcome: 'NotDispatched' })
      if (request.expected.revision !== accepted.ref.revision || request.expected.fingerprint !== accepted.ref.fingerprint) return { kind: 'Conflict', code: 'StaleRevision', currentRef: clone(accepted.ref) }
      if (!positive(accepted.state.revision) || accepted.state.revision === Number.MAX_SAFE_INTEGER) return rejected(failure('RevisionOverflow'))
      const next = clone(accepted.state), delta = request.delta
      next.revision++
      if (delta.project !== undefined) next.project = clone(delta.project)
      if (delta.activeOrder !== undefined) next.activeOrder = clone([...delta.activeOrder])
      if (delta.working !== undefined) next.working = clone(delta.working)
      if (delta.forecastAssumptions !== undefined) next.forecastAssumptions = clone(delta.forecastAssumptions)
      if (delta.nextTaskNumber !== undefined) next.nextTaskNumber = delta.nextTaskNumber
      for (const task of delta.changedTasks) { const index = next.tasks.findIndex(t => t.input.taskId === task.input.taskId); if (index < 0) next.tasks.push(clone(task)); else next.tasks[index] = clone(task) }
      next.records.push(...clone(request.appendRecords)); next.nextSequence += request.appendRecords.filter(r => r.recordType === 'Event').length
      const issues = this.options.validate(clone(accepted.state), clone(next), clone(request))
      if (issues.length) return rejected({ kind: 'ValidationFailure', issues: clone(issues) })
      this.totals(next)
      if (this.rejectOnce) { this.rejectOnce = false; return rejected(failure('InjectedBeforePublicationFailure')) }
      const ref = { revision: next.revision, fingerprint: this.options.fingerprint(clone(next)) }
      receipt = { projectId: request.resourceId, transactionId: request.transactionId, committedRef: ref }
      prepared = { state: next, ref, receipts: new Map(accepted.receipts).set(request.transactionId, { intent, receipt: clone(receipt) }) }; id = request.resourceId
    } catch { return rejected(failure('MalformedRequestOrBoundaryFailure')) }
    // One synchronous memory publication; no callbacks/await between state and ledger.
    this.resources.set(id, prepared)
    const uncertain = this.uncertainOnce, hook = this.afterPublish
    this.uncertainOnce = false; this.afterPublish = undefined
    try { hook?.() } catch { return { kind: 'OutcomeUnknown', transactionId: receipt.transactionId, message: 'Test acknowledgement failed after publication; reconcile exact intent' } }
    if (uncertain || signal?.aborted) return { kind: 'OutcomeUnknown', transactionId: receipt.transactionId, message: 'Published but acknowledgement uncertain; cancellation does not prove rollback' }
    return clone({ kind: 'CommitAccepted', receipt, currentRef: this.resources.get(id)!.ref, replayed: false })
  }
  async exportPortable(session: ReadSession, sink: PortableSink, signal?: AbortSignal) {
    void sink
    const live = this.probe(session, signal); if ('kind' in live) return live
    return { kind: 'Unsupported' as const, code: 'PortableExportNotQualified', message: 'No /2 serializer/JCS or qualified capacity route in this test oracle; sink is untouched' }
  }
}
