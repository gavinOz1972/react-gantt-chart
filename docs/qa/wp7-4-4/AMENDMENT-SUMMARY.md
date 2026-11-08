# WP7.4.4a retirement amendment - review handoff

**Documentation and fictional examples only.** The owner confirmed this amendment
after a repeated WP7.4.4 request. WP7.4.4 is accepted only as a design handoff;
the amended R07 schema is not final and no implementation slice is authorized.

Authority: `Bugsys_WP7_4_4a_R07_Retirement_Amendment.docx`, SHA-256
`bfd029dc021ff550f5b56e119562acd2c9a7adf54be5d278993b8ce6bdc8c0c9`.
Branch/base: `feature/wp7-stabilization` at
`fd7fee933f843c9b547e88590e2bb1b20edb4081`. Review date:2026-11-08,
America/Regina. Existing local evidence edits are preserved.

## Changes to the existing design

- F01/F02/F03/F05/F06/F07: approved in principle, subject to complete-contract
  consistency review. F04: conditional JCS/SHA-256, independent cross-language/
  Unicode/numeric/duplicate-member vectors and explicit scope still required.
  F08: conditional rejection/source preservation;10MiB/depth64 remain provisional,
  pending realistic/larger fixtures. F09: retirement workflow replaces blanket
  deletion prohibition; concrete schema/examples still require final review.
- Candidate `snapshot-history/2` adds retained task lifecycle, immutable retirement/
  restoration before-context, archived edge episodes and whole scope-review records.
  No fifth progress status; original baseline, estimates/status/actuals/logs/IDs
  remain. Current calculations use only active tasks/edges; the digest covers ALL
  retained data. `/1` was an unreleased design draft, not production data to migrate.
- Guided review takes the downstream closure, accumulates all predecessor changes,
  deduplicates by task ID and records one final outcome each. New retirements
  expand closure; changed bounds require reconfirmation. Preview all changes and
  accept one whole revision/transaction, or cancel before dispatch with zero
  accepted changes. OutcomeUnknown after dispatch is still reconciled honestly.
- Restoration is a new reasoned review, never assignment of baseline edges or
  old commitments. It preserves previous retirement/archive/event records.
- Gantt default hiding, Show Retired Tasks relics and future WP8 scope-change
  reporting are CONTRACTS ONLY. No elapsed-work bar can be inferred from retirement
  date. Toggle changes presentation only, outside the snapshot/digest.

Read [FORMAT6-CONTRACT](FORMAT6-CONTRACT.md), [JSON-EXAMPLES](JSON-EXAMPLES.md),
[OWNER-DECISIONS](OWNER-DECISIONS.md) and amended scenarios in
[SCENARIO-MATRIX](SCENARIO-MATRIX.md). Updated integrity/migration/implementation
documents retain the separately gated code/adapter/UI boundaries.

## Executed checks and limits

| Check | Actual result | Evidence |
| --- | --- | --- |
| `npm.cmd run check` in isolated export of feature HEAD | Exit0: lint/typecheck,625 unit/component tests in37 files and production build. | [Log](evidence/amendment-check.txt) |
| `npm.cmd run test:e2e -- --workers=3` with process-local color handling/native exit capture | Exit0,223 existing Chromium browser checks,2.6minutes, isolated4173 server; owner5173/5174 untouched. | [Log](evidence/amendment-browser-all.txt) |
| Selected fictional document authoring checks |199 pass: JSON/restricted digests, active map/graph/W coverage, preserved data/old baseline values, rationale/date/nullable actor, literal closure/archive/cancel/restore/v5 cases and existing legacy/WP1 validators. | [Individual checks](evidence/amendment-example-checks.json), [inventory](evidence/amendment-example-authoring.json) |
| Source/application/scope/preservation checks | No code/config/dependency changes; original and isolated application asset bytes match; pre-existing evidence edits unchanged; local links/decision dispositions checked. | [Scope](evidence/amendment-scope-review.json), [metadata](evidence/amendment-verification.json) |

Original WP7.4.4 evidence remains historical at fd7fee9. The new authoring check
first encountered a temporary Windows ESM import issue, then a hand-authored
baseline predecessor-order mismatch. Corrected tooling and the NEW fictional
baseline schedule ordering to original WP1 convention; all199 final checks pass.
Existing eight example baseline JSON values and every real baseline are unchanged.
See [review note](evidence/amendment-review-notes.txt). No regression assertion failed.

The199 checks are selected data-authoring assertions, not a delivered lifecycle
validator, full codec/JCS certification, guided workflow, atomic disk write,
Gantt toggle or report. Cancel/confirm/toggle examples are data oracles. F04
cross-language vectors and F08 realistic/larger size/depth/history-growth tests
remain outstanding, as do native workflow/concurrency/accessibility tests.

## Interactions requiring final review

Retired references must resolve in the full registry while active graph/W/FF/CPM
projections exclude them. Lifecycle/edge/review/history prefixes are immutable;
nextTaskNumber includes known allocated IDs and never resets on retirement or
restoration. Legacy absent tasks are not invented retirements. Snapshot size
can grow from preserved before-context and archive episodes: quantify it before
fixing limits. The existing generic repository port needs no shape change, but
real validation/projection/whole-candidate integration remains unimplemented.

Stop for owner review of these interactions and F09's concrete proposal.
No pure model, canonicalizer, codec, storage adapter, guided workflow, lifecycle
UI/Gantt toggle, WP8 report, merge, tag or deployment follows automatically.
