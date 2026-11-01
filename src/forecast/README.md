# Effort-based schedule forecast (WP6.4)

`forecastSchedule` is pure and separate from WP1. Its input has no actual-work
logs: historical hours cannot grant future capacity. It consumes current accepted
plan inputs, explicit remaining estimates, status/history, manual order, optional
baseline and optional forecast settings. Current schedule and baseline stay intact.

## Capacity and dates

Weekly person-hours = `(classHoursPerStudent + homeworkHoursPerStudent) * teamSize`.
Both hour inputs have at most two decimals (0–1,000,000); team size is an integer
1–10,000. Negative/nonfinite values, unsupported settings versions and malformed
Gregorian dates fail validation before an import/save changes the open project.
Missing settings mean Disabled, including legacy files. Enabling deliberately
starts with zero hours and one member; no positive availability is fabricated.
An omitted As-of follows today's local date, passed explicitly to the pure engine.

Capacity is uniform over seven calendar days, including weekends, without a
claim that any specific person is available. Through-target capacity includes
**both endpoint dates**: `max(0, targetOrdinal - asOfOrdinal + 1) / 7 * weekly`.
For example 2026-11-02 through 2026-12-13 is 42 days, six weeks; 3+5 hours × four
people is 32 weekly and 192 through that target. The target date itself has one
day's capacity; an As-of after target has none. Display rounds to two decimals;
allocation never rounds daily capacity away.

The engine uses integer 1/700-hour units: a task costs `remainingHundredths * 7`,
and a daily budget is `weeklyHundredths`. Consecutive equivalent daily allocations
are batched arithmetically instead of looping millions of dates for tiny capacity.
Start/finish positions are exclusive continuous offsets from As-of. A positive
task ending exactly at a day boundary displays the last occupied date, not the
following morning. A zero-effort unfinished task uses that predecessor boundary
without spending capacity or becoming Complete. Supported dates end at 9999-12-31;
numeric/date limits produce Unavailable, never a hang or overflowed date.

## Allocation and uncertainty

Complete tasks cost zero and satisfy successor dependencies immediately, even
if they retain a previous remaining estimate or unfinished predecessors. Every
other task needs an explicit remaining estimate. Missing/null estimates remain
unknown, not zero. Blocked tasks have no invented restart date. Their unfinished
descendants are indeterminate; a completed descendant breaks that propagation.

Eligible tasks receive one shared capacity pool, ordered by current committed
finish boundary (date then occupied hour), then saved manual order, then code-point
task ID. A successor receives only capacity after its predecessor's exclusive
finish, including any residual capacity that day. No capacity is spent twice.
Known independent branches may project while another branch is indeterminate,
but the project is Partial and has no definitive finish or feasibility verdict.
Known totals include blocked tasks with estimates; the surplus is labelled as
known-work-only when incomplete. Zero capacity and supported-range limits make
projected dates unavailable. Actual effort does not enter this simulation.

## Indicators and persistence

Non-Complete + As-of after committed finish = Late (including uncertain forecasts).
On the committed finish date itself the task is not Late. Otherwise a later
forecast finish = At Risk, an unavailable forecast = Uncertain, and a finish on
or before the commitment = On Schedule. Blocked is a separate deliberate status.
Effort variance does not directly set any schedule indicator.

New completion decisions capture `committedFinishDateAtCompletion` from accepted
WP1 results in the same event as the effective completion date. Completed Late
compares those historical dates, so later edits cannot erase it. Legacy completed
events without that snapshot show **Completion timing unavailable**, rather than
inventing a historical commitment. Reopening retains the event; a subsequent
completion captures its own context. Completion criteria remain unchanged.

Project format 5 optionally stores version-1 `forecastSettings` and optional
As-of. Calculated projections are never persisted. Formats 1–4 still read without
settings; original-format backups and explicit migration confirmation remain.
Invalid input drafts suppress the forecast and block Save/Export until corrected
or reverted. Valid capacity changes update immediately. No automatic re-baseline,
committed-date replanning, bar overlays, individual assignment/concurrency model,
resource calendar, overtime editor or probabilistic forecast is provided.
