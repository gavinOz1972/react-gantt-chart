# WP7.4.4d — historical architecture contract consolidation

**Documentation-only owner handoff. Final R07 remains pending.**
Client date: 2026-11-09, America/Regina. Branch: `feature/wp7-stabilization`.
Starting SHA: `c967d0c8417d263cccdc3c6b5472036199bbcdcd`.

Authority: owner's request to implement
`Bugsys_WP7_4_4d_Historical_Architecture_Contract_Consolidation.docx`.
SHA-256: `18d6be76b41b965de4a0b47d3ae403f0f0cec2d8666dfc0dc6a222e95dc556e2`.
The source explicitly accepts WP7.4.4c and directions D01–D05; this is recorded
as an owner disposition, not inferred from tests. No production implementation,
model/codec, adapter, migration, reporting UI, PDF export or named snapshot is
authorized here.

## Review path and document ownership

1. [OWNER-DISPOSITIONS](OWNER-DISPOSITIONS.md): accepted A00/D01–D05 with source/date,
   proposed contracts, unresolved U01–U07 and unchecked final R07 acceptance.
2. [CONSOLIDATED-R07-CONTRACT](CONSOLIDATED-R07-CONTRACT.md): authoritative proposal
   index and section ownership. Exact prior `/2` field/integrity definitions remain
   their sole owners; no duplicate schema is introduced.
3. [REPOSITORY-AND-MEMORY-CONTRACT](REPOSITORY-AND-MEMORY-CONTRACT.md): distinct
   additive purpose-based capability, qualified operational projection, paging,
   atomic/retry/unknown-outcome semantics and complete digest cost.
4. [HISTORICAL-REPORTING-CONTRACT](HISTORICAL-REPORTING-CONTRACT.md): original B
   comparison, accessible retired-task/change-log data, query watermarks and three
   worked illustrative examples.
5. [FUTURE-SNAPSHOT-REQUIREMENT](FUTURE-SNAPSHOT-REQUIREMENT.md): deferred FR-HIST-01,
   explicit opt-in capture, separate baseline/log/checkpoint meaning and future gates.
6. [COMPATIBILITY-AND-GATES](COMPATIBILITY-AND-GATES.md): 1–5 versus proposed /2,
   unchanged full D, exact materialization, validation, qualified reopen route and
   conflict/amendment register.
7. [ACCEPTANCE-MATRIX](ACCEPTANCE-MATRIX.md), [VERIFICATION](VERIFICATION.md) and
   [OWNER-RUNBOOK](OWNER-RUNBOOK.md): source coverage, executed checks and actionable
   review/decision steps.

## Consolidated outcome

Retain A's semantic/full portable boundary and the immutable first B. Separate
operational loading from immutable historical retrieval without mandatory replay.
Near-term history is original-baseline comparison, accessible explanations/change
log and retired reporting. Future named snapshots are registered, not added to
`/2` or confused with internal checkpoints. No provider is selected.

Provisional 10 MiB raw/depth-64 safety remains; an accepted portable-only edit may
not outgrow its supported reopen path before a separate larger-cap/offline route
is qualified. Warnings, record pruning and silent increases do not satisfy that
condition. Report Unknown values do not relax mandatory wire fields. Exact full
snapshot D remains; lazy clients do not remove its backend history traversal cost.

All existing regressions pass: 625 unit/component tests, 223 Chromium checks,
lint/typecheck/build. Documentation/scope checks are separate evidence. Existing
application/source/assets and prior owner edits are preserved. Stop for owner
review of the exact delivery SHA; final R07, any implementation, WP7.4.5 and WP8
remain separately gated.
