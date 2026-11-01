# Actual work and remaining effort (WP6.2)

Work entries record person-hours, independently of WP1's scheduled working time.
No scheduling function consumes this data. Logging work, correcting a session or
changing a remaining estimate cannot move planned dates or affect critical paths.

## Typed contract and validation

`WorkTracking` has `schemaVersion: 1`, an `entries` array and a `remainingHours` map
keyed by permanent current-task ID. It is an optional section in project format 3.
Each readonly `WorkEntry` has:

| Field | Rule |
| --- | --- |
| entryId | Stable nonempty string, maximum 120 characters; UI generates W-UUID |
| taskId | Existing permanent Current Plan task ID |
| workDate | Strict Gregorian YYYY-MM-DD, years 0001–9999; no invented time |
| contributor | Trimmed project-local name, 1–80 characters |
| hours | Finite positive number, up to two decimal places |
| description | Trimmed work description, 3–500 characters |
| createdAt, updatedAt | Strict UTC ISO metadata; update cannot precede creation |

Per-entry and remaining estimates are limited to 1,000,000 hours, with an explicit
error above that limit. This provides a documented numeric boundary far beyond
normal student effort; there is no calendar-day or hours-per-working-day cap.
Imported duplicate IDs, orphaned task references, malformed records, unknown
versions and invalid remaining estimates reject the whole file. The reader copies
known fields and never trusts embedded actual/forecast totals. It checks the
combined integer-hundredths sum remains a safe integer.

`parseEffort` validates decimal drafts without coercing blank or nonnumeric input
to zero. `entryFromDraft` trims text and preserves an edited record's entry ID,
task association and creation timestamp; updatedAt changes on submission. Pure
helpers take caller-supplied metadata. Work date validation reuses WP1's date-only
validator without changing its rules. `futureWorkWarning(date, today)` is advisory;
past and future dates remain exactly as submitted. The UI compares to the local
calendar date, without converting a work date into a timezone-dependent timestamp.

## Derived comparison

Actual hours are summed as integer hundredths, then divided by 100 for display.
Remaining hours are nullable: missing key/null means unknown, while zero is an
explicit estimate. No actual total is stored independently. With known remaining:

```text
effort at completion = actual hours + remaining hours
effort variance      = effort at completion - original baseline task estimate
```

Baseline lookup uses task identity, never task-array or display-order position.
Unknown remaining produces no total or variance. No matching baseline task shows
No baseline and no variance, while a known remaining estimate still permits an
actual-plus-remaining effort total. Positive variance means over estimate;
negative means under. Neither is a predicted finish date, progress percentage or
completion status. Zero remaining never marks a task Complete.

## Interface and lifecycle

WP6.2.1 exposes the same nullable estimate through the task table's Remaining
Effort column and a compact selected-task summary below the Gantt. Both reuse
`parseEffort(text, true)` and the existing validated project work state; the work
contract and project format 3 do not change. Task Details retains its existing
explicit estimate form and work-log workflow. All three reflect accepted changes
immediately, with actual totals and baseline comparisons recalculated as before.

Quick entry selects the existing numeric text. Enter saves and returns focus;
Tab/Shift+Tab saves and moves to the next/previous available control outside the
editor; Escape or pointer Cancel restores the estimate. Pointer Save is also
provided. Valid changed values commit on external blur. Invalid input remains a
draft with an accessible error and never changes the prior estimate. Unchanged
values close without writing. Clearing deliberately writes unknown/null, never
zero. Drafts block project Save and conflicting edits; invalid selected-chart
drafts can be resumed after selecting another task. Quick-entry UI state uses
permanent task IDs and is not serialized.

Selected Task Details contains the summary, explicit remaining-estimate form,
Add/Edit work-entry form and chronological log. Entries sort oldest work date
first, then creation timestamp and ID for ties. Form validation leaves drafts in
place. Escape/Cancel restores accepted data, and delete requires the existing
accessible confirmation dialog. Work history is editable; contributor names are
not authenticated identities and this is not an immutable audit log.

Task-specific drafts survive selection/tab changes and expose Resume edits for
other tasks. Pending drafts mark the project unsaved, block project Save/Export
and conflicting task/settings mutations, and participate in existing replacement
warnings. A new/open project resets them only after the existing replacement
safeguards. Accepted records/estimates participate in the source fingerprint.

Task duplication creates no work/estimate records. Task deletion explicitly warns
about associated logs and estimates before removing only that task's records;
the baseline and other tasks' work stay intact. Reorder/sort changes are independent.
Local Save/Load and JSON round trips keep both editable work data and the immutable
baseline. Formats 1/2 remain readable without fabricated work; older saved copies
are migrated only on explicit Save with confirmation and original-format backups.
