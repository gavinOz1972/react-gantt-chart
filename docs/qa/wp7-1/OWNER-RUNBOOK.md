# WP7.1 owner verification — 28 minutes

This is a guided functional check. Codex ran the automated tests; consolidated
owner results and acceptance remain pending. QA71-005 has already been
reported by the owner and reproduced. Mark each outcome only after trying it.
New-student exploratory usability belongs to WP7.2.

## Start safely (2 minutes)

Use a private browser window, with no real project open, and this isolated
worktree. The ordinary development server and saved projects are unaffected.

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
npm.cmd run dev -- --host 127.0.0.1 --port 4174 --strictPort
```

Open **http://127.0.0.1:4174/**. Use Files → Import project JSON to choose
`tests\fixtures\wp71\student-30-create.json` in this worktree. Save As
**WP71 DISPOSABLE owner lifecycle**. Use only names with that prefix.
Keep downloaded QA exports separate from real backups. Private-window local
saves disappear when the private session closes; keep the JSON export if
you want to retain this test.

Expected: 30 tasks, start **Nov 2, 2026**, target **Feb 26, 2027**, working
**M/T/Th/F**, four working hours/day. Completion **Dec 15 after hour 3**.

- [ ] Pass  [ ] Fail  [ ] Observation — setup/result: ____________________

## Entry, dependencies and order (4 minutes; E01–E03)

1. Inspect Project Settings date inputs and calendar. In Workspace add a
   one-hour independent task named **QA owner check**, with a description.
   Expect new ID **T31**, and no change to project completion. Cancel an edit
   and verify the original task name is retained.
2. Remove T2's T1 predecessor. Expect T2 to start Nov 2 immediately. Restore
   it; expect Nov 3 hour 1 through Nov 5 after hour 2 and completion Dec 15.
   Attempt to make T1 depend on T30: expect a cycle error. Cancel that change.
   T25's requested Nov 18 (Wednesday) must schedule on Thursday Nov 19.
3. Move T30 up; temporarily sort by name; return to Manual Order. Expect
   your manual order to return. **Known QA71-005:** scroll the Tasks & schedule
   table horizontally right to the far-right **Actions** column to find
   **Duplicate**. It starts offscreen even at common desktop widths, without
   a desktop scroll hint. Tab navigation also reveals it. Record this
   discoverability issue as an Observation; a successful workaround does not
   close the defect. Duplicate T10: expect **T32**, predecessors
   T8/T9, original T10 retained. Do not rename any IDs.

- [ ] Pass  [ ] Fail  [ ] Observation — entry/dependencies/order: __________

## Baseline and views (4 minutes; E04–E05, E09, E14)

1. Project Settings → Establish Baseline, review and confirm deliberately.
   Change T18 total hours from 12 to 16. Expect current completion **Dec 17
   after hour 3** and baseline **Dec 15 after hour 3**. Inspect T30 by ID.
2. Show Baseline; try Expanded/Compressed and Hour/Day/Week scales. Expanded
   shows nonworking hatching; Compressed omits those dates. Turn Critical
   Path on/off. Dates and task statuses must not change when changing views.
3. Open Network / Critical Path. Zoom in, drag empty background to pan,
   choose T30/Go to selected node, then Fit to View. Long labels must be
   readable at a suitable zoom or in selected details. Return to Gantt and
   Close selected task details; selection should clear without losing data.
   Save this disposable checkpoint.

- [ ] Pass  [ ] Fail  [ ] Observation — baseline/charts/selection: __________

## Work and completion (5 minutes; E06–E07)

1. Select T1. In Work & effort add **QA Alex, Oct 31, 1.25 h** and **QA Casey,
   Nov 1, 2.5 h**, with descriptions. Historical dates are allowed. Expect
   actual **3.75 h**. Edit Alex to **1.5 h**: **4 h**. Delete Casey, first
   Cancel, then confirm: actual **1.5 h**.
2. Quick-edit T1 Remaining Effort in the table to **2**, then in the chart's
   selected summary to **1.25**. Expect actual **1.5 h**, effort at completion
   **2.75 h**, original baseline effort **4 h**. A zero estimate alone must
   not complete a task.
3. Add criterion **A teammate approved the charter**. Mark Complete, check
   the criterion, choose **Nov 2**, and confirm. Reopen to In Progress with
   reason **Mentor requested another check**. Inspect Transition history:
   the completion date, checked criterion snapshot and original committed
   finish remain, followed by the reopening reason. Save the checkpoint;
   Export JSON if you want to keep this specific QA history.

- [ ] Pass  [ ] Fail  [ ] Observation — work/history/criteria: ______________

## Forecast and overlays (5 minutes; E08–E09)

1. To use known estimates for all tasks, import **student-30-prepared.json**.
   This intentionally starts a fresh 30-task QA state; it does not carry the
   previous section's work/history or extra tasks. Save As **WP71 DISPOSABLE
   owner forecast**. Expect class **3**, homework **5**, team **4**, As-of
   **Nov 9**, known remaining **181**, target capacity **502.86**, projected
   finish **Dec 18**, project **On Track**.
2. Select T30. Show Forecast on: expect **FF Dec 18** versus commitment
   **Dec 15**, with **Forecast Slip**. Toggle Forecast off: predictive chart
   badges/markers disappear; Project health remains available. Baseline and
   Critical Path toggles work independently. Compare both Gantt modes.
3. Clear T20's estimate: expect **Partial**. Restore **10**. Block T13 with
   reason **Waiting for school accounts**: expect **Uncertain/Indeterminate**
   and no confident downstream T30 FF. Return T13 to In Progress: Dec 18
   returns. The committed schedule and frozen baseline stay unchanged.
4. Set team size **2** and target **Jan 15, 2027**. Expect forecast **Jan 27**,
   project **At Risk**. Restore team **4** and target **Feb 26**. Disable the
   forecasting model: Show Forecast becomes disabled with an explanation;
   re-enable to recover. Save.

- [ ] Pass  [ ] Fail  [ ] Observation — forecast/status meanings: __________

## Save, legacy and recovery (5 minutes; E10–E12)

1. Reload the page, Files → select **WP71 DISPOSABLE owner forecast** → Load
   project. Export JSON, then import it. Expect 30 stable IDs, original
   baseline, remaining estimates, status events and capacity settings intact;
   no hidden dialog prevents interaction.
2. Import **legacy-format-4.json**. Forecast starts Disabled; no events are
   invented. In Files export the offered **WP6.3 backup** before saving.
   Save As **WP71 DISPOSABLE owner legacy** under a new name. Expect current
   format on Export JSON; the original backup is still format 4. This new
   name does not overwrite an old saved plan. Overwrite migration dialogs,
   backup equality and cancellation for existing local formats 1–4 have
   separate automated coverage; try another import if time allows.
3. Enter invalid total hours **0**, then Escape. Blank a required project
   date; Save must be blocked. Revert settings. Enter invalid team size
   **1.5**; revert invalid forecast entries. These must not overwrite saves.
4. Make an unsaved task-name edit and refresh. Cancel/Stay on the browser
   warning: the draft remains. Refresh again and confirm Leave: the unsaved
   draft is discarded. Explicitly load the known saved QA plan to recover.
   There is no autosaved draft recovery guarantee. Malformed import must
   show an error without replacing the current plan (automated coverage).

- [ ] Pass  [ ] Fail  [ ] Observation — save/migration/recovery: ____________

## Forty-task responsiveness (3 minutes; E13–E14)

Import **student-40-performance.json**, Save As **WP71 DISPOSABLE owner 40**.
At your normal laptop window size, enable Baseline and Forecast, select T20,
change remaining effort **10 → 13** and press Enter. Expect **229** remaining
person-hours and **Dec 29** projected completion. Switch to Week/Compressed,
scroll the chart and table, and Save. Controls must remain responsive with
no freeze. Baseline committed completion stays **Jan 4, 2027 after hour 4**.
Record any perceptible typing/scroll delay with viewport/browser details;
the automated timings are observations, not a universal latency promise.

- [ ] Pass  [ ] Fail  [ ] Observation — responsiveness/invariants: __________

## Record the session

Owner/date: __________________ Browser/version: ________________________

Laptop/viewport: ______________ Passed: ____ Failed: ____ Observations: ____

Attach steps, expected/actual, fixture and screenshot to each failed or
unclear point. Review [findings and triage](FINDINGS.md), then accept the
assessment or request further verification. Acceptance does not authorize
unlisted product changes. WP7.3 corrections require your separate triage.
