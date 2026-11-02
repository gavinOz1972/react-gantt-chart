# WP7.1 disposable student project

These fixtures are QA data, not owner projects. Use a clean/private browser
profile and a local server for the stabilization worktree. Never overwrite a
real saved plan. All saved test names start `WP71 DISPOSABLE`.

## Inputs and files

Project `QA-WP71-STUDENT`, “WP7.1 DISPOSABLE - Campus Study Planner”, starts
**2026-11-02**, targets **2027-02-26**, and works **Monday, Tuesday, Thursday,
Friday, four numbered working hours per working day**. No holidays are added.
Wednesday/weekend dates consume elapsed time but no committed working slots.
Dependencies are finish-to-start; parallel branches have no resource levelling.
Every task has its own meaningful description. Manual order is T1–T30, the
next ID is T31; the extended file adds T31–T40 and next ID T41.

| ID | Task | Hours | Predecessors | Requested manual date |
| --- | --- | ---: | --- | --- |
| T1 | Project charter and responsibilities | 4 | — | — |
| T2 | Student interviews | 6 | T1 | — |
| T3 | Acceptance criteria | 3 | T2 | — |
| T4 | Personas/accessibility needs | 4 | T2 | — |
| T5 | Feedback permission | 2 | — | Nov 5 |
| T6 | Navigation/task-entry wireframes | 8 | T3, T4 | — |
| T7 | Architecture | 6 | T3 | — |
| T8 | Repository/checks | 4 | T7 | — |
| T9 | Durable IDs/schema | 6 | T7 | — |
| T10 | Sign-in prototype | 8 | T8, T9 | — |
| T11 | Working calendar | 8 | T9 | — |
| T12 | Mentor review | 2 | — | Nov 13 |
| T13 | Task entry workflow | 10 | T10, T11 | — |
| T14 | Dependency validation | 8 | T13 | — |
| T15 | Accessibility review | 6 | T6, T13 | — |
| T16 | Feedback sessions | 5 | T5, T6 | — |
| T17 | Revised mockups | 4 | T16 | — |
| T18 | Gantt rendering | 12 | T14, T17 | — |
| T19 | Work-log entry | 8 | T13 | — |
| T20 | Capacity forecast | 10 | T19 | — |
| T21 | Integration fixtures | 6 | T14, T19 | — |
| T22 | Integration checks | 10 | T18, T20, T21 | — |
| T23 | Failure recovery checks | 6 | T22 | — |
| T24 | Performance checks | 8 | T18, T20 | — |
| T25 | Presentation rehearsal | 3 | — | Nov 18 (Wednesday) |
| T26 | Completion evidence | 4 | T15, T23 | — |
| T27 | Runbook/limitations | 5 | T24, T26 | — |
| T28 | Pilot demonstration | 4 | T12, T25, T27 | — |
| T29 | Accepted review items | 8 | T28 | — |
| T30 | Handover | 3 | T29 | — |

The 40-task extension is a sequential review/handover chain after T30 with
durations **4, 6, 3, 8, 2, 5, 4, 6, 3, 4** hours, deliberately long labels,
and detailed descriptions. It adds 45 hours.

| File | Purpose |
| --- | --- |
| `student-30-create.json` | Format 5, 30 tasks, no baseline, no estimates/forecast settings; deliberate baseline and Partial forecast setup |
| `student-30-prepared.json` | Format 5, frozen baseline, all remaining estimates equal original durations, enabled forecast |
| `student-40-performance.json` | Same prepared state with the additional ten-task chain |
| `legacy-format-1.json` | WP5.2-era project/tasks/order, no invented baseline/work/status |
| `legacy-format-2.json` | WP6.1-era baseline, no work/status/forecast |
| `legacy-format-3.json` | WP6.2-era baseline/work structure, no status/forecast |
| `legacy-format-4.json` | WP6.3-era baseline/work/status structure, no forecast |
| `expected-anchors.json` | Derived full schedules and critical IDs, checked against the independent anchors below |

Prepared baselines have fixed IDs `QA-WP71-BASELINE-30` / `-40` and metadata
timestamp `2026-11-02T12:00:00.000Z`. They contain no real work or invented
status events. Each unfinished task's remaining estimate is explicitly entered
as its duration, for a simple verifiable forecast scenario.

## Independent expected anchors

Sum durations by hand: **181 hours** for 30 tasks, **226 hours** for 40.
One longest path is T1 → T2 → T3 → T7 → T9 → T10 → T13 → T14 → T18 → T22
→ T23 → T26 → T27 → T28 → T29 → T30: **103 slots**. The equally long
branch through T11 also makes T11 critical. With four slots/day, slot 103 is
the 26th working day, **2026-12-15 after hour 3**. The extension uses 148
slots (37 working days), finishing **2027-01-04 after hour 4**.

| Anchor | Expected |
| --- | --- |
| T1 | Nov 2, hour 1 through after hour 4 |
| T2 | Nov 3 hour 1 through Nov 5 after hour 2 |
| T5 | Requested/start Nov 5; finish after hour 2 |
| T12 | Requested/start Nov 13; finish after hour 2 |
| T25 | Requested nonworking Nov 18 advances to Nov 19; finish after hour 3 |
| T30 | Dec 15 hour 1 through after hour 3 |
| T18 changed 12 → 16 | Current completion Dec 17 after hour 3; baseline remains Dec 15 after hour 3 |

Forecast is a separate uniform **calendar-day person-hour** model, not the
committed weekday/working-slot model. Prepared assumptions: class **3**,
homework **5** hours/student/week, team **4**, As-of **2026-11-09**.
Weekly capacity `(3 + 5) × 4 = 32`; daily capacity `32/7`. All tasks have
known remaining estimates, so project finish is the last occupied calendar
day across all 181/226 person-hours. Actual work entries do not silently
reduce remaining estimates.

| Forecast anchor | Independent arithmetic / expected |
| --- | --- |
| 30 tasks | `181 / (32/7) = 39.59375` days; last occupied day **Dec 18** |
| 40 tasks | `226 / (32/7) = 49.4375` days; last occupied day **Dec 28** |
| Target capacity | Nov 9–Feb 26 inclusive = 110 days; `110 × 32/7 = 502.857142857` person-hours (UI **502.86**) |
| Team reduced to 2 | 16 hours/week; 181 hours finish **Jan 27, 2027**; target Jan 15 gives **At Risk** |
| 40-task T20 estimate 10 → 13 | 229 remaining hours, forecast **Dec 29** |
| Missing estimate | **Partial**, not an invented zero |
| Blocked dependency | Dependent finish indeterminate; remove confident downstream FF endpoint; unblocking restores projection |

Dec 18 versus the original Dec 15 commitment is a task **Forecast Slip**,
while the project is **On Track** against Feb 26. These labels answer
different comparisons. Visualization-only actions must not change source
tasks, baseline, work, statuses or their historical events.

## Reproduce / regenerate

From this worktree with locked dependencies installed:

```powershell
node tests/wp71/export-fixtures.mjs
npm.cmd run test:e2e -- tests/wp71/lifecycle.spec.ts --workers=3
$env:WP71_PERF_MODE = 'isolated'
npm.cmd run test:e2e -- tests/wp71/performance.spec.ts --workers=1 --repeat-each=3
Remove-Item Env:WP71_PERF_MODE
```

The generator loads existing pure modules through Vite in memory and asserts
the hand-calculated anchors; it changes no product code. Generated schedules
are supporting detail, not an independent oracle on their own. Browser tests
use new contexts and `127.0.0.1:4173`, never the owner's localhost:5173 saves.
The owner route and results are in `docs/qa/wp7-1/`.
