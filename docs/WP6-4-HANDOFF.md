# WP6.3.1 and WP6.4 — combined owner review

Implemented in order on `feature/wp6-progress-tracking`, at the owner's explicit
request to test after both packages. That request supersedes the documents'
intermediate approval gate. No WP6.5 work is included; owner acceptance remains
pending. Existing selected-summary status editing is retained.

## Commits and protection

- Starting clean feature commit: `ae142d64839db02d14f12d9483284cec0106d75c`.
- WP6.3.1 separate commit: `a8ea0ee` — safe selected-task dismissal, verified
  before beginning forecasting (341 unit/component tests, 82 browser tests).
- WP6.4: the commit containing this handoff; exact SHA reported with delivery.
- Main remains `a6a1c32c22a2bf074b161e52d523443602843dd7`.
- Annotated `v1.0-pre-progress` object remains
  `a4157bc84392c770c27111da58d779948b110a56`, target
  `abb85011dafc9fb0876953e3132880e025ef65da`.

## Delivered changes

| Area | Files / behavior |
| --- | --- |
| Dismissal | App, GanttChart, RemainingEffortField, styles: Close at summary's right; passive Escape, nested edit/confirmation priority, focus restoration, preserved scroll/scale and unrelated drafts |
| Forecast engine | `src/forecast/forecast.ts`, `settings.ts`: pure allocation, capacity, uncertainty, date comparisons |
| Interface | `src/components/forecast/*`, App/styles: compact summary below visualization, settings in Project Settings, selected-task comparisons; no Gantt overlays |
| Completion context | taskProgress and TaskStatusPanel: committed finish captured with each new completion, retained in read-only history |
| Persistence | projectFile/ProjectStorage: format 5, optional version-1 assumptions, legacy versions 1–4 and original-format backups |
| Verification | forecast engine/persistence tests, forecast browser tests, close browser tests, version/selector expectations in existing regressions |

Weekly capacity is **(class + homework hours per student) × team size**, once.
Capacity is a shared pool spread uniformly over seven calendar days, including
weekends, and target capacity includes both endpoint dates. With 3+5 hours × 4,
32 person-hours/week gives 192 over 42 days. Partial weeks prorate without daily
rounding loss. Finish dates use the last occupied date at exclusive boundaries.

Ready tasks are prioritized by earliest committed finish boundary, then saved
manual order, then stable ID. One shared daily budget cannot be spent twice.
Consecutive equivalent daily allocations are batched arithmetically for bounded
runtime. A successor can consume residual capacity after its predecessor finishes.
Complete tasks cost zero; actual session logs never grant future capacity.

Unknown effort and Blocked tasks (including unfinished descendants) make the
project Partial, without a definitive finish or feasibility verdict. Zero
capacity makes forecast dates unavailable. Known independent branches can still
project. The surplus is explicitly known-work-only when incomplete.

Late requires an unfinished task and As-of after its committed finish. At Risk
requires a forecast overrun before the commitment has passed; uncertainty never
becomes On Schedule. Completed Late uses effective completion versus the committed
finish frozen in that completion event, surviving subsequent plan edits/imports.
Legacy completions lacking that context show Completion timing unavailable.
Baseline, committed and forecast dates remain separate; effort variance is not
translated directly into schedule lateness.

## Validation

`npm.cmd run check`: lint, TypeScript, **379 tests across 30 files**, production
build (59 modules). Browser regression: **88 tests** including all older
workflows and six new forecast scenarios. Desktop 1440px and narrow 600px evidence
is in [desktop](review/wp6-4-forecast-1440.png) and
[narrow](review/wp6-4-forecast-600.png). The older outside-click picker test now
uses a viewport where its forced disabled-Delete click is visibly outside the
portal; it also passed five repeated runs.

Coverage includes formula/partial weeks, zero/invalid settings, null effort,
completed predecessors, shared fractional capacity, deterministic manual priority,
blocked propagation/unblocking, Late/At Risk boundaries, immutable historical
completion timing, baseline/actual invariants, both remaining-entry controls,
settings/local/JSON round trips, safe malformed imports and legacy backups.
Existing version assertions now expect format 5; exact inspection selectors
distinguish the new Close accessible name.

## Owner test script (about five minutes)

1. Refresh `http://localhost:5173/` and load a saved plan. Select a Gantt bar.
   Use Close, reselect the same bar, and press Escape while the summary is focused.
   Begin a Remaining Effort edit: the first Escape cancels that draft; a later
   passive Escape dismisses the summary. Scroll, scale and chart mode stay put.
2. In Project Settings, enable Forecast assumptions. Enter class 3, homework 5,
   team 4, As-of 2026-11-02. Workspace shows 32 person-hours/week. A target of
   2026-12-13 gives 192 person-hours over the inclusive six-week interval.
3. Enter explicit Remaining Effort for unfinished tasks. Leave one blank to see
   Partial and its ID; restore it to see projected completion. Increase an
   estimate via the selected summary, then reduce it via the task table. Forecasts
   update; committed bar geometry and original baseline dates remain unchanged.
4. Set a predecessor Blocked with a reason. It and unfinished descendants become
   indeterminate. Unblock it to recalculate. Set capacity to zero for unavailable
   dates. Try team size 1.5: Save/Export and the forecast are unavailable until
   corrected or Revert invalid forecast entries is used.
5. With As-of before a task's committed finish, increase remaining effort until
   At Risk appears. Set As-of to the day after commitment: Late appears. Complete
   it with an effective date after commitment, explicitly confirming the checklist;
   Completed Late remains after editing current duration or reimporting the export.
6. Save As under a new name, reload, select Saved plans → Load project. Export
   and reimport JSON. Settings, completion context, actual logs and baseline survive;
   projections rederive. Older loaded files offer their original-format backup
   before a deliberate save upgrades them to format 5.

## Limits

This is an approximate aggregate priority heuristic, without individual resource
availability, assignment or concurrency guarantees. Capacity/effort displays round
to two decimals; dates are date-only. Year-9999 and safe numeric bounds produce
Unavailable. Automatic As-of follows local today on rendering. Unknown/blockage
has no guessed resolution date. No automatic replanning, re-baselining, bar overlays,
overtime calendars or probabilistic forecast is included. WP6.5 remains deferred.

See [calculation details](../src/forecast/README.md) and
[WP6.3.1 handoff](WP6-3-1-HANDOFF.md).
