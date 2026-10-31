# WP5 owner test guide

Run from PowerShell:

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\react-gantt-chart
npm.cmd run dev
```

Open the `Local:` URL printed by Vite, normally `http://localhost:5173/`.
If it is already running, refresh the page. Use the same URL/port as before to
access existing browser saves. WP5 starts in Files; loading a plan opens Workspace.

## Main controls

Files contains named saves, Save As, Load, New project, Import JSON, Export JSON
and Delete saved plan. New project takes you to Project Settings. The Next buttons
guide you from Files to Settings to Workspace. Tabs can also be selected directly;
Left/Right/Home/End work when a tab has keyboard focus.

Workspace shows the Gantt or Network / Critical Path view above the task list.
Choose Manual Order to drag handles or use up/down actions. Drop onto a row to
place a task above it. Start Date, Task Name and Duration temporarily sort the
table and Gantt; they preserve your manual arrangement. Dependencies always use
permanent IDs, even when a successor is displayed before its predecessor.

Select a name, description, duration or independent date to edit it inline.
Enter, Tab or leaving the field saves a valid draft; Escape cancels. In notes,
Enter adds a line and Ctrl+Enter saves. Dependency checkboxes commit immediately.
Dependent dates are calculated and read-only. The full Edit form remains available
if you want its live preview and Save task/Cancel controls. Add Task still uses
that form.

Duplicate assigns a fresh ID and copies incoming links, notes, hours and independent
start settings. Names use `(Copy)`, then `(Copy 2)` if needed. The new task sits
directly after its original in Manual Order. Existing successors keep depending on
their original predecessor; the copy does not automatically inherit those outgoing
relationships.

Upper-right Save is available on every tab. For a named plan, it updates that
known browser copy. For an unnamed or imported plan, it opens Files and focuses
Saved plan name. Save As creates a separate named copy, or asks before replacing
an existing name. Unsaved changes / Saved locally describes browser persistence;
Schedule current describes calculations. They are separate statuses.

## Acceptance checklist

Use a test plan or a saved/exported copy of your own plan. Suggested calendar:
Monday / Thursday / Friday, three working hours per day. Add multiple independent
tasks, a chain, and a task with two predecessors.

| Scenario | Owner check |
| --- | --- |
| A01 manual drag | Drag T7 above T2. IDs, dates and criticality remain; Gantt rows follow the table. Try the up/down buttons too. |
| A02 sort round trip | Make a custom arrangement; select Start Date, Task Name and Duration, then Manual Order. The arrangement returns exactly. |
| A03 sorted protection | While sorted, drag and up/down controls are disabled. The message tells you to choose Manual Order. |
| A04 dependency-independent rows | Put Testing above Implementation while Testing depends on it. Dates and dependency arrows still describe the same schedule. |
| A05 non-reuse | Delete a saved task, then add and duplicate. The deleted ID is never assigned again; existing IDs stay fixed. |
| A06 copied fields | Duplicate a task with notes, hours, two predecessors and a retained manual date. The copy has a new ID, unique Copy name and the same source settings. |
| A07 outgoing links | If T5 depends on T4, duplicate T4. T5 continues to list T4 only. |
| A08 placement while sorted | Duplicate in Start Date mode. Sorting remains active. Manual Order reveals the copy directly after its original. |
| A09 inline commit | Change hours and separately commit with Enter, Tab and blur. Gantt dates and slack update after each commit. Typing alone does not change them. |
| A10 cancellation | Start changing a name or duration and press Escape. Original task and schedule remain. |
| A11 multiline notes | Enter adds a newline. Ctrl+Enter saves all lines. Also try Escape, Tab and blur. |
| A12 date/dependency | Change an independent date with the picker; remove one predecessor checkbox. Its task stays. Dependent dates have no editable picker; removing the final predecessor restores the independent setting. |
| A13 invalid input | Enter zero hours and press Enter. An error appears while valid dates stay visible. Escape restores the field. Self/cyclic predecessor choices are disabled with explanations. |
| A14 navigation | New project leads to Settings; Next leads to Workspace. Load opens Workspace. Switch tabs during an unfinished Add Task draft; return to the same input. Check chart mode, zoom and selected task too. |
| A15 persistent Save | Save is visible on all three tabs. An unnamed plan routes to naming. After Save As, edit a task and use header Save; it updates the same named plan. Save As over another name asks first. |
| A16 complete round trip | Save/reopen, export/import a plan with custom order, a sort preference, deleted IDs, copies and manual dates. All IDs, order, sort, incoming relationships, dates and future allocation remain consistent. Load an older WP4 file too: its previous task array order becomes Manual Order. |
| A17 regression | Check both Gantt modes, nonworking hatching, numbered work slots, connectors, critical highlighting, Network/CPM, bad-file rejection and save/delete/replacement confirmations. |

Older plans are normalized in memory. They are written only by an explicit save;
export includes the added order/sort/copy fields. Invalid inline drafts block
save/export until corrected or cancelled. An imported plan needs a named browser
save if you want to reopen it locally later.

See the [handoff and before/after screenshots](WP5-HANDOFF.md). Automated verification
passed 189 tests and 17 Chromium workflows. WP5 remains ready for owner testing,
not owner-accepted.
