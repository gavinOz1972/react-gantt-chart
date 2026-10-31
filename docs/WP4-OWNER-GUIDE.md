# WP4 owner test guide

Prepared 30 October 2026. The implementation is ready for review; WP4 is not
marked owner-accepted until you validate the running application.

## Open the app

In PowerShell:

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\react-gantt-chart
npm.cmd run dev
```

Open the Local URL printed by Vite. If the development server is already running,
use its existing page. Save & reopen appears above the project settings. Gantt and
Network / Critical Path controls appear below the task table.

## Compare unequal branches

1. Set project start to 2026-11-02, target to 2026-11-12, working days Monday and
   Thursday, and two working hours per day.
2. Add T1 Short branch, 1 hour; T2 Long branch, 3 hours; T3 Publish join, 1 hour.
3. Edit T3, select both T1 and T2 as predecessors, and Save task.
4. Check Highlight Critical Path in Gantt. T2 and T3 are critical. T1 has two
   working hours of slack. Select T1 to inspect its latest allowable start:
   Thursday 2026-11-05, hour 1.
5. Compare Expanded and Compressed. The expanded T2 bar keeps its nonworking hatch;
   compressed T2 uses three adjacent slots. The highlight does not change dates.
6. Switch to Network / Critical Path. T1 and T2 are separate roots feeding T3.
   T2 -> T3 is a bold solid critical edge; T1 -> T3 is dashed and noncritical.
   Click a node and return to Gantt: the same task stays selected.
7. Change T1 to five hours. Its branch becomes critical and T2 has two hours of
   slack. Network and Gantt should update immediately, even in a valid unsaved
   task preview. Save task to accept it.
8. Change the valid target date. Feasibility may change, but critical membership
   and working-hour slack must stay the same.

For equal branches, make T1 and T2 both three hours. Both branches and both edges
into T3 should be critical.

## Check a manual release

Save this plan under a name such as WP4 branches, then choose New project.

1. Restore the Monday/Thursday, two-hour calendar with start 2026-11-02.
2. Add T1 Earlier work for one hour and T2 Released work for one hour.
3. Edit T2 and select independent start 2026-11-12. Save task.
4. In Network, T2 is critical and T1 has six working hours of slack. T2 has one
   hour of effort plus a release wait of six working slots; the wait is not work.
5. Optionally add a one-hour T3 depending on both. T2/T3 are critical; T1 remains
   noncritical with six hours of slack.

A manual date retained on a dependent task remains inactive until the final link
is removed, just as in WP1/WP2. Earlier independent dates and earlier targets remain
rejected according to your approved policy.

## Save, reopen, export and import

1. Finish any task edits. Enter a Saved plan name and choose Save project. The
   badge should say Saved locally and a success message should identify the name.
2. Reload the page. Select that name in Saved plans, then choose Load project.
   Verify weekdays, hours, task IDs, descriptions, manual dates and predecessors.
3. Export JSON. Keep the downloaded file as a portable backup.
4. Choose New project, then Import JSON and select the downloaded file. Verify the
   restored source and schedule. The imported plan is unsaved locally until you
   explicitly choose Save project.
5. Save another named copy. Multiple names should appear in Saved plans.
6. Try saving over an existing name. Cancel the overwrite and check the old copy
   is intact; repeat and confirm only when you want to replace it.
7. Delete a selected saved plan. The confirmation affects only the named browser
   copy; the open plan and other named copies must remain.

Save task accepts a draft into the open plan. Save project writes the full plan
into this browser. Export JSON downloads a file without updating a named browser
copy. There is no automatic save or automatic reopen. Local copies belong to this
browser profile and site origin, including the port; JSON moves between computers.

## Check rejection and cancellation

- Edit a task duration to zero. Saving/exporting the project is disabled, and
  schedules/charts must not display stale calculated dates as current.
- Attempt Load project while that unfinished draft exists. Cancel must preserve
  the zero-hour draft; confirming replacement must restore the saved valid plan.
- Try importing malformed JSON, an unsupported schema, a missing predecessor or a
  cycle. The error must explain the issue and keep your open project unchanged.
- An import file must be JSON and at most 10 MiB. Browser storage failures must
  report failure rather than marking unsaved changes as saved.

## Review artifacts and acceptance

The [verification handoff](WP4-HANDOFF.md) contains the acceptance matrix and test
results. Screenshots show [critical Expanded](review/wp4-critical-expanded.png),
[critical Compressed](review/wp4-critical-compressed.png),
[the network](review/wp4-network.png),
[manual release waiting](review/wp4-manual-release.png), and
[local project controls](review/wp4-local-projects.png).

Please validate critical/slack meaning, network arrows/selection, and save/reopen/
JSON transfer in your running browser before WP4 is marked owner-accepted.
