# Separately gated implementation sequence

This file is planning only. WP7.4.4 delivers no new application/persistence
module or codec. R07 remains a proposal until the owner accepts all schema,
compatibility and integrity choices in [OWNER-DECISIONS](OWNER-DECISIONS.md).

## Compare and map accepted contracts first

| Existing contract | Proposed future mapping / explicit conflict |
| --- | --- |
| WP7.4.3b ProjectSnapshot requires only logicalRevision, generic S | Snapshot6 satisfies this shape without changing the port. Use ProjectRepository<Snapshot6>; keep complete readonly snapshot/ref/receipt/failure/result semantics. Test-only reference is not production storage. |
| Injected SnapshotSemantics | A future approved pure validator checks this snapshot and accepted-state transitions; fingerprint provider uses the proposed full-snapshot profile. Never reuse the fixture-only JSON string fingerprint or fixture validator as real validation. |
| Conditional commit n→n+1 | Append actual changed events in that one project revision; preserve B/old history/IDs/high-water marks. Domain copy/export is not a revision. Receipt reuse is repository-local and separate from historical event identity. |
| WP7.4.2 WorkingState | Reviewed reference.state supplies old promises/calendar; current.tasks/project supply proposed graph, inline actuals supply fact read model; dates/floors/holds/review set remain explicit coordinator inputs. No automatic evaluation or publication on load. |
| WP7.4.2 progress input calls decodeProgress and derives completion from status-event history | This is incompatible with general Option A partial-history/current-actual snapshots. Propose an event-independent validated progress/active-completion input and reopened-history indicator in a later contract review, or typed Unsupported projection. Do not fabricate status events to satisfy the current decoder. |
| WP7.4.1/3a required historical patch/group replay | Explicitly replaced as a proposed portable shape, not accepted code. Event history now explains/qualifies current state; present linked contradictions still reject. No reconstruction prerequisite, sourceDocument digest chain or browser destination in the domain file. |

Possible input design for later review (notation only): retain pure evaluator
project/tasks/WorkingState/actualStarts/draft controls, and replace the
replay-dependent progress parameter with a separately validated read model
containing current four-state progress, active completion Known/Unknown,
historical completed/reopened indication and preserved event/claim provenance.
The exact types and behavior for Unknown completion/future claims need explicit
acceptance and parity tests before modifying any accepted evaluator interface.
Until then return Unsupported for a non-lossless projection; no mixed truth.

PA1/FF/legacy CPM remain based on their accepted source models and explicit
As-of dates. They do not silently consume W or new actuals; no new algorithm or
forecast output is persisted. Retain distinct named comparison models at a
future UI boundary. Baseline remains original WP1, never the new evaluator.

## Recommended stages

| Stage | Prerequisite / acceptance evidence | Activation / rollback |
| --- | --- | --- |
| 1 Pure unused snapshot model/invariants and canonical vectors | Explicit R07 acceptance; exact schema/scalars/error taxonomy, baseline/history transition fixtures, JCS numeric/Unicode/duplicate-name/array-order vectors and limits. Independently specified tests plus full existing regression. | No public reader/writer/consumer. Remove unused module to roll back; no data conversion. |
| 2 Unused portable codec and explicit1–5 copy mapping | Stage1 plus approved compatibility matrix/raw-backup behavior. Test full examples, malformed/future files, unknown/opaque data, all old fixtures, repeated round trips, failed/cancelled upgrade and no down-export loss. | Keep public dispatcher at1–5/write5. New code remains private until separately accepted. |
| 3 Pure evaluator/read-model interface review and adapter | Agree F05 exact Unknown/reopened/completion-correction semantics; preserve all WP7.4.2 literal outcomes where equivalent. Test missing history without synthetic events and full original-baseline independence. | No App activation. Accepted current evaluator unchanged until explicitly authorized interface amendment passes parity checks. |
| 4 Physical browser repository adapter | Separate R04/R05 authorization: native cooperative conditional writes, receipts, baseline lineage, caps/corruption, two-tab/different-resource/unknown/crash/lock-unavailable/cross-browser tests. Same port conformance plus native suite. | No hidden v2 key creation or fallback. Keep legacy source/raw backups. Receipt+snapshot accepted atomically. |
| 5 Transaction/lifecycle/public import/export integration | Separately approved review/edit/delete gates, accepted-state publication, date rollover and OutcomeUnknown reconciliation; all ordinary save/edit routes covered, preserved user data and meaningful UI verification. | Explicit opt-in copy-upgrade; do not overwrite legacy data or claim download+storage atomicity. |
| 6 Optional future API/DBMS adapter | New authentication/authorization/server validation/transaction/operations scope; same portable meaning and conditional repository contract. | No SQL table/blob/key mandate from portable JSON. Multi-user UI/merge/release remain separate. |

Do not bundle all stages into "finish R07". Each starts only after a separate
owner instruction naming its scope; completion of this document is not that
instruction. Native browser adapter and pure codec may be developed separately
after their prerequisites, without forcing domain code to know storage details.

## Deployment and rollback boundaries

Current data is unchanged format1–5 and old browser library. There is nothing
to migrate back now. Future unused-model/codec rollback needs no user-data edit.
After real new evidence exists, rollback cannot silently export5 by stripping
history/actuals/W: retain a compatible reader/export and explicit original backup.
A failed upgrade must leave source usable; a lost acknowledgement must reconcile
the original receipt before any new create. No first-baseline replacement.

No main merge, tag, deployment, resource levelling, fifth status, mandatory
logging, automatic remaining deduction, actual-start capture UI, collaboration,
API implementation or WP8 is authorized by this sequence. Stop for owner review.
