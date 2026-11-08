# WP7.4 verification and limits

Review date: **2026-11-07, America/Regina**. Starting clean
`feature/wp7-stabilization` at `a5a953e820615e2b1105f235f0060c5831e335bf`.
Authority/hash are in [README](README.md); current source audit is in
[ARCHITECTURE-AUDIT](ARCHITECTURE-AUDIT.md). Only WP7.4 design/evidence changes.

## Executed commands and actual results

Commands ran from the `wp7-stabilization` worktree, with output redirected
to ignored `.wp74-*.log` files and then copied here as UTF-8 text.

| Exact command | Actual result | Evidence |
| --- | --- | --- |
| `npm.cmd run check` | Exit0: lint, typecheck, **486 unit/component tests in35 files**, production build pass. | [check.txt](evidence/check.txt) |
| `npm.cmd run test:e2e -- --workers=3` | Exit0: **223 existing Chromium tests pass**, about2.7 minutes. | [browser-all.txt](evidence/browser-all.txt) |
| `node docs/qa/wp7-4/diagnostics/calendar-anchors.mjs` | Exit0: **12 existing calendar/WP1 anchors pass**; no new working evaluator or event/persistence implementation. | [log](evidence/calendar-anchors.txt), [expected/actual observations](evidence/calendar-anchors.json), [script](diagnostics/calendar-anchors.mjs) |
| `npm.cmd run lint` after the diagnostic was added | Exit0; no production/test/config edits required. | [lint-final.txt](evidence/lint-final.txt) |
| Scope, protected refs, requirement hash and relative-link checks | Only `docs/qa/wp7-4/` added; production/tests/dependencies/configs and earlier acceptance/evidence unchanged. | [verification.json](evidence/verification.json) |

Environment: Node24.19.0, npm11.17.0, Vitest5.0.5, Vite8.3.5,
Playwright1.64.1 / Chromium156.0.8078.4 on Windows. Existing browser scenarios
use America/Regina and their own localhost4173 server and isolated storage.
The browser command used authorized process-cleanup permission; it did not
restart/operate the owner's development server or use the owner's browser data.
The calendar diagnostic uses a middleware-only Vite loader, no listening server,
and an ignored dedicated cache. It uses fictional input only.

The 12 anchor checks have supplied expected answers: strict-after Fri6/Sat7
releaseMon9, Wed11->Thu12, Thu12->Fri13, Fri13->Mon16; M/Th/F Monday2->Thursday5;
four slots on9, its known next-slot release10; twenty slots9-13; original
A/B/C chain2/3/4; current dependent manual9 still ignored (B3); and four
calendar days from2 to6. This diagnostic reuses current calendar/WP1 utilities
to check assumptions. It does **not** implement the proposed general review
queue, constraint evaluator, start replay, transaction, file version or UI.

All existing tests passed on their first WP7.4 run; no incidental test
clarification or expected-result change was needed. Existing color-environment
warnings in the browser log are warnings, not failures. No new package or
network documentation dependency was introduced. Generated screenshots/metrics
under historical QA/review folders were restored to their starting versions;
the new package retains logs and anchor observations only.

## Design coverage check

| Requirement | Design location |
| --- | --- |
| Current events/format5/IDs/graph/manual/scheduler/PA/FF audit and incompatible assumptions | [ARCHITECTURE-AUDIT](ARCHITECTURE-AUDIT.md) |
| Revised start type and strict-next-working-day date-only release | P01/P04/P07 in [POLICY-PROPOSALS](POLICY-PROPOSALS.md); calendar diagnostic |
| Actual Start dates/recording/actor/reasons/corrections/statuses/reopen/legacy Unknown | P02/P03/P06; [EVENT-AND-FILE-CONTRACT](EVENT-AND-FILE-CONTRACT.md) |
| Atomic versus staged operation, deterministic deduplicated joins, full constraints, preview, cancel, failure/retry | P07/P08/P09; [REVIEW-WORKFLOW](REVIEW-WORKFLOW.md) |
| Late/early/past-start prompts and already-started/complete/contradictory successors | P04-P07; workflow and [SCENARIO-MATRIX](SCENARIO-MATRIX.md) cases1-8/12 |
| Minimal default chart, actual/planned qualification, optional comparisons and unchanged baseline access | P10; workflow Gantt table; cases7/10/11 |
| All12 required scenarios with explicit outcomes | [SCENARIO-MATRIX](SCENARIO-MATRIX.md), I1-I7 invariants |
| Version/backups/formats1-5/current data preservation and isolated browser storage | P09/P11/P12; event/file contract; case9 |
| Independent owner choices and later implementation gate | [OWNER-DECISIONS](OWNER-DECISIONS.md), all boxes Pending; [IMPLEMENTATION-SLICES](IMPLEMENTATION-SLICES.md) |

## What has not been verified or authorized

These checks establish no regression to today's app and known calendar
anchors. They do not demonstrate an implemented guided operation, Actual
Start UI, new save transaction, v6 migration, coordination/crash recovery,
new working schedule or simplified chart. The scenario matrix is a set of
future independent acceptance answers, not a test pass rate for new behavior.

No new screenshots are claimed: the proposed workflow is a text/state design,
and the application remains visibly unchanged. No student participant study,
screen-reader session, new working-evaluator performance benchmark or owner
UX acceptance was conducted. Thirty/forty-task regression tests exercise the
existing app, not a future forty-step review. Proposed performance targets
and storage safety must be verified after separately approved implementation.

P01-P12 remain independent owner decisions. WP7.1, WP7.3, WP7.3.2 and
WP7.3.3 acceptance are neither granted nor modified. Main/protected tags,
baseline/history/real data, original checkout and architecture PDF are untouched.
Commit/push this design only, report SHA, and stop at the owner decision gate.
