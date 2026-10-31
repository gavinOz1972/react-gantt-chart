# React Gantt Chart

WP0 provides a tested React and TypeScript development environment. WP1 adds a
pure scheduling engine. WP2 adds project calendar settings, task entry, predecessor
selection, and live schedule dates. WP3 adds expanded-calendar and compressed
working-time Gantt views with dependency connectors. WP4 adds working-hour slack,
critical-path highlighting, a dependency network, named browser saves, and JSON
export/import. WP5 adds persistent manual order, temporary sorts, duplication,
inline editing and Files / Project Settings / Workspace navigation. The WP5.1
owner follow-up refines workspace hierarchy and stages dependency selections.
WP5.2 adapts weekly header labels and adds network zoom, pan and Fit to View.
Resource levelling, costs, progress and probabilistic PERT are outside
this release.

## Prerequisites and setup

Use Node.js 24 LTS and npm 11 or 12, Git, and optionally VS Code. The verified
workstation uses Node 24.19.0 and npm 11.17.0; `.nvmrc` records the Node version.
Use a current patched Node 24 release for ongoing development.

```sh
git clone https://github.com/gavinOz1972/react-gantt-chart.git
cd react-gantt-chart
npm ci
npm run dev
```

Open the printed localhost URL. In Windows PowerShell, use `npm.cmd` instead of
`npm` if the local execution policy blocks npm.ps1. No policy change is needed.
Open this folder in VS Code with `code .` or File > Open Folder.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | TypeScript check and production build in dist |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint including the domain import boundary |
| `npm run typecheck` | TypeScript project checks |
| `npm test` | Scheduling/critical analysis, projection, storage, and UI interaction tests |
| `npm run test:watch` | Watch unit/component tests |
| `npm run check` | Lint, types, unit tests, and build |
| `npx playwright install chromium` | Install the browser for the smoke test |
| `npm run test:e2e` | Chromium entry/chart/network and save/import workflows; starts its own dev server |

Browser tests reserve 127.0.0.1:4173, separate from the normal development server
on port 5173. Stop other servers on the test port first.

## Using the entry interface

Run `npm.cmd run dev` in PowerShell and open the Local URL it prints. If a dev
server is already running, the page should update automatically; otherwise refresh.
On Windows, the development server polls source files every 300 ms so edits from
other processes are detected reliably. If an older server is still running after
this configuration change, save/export your plan and restart that server once.

1. Start in Files: create a new project or load/import an existing one. New project
   takes you to Project Settings; loading/importing opens Workspace.
2. In Project Settings, enter the project name, start, target, weekdays, and daily working hours.
   Text/date/number settings apply when you leave the field; weekdays apply
   immediately. Invalid drafts stay editable. Revert settings restores the last
   accepted project settings.
3. In Workspace, choose Add task. Enter a name, description, whole-hour estimate and independent
   start date, or select predecessors from the checkbox dropdown.
4. Inspect the live schedule preview, then Save task or Cancel. A dependent start
   is read-only. Removing all predecessors restores its retained independent date.
   Reset to Project Start restores automatic following.
5. Select an existing task's name, description, duration or independent date to edit
   inline. Enter, Tab or blur commits; Escape cancels. Descriptions use Enter for a
   newline and Ctrl+Enter to commit. Invalid inline drafts keep the committed
   schedule intact. Dependency checkboxes stage a separate selection: Done, Enter
   or a click outside commits valid choices; Escape or Cancel discards them.
   The outside click closes the picker without activating another task action.
   Edit form remains available for the full preview form.
6. Drag a task handle onto another row to place it above that row, or use the up/down
   buttons in Manual Order. Start Date, Task Name and Duration are display sorts;
   returning to Manual Order restores your arrangement. Gantt follows the same order.
   Duplicate copies incoming dependencies/settings with a new ID, immediately after
   its original in Manual Order, while keeping the current sort. Outgoing links stay
   attached to their original task.
7. Delete requests confirmation and discloses affected
   predecessor links; other tasks are kept. IDs are never renumbered or reused
   after a saved task is deleted.

Target status compares the last occupied working date to the inclusive target
end date. It never changes the schedule. Starts show the first occupied hour;
finishes show the exclusive boundary after the final occupied hour. Hour numbers
restart on each working day; Total hours is the full estimate across all days.

The Add/full form labels unsaved previews and suppresses dates for invalid preview
input. Inline edits instead preserve the valid committed schedule until successful
commit. Cancel/Escape or Revert settings recovers accepted inputs. Project settings
are disabled while a task draft is open. Tab switching preserves task drafts, sort,
selection and chart controls. Unsaved edits live in this browser tab; use Save or
Export JSON before leaving.

## Save, reopen and move a plan

Files contains the Save & reopen controls. Enter a Saved plan name and choose
Save As. Multiple named plans can coexist; Save As over an existing name requires
confirmation. The compact upper-right Save button and dirty/saved indicator are
visible from every tab. Save updates the known browser copy directly; an unnamed
project opens Files and focuses the name step. Save task only accepts that task's
draft; Save/Save As writes the whole plan to this browser's local storage.

After a reload, choose a plan in Saved plans and click Load project. There is no
automatic save or automatic project reopening. Storage belongs to this browser
profile and this site's origin, including the server port. Use the same local URL
when returning. Browser cleanup/private browsing can remove local copies.

Export JSON downloads a self-contained, versioned file. New project starts a fresh
plan while keeping named saves. Import JSON validates a selected file before
opening it; invalid files leave the open plan unchanged. Loading/importing/new
over unsaved project or unfinished task/settings edits raises a cancellable warning.
Deleting a named save requires confirmation and leaves the open plan intact.

Finish or cancel task drafts before saving/exporting. Imported plans are not
automatically saved locally: choose Save As to create a browser copy. Export
does not update a named browser save or clear the local unsaved-changes indicator.
Files contain source fields, the next stable task-ID counter, manual order, sort
preference and copy origins, not trusted derived
dates or critical-path results; all calculations are rebuilt on load. See the
[version 1 file format and storage contract](src/persistence/README.md).

## Using the Gantt chart

The Gantt chart leads Workspace, above the task table, and follows the same live schedule and unsaved
previews. Expanded is the default: every calendar date stays on the axis, solid
segments show occupied working slots, and diagonal hatching shows elapsed
nonworking dates within a task's continuous span. Compressed omits nonworking
dates; the same task is a solid bar whose length is its working-slot duration.

Each selected day is divided into equal numbered slots using workingHoursPerDay.
These are ordinal work hours, not wall-clock times; the app has no workday start
time or overnight-hour model. Only the exact start-to-finish interval is drawn.
For Monday/Thursday at two hours/day, a three-hour bar contains a full Monday,
hatched Tuesday/Wednesday, and half of Thursday. The remaining Thursday hour is
not part of that task. In Compressed, the bar covers three adjacent slots.

Use Hour, Day or Week scale and the timeline's horizontal scrollbar. Labels stay
fixed at the left and headers at the top. Click or focus a bar, its task label,
or its ID in the task table to select the same stable task. Its source duration,
calculated boundaries, predecessors, criticality and slack appear in the final
03 / Task Details section, after 02 / Tasks & Schedule. The chart/network area is
01 / Timeline. Add/full task forms stay inside the task section. Selection updates
details without automatically scrolling to them. Dependency lines
have arrowheads and can be inspected by hover or keyboard focus. Go to selected
task brings an offscreen selection into view. Bars are not draggable.

Changing modes or zoom changes display only. Invalid input removes bars and
connectors until corrected. See [timeline projection conventions](src/timeline/README.md)
for the coordinate model and rendering limits.

## Critical path and dependency network

Check Highlight Critical Path in the Gantt toolbar. Zero-slack tasks and controlling
relationships gain bold emphasis and explicit Critical labels in both timeline
modes; expanded nonworking hatching stays visible. Inspection also shows total
slack, latest allowable start/finish and independent release constraints.

Slack is measured in working-hour slots against the present calculated completion,
not the target. A manual independent date is a not-before release: waiting for it
is not task effort. Equal controlling branches can both be critical. Changing a
valid target changes feasibility without changing criticality.

Select Network / Critical Path to see a read-only directed graph of the same tasks.
Node positions represent dependency levels, not dates. Bold solid critical edges,
dashed other edges, zero-slack labels and shared task inspection explain the graph.
Use zoom, background panning and Go to selected node as needed. Gantt/network switching
preserves selection and the existing Gantt mode. This is a deterministic network
view using single duration estimates, not three-point probabilistic PERT.

Network opens fitted to the visible canvas. Zoom In/Out and the Network zoom
selector scale nodes, text and connectors together. Drag blank background to pan;
node clicks still select tasks. Fit to View centres the complete graph, and Go to
selected node brings a chosen task to a readable scale. Focus the canvas for arrow
key panning or Home to fit. Normal mouse-wheel/browser scrolling is unchanged.
The network viewport survives Gantt/Network and top-level tab changes. Loading a
project starts a fresh fitted viewport; zoom/pan is session display state and is
not saved in project JSON. Very large fitted networks use compact outlines until
zoomed in; individual details remain available through task selection.

Week-scale headers stay inside their own projected columns. Compressed labels use
measured space to choose a full date, short month/day, numeric date or tooltip-only
label. Hover or keyboard-focus a week header for its full week-start date. Label
changes do not resize working-hour columns or alter bars and connectors.

## ENGINE and VIEW separation

- `src/domain/`: ENGINE pure TypeScript calculations, explicit inputs/outputs,
  no React, DOM, view imports, or hidden browser state.
- `src/domain/__tests__/`: calendar, validation, and scheduling unit tests.
- `src/types/`: shared scheduling data contracts.
- `src/components/` and `src/App.tsx`: VIEW React presentation and interaction.
- `src/styles/`: simple CSS; `src/test/`: component test setup.
- `src/components/projectEntry.ts`: conversion boundary for editable strings and
  typed WP1 inputs; no scheduling arithmetic.
- `src/taskManagement.ts`: pure display order/sort projection and independent copy
  construction; never schedules tasks or changes dependencies on other records.
- `src/timeline/`: pure coordinate projection from the WP1 schedule, without React.
- `src/components/gantt/`: windowed SVG chart, headers, legend and inspection.
- `src/domain/criticalPath.ts` and `workingTime.ts`: pure backward-pass analysis
  and exact working-slot indices; see [critical-path semantics](src/domain/CRITICAL_PATH.md).
- `src/network/`: pure DAG layout; `src/components/network/`: read-only SVG view.
- `src/persistence/`: versioned JSON validation and injected local-storage operations.
- `src/components/persistence/`: explicit save/load/import/export and confirmations.
- `tests/`: browser smoke, entry, Gantt, network and persistence workflows.

The VIEW consumes ENGINE results. Keep scheduling rules in the ENGINE.
The [engine API documentation](src/domain/README.md) describes WP1 contracts,
slot boundaries, errors, and owner policies. ESLint blocks
React and common view imports from domain files; code review must also preserve
purity and avoid browser APIs or indirect view dependencies.

## Known issues and handoff

The latest Vite scaffold selected TypeScript 7 and Oxlint. WP0 uses TypeScript 6
because typescript-eslint currently supports versions below 6.1, and uses ESLint
to match the work package. The lockfile fixes the verified dependency graph.

No deployment, paid service, database, authentication, or Gantt library is included.
The referenced Application Requirements v1.0 was not supplied. WP1 follows the
explicit rules in its work package. Owner-approved defaults reject manual task
starts and target end dates before project start, with explicit field errors.

See [WP0 verification and WP1 handoff](docs/WP0-HANDOFF.md) for workstation findings,
verification results, and publication status.

The latest clean-install audit reports 12 moderate development-tool findings
stemming from minimatch (GHSA-g3hv-75wg-m249), with no high or critical findings.
Review upstream ESLint dependency fixes before processing untrusted lint patterns.
See the handoff for the full context; no forced dependency downgrade was applied.

See [WP1 verification and handoff](docs/WP1-HANDOFF.md) for the scheduling engine
acceptance matrix and deferred work.

See [WP2 verification and handoff](docs/WP2-HANDOFF.md) for interface behavior,
acceptance coverage, browser verification, and WP3 integration points.

See [WP3 verification and handoff](docs/WP3-HANDOFF.md) for chart acceptance coverage,
performance evidence and the expanded/compressed owner-review screenshots.

See [WP4 verification and handoff](docs/WP4-HANDOFF.md) and the
[owner test guide](docs/WP4-OWNER-GUIDE.md) for the first-release features and review
artifacts.

See [WP5 verification and handoff](docs/WP5-HANDOFF.md) and the
[WP5 owner test guide](docs/WP5-OWNER-GUIDE.md) for task management, the three-tab
workspace, migration details and before/after screenshots.

The [WP5.1 follow-up handoff](docs/WP5-1-HANDOFF.md) records the chart-first
hierarchy, bottom Task Details section, staged dependency picker and owner checks.
This follow-up is distinct from WP5's earlier task-ordering slice. It is ready for
owner testing and has not been marked owner-accepted.

See the [WP5.2 visualization handoff](docs/WP5-2-HANDOFF.md) for weekly-label and
network-navigation verification, before/after screenshots, and the owner checklist.
