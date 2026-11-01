# WP6.5 — Progress visualization

Implemented on `feature/wp6-progress-tracking`, starting from clean commit
`4c246b9` (the Save-dialog QA01 correction). The implementation commit is the one
containing this handoff; its SHA is reported in the delivery message. Ready for
owner review; no merge or subsequent work package is included.

## Delivered presentation

- **Project health** replaces the expanded forecast dashboard. It follows the
  Gantt/Network view and presents outcome, As-of, Complete/Partial/Disabled forecast
  input state, projected date versus target, known remaining/target capacity, and
  currently Blocked/Late counts. The detailed accepted calculations remain under
  **Forecast details and comparisons**. Complete here describes forecast inputs,
  separately from the deliberate Complete work status.
- Project Late means the target has passed with unfinished work. At Risk means
  a valid projection exceeds a target which has not passed. On Track requires
  a complete available projection fitting target. Missing/disabled inputs say
  Forecast Unavailable; blocked restarts/dependent paths say Indeterminate. Partial
  totals carry an explicit qualifier and no definitive delivery verdict.
- Completed projects show recorded latest effective completion and a completion
  outcome compared with the current target, not an active risk label. Historical
  task Completed Late still uses its frozen commitment-at-completion context.
- Independent **Show Baseline** and **Show Forecast** checkboxes are off on new,
  load and import. They survive ordinary tab navigation, selection, Close and Save.
  They are not saved and do not dirty a clean named plan.
- The baseline is a thin grey outline below a matching row's committed bar.
  Forecast is a purple dashed line and diamond **F** above it, representing both
  later and earlier dates. Original solid bars, hatching, critical-path rendering
  and dependency coordinates remain intact. No percentage or progress fill exists.
- Small SVG health symbols beside task IDs use check, triangle, alert or question
  shapes, with accessible labels and titles. Blocked has a separate pause symbol,
  including when schedule health is independently Late. Selected summary,
  comparison and Status & completion use equivalent labels and shared selectors.
- New since baseline tasks get no original guide. Deleted tasks remain in View
  Baseline, without editable rows being resurrected.

## Coordinates and limits

The overlay adapter reuses the existing timeline axis and viewport mapping.
Original guide positions use the baseline's original working-day fractions,
including when current daily hours differ. Forecast positions use WP6.4's existing
exclusive fractional day output; no allocation is repeated in the renderer.
An exact day-end boundary stays on the last occupied date. Date-only recorded
completion evidence is explicitly marked as day-end presentation.

The axis is **not** expanded on toggle. Dates beyond its range or current viewport
receive labelled edge chevrons, so bars and scroll do not jump. In Compressed view
a nonworking forecast date has no width: it gets a distinct crossed boundary
marker and an explicit real-date/omitted-date description. It is never silently
redated to a working day. Hover/focus the marker or task label for comparisons.
Unavailable/indeterminate task forecasts have no endpoint. During task/calendar
previews, forecast help explains that forecasts still use the accepted plan.

## Changed areas

| Area | Files |
| --- | --- |
| Presentation selectors and tests | `src/progress/healthPresentation.ts`, `.test.ts` |
| Health symbols | `src/components/progress/HealthBadge.tsx` |
| Compact overview and selected comparisons | `src/components/forecast/ForecastSummary.tsx` |
| Original and forecast geometry adapter/tests | `src/timeline/overlays.ts`, `.test.ts` |
| Read-only SVG layers and controls | `src/components/gantt/ProgressOverlays.tsx`, `GanttChart.tsx` |
| Shared status display, UI-only toggles, styling | `src/components/progress/TaskStatusPanel.tsx`, `App.tsx`, `styles/global.css` |
| Browser checks | `tests/progress-visualization.spec.ts`; old forecast/Save tests updated for Project health and On Track presentation labels |
| Documentation and review evidence | This handoff, README, timeline/forecast notes, four WP6.5 screenshots |

WP1, the forecast engine/formulas, baseline and progress models, actual-work model,
project schema 5 and versioned persistence implementation are unchanged. The
header Save portal fix remains covered across formats 1–5.

## Validation and owner scenarios

Starting `npm.cmd run check`: 379 tests / 30 files, lint, typecheck and build.
Final checks: **398 tests / 32 files**, lint, typecheck and production build
(63 modules); **107 browser tests** including 14 visualization cases and all
93 prior cases. Two new pure suites cover health precedence/completion/fallbacks
and precise fractional, compressed, clipped and omitted coordinates.

| Owner scenario | Verification |
| --- | --- |
| A01 default | Off controls, no overlays, Gantt before health; expansion keyboard accessible |
| A02 original dates | Changed durations, sort/manual move and permanent-ID guides in all six mode/scale combinations |
| A03 no baseline | Disabled control, useful explanation, no manufactured guide |
| A04 later forecast | Existing endpoint, dashed extension, unchanged solid bar; after-range indication |
| A05 earlier forecast | Quick remaining and capacity edits move only forecast; earlier/omitted points tested |
| A06 combined controls | Both toggle sequences preserve selection, scroll, bar coordinates and state |
| A07 both modes | Hour/Day/Week, original proportions, cross/edge markers and preserved baseline after deletion |
| A08 Blocked | Own/downstream endpoints disappear; Indeterminate and separate Blocked assessment |
| A09 unblock | Existing calculation updates endpoints and health live |
| A10 incomplete | Partial/Uncertain, known-only qualifier, no green verdict |
| A11 dates | At Risk/Late precedence; historical Completed Late and recorded completion outcome |
| A12 dimensions | Explicit work status plus independent health; completed work excluded from active Late counts |
| A13 continuity | Quick entry, Close, selection, sorting/manual move, duplication, critical path and existing drag regressions |
| A14 long plan | 25 long-name tasks, virtual rows, horizontal/vertical scroll, keyboard toggles at 1440px and 600px |
| A15 persistence | Toggle-only clean state, save/load and JSON equality for baseline/tasks/work/forecast settings, reset on import |
| A16 regression | Full existing browser/unit suites, Save migration visibility, lint/typecheck/build |

No acceptance-scenario exceptions are claimed. Human owner acceptance remains
pending. Screenshots were inspected at desktop and narrow widths:

- [Combined expanded](review/wp6-5-combined-expanded.png)
- [Combined compressed](review/wp6-5-combined-compressed.png)
- [25-task desktop](review/wp6-5-long-1440.png)
- [25-task narrow](review/wp6-5-long-600.png)

## Five-minute owner check

1. Open a saved plan. Both overlays start off and the committed chart looks as
   before. Expand Project health details, then collapse them.
2. Enable Show Baseline and Show Forecast. Check grey original guides and dashed
   purple F endpoints; switch Expanded/Compressed and Hour/Day/Week. Hover/focus
   guides for dates and note explicit edge/omitted-date markers.
3. Select a task. Increase then reduce Remaining Effort; change capacity. Forecast
   endpoints and health respond while committed bars stay fixed. Close and reselect.
4. Block a predecessor, observe independent status plus Uncertain/Indeterminate
   projection, then unblock. Clear one estimate to check Partial rather than green.
5. Sort/reorder and duplicate a task. Original guides stay attached to IDs; the
   duplicate has none. Save, reload, and export/import. Source data and baseline
   survive; opening a plan resets overlay toggles.

Main remains `a6a1c32c22a2bf074b161e52d523443602843dd7`. Protected annotated
`v1.0-pre-progress` object remains `a4157bc84392c770c27111da58d779948b110a56`,
target `abb85011dafc9fb0876953e3132880e025ef65da`. Await owner acceptance before
merging or starting another package.
