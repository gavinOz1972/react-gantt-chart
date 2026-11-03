# WP7.2 usability assessment

**Assessment complete; owner triage pending.** This is a diagnostic package,
not a product implementation. All seven UX areas were assessed through source
inspection, disposable browser workflows and regression evidence. No student
participant sessions were conducted or inferred. The owner's QA71-005 report
is the only new human usability observation supplied to this assessment.

Two UI defects are confirmed: hidden task-action discovery (QA71-005) and
the completed-task remaining display (UX7-006). Forecasting already excludes
Complete tasks correctly. The other findings distinguish UX weaknesses,
new policy decisions and larger enhancements. No scheduling/forecast formula,
data migration, status state machine or production behavior was changed.

## Authority, prerequisites and protected state

User request: implement WP7.2. Requirement reviewed:
`C:\Users\gavin\Downloads\Bugsys_Gantt_WP7_2_Usability_Assessment.docx`,
SHA256 `d37d8766b58ebf0e03a8bc0140fd256021ad6e636522639d4ab2b828776cc889`.
The saved DOCX was read with shared read access because it was open elsewhere;
it was not edited or closed. “Bugsys Gantt Chart” is the requirement title;
the running application still says React Gantt Chart. Renaming it is not in scope.

The document authorizes assessment, documentation, diagnostic evidence and
bounded tests, and explicitly forbids production changes. Those boundaries
were followed. WP7.0 was previously owner-accepted. **WP7.1 owner acceptance
is not recorded and remains an acceptance dependency.** Requesting WP7.2 or
reporting QA71-005 is not treated as acceptance of WP7.1 or of any new candidate.
This dependency is disclosed; it did not prevent useful diagnostic work.

Worktree: `C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization`.
Branch **feature/wp7-stabilization**, initially clean at
`ffd93a57854943d60ecbd66f03c188c110237724` (WP7.1 follow-up).
Application source remains the accepted `af96d3b257ddfdcbc7f26a968401d634d210aef6`.
Main remains `a6a1c32c22a2bf074b161e52d523443602843dd7`.
Protected annotated tags retain these objects/targets:

| Tag | Annotated object | Target |
| --- | --- | --- |
| v1.0-pre-progress | a4157bc84392c770c27111da58d779948b110a56 | abb85011dafc9fb0876953e3132880e025ef65da |
| v1.1-pre-stabilization | 134305f2205eb993ab76672c2d2469d48d91a609 | af96d3b257ddfdcbc7f26a968401d634d210aef6 |

The owner's original checkout is separate; its observed WP6 branch at the
start of this assessment was `1f5208552c8808112c43fdddf1d1b537d856b319`.
That externally updated branch and its requirements were not changed by
this package. No main merge, tag movement, dependency upgrade, deployment or
production edit occurred. [Environment and protection](evidence/environment.json)
records the checked state and requirement identity.

## Method and limits

Reviewed the WP7.1 [assessment](../wp7-1/ASSESSMENT.md),
[findings](../wp7-1/FINDINGS.md), QA artifacts, fixture README and owner route.
Reused its prepared 30/40-task fixtures in new test browser contexts on
**127.0.0.1:4173**, with a server from this worktree. Test save names use
`WP72 DISPOSABLE`; no real owner project was loaded or overwritten. Fixtures
are format 5, M/T/Th/F four-hour committed calendars, with independent
class/homework/team forecast assumptions. See the
[inputs and independent anchors](../../../tests/fixtures/wp71/README.md).

New diagnostics pin clocks where dates matter and test 1440/1280/780×900.
The completion experiment uses simulated Nov 9; the week-passage experiment
uses Nov 9 → Nov 16. `capturedAtUTC` is the real capture time, distinct from
those simulated effective/history dates. The session is Nov 2, 2026 locally;
UTC evidence rolls into Nov 3. This is a 32-logical-processor Windows host,
not a measured student-laptop sample.

Source inspection covers task creation/duplication, raw remaining display,
work summary arithmetic, completion/reopen gates, forecast Complete exclusion,
four statuses, derived health, chart view state and table overflow. Six new
browser diagnostics verify the cross-feature observations. Existing tests
cover the previous lifecycle, dates, migration/backup, forecast states,
independent toggles, keyboard actions and legacy round trips.

Screenshots were visually inspected for the observed states. Browser checks
prove reachability, source invariants and the stated interactions; they do
not measure first-time student comprehension, task success rates, meeting
duration, screen-reader usability or touch/trackpad ergonomics. No invented
participants, think-aloud notes or satisfaction scores are included.

## UX01 — task table and action discovery

Goal: edit, duplicate and manage a task from an obvious control. The native
buttons and stable-ID copy behavior work once reached; keyboard Tab reveals
the action. The 1620 px table clips the Actions column at common widths and
the horizontal-scroll hint appears only at widths no greater than 850 px.
The original automated click tests auto-scrolled to the named button and
therefore did not demonstrate initial discoverability.

QA71-005 remains Medium/confirmed. Compare sticky Actions, menus, overflow
affordances and compact layouts in [UX-FINDINGS](UX-FINDINGS.md#qa71-005).
Recommend sticky visible Duplicate/Actions plus an actual-overflow hint,
preserving familiar native buttons. C01 supplies keyboard/focus/width/data
acceptance criteria. This is a bounded layout correction, not a table redesign.

## UX02 — chart workspaces

Goal: inspect a long schedule/dependency chain while retaining context and
reachable task details. Gantt scrolling, Network pointer/keyboard pan, zoom,
Fit, Go to selected and shared selection exist. In the 40-task diagnostic,
view/tab changes retain Gantt scroll and Network transform. At 1280×900,
the internal Gantt area is 1172×448 and Network 1172×493; legends/toolbars
and lower details consume additional page space.

There is no application-level Expand/Restore control. This is enhancement
UX72-004, not a broken existing control. C07 specifies one bounded behavior
for both charts: use available browser content area, retain toolbar/details,
focus and nested Esc rules, restore selection/zoom/anchors and avoid native
fullscreen. Existing Expanded/Compressed labels mean calendar representation
and must not be confused with workspace expansion. A 40-task deep Network
Fit at about 13.2% scale is an overview; use Go to selected/zoom for details.
Expansion cannot promise readable labels for every node simultaneously.

Evidence: [1280 metrics](evidence/navigation-1280.json),
[Gantt screenshot](evidence/forty-gantt-1280.png),
[Network screenshot](evidence/forty-network-1280.png).

## UX03 — remaining effort and completion consistency

Goal: estimate all unfinished person-hours independently of elapsed time and
optional actual logs. The week-passage test proves stored remaining values
do not decrease automatically. Completion is explicit and preserves criteria,
effective dates, original committed finish and earlier event snapshots.

The new-task policy needs a decision: an entered initial estimate of 10 and
a duplicate of a ten-hour task currently both get Unknown remaining work.
This differs from the requested initial-estimate seed, but matches the earlier
deliberate Unknown default. Recommend one-time initialization only for new
tasks, with no bulk filling of legacy unknowns or later duration-to-remaining
synchronization (UX72-001/C04).

UX7-006 is confirmed. Completing T13 with stored 10 still displays 10 in all
three effort surfaces while the forecast/project total correctly changes
**181 → 171**. This is raw stored/displayed versus effective calculated work,
not evidence for changing forecasting formulas. Reopening with a reason
restores the 10 to effective work (**181**) without requiring reassessment
(UX72-003/C05). Keep the stored estimate/history; recommend zero effective
display and deliberate review on reopening.

With no actual logs, Work & effort shows actual 0, effort at completion 10,
variance 0; a partial two-hour log yields 2/12/+2. That arithmetic describes
recorded data, not proven real effort. Logging completeness has no attestation.
Recommend qualified recorded-data language rather than definitive over/under
conclusions (UX72-002/C03), especially when correcting completed displays.

Evidence: [completion summary](evidence/ux7-006-complete-summary.png),
[work panel](evidence/ux7-006-work-details.png),
[no logs](evidence/ux7-006-logs-false.json),
[partial logs](evidence/ux7-006-logs-true.json),
[creation/time passage](evidence/initialization-and-time.json).

## UX04 — periodic status meetings

Goal: review expected previous-period work, confirm completion, reassess
unfinished work, inspect current tasks/blockers and understand consequences.
The existing table, criteria gates, quick estimates and chart/health views
can support that sequence. They do not provide period buckets, exception
queues, a meeting summary or dated histories of remaining estimates.

The [meeting workflow](STATUS-MEETING-WORKFLOW.md) explicitly separates an
existing manual route from a proposed transient review view. Recommend
exceptions first, current accepted date ranges, previous-period unfinished
carryover, existing status/estimate gates and no compulsory work logs or
narrative for unchanged tasks. Task-by-task navigation may add work, but
its student burden has not been quantified. C08 is a larger enhancement;
saved meeting/estimate histories would require a separate storage design.

## UX05 — student health versus calculated risk

Goal: express student judgment without suppressing an independent warning.
The application already keeps four work statuses separate from computed
health. It has no independent student Green/Yellow/Red assessment or health
history. Do not add colors as work statuses or infer student confidence from
system risk. Status options are captured in both completion diagnostic records.

Recommend a separate optional persisted assessment with effective dates and
dated history, only if C09 is separately approved. Missing is Not reported.
Show “Student Green, Nov 9” and “System Forecast Slip” together, explain that
they differ, and retain both sources. Red does not automatically Block a task;
Complete does not attest actual-log completeness. This requires versioned
data/backup/older-reader design; a superficial badge change is insufficient.

## UX06 — forecast settings and explanation

Goal: make assumptions, date context and comparisons understandable. Valid
capacity/remaining inputs update the forecast immediately, and independent
overlay toggles do not alter saved source data. Existing help distinguishes
person-hours, numbered working slots and calendar-date variance. The
following meanings should remain visible in any later copy refinement:

| Term | Meaning / limit |
| --- | --- |
| Committed finish | Current accepted working-calendar schedule; not automatically replanned by forecast |
| Baseline finish | Frozen originally approved schedule, matched by immutable task ID |
| FF / forecast finish | Approximate calendar-date projection from remaining work and uniform shared capacity; Complete uses effective completion |
| Task Forecast Slip | Forecast later than that task's committed finish |
| Project At Risk | Complete project projection exceeds target; a task slip can coexist with project On Track |
| Partial | Some forecast inputs/paths are missing or indeterminate; known subtotals are not a definitive delivery forecast |
| Uncertain / Indeterminate | A delivery verdict/path is not confidently determined, for example missing estimates or blocked dependencies |
| Unavailable | Projection cannot be supplied, for example invalid assumptions or no usable capacity; no confident endpoint should be inferred |
| Forecast: Complete | Inputs/projection are complete, not that all tasks have work status Complete |
| Remaining Effort | All unfinished person-hours; blank is Unknown, zero is an explicit estimate and does not complete a task |

QA71-002 remains an ambiguity: unchanged-value entry can leave automatic
today active. Recommend Automatic/Fixed controls that pin today deliberately
without a date-change trick (C06), preserving omitted `asOfDate` for Auto
and an explicit date for Fixed. Existing date-mode and clarity/forecast tests
were rerun, including Partial/Uncertain/Unavailable and project/task distinctions.
No new model, daily effort deduction or persistence mode flag is proposed.

## UX07 — large-project navigation and responsiveness

Goal: reach a task, read its full name/context and return without losing work.
With 40 tasks and the selected long-label T35, the 1440/1280/780 diagnostics
retain selected ID, Gantt view/tab scroll, and Network transform, while
keyboard arrows pan and Enter selects. Full task names remain available in
accessible labels and selected details even when row/node labels truncate.
All view-only operations preserve complete source JSON/baseline.

Scale/representation changes explicitly reset horizontal position to zero;
Go to selected recovers the task. This is a Low navigation weakness
(UX72-007), not source loss. Recommend optional selected-task/date anchor
retention (C10). The earlier 40-task isolated timing observations remain
useful context, not a new laptop benchmark: [WP7.1 performance](../wp7-1/ASSESSMENT.md#performance-observations-and-recovery-limits).
No new freeze was observed in the full suite. Prefer a future short human
route to judge whether recovery controls and label details are discoverable;
do not convert these automated results into human success claims.

## Verification, deviations and handoff

Windows x64; Node v24.19.0, npm 11.17.0, Playwright 1.64.1 / Chromium
156.0.8078.4, Vitest 5.0.5, Vite 8.3.5. New contexts explicitly use
America/Regina. Existing regression checks also cover narrower layouts.
Exact commands from this worktree:

```powershell
npm.cmd run test:e2e -- tests/wp72/usability-diagnostics.spec.ts --workers=3
node node_modules/@playwright/test/cli.js test tests/wp72/usability-diagnostics.spec.ts --grep UX7-006 --workers=2
npm.cmd run test:e2e -- tests/wp72/usability-diagnostics.spec.ts --workers=3
npm.cmd run check
npm.cmd run test:e2e -- --workers=3
npm.cmd run lint
```

| Result | Evidence |
| --- | --- |
| Six bounded new diagnostic cases passed in the focused rerun | [diagnostics](evidence/diagnostics.txt) |
| Lint/typecheck, **411 tests / 32 files**, build **63 modules** passed, exit 0 | [check](evidence/check.txt) |
| Full browser suite **143 passed, 0 failed/skipped**, exit 0: prior137 + new6 | [all browsers](evidence/browsers.txt) |
| Final lint on the diagnostic source passed | [lint](evidence/lint.txt) |
| Application/dependencies/configuration and protected references unchanged | [environment/protection](evidence/environment.json) |

The first diagnostic authoring run had four passes and two locator timeouts
(test used “Reopen reason”; actual label is “Reopening reason”). A second
attempt exposed an ambiguous unscoped Reopen button. Both were corrected
only in the test locator, keeping product assertions. Subsequent six-case
rerun passed; final all-suite run additionally checks UI forecast totals and
scale/representation anchor observations. No product failure was suppressed.
Only `tests/wp72/usability-diagnostics.spec.ts` was added; dependencies,
configuration and production tests were not changed. Historical screenshots
and WP7.1 evidence regenerated during regressions were restored to retain
their original records; new WP7.2 captures are kept here.

Delivered: this assessment, [findings](UX-FINDINGS.md),
[meeting workflow](STATUS-MEETING-WORKFLOW.md),
[bounded candidate backlog](WP7-3-CANDIDATES.md) and
[independent owner decisions](OWNER-REVIEW.md), plus diagnostic evidence.
Recommendations are not owner-approved yet. Stop here: WP7.3 corrections,
expanded views, new persistence/health reporting and WP8 require their own
authorization. No implementation or release work has started.
