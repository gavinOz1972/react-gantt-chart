# Usability findings and owner decisions

Assessed 2026-11-02 locally (America/Regina; some evidence timestamps are
Nov 3 UTC). Application source is the protected `af96d3b` release candidate;
QA branch started at `ffd93a57854943d60ecbd66f03c188c110237724`. No production
behavior was changed. Default reproduction uses the WP7.1 format-5 prepared
30/40-task fixtures and Chromium 156.0.8078.4. Details are in
[UX-ASSESSMENT](UX-ASSESSMENT.md).

Every recommendation is **Pending owner decision**. “Confirmed” describes
observed behavior, not authorization to fix it. There are two confirmed UI
defects, four UX weaknesses, two policy/owner decisions and two enhancements.
No screen-reader study or new-student participant session was performed;
keyboard reachability does not establish comprehensive accessibility.

## QA71-005

**Medium — confirmed defect: task-action discovery. UX01. Candidate C01.**

Goal: find and duplicate a task without guessing at hidden controls. Import
`student-30-prepared.json`, inspect the initial table at 1440/1280/780×900,
then horizontally scroll right or Tab through its first row. Duplicate is
outside the initial clipped viewport at all three widths; the hint is hidden
above 850 px. Scrolling/eleven Tabs from the table reveals it and activation
creates a new stable ID without mutating originals or baseline. Expected:
obvious task actions. Impact: functioning capability appears absent.

Evidence: [WP7.1 diagnosis](../wp7-1/FINDINGS.md#qa71-005--duplicate-action-initially-offscreen-without-a-desktop-scroll-hint),
[initial desktop](../wp7-1/evidence/qa71-005-pointer-initial.png),
[revealed desktop](../wp7-1/evidence/qa71-005-pointer-revealed.png),
[keyboard geometry](../wp7-1/evidence/qa71-005-keyboard-1280.json).
The six existing access tests were rerun in the complete WP7.2 suite.

| Option | Benefit | Cost / accessibility consideration |
| --- | --- | --- |
| Sticky Actions with visible Duplicate | Direct, familiar native controls; no extra menu step | Reserves width; sticky cells/header must not obscure focused content |
| Per-row Actions menu | Compact action group | Trigger must itself stay visible; adds menu keyboard/Esc/focus behavior and hides Duplicate behind a step |
| Improved overflow hint/scroll affordance | Small change, makes horizontal scrolling explicit | Still makes users move away from task identity to find actions |
| Compact/optional columns | Can reduce overflow | Risks hiding important status/remaining/date information; not sufficient at every width |

Recommendation: sticky Actions with a visible Duplicate button and a hint
based on measured overflow. Acceptance: all actions visible/reachable at
the three widths and scroll extremes; no focus occlusion; safe IDs,
dependencies and no copied work/history. No persistence change. Deferred
to WP7.3 as already requested; final UI approach awaits owner approval.

## UX7-006

**Medium — confirmed defect: Complete displays unfinished effort. UX03. C02.**

Steps: import the prepared 30-task fixture; select T13 (estimate/remaining
10 h); add a criterion, mark Complete for Nov 9 and attest the criterion.
Observe the table, selected chart summary, Work & effort and Project health.
Repeat with no actual work entries and with a partial 2-hour work entry.

Expected: Complete has zero **effective unfinished work**, with original
estimates, actuals and snapshots retained. Actual in both cases: table,
selected summary and work details still display **10 h Remaining Effort**;
stored `workTracking.remainingHours.T13` stays 10. Forecast correctly excludes
T13: known project work is **181 → 171** and its reason states zero future
effort. This is a display/read-model inconsistency, not a demonstrated
forecast allocation defect. Impact: students cannot reconcile Complete,
remaining work and forecast consequences.

Root evidence: `App.tsx` passes raw `remainingValue` to both quick fields;
`effortSummary` reads the stored map without task status. `forecastSchedule`
assigns zero cost to Complete tasks and health totals exclude them. No
engine correction is indicated.

Evidence: [Complete summary](evidence/ux7-006-complete-summary.png),
[work details](evidence/ux7-006-work-details.png),
[no-log state/snapshots](evidence/ux7-006-logs-false.json),
[partial-log state](evidence/ux7-006-logs-true.json).
Completion/reopen tests assert baseline, task estimates, recorded work and
the earlier completion event unchanged.

Recommendation/criteria: display effective zero consistently, separately
label any retained stored estimate and avoid editable unfinished work while
Complete. Do not zero stored values, rewrite historical events or change
forecasting. Test stored 10/0/Unknown and old Complete files. Existing formats
can remain unchanged for a read-only presentation correction. Coordinate
with C03 so incomplete actual logs do not imply a definitive effort saving.

## UX72-001

**Medium — owner decision/policy gap: initial remaining estimate. UX03. C04.**

Steps: on the prepared fixture create T31 with entered estimate 10, then
duplicate ten-hour T13 as T32. Expected under WP7.2's proposed semantics:
initial estimate seeds remaining unfinished work. Actual: both new tasks
show Unknown and have no known remaining value, while their durations are 10.
Forecast appropriately treats missing estimates as Partial; no estimate was
lost in serialization. Evidence: [initialization and time](evidence/initialization-and-time.json),
`App.tsx`'s `saveTask`/`copyTask` and `remainingValue`.

This is a change from the earlier deliberate Unknown default, not proof of
an unintended regression. Impact: another estimate-entry step for each new
task, or a Partial projection until students supply it.

Recommend one-time seeding on new-task creation; independently decide the
duplicate policy (recommended: its copied duration, never the source's work
history). Criteria: 10 starts at 10; later duration edits never overwrite a
reviewed remaining estimate; blank/zero remain explicit options. No backfill
of existing/legacy Unknowns and no reinterpretation of saved history. Uses
the existing map; no schema change is required for new creations only.

## UX72-002

**Medium — UX weakness: optional logs look like definitive variance. UX03. C03.**

Steps: use the UX7-006 cases and inspect Actual effort, Effort at completion
and Effort variance. No-log case displays **0 / 10 / 0 h**; partial 2-hour
case displays **2 / 12 / +2 h**. Arithmetic is actual records plus stored
remaining versus baseline, but there is no attestation that records cover
all performed work. Expected: clearly qualified evidence, not an unqualified
conclusion about real total effort. Impact: zero recorded work may be read
as no work, and incomplete logs may suggest unjustified over/underperformance.
The screenshots/JSON under UX7-006 are the evidence.

Recommend “Recorded actual effort” and explicit completeness-unknown wording;
qualify/suppress definitive variance and final-effort conclusions. Completion
does not prove logging completeness. Criteria: zero/partial logs do not
produce a definitive saving/overrun claim; optional logging remains optional;
stored records/arithmetic/baseline remain exact. A display-only correction
requires no format change. Persisted coverage attestation would be a separate
enhancement and migration decision, not silently added by C03.

## UX72-003

**Medium — UX weakness/policy decision: reopening reuses stale remaining. UX03. C05.**

Steps: reopen the completed T13 to In Progress with a valid reason. Expected
under the proposed workflow: deliberate reassessment of unfinished work.
Actual: the reason is required, but no remaining-work review is required;
stored 10 returns to forecast work and project total becomes **181** again.
Work and the earlier completion snapshot stay unchanged. Evidence:
[no-log completion/reopen](evidence/ux7-006-logs-false.json) and
[partial-log completion/reopen](evidence/ux7-006-logs-true.json).

This is safe retention under the current policy, but a stale estimate can
re-enter a meeting's projection without explicit review. Recommend a reason
plus remaining-work review in the existing reopen gate, with the old value
only a suggestion. Criteria: affirm/revise/explicitly Unknown; invalid/cancel
commits neither decision; all entry points preserve the four statuses and
historical snapshots. Existing remaining storage suffices; dated estimate
history is not present and must not be implied without a separate design.

## QA71-002

**Low — UX weakness: fixed date equal to today is ambiguous. UX06. C06.**

Steps: choose Use today automatically; re-enter its unchanged displayed date;
save/export. Actual: optional `asOfDate` remains omitted and follows local
today, despite a user's possible intention to pin it. Changing away and back
pins it. Expected: an explicit automatic/fixed choice independent of a date
input change event. Impact: a scenario can move on the next day unexpectedly.
Evidence: [date-mode experiment](../wp7-1/evidence/as-of-date-modes.json),
WP7.1 date-sensitive setup diagnosis and the rerun date-mode test.

Recommend Automatic versus Fixed controls; selecting Fixed pins the visible
date even if equal to today. Criteria: next-day reload advances only Auto;
existing fixed/omitted files map correctly; keyboard/help text expose mode.
Retain the optional-date format contract and no new persisted flag. No
formula, local-date or history changes. Owner decision remains Pending.

## UX72-004

**Low — enhancement: expand/restore chart workspace. UX02. C07.**

Steps: open the 40-task fixture at 1440/1280/780×900 and inspect chart controls,
scrolling and lower details. There is no application Expand/Restore control;
Expanded currently means calendar representation. At 1280 the Gantt scroll
area is **1172×448**, Network **1172×493**; toolbar/legends/details consume
additional page space. A request to enlarge this is not an existing control
failure. Evidence: [navigation metrics](evidence/navigation-1280.json),
[Gantt](evidence/forty-gantt-1280.png), [Network](evidence/forty-network-1280.png).

Recommend application-level expansion for both charts with controls and
reachable details, no native browser fullscreen. Bounded criteria for focus,
Esc/inner edits, Restore, selection/zoom/scroll and viewport changes are in
[C07](WP7-3-CANDIDATES.md). Current Fit on a 40-task deep chain is an overview
(about 13.2% scale at 1280), so expansion alone will not make every node label
readable. Keep Zoom/Go to selected/Fit. No storage change; separate enhancement
authorization is needed before any view implementation.

## UX72-005

**Medium — enhancement: concise exception-based meeting view. UX04. C08.**

Reproduce the existing manual route in [STATUS-MEETING-WORKFLOW](STATUS-MEETING-WORKFLOW.md):
inspect period dates, select tasks, confirm criteria, update remaining,
review blockers and forecast. Current capabilities work but there is no
review-period queue/filter or meeting summary. Expected is a proposed concise
review, not a currently promised screen. Impact: repeated selection and manual
date inspection; the amount of student burden has not been measured with humans.

Evidence: full lifecycle/browser results, 30/40-task navigation metrics,
and `App.tsx`'s task-order/selection UI. Recommend a transient exception-first
view with visible period/As-of, current accepted dates and existing edit gates.
Criteria: overdue carryover retained, optional actual logs, no notes required
for unchanged tasks, no data mutation by filters, no invented historical
meeting estimates. First view need not change storage; saved meeting/estimate
history would require separately authorized persistence work.

## UX72-006

**Medium — owner decision/new data capability: student-reported health. UX05. C09.**

Inspect the current status dropdown and project schema. The four statuses
are exactly Not Started/In Progress/Blocked/Complete; risk labels are derived
from dates/capacity/status. No independent student Green/Yellow/Red field or
dated health history exists. Evidence: `statuses` in both completion records,
`TaskProgress`/`ProgressTracking`, and `healthPresentation` source inspection.
This is a requested new capability, not an absent fifth work status.

Recommend a separate optional persisted assessment and dated history **only
after authorization**, with Not reported for missing data. Criteria: student
Green and system warning can disagree visibly with dates/text; neither
overrides the other; Red does not imply Blocked; Complete remains a deliberate
status decision. Old files gain no invented assessments. A new versioned
contract and backup/compatibility policy are required before implementation;
do not append droppable fields to format 5 or rewrite status/completion history.

## UX72-007

**Low — UX weakness: changing scale/mode loses horizontal context. UX07. C10.**

Steps: on the 40-task file select T35 and Go to selected task; switch Hour
to Day, recenter, then change to Compressed. Actual at 1280: initial left
**8460**, then **0** after each change; selected T35 and vertical top **1704**
remain. Go to selected task restores context. View/tab round trips otherwise
preserve Gantt scroll and Network transform. Expected improvement: keep the
selected-task/date anchor when practical, rather than requiring recentering.
Evidence: [1280](evidence/navigation-1280.json),
[1440](evidence/navigation-1440.json), [780](evidence/navigation-780.json),
`GanttChart.tsx`'s explicit `resetScroll` calls.

Impact is extra navigation, not data loss; no human latency/preference result
is inferred. Recommend optional anchor retention with safe boundary clamping
and existing Go to start. Criteria: no schedule/status/file changes, preserved
selected ID, documented resize/axis fallback and retained keyboard navigation.
No migration or new zoom algorithm; may be deferred independently of expansion.

## Priorities and limits

Recommend C01 and C02/C03 first, then decide initialization/reopen/date-mode
policies. Larger views and persisted student health remain separate scopes.
All acceptance criteria live in [WP7-3-CANDIDATES](WP7-3-CANDIDATES.md), and
all item-level owner choices are in [OWNER-REVIEW](OWNER-REVIEW.md).

Positive results are not hidden: remaining effort does not decrement with
calendar time; actual logs are optional; the forecast already excludes
Complete; IDs, baseline and completion snapshots remain unchanged; keyboard
pan/selection and view/tab restoration work at tested widths. No new freeze,
serialization or scheduling-formula defect was demonstrated. Screen-reader,
touch-device and real-student comprehension testing remain unperformed.
