# WP7.4.1 - Implementation readiness and contract resolution

**Design and verification only. No application feature, UI, calculation,
persisted format or accepted project data changes.** Date: 2026-11-07,
America/Regina. Starting tree was clean on `feature/wp7-stabilization` at
`93bcc5396724b02cc00361e87113a26f3a563b64` (WP7.4 design).

Authority: owner request to implement WP7.4.1 and the saved requirement
`react-gantt-chart/docs/WP_Req/Bugsys_WP7_4_1_Implementation_Readiness.docx`,
SHA-256 `b08b4859dc77cc1da9a2b610115d53e7c5dec8f7a2a90140126c75a4129ab4a2`.
It authorizes this design/diagnostic handoff, commit and push, and explicitly
prohibits production implementation. All [WP7.4 deliverables](../wp7-4/README.md)
were reviewed. Earlier sheets remain historical records, not edited approvals.

## Owner intent carried forward

- E01 is absolute: the first baseline and original WP1 interpretation are
  immutable; keep View Baseline, comparisons and final-project review.
- P01-P08 are conditionally approved by the WP7.4.1 requirement, subject to
  implementation contracts. A not-before floor is not necessarily the computed
  start; show and confirm the actual calculated commitment. Late keep/sever,
  early keep-by-default, no retrospective plans, all predecessors, date-only
  actual evidence and atomic draft/preview/apply with reasoned Unresolved stand.
- Actual Start is first-ever reported substantive work; append corrections/
  retractions, permit legacy In Progress with Unknown start, never deduct effort.
- P10 is approved in principle only, pending owner visual review. The default
  must explain start, finish and lateness without calling elapsed time effort.
- P09/P11/P12 remain deferred. The mechanisms here are recommendations requiring
  independent decisions. No blanket approval of format6, Web Locks, archival,
  consumer rewiring or new CPM/PA rules is inferred.

## Decision-ready artifacts

1. [P01 calculated commitment](P01-CALCULATED-COMMITMENT.md): floors, holds,
   exact computed starts/finishes, joins and H3 examples.
2. [P09 storage decision](P09-STORAGE-DECISION.md) and
   [exact format6 candidate](FORMAT6-CONTRACT.md): copy upgrade, single-write
   boundary, coordination, rollback and failure matrix.
3. [P11 lifecycle decision](P11-LIFECYCLE-DECISION.md): phase-one reference
   deletion guard, existing purge risks and fresh-copy semantics.
4. [P12 consumer contract](P12-CONSUMER-CONTRACT.md): named sources/projections,
   evaluator interface, pre-review completion context and all editing gates.
5. [Acceptance matrix](ACCEPTANCE-TEST-MATRIX.md): inputs and independently
   expected outcomes for later runnable tests, including concurrency/accessibility.
6. [Implementation sequence](IMPLEMENTATION-SEQUENCE.md): first an unwired pure
   evaluator; later foundation remains inaccessible until safe integration.
7. [Owner decisions](OWNER-DECISIONS.md): independent choices and a bounded
   first-slice authorization, all unchecked.
8. [Verification](VERIFICATION.md): actual checks, primitive-spike results and
   explicit unsupported claims.

The spike uses disposable storage and a counter stand-in, not a production
adapter or new project decoder. It checks real Chromium locks, two tabs,
quota rejection and sandbox denial, plus labelled failure simulations and
existing format1-5 fixtures. It demonstrates limits as well as working paths.
Its results do not certify format6 migration or another browser engine.

WP7.1, WP7.3, WP7.3.2 and WP7.3.3 acceptance remain independent. No main merge,
protected-tag change, deployment, rebaseline or WP8. After design commit/push,
stop for owner review and a separately named implementation work package.
