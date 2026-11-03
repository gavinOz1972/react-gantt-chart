# WP7.3 owner verification — 15–20 minutes

Automated checks pass; **your acceptance is pending**. This route exercises
C01–C06 using disposable data. WP7.1 owner verification remains a separate
outstanding requirement. Mark Pass/Fail/Observation only after trying a step.

## Open the corrected worktree (2 minutes)

Use a private browser window and the stabilization worktree, rather than the
original WP6 checkout/server. If this worktree already has a server on 4174,
use it; otherwise start one:

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
npm.cmd run dev -- --host 127.0.0.1 --port 4174 --strictPort
```

Open **http://127.0.0.1:4174/**. In Files import
`tests\fixtures\wp71\student-30-prepared.json` from this worktree, then
Save As **WP73 DISPOSABLE owner**. Never overwrite a real plan.
Expect 30 tasks, baseline/committed completion **Dec15 after hour3**,
fixed As-of **Nov9**, remaining **181**, forecast finish **Dec18**, target
**Feb26,2027**. The dates refer to the fixture's 2026/2027 calendar.

- [ ] Pass  [ ] Fail  [ ] Observation — setup: __________________________

## C01 — visible actions (2 minutes)

1. Open Workspace → Tasks & schedule. At a normal desktop/laptop width,
   Duplicate, Edit form and Delete should already be visible on the right.
   Scroll the table to both horizontal extremes: Actions stays pinned and
   its header remains aligned. Other columns still scroll.
2. When the table overflows, the horizontal-scroll hint is shown even at
   desktop width. A wide monitor can still need scrolling because the page
   width is bounded. Resize near 1280 and 780 px if practical.
3. Tab through a task row. The focused field should be visible outside the
   pinned column, with a clear outline. Open Edit form and Cancel; choose
   Delete then Keep task. Leave the original 30 tasks intact. Activate
   Duplicate later in the copy step below.

- [ ] Pass  [ ] Fail  [ ] Observation — actions/focus: ___________________

## C04 — initial estimate and later independence (3 minutes)

1. Add an independent task named **QA additional review**, description of
   your choice, total estimate **10**. Expect **T31**, Not Started,
   Remaining Effort **10 h**, no recorded work. Project remaining becomes
   **191**, forecast **Dec20** at the fixture assumptions.
2. Quick-edit T31 remaining to **14**. Expect project **195**. Change its
   scheduled total hours to **12**; remaining must stay **14**. The later
   schedule edit does not reset a reviewed estimate.
3. Select T31 and inspect Work & effort: recorded actual is **0 h**, with
   **Not recorded — 0 hours logged**. No work log is needed for forecasting.
   This new task has no frozen baseline estimate; comparisons may be unavailable.

- [ ] Pass  [ ] Fail  [ ] Observation — initialization: _________________

## C02/C03 — Complete and recorded-data meaning (4 minutes)

1. With T31 selected, Mark Complete or choose Complete from its status
   control. Use effective date **Nov2,2026**, attest the no-criteria and
   completion confirmations (or satisfy any criteria you added), and confirm.
2. Table, selected summary and Work & effort must show **0 effective
   remaining** and prevent ordinary remaining edits while Complete.
   A separately labelled retained previous estimate is **14 h**. The
   scheduled estimate stays12; baseline remains unchanged. Project remaining
   returns to **181**, forecast **Dec18**. Inspect completion history.
3. Select existing baseline task **T13**. Add an optional work entry of
   **2 hours**, contributor **QA Student**, date **Nov2,2026**, description
   **Partial review work record**. Remaining stays10 and project forecast
   does not change merely because actual work was logged.
4. T13 should show recorded actual2, recorded-data effort total12 and
   recorded-data variance+2 against its baseline10. The labels/explanation
   must say records may be incomplete, not imply verified total effort or
   a proven overrun. Leave T13 unfinished; return to T31 for reopening.

Automated cases additionally cover Complete with stored10, stored0 and
storedUnknown, both with no logs and partial logs, across save/reload/import.

- [ ] Pass  [ ] Fail  [ ] Observation — effective/recorded effort: ________

## C05 and copy policy — reassess deliberately (4 minutes)

1. Reopen T31 to In Progress. The retained14 is only a suggestion; a reason
   and an explicit remaining choice are required. Choose revised amount,
   enter **-1**, add a reason, and try confirming: expect an error and no
   transition. Cancel. T31 must remain Complete, effective0, retained14,
   with the original completion event intact.
2. Reopen again. Choose **Enter a revised amount**, enter **6**, and reason
   **Six person-hours remain after review**. Confirm. Expect In Progress,
   remaining6, project **187**, forecast **Dec19**. History retains the first
   completion unchanged and adds the reopening reason.
3. Other explicit choices are Confirm suggested amount and Declare Unknown.
   Unknown does not masquerade as zero. Automated tests cover both plus
   reopening through table, chart and details, including stored0/Unknown.
4. Use T31's pinned Duplicate button. Expect **T32**, scheduled estimate12
   and its own remaining **12**, not source6. It is Not Started with no copied
   work or completion/reopening events. Project remaining becomes **199**,
   forecast **Dec22**. Original tasks/history and baseline remain intact.

- [ ] Pass  [ ] Fail  [ ] Observation — reassessment/copy: _______________

## C06 and persistence — explicit date intent (3 minutes)

1. Save the QA checkpoint. Project Settings → Forecast date mode →
   **Automatic — Use today's local date**. The automatic date is shown;
   no fixed-date input is active. Save As **WP73 DISPOSABLE owner auto**.
2. Choose **Fixed — Use a selected date**. It must deliberately pin the
   displayed local today without changing away/back. Inspect the date input,
   then Save As **WP73 DISPOSABLE owner fixed**. The fixture's forecast
   dates can now differ because you explicitly changed its As-of context.
3. Reload, load the fixed QA plan, and verify Fixed and its date persist.
   Export JSON and import that same file; Fixed, baseline, task IDs, optional
   work and completion/reopen history must survive. Load the automatic QA
   save and verify Automatic instead. A later local day advances only Auto.
   The automated clock test already verifies idle local midnight, so this
   short manual session does not require changing the OS clock or waiting.

- [ ] Pass  [ ] Fail  [ ] Observation — modes/round trips: ________________

## Record acceptance

Owner/date: __________________ Browser/viewport: ________________________

- [ ] C01–C06 accepted as implemented in WP7.3.
- [ ] Further correction/verification requested: ________________________

For a failure, attach the task ID, action, expected/actual, fixture and a
screenshot/export of this disposable plan. Keep original real-data backups
separate. Private-window local saves disappear when the private session ends;
keep QA JSON exports if you want to retain the results.

No C07–C10, reporting, merge or release tag is included. WP7.1 verification
remains outstanding even if this correction package is accepted.
