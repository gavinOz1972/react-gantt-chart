# WP6.2 — Actual work tracking

Implemented 31 October 2026 on `feature/wp6-progress-tracking`.
Ready for owner testing; formal acceptance is pending before WP6.3.

## Starting state and release protection

| Item | Value |
| --- | --- |
| Accepted starting commit | `24a9dec418222514a1e9dd82c7bd14d788b24dc4` (WP6.1) |
| Working branch | `feature/wp6-progress-tracking`, continued in place |
| Protected release tag | `v1.0-pre-progress` |
| Tag object | `a4157bc84392c770c27111da58d779948b110a56` |
| Tag target | `abb85011dafc9fb0876953e3132880e025ef65da` (accepted WP5.2) |
| main, unchanged | `a6a1c32c22a2bf074b161e52d523443602843dd7` |
| Implementation commit | Commit containing this handoff; exact SHA reported in the completion message and available with `git rev-parse feature/wp6-progress-tracking` |

The worktree was clean and local/remote feature, main and release-tag states were
verified before editing. The starting `npm.cmd run check` passed 237 tests in 23
files, lint, typecheck and build. No main merge or tag movement is part of WP6.2.

## Delivered behavior

Selected **Task details → Work & effort** contains an actual/remaining/estimated
total/baseline/variance summary, an explicit remaining-estimate form, Add/Edit work
entry form and chronological work log. Workspace remains chart-first, with the
existing Files | Project Settings | Workspace navigation.

- Each submitted entry has a stable W-UUID, permanent task ID, calendar work date,
  contributor, decimal hours, description and creation/update timestamps.
- Work date uses a date picker. Historical dates are accepted; future dates give
  an advisory warning and remain as entered. No clock time is invented.
- Contributor text is trimmed and limited to 1–80 characters; description is
  trimmed and limited to 3–500 characters. Hours must be finite and positive with
  at most two decimals. The documented per-entry/estimate upper bound is
  1,000,000 hours. Invalid submissions retain the draft and show corrective text.
- Work entries sort by work date ascending, with creation time/ID tie breakers.
  Edit preserves entry ID, task association and creation timestamp. Delete needs
  confirmation. Actual totals immediately reflect every accepted correction.
- Remaining effort is a separate nullable estimate: blank/missing/null is unknown;
  zero explicitly estimates none remain. Neither zero nor actual totals mark a
  task Complete. Remaining estimates have explicit save/cancel controls.
- Actual effort is derived using integer hundredths. A known remaining estimate
  gives actual + remaining as estimated effort at completion. Matching original
  baseline duration gives variance; positive is over estimate, negative is under.
  Unknown remaining gives no total or variance. A post-baseline task shows No
  baseline and no variance, while a known remaining estimate can still produce
  an effort total. This is not a predicted finish date.
- Entry and estimate drafts survive task/tab switches and expose Resume edits
  for the relevant task. Unsubmitted drafts block project Save/Export and
  conflicting task/settings edits and trigger existing replacement safeguards.
- Task copies receive no work history or estimate. Task deletion explicitly
  discloses work entries/estimates being removed, then deletes only that task's
  current records after confirmation. Baseline-only deleted tasks stay frozen.

Work data is separate from the schedule input model. Baseline snapshot code,
WP1 calendar/scheduling/CPM, Gantt/Network rendering, ordering/duplication algorithms
and dependency versions are unchanged. Person-hours do not change dependency
constraints or planned working slots. Contributor names are project-local text;
there is no authenticated identity, immutable audit trail or estimate history.

## Schema and compatibility

Project format **3** adds optional `workTracking` with its own schemaVersion 1:
`entries: WorkEntry[]` and `remainingHours: { [permanentTaskId]: number | null }`.
The current-plan fields and baseline schemaVersion 1 contract stay intact. No
independently editable actual total, estimated-total field or variance is stored.

Formats 1 (WP5) and 2 (WP6.1) load without fabricated work records or estimates.
Opening does not write storage or upgrade the saved copy. Files offers Export
WP5 backup or Export WP6.1 backup of the original loaded plan, including its
original baseline where present. The backup does not include later drafts or
work. Save As to a new name keeps the earlier record untouched. Saving over an
older named record, including header Save, explains migration to format 3 and
requires confirmation; that dialog also provides an original-format backup.
Cancel changes nothing in the saved library.

New normal saves/exports write format 3. Older releases cannot safely preserve
the new records and should use their compatible backups. The browser library
key/envelope remain v1; unrelated stored plan objects are preserved on writes.

Work data is validated before opening or saving: malformed values, duplicate
entry IDs, orphaned entry/estimate task references and unsupported versions reject
the entire operation. Unknown versions or bad work cannot replace the open plan
or overwrite a saved copy. Remaining explicit zero and unknown remain distinct
through local Save/Load and JSON Export/Import. Entry association uses permanent
IDs and is independent of display order.

## Verification and evidence

| Check | Result |
| --- | --- |
| Final `npm.cmd run check` | Passed: lint, typecheck, 300 tests across 25 files, production build |
| New pure work/persistence tests | 63 passed (51 domain/aggregation + 12 persistence), included in 300 |
| Full `npm.cmd run test:e2e` | 56 passed in 34.3 seconds |
| Existing browser regression | All 47 prior workflows retained and passing |
| New browser workflows | 9 passed, covering A01–A14 |
| Production build | Passed, 48 modules |
| Gantt visual regression | Chart surface PNG hash identical before/after work/remaining changes; dates, bar coordinates and critical attributes identical |
| Baseline invariance | Serialized original baseline identical after actuals/estimates; original tasks/slots/completion retained |
| Live owner server | `http://localhost:5173/` serves TaskWorkPanel, work-date control and remaining-estimate action |

The existing WP4/WP6.1 export/migration expectations now use format 3; their
behavioral assertions remain. No regression tests were removed. New accessible
field names were shortened during browser verification. The visual comparison
targets the chart surface so transient toolbar keyboard focus is not mistaken for
a scheduling change. One old unit test timed out when the unit suite and the
16-worker browser suite ran concurrently; the final complete check ran separately
and passed without timeout changes. No unresolved test exceptions remain.

Browser regression recreated historical screenshot files; those generated-only
changes were restored so accepted WP5/WP6.1 review evidence remains intact.
The new screenshots below were visually reviewed at 1440px and 600px widths.
Automated tests use port 4173 and do not modify the owner's 5173 browser saves.

- [Work summary and sessions, desktop](review/wp6-2-work-desktop.png)
- [Entry form with advisory future-date warning](review/wp6-2-entry-form.png)
- [Narrow work panel](review/wp6-2-work-narrow.png)

## Changed files

| Files | Purpose |
| --- | --- |
| `src/workTracking/workTracking.ts` | Typed work/estimate contract, validation, strict decimal parsing, aggregation, comparison and cleanup helpers |
| `src/workTracking/workTracking.test.ts` | 51 pure validation, precision, identity and comparison tests |
| `src/workTracking/README.md` | Work-domain contract and calculation rules |
| `src/components/TaskWorkPanel.tsx` | Selected-task summary, remaining form, log, entry corrections, confirmations and preserved drafts |
| `src/App.tsx` | Per-project work lifecycle, validation, unsaved guards and confirmed task cleanup |
| `src/components/DeleteTaskDialog.tsx` | Explicit work/estimate deletion warning |
| `src/components/ProjectSettingsForm.tsx` | Explain disabled settings during effort drafts |
| `src/components/persistence/ProjectStorage.tsx` | Format 1/2 backups, migration confirmation and effort-aware save/replacement guidance |
| `src/persistence/projectFile.ts` | Format 3 writer, v1/v2/v3 reader, optional versioned work validation and dirty fingerprint |
| `src/persistence/workPersistence.test.ts` | New/legacy round trips, malformed data and saved-copy preservation |
| `src/persistence/baselinePersistence.test.ts` | Existing explicit-migration expectation updated to current format |
| `src/test/workFixture.ts` | 8-hour baseline and nonsequential-ID acceptance fixture |
| `src/styles/global.css` | Work form, comparison summary, log and narrow layout |
| `tests/work-tracking.spec.ts` | Nine real-browser workflows and review captures |
| `tests/baseline.spec.ts`, `tests/wp4.spec.ts` | Expected format bump in retained regression checks |
| `README.md`, `src/persistence/README.md`, `src/baseline/README.md` | Usage and schema/contract compatibility notes |
| This handoff, three `docs/review/wp6-2-*.png` files | Owner guide and review evidence |

## Owner test script — A01–A14

Use `http://localhost:5173/`. Save/export your real plan before testing replacement
or deletion. Select a task via its ID, row, bar or network node, then scroll to
Task Details. Establish an approved 8-hour baseline task for the comparison test.

1. **A01 Empty:** select a task with no entries. Actual = 0 h, remaining input is
   blank/Unknown, estimated total and variance are Not available.
2. **A02 Sessions:** add 2.25 h and 3.50 h on distinct dates with contributor and
   meaningful descriptions. Verify chronological entries and actual = 5.75 h.
3. **A03 Comparison:** save 5 h remaining against the 8 h baseline. Verify 10.75 h
   effort at completion and +2.75 h variance. Planned dates stay identical.
4. **A04 Validation:** try blank contributor/description/date; nonnumeric, zero,
   negative or three-decimal hours. Read the error and verify valid draft text is
   kept. Try a historical date and a future date; only the future date warns.
5. **A05 Zero:** save 0 remaining. Estimated total equals actual and the task is
   not marked Complete. Clear the estimate and save to restore Unknown.
6. **A06 Corrections:** edit a session's hours/date/contributor/description. Check
   totals update and export still has its original entryId and createdAt. Cancel
   a deletion first, then confirm deletion; only confirmation removes it.
7. **A07 No baseline:** add/duplicate a task after baselining. It starts with zero
   actual and unknown remaining. Log work and estimate remaining; verify No
   baseline, no variance and a valid actual-plus-remaining effort total.
8. **A08 Frozen plan:** compare the exported baseline section before/after work
   and estimate changes. View Baseline retains the same approved inputs and
   calculated completion, regardless of current manual display order.
9. **A09 Round trip:** Save, reload, Load project, export and reimport JSON. Verify
   entry IDs, all user text/dates/metadata, work totals, estimates and the baseline.
   Use one zero estimate and one blank/unknown task to check the distinction.
10. **A10 Legacy:** import a WP5 or WP6.1 file. Verify zero actual/unknown remaining
    with no invented entries. Download its compatible backup. Cancel an attempted
    overwrite/migration and verify the old saved copy remains; then explicitly
    confirm migration or Save As under a new name.
11. **A11 Protection:** import a copy with duplicated entryId, missing task reference
    or bad hours. Expect an actionable error and unchanged current/saved data.
    Delete a task with a work log: the confirmation must disclose its work count
    and remaining estimate. Cancel keeps them; confirm removes only that task's
    current data and preserves its baseline record.
12. **A12 Identity:** duplicate a logged task and verify no copied sessions or
    remaining estimate. Reorder/sort and export: permanent task/entry associations
    remain intact. Deleted task IDs are not reused.
13. **A13 Scheduling:** compare scheduled starts/finishes, dependencies, critical
    path, calendar and Gantt before/after logging and estimate changes. All are
    unchanged. Existing Gantt scales/modes and Network zoom/pan/Fit still work.
14. **A14 Keyboard/layout:** check date picker, Tab navigation, explicit Save,
    Escape/Cancel, focus return and deletion confirmation. Switch tasks/tabs with
    an unfinished draft and Resume it. Workspace still shows chart, then tasks,
    then details/work; narrow layout has no page overflow.

Actual/remaining effort and effort comparison are implemented. Task statuses,
completion criteria/confirmation/history, schedule forecasting, progress graphics,
editable percent complete, identity/authentication and timesheet approvals remain
deferred. Owner acceptance is required before WP6.3.
