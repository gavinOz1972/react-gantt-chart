/** Unused port only. No format schema, adapter, codec or application activation. */
declare const resourceBrand: unique symbol
declare const transactionBrand: unique symbol
declare const fingerprintBrand: unique symbol
declare const cursorBrand: unique symbol

/** An opaque stored-copy handle in one repository namespace, not a lineage ID. */
export type RepositoryProjectId = string & { readonly [resourceBrand]: true }
export type TransactionId = string & { readonly [transactionBrand]: true }
export type Fingerprint = string & { readonly [fingerprintBrand]: true }
export type RepositoryCursor = string & { readonly [cursorBrand]: true }
export type LogicalRevision = number
/** Domain snapshots are immutable data values, not services or mutable handles. */
export type SnapshotValue<T> = T extends object ? { readonly [K in keyof T]: SnapshotValue<T[K]> } : T

/** Minimum constraint only. S supplies the complete readonly domain snapshot.
 * No state/history/file fields are prescribed while the format contract is deferred.
 * Revisions must be positive safe integers; a new commit advances exactly once.
 */
export interface ProjectSnapshot {
  readonly logicalRevision: LogicalRevision
}
export interface RevisionRef {
  readonly revision: LogicalRevision
  readonly fingerprint: Fingerprint
}
export interface ProjectSummary {
  readonly projectId: RepositoryProjectId
  readonly label: string
  readonly ref: RevisionRef
}
export interface LoadedProject<S extends ProjectSnapshot> extends ProjectSummary {
  readonly snapshot: SnapshotValue<S>
}
export interface TransactionReceipt {
  readonly projectId: RepositoryProjectId
  readonly transactionId: TransactionId
  readonly committedRef: RevisionRef
}
export interface ValidationIssue {
  readonly code: string
  readonly message: string
  readonly path?: readonly (string | number)[]
}
export type RepositoryFailure =
  | { readonly kind: 'NotFound'; readonly projectId: RepositoryProjectId }
  | { readonly kind: 'Conflict'; readonly code: 'StaleRevision' | 'TransactionIdReuse'; readonly currentRef?: RevisionRef }
  | { readonly kind: 'Unsupported'; readonly code: string; readonly message: string }
  | { readonly kind: 'Validation'; readonly issues: readonly ValidationIssue[] }
  | { readonly kind: 'StorageFailure'; readonly code: string; readonly retryable: boolean; readonly outcome: 'NotCommitted'; readonly message: string }
  | { readonly kind: 'AccessDenied'; readonly message: string }
export interface OutcomeUnknown {
  readonly kind: 'OutcomeUnknown'
  readonly transactionId: TransactionId
  readonly message: string
}
export type WriteResult =
  | { readonly kind: 'Committed'; readonly receipt: TransactionReceipt; readonly currentRef: RevisionRef }
  | { readonly kind: 'AlreadyCommitted'; readonly receipt: TransactionReceipt; readonly currentRef: RevisionRef }
  | RepositoryFailure
  | OutcomeUnknown
export type LoadResult<S extends ProjectSnapshot> =
  | { readonly kind: 'Loaded'; readonly project: LoadedProject<S> }
  | RepositoryFailure
export interface ListQuery {
  readonly cursor?: RepositoryCursor
  readonly limit: number
}
export type ListResult =
  | { readonly kind: 'Listed'; readonly items: readonly ProjectSummary[]; readonly nextCursor?: RepositoryCursor }
  | RepositoryFailure
export interface CreateRequest<S extends ProjectSnapshot> {
  readonly transactionId: TransactionId
  readonly label: string
  readonly snapshot: SnapshotValue<S>
}
export interface CommitRequest<S extends ProjectSnapshot> {
  readonly projectId: RepositoryProjectId
  readonly expected: RevisionRef
  readonly transactionId: TransactionId
  readonly candidate: SnapshotValue<S>
}

/** Requests remain bound to this instance's namespace and stored-copy identity.
 * Exact retry returns the original receipt and possibly a newer currentRef.
 * Receipts are private transport evidence, never portable domain history.
 * Definitive rejection never changes accepted data. OutcomeUnknown must be
 * reconciled with the unchanged request; it does not prove rollback.
 * Results must not alias accepted storage or caller inputs.
 */
export interface ProjectRepository<S extends ProjectSnapshot> {
  load(id: RepositoryProjectId): Promise<LoadResult<S>>
  list(query: ListQuery): Promise<ListResult>
  create(request: CreateRequest<S>): Promise<WriteResult>
  commit(request: CommitRequest<S>): Promise<WriteResult>
}

/** Boundary injection, not a format6 validator or canonicalization profile.
 * Implementations must validate original baseline/history against accepted
 * state and known lineage copies. The reference suite supplies a narrow fake.
 * Fingerprints must consistently represent the entire semantic snapshot;
 * no export timestamps, transport receipts or storage routing are added here.
 */
export interface SnapshotSemantics<S extends ProjectSnapshot> {
  fingerprint(snapshot: SnapshotValue<S>): Fingerprint
  validateCreate(snapshot: SnapshotValue<S>, known: readonly SnapshotValue<S>[]): readonly ValidationIssue[]
  validateCommit(accepted: SnapshotValue<S>, candidate: SnapshotValue<S>, known: readonly SnapshotValue<S>[]): readonly ValidationIssue[]
}
