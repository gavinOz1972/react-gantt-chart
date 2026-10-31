# WP2 project and task entry handoff

Prepared 30 October 2026 on branch wp2-project-task-entry, based on the completed
WP1 branch and its owner-approved earlier-date rejection defaults.

## Delivered interface

The page now provides project name, start and target date pickers, seven weekday
checkboxes, and daily working hours. Settings preview as typed and commit on field
blur; weekday changes commit immediately when valid. Revert settings restores the
last accepted settings. Defaults are an editable sample semester calendar beginning
2026-11-02, with a target of 2026-12-18, Monday-Friday and four hours/day.

Add/Edit task opens a controlled draft with name, description, whole-hour estimate,
independent date, reset action, and checkbox predecessor dropdown. Calculated dates
preview immediately, including downstream tasks and completion. Save commits a
valid draft; Cancel restores saved source tasks. Project settings are disabled
while a task draft is open, and other task actions wait until Save/Cancel.

Dependent tasks display read-only Calculated Start with no date picker. Their
prior independent MANUAL input remains intact. Removing all predecessors restores
it; Reset to Project Start switches the retained mode to DEFAULT. Each checkbox
updates the draft and schedule preview immediately, without deleting tasks.
Self/cycle options are disabled with explanations; accepted link edits still pass
through WP1. A sequence counter assigns stable T1, T2, ... IDs on successful adds;
deleted saved IDs are never reused and unaffected IDs never change.

Deletion uses a native modal confirmation, initially focused on Keep task, with
Escape cancellation. It names every direct dependent link that will be removed.
The entire proposed deletion/link update is validated before committing. If it
would activate an invalid retained manual date, the deletion is refused, all tasks
remain, and the modal explains what needs correcting.

The summary separates target from calculated completion and shows task count and
On time/Late. A target is the inclusive end of its selected calendar date; comparison
uses WP1's last occupied date. The target never reschedules tasks. Invalid drafts
show field/summary errors and suppress dates/completion/status; saved source data
is recoverable. Valid unsaved previews are labeled explicitly.

## Implementation boundary and changed files

- src/App.tsx: accepted source state, editable drafts, WP1 calculation, preview,
  summary, CRUD orchestration, and focus restoration.
- src/components/ProjectSettingsForm.tsx and TaskEditor.tsx: accessible controlled
  entry fields and predecessor selection.
- src/components/TaskTable.tsx: stable ID list, date/hour boundaries, horizontal
  scrolling at narrower widths, and task actions.
- src/components/EntryErrors.tsx and DeleteTaskDialog.tsx: field/summary feedback
  and modal deletion workflow.
- src/components/projectEntry.ts: the single string-field/type conversion boundary,
  immutable ID replacement/link removal, and WP1-backed dependency validation.
- src/components/projectEntry.test.ts and ProjectEntry.test.tsx: boundary and
  interaction tests.
- src/styles/global.css: responsive layout, visible focus states, form/table styling.
- tests/project-entry.spec.ts: desktop and narrower Chromium workflows.
- playwright.config.ts: isolated test server on port 4173 so a user's normal dev
  server on 5173 does not conflict.
- README.md and this handoff: usage, behavior, verification and limitations.

No WP1 engine, shared scheduling contracts, existing tests, dependencies, lockfile,
or scheduling algorithm changed. React calls calculateSchedule and consumes its
result. All date inputs/output remain date-only strings. There is no Date parsing,
calendar arithmetic, or topological ordering in the UI.

## Verification

Node 24.19.0, npm 11.17.0. Commands run from react-gantt-chart:

| Command | Result |
| --- | --- |
| npm.cmd run lint | Pass |
| npm.cmd run typecheck | Pass |
| npm.cmd test | Pass: 83 tests in five files |
| npm.cmd run build | Pass: 26 modules transformed |
| npm.cmd run check | Pass; executes lint, typecheck, tests, and build |
| npm.cmd run test:e2e | Pass: three Chromium tests, including original home-page smoke test |

All original 66 tests are retained and pass. Seventeen new tests cover the UI
boundary and entry workflows. Browser tests ran outside the sandbox, consistent
with WP0/WP1. The existing NO_COLOR/FORCE_COLOR warning is harmless.

Chromium was exercised at 1440x1100 and 780x1000. Automated interactions verified
native date input values, Tab navigation, edit/save focus, Escape modal cancellation,
field errors, checkbox add/remove, cycle disabling, live downstream dates, target
status, and deletion. Desktop and narrow screenshots were visually inspected;
forms, summary and errors wrap cleanly and the table scrolls without page overflow.
This was automated browser exercise plus visual review, rather than a human manual
session. Native calendar popup appearance/OS-specific selection remains an owner
spot-check; date entry and retention are covered in Chromium.

## Acceptance coverage

| Scenario | Verified behavior |
| --- | --- |
| A01 | Monday/Thursday and two-hour calendar accepted; seven visible weekday controls |
| A02 | T1 three-hour task starts Monday and finishes after Thursday hour 1 |
| A03 | DEFAULT task follows changed project start |
| A04 | MANUAL date retained; reset restores following; earlier-date project edit rejected recoverably |
| A05 | Checked predecessor gives read-only Calculated Start at next slot |
| A06 | Unchecking immediately restores independent input; predecessor remains |
| A07 | Multiple predecessors and extended duration update downstream preview |
| A08 | Self/cycle choices disabled with actionable explanations; boundary verifies WP1 rejection |
| A09 | Zero, negative and fractional hours show errors, block Save and hide stale dates |
| A10 | Modal identifies links; cancellation and confirmation keep dependent tasks; rejected deletion stays atomic |
| A11 | Target changes feasibility without changing task dates; earlier target rejected |
| A12 | Repeated edits retain focus, descriptions, stable IDs and checkbox state; deleted IDs not reused |

## Known limits and WP3 integration

Data stays in memory and is cleared by a reload/closed tab; the page discloses this.
No backend, authentication, persistence, Gantt bars, connectors, or critical-path
view is included. New/edited task previews require Save; Cancel discards them.
Existing dependency-audit findings from WP0 are unchanged; no packages were added.

WP3 can use App's accepted source project/tasks and WP1 result to render the Gantt
view. Preserve the explicit preview/error state, slot/finish boundary semantics,
stable IDs, and DEFAULT/MANUAL retention. Do not derive scheduling dates in the view.

The work is committed locally for review on wp2-project-task-entry. It is not
merged into main or pushed. Use git log -1 on that branch for the review commit.
