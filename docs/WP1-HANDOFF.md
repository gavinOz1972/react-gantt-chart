# WP1 scheduling engine verification and handoff

Prepared 30 October 2026 on branch wp1-scheduling-engine. WP1 delivers a pure
programmatic scheduling API. The React page remains the WP0 shell.

## Implemented behavior

- Typed project, task, result, working-slot, finish-boundary, and error contracts.
- Date-only Gregorian ordinal arithmetic and selected-weekday calendars.
- Default and retained manual independent starts, with nonworking-date advancement.
- Conjunctive finish-to-start dependencies and same-day successors.
- Deterministic ID-based topological calculation, graph validation, and cycle paths.
- Full recalculation after calendar, date, duration, or dependency edits.
- Concurrent independent tasks, maximum project completion, immutable inputs.
- Explicit empty-project completion of null and errors without partial schedules.

API: calculateSchedule(project, tasks, policies?) from src/domain/index.ts.
See src/domain/README.md for examples, date/slot conventions, errors and helpers.

## Verification

Node 24.19.0, npm 11.17.0, TypeScript 6.0.3, Vitest 5.0.5.
No dependencies, lockfile, UI components, or build/test configuration changed.

| Command | Result |
| --- | --- |
| npm.cmd run lint | Pass |
| npm.cmd run typecheck | Pass |
| npm.cmd test | Pass: 63 tests across 3 files, including existing React smoke test |
| npm.cmd run build | Pass: 16 modules transformed |
| npm.cmd run check | Pass: runs all four commands above sequentially |
| npm.cmd run test:e2e | Pass: one Chromium smoke test; clean exit outside sandbox |
| $env:TZ='America/New_York'; npm.cmd test -- src/domain/__tests__ | Pass: 62 domain tests in the final version |

The first sandboxed browser run passed its assertion but stalled during shutdown;
it was interrupted and rerun outside the sandbox, where it exited successfully.
The existing NO_COLOR/FORCE_COLOR environment warning remains harmless.

Calendar verification includes leap/century/year boundaries, DST transition
weekends, supported date-range exhaustion, and agreement with a separately
implemented UTC slot-enumeration oracle across five weekday sets, three daily
capacities, multiple start hours and durations through 1000 hours.

## Acceptance matrix

All A01-A13 scenarios are automated in src/domain/__tests__/scheduler.test.ts.

| Scenario | Evidence |
| --- | --- |
| A01 | Monday/Thursday three-hour rollover; finish after Thursday hour 1 |
| A02 | Four-hour day, two-hour predecessor, successor at hour 3 |
| A03 | Tuesday manual request advances to Thursday |
| A04 | Project-start edits move defaults and descendants; manual fields retained, including explicit ALLOW when project start moves beyond manual date |
| A05 | Latest predecessor and identical results after task/predecessor reorder |
| A06 | One/final link removal, retained manual input, descendants recalculate, no deleted tasks |
| A07 | Both daily-hours and weekday edits change scheduling/completion |
| A08 | Independent eight-hour tasks overlap fully |
| A09 | Closed cycle details, self-reference, missing predecessor |
| A10 | Invalid duration/calendar errors contain no partial schedule |
| A11 | Repeatability, frozen inputs, stable IDs, copied output references |
| A12 | Target edits leave dates/completion unchanged |
| A13 | Empty, one-hour, day-end, weekend, multiweek and date-range cases |

Additional tests validate duplicate task/predecessor IDs, invalid dates and fields,
invalid policies, and both explicit choices for the unresolved earlier-date policies.

## Owner decisions and limits

Application Requirements v1.0 was referenced but not provided. Implementation
follows WP1's explicit rules. Two policies remain unresolved:

1. May an independent MANUAL start precede project start?
2. May target end precede project start?

Without an explicit policy, either case returns POLICY_DECISION_REQUIRED with a
field and actionable message. SchedulePolicies isolates ALLOW/REJECT decisions.
A dependent task retains its manual date without applying that policy until the
last predecessor is removed. No dates are silently clamped or overwritten.

The engine accepts typed records and validates field values; a separate JSON
parsing boundary would be needed for arbitrary imported documents. Date support
is explicitly bounded to years 0001-9999, and hours must be safe positive integers.

Existing WP0 development-dependency audit findings are unchanged; no new packages
were installed. The unchanged UI cannot edit tasks or display engine results yet.

## Review and next work

The work is committed on wp1-scheduling-engine for local review. It is not merged
into main or pushed. Obtain owner direction before publishing/merging this work.
The review commit can be located with git log -1 on that branch.

WP2 can consume the API from editable controls and date pickers. Graphical Gantt
bars, dependency connectors, PERT/critical path, feasibility views and persistence
remain deferred. There is no resource leveling, deployment, or scheduling library.
