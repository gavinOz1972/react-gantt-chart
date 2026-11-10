/** Unused purpose-based capability. DTOs are read/command boundaries, NOT a
 * portable format6 model, serializer, storage adapter or application service.
 */
import type { ProjectSettings, TaskInput } from '../types/scheduling'
import type { TaskProgress } from '../progress/taskProgress'
import type { Fingerprint, RepositoryProjectId, RevisionRef, TransactionId, TransactionReceipt, ValidationIssue } from './projectRepository'

declare const sessionBrand: unique symbol
declare const pageBrand: unique symbol
export type ReadSessionId = string & { readonly [sessionBrand]: true }
export type HistoryCursor = string & { readonly [pageBrand]: true }
export type JsonValue = null | boolean | number | string | readonly JsonValue[] | { readonly [key: string]: JsonValue }
/** Preserve primitive brands and stop at already immutable recursive JSON. */
export type ReadonlyValue<T> = [JsonValue] extends [T] ? T
  : T extends string | number | boolean | bigint | symbol | null | undefined ? T
    : T extends readonly (infer Item)[] ? readonly ReadonlyValue<Item>[]
      : T extends object ? { readonly [Key in keyof T]: ReadonlyValue<T[Key]> } : T
export type Coverage = { readonly kind: 'CompleteSince'; readonly revision: number } | { readonly kind: 'Partial'; readonly reason: string }
export type QualifiedDate =
  | { readonly kind: 'Known'; readonly date: string; readonly recordedAt: string | null; readonly actorLabel: string | null; readonly sourceRecordId: string | null }
  | { readonly kind: 'Unknown'; readonly reason: string }
export interface TaskFacts {
  readonly start: QualifiedDate
  readonly completion: QualifiedDate
  readonly committedAtCompletion: QualifiedDate
}
export type RecordedWorkTotal =
  | { readonly kind: 'RecordedSum'; readonly hours: number; readonly completeness: 'RecordedDataOnly'; readonly actualTotal: 'Unknown'; readonly throughRevision: number }
  | { readonly kind: 'Unavailable'; readonly reason: string }
export interface LifecycleSummary { readonly kind: 'Active' | 'Retired'; readonly lastDecisionId: string | null }
export interface RetainedTaskValue {
  readonly input: TaskInput
  readonly lifecycle: LifecycleSummary
  readonly progress: TaskProgress
  readonly facts: TaskFacts
  readonly remainingHours: number | null
  /** Retained domain detail, not a second source of active graph constraints. */
  readonly detail: JsonValue
}
export interface RetainedTask extends RetainedTaskValue { readonly recordedWork: RecordedWorkTotal }
export interface TaskSummary { readonly taskId: string; readonly name: string; readonly lifecycle: LifecycleSummary }
export interface OperationalView {
  readonly project: ProjectSettings
  readonly activeTasks: readonly TaskInput[]
  readonly activeOrder: readonly string[]
  readonly registry: readonly TaskSummary[]
  readonly progress: Readonly<Record<string, TaskProgress>>
  readonly facts: Readonly<Record<string, TaskFacts>>
  readonly remainingHours: Readonly<Record<string, number | null>>
  readonly recordedWork: Readonly<Record<string, RecordedWorkTotal>>
  readonly working: JsonValue
  readonly forecastAssumptions: JsonValue
  readonly nextTaskNumber: number
  readonly nextSequence: number
}
export type BaselineIdentity = { readonly kind: 'Absent' } | { readonly kind: 'Present'; readonly baselineId: string; readonly fingerprint: Fingerprint }
export type OriginalBaseline<B> = { readonly kind: 'Absent' } | { readonly kind: 'Present'; readonly baselineId: string; readonly value: B }
export interface ReadWatermark {
  readonly resourceId: RepositoryProjectId
  readonly lineageId: string
  readonly ref: RevisionRef
  readonly originalBaseline: BaselineIdentity
  readonly historyHighWatermark: number
  readonly coverage: Coverage
}
export interface ReadSession extends ReadWatermark {
  readonly sessionId: ReadSessionId
  /** Repository clock/lifetime metadata, not an actual/effective project date. */
  readonly expiresAt: number
}
export type ReadFailure =
  | { readonly kind: 'InvalidCursor'; readonly message: string }
  | { readonly kind: 'ReadExpired'; readonly sessionId: ReadSessionId }
  | { readonly kind: 'RecordTooLarge'; readonly recordId: string; readonly requiredBytes: number; readonly maxBytes: number }
  | { readonly kind: 'NotFound'; readonly entity: 'Project' | 'Session' | 'Task' | 'Record'; readonly id: string }
  | { readonly kind: 'ValidationFailure'; readonly issues: readonly ValidationIssue[] }
  | { readonly kind: 'Unsupported'; readonly code: string; readonly message: string }
  | { readonly kind: 'Cancelled'; readonly outcome: 'NotDispatched' }
export type ReadResult<T> = { readonly kind: 'Read'; readonly value: ReadonlyValue<T>; readonly watermark: ReadWatermark } | ReadFailure
export interface PageRequest { readonly cursor?: HistoryCursor; readonly limit: number; readonly maxBytes: number }
export interface Page<T> {
  readonly items: readonly T[]
  readonly nextCursor?: HistoryCursor
  readonly availability: 'Available' | 'Unavailable'
  readonly coverage: Coverage
}
export interface DateFilter {
  readonly basis: 'recordedAt' | 'effectiveDate'
  readonly from?: string
  readonly until?: string
  readonly includeUndated: boolean
}
export interface TaskFilter { readonly taskIds?: readonly string[]; readonly lifecycle: 'Any' | 'Active' | 'Retired'; readonly sort: 'id' | 'name' }
export interface HistoryFilter {
  readonly taskIds?: readonly string[]
  readonly eventKinds?: readonly string[]
  readonly date: DateFilter
  readonly sort: 'sequenceAsc' | 'sequenceDesc'
}
export interface EpisodeFilter {
  readonly taskIds?: readonly string[]
  readonly lifecycle: 'Any' | 'Active' | 'Retired'
  readonly resolution: 'Any' | 'Restored' | 'Unrestored'
  readonly scope: 'LatestPerTask' | 'AllEpisodes'
  readonly date: DateFilter
  readonly sort: 'recordingAsc' | 'recordingDesc'
}
interface EvidenceMetadata {
  readonly recordId: string
  readonly taskIds: readonly string[]
  readonly recordedInRevision: number | null
  readonly recordedAt: string | null
  readonly effectiveDate: string | null
  readonly actorLabel: string | null
  readonly rationale: string | null
}
export interface EventRecord extends EvidenceMetadata {
  readonly recordType: 'Event'
  readonly sequence: number
  readonly eventKind: string
  readonly links: readonly string[]
  readonly payload: JsonValue
}
export interface ArchiveRecord extends EvidenceMetadata {
  readonly recordType: 'Archive'
  readonly predecessorId: string
  readonly successorId: string
  readonly reviewId: string
  readonly sourceEventId: string
}
export interface LifecycleRecord extends EvidenceMetadata {
  readonly recordType: 'Lifecycle'
  readonly taskId: string
  readonly operation: 'Retire' | 'Restore'
  readonly priorDecisionId: string | null
  readonly reviewId: string
  readonly sourceEventId: string
  readonly before: RetainedTaskValue
  readonly beforeWorking: JsonValue
}
export interface ReviewRecord extends EvidenceMetadata {
  readonly recordType: 'Review'
  readonly sourceRevision: number
  readonly targetRevision: number
  readonly subjectTaskIds: readonly string[]
  readonly affectedTaskIds: readonly string[]
  readonly outcomes: readonly { readonly taskId: string; readonly predecessorIds: readonly string[]; readonly rationale: string }[]
  readonly archiveIds: readonly string[]
  readonly addedEdges: readonly { readonly predecessorId: string; readonly successorId: string; readonly reinstatesArchiveIds: readonly string[] }[]
  readonly sourceEventId: string
}
export interface WorkRecord extends EvidenceMetadata {
  readonly recordType: 'Work'
  readonly taskId: string
  readonly operation: 'Record' | 'Correct' | 'Retract'
  readonly correctsRecordId: string | null
  readonly hours: number | null
}
export type HistoricalRecord = EventRecord | ArchiveRecord | LifecycleRecord | ReviewRecord | WorkRecord
export interface RetirementEpisode {
  readonly retirement: LifecycleRecord
  readonly currentTask: TaskSummary
  readonly restoration: { readonly kind: 'Restored'; readonly decision: LifecycleRecord } | { readonly kind: 'Unrestored' }
  readonly archives: readonly ArchiveRecord[]
  readonly review: ReviewRecord
}
export interface OperationalDelta {
  readonly project?: ProjectSettings
  /** Explicit complete changed entities only; omission preserves accepted detail. */
  readonly changedTasks: readonly RetainedTaskValue[]
  readonly activeOrder?: readonly string[]
  readonly working?: JsonValue
  readonly forecastAssumptions?: JsonValue
  readonly nextTaskNumber?: number
}
export interface AtomicChangeRequest {
  readonly resourceId: RepositoryProjectId
  readonly expected: RevisionRef
  readonly transactionId: TransactionId
  readonly delta: OperationalDelta
  readonly appendRecords: readonly HistoricalRecord[]
}
export type ChangeResult =
  | { readonly kind: 'CommitAccepted'; readonly receipt: TransactionReceipt; readonly currentRef: RevisionRef; readonly replayed: boolean }
  | { readonly kind: 'Conflict'; readonly code: 'StaleRevision' | 'TransactionIdReuse'; readonly currentRef: RevisionRef }
  | { readonly kind: 'NotCommitted'; readonly reason: ReadFailure; readonly outcome: 'NotCommitted' }
  | { readonly kind: 'OutcomeUnknown'; readonly transactionId: TransactionId; readonly message: string }
export interface PortableSink { write(chunk: Uint8Array): Promise<void> }
export interface ExportReceipt { readonly source: ReadWatermark; readonly bytesWritten: number; readonly profile: 'snapshot-history/2'; readonly snapshotFingerprint: Fingerprint }

/** All successful reads are pinned, readonly and detached from accepted storage.
 * Unsupported export is an explicit gate; no /2 serializer is supplied here.
 * Implementations must validate full snapshot semantics and immutable evidence,
 * not just the projected DTO. Physical transactions/capacity remain separate.
 */
export interface OperationalHistoryRepository<B = JsonValue> {
  openRead(resourceId: RepositoryProjectId, signal?: AbortSignal): Promise<{ readonly kind: 'Opened'; readonly session: ReadSession } | ReadFailure>
  loadOperational(session: ReadSession, signal?: AbortSignal): Promise<ReadResult<OperationalView>>
  readOriginalBaseline(session: ReadSession, signal?: AbortSignal): Promise<ReadResult<OriginalBaseline<B>>>
  queryRetainedTasks(session: ReadSession, filter: TaskFilter, page: PageRequest, signal?: AbortSignal): Promise<ReadResult<Page<TaskSummary>>>
  readRetainedTask(session: ReadSession, taskId: string, signal?: AbortSignal): Promise<ReadResult<RetainedTask>>
  queryHistory(session: ReadSession, filter: HistoryFilter, page: PageRequest, signal?: AbortSignal): Promise<ReadResult<Page<EventRecord>>>
  queryRetirementEpisodes(session: ReadSession, filter: EpisodeFilter, page: PageRequest, signal?: AbortSignal): Promise<ReadResult<Page<RetirementEpisode>>>
  readHistoricalRecord(session: ReadSession, recordId: string, maxBytes: number, signal?: AbortSignal): Promise<ReadResult<HistoricalRecord>>
  releaseRead(session: ReadSession): Promise<{ readonly kind: 'Released' } | ReadFailure>
  commitChange(request: AtomicChangeRequest, signal?: AbortSignal): Promise<ChangeResult>
  exportPortable(session: ReadSession, sink: PortableSink, signal?: AbortSignal): Promise<ReadResult<ExportReceipt>>
}
