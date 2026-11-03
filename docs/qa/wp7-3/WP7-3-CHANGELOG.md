# WP7.3 user-visible changes

Authorized correction scope: **C01–C06**. Ready for owner review; acceptance
is pending.

- **Task actions stay visible.** Duplicate, Edit form and Delete are pinned
  to the right of Tasks & schedule. An overflow hint appears when the table
  needs horizontal scrolling, including at desktop widths. Keyboard-focused
  fields scroll clear of the pinned controls.
- **Complete means zero unfinished work.** Remaining displays are zero and
  ordinary remaining editing is disabled while Complete. The prior stored
  estimate is retained and clearly labelled for reopening; it is not erased
  or presented as a fabricated historical record.
- **Recorded work is qualified.** Actual effort is labelled as recorded.
  No entries show “Not recorded — 0 hours logged”, with effort comparisons
  unavailable. Partial-log comparisons disclose unknown completeness and do
  not claim verified performance or proven savings. Logging remains optional.
- **New tasks start with an estimate.** Initial remaining effort is seeded
  once from the entered task estimate. A copy gets its own seed from its
  copied planning duration, with no copied work/status history. Later
  scheduled-duration edits do not overwrite reviewed remaining effort.
- **Reopening requires reassessment.** Supply a reason and confirm the
  suggested remaining amount, revise it, or explicitly choose Unknown.
  Invalid input/cancel leaves Complete and its previous stored value intact.
- **Forecast date mode is explicit.** Automatic follows local today,
  including local midnight; Fixed pins a chosen date, even today. Both
  round-trip with the existing optional As-of date contract.

Preserved: dependency and manual-date scheduling, critical-path algorithms,
Gantt/Network behavior, immutable baseline and historical completion snapshots,
exact recorded work, four statuses, shared-capacity forecast mathematics,
format-5 storage and older-file backup/overwrite compatibility. Older Unknown
remaining estimates are not automatically filled. No automatic time deduction,
mandatory timesheets, completeness flag, new format or silent migration.

Validation: **414 unit/component tests, 160 browser tests**, lint, typecheck
and build pass. [Verification](WP7-3-VERIFICATION.md) records commands and
evidence. [Owner runbook](WP7-3-OWNER-RUNBOOK.md) covers the six corrections
in approximately 15–20 minutes.

Expanded chart workspaces, meeting screens, student health/history,
chart-position changes, WP8, dependency upgrades, merges and release tags are
not part of this package. WP7.1 owner verification remains outstanding.
