# WP7.4.3b — unused repository port and conformance tests

Implemented on `feature/wp7-stabilization` from clean HEAD
`4d32a4e8ccb61651f422cdb2de242e6d0297573e`. Review date:2026-11-08,
America/Regina. No UI change is expected.

Authority is the owner's request to implement
`react-gantt-chart/docs/WP_Req/Bugsys_WP7_4_3b_Repository_Port_Conformance.docx`,
SHA-256 `a8df94919e78642cc7daeca33439d5cd0a81730a0d4d5922ab77206e2bae60b3`.
Its section1 accepts WP7.4.3a as a design handoff and approves R01/R02/R03/
R06/R08/R09. R04/R05 are conditional future physical-adapter decisions;
R07 remains deferred. This newer authorization is recorded here without
rewriting historical owner sheets or independent earlier acceptance gates.

## Delivered

- [Unused typed port](../../../src/repository/projectRepository.ts): opaque
  resource/transaction/fingerprint/cursor types, recursively readonly snapshots,
  refs/receipts, load/list/create/conditional commit, typed failures and
  OutcomeUnknown. Validation and fingerprinting are injected boundaries.
- [Test-only reference](tests/referenceRepository.ts), [independent narrow
  fixtures/validator](tests/fixtures.ts) and [reusable conformance suite](tests/conformance.ts).
  The reference uses only memory and copies input/output data. It models one
  atomic synchronous critical section, receipt replay and injected failures.
- [Runner bridge](../../../src/repository/projectRepository.test.ts) brings
  the documentation-owned tests and [compile-only type assertions](tests/typeChecks.ts)
  into existing Vitest/TypeScript checks without changing configuration.

The suite has74 passing cases; all625 unit/component and223 existing Chromium
browser checks pass. See [VERIFICATION](VERIFICATION.md) for logs, the initial
compiler failure and correction, scope evidence and limitations.

## Contract boundary and intentional deferrals

`ProjectRepository<S>` treats S as the complete snapshot but only requires its
logicalRevision field. It does **not** define format6 state/history/group/replay
fields. The test fixture and its exact ordered JSON fingerprint are deliberately
narrow fakes; neither is the pending format6 schema/canonicalization profile.
The dependent full-schema/golden-vector work stops at this boundary under R07.
The port uses the approved result shapes, including original committedRef
versus possibly newer currentRef, rather than the WP7.4.3a toy shortcuts.

No application consumes the port or reference. Existing persistence keys,
formats1–5, baseline and scheduling/forecasting/evaluator logic remain unchanged.
There is no browser adapter, codec activation, actual-start capture, API/DBMS,
authentication, migration, UI integration or release operation.

Review [CONTRACT-TRACEABILITY](CONTRACT-TRACEABILITY.md),
[CONFORMANCE-MATRIX](CONFORMANCE-MATRIX.md), [OWNER-RUNBOOK](OWNER-RUNBOOK.md)
and [ACCEPTANCE](ACCEPTANCE.md). Stop for owner acceptance. Recommended next
slice: separately scope an R07 decision and pure validation/representation
contract, resolving its open fields before implementing any private codec.
Browser adapter design/testing remains a separate subsequent authorization.
