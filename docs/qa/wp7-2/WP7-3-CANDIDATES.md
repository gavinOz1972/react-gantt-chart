# Proposed correction and enhancement backlog

**No item below is implementation authorization.** WP7.2 stops at owner
review. WP7.1 acceptance is still unrecorded. Each item can be approved,
deferred or rejected independently; dependencies identify combinations that
must be considered together. Production source and file formats are unchanged.

## Defect corrections recommended first

### C01 — task-action discovery (QA71-005, Medium)

Recommend a sticky right-hand **Actions** column retaining a visible
**Duplicate** button, plus a scroll instruction driven by actual overflow.
This keeps current native buttons and avoids a new menu interaction.
Compare alternatives and evidence in [UX-FINDINGS](UX-FINDINGS.md#qa71-005).

Acceptance: Duplicate, Edit form and Delete are reachable at 1440, 1280 and
780 widths at both horizontal extremes; Actions header and controls agree;
sticky content does not obscure the keyboard-focused cell. The overflow
hint is present when needed independent of breakpoint. Keyboard activation,
focus appearance and scroll remain usable. Duplication retains incoming
dependencies, fresh durable IDs, original tasks/baseline and no copied logs
or completion events. No source data or file-version change is needed.

Bound: task-table layout/access only. Do not add sorting, export, reporting
or new duplication semantics. Diagnostic initial clipping observations must
be updated into post-correction discovery acceptance checks, rather than
retaining an expectation that a user must scroll to find the action.

### C02 — completed-task effective remaining display (UX7-006, Medium)

Recommend displaying **0 effective remaining hours** for Complete tasks in
the table, selected chart summary and Work & effort. Retain the stored prior
estimate for compatibility and reassessment; if exposed, label it separately
as a retained stored estimate, not unfinished work or an immutable historical
snapshot. Prevent ordinary editing of “effective remaining” while Complete.

Acceptance: Complete with stored 10, stored 0 or stored Unknown displays
effective zero consistently; forecast/project total stays unchanged from
the already correct Complete exclusion. Baseline/initial estimate, actual
records, completion date/checklist/finish context and prior events are exact.
Existing formats open/export without rewriting remaining estimates or history.
Do not implement this by zeroing saved values or modifying forecast formulas.

Dependency: pair with the basic evidence-qualification wording in C03 so
zero effective work plus incomplete actual logs does not become a definitive
“under estimate by 10 hours” claim. A formal coverage model is outside C02/C03.

## Small UX or policy improvements — separate decisions

### C03 — qualify optional actual-work comparisons (UX72-002, Medium)

Use “Recorded actual effort” and explicitly state that log completeness is
unknown. Zero recorded hours means no records, not proof of no work.
Comparisons may show the recorded arithmetic, but must not claim a definitive
overrun/underrun or a reliable final effort total without complete actuals.
Hide or qualify the conclusion in table/chart/detail locations consistently.

Acceptance: no-log and partial-log examples explain their evidence limit;
remaining estimates/status/forecast are usable with no logging; existing
positive-hour records and arithmetic remain exact. No mandatory logging,
guessed hours, coverage flag or format migration in this bounded copy/display
change. A persisted coverage-attestation feature would need a new scope.

### C04 — seed new-task remaining effort (UX72-001, Medium policy decision)

Recommend a one-time initial remaining estimate equal to the entered task
estimate when creating a new task. A duplicate is a new task: recommend
seeding from its copied duration estimate, never copying actual work or
progress history. This deliberately changes the current Unknown default,
which was a valid earlier policy, not a demonstrated data-loss regression.

Acceptance: new 10-hour task starts at 10 remaining; changing its duration
later does not overwrite a reviewed remaining estimate. Explicit zero and
Unknown remain available. Imported/legacy unknown estimates remain Unknown;
do not bulk backfill existing tasks or infer progress. Baselines remain
frozen. Existing remaining-hours storage suffices; no format bump is proposed.
Owner may approve new-task initialization while choosing a different explicit
duplicate policy; record that choice before implementation and tests change.

### C05 — deliberate remaining reassessment on reopening (UX72-003, Medium)

Recommend the existing reopening confirmation include a remaining-work review.
Show the retained prior estimate as a suggestion, require the user to affirm
or revise it (or explicitly select Unknown), and keep the required reason.
Do not silently reactivate a stale estimate or force it to zero.

Acceptance: Complete → any unfinished status goes through the same review;
invalid input/cancel changes neither status nor estimate. Confirmation commits
both decisions together; Complete still contributes zero until confirmation.
Earlier completion/checklist/committed-finish snapshots and actuals remain
unchanged. No fifth status, revised historical event or automatic deduction.
The estimate can use existing storage; retaining a dated estimate history is
a distinct future persistence decision, not promised by this UI review.

### C06 — explicit automatic/fixed As-of choice (QA71-002, Low)

Recommend labelled **Automatic: today's local date** and **Fixed scenario
date** choices, with a date input only for Fixed. Selecting Fixed must pin
the currently displayed date even when it equals today. Selecting Automatic
removes the optional fixed date. Do not depend on changing the input away
and back to select a mode.

Acceptance: existing fixed files open as Fixed and omitted dates as Automatic;
save/export/import preserve the intended mode. Simulated next-day reload
advances only Automatic. Keyboard controls and help text make the distinction
clear. Keep the existing optional `asOfDate` contract and format 5; do not
invent a new persisted mode flag or alter local-date/forecast mathematics.

### C10 — retain task/date context across Gantt scale changes (UX72-007, Low)

Current scale/representation changes reset horizontal position to the start;
Go to selected task recovers context. Recommend retaining the selected-task
or visible-date anchor where practical. This is a navigation improvement,
not a scheduling defect. Existing Go to start remains an explicit reset.

Acceptance: selected ID, calendar mode, resulting dates and saved data remain
unchanged; changing scale preserves an understandable task/date anchor and
Go to selected still works. At axis/viewport boundaries, clamp safely and
document fallback. No new zoom system, persistence, forecast or chart expansion.
May be deferred if the current recovery control is acceptable to the owner.

## Larger enhancements — not automatic WP7.3 scope

### C07 — expand/restore both chart workspaces (UX72-004, Low)

Recommend one bounded application-level expansion behavior shared by Gantt
and Network, with distinct labels **Expand Gantt workspace** / **Expand
Network workspace** and **Restore workspace**. Do not use native browser
fullscreen. Current Expanded/Compressed still mean calendar representation.

Proposed specification:

- Expanded workspace uses available browser content area, retaining a visible
  Restore control, chart toolbar and reachable selected-task details in a
  collapsible dock. Internal content scrolls; do not duplicate the chart or
  create competing selected-task states. No resizable panes in the first scope.
- Restore retains selected ID, representation, scale and overlay choices.
  On restoring unchanged dimensions, retain scroll/world transform; after
  resizing, preserve a task/date or graph-world anchor and clamp as necessary.
  A deliberately different project starts with its normal fresh view.
- Enter/Space operate controls; focus enters the expanded workspace, stays
  usable there, and returns to its trigger on Restore. Esc resolves an inner
  dialog/edit first, then restores the workspace without discarding a draft.
  Reuse completion/reopen/remaining validation gates in the details dock.
- At 1440/1280/780 widths the viewport is used without page overflow; toolbar,
  Restore and details remain reachable. Gantt retains internal scrolling;
  Network keeps keyboard arrows/Home, pointer pan, Fit and zoom. Fit is an
  overview for a long chain, not a promise all 40 labels are readable at once.
- View-only changes preserve complete source JSON/baseline/history and do
  not dirty saved inputs. No Fullscreen API call, data-format change, new
  scheduling algorithm or automatic task edit.

Requires a separately authorized enhancement with focus/draft/resize tests.
Do not bundle it into C01 or C02's corrections.

### C08 — exception-based meeting review view (UX72-005, Medium)

Use the bounded proposal in [STATUS-MEETING-WORKFLOW](STATUS-MEETING-WORKFLOW.md).
Owner first approves period buckets and the minimum columns/interactions.
The first view can derive from existing records without meeting persistence;
previous-meeting estimate history cannot be promised without a separate design.
Depends on agreed C02/C04/C05 semantics. No mandatory per-task actual logging,
daily status reports or new reporting export in this scope. Requires separate
enhancement authorization; an interim manual route already exists.

### C09 — independent dated student health (UX72-006, Medium)

Recommend a nullable, separately persisted student assessment with dated
history, if this capability is approved. Keep Green/Yellow/Red independent
from four-state work status and computed overdue/forecast risk. Missing is
Not reported; never fabricate Green or infer student judgment from the engine.

Acceptance for a later design: conflicting student Green/system warning are
both labelled and inspectable; colors also have text; assessments retain
effective dates and stable task IDs. Old projects get no invented assessments
or history. Baselines and completion events are not rewritten. A new versioned
contract, original-format backup/explicit overwrite rules, malformed-input
atomicity and older-reader behavior must be specified before implementation.
Existing decoders must not silently discard new history under format 5.

This is a storage/history enhancement, not a small badge change. It requires
separate authorization and compatibility review. Contributor names remain
project-local labels; a new badge must not imply verified identities.

## Ordering and owner gate

Recommend C01 and C02 with C03's qualification first, then independently
decide C04/C05/C06. C10 is optional navigation polish. Defer C07/C08/C09 to
explicit enhancement scopes; expanding a chart is not a prerequisite to
correcting hidden task actions. Carry QA71-003's dependency advisory to a
separate tooling decision; WP7.2 does not upgrade dependencies.

The [owner decision sheet](OWNER-REVIEW.md) records each item independently.
Every decision is currently **Pending**. No merge, release tag, deployment,
WP7.3 code correction or WP8 reporting is included.
