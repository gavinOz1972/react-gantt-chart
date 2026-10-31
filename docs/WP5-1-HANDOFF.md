# WP5.1 Workspace Usability Corrections

Prepared 31 October 2026 on local branch `wp5-1-workspace-usability`. This is the
owner-designated post-WP5 usability follow-up, distinct from the earlier WP5.1
task-ordering slice. Implementation and automated verification are complete;
owner acceptance remains pending testing of the running application.

## Baseline

Started from clean WP5 commit `c33b502` (Use polling to detect Windows development
source changes), following the SVG icon fix in `8fac659` and WP5 implementation
in `3c60547`. Before modifying source, `npm.cmd run check` passed lint, typecheck,
189 tests across 17 files, and production build. `npm.cmd run test:e2e` passed all
17 Chromium tests in 18.2 seconds. Baseline screenshots show selected details
inside the chart and the full editor above it.

## Delivered behavior

Workspace has this visible hierarchy:

1. Unnumbered compact Project Overview immediately below the top-level tabs.
2. **01 / Timeline**: Gantt or Network / Critical Path, with the existing viewing,
   zoom, navigation, selection and critical-path controls.
3. **02 / Tasks & Schedule**: task list and the Add/full Edit form, including all
   manual order/sort, duplication, inline edit and delete controls.
4. **03 / Task Details**: one shared selected-task inspection panel with source
   duration, calculated/current and latest dates, predecessors, criticality, slack
   and release information. Selection does not scroll the page to this section.

Gantt/network stay mounted across ordinary view/tab changes; their scroll and
view state are retained. Their standalone components retain optional embedded
inspection for reuse, but App displays only the one bottom details panel.

The same staged dependency picker serves the table and full task form. Opening
copies the current predecessor IDs into local selection state. Checkbox changes
do not change the schedule or committed relationships. Done, Enter, disclosure
toggle, outside click or focus exit finishes a valid draft. Escape/Cancel discards
it. An unchanged draft produces no source update. Focus returns to the trigger
without scrolling the selected-task details into view.

The picker is rendered through a portal, positioned against its trigger and
clamped to the viewport. Its choices scroll independently, and Done/Cancel remain
visible. Capture listeners distinguish portal content from outside input. The
outside pointer and its following click are consumed, so closing cannot also
invoke Delete, Duplicate or another action. A later deliberate click works
normally. Keyboard Cancel remains usable even if an earlier disabled outside
control emitted pointerdown without a click.

Self-dependency is disabled. Potential cyclic choices show domain explanations;
they may be staged, but a cyclic commit is rejected with an error and the picker
stays open. The user can uncheck the choice or cancel. Invalid IDs and other
dependency/start effects still pass through the existing WP1 validation boundary.
Removing the final predecessor cannot silently reactivate a forbidden manual
start before project start, including in the full form. Valid saved name/effort
metadata is used for that form's relationship validation so an unrelated unfinished
text or duration field cannot prevent correcting relationships.

No calendar arithmetic, scheduling semantics, critical-path calculations or
persistence format changed. All previous IDs, manual order, sort preference,
copy metadata and source fields retain their existing save/load/JSON behavior.
There is no data migration or dependency/package change in this follow-up.

## Verification

| Check | Final result |
| --- | --- |
| `npm.cmd run lint` | Pass |
| `npm.cmd run typecheck` | Pass |
| `npm.cmd test` | Pass: 203 tests across 19 files |
| `npm.cmd run build` | Pass: 41 modules transformed |
| `npm.cmd run check` | Pass: all four gates above |
| `npm.cmd run test:e2e` | Pass: 23 Chromium workflows, final complete run 17.7 seconds |
| Running owner server | localhost:5173 serves the current workspace and staged picker |

WP5.1 adds 14 component cases and six browser workflows. All 189 existing unit/
component tests and 17 existing browser scenarios remain passing. Existing tests
were adapted where WP5.1 intentionally supersedes immediate checkbox commits,
cycle-option disabling and chart-embedded inspection. They now finish dependency
choices explicitly and inspect the shared bottom details panel. Scheduling,
critical-path, invalid-data, ID, ordering, duplication and persistence assertions
remain. No configured check was skipped.

Browser checks use isolated port 4173 and synthetic plans. They cover real Space/
Enter selection, Escape/Cancel, pointer and assistive clicks, invalid cyclic drafts,
outside-click protection, focus restoration, form submission isolation, selection
continuity, retained editor state, chart modes and responsive portal placement.
Screenshots were inspected at 1440px and 780px widths. The owner's running server
was checked directly for current source, addressing the previously observed stale
server issue without altering the owner's project data.

## Changed files

| Files | Change |
| --- | --- |
| `src/App.tsx` | Reorder editor/inspection, single bottom details panel, form dependency commit boundary |
| `src/components/DependencyPicker.tsx` | Shared staged picker, portal, validation/focus/keyboard and outside-click handling |
| `src/components/TaskEditor.tsx`, `src/components/TaskTable.tsx` | Use staged picker; row selection and form placement support |
| `src/components/gantt/GanttChart.tsx`, `src/components/network/NetworkView.tsx` | Timeline numbering and optional embedded inspection |
| `src/styles/global.css` | Picker portal and compact layout styling |
| `src/components/DependencyPicker.test.tsx`, `src/components/WorkspaceUsability.test.tsx` | New staged-transaction, hierarchy and form validation tests |
| `src/components/ProjectEntry.test.tsx`, `src/components/TaskManagement.test.tsx`, `src/components/persistence/ProjectStorage.test.tsx` | Existing interactions adapted to explicit dependency completion |
| `tests/dependencyHelpers.ts`, `tests/wp5-1.spec.ts` | Shared regression interaction helper and new owner acceptance/browser checks |
| `tests/project-entry.spec.ts`, `tests/gantt.spec.ts`, `tests/wp4.spec.ts`, `tests/wp5.spec.ts` | Existing browser workflows adapted; old WP5 images now stay in test output rather than overwriting historical review files |
| `README.md`, this handoff, seven `docs/review/wp5-1-*.png` files | Usage, acceptance and visual evidence |

## Visual evidence

- [Before: selected details inside chart](review/wp5-1-before-selected.png)
- [Before: full editor above chart](review/wp5-1-before-editor.png)
- [After: chart, task list, then selected details](review/wp5-1-workspace.png)
- [After: full editor inside Tasks & Schedule](review/wp5-1-editor.png)
- [After: staged dependency choices with Done/Cancel](review/wp5-1-dependencies.png)
- [After: 780px picker beyond the table's clipping region](review/wp5-1-narrow-picker.png)
- [After: 780px workspace and bottom details](review/wp5-1-narrow-workspace.png)

## Owner checks A01–A10

Run `npm.cmd run dev` if the development server is not already running, then open
its printed Local URL. The existing localhost:5173 server already serves WP5.1.

| Scenario | What to verify |
| --- | --- |
| A01 first view | Load a saved project: compact Overview and Gantt appear before any task editor or selected details. |
| A02 numbering | Read Overview, 01 / Timeline, 02 / Tasks & Schedule, 03 / Task Details in that order. Switch to Network and check the same order. |
| A03 selection | Select a bar, then a task row/ID. Bottom details update with the correct dates, effort, predecessors, slack and criticality; selection does not force scrolling there. |
| A04 Done | Open predecessors, check/uncheck several choices. Dates/connectors stay unchanged until Done; a valid draft then closes and updates them. |
| A05 keyboard | Focus a checkbox, Space toggles it, Enter commits. Focus returns to the trigger; Enter inside the picker does not submit the full task form. |
| A06 outside | Change a selection and click a harmless outside area. Valid choices commit and the picker closes. |
| A07 Escape | Change choices and press Escape or Cancel. Previous graph/dates and saved/dirty status return unchanged. |
| A08 invalid graph | Stage a cyclic predecessor and press Done. The error stays in the open picker; the valid schedule and graph are preserved. Correct or cancel the draft. |
| A09 other actions | Click an outside Delete/other action while the picker is open. The closing click cannot invoke that action. Use a subsequent deliberate click if you want it. |
| A10 regression | Check manual order/sorts, permanent IDs, copies, inline edits, both Gantt modes, network, Save and JSON round trips. |

Known interaction detail: the first outside click belongs to closing the picker;
it intentionally does not also activate the outside control. In the full form,
Done accepts dependency choices into the form preview, while Save task still
accepts the task as a whole. Local field drafts are not added to the project file.
Owner acceptance must be recorded only after the owner checks this running UI.

## Predecessor scrolling correction

Owner testing exposed a long-list scrolling failure: the native fieldset overflowed
inside the bounded flex popup but its scroll position stayed at zero under wheel
input. The choices now sit in a separate shrinking scroll region around the
fieldset, with a reserved vertical scrollbar and contained scrolling. The heading
and Done/Cancel footer stay outside that region. All checkbox entries remain
reachable with wheel input or keyboard Tab/Space.

`tests/dependency-scroll.spec.ts` reproduces the original failure and verifies the
fix with 40 wrapping task titles at 1440px and 780px widths, including selecting
the last entry, committing, reopening, keyboard navigation and Escape cancellation.
After this correction, lint/typecheck/build and all 203 unit/component tests pass;
the full browser suite passes 25 workflows (21.3 seconds). The existing owner
server on localhost:5173 was checked for the new scroll region and styles.
