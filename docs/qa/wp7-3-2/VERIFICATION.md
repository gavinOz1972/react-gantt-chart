# Verification record

Review date: **2026-11-03, America/Regina** (some UTC evidence timestamps are
Nov4). Branch `feature/wp7-stabilization`; starting commit
`284a7f921790473c26f5248cefdfe11584d03c5d`. Source/authorization and scope are
recorded in [README](README.md). All data used here is fictional/disposable.
The [machine-readable record](evidence/verification.json) includes environment,
counts, scope guards, authorization and protected-reference values.

## Final checks

| Command | Actual result | Evidence |
| --- | --- | --- |
| `npm.cmd run check` | **452 tests / 33 files pass**, lint, typecheck and production build pass, exit0 | [check.txt](evidence/check.txt) |
| `npm.cmd run test:e2e -- --workers=3` | **182 Chromium browser tests pass**, exit0; 160 existing + 22 new | [browser-all.txt](evidence/browser-all.txt) |
| `npm.cmd run test:e2e -- tests/wp732/progress-impact.spec.ts --workers=3` | Earlier **21 pass**, exit0, during strengthening of the immediate Unknown→dated-outline transition and reload-default As-of assertions. Final full182 includes those checks plus a new same-date project-slot-delay browser check after the last domain correction. | [browser-strengthened.txt](evidence/browser-strengthened.txt) |
| `npm.cmd run lint` after strengthening | Pass, exit0 | [lint log](evidence/lint-after-strengthening.txt) |
| `node tests/wp732/benchmark.mjs` | 8 sparse/dense fixtures, 30/40/60/100 tasks, all p95 <50ms | [performance.txt](evidence/performance.txt), [raw measurements](evidence/calculation-performance.json) |
| `node tests/wp732/export-fixtures.mjs` | 13 current-format owner-review files validate | [fixtures.txt](evidence/fixtures.txt) |

Node24.19.0, npm11.17.0, Vitest5.0.5, Vite8.3.5,
Playwright1.64.1 / Chromium156.0.8078.4 on Windows. Browser timezone
America/Regina. Browser suite uses its own localhost4173 test server and
isolated storage, not the owner's existing development server/library.

## Independent calculation and compatibility evidence

The 38 new domain tests include all **23 pre-implementation paper cases**
covering L01–L16, plus permutation determinism, corrected effective-date
sequence, ties, changed controlling branch, date-only project precision,
legacy formats1–4, current-format round-trip, frozen baseline/source/CPM
invariants, independent FF and invalid/range boundaries. Expected PA dates
come from WP7.3.1's hand matrix, not from the implementation under test.

L15 retains FF B Nov4 while PA B Nov5; baseline/current B remain Nov3.
L16 save/load/import checks exact source preservation with external PA As-of.
The full browser suite also covers previous freeze/capacity Save regression,
legacy backup/migration behavior, statuses, reopening, optional logs,
baseline protection, editing, navigation and responsive layouts.

No changes to `src/domain`, `src/forecast`, `src/persistence`, baseline or
progress event code, package/lock files, Vite/Playwright/TypeScript config or
file schemas. New derived code is isolated under `src/projection`; chart
integration and coordinate extents/row geometry are explicit reviewed diffs.
Historical generated screenshot/evidence changes from regression were restored;
new screenshots and copied current performance evidence live only here.

## Performance observations and limits

Pure Node calculation benchmark includes committed validation/scheduling,
progress decoding and PA. On this shared AMD Ryzen9 8945HX host (32 logical
processors), the exact fixture p50/p95/max are recorded in the linked JSON;
all fixtures passed the p95 <50ms target. These are observational
host measurements, not a classroom-device guarantee or browser paint time.

The unchanged forty-task browser interaction benchmark passed with responsive
heartbeat and no page errors/overflow. Save-through-visible-result timings
include automation/actionability/two frames, separately from storage-write
duration. Long-task observations are retained; this is **not a zero-long-task
claim**. See [raw interaction record](evidence/forty-task-interaction-performance.json).
New 30/40-task checks retain bounded rows and keyboard scrolling; their
[30-task](evidence/i-30-browser.json) and [40-task](evidence/i-40-browser.json)
import/readiness observations likewise include automation overhead.

## Failures investigated, not hidden

Early test authoring encountered jsdom URL handling in a pure file-reading
test, missing app Node typings, noncanonical fixture timestamp precision and
an overflow example that actually fit the last available working day. The
test now runs in a Node environment with Vite raw fixture imports, canonical
timestamps and a genuinely overflowing duration. These were test setup
errors; no scheduling/calendar formula was changed.

The initial existing-unit run had 413 pass / 1 fail: a virtualization test
hardcoded 52px row height. It now uses the common 84px geometry constant.
An early typecheck failed for the test's Node fs import; raw fixture imports
resolved that without dependency/configuration changes.

The initial full browser attempt logged **172 pass / 9 fail**, then was
interrupted during sandboxed test-server cleanup. Its [raw log](evidence/browser-initial.txt)
is retained. Corrections were: restore existing scale/mode reset behavior
(three diagnostic failures); scope two old `Late` locators; name dependency
inspection separately from the new live PA summary; compare preserved
committed markup instead of all-chart pixels after a status change (two
widths); measure click-scroll with the target already actionable. Details
are in [traceability](TRACEABILITY.md). No expected committed dates or
critical flags were weakened.

Final review also found a new projection aggregation error: known planned
finishes on the same calendar date were all treated as finish-driver ties,
even if their slot boundaries differed. Driver selection now compares exact
planned boundaries when available; a tied date-only actual retains possible
drivers without an invented hour. Additional domain tests cover exact order,
genuine planned ties and date-only ambiguity. A related same-calendar-date
project finish can move to a later known slot; it now reports that slot
variance instead of falsely claiming absorbed slack. A domain and browser
case cover the one-slot project delay with zero date difference. The full
checks were rerun after these corrections.

Initial new-browser fixture tests also used a nonexistent Load button name
and omitted the existing unsaved-import confirmation; both were corrected.
Sandboxed browser attempts executed test bodies but could not finish owned
server cleanup; process enumeration was denied. The final full and targeted
runs used approved execution with server-cleanup permission and exited0.
Removing a fixed browser clock did not resolve the sandbox cleanup issue;
no application freeze or clock defect is attributed to that investigation.
Existing NO_COLOR/FORCE_COLOR warnings are captured and are not test failures.

## Screenshot review

| Owner scenario | Captured application evidence |
| --- | --- |
| Immediate completion, all toggles off | [A/J](evidence/a-j-immediate.png) |
| Absorbed slack | [B](evidence/b-slack-absorbed.png) |
| Started / blocked / reopened / conflict | [L09](evidence/c-l09.png), [L14b](evidence/c-l14b.png), [L13](evidence/c-l13.png), [L10](evidence/c-l10.png) |
| Same-date precision | [D](evidence/d-date-only-precision.png) |
| Same-date project slot delay | [Exact modelled slot variance](evidence/same-date-project-slot-delay.png) |
| Changed driver, committed CPM | [Gantt](evidence/e-changed-driver-gantt.png), [Network](evidence/e-network.png) |
| All layers simultaneously | [H](evidence/h-all-layers.png) |
| Nonworking actual date in Compressed | [Collapsed date](evidence/nonworking-compressed.png) |
| Long project keyboard/virtualization | [30 tasks](evidence/i-30-tasks.png), [40 tasks](evidence/i-40-tasks.png) |

Combined layers, Network and forty-task images were visually inspected for
readability and separation. Automated passes are not owner UX acceptance or
a student participant study. Use [ACCEPTANCE](ACCEPTANCE.md) after review.
