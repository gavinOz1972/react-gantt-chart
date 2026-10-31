# Critical path and working-hour slack

## API

```ts
import { calculateSchedule, analyzeCriticalPath } from './domain'

const schedule = calculateSchedule(project, tasks)
const analysis = analyzeCriticalPath(project, tasks, schedule)
// Or analyzeCriticalPath(project, tasks), which obtains the WP1 result itself.
if (analysis.ok) {
  // analysis.tasks: TaskCriticalAnalysis[]
  // analysis.relationships: { key, predecessorId, successorId, critical }[]
  // analysis.topologicalTaskIds; analysis.projectCompletion
} else {
  // Structured errors; no partial analysis tasks or slack.
}
```

The optional third argument must be the current WP1 result for the same project
and tasks. Basic consistency checks reject missing IDs, duration/relationship
mismatches, invalid precedence, completion mismatches and violated root releases.
This parameter avoids a duplicate forward schedule in App; it is not a raw JSON
validation boundary. Persistence validates source records and recalculates WP1
before calling this API.

Each task exposes taskId, durationHours, earliestStart, earliestFinish, latestStart,
latestFinish, totalSlackHours and critical. Earliest boundaries are the scheduled
boundaries from WP1. Independent roots additionally expose releaseStart; all tasks
have releaseDelayHours, which is zero except for delayed independent roots.

Results use canonical ID order and new objects. Input arrays, estimates, manual
dates and the supplied schedule are unchanged. An empty valid project yields no
analysis tasks/relationships and null completion. Invalid WP1 results propagate
their errors. ANALYSIS_INPUT_MISMATCH requests a current coherent WP1 result;
ANALYSIS_RANGE_OVERFLOW reports a slack/release count beyond safe whole-hour output.
Calendar/date range errors retain the existing WP1 codes.

## Convention and algorithm

The deadline is the engine's present maximum exclusive finish, not targetEndDate.
Every start and finish maps to an integer working-slot coordinate using the same
selected weekdays, daily hours and Gregorian date-only ordinals as WP1.
createWorkingTimeIndex uses BigInt internally, so large absolute date coordinates
do not introduce floating-point rounding. Inverse mapping converts latest slot
indices back into valid working dates and numbered hours.

The forward pass is the existing WP1 result. In reverse topological order:

```text
LF(task) = minimum LS(successor), or calculated completion for a sink
LS(task) = LF(task) - durationHours
totalSlackHours(task) = LS(task) - scheduledStartIndex(task)
critical(task) = totalSlackHours(task) == 0
```

A critical relationship joins two critical tasks and has predecessor finish equal
to successor start in working-slot coordinates. This marks the union of all
controlling critical chains, including equal parallel paths; it does not enumerate
an exponential list of path combinations. An earlier noncontrolling edge into a
join is not critical merely because both its nodes happen to be critical elsewhere.

Zero total slack means the task cannot be postponed by one available working slot
without moving the present completion, subject to the current independent release
constraints. Latest dates are hypothetical allowable delayed boundaries, not edits
to source task modes/dates. There is no resource contention model.

## Manual roots and retained dates

An independent DEFAULT root is released at the first available project-start slot.
An independent MANUAL root is released at the first available slot on or after
its requested date. That is a lower bound, not an immovable latest-start deadline.
Latest starts never precede the release because they cannot precede its scheduled
earliest start. A retained MANUAL date on a dependent task stays inactive, exactly
as in WP1; it becomes relevant only after the final predecessor is removed.

releaseDelayHours counts available working slots from the project's first slot to
the effective root release. It is waiting before availability, not effort and not
calendar-day subtraction. Example: Monday/Thursday, two hours/day, project start
2026-11-02, a one-hour MANUAL root released 2026-11-12. Its release delay is six
working slots and effort is one hour. An unrelated one-hour default root can have
six hours of slack. If both feed a one-hour join, the manual root and join are
critical while the earlier predecessor still has six hours of slack.

The earlier-date REJECT defaults approved in WP1 still apply. Targets remain
feasibility information. UI highlights and network labels consume this analysis;
they do not implement backward arithmetic themselves.

## Verification and limits

Tests cover chains, unequal/equal branches, delayed releases with and without a
join, inactive retained dates, target invariance, skipped-day slack, live estimates,
ordering, frozen inputs, stale results, empty/invalid graphs and precision limits.
Working-index inverse checks agree with WP1 advancement across calendar selections,
leap/century/year transitions, DST dates and supported date endpoints.

Output slack/release counts must fit safe JavaScript integers; larger counts return
an error rather than rounded values. Dates remain within WP1's 0001-9999 range.
No critical-path rule consumes React, browser storage, clock time or display mode.
