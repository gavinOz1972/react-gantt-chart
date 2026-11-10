# Proposed additive repository and memory contract

Owner: repository/memory/concurrency family in the
[consolidated index](CONSOLIDATED-R07-CONTRACT.md). **Design notation only.**
D04 approves this direction; no compiled interface, provider, model or consumer
was changed. The existing generic
[ProjectRepository<S>](../../../src/repository/projectRepository.ts) still means
full snapshot load/commit. Returning a partial operational value as S is forbidden.

## R01: Capability and operational projection

Propose a distinct optional `OperationalHistoryRepository` capability, alongside
the accepted port. Its methods are not replacements or overloads of existing
load/commit. New capability addition is additive; changing old S semantics would
be breaking and requires separate authorization.

```ts
// Proposal signatures only; not exported types or implementation.
openRead(projectResourceId, signal?): Promise<Result<ReadSession>>
loadOperational(session, signal?): Promise<Result<OperationalView>>
readOriginalBaseline(session, signal?): Promise<Result<BaselineValue>>
queryRetainedTasks(session, filter, page, signal?): Promise<Result<TaskPage>>
readRetainedTask(session, taskId, signal?): Promise<Result<RetainedTaskDetail>>
queryHistory(session, filter, page, signal?): Promise<Result<HistoryPage>>
queryRetirementEpisodes(session, filter, page, signal?): Promise<Result<EpisodePage>>
readHistoricalRecord(session, recordId, deliveryBudget, signal?): Promise<Result<RecordDelivery>>
commitChange(request: AtomicChangeRequest, signal?): Promise<WriteResult>
exportPortable(session, sink, signal?): Promise<Result<ExportReceipt>>
releaseRead(session): Promise<void>
```

There is no near-term `reconstructRecordedState`, `listCheckpoints` or named-capture
method. Earlier WP7.4.4c research API suggestions for those features are superseded
by D03 for this proposal. History/reporting does not require them.

| Operational value | Population / meaning | History dependency and retention |
| --- | --- | --- |
| Project/calendar, active tasks and predecessor graph/order | Active source inputs, duration in whole planned slots, start policy, allocation high-water counters and forecast assumptions. | Current WP1/critical path uses these inputs, not archive edges. Full retired values remain stored and explicitly fetchable. |
| Retained identity/current lifecycle registry | Every retained task ID, current label, Active/Retired kind, last decision ID and stable display ordering. | Compact summary is current state, not the entire decision list. IDs/names never select repository overwrite targets. |
| Qualified progress and facts | Current active status/criteria/blocked reason, actual start/completion Known or Unknown, current completion reference and provenance. Retired values fetched on purpose. | Preserve Unknown and event references; service acceptance validates those links. No dates from logs, status age or schedule guesses. |
| Remaining effort and recorded work summary | Current active remaining person-hours/null; recorded sum through the same accepted revision with explicit data availability/completeness. | A sum of zero means zero recorded hours, not total actual work zero. Unavailable/stale sums are qualified, never presented as a valid zero. Corrections update sums atomically. Full entries remain fetchable, optional and included in complete export. |
| Accepted working commitment context | Current active W plus its own inputs/calendar/decisions or explicit Unreviewed reference. | Does not certify a historical promise under today's changed inputs; retired before-context fetched separately. |
| Projection provenance | Full accepted revision/fingerprint, source high-water marks, history coverage and baseline availability/identity handle. | Derived view hash or cached aggregate is not full portable D. No historical completeness claim from an empty page. |

Normal editor/forecast/critical path/Gantt need not hold unbounded old event,
retirement, archive, review, work-entry or checkpoint payloads. The registry/current
graph/context itself can still grow with task/edge/text count. Selected historical
details and baseline overlay are explicit purpose reads, with bounded caching.

An operational current view omits stored retired detail, not its retention. A
future change request must identify every changed retained entity and supply all
new values/evidence required for that change. The provider preserves untouched
accepted retired fields. Omission from a partial view cannot delete data, replace
a full candidate or bypass lifecycle/closure validation. Full export still includes
the original complete retained registry/maps and historical values required by /2.

## R02: Existing consumers and parity gate

| Implemented code today | Dependency that prevents simply dropping history | Required separately authorized parity work |
| --- | --- | --- |
| [App](../../../src/App.tsx), [progressImpact](../../../src/projection/progressImpact.ts) | decodeProgress validates legacy status replay; outlook scans Complete events and saved completion references. | Adapt qualified current completion/start facts to the agreed outlook boundary; preserve reopened/Unknown/same-day semantics and date interpretations. |
| [forecast](../../../src/forecast/forecast.ts), health/Gantt overlays | latestCompletion supplies legacy completion dates; baseline comparisons and progress impact feed historical markers. | Preserve forecast outputs/capacity formulas and explicit As-of behaviour with history-independent fact projections; do not activate private working evaluator. |
| [TaskStatusPanel](../../../src/components/progress/TaskStatusPanel.tsx) | Filters all transition events to show details. | Explicit paged task history with honest coverage and source links; current status remains authoritative. |
| [workTracking](../../../src/workTracking/workTracking.ts) | Filters entries for sums and sorts selected-task logs. | Qualified revision-bound recorded totals and bounded entry queries; reconcile edits/corrections/deletions under existing meanings without implying complete actual effort. |
| [file/local storage](../../../src/persistence/localProjects.ts) and dirty tracking | Whole-library/full-project serialization and validation; file formats 1–5. | Separately authorize persistence integration and parity/source-preservation tests. A new capability does not make current code lazy. |

These dependencies remain implemented as before. Read-model adapters must pass
reference-output tests before history is removed from any ordinary consumer.
Recording/reporting changes may not change scheduling/effort/status formulas.

## R03: Read sessions, filters and stable pages

OpenRead pins repository namespace/resource identity, exact accepted RevisionRef,
baseline identity, operational lifecycle summary and event/record high-water
marks. Each result identifies that same watermark. Sessions have a bounded stated
lifetime; expiration returns `ReadExpired` rather than silently reading a new head.
Adapter support for pinned views must be qualified, or return Unsupported.

This is a query-consistency contract. It does not promise opening every arbitrary
old revision later or retaining complete intermediate schedules. A session may
retain a bounded query manifest/projection or use a qualified storage read view.
Newly committed records/current lifecycle changes do not leak into its pages.

History filters: any-of exact task IDs, any-of event kinds, explicit date basis
`recordedAt` or `effectiveDate`, inclusive from/exclusive until, and explicit
include-undated behaviour. Timestamps can tie or be skewed. Null date metadata is
not converted into a recording/effective date. Retired-task/episode filters and
their sort semantics belong to [the reporting contract](HISTORICAL-REPORTING-CONTRACT.md).
All queries remain bound to the same lineage/accepted resource and coverage.

Proposed pages use a bounded item limit (1–100 for later review) plus a separately
qualified response-byte budget. Opaque cursors bind namespace/resource, session,
watermark, exact filter/sort and final stable key. Invalid or reused cursor/filter
combinations reject `InvalidCursor`. Deduplicate joined task/event matches before
pagination; identical timestamps cannot cause skips/duplicates. No unbounded offset
walk is required. Empty means no matching available records, not complete history.

Large individual review/rationale payloads return bounded metadata and explicit
record delivery (chunk/stream with stable content identity) or `RecordTooLarge`.
Do not silently truncate a closure/reason. A declared-missing historical link can
produce an honest unavailable explanation; a reference that violates the accepted
wire contract is a validation failure, not an invitation to invent content.

## R04: Atomic change, concurrency and reconciliation

AtomicChangeRequest names resource, expected full revision/fingerprint, transaction
ID, next logical revision, candidate operational changes, complete changed retained
records and append-only domain evidence. It also carries the immutable baseline
guard, and an explicit establish-once action only if later authorized. The provider
validates against accepted source values and known lineage, including full affected
successor closure and all unchanged-history/baseline/high-water invariants. It must
not interpret partial-view omissions as replacement/deletion of the stored snapshot.

One commit publishes current state, lifecycle/archived edges/scope review/events,
derived recorded-work caches, ID/sequence counters, full D and receipt together.
No separately visible history append may describe an unapplied change. A detached
candidate is fully validated, capacity/reopen-qualified and compared against the
expected ref before accepted publication. Every affected final successor choice
comes from the common accepted source; changes invalidate stale draft confirmations.

Preserve accepted port semantics: safe positive revision advances exactly once;
event sequence is separate; exact unchanged request retry returns original receipt
and possibly newer currentRef; same transaction ID with changed intent conflicts.
A stale expected revision/fingerprint rejects the whole candidate. Re-read and
reconfirm successor choices; no timestamp/name-based overwrite or silent rebase.

Definitive NotCommitted leaves accepted state/ref/B/history/counters unchanged.
Lost acknowledgement after dispatch is OutcomeUnknown; preserve the exact intent
and reconcile using its unchanged transaction ID/request. Cancellation after
uncertain dispatch is not proof of rollback. No fresh-ID blind retry or pending
command retargeting across repository namespaces. Staged/orphan data is invisible
to committed-head queries; recovery may discard only proven unreferenced staging,
never accepted evidence. Physical crash/durability behaviour remains untested here.

Portable project/task/event/decision IDs remain distinct from repository resource
IDs, private sessions/cursors/receipts, file paths and database rowversions.
Reports/export must not rename lineage IDs or embed transport receipt history.

## R05: Physical options and complete digest cost

No adapter is selected. A future browser IndexedDB proposal must qualify one
transaction across current/head, immutable records/indexes/counters and receipts,
plus quota, multi-tab contention, abort and durability. Today's localStorage
whole-library code is not that implementation or a cross-tab compare-and-swap.
An eventual API/Azure SQL design must perform server-side authorization, validated
head compare-and-swap, append/index/current/receipt writes in one transaction,
exact-intent reconciliation and consistent paged read views. SQL indexes/rowversions
remain adapter details, not portable semantics or a logical-revision replacement.
D05 requires a separate scale/access/retention/backup/export design before choice.

Purpose-based reads reduce client payloads. They do not make complete export or
the unchanged full-snapshot D free. Export materializes all /2 values in original
array order from one pinned view, resolves internal definition references and
uses the existing prefix/JCS algorithm owned by the prior integrity contract.
Commit may also need to traverse retained history to calculate D and validate
lineage invariants. Hashing record hashes is not an approved substitute.

Any streaming/spooling design must prove exact lexical/canonical ordering,
Unicode/numeric behaviour and arbitrary opaque baseline/event object handling;
JCS object-key sorting may require buffering or external sorting. Qualify time,
I/O, transient memory, cancellation and safe staging before deployment. This
package supplies neither a constant-memory importer/exporter nor a new digest.
