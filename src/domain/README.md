# Scheduling engine

Import calculateSchedule and its types from src/domain/index.ts. This pure
TypeScript module has no React, DOM, clock, time-zone, or external library
dependency. Recalculate from source inputs after any edit. Independent tasks
can overlap fully; there is no shared labour capacity or resource leveling.
The UI is unchanged in WP1.

## API and contracts

```ts
import { calculateSchedule } from './domain'
import type { ProjectSettings, TaskInput } from './domain'

const project: ProjectSettings = {
  projectId: 'P1', name: 'Semester project',
  projectStartDate: '2026-11-02', targetEndDate: '2026-12-31',
  workingWeekdays: [1, 4], workingHoursPerDay: 2,
}
const tasks: TaskInput[] = [
  { taskId: 'T1', name: 'Research', description: '', durationHours: 3,
    predecessorTaskIds: [], independentStartMode: 'DEFAULT' },
  { taskId: 'T2', name: 'Draft', description: '', durationHours: 1,
    predecessorTaskIds: ['T1'], independentStartMode: 'DEFAULT' },
]
const result = calculateSchedule(project, tasks)
if (result.ok) {
  // T1 starts { date: '2026-11-02', hour: 1 }
  // T1 finishes { date: '2026-11-05', afterHour: 1 }
  // T2 starts { date: '2026-11-05', hour: 2 }
  // result.projectCompletion = { date: '2026-11-05', afterHour: 2 }
} else {
  // result.errors: { code, field, message, taskId?, relatedTaskIds? }[]
}
```

Contracts live in src/types/scheduling.ts. Inputs are readonly. Task IDs are stable
nonempty strings (typically T1, T2, ...), never array positions or renumbered.
Tasks have a nonempty name, string description, positive safe-integer durationHours,
predecessor IDs, and independentStartMode. MANUAL requires requestedStartDate;
DEFAULT has no requested date. Retain MANUAL fields when adding dependencies.
Weekdays use Sunday=0 through Saturday=6 without duplicates. Daily hours must
also be positive safe integers. Hours are ordinal work slots, not clock times.

Success contains tasks sorted by case-sensitive code-point ID order and
projectCompletion. Predecessor IDs are also sorted in output. Each task exposes
startSlot, finishBoundary, startDate, finishDate, and copied predecessor IDs.
Completion is the maximum task finish. An empty valid project returns
{ ok: true, tasks: [], projectCompletion: null }.

An error contains only { ok: false, errors }, without partial task dates or
completion. Callers supply structurally typed project/task objects; the engine
validates their field values, calendar, dates, and graph before scheduling.
It does not parse arbitrary JSON documents or mutate source objects.

## Start and finish conventions

Dates are strict Gregorian YYYY-MM-DD, within 0001-01-01 through 9999-12-31.
Arithmetic uses integer ordinals, never milliseconds or the local time zone.
Whole working weeks are skipped in bulk for long durations.

A start slot { date, hour: 1 } occupies the first working hour of that date.
A finish { date, afterHour: 2 } is the exclusive boundary immediately after
working hour 2. A successor starts at hour 3 on that date if the calendar permits;
otherwise it starts at hour 1 on the next selected weekday. A day-end finish
retains the last occupied date, so finishDate is not the successor's next working
date. No wall-clock start time is assumed.

DEFAULT independent tasks start at the first working slot on or after project
start. MANUAL independent tasks use their requested date, advanced if nonworking.
Dependent tasks wait for the latest-finishing predecessor. Their independent
start fields remain intact but inactive while dependencies exist. Removing the
final link restores those retained fields. A link edit changes the caller's input
array followed by recalculation; no task is deleted. Targets never constrain or
shorten schedules.

## Owner decisions

WP1 leaves two policies unresolved. With no explicit option, encountering either
case returns POLICY_DECISION_REQUIRED:

- A MANUAL independent request before project start.
- A target end date before project start.

An owner-approved policy can be supplied as the third argument:

```ts
calculateSchedule(project, tasks, {
  manualStartBeforeProject: 'ALLOW', // or REJECT
  targetEndBeforeProject: 'REJECT', // or ALLOW
})
```

These examples show supported choices, not approved defaults. ALLOW preserves an
earlier manual request and keeps an earlier target informational. REJECT returns
the corresponding field error. A dependent task's retained MANUAL date must be a
valid date, but its before-project policy is checked only when it is independent.
Project-start edits never overwrite it.

## Errors

| Code | Action |
| --- | --- |
| INVALID_PROJECT | Supply nonempty project ID and name |
| INVALID_CALENDAR | Select unique weekdays 0-6 and positive safe whole daily hours |
| INVALID_DATE | Use a real date in strict YYYY-MM-DD form |
| INVALID_TASK / INVALID_TASK_ID | Correct task text fields or stable ID |
| INVALID_DURATION | Supply positive safe whole task hours |
| INVALID_START_MODE | Use DEFAULT or MANUAL |
| INVALID_PREDECESSORS | Supply an array of nonempty string IDs |
| DUPLICATE_TASK_ID | Give every task a unique ID |
| DUPLICATE_PREDECESSOR | Remove repeated reference |
| SELF_DEPENDENCY | Remove self-reference |
| MISSING_PREDECESSOR | Correct reference or restore task |
| DEPENDENCY_CYCLE | Remove a link in the closed cycle in relatedTaskIds |
| POLICY_DECISION_REQUIRED | Obtain owner decision and supply ALLOW or REJECT |
| MANUAL_START_BEFORE_PROJECT | Correct manual request or change approved policy |
| TARGET_END_BEFORE_PROJECT | Correct target or change approved policy |
| INVALID_POLICY | Correct policy name or value |
| DATE_OUT_OF_RANGE | Reduce duration or use supported dates |
| INVALID_SLOT | Use selected working date and valid daily hour |

Duplicate/missing/self links are rejected before topological sorting. Sorting
uses stable IDs. Cycle details report a closed path, excluding blocked descendants.
Only the first discovered cycle is reported; independent field errors can be
returned together. Invalid graphs/calendars never return dates.

## Calendar helpers

createWorkingCalendar(settings) copies and validates the calendar and returns:

- nextWorkingDate(date): first selected weekday on or after date.
- firstSlotOnOrAfter(date): that date's hour 1.
- advanceWorkingSlots(start, durationHours): exclusive finish after exactly N slots.
- slotAfter(finish): next available occupied slot.

dateToOrdinal, ordinalToDate, and validateCalendar are also exported. Invalid
helper calls throw SchedulingError with a structured detail property.
calculateSchedule converts scheduling/range errors into its error result.

Run npm test for the A01-A13 matrix and calendar/validation tests, or npm run check
for lint, types, tests, and build. Domain tests use Vitest's Node environment.
See docs/WP1-HANDOFF.md for verification and deferred work.
