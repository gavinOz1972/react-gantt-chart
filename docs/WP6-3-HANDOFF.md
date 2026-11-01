# WP6.3 — Task status and completion criteria

Implemented 1 November 2026 on `feature/wp6-progress-tracking`, following the owner's
explicit approval of WP6.2 and WP6.2.1. Ready for owner testing; formal acceptance
is pending before WP6.4.

## Starting state and protection

| Item | Verified value |
| --- | --- |
| Accepted starting commit | `2cb7823425c0e9ddf9c9c9fee4c947319e396e14` |
| Feature branch | `feature/wp6-progress-tracking` |
| main, unchanged | `a6a1c32c22a2bf074b161e52d523443602843dd7` |
| Protected annotated tag | `v1.0-pre-progress` |
| Tag object | `a4157bc84392c770c27111da58d779948b110a56` |
| Tag target, unchanged | `abb85011dafc9fb0876953e3132880e025ef65da` |
| Implementation commit | Commit containing this handoff; exact SHA reported in the completion message and available with `git rev-parse feature/wp6-progress-tracking` |

The worktree was clean before implementation. Local/remote feature commit, main
and tag were checked. Starting regression passed 303 tests, lint, typecheck and
build. No main merge or tag movement is part of this work package.

## Delivered behavior

- Exactly four statuses: **Not Started**, **In Progress**, **Blocked**, **Complete**.
  The task-table Status select and selected Task Details select share one state
  and transition path. A small badge is shown in the existing Gantt selection
  summary; chart geometry and colors are unchanged.
- Ordinary status changes are deliberate and recorded. Blocked prompts for a
  3–500 character reason; Cancel preserves the old status. Leaving Blocked clears
  the active reason while keeping its earlier event intact.
- Selected Task Details provides criterion add/edit/delete and manual check/uncheck.
  Text is trimmed and limited to 3–500 characters. Completed checklists require
  reopening before revision; past completion snapshots remain read-only.
- **Mark Complete** and dropdown Complete use the same confirmation. It requires
  an editable effective-date picker, every criterion checked and explicit
  acknowledgement. No-criteria completion requires an additional visible warning
  and acknowledgement. Checks made inside the prompt remain drafts until valid
  confirmation; Cancel changes nothing. Future completion dates warn, not coerce.
- Completion can include a brief plain-text note/evidence reference (up to 1,000
  characters). The event retains the criterion IDs/text/checks and project guidance
  exactly as attested, independent of later checklist or project-definition edits.
- Reopening to In Progress, Blocked or Not Started requires confirmation and a
  reason. Prior completion events remain, and a later completion has a new event
  ID. The checklist is retained on reopening and can then be revised.
- Task Details shows status, active blocking reason, current/latest completion
  date and expandable read-only transition history. Effective dates and UTC
  recording metadata are distinct. No authenticated identity/audit claim is made.
- Project Settings contains optional **Definition of Done** guidance (up to 2,000
  characters). It appears in completion confirmation and is snapshotted there;
  it does not create criteria or change the frozen baseline.
- Task duplication copies only current criterion text to fresh IDs, unchecked.
  The new task starts Not Started, with no blocked reason, decisions or work data.
- Unfinished criteria/definition/transition drafts join existing save/replace
  safeguards. Criterion drafts survive task/tab changes and can be resumed.
- Task deletion follows the existing explicit current-task removal workflow. Its
  confirmation additionally discloses associated criteria and status/completion
  history loss and advises export first. Cancel preserves them; confirmed removal
  leaves no orphan references and keeps the baseline and other task records.

Logging work, reaching estimated hours, setting remaining to zero, changing planned
dates and checking criteria never infer a status transition. Completion/reopening
do not reset work logs or remaining estimates. All new data is separate from WP1
inputs and the immutable approved baseline. There is no Ready for Review state,
editable percentage, implicit finish-date forecast or progress visualization.

## Schema and compatibility

New normal saves/exports use **project format 4**, adding optional `taskProgress`
schemaVersion 1 with `definitionOfDone`, a task-ID keyed current record map and
ordered transition events. Work tracking stays version 1 and baseline stays
version 1; their contracts and existing project/task inputs are unchanged.

Formats 1 (WP5), 2 (WP6.1) and 3 (WP6.2/6.2.1) remain readable. Missing progress
means Not Started, no criteria/history and blank project guidance. No events are
fabricated from work entries or estimates. Opening does not rewrite saved copies.
Files offers the matching WP5/WP6.1/WP6.2 original-format backup, including while
current drafts are unfinished. Overwriting an older named save, including header
Save, requires migration confirmation. Save As to a new name preserves the old
record. Earlier releases must use their compatible backups to avoid losing new
status/history data. The browser library key/envelope remain v1.

The parser validates enums, current/task/criterion/event references, unique IDs,
reason/text limits and dates. It replays each task's history from Not Started,
checks current status/reason agreement and verifies completed checklists against
their attestation. Snapshots require boolean checked states and acknowledgements;
reopening reasons must survive import. Malformed/duplicate/orphaned payloads fail
before replacing the open plan or overwriting a saved copy. Known data is deeply
copied and frozen; event IDs, snapshots and dates round-trip independently of
display order. See [the progress contract](../src/progress/README.md).

## Verification

| Check | Final result |
| --- | --- |
| `npm.cmd run check` | Passed: lint, typecheck, 341 tests across 28 files, build |
| New pure tests | 38 passed: 27 transition/model tests + 11 persistence tests |
| Full browser command | `npm.cmd run test:e2e -- --workers=8` |
| Browser result | 77 passed in 43.2 seconds |
| Prior coverage | All 303 tests and 65 browser workflows retained |
| New browser coverage | 12 workflows, including A01–A15, drafts, cleanup and 1440px/600px layouts |
| Production build | Passed, 55 modules |
| Schedule/visual regression | Gantt surface hash unchanged by status changes; previous Gantt, CPM, Network and quick-entry checks pass |
| Baseline/effort separation | Original baseline, source dates, work records and remaining estimates unchanged by status decisions |
| Live owner server | localhost:5173 serves the status controls, confirmation flow and history UI |

Existing export/migration assertions now expect format 4; legacy input fixtures
and behavioral safeguards remain. No tests were removed or timeout thresholds
increased. Eight workers were used for the final browser run to limit workstation
contention. During focused verification, sibling React keys and prefilled textarea
accessible names were corrected. Final runs have no unresolved exceptions or React
key errors. Existing harmless runner color-environment warnings remain.

Historical review images regenerated by the suite were restored. Only the new
WP6.3 screenshots are delivered; these were visually reviewed. Tests use port 4173
and do not alter the owner's localhost:5173 saved browser data.

## Changed files

| Files | Purpose |
| --- | --- |
| `src/progress/taskProgress.ts`, `src/progress/taskProgress.test.ts` | Typed model, replay validation, explicit transitions, snapshots, copy/cleanup and pure tests |
| `src/progress/README.md` | Status/history contract, limits and boundaries |
| `src/components/progress/TaskStatusControl.tsx` | Shared compact four-state select |
| `src/components/progress/StatusTransitionDialog.tsx`, `localDate.ts` | Block/reopen prompts, completion criteria/date/acknowledgement and local calendar date helper |
| `src/components/progress/TaskStatusPanel.tsx` | Selected status, blocked reason, checklist editing/checks, latest completion and read-only history |
| `src/components/progress/DefinitionOfDone.tsx` | Optional project guidance form and draft guards |
| `src/App.tsx` | Current tracking lifecycle, transition wiring, copy/delete integration, status badge and unsaved safeguards |
| `src/components/TaskTable.tsx`, `src/styles/global.css` | Readable status column, responsive checklist/dialog/history styling |
| `src/components/ConfirmDialog.tsx` | Optional disabled confirmation gate |
| `src/components/DeleteTaskDialog.tsx` | Explicit criteria/history deletion disclosure |
| `src/persistence/projectFile.ts`, `src/components/persistence/ProjectStorage.tsx` | Format 4 and validated progress, canonical dirty tracking, version-aware backups/migration |
| `src/persistence/progressPersistence.test.ts` | New/legacy round trips, bad data and storage safety |
| Existing `baselinePersistence`, `workPersistence`, `RemainingEffortField` tests and `tests/baseline`, `work-tracking`, `remaining-quick-entry`, `wp4` | Current-format expectation updates only |
| `tests/task-status.spec.ts` | Twelve real-browser workflows and captures |
| `README.md`, persistence/baseline/work tracking READMEs, this handoff | Usage, compatibility and owner testing |
| Five `docs/review/wp6-3-*.png` files | Completion prompt, desktop/narrow table and inspection evidence |

WP1 calendar/scheduling/CPM, timeline projection, Gantt/Network rendering modules,
baseline snapshot code, work aggregation/validation, task-order algorithms and
package/lock files are unchanged.

## Screenshots

- [Completion confirmation with project guidance](review/wp6-3-completion.png)
- [Desktop status table](review/wp6-3-table-1440.png)
- [Narrow status table, horizontally scrolled to the control](review/wp6-3-table-600.png)
- [Desktop criteria and transition history](review/wp6-3-details-1440.png)
- [Narrow criteria and transition history](review/wp6-3-details-600.png)

## Owner checks — A01–A15

Open `http://localhost:5173/`. Save/export your real plan before import/deletion
tests. Select tasks by ID, row, bar or Network node, then inspect Task Details.

1. **A01 Defaults:** load a WP5, WP6.1 or WP6.2 file. Tasks show Not Started with
   no fabricated events; original work/baseline records remain intact.
2. **A02 Ordinary states:** select In Progress, then Not Started. Inspect the dated
   transitions and compare unchanged dates, hours and baseline.
3. **A03 Block:** select Blocked; Cancel keeps the old status. Try blank/short
   reason, then enter a valid explanation. The active reason is visible in details.
4. **A04 Unblock:** select In Progress. The active blocked reason clears, while
   its original text remains in expanded history.
5. **A05 Criteria:** add/edit/remove/check several criteria. Open Mark Complete
   with unchecked items: confirmation is blocked with an explanation. Checks in
   the prompt can be submitted deliberately; Cancel must not change the checklist.
6. **A06 No criteria:** select Complete on a task without criteria. Both the
   no-formal-criteria acknowledgement and explicit completion confirmation are
   needed. No dropdown selection silently completes it.
7. **A07 Evidence:** set a completion date, optionally add a note and confirm all
   criteria. Inspect Complete status, completion date and the stored snapshot.
   Project Definition of Done appears as guidance when provided.
8. **A08 No inference:** log hours above the estimate and set remaining to zero.
   Status must stay as explicitly selected. Conversely, completing a task must
   keep its logs and remaining estimate, even if that estimate is nonzero.
9. **A09 Reopen:** try leaving Complete. A confirmation and reason are required.
   Cancel keeps Complete. Reopen deliberately, then complete again; both completion
   records and the reopening reason remain under distinct IDs.
10. **A10 Snapshot:** after reopening, change criterion text/checks or project
    guidance. Prior completion history must retain its original attested values.
11. **A11 Copy:** duplicate a task with checked criteria/work/history. The copy
    starts Not Started, has fresh unchecked criterion IDs and no logs/history.
12. **A12 Round trip:** Save, reload, Load project, export/import. Compare status,
    active reasons, criteria/IDs/checks, DoD, effective dates, snapshots and events.
    Download an original-format backup before explicitly migrating an older save.
13. **A13 Bad data:** import copies with an invalid status, duplicate event ID,
    missing task reference or unchecked/malformed completion snapshot. Expect an
    error, no replacement prompt and unchanged current/saved project.
14. **A14 Access:** use keyboard/pointer for dropdowns, checklist, date picker,
    confirmation, cancellation, reopening and history. Try an unfinished criterion
    draft across task/tab switches and Resume it. Inspect desktop/narrow layouts;
    Gantt stays first and the table scrolls without page overflow.
15. **A15 Regression:** exercise Gantt modes/scales, Network zoom/pan/Fit, sorting,
    duplication, dependencies, inline editing, baseline view, work logs and quick
    remaining entry. Planned scheduling and approved behavior stay intact.

Re-baselining, schedule forecasts (WP6.4), graphical progress (WP6.5), approvals,
authenticated identities and percentages remain unimplemented. Owner acceptance
is required before proceeding to WP6.4.
