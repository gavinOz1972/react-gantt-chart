# R07 recommendation — owner review required

**R07 remains pending. No architecture is selected for implementation.**

Recommend a staged design: retain the proposed A (`snapshot-history/2`) semantic
and portable boundary initially, and separately scope a purpose-based repository
with operational current state, first baseline and paged immutable history. Store
each immutable definition once physically and materialize exact A at export.
Do not make ordinary editing/forecast/Gantt replay or load every historical record.
Do not add periodic checkpoints by default. This is an assessment recommendation,
not authorization to integrate the port or change production persistence.

## Evidence and weaknesses

- Reused 30/40/100-task fixtures show lossless factoring savings. At 100 tasks /
  50 batch cycles, canonical A is 27,057,300 bytes versus factored B 15,686,880;
  operational payload is only 745,022. Both full representations exceed 10 MiB.
- In the 1,034-edge DAG, one root change reviews 99 unique successors. Twenty
  retire/restore cycles produce canonical A 9,366,073 bytes, reconstructable B
  20,117,201 and C 21,743,546. Complete before/after evidence has a real price;
  it is not the same information as explanatory history.
- Checkpoints reduce the measured two-request reconstruction cost from 334.56 to
  91.64 ms for dense c20, but add 1,626,345 bytes. Text200 adds over 8 MB for ten
  checkpoints, many more bytes than its event changes. Historical-read frequency
  and arbitrary target tests are needed before choosing an interval.
- Factoring does not bound history, remove current graph/context memory, certify
  SQL/browser performance or make arbitrary old states reconstructable. Current
  app forecast/progress consumers still depend on legacy status events.
- Keeping A's exact full-snapshot digest can require history traversal on every
  commit/export. The proposed lazy client contract solves client payload loading,
  not automatically server CPU/I/O or validation complexity. That cost is an
  explicit implementation qualification gate.

## Does snapshot-history/2 need amendment?

**No wire amendment is required merely for physical decomposition, indexes, lazy
queries or private derived checkpoints**, provided exact A can be reconstituted
with identical baseline, order, records, provenance and D. The harness demonstrates
that equality on its synthetic cases; no production reader/migration is qualified.
The generic repository needs a separately reviewed operational/history capability;
its existing full-snapshot load/commit contract must not be silently weakened.

**An explicit amendment is required before** changing A's mandatory repeated inline
definitions into wire references, adding authoritative before/after events or
portable checkpoints, changing historical reconstruction guarantees, or replacing
the full-snapshot digest with record-hash/manifests. Propose a named new profile/
version and migration/compatibility matrix for owner decision at that time. Do not
reuse `/2` or the existing hash prefix for a different value, infer missing old
events or relabel Partial as Complete. This assessment makes no such amendment.

F04's prior canonical algorithm/scope evidence remains applicable to A. F08's
10 MiB/depth-64 initial recommendation still needs a lifetime/recovery decision,
browser/full-validation evidence and safe rejection tests. F09 remains accepted
in principle for qualification, not an implemented workflow or final R07 approval.
No earlier owner checkbox or protected contract was edited.

## Classroom versus long-term archival policy

Near term: maintain a bounded classroom portable-reader policy, preflight exact
canonical export bytes and warn about remaining headroom before a plan outgrows
its supported receiver. Reject over-limit imports safely as resource failures,
preserving raw source, accepted ref/baseline and draft/recovery path. The owner must
choose whether future portable-only edits that cross that bound are blocked or
allowed with an explicitly qualified larger-cap recovery/export route. Do not
promise unrestricted long-lived Save when no supported reopen path exists.
Current versions 1–5 and their existing limit/UI stay unchanged by this package.

Long term: database retention is append-only by domain policy, with indexed paged
history and explicit historical reads. Whole portable export remains complete;
it may need a separately qualified higher-cap/offline tool or a separately designed
versioned archival container. Never silently create a lossy “portable” file or
delete history to satisfy classroom/browser quota. Storage budgets, backups,
service access controls and long-term retention are future owner requirements.

## Bounded future sequence — each phase separately authorized

1. Owner records architecture, reconstruction needs, cap/recovery policy and R07
   conditions in [OWNER-DECISIONS](OWNER-DECISIONS.md). Stop; no code begins from
   simply accepting this assessment.
2. Separately authorize a contract-only slice for the operational/history API and
   exact portable materialization/validation boundary. Resolve full-D cost,
   completeness/fact adapters, paging/read sessions and additive versus breaking
   compatibility. Stop for owner acceptance of those contracts.
3. Separately authorize test-only conformance fixtures: real lineage/baseline
   preservation, closure validation, stable pages under commits, exact retries,
   unknown acknowledgements, cancellation and full export round-trip. If exact
   reconstruction is required, first approve a versioned typed-event contract
   and truthful historical coverage rules. Stop before a physical adapter.
4. Separately qualify one adapter (browser or SQL), including crash/quota/deadlock/
   concurrent writer and large import/export memory/digest cost tests. Preserve
   all original data; no activation merely because the adapter tests pass.
5. Separately authorize consumer integration with forecast/progress parity and
   history-free operational reads, then optionally checkpoint experiments if a
   measured historical-query need justifies them. Release/deployment, WP7.4.5 and
   WP8 remain independently gated.

Outstanding choices and risks are explicit below; none is silently resolved by
these measurements. A policy/architecture recommendation is not owner acceptance.
