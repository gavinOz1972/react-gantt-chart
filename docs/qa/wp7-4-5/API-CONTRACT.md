# Executable capability boundary and limits

Source: [operationalHistoryRepository.ts](../../../src/repository/operationalHistoryRepository.ts).
This is an unused read/command contract, **not a Snapshot6 schema or codec**.
It follows [WP7.4.4d](../wp7-4-4d/CONSOLIDATED-R07-CONTRACT.md) D01–D05. Existing
ProjectRepository<S> does not extend it, and its methods/types were not changed.

## Values and typed results

OperationalView contains project/calendar, active input graph/order, every retained
ID/name/current lifecycle summary, active progress/criteria/facts/remaining,
revision-qualified recorded-work summaries, current working context, forecast
assumptions and allocation/sequence high-water counters. Historical narratives,
retired detail, archived relationships, event lists, work entries and original B
are purpose reads, not fields of that projection.

Facts use Known(date, nullable recording/actor/source record) or Unknown(reason).
No clock, work log, status text or missing page supplies a fact. RecordedSum means
recorded person-hours only, explicitly `actualTotal: Unknown`; Unavailable is not
zero. CompleteSince and Partial coverage remain declared qualifications. DTO
dates/record metadata do not change any public file field or interpretation.

All DTOs/read results are readonly. ReadonlyValue preserves primitive brands and
recursive immutable JSON while making generic baseline payloads readonly. Successful
results are deep detached copies; hostile casts/mutation of a result cannot mutate
accepted data. The oracle's private FixtureState is test-only and is not a second
public full-snapshot type.

| Method / result | Executable meaning |
| --- | --- |
| openRead → Opened / ReadFailure | Pins resource, portable lineage, exact accepted full-fixture revision/fingerprint, original baseline identity and history high-water. Resource ID is not lineage. |
| loadOperational → Read | Current projection only at that pinned head, including compact registry of retired identities. |
| readOriginalBaseline → Read | Absent or the full first immutable value, including opaque fields. The command interface has no baseline replacement/capture field. |
| queryRetainedTasks / readRetainedTask | Stable current summaries by purpose, or one complete retained current detail plus recorded-work qualification, including a retired task. |
| queryHistory | Paged EventRecord explanations with available/partial coverage; missing matching data differs from globally unavailable history. |
| queryRetirementEpisodes | Episode, current lifecycle at pinned head, linked restore, incident archived edges and whole common-source scope review. Latest/all and restored/current filters are distinct. |
| readHistoricalRecord | Complete immutable selected record within response budget, explicit RecordTooLarge, NotFound or unavailable-history Unsupported; no truncation. |
| releaseRead | Drops the pinned fixture data/cursors, idempotent for a known session. Later purpose reads return ReadExpired. |
| commitChange | Atomic command, not full S replacement: expected ref/transaction, explicit operational delta, complete changed retained entities and append-only typed evidence. Omitted entities/fields stay accepted. |
| exportPortable | Typed sink/receipt boundary. Reference always returns Unsupported(PortableExportNotQualified) for a valid live request; writes zero bytes. No /2 parity is claimed. |

Read errors are explicit InvalidCursor, ReadExpired, RecordTooLarge, NotFound,
ValidationFailure, Unsupported and Cancelled(NotDispatched). HistoryPage includes
availability and coverage, so an empty Available/Partial page is not a complete
historical claim. A missing record with known available history is NotFound; a
missing record while history is unavailable is Unsupported(HistoryUnavailable).

## Sessions, filtering and paging

The reference supports pinning; a test capability setting returns explicit
PinnedReadUnsupported. Lifetime defaults to 60,000 milliseconds of repository
monotonic clock, with an injectable deterministic clock for expiration tests.
expiresAt is session metadata, not a project date. Session handles are namespace/
instance scoped and their entire metadata must match the stored handle. Pinning
is a read consistency promise, not arbitrary old-schedule reconstruction.

Item bounds are 1–100; reference response budgets are positive safe integer UTF-8
bytes, at most 1 MiB. This is a response policy, **not the portable 10 MiB limit**.
Budget counts the successful reply wrapper, watermark, items and cursor. Errors
can explain why no successful response fits. A metadata-only page too large for
its budget is ValidationFailure; an oversized first item is RecordTooLarge.
Pages shrink at whole-item boundaries and carry a stable continuation; reasons,
before-context and review closure are never clipped.

Opaque keyset cursors bind endpoint, exact filter/sort, session/resource/pinned
watermark and page limit/byte budget. Changing even a page bound requires a new
query. They use immutable ID tie-breaks, ordinal string comparison, event sequence
for history and revision/decision ID for episode recording order. No timestamp
tie can drop or repeat rows. Appending a record or restoring a task never changes
an earlier pinned page. A new session sees the new head.

Task filters support exact IDs/current lifecycle and ID/name sort. History filters
use any-of exact task IDs/kinds, explicit recordedAt versus effectiveDate basis,
inclusive from/exclusive until, includeUndated and sequence direction. Empty ID/
kind arrays match nothing; duplicate/blank filter IDs reject. Bounds must be
strict ISO date-only or millisecond UTC timestamps appropriate to the chosen basis.
No date is inferred for undated legacy evidence. Episode filters add current
Active/Retired, Restored/Unrestored resolution, all/latest episodes per task and
recording direction. Latest means latest known episode at the watermark, before
date filtering. Earlier restored episodes may belong to a currently retired task.

## Atomic writes and reference-domain enforcement

ChangeResult is CommitAccepted(receipt/currentRef/replayed), Conflict, NotCommitted
with a typed reason/outcome, or OutcomeUnknown. Every accepted change advances one
safe revision and appends a separate contiguous event-sequence range. Original B,
lineage, all retained IDs and old evidence stay unchanged; no partial projection
can replace them. Fresh allocation is explicit, monotone and non-reusing.

The reference prepares detached candidate data, validates it, computes work totals
and its full fixture fingerprint, and prepares the receipt ledger before one
synchronous memory publication. Current/retained entities, archives/reviews/events,
totals, counters and receipt become visible together. Throwing guards, malformed
evidence, scope rejection or injected pre-publication failure publish nothing.
Exact retry checks the prior receipt before stale-head/cancellation handling and
returns that original committedRef with the possibly newer currentRef. Changed
intent with the same resource/transaction conflicts; stale ref never silently rebases.

Acknowledgement loss is injected **after** publication. A post-publication aborted
signal yields OutcomeUnknown; an exact retry, including an already-aborted retry,
settles the existing receipt rather than relabelling it rollback. A new aborted
intent is NotCommitted/Cancelled before dispatch. No durable transaction, unknown
pre-publication physical outcome or native lock is simulated as proven storage.

Independent fixture guards enforce active DAG/reference shape, stable IDs,
preserved before-context from a common source (including working context), last/
prior lifecycle links, required dates/rationale/events, complete unique successor
closure, removed-edge archive episodes and explicit restoration edges. The diamond
fixture preserves T5→T3 while retiring T1, reviews T4 once despite two paths, and
retains old archives when T1 is restored. Restore may explicitly choose no old edges.
Generic SourceEdit cannot bypass a scope review for a changed graph.

Immutable work records support record/correct/retract with unbranched same-task
correction chains. Cache updates use checked integer hundredths; unsafe individual
work or aggregate overflow rejects before publication. Unknown work availability
stays Unavailable. Logging never changes remaining, status or actual facts by itself.

## Honest validation/export limits and future gates

Trusted test seeds bootstrap the oracle; there is no create/import/upgrade API in
this slice. Fixture guards are not full /2 structure/domain/attestation/closure/
lineage validation, and fixture working context is not a production WP742 evaluator.
The fixture's scope commands model incident-edge retire/restore, not every possible
replacement-predecessor/combined attestation workflow. Evidence DTOs are not wire
EventKind/profile definitions. Complete/Partial truth for arbitrary external files
is not certified by passing these authored cases.

The oracle stores full fixture history and clones pinned views, rebuilds query
lists in memory and scans work records during commits to maintain caches. A normal
operational read returns cached summaries, not work entries, but physical lazy I/O,
indexes/memory scale, durability/crash/SQL/IndexedDB/auth are unqualified. Fixture
fingerprints intern exact sorted JSON values in this process, exclude resource
routing, and are neither cryptographic nor portable; private receipts are excluded.

Production providers must supply approved full-snapshot D and complete validation,
capacity/reopen and recovery semantics. D02's provisional raw 10 MiB/depth-64 and
qualified larger-cap route remain unimplemented gates, not the reply budget.
No formats 1–5 changed, no /2 export/canonicalizer introduced and no full-snapshot
parity test claimed. Consumer fact/work-history parity, providers, report UI/PDF,
FR-HIST-01, deployment and final R07 approval require separate authorization.
