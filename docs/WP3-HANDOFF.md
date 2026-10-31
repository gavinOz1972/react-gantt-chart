# WP3 Gantt visualization verification and handoff

Prepared 30 October 2026 on branch wp3-gantt-visualization, based on the completed
WP2 interface and its duration-display follow-ups. Implementation is ready for
owner review. Owner acceptance is pending confirmation in the running application.

## Delivered behavior

Expanded Calendar View is the default. Continuous task spans contain solid
occupied working segments and diagonal-hatched nonworking dates. Compressed
Working-Time View omits nonworking dates and draws each task across exactly its
working-slot count. Both consume the same WP1 result and preserve task inputs,
calculated dates, dependencies and selected task.

Hour, Day and Week scales retain fractional-day/slot precision. Headers show dates,
weekdays and numbered hours at close zoom; coarse scale groups calendar weeks.
The legend and help explain gaps versus effort and the omission of nonworking
dates in Compressed. Horizontal scrolling, sticky task labels/headers, and Go to
start/selected task support navigation. No dragging or rescheduling is provided.

Finish-to-start arrows track each predecessor/successor ID pair. Each connector
has a named hover/focus target, even if parts overlap. Clicking/focusing a bar or
chart label selects the matching WP2 row; clicking its table task name selects the
chart task. Inspection shows its name, total hours, calculated boundaries and
predecessors. Selection survives zoom/mode changes. Deleted tasks clear selection.

WP2 task/date/duration/dependency/calendar edits reproject bars and arrows live.
Invalid WP1 results remove the chart geometry and show a clear unavailable state;
empty projects show a deliberate invitation to add tasks. Source state remains
separate from schedule and geometry. The App memoizes source conversion/result,
so chart-only selection/mode/zoom updates do not rerun scheduling with new inputs.

## Calendar convention

Each selected day is divided into workingHoursPerDay equal visual sectors. The
engine defines ordinal hours, with no wall-clock start time, so the chart does not
invent clock hours or overnight shift boundaries. A task is clipped to its exact
start/finish; unused work slots before/after it are never colored as effort.
Intervening nonworking dates alone are hatched. See the detailed equations and
limits in [timeline projection documentation](../src/timeline/README.md).

## Changed files

- src/timeline/projection.ts: pure axis, viewport, segment, connector and scale mapping.
- src/timeline/projection.test.ts: coordinate, calendar, dependency, precision,
  immutability, long-range and density tests.
- src/timeline/README.md: API, conventions, rendering limits and WP4 boundary.
- src/components/gantt/GanttChart.tsx: windowed SVG chart, controls, navigation,
  sticky rows, connectors, legend and inspection.
- src/components/gantt/TimelineHeader.tsx: visible date/week/hour headers.
- src/components/gantt/GanttChart.test.tsx: mode, selection, updates, empty/invalid,
  and virtualization/component checks.
- src/App.tsx: chart integration, shared selection and memoized source/result.
- src/components/TaskTable.tsx: matching row highlight and task-name selection.
- src/styles/global.css: chart styling and focus/selection states.
- tests/gantt.spec.ts: owner sample screenshots, live editing and long-project
  Chromium checks.
- README.md, this handoff and docs/review/wp3-*.png: usage and review artifacts.

The scheduling engine, shared task schema, package dependencies, lockfile,
existing tests and test-server configuration are unchanged.

## Verification

Node 24.19.0, npm 11.17.0. Commands from react-gantt-chart:

| Command | Result |
| --- | --- |
| npm.cmd run lint | Pass |
| npm.cmd run typecheck | Pass |
| npm.cmd test | Pass: 109 tests across seven files |
| npm.cmd run build | Pass: 29 modules transformed |
| npm.cmd run check | Pass: lint, types, all unit/component tests and build |
| npm.cmd run test:e2e | Pass: seven Chromium browser tests |

All 87 pre-WP3 tests remain green; 22 projection/component tests were added.
Three new browser workflows run with the four prior browser tests. An initial
long-project browser test used an unsuitable exact label locator for the scale
select; correcting it to the semantic combobox locator resolved the timeout.
The final complete browser run passed seven tests in 6.4 seconds.

Browser tests ran outside the sandbox on isolated port 4173. The existing
NO_COLOR/FORCE_COLOR environment warning remains harmless. No checks were skipped.
Screenshots were visually reviewed at 1440px and 900px browser widths. Native
focus, selection/table synchronization, arrow focus inspection, hatching,
partial-day finishes, scrolling, mode changes and week labels were exercised.
The earlier WP2 limitation concerning OS-native date-picker popup appearance is
unchanged; WP3 has no new date picker.

## Acceptance coverage

| Scenario | Evidence |
| --- | --- |
| A01 | Three-hour Monday/Thursday task has connected 3.5-day expanded span with Tuesday/Wednesday hatching, and three adjacent compressed slots |
| A02 | Thursday finish after hour 1 is exactly halfway through its two-hour day; no occupation of hour 2 |
| A03 | Two adjacent two-hour tasks under a four-hour calendar share exact boundary; connector endpoints match |
| A04 | Multiple ID-based connectors, latest-predecessor dates, row reordering and multi-link owner screenshot |
| A05 | Independent tasks retain overlapping x spans in separate rows |
| A06 | Upstream duration changes move dependent bars and paths in both modes |
| A07 | Unchecking one dependency removes that connector immediately while preserving tasks and remaining links |
| A08 | Workday/capacity edits update solid/hatch segments and compressed positions |
| A09 | Repeated toggles preserve selected task, duration, dates and relationships; source/result immutability checks |
| A10 | Viewport/date virtualization; 1000-row and 0001-9999 unit checks, multiweek browser scrolling/zoom at 900px width |
| A11 | Empty and invalid results never show stale bars or paths |
| A12 | High-contrast solid/hatch distinction, legend, dates/hour/week headers, visible focus and named arrow inspection; screenshots reviewed |

## Owner review screenshots

Same fixed sample, Monday/Thursday at two hours per day: T1 Research (3h),
T2 Draft (1h, after T1), T3 Parallel review (3h, independent), and T4 Publish
(1h, after T2 and T3). T1 is selected in both representations.

[Expanded calendar screenshot](review/wp3-expanded.png)

[Compressed working-time screenshot](review/wp3-compressed.png)

[Multiweek Week-scale screenshot](review/wp3-week-scale.png)

In the running app, confirm the expanded hatch reads as elapsed nonworking time,
compressed bars read as effort slots, and all dependency arrows are understandable.
WP3 is not marked owner-accepted until that confirmation is received.

## Rendering strategy and limits

A shared scroll surface aligns 220px sticky labels, 72px headers and 52px task
rows. SVG includes only visible dates and task rows plus two-row overscan; arrows
are culled when wholly outside the viewport. Density sampling bounds hour labels.
The chart's DOM stays below 1500 elements in tested long-project views.

A 4,000,000px horizontal scroll cap maps very long ranges to logical units instead
of creating browser-limit-sized elements. The projection rejects unsafe compressed
slot totals rather than drawing imprecise dates. The existing WP2 task table is
not virtualized. Graph/geometry work remains proportional to tasks/relationships;
these checks are not a general benchmark for arbitrary graph sizes.

No persistence, critical-path/slack, network diagram, resource levelling, third-party
Gantt library, or deployments were added. Data still lives only in the current tab.
Existing development-dependency audit findings from WP0 are unchanged.

## Review commit and next work

Committed locally on wp3-gantt-visualization for review, without pushing or merging.
Use git log -1 on the branch for the review commit. WP4 can consume the same WP1
schedule and projection extension points for its authorized features. Maintain
source/result/geometry separation and the exact exclusive-boundary convention.
