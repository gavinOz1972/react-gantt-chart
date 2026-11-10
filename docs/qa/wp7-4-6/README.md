# WP7.4.6 — operational consumer parity assessment

Completed as an assessment and test-only verification on
`feature/wp7-stabilization`, from `d0e99034c71dc6141ed8d56cad4f1a3be3627051`.
Client date: 2026-11-10 (America/Regina). **Application behaviour is unchanged.
R07 remains pending final owner review.**

Authority: the owner's WP7.4.6 request and
`Bugsys_WP7_4_6_Operational_Consumer_Parity_Assessment.docx` in the main
worktree's `docs/WP_Req`; SHA-256
`1b5090960a1e2b015b55be81384ad40366ed3fc505fc77117c16ac28b8eec8d2`.
The document authorizes tracing, independent characterization, test-only
transformations, documentation and a bounded commit/push. It excludes runtime
integration, providers, migration, new formats and reporting UI.

## Decision

The capability is **partially sufficient, not ready for application-wide
replacement**. Scheduling/CPM/network and recorded-effort arithmetic reproduce
the characterized active population. Forecast/health parity additionally needs
qualified completion payloads. Progress impact, current global guidance,
status-origin qualification and selected work-log details still have contract
gaps. Retiring a task intentionally changes the active population compared with
legacy physical deletion/current-task evaluation.

Passing a test that exposes a gap does not establish semantic parity. The
[24-case results](evidence/parity-results.json) explicitly retain gaps and
population differences. No production memory, lazy I/O or throughput claim is
made using an in-memory reference adapter.

## Review package

1. [Consumer matrix](CONSUMER-MATRIX.md): exhaustive source inventory and
   field/call-site mapping, including indirect consumers and negative findings.
2. [Parity vectors](PARITY-VECTORS.md): independently captured legacy outputs,
   conditional matches, discrepancies and unproven behaviour.
3. [Integration options](INTEGRATION-OPTIONS.md): recommend a separately
   authorized, default-off, read-only selected-task history slice.
4. [Gaps and gates](GAPS-AND-GATES.md): required contracts, errors, compatibility
   and rollback boundaries.
5. [Verification](VERIFICATION.md) and [owner runbook](OWNER-RUNBOOK.md).

Delivered **96 new characterization checks**, **797 total unit/component
tests in 39 files**, and **223 unchanged-app Chromium checks**. Lint,
typecheck and build passed. Only the new
[test runner bridge](../../../src/repository/operationalConsumerParity.test.tsx)
is added under `src`; all other additions are in this package. There are no
production code or dependency/configuration changes. Existing local evidence
edits remain outside this commit.

Stop for owner review. The next production/UI slice requires separate scope
authorization. R07, FR-HIST-01, physical storage, portable `/2` export/JCS,
formats 1–5 migration, automatic replay, reporting/PDF and snapshots remain
outside this implementation.
