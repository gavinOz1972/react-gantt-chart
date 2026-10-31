# WP5 verification and handoff

Prepared 31 October 2026 on local branch `wp5-task-management-navigation`.
WP5 implementation and automated verification are complete; owner acceptance
requires testing in the running application and has not been recorded.

## Exact baseline

Started from clean WP4 branch `wp4-critical-path-network-persistence`, commit
`7aa77d6` (Implement WP4 critical path, network view and local project persistence).
Before editing, `npm.cmd run check` passed lint, typecheck, 163 tests in 15 files,
and production build (38 modules). `npm.cmd run test:e2e` passed all 11 Chromium
tests in 10.9 seconds. Before screenshots were captured from that unmodified UI.
No scheduling, calendar, critical-path or network domain rules were changed.

## Delivered slices and review

| Slice | Implementation and review evidence |
| --- | --- |
| WP5.1 order/identity | Explicit ordered task IDs, four display projections, drag handles with edge scrolling and keyboard up/down alternatives. Sort ties use manual order. Stable source IDs and the durable allocation counter are separate from rows. Pure tests compare schedules and full CPM results before/after successor-first order; browser tests perform a native T7-to-T2 drag and check Gantt order and network edges. |
| WP5.2 duplication | New permanent ID; unique `(Copy)` / `(Copy 2)` names; copied description, effort, incoming IDs and DEFAULT/MANUAL settings, including inactive retained dates. No outgoing relationships are changed. Each copy is inserted directly after its original in manual order even while sorted. Pure/UI/browser tests cover copies, deleted IDs and persisted provenance. |
| WP5.3 inline edits | Name, multiline notes, whole-hour duration, independent date picker and immediate predecessor checkboxes. Draft strings remain separate until a successful full WP1 validation; failure keeps the valid source, Gantt and CPM. Enter/Tab/blur, Escape and Ctrl+Enter behavior is checked in component and real browser tests. Add Task and the secondary full Edit form remain available. Delete confirmation and downstream protections remain. |
| WP5.4 navigation | Exact Files / Project Settings / Workspace order, keyboard tab navigation, chart-first workspace, compact status and header Save. All panels stay mounted so ordinary navigation preserves drafts, order, selection, chart mode and scale. New project leads to Settings; load/import opens Workspace. Save uses known browser identity; unnamed plans route to the naming step. Save As collisions and destructive replacement/deletion still confirm. |

The slices were reviewed against OR01–OR05, ID01–ID03, DP01–DP05, ED01–ED07 and
NV01–NV07. The owner-facing A01–A17 checklist is in
[WP5-OWNER-GUIDE.md](WP5-OWNER-GUIDE.md). This is implementation review, not an owner
acceptance claim.

## Persistence and migration

Schema version 1 and browser key `react-gantt-chart:projects:v1` remain compatible
with WP4. Optional additive fields are normalized on reading:

- `manualOrder`: exact permutation of surviving task IDs; older files use their
  previous task array order unchanged.
- `sortMode`: `manual`, `start`, `name` or `duration`; older files use `manual`.
- `duplicateOrigins`: map from surviving copy IDs to original IDs; older files
  use an empty map. An original may have been deleted. Numeric origins, like
  surviving numeric IDs, must be below `nextTaskNumber`.

Malformed metadata rejects the whole operation. Dates, graph and input values
continue through WP1 validation. Counter gaps for deleted tasks survive all round
trips; no surviving tasks are renumbered. Copies keep their retained manual dates
and incoming ID relationships. Display sorts never rewrite the source task array
or manual order. Metadata participates in dirty tracking.

Loading legacy data does not write browser storage. Metadata is included only on
an explicit subsequent save/export. Other saved plans are preserved, and a corrupt
library is still reported and kept. See the [file contract](../src/persistence/README.md).

## Final verification

Workstation: Node 24.19.0, npm 11.17.0, TypeScript 6.0.3. No dependency or lockfile
changes. Commands ran from `react-gantt-chart`.

| Command | Result |
| --- | --- |
| `npm.cmd run lint` | Pass |
| `npm.cmd run typecheck` | Pass |
| `npm.cmd test` | Pass: 189 tests across 17 files |
| `npm.cmd run build` | Pass: 40 modules transformed |
| `npm.cmd run check` | Pass: all four gates above |
| `npm.cmd run test:e2e` | Pass: 17 Chromium tests, final complete run 13.0 seconds |

All 163 WP1–WP4 unit/component tests and all 11 existing browser scenarios remain
passing. Existing UI tests now navigate to the appropriate tabs and use the new
Save As label; their scheduling, dependency, highlighting, invalid-preview,
download/import and confirmation assertions remain. WP5 adds 26 pure/component
cases and six browser workflows. No check was skipped. Browser tests use isolated
port 4173; no owner project data is used or overwritten. Harmless color-environment
warnings are unchanged.

## Changed files

| Files | Purpose |
| --- | --- |
| `src/taskManagement.ts` | Pure manual order, stable display sorts and copy construction |
| `src/components/InlineField.tsx` | Separate drafts and keyboard commit/cancel behavior |
| `src/components/TaskTable.tsx` | Drag/up/down, inline inputs, checkboxes, duplication and retained-date reset |
| `src/App.tsx` | Metadata lifecycle, validation/allocator integration, navigation and shared workspace state |
| `src/components/persistence/ProjectStorage.tsx` | Save As and persistent header Save with existing file safeguards |
| `src/persistence/projectFile.ts` | Legacy normalization, metadata validation, canonical fingerprints and round trips |
| `src/styles/global.css` | Compact header/status, three tabs, chart-first layout and task controls |
| `src/taskManagement.test.ts`, `src/components/TaskManagement.test.tsx` | New pure/migration and interaction coverage |
| `src/components/ProjectEntry.test.tsx`, `src/components/gantt/GanttChart.test.tsx`, `src/components/network/NetworkView.test.tsx`, `src/components/persistence/ProjectStorage.test.tsx` | Existing regression adapted to navigation/inline presentation |
| `tests/wp5.spec.ts` | Native drag, sorts/copies, keyboard edits, real persistence round trips, navigation and screenshots |
| `tests/gantt.spec.ts`, `tests/project-entry.spec.ts`, `tests/wp4.spec.ts` | Existing browser workflows adapted to their tabs |
| `README.md`, `src/persistence/README.md`, this handoff and owner guide | Current usage, schema, verification and review instructions |
| Seven `docs/review/wp5-*.png` files | Before/after visual evidence |

## Visual review

Images were visually inspected for navigation order, header Save, calendar fields,
chart labels/hatching/connectors, inline multiline text and horizontal overflow:

- [Before: WP4 full page](review/wp5-before-page.png)
- [Before: chart below the settings and task list](review/wp5-before-chart.png)
- [After: Workspace](review/wp5-workspace.png)
- [After: Files](review/wp5-files.png)
- [After: Project Settings](review/wp5-settings.png)
- [After: inline multiline notes](review/wp5-inline.png)
- [After: 780px workspace with horizontally scrolled table](review/wp5-narrow.png)

Before and after images use synthetic examples; they demonstrate layout changes,
not a comparison of identical schedules. Automated assertions independently verify
unchanged scheduling results under rearrangement.

## Practical limits and delivery status

Native drag is intended for desktop pointers; up/down buttons support keyboard and
touch use. Task rows scroll within the table; the existing Gantt/network viewport
rendering remains. Pending invalid drafts stay in memory and block save/export
until corrected or cancelled. Files persist committed inputs, manual order, sort
and copy origins; selected tab/task and chart zoom/mode are ordinary session state.
Browser copies still belong to the same browser profile and origin/port.

Changes are delivered on the local WP5 branch. No push, merge, deployment or
external publication was performed. Owner testing is the remaining acceptance step.
