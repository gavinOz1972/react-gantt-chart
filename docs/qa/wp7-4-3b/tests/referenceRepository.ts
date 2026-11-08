/** Test-only memory adapter. No physical durability or native concurrency claim. */
import type {
  CommitRequest, CreateRequest, Fingerprint, ListQuery, ListResult, LoadedProject,
  LoadResult, OutcomeUnknown, ProjectRepository, ProjectSnapshot, RepositoryCursor,
  RepositoryFailure, RepositoryProjectId, RevisionRef, SnapshotSemantics, SnapshotValue,
  TransactionId, TransactionReceipt, WriteResult,
} from '../../../../src/repository/projectRepository'

type Operation = 'load' | 'list' | 'create' | 'commit'
type Fault = { readonly operation: Operation; readonly failure: RepositoryFailure }
type Uncertainty = { readonly operation: 'create' | 'commit'; readonly committed: boolean }
interface RecordedIntent {
  readonly candidateFingerprint: Fingerprint
  readonly expected?: RevisionRef
  readonly label?: string
  readonly receipt: TransactionReceipt
}
const copy = <T>(value: T): T => structuredClone(value)
const validRevision = (value: number) => Number.isSafeInteger(value) && value > 0
const sameRef = (a: RevisionRef, b: RevisionRef) => a.revision === b.revision && a.fingerprint === b.fingerprint
const invalid = (code: string): RepositoryFailure => ({ kind: 'Validation', issues: [{ code, message: code }] })

/** Methods finish their critical section without awaiting. This models atomic
 * memory transitions only; it is not a lock implementation or physical adapter.
 */
export class ReferenceRepository<S extends ProjectSnapshot> implements ProjectRepository<S> {
  private readonly projects = new Map<RepositoryProjectId, LoadedProject<S>>()
  private readonly creates = new Map<TransactionId, RecordedIntent>()
  private readonly commits = new Map<RepositoryProjectId, Map<TransactionId, RecordedIntent>>()
  private readonly cursors = new Map<RepositoryCursor, RepositoryProjectId>()
  private resourceSequence = 0
  private cursorSequence = 0
  private fault?: Fault
  private uncertainty?: Uncertainty

  private readonly namespace: string
  private readonly semantics: SnapshotSemantics<S>
  constructor(namespace: string, semantics: SnapshotSemantics<S>) {
    this.namespace = namespace
    this.semantics = semantics
  }

  rejectNext(operation: Operation, failure: RepositoryFailure): void {
    this.fault = copy({ operation, failure })
  }
  loseNextAcknowledgement(operation: 'create' | 'commit', committed: boolean): void {
    this.uncertainty = { operation, committed }
  }
  private rejection(operation: Operation): RepositoryFailure | undefined {
    if (this.fault?.operation !== operation) return undefined
    const failure = this.fault.failure
    this.fault = undefined
    return copy(failure)
  }
  private uncertain(operation: 'create' | 'commit'): Uncertainty | undefined {
    if (this.uncertainty?.operation !== operation) return undefined
    const result = this.uncertainty
    this.uncertainty = undefined
    return result
  }
  private unknown(transactionId: TransactionId): OutcomeUnknown {
    return { kind: 'OutcomeUnknown', transactionId, message: 'Injected missing acknowledgement; reconcile exact request.' }
  }
  private boundaryFailure(): RepositoryFailure {
    return { kind: 'StorageFailure', code: 'InjectedBoundaryFailure', retryable: false, outcome: 'NotCommitted', message: 'Test boundary threw before mutation.' }
  }
  private known(): readonly SnapshotValue<S>[] {
    return [...this.projects.values()].map(project => copy(project.snapshot))
  }
  private replay(previous: RecordedIntent, fingerprint: Fingerprint, project: LoadedProject<S>, expected?: RevisionRef, label?: string): WriteResult {
    const matches = previous.candidateFingerprint === fingerprint && previous.label === label &&
      (previous.expected === undefined ? expected === undefined : expected !== undefined && sameRef(previous.expected, expected))
    return copy(matches
      ? { kind: 'AlreadyCommitted', receipt: previous.receipt, currentRef: project.ref }
      : { kind: 'Conflict', code: 'TransactionIdReuse', currentRef: project.ref })
  }
  async load(id: RepositoryProjectId): Promise<LoadResult<S>> {
    const failure = this.rejection('load')
    if (failure) return failure
    const project = this.projects.get(id)
    return project ? { kind: 'Loaded', project: copy(project) } : { kind: 'NotFound', projectId: id }
  }
  async list(query: ListQuery): Promise<ListResult> {
    const failure = this.rejection('list')
    if (failure) return failure
    if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100) return invalid('InvalidLimit')
    const after = query.cursor === undefined ? undefined : this.cursors.get(query.cursor)
    if (query.cursor !== undefined && after === undefined) return invalid('InvalidCursor')
    const entries = [...this.projects.values()]
    const start = after === undefined ? 0 : entries.findIndex(project => project.projectId === after) + 1
    const page = entries.slice(start, start + query.limit)
    const items = page.map(({ projectId, label, ref }) => ({ projectId, label, ref }))
    if (start + page.length >= entries.length) return { kind: 'Listed', items: copy(items) }
    const cursor = `${this.namespace}:cursor:${++this.cursorSequence}` as RepositoryCursor
    this.cursors.set(cursor, page[page.length - 1].projectId)
    return { kind: 'Listed', items: copy(items), nextCursor: cursor }
  }
  async create(input: CreateRequest<S>): Promise<WriteResult> {
    const failure = this.rejection('create')
    if (failure) return failure
    try {
      const request = copy(input)
      if (!request.transactionId.trim()) return invalid('InvalidTransactionId')
      const fingerprint = this.semantics.fingerprint(copy(request.snapshot)), prior = this.creates.get(request.transactionId)
      if (prior) return this.replay(prior, fingerprint, this.projects.get(prior.receipt.projectId)!, undefined, request.label)
      if (!request.label.trim() || request.label.length > 120) return invalid('InvalidCreate')
      if (!validRevision(request.snapshot.logicalRevision)) return invalid('InvalidRevision')
      const issues = this.semantics.validateCreate(copy(request.snapshot), this.known())
      if (issues.length) return { kind: 'Validation', issues: copy(issues) }
      const uncertain = this.uncertain('create')
      if (uncertain && !uncertain.committed) return this.unknown(request.transactionId)
      const projectId = `${this.namespace}:resource:${this.resourceSequence + 1}` as RepositoryProjectId
      const ref = { revision: request.snapshot.logicalRevision, fingerprint }
      const receipt = { projectId, transactionId: request.transactionId, committedRef: ref }
      const project = copy({ projectId, label: request.label, ref, snapshot: request.snapshot })
      const intent = copy({ candidateFingerprint: fingerprint, label: request.label, receipt })
      const result: WriteResult = uncertain ? this.unknown(request.transactionId) : copy({ kind: 'Committed', receipt, currentRef: ref })
      this.resourceSequence++
      this.projects.set(projectId, project)
      this.creates.set(request.transactionId, intent)
      return result
    } catch { return this.boundaryFailure() }
  }
  async commit(input: CommitRequest<S>): Promise<WriteResult> {
    const failure = this.rejection('commit')
    if (failure) return failure
    try {
      const request = copy(input), project = this.projects.get(request.projectId)
      if (!project) return { kind: 'NotFound', projectId: request.projectId }
      if (!request.transactionId.trim()) return invalid('InvalidTransactionId')
      const fingerprint = this.semantics.fingerprint(copy(request.candidate))
      const previous = this.commits.get(request.projectId)?.get(request.transactionId)
      if (previous) return this.replay(previous, fingerprint, project, request.expected)
      if (!sameRef(project.ref, request.expected)) return copy({ kind: 'Conflict', code: 'StaleRevision', currentRef: project.ref })
      if (!validRevision(request.expected.revision) || request.expected.revision === Number.MAX_SAFE_INTEGER ||
        !validRevision(request.candidate.logicalRevision) || request.candidate.logicalRevision !== request.expected.revision + 1) return invalid('InvalidRevision')
      const issues = this.semantics.validateCommit(copy(project.snapshot), copy(request.candidate), this.known())
      if (issues.length) return { kind: 'Validation', issues: copy(issues) }
      const uncertain = this.uncertain('commit')
      if (uncertain && !uncertain.committed) return this.unknown(request.transactionId)
      const ref = { revision: request.candidate.logicalRevision, fingerprint }
      const receipt = { projectId: request.projectId, transactionId: request.transactionId, committedRef: ref }
      const intents = this.commits.get(request.projectId) ?? new Map<TransactionId, RecordedIntent>()
      const accepted = copy({ ...project, ref, snapshot: request.candidate })
      const intent = copy({ candidateFingerprint: fingerprint, expected: request.expected, receipt })
      const result: WriteResult = uncertain ? this.unknown(request.transactionId) : copy({ kind: 'Committed', receipt, currentRef: ref })
      // No callbacks/await/serialization after this point; one memory transition.
      this.projects.set(request.projectId, accepted)
      intents.set(request.transactionId, intent)
      this.commits.set(request.projectId, intents)
      return result
    } catch { return this.boundaryFailure() }
  }
}
