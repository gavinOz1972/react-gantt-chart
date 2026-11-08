# Required semantic and adapter failure acceptance

All future native/production rows are acceptance criteria, not claimed
implemented support. [Illustrative checks](evidence/contract-examples.json)
use a toy in-memory model; they are labelled below. Today's app regression
results are separate in [VERIFICATION](VERIFICATION.md).

Common oracle: capture entire accepted snapshot S/refR, baseline B, history
prefix, physical source/backup bytes and UI accepted ref. Known rejected/
cancelled-before-dispatch operations retain them exactly. Success accepts one
complete S' plus receipt; no intermediate graph/event/commitment writes.

| ID / setup/action | Exact required outcome | Evidence / remaining test |
| --- | --- | --- |
| M01 Single writer commits complete next revision | One increment, expected+1; receipt/fingerprint matches all accepted fields. No extra revision for individual operations. | Toy C06; real port/codec/native write pending. |
| M02 Same create/commit ID and identical intent repeated | Same resource/original receipt, no duplicate completion/history/revision. | Toy C02/C07. |
| M03 Same scoped ID, different intent | Conflict(TransactionIdReuse), unchanged data. | Toy C03/C08. |
| M04 Two tabs, same R, different task edits | One accepted R+1; other Busy or Conflict; no automatic task merge. Retry stale new intent must conflict. | Toy C21 orders critical sections only; native two-tab adapter test required. Prior lock primitive evidence is not new-port proof. |
| M05 Same counter but different fingerprint | Conflict; do not overwrite external drift. No authenticity guarantee if malicious data/guards are both replaced. | Toy C28. |
| M06 Different resources saved concurrently | Both changes preserved; single-key adapter re-reads/merges inside global lock. Port promises no cross-project atomic command. | Future native library test; no toy claim. |
| M07 Concurrent Save As, equal labels/different IDs | Two independent resource IDs, preserved source lineage/baseline/history; no name-based overwrite. | Toy C04/C25; duplicate-label policy requires owner choice. |
| M08 Create retry after unknown acknowledgement | Original resource found by namespace/create transaction ID; no second copy. | Toy create retry C02; future after-write create-fault/native test required. |
| M09 Missing project load/commit | NotFound, never silently recreate a deleted resource. | Toy C05/C14. |
| M10 Invalid candidate, wrong next revision or modified old evidence | Validation, no partial write. Existing event/correction history remains append-only. | Toy C12/C22/C27 only a minimal model; full graph/checklist/replay/schema tests pending. |
| M11 Baseline changed/removed/conflicting known lineage | Validation, full original baseline/interpretation retained. Known first-baseline adoption checked with commit. | Toy C10/C11; full baseline/opaque/known-lineage race cases pending. |
| M12 Completion, dependency and Unresolved together | One accepted group, all new evidence/changed graph/promises or none. Partial status/evidence candidate rejects. | Toy C06/C27; real grouped schema/commit needed. |
| M13 Quota/security error before write | StorageFailure(NotCommitted); accepted storage/UI unchanged, draft retained. | Toy injected C15/C16; prior WP7.4.1 native quota/denial evidence, new-adapter native tests pending. |
| M14 Lock unavailable/unsupported browser/insecure restricted context | Unsupported conditional writes; no unlocked fallback. Accepted data remains readable/exportable only where storage permits. | Toy simulated C17; target-browser matrix pending. |
| M15 Lock busy/holder closes | No tight loop; Busy retryable, asynchronous release handled. No guaranteed immediate availability. | Historical primitive spike; new adapter test pending. |
| M16 Write succeeds, UI publication omitted then reload | Load accepted revision/receipt; do not claim failure or roll storage back to old React state. | Toy C19 models response loss, not actual crash; future tab-close/native test required. |
| M17 Timeout/abort after dispatch, status unknown | OutcomeUnknown; preserve request/transaction ID, retain prior UI and draft until reconciled. Do not report definitely unsaved or send a fresh duplicate transaction. | Toy C19; real transport-loss/server tests deferred. |
| M18 Retry of an old success after later revision | Original receipt plus newer currentRef; load/reconcile, never publish old candidate over new data. | Toy C20. |
| M19 Cancel before dispatch/upgrade approval | No repository call or mutation; source v1/file and accepted snapshot/ref unchanged. | Toy C18 illustrates no call; actual review/upgrade UI remains excluded. |
| M20 Local day rollover | Before dispatch refresh/revalidate preview/new planned dates; do not retime actual evidence or PA/FF As-of. In-flight unknown requests keep immutable payload/ID for reconciliation. | Future coordinator test; no hidden clock in domain. |
| M21 Old v1/new v2 coexist; migration fails/cancelled | v1 raw original usable and unchanged; no6 inserted into v1; failed new copy leaves existing target/source unchanged. No two-key atomicity claim. | Future native adapter/codec test. |
| M22 Version1-5 explicit B copy-upgrade | Preserve each supported field/baseline/history; no inferred Actual Start. New logical1/group can include Seed+Review; do not persist Seed first. | Read-only L1-L5 current codec checks only. B upgrade unimplemented. |
| M23 Export adapterA -> import adapterB -> export/load | Domain snapshot/fingerprint/revision/task IDs/history/baseline equal; new repository resource/create receipt, no copied auth/routing. | Toy C23-C26 two memory representations, not real adapters or format6. |
| M24 Malformed/unsupported A/B/future file or down-export | Typed rejection, no partial import or loss of fields. Original source retained for recovery. | C13 toy Unsupported only; actual version matrix pending. |
| M25 Storage clear/eviction/process/power/disk failure | No guarantee of physical durability from a lock or successful JS return; restore accepted exported backup under validated rules. | Not tested/certified here; no automatic recovery claim. |
| M26 Noncooperating/manual storage mutation | Outside exclusion guarantee; fail mismatched checks where detectable, never claim cryptographic prevention. | Historical negative lock control and toy C28, not an adversarial security audit. |

## Required portability fixture suite after authorization

Use existing [format1-4 fixtures](../../../tests/fixtures/wp71/README.md) and
[format5 late fixture](../../../tests/fixtures/wp733/late.json), then B fixtures
covering no/present/opaque baseline, same-lineage conflict, all four statuses,
completion/reopen/recomplete, missing historical snapshot, Actual Start
record/correct/retract, null/0/nonzero effort, optional logs, ties/nonworking
dates, stable unusual IDs/Unicode and ordered equal-timestamp events.
The source/target adapters must run the same parameterized semantic suite.

Export logical revision17 from A, import into B with a different repository
resource ID, assert logical17 and complete evidence/B unchanged; commit against
17 accepts18. An old A-bound pending command is not retargeted to B. Old receipts
are not exported; repeated historical domain transaction IDs reject, not double-
append. Export time changes must not change the semantic snapshot fingerprint.
These criteria do not prescribe B's physical storage representation.

## Cancellation/unknown-outcome decision

The established no-partial-change intent holds for known failures and pre-commit
cancellation. A remote request already dispatched can commit despite a lost
response or abort. Calling that a proven rollback would contradict the future
API direction. Recommend a distinct OutcomeUnknown state and exact-request
reconciliation; owner must approve this qualification. It does not authorize
a new locking/cancellation UI in this package. If stronger post-dispatch cancel
is required, stop for a separately designed protocol, not a browser-only fiction.

Before dispatch, meeting date is checked separately from PA/FF contexts. A
future server may reject a stale review context under an explicitly approved
timezone policy; an already-accepted retry still returns its receipt first.
Do not alter a previously dispatched candidate to sneak past date validation.
Precise server-time policy is deferred with authentication/integration, not
silently imposed on the pure evaluator or old effective-date history.
