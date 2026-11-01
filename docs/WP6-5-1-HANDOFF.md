# WP6.5.1 — Forecast visual clarity

Implemented on `feature/wp6-progress-tracking`, starting at verified commit
`223ed0f`. The implementation commit contains this handoff; its SHA is reported
with delivery. The pre-existing untracked `docs/WP_Req/` directory was read for
the requested specification and left intact, without adding or discarding it.

## Bounded changes

**Show Forecast** now controls purple overlays, predictive row badges, row/bar
tooltip comparisons and predictive badges in the selected Gantt summary. Hidden
annotations do not disable Enable effort-based forecasting, change estimates,
dirty a clean saved project or change the project-health result. Detailed task
forecast dates remain accessible in the selected panel and Task Details.

Observed **Blocked**, actual **Late**, and recorded completion evidence remain
visible independently. Invalid forecast-capacity drafts also cannot erase actual
lateness at the accepted As-of date. Critical Path retains its own checkbox.

Task-level predictive **At Risk** is presented as **Forecast Slip**. Earlier
forecasts use **Ahead of Plan**; same-date forecasts use **On Track**. Unknown or
indeterminate projections receive none of those positive/slip labels. Project
**At Risk** continues to mean projected delivery beyond the project target.
For example, task commitment 2026-11-02 versus forecast 2026-11-06 is Forecast Slip
while project delivery before a 2026-12-18 target remains On Track.

Purple markers now say **FF (Forecast Finish)**, even left of the whole committed
bar. Hover/focus descriptions include committed finish, forecast finish, calendar
days earlier/later (or same date), and known remaining person-hours when available.
Completed work contributes zero future effort in that annotation. The chart help
and marker description explicitly say dashed length represents a difference
between calendar dates, not effort hours or scheduled working slots. Existing
fractional endpoint, clipped-edge and omitted compressed-date geometry is intact.

Disabled forecasting has an explanation beside Show Forecast directing the user
to Project Settings. Show Baseline remains independent. New/load/import still
start with annotations off; existing UI-only visibility lifetime is unchanged.

Network currently has no forecast-health node indicators to rename. Its critical
path labels, layout and calculations are unchanged; no new Network UI was added.

## Changed files

- `src/progress/healthPresentation.ts`: task wording and observed/predictive
  description policy, separate from the accepted forecast engine.
- `src/components/progress/HealthBadge.tsx`: optional predictive-badge visibility,
  keeping actual status/completion.
- `src/components/forecast/ForecastSummary.tsx`, `src/App.tsx`: consistent task
  labels and chart-selected badge gating; detailed dates remain accessible.
- `src/components/gantt/GanttChart.tsx`: gate row/bar forecast annotations,
  explain disabled controls, preserve independent baseline and critical controls.
- `src/components/gantt/ProgressOverlays.tsx`, `src/timeline/overlays.ts`: FF label
  and date/variance/effort descriptions; coordinate mapping is unchanged.
- `src/styles/global.css`: small disabled-control helper text.
- Pure health/overlay tests, `tests/forecast-visual-clarity.spec.ts`, and existing
  forecast/visualization browser expectations updated for the new toggle contract.
- README, forecast/timeline notes, this handoff and four review screenshots.

No changes to capacity formulas, dependency scheduling, baseline snapshots,
actual-work model, status transitions, versioned saves or the Network calculation.
Project schema remains 5 with all existing legacy support.

## Verification

Baseline: **398 tests / 32 files**, lint, typecheck and production build.
Final: **411 tests / 32 files**, lint, typecheck and build (63 modules);
**120 browser tests**, including 13 new clarity cases and all 107 prior cases.

| Acceptance | Evidence |
| --- | --- |
| A01 OFF | No markers, predictive row/selected badges or chart forecast tooltip comparisons in both modes/all scales; ordinary dependencies stay |
| A02 observed facts | Blocked and actual Late remain, including with invalid forecast drafts; prior historical-completion checks retained |
| A03 ON | Dates/badges return, source JSON, project health, bar coordinates and scroll remain unchanged |
| A04 meanings | Nov 6 versus Nov 2 is Forecast Slip while Dec 18 project remains On Track; earlier project target still yields project At Risk |
| A05 earlier finish | Ahead of Plan and FF left of the entire committed bar in Expanded and Compressed |
| A06 explanation | Keyboard-focusable marker with exact finish dates, earlier/later variance and remaining person-hours |
| A07 units | 12 remaining person-hours, Nov 4 finish versus Nov 2 commitment is 2 calendar days later; no invented 6-hour dashed duration |
| A08 baseline | Independent toggles, original guides/dates and source snapshot preserved |
| A09 disabled | Adjacent explanation, model setting independent, re-enable restores annotations |
| A10 regression | Six mode/scale combinations, 25-task narrow/desktop cases, Network, quick edit, Close, Critical Path, all Save/import/QA01 tests |

Screenshots inspected:
[forecast on](review/wp6-5-1-forecast-on.png),
[forecast off](review/wp6-5-1-forecast-off.png),
[earlier expanded](review/wp6-5-1-earlier-expanded.png),
[earlier compressed](review/wp6-5-1-earlier-compressed.png).

## Owner check (three minutes)

1. Open a plan with enabled forecasting, explicit remaining estimates and a
   baseline. Show Forecast starts off: no purple markers or predictive chart badges.
   Project health and detailed selected-task dates remain available.
2. Turn Show Forecast on. Compare task Forecast Slip against project On Track
   or At Risk. Turn it off again: Blocked/actual Late still appear. Toggle baseline
   and Critical Path independently; scroll/selection remain intact.
3. Reduce remaining effort or increase capacity to bring a finish earlier. Check
   Ahead of Plan and the FF marker to the left; hover/focus it for both dates,
   calendar-day variance and remaining person-hours.
4. Disable Enable effort-based forecasting in Project Settings. The overlay control
   is disabled with help; baseline remains usable. Re-enable and verify recovery.
   Save, reload and export/import retain source settings and the original baseline.

No merge or subsequent package is included; owner acceptance is pending. Main
remains `a6a1c32c22a2bf074b161e52d523443602843dd7`. Protected annotated
`v1.0-pre-progress` remains object `a4157bc84392c770c27111da58d779948b110a56`,
target `abb85011dafc9fb0876953e3132880e025ef65da`.
