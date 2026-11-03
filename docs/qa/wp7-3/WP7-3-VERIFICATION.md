# WP7.3 verification and regression evidence

Final results: **414 unit/component tests in 32 files**, **160 browser tests**,
lint, typecheck and production build pass. The browser suite includes all
143 prior cases, adapted for the authorized behavior, plus 17 new C01–C06
cases. Three new pure-summary cases cover Complete with stored 10/0/Unknown.
These are automated results; owner acceptance and WP7.1 verification remain pending.

## Environment and exact commands

Worktree `C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization`,
branch `feature/wp7-stabilization`, clean starting SHA
`3dc291ec556aa0fbd1fae38e2fc9f1ba6acf0308`. Windows x64, Node v24.19.0,
npm 11.17.0, Playwright 1.64.1 / Chromium 156.0.8078.4, Vitest 5.0.5 and
Vite 8.3.5. New contexts use America/Regina and isolated disposable projects
on **127.0.0.1:4173**. No real project was loaded or overwritten.

Local assessment date is Nov 2, 2026; UTC artifacts can be Nov 3. Browser
clock experiments deliberately use Nov 2/3 local dates and distinguish them
from real capture metadata. The 32-logical-processor host is not a student
hardware sample. Screenshots were visually inspected; keyboard checks are
not a comprehensive screen-reader or human-comprehension study.

Commands executed from this worktree:

```powershell
npm.cmd run check
npm.cmd run test:e2e -- tests/wp73/corrections.spec.ts --workers=3
npm.cmd run lint
npm.cmd run test:e2e -- --workers=3
npm.cmd run check
npm.cmd run test:e2e -- --workers=3
npm.cmd run lint
```

| Run | Actual result | Record |
| --- | --- | --- |
| First implementation check | Lint/typecheck passed; 409/411 tests passed, two old new-task-Unknown expectations needed the authorized C04 update | Development log; no runtime defect suppressed |
| Initial 15-case targeted run | 12 passed; 3 tests incorrectly assumed a 2200 px screen removes overflow despite the bounded page width | Test corrected to compare the hint with measured overflow |
| First full browser run | 157 passed, 1 exact-copy assertion failed because “not a predicted finish date” had been pluralized | [first full run](evidence/browsers-first.txt); familiar wording retained |
| Final complete check | **414/414**, 32 files; lint/typecheck pass; production build **64 modules**, exit 0 | [check](evidence/check.txt) |
| Final complete browsers | **160 passed, 0 failed, 0 skipped**, exit 0, three workers and no retries | [browsers](evidence/browsers.txt) |
| Final lint after test additions | Pass, exit 0 | [lint](evidence/lint.txt) |

No dependencies/configuration were changed to obtain these results. Old tests
that asserted Unknown on *new/duplicated* tasks now assert the approved seed;
explicit Unknown and imported Unknown coverage remains. Reopen flows now
make a deliberate choice; snapshot/work/baseline assertions remain. Date
tests choose Fixed explicitly instead of changing away/back to force an input
event. Diagnostic pre-fix assertions were converted to post-fix regressions;
their original assessment screenshots/JSON remain historical records.

## Acceptance coverage

| Scope | Verified behavior | Evidence |
| --- | --- | --- |
| C01 | Actions and aligned header at both horizontal extremes at 1440/1280/780; button hit tests, keyboard duplication, unoccluded focused duration; hint follows real overflow | [1440](evidence/c01-1440.json), [1280](evidence/c01-1280.json), [780](evidence/c01-780.json), [start](evidence/c01-start-1280.png), [end](evidence/c01-end-1280.png) |
| C02 | Complete stored10/0/Unknown × no/partial logs: table/chart/detail effective0, disabled remaining edit; exact raw/history/baseline/actual data across save/reload/import | Six `C02 C03` cases; [Complete summary](evidence/c02-complete-summary.png), [stored10](evidence/c02-10-false.json), [stored0](evidence/c02-0-false.json), [Unknown](evidence/c02-null-false.json) |
| C03 | No-log recorded0 clearly labelled, comparisons unavailable; partial2 stays2, recorded difference-8 qualified; no completeness flag or actual-data rewrite | Same six cases; [partial logs](evidence/c02-10-true.json), existing work-log CRUD/decimal tests |
| C04 | New10 → remaining10, independently reviewed14 survives duration12; Complete effective0/raw14, reopen6; duplicate seeds12 rather than source6 and copies no work/history | [cross-feature](evidence/c04-cross-feature.json), existing copy/ID/order tests |
| C05 | All three entry points; confirm/revise/Unknown, invalid-negative rejection, cancel keeps both states, history unchanged; stored0 and storedUnknown explicitly reviewed | [table](evidence/c05-table.json), [chart](evidence/c05-chart.json), [details](evidence/c05-details.json), [dialog](evidence/c05-reassessment.png); two extra zero/Unknown cases |
| C06 | Explicit Fixed-today, idle local-midnight Automatic update, next-day Fixed reload/import, omitted-date/explicit-date files, no serialized mode flag | [date modes](evidence/c06-modes.json), [controls](evidence/c06-date-mode.png), existing legacy/date/Save QA01 cases |
| Compatibility | Legacy Complete with storedUnknown still has rawUnknown; old missing estimates unfilled; exact format4 backup; current export stays5 | [legacy preservation](evidence/legacy-compatibility.json), existing formats1–4 migration and malformed-import cases |

The cross-feature fixture starts with 181 remaining hours. New10 yields191
(Dec20); review14 yields195; completing it restores181 (Dec18); reopening6
yields187 (Dec19); a copied twelve-hour plan seeds12 and yields199 (Dec22).
Changing scheduled duration alone does not overwrite the estimate. These
intended input effects use the existing unchanged shared-capacity model.
Explicitly clearing the copy's remaining estimate still makes the forecast Partial.

Complete T13 with raw10 contributes no future cost: project work is171 with
or without an optional partial two-hour log. Its original scheduled estimate10,
baseline, raw map, effective completion and history remain intact. Recorded
work never automatically reduces remaining estimates or sets Complete.

## Existing regression protection

The complete suite retains dependency scheduling/cycle rejection, retained
manual-date constraints, calendar boundaries, Gantt modes/scales/geometry,
Network pan/zoom/selection, critical-path highlighting, frozen baseline,
forecast allocations/risk distinctions, optional work CRUD, four statuses,
criteria/attestations, dated completion/reopening snapshots, Save QA01 modal
visibility, local and JSON round trips, legacy backup/overwrite and malformed
atomicity, draft/cancel/refresh recovery, keyboard navigation and responsive
layouts. No tests were skipped or replaced by a smaller smoke suite.

## Protected refs, scope and remaining review

Main remains `a6a1c32c22a2bf074b161e52d523443602843dd7`.
`v1.0-pre-progress` retains object
`a4157bc84392c770c27111da58d779948b110a56`, target
`abb85011dafc9fb0876953e3132880e025ef65da`.
`v1.1-pre-stabilization` retains object
`134305f2205eb993ab76672c2d2469d48d91a609`, target
`af96d3b257ddfdcbc7f26a968401d634d210aef6`.
The owner checkout remains separate on WP6; no real save/server was changed.

[Environment/protection metadata](evidence/environment.json) records checked
values, source requirement identity and scope. Diff review confirms no edits
to scheduling/critical-path/forecast engines, status state machine, persistence,
dependencies or protected references. Historical QA images generated by the
suite were restored; new captures live in this package.

No confirmed C01–C06 issue remains after these checks. Owner validation is
still required; WP7.1's outstanding owner verification is not silently closed.
No C07–C10, WP8, merge, release tag or next package was started.
