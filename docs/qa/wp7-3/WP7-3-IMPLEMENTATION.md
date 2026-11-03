# WP7.3 progress consistency and usability corrections

**C01–C06 implemented; ready for owner review.** Authorization is the user's
implementation request and the owner-approved November 2, 2026 requirement
`React_Gantt_WP7_Progress_Consistency_and_Usability_Corrections.docx` in the
original checkout's `docs/WP_Req/`. Its SHA256 is
`138832e6a234c40bbaee8ecebf1271a05245f01ca8a744f4d6253c417c0c46ec`.
The document was read, not edited. The application title remains unchanged.

Work is on **feature/wp7-stabilization**, initially clean at
`3dc291ec556aa0fbd1fae38e2fc9f1ba6acf0308`; that WP7.2 commit was verified
as an ancestor before code changes. WP7.1 assessment, findings, runbook and
regression evidence and all four requested WP7.2 assessment/backlog/workflow
documents were reviewed. **WP7.1 owner verification remains outstanding.**
The new scope approval does not mark it accepted, nor does it approve C07–C10.

## Implemented corrections

| Item | Result | Relevant production files |
| --- | --- | --- |
| C01 / QA71-005 | Sticky right Actions header/cells keep Duplicate, Edit form and Delete visible. Overflow help follows measured table/viewport widths. Focus scrolling accounts for the pinned column. | `src/components/TaskTable.tsx`, `src/styles/global.css` |
| C02 / UX7-006 | Complete displays zero effective remaining in table, selected chart summary and work details; ordinary remaining edits are disabled. The prior stored estimate remains separately labelled for reopening. | `src/App.tsx`, `src/components/TaskWorkPanel.tsx`, `src/workTracking/workTracking.ts` |
| C03 | Recorded actual effort is labelled; no entries show “Not recorded — 0 hours logged”. Recorded-data comparisons disclose incomplete coverage. With no work records, effort-total/variance conclusions are unavailable. | `src/App.tsx`, `src/components/TaskWorkPanel.tsx` |
| C04 | A newly saved task gets one-time remaining effort equal to its entered estimate. A copy gets its copied planning duration as its own initial remaining value; actual work and status history remain uncopied. | `src/App.tsx` |
| C05 | Reopening requires a reason and explicit confirm/revise/Unknown choice. Validation occurs before either progress or remaining state is changed. | `src/components/progress/StatusTransitionDialog.tsx`, `src/App.tsx` |
| C06 / QA71-002 | Automatic/Fixed radio controls make date intent explicit. Fixed can pin today without changing the input. Automatic date refreshes across local midnight and when the tab regains focus/visibility. | `src/components/forecast/ForecastSettingsForm.tsx`, `src/components/progress/useLocalDate.ts`, `src/App.tsx` |

### Stored values versus effective work

`workTracking.remainingHours` is retained when a task is completed. A raw
10, 0 or Unknown therefore still round-trips exactly. Only its effective
unfinished work becomes zero. `effortSummary` accepts the Complete context
for presentation; the forecast's existing Complete exclusion is unchanged.
Retained values are explicitly not represented as dated historical estimates.
Historical completion dates, checklist attestations, committed-finish context,
events and original baseline/estimates are not recalculated or rewritten.
Actual work records remain editable through their existing deliberate controls.

Recorded arithmetic still adds recorded actual hours and effective remaining
work and compares with a matching baseline estimate, where available. A
partial two-hour record on a Complete baseline-ten task can show 2 and -8,
but both labels and adjacent explanation qualify those as recorded data,
not verified total effort or proven savings. No persisted completeness field
or fabricated work was added; recording work remains optional.

### Creation and reopening decisions

For COMP 214's simplified initial assumption, a new ten-working-hour task
starts with ten remaining person-hours. Changing scheduled duration later
does not resynchronize remaining work. A duplicate uses its copied duration
as its new initial estimate, even when its source's reviewed remaining value
differs. Existing tasks, explicit Unknowns and legacy imports are not backfilled.

Reopening presents the retained value only as a suggestion. Confirm supports
zero; an Unknown prior value cannot be confirmed as a known amount. Revised
input uses existing decimal/range validation and must not be blank; Unknown
has its own explicit choice. Invalid input or cancellation keeps Complete and
the stored value intact. After both progress and effort validation succeed,
React commits both state updates together. Reopening to In Progress, Not
Started or Blocked uses the same gate from table, chart and details. The
existing required reason, four-status state machine and historical event
structure remain intact. No historical estimate record is invented.

### Date mode and layout decisions

Automatic persists by omitting `asOfDate`; Fixed persists the explicit date.
The UI's mode field is not serialized. Existing explicit-date files open
Fixed; absent dates open Automatic. Clearing an invalid fixed date blocks
saving until corrected/reverted. Local-day refresh calls the existing
`localDate()` helper; it changes the current clock input, not forecast math.
Fixed scenarios do not move when the local day changes. Date refresh does
not make source inputs dirty or save projects automatically.

Actions keep their existing native buttons rather than introducing a menu.
Horizontal scrolling remains necessary for other columns. The page has a
bounded width, so even a 2200 px screen can still have table overflow; the
hint correctly remains shown in that measured case. No columns were removed.
Focused controls are scrolled into the area outside the pinned Actions cell.

## Scope, preservation and limitations

No changes to `src/domain/`, `src/forecast/`, `src/progress/taskProgress.ts`,
`src/persistence/`, package/lock files or application configuration. Current
files remain format 5; formats 1–4 retain existing original-backup and explicit
overwrite behavior. No file migration, engine/critical-path/resource-scheduling
change, automatic effort deduction or mandatory logging was introduced.

C07 expanded workspaces, C08 meeting screen, C09 student health/history,
C10 chart-position changes, WP8 and release/deployment work are excluded.
The prior tooling advisory QA71-003 was not addressed by a dependency upgrade.
No new confirmed issue remains in C01–C06 after automated verification;
owner validation is pending and no student participant study is claimed.

The original owner checkout/data and server were not changed. Main and both
protected tag objects/targets retain their earlier values; see
[verification](WP7-3-VERIFICATION.md). The working diff was reviewed for unrelated
changes. Generated historical screenshots/assessment captures were restored;
new evidence is kept under this package. Existing tests were adapted only
where C02–C06 intentionally change expectations, retaining invariant checks.

Run the [15–20 minute owner procedure](WP7-3-OWNER-RUNBOOK.md), review
[verification evidence](WP7-3-VERIFICATION.md) and
[user-visible changes](WP7-3-CHANGELOG.md), then explicitly accept WP7.3 or
report reproducible remaining issues. No merge, new tag or next package is included.
