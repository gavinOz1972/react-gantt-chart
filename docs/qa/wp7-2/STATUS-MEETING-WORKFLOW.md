# Periodic student status meeting — proposed workflow

This is a recommendation, not a new application screen. It keeps the four
statuses **Not Started, In Progress, Blocked, Complete** and treats remaining
effort as **all unfinished person-hours**, reviewed by students. Time passing
does not deduct effort. Work logging stays optional. A zero logged total does
not establish that nobody worked.

## A meeting using existing capabilities

Use a named disposable fixture while testing this route. For real meetings,
save/export a checkpoint first. The application has no meeting register,
period filter, student-health field or historical series of remaining estimates.
Keep period dates and a short exception note externally if needed; do not
pretend the current screen reconstructs a previous meeting's state.

1. **Choose the review period.** Agree the previous and current period dates.
   In Project Settings deliberately pin the forecast As-of date for the
   meeting. Until QA71-002 is corrected, changing away from today's date and
   back is the verified way to pin today; inspect the fixed-date help text.
   Review team/class/homework assumptions only if availability changed.
2. **Review expected previous-period work.** Inspect current committed finish
   dates in Gantt/table for the previous period and carry forward unfinished
   overdue tasks. Compare the frozen baseline when an original commitment
   matters. Current edited dates are not an historical meeting snapshot.
3. **Confirm completed work.** Select each completed task, review its criteria,
   choose the effective date, and explicitly confirm Complete. Work logs are
   optional evidence, not a completion prerequisite. A zero estimate alone
   never completes a task. Known UX7-006: the task UI may still display its
   prior 10-hour stored estimate even though the forecast uses zero future
   work. Do not overwrite history or alter original estimates to hide it.
4. **Reassess unfinished work.** For the tasks discussed, enter the best current
   total unfinished work via the table or selected-summary quick edit. Enter
   **6** if six person-hours remain, regardless of elapsed days or whether
   earlier actual work was logged. Blank means Unknown; zero explicitly
   means no effort remains but leaves the status unchanged. Do not subtract
   time mechanically. When reopening, review remaining effort deliberately;
   the current dialog requires a reason but reuses the prior estimate.
5. **Review this period and exceptions.** Inspect upcoming/current tasks,
   prerequisite chains, blockers and missing estimates. Set Blocked with a
   reason when progress is prevented; clear it when that condition changes.
   Separate a concern that permits progress from a Blocked state. There is
   no persisted student Green/Yellow/Red assessment yet; verbal concerns
   are not saved as a different status.
6. **Inspect consequences.** Turn on critical-path highlighting for the
   committed working-slot schedule. Inspect forecast FF dates and Project
   health using the revised estimates/capacity. Task Forecast Slip compares
   with that task's committed finish; project At Risk compares with target.
   Partial or Uncertain is a reason to investigate inputs/blockers, not a
   reassuring On Track conclusion. A forecast does not automatically replan
   committed dates or the immutable baseline.
7. **Close with exceptions and decisions.** Record only the agreed blockers,
   changed estimates/availability, newly completed/reopened work and actions.
   Save locally and export the checkpoint. Review saved settings/history if
   verification is needed. Completing a meeting is not an authorization to
   reset the baseline or to invent missing actual-work records.

This route is possible now but requires manual task selection, date inspection
and navigation between chart, table and lower details. No participant timing
or student-comprehension success rate has been measured. The prior WP7.1
owner runbook and automated lifecycle remain supporting functional evidence,
not proof that students find this route easy.

## Minimal proposed review interface — not implemented

Recommend a transient **Review period** view over existing task records, with
previous-period and current-period date ranges and an explicit As-of context.
Show task ID/name, committed finish, status, remaining estimate, blocker and
calculated warning. Preserve manual task order; filters must not reorder or
rewrite source data. Date buckets use the current accepted schedule and are
labelled accordingly, rather than claiming historical planned dates.

Start with **exceptions**, then allow an all-relevant-tasks view:

| Queue | Proposed selection / student decision |
| --- | --- |
| Previous-period unfinished / overdue | Confirm completion or reassess all remaining work; identify changed commitment separately |
| Blocked / dependent uncertainty | Review the reason, owner of the next action and whether the blocker has cleared |
| Missing remaining estimate | Enter a considered estimate or explicitly leave Unknown; no automatic zero |
| Current-period work | Confirm readiness and inspect prerequisites; discuss only changes or concerns |
| System warning | Inspect overdue/Forecast Slip/project At Risk and critical-path consequence; do not confuse it with student confidence |
| Completed since last review | Inspect dated completion evidence; effective remaining is zero, history stays intact |

Use existing quick remaining entry and status/criteria gates, with previous/next
navigation and a details disclosure. The minimum view does **not** require a
work session for every task, a percentage-complete field, a narrative for
unchanged tasks, or a new daily-reporting duty. A filtered-out task must not
be deleted or treated as Complete. Empty results explain the active dates
and filters; keyboard focus remains on a usable row/control after updates.

Acceptance for a later authorized implementation:

- Review ranges have clear inclusive endpoints and visible current As-of;
  overdue unfinished tasks are not lost merely because their due date is
  outside the previous-period bucket.
- Completion and reopening use the same deliberate gates as other entry
  points. Estimated remaining work can be revised without supplying actuals.
- One committed edit updates the same task ID, forecast and warnings; an
  invalid edit blocks commit, remains recoverable and does not alter saves.
- Changing a filter, period or selection changes no task/baseline/history.
- No new persisted meeting history is added in this minimal view. If the
  owner needs previous-meeting estimates, a separately versioned history
  design is required; the current file cannot reconstruct that evidence.

## Student judgment and system warning

If separately authorized, show two labelled channels: **Student assessment:
Green/Yellow/Red, dated** and **System: overdue/Forecast Slip/At Risk/etc.**
For example, “Student Green, Nov 9” alongside “System Forecast Slip” is a
review prompt, not a calculation error or permission to suppress the warning.
Missing student assessment is **Not reported**, never inferred Green. Keep
status independent: Red is not automatically Blocked and Green is not Complete.
See C09 in [the candidate backlog](WP7-3-CANDIDATES.md); this requires new
persisted data/history and separate authorization.

Owner approval of this workflow is pending. It does not approve a review
screen, health persistence or a change to forecasting mathematics.
