# Implementation impact and proposed next private slice

**Planning only. No P09 implementation starts under WP7.4.3a.** The existing
[WP7.4.1 sequence](../wp7-4-1/IMPLEMENTATION-SEQUENCE.md) remains historical;
this proposal adds the repository abstraction before a physical adapter.
WP7.4.2 is accepted only as an unused pure evaluator and stays unused.

## Reusable versus revised contracts

Reusable: existing domain types/calendar/graph/WP1 and progress validation;
the pure working evaluator; first baseline/original interpretation; date-only
actuals, append-only corrections, optional logs/four statuses; whole candidate
preview and write-before-React-publication intent; explicit old-format backups.

Revise pending6.0-A: grouped project revisions, transport-independent history/
fingerprint, repository resource versus domain lineage identity, copy/import
semantics, private receipt scope and unknown-acknowledgement behavior. These
are material amendments listed in [FORMAT6-IMPACT](FORMAT6-IMPACT.md), not
permission to silently update an earlier approved algorithm or user file.

Keep private: browser key/index/lock/byte limit, HTTP serialization/credentials,
database mapping/transactions/physical row versions, persistence timestamps.
Keep pure: normalized snapshot invariants, historical prefixes, baseline guard,
date precision and calculations. File import/export is a separate versioned
boundary, not a DBMS schema or repository implementation.

## Small recommended next package

Propose **WP7.4.3b: unused repository port and typed test-only reference suite**,
subject to a separately named owner authorization and decisions here:

1. Add unused TypeScript repository/result/ref contracts and a normalized
   snapshot boundary. Compile them against agreed B revision/identity semantics;
   do not add browser APIs, public codec dispatch or App consumers.
2. Add an independently specified conformance suite and test-only memory fake
   for load/list/create/conditional commit, typed failures, receipt replay and
   copy portability. Use validated fixtures/injected invariant boundaries;
   do not pretend a stub validator proves the full domain schema.
3. Pin canonicalization golden vectors and baseline/history transition fixtures.
   If full B schema/replay details are not frozen, stop that part for contract
   review rather than implement a guessed production decoder.
4. Run full existing checks, scope guards and private tests. Demonstrate zero
   consumer import, keys, migrations or user-data effects. Revert unused files
   for rollback; no storage conversion is needed.

The JavaScript toy examples in this package are not that compiled typed suite.
Their result shortcuts and minimal validator are intentionally not proof of
full port/schema conformance. The next slice must use the exact agreed result
shapes and actual normalized model contracts, with explicit limitations if a
dependency remains unresolved.

## Subsequent independently authorized slices

| Stage | Required before starting / acceptance | Public activation |
| --- | --- | --- |
| B snapshot/format6 codec and pure invariant foundation | Approve6.0-B field/replay/hash profile and migration matrix; old formats/baseline/source bytes retained, no lossy downgrade. Native transition validation, not toy checks. | Remains unavailable to App/import dispatch. |
| Initial browser repository adapter | Approve layout/name/cap/fail-closed policy; real two-tab/native fault/receipt/whole-library/known-lineage tests. Port semantic suite passes. | No public v2 writes yet. |
| Transaction coordinator and all ordinary edit gates | Completion/review/source edits, lifecycle guard, pre-review context, accepted-state publication and OutcomeUnknown handling; no bypass through task/calendar/Save routes. | Enable only after end-to-end/private-to-public gate and owner approval. |
| Guided review and optional simplified Gantt | P11/P12 integration and P10 visual approval; actual/planned/Unknown/baseline meanings retained, accessibility/30-40-task checks. | Separate owner acceptance; no hidden evaluator activation from this design. |
| Future HTTP/DBMS adapter | Separate authentication/authorization, API/protocol, relational unit-of-work and operational approval. Same semantic suite plus native server concurrency tests. | Multi-user support explicitly deferred. |

No adapter may depend on a UI "validated" flag instead of boundary validation.
No schema/model change can be hidden in an adapter mapping, calendar revision
or serialization normalizer. If a backend cannot preserve IDs/event order/
baseline/precision, return Unsupported or revise its mapping; do not rewrite
domain logic to fit browser or database storage.

## Rollback and migration gates

Current production remains format5/v1 and has no migration to undo. A future
private adapter failure can be disabled/reverted with old v1 sources untouched.
Once v6 contains new evidence, never roll back by stripping it into5. Preserve
read/export/recovery for the accepted model, use original backups for an old
release, and authorize any layout/DB transfer explicitly.

First adapter's single-key cap/write amplification is a known limit, not a
general architecture rule. If anticipated data exceeds the private profile,
choose a transactional alternative before activation. A technology decision
that requires domain code to understand browser keys, Web Locks, SQL rows or
transport routing fails this architecture and must return for owner review.

No main merge, tag, deployment, schema/key activation, baseline replacement,
resource levelling, mandatory logs, new status, realtime sync, WebSockets,
automatic merge/rebase, collaboration UI or WP8 is included.
