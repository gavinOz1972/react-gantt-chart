# WP5.2 Visualization Refinements

Prepared 31 October 2026 on local branch `wp5-2-visualization-refinements`.
Implementation and verification are complete; owner acceptance remains pending
validation of the running application.

## Baseline and scope

Started from clean WP5.1 commit `fe34310` (Fix scrolling through long predecessor
lists), following workspace/picker implementation `da9f6b6`. Before source changes,
`npm.cmd run check` passed lint, typecheck, 203 tests in 19 files, and build;
`npm.cmd run test:e2e` passed 25 Chromium workflows in 19.3 seconds.

The work is limited to header presentation and the network viewport. Calendar,
scheduling, critical-path analysis, DAG layout, task inputs/IDs, dependencies,
manual order/sorts, duplication and persistence schemas are unchanged. Accepted
Workspace order and the staged, scrollable predecessor picker remain intact.
No progress fields or forecasting/baseline semantics were added.

## UI-01: weekly headers

The overlap was reproduced at 1440px and 780px using a project starting midweek
with more than eight weeks of tasks and three working days per week. The original
unclipped `Week of YYYY-MM-DD` text measured wider than its compressed columns.
Before screenshots record that defect.

Week groups now own their exact axis-projected start/end, including partial first/
last weeks. Every label is clipped to its own span and the visible fragment at
the viewport edges. SVG getComputedTextLength measures text in the actual chart
font. Compressed labels prefer `Week of Nov 2, 2026`, then `Nov 2`, then `11/2`,
then no painted text when even the numeric label cannot fit. The full ISO week
start is retained on a focusable accessible label and hover title.

Expanded Week retains its full ISO text where it fits. All labels use the same
existing working-slot projection; no bar, grid, weekend, connector or scroll
dimension was resized. Compressed weeks without columns are not invented.

This slice passed four focused unit tests and the initial four browser cases
before network implementation. Final weekly browser coverage includes six cases:
1440px/780px, one/three/five working days, partial weeks, horizontal scroll at
start/middle/end, resize round trips, measured paint bounds, full labels at ample
width, all scales/modes and unchanged working coordinates/selection.

## UI-02: network viewport

Visible Zoom In (+), Zoom Out (-) and Fit to View accompany the existing zoom
selector, Reset network position and Go to selected node. Buttons have tooltips,
keyboard activation and disabled states. Manual zoom is 5%-300%; Fit may choose
a smaller overview scale for a very large graph and caps small graphs at 100%.

One translate/scale group uniformly transforms nodes, text, connectors, marker
arrowheads and critical strokes. Pure viewport helpers provide fit, anchored zoom,
pan, centring, inverse hit testing and visible-world bounds. The old native-scroll
SVG extent is replaced by a fixed viewport, so giant graphs do not create giant
browser elements. DAG node/edge geometry itself is unchanged.

Fit centres full layout bounds, labels and padding with another 24 screen pixels
of margin. The first opening fits to the actual visible size. Fit mode responds
to resize and graph-size edits. A deliberate zoom/pan is preserved across Gantt/
Network switches, top-level tab changes and unrelated interactions. An explicit
project load/new action gives the replacement project a fresh fit. Display state
never enters Save or JSON.

Dragging blank background uses pointer capture. Node/edge activation does not
start a pan, and the click following a pan cannot select a stray node. Arrow keys
pan a focused canvas; Home fits it. Normal mouse-wheel/page scrolling and browser
zoom are not intercepted; the optional Ctrl+wheel gesture was not added.

Viewport culling remains. When more than 100 nodes are visible, compact batched
outlines represent the fitted overview rather than mounting thousands of labels.
Dense overview edges are batched by criticality; source paths/ports remain the
same. Selection and Go to selected node restore readable detail at at least 75%.
The 1000-root component/browser checks keep network DOM below 300 elements and
reach a selected node. Task table rendering remains as before.

## Final verification

| Check | Result |
| --- | --- |
| `npm.cmd run lint` | Pass |
| `npm.cmd run typecheck` | Pass |
| `npm.cmd test` | Pass: 213 tests across 21 files |
| `npm.cmd run build` | Pass: 43 modules transformed |
| `npm.cmd run check` | Pass: all four gates above |
| `npm.cmd run test:e2e` | Pass: 40 Chromium workflows, final complete run 21.4 seconds |

WP5.2 adds 10 pure unit cases and 15 browser cases. All 203 previous unit/component
tests and 25 previous browser scenarios remain passing without weakening their
assertions. No configured check was skipped. Dependencies and lockfile are
unchanged. Browser tests use synthetic projects and isolated port 4173.

Network browser coverage checks first-open fit and node bounds, keyboard button
activation, both zoom limits, normal wheel scrolling, real background dragging,
selection-safe node gestures, transformed connector endpoints, critical styling,
viewport persistence, saved/dirty state and unchanged Gantt dates. Empty, one-node,
disconnected, deep and 1000-root graphs are covered. Screenshots were reviewed at
desktop and narrow widths.
The existing localhost:5173 server was also checked directly and serves the
measured/clipped headers and new fit/pan/zoom controls.

## Changed files

| Files | Purpose |
| --- | --- |
| `src/timeline/headers.ts`, `headers.test.ts` | Week ownership, adaptive candidates and measured-fit selection; focused tests |
| `src/components/gantt/TimelineHeader.tsx` | Per-week clip paths, font measurement, full date hover/focus |
| `src/network/viewport.ts`, `viewport.test.ts` | Pure transform, fit, zoom, pan, culling and hit-test helpers/tests |
| `src/components/network/NetworkView.tsx` | Visible controls, fit/pan/zoom lifecycle, pointer safety, fixed canvas and large overview |
| `src/App.tsx` | Active network measurement and viewport reset on explicit project replacement |
| `src/styles/global.css` | Network canvas height, cursor and toolbar spacing |
| `tests/wp5-2-fixtures.ts`, `week-header.spec.ts`, `network-viewport.spec.ts` | Long-calendar and graph fixtures; 15 acceptance/browser cases |
| `README.md`, `src/timeline/README.md`, `src/network/README.md`, this handoff | Updated controls, algorithms, limits and owner guide |
| Eight `docs/review/wp5-2-*.png` files | Before/after weekly and network screenshots |

## Visual review

- [Before: overlapping compressed Week, desktop](review/wp5-2-before-week-1440.png)
- [Before: overlapping compressed Week, narrow](review/wp5-2-before-week-780.png)
- [Before: network controls](review/wp5-2-before-network.png)
- [After: measured Week labels, desktop](review/wp5-2-week-1440.png)
- [After: measured Week labels, narrow](review/wp5-2-week-780.png)
- [After: fitted network](review/wp5-2-network-fit.png)
- [After: zoomed selected node](review/wp5-2-network-zoomed.png)
- [After: fitted network at narrow width](review/wp5-2-network-narrow-fit.png)

The synthetic before/after network examples differ in graph contents; the images
demonstrate controls/layout. Automated geometry and unchanged-source assertions
independently verify presentation-only behavior.

## Owner test guide A01-A10

Use the existing localhost:5173 page, or start `npm.cmd run dev` and open its printed
Local URL. Save unfinished work before refreshing. No file migration is required.

| Scenario | Check in the running application |
| --- | --- |
| A01 weekly labels | Open an eight-week-plus project. Select Compressed / Week; neighbouring week labels stay separate. |
| A02 narrow window | Resize narrower and back, then scroll horizontally. Labels shorten or use hover/focus while the task columns stay aligned. |
| A03 modes/scales | Switch Expanded/Compressed and Hour/Day/Week. Work hours, hatching, dates, connectors and selection remain correct. |
| A04 network controls | Open Network. Use Zoom In/Out by mouse and keyboard; check limits and the zoom selector. |
| A05 fit | Use Fit to View and resize. All nodes fit with margin; use zoom/Go to selected node to read dense graphs. |
| A06 pan/select | Drag blank canvas, then click or keyboard-select a node. The graph pans only for a background drag and details show the selected task. |
| A07 connectors | Zoom and pan repeatedly. Lines and arrowheads remain attached to the same node ports; critical styling stays consistent. |
| A08 view switching | Leave Network zoomed/panned, switch to Gantt/another tab, then return. The same viewport is retained. Load another project and check a fresh fit. |
| A09 edge projects | Try empty, single-task, disconnected and deep/large plans. Empty controls are disabled; Fit and selected-node navigation remain usable. |
| A10 regression | Check task order/sorts, copies, staged predecessor choices/scrolling, inline edits, Save, load and JSON round trips. |

Practical limits: a very large fitted graph cannot have every label readable at
once; use the overview to locate it and zoom or Go to selected node for detail.
The network table still renders all task rows. No general unlimited-size or
cross-browser performance guarantee is claimed. WP5.2 is ready for owner testing,
and is not marked owner-accepted.
