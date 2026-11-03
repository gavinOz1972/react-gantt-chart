# WP7.3.1 — Late completion and downstream schedule impact

**Design handoff, 2026-11-03 (America/Regina). No production behavior has
changed.** This package proposes a separate dependency/calendar outlook. It
does not implement it, change commitments, or reinterpret effort forecasting.
WP7.1 owner acceptance and WP7.3 owner acceptance are still outstanding;
neither is inferred from this design request. All new policies remain Pending
in [OWNER-DECISIONS](OWNER-DECISIONS.md).

## Authority and starting state

The requested WP7.3.1 is `docs/WP_Req/Bugsys_Gantt_WP7_3_1_Late_Completion_Design.docx`
in the original `react-gantt-chart` checkout. It was read from the saved DOCX,
without editing it. SHA-256:
`3c55ed4a1fcf5775db823b41cc02f22a1c22dac8d8af73471bea899c54b3abac`.
Its explicit instruction is “Do not implement production changes.” Its final
gate requires separately approved implementation after this handoff.

Work took place only on `feature/wp7-stabilization` in the
`wp7-stabilization` worktree, initially clean at
`b09aae181589167889710b8992e3a82df35dd2b8` (WP7.3 C01–C06).
An ancestry check confirmed that required commit. WP7.2 assessment reference:
`3dc291ec556aa0fbd1fae38e2fc9f1ba6acf0308`.
No merge, rebaseline, tag, migration, deployment or owner-data modification
is included. The original owner checkout and server were left alone.

## Four schedule perspectives

| Perspective | Meaning and ownership | Changes in this package |
| --- | --- | --- |
| Baseline | Frozen accepted plan, including its captured schedule | None; immutable reference |
| Current committed | Current task durations/dependencies/independent releases evaluated on the project calendar | None; remains the officially maintained plan |
| Actual | Effective completion **dates**, status events and history | None; neither actual hour nor actual start exists |
| Proposed progress-adjusted outlook (PA) | Conditional remaining dependency/calendar feasibility under explicitly stated precision/status/As-of assumptions | Rules and proposed read models only |

The shared-capacity **effort forecast (FF)** is an additional, separate model:
remaining person-hours divided across a daily team pool. It is not PA, an
actual finish measurement, or the current committed schedule.

## Source audit: current behavior, not new policy

| Current source | Verified semantics | Reuse / limitation for a future PA |
| --- | --- | --- |
| `src/types/scheduling.ts`, `src/domain/scheduler.ts` | Durable task IDs; positive whole scheduled-hour durations; finish-to-start; parallel tasks allowed. Last occupied slot has an exclusive `afterHour` finish boundary. All direct predecessors constrain a join. | Reuse committed results as read-only coordinates and floors, not as actual observations. No resource levelling is implied. |
| `src/domain/graph.ts` | Missing, duplicate, self and cyclic dependencies rejected; deterministic topological order and task-ID comparisons. | Reuse validation/order, keep event references keyed by durable IDs. Current ready-list sorting is not a strictly linear topological implementation. |
| `src/domain/calendar.ts` | Pure Gregorian date/ordinal arithmetic, selected working weekdays, 1-based abstract slots. Nonworking requests advance. `slotAfter` follows a **known planned boundary**. `nextWorkingDate` is on-or-after, not strictly after. | Reuse whole-slot arithmetic. Date-only completion readiness needs ordinal-date + 1 before normalization; do not invent an actual `afterHour`. |
| `src/domain/workingTime.ts` | BigInt working-slot indexes from year 1; bounded date range and efficient jumps. | Use for comparisons/variance with an explicit origin. These indexes are not project-relative and not person-hours. |
| `src/domain/scheduler.ts` | MANUAL requested start is an independent not-before release only for a task with no predecessors. A retained manual value is inactive with predecessors. Active manual/target dates before project start rejected by existing policy. | Preserve these semantics. A later candidate is not a violation of a fixed appointment, because the model has no fixed appointment. |
| `src/domain/criticalPath.ts` | Backward pass on the **committed** graph, with releases and exact positive durations; target is a comparison, not a scheduling deadline. | Committed slack can explain absorption. Existing CPM cannot consume actual date-only zero-duration nodes or unknown/partial work unchanged. |
| `src/progress/taskProgress.ts` | Four statuses; effective date differs from UTC recordedAt; replayed event order matters. Complete requires criteria/acknowledgement. Latest valid completion remains history after reopening. Optional `committedFinishDateAtCompletion` is date-only. | Reuse decoded active event/status. Do not choose maximum effective date, reactivate an old completion, or mistake recordedAt for actual time. Cross-task chronological contradictions are not rejected by this decoder. |
| `src/components/ProjectEntry.tsx` and progress UI | WP7.3 preserves the stored remaining estimate on Complete, presents effective zero, and requires explicit reopening reassessment. Missing progress defaults to Not Started. | Zero remaining is not completion; reassessed remaining **person-hours** are still not remaining calendar slots. Default status is a planning assumption, not proof of no work. |
| `src/forecast/forecast.ts` | Shared daily pool `(class + homework) * team / 7`; person-hour remaining, deterministic priority. Complete costs zero and satisfies dependencies at the effort model's As-of; displayed completed FF uses its event date. | Preserve formulas and interpretation. PA may constrain a successor later than FF without a contradiction (L15). |
| `src/persistence/projectFile.ts`, `src/baseline/baseline.ts` | Formats 1–5 supported; current format 5; progress from 4, forecast from 5; old completion events can lack historical commitment snapshots. Parse/create rebuild known fields and preserve accepted history/baseline. | Derived PA needs no persisted endpoint. Unknown extra fields can be dropped; richer required evidence needs an explicit later format contract, not undocumented format-5 fields. |
| `src/timeline/projection.ts`, `overlays.ts` | Coordinate projection, not schedule calculation. Current axis uses committed start/finish and target + margin. Compressed nonworking dates collapse. Overlay clipping preserves exact date text. | Reuse mapping, but future actual/PA extent policy must be explicit. Mapping an event to a date edge is visual placement, not a measured finish time. |
| `src/components/gantt/ProgressOverlays.tsx`, Gantt and Network | Baseline outline and purple dashed FF are optional; committed bars/links and critical highlighting use committed results. Completed FF marker is gated by Show Forecast. Network uses committed analysis. | New automatic actual/PA cues need separate lanes and gates; no relabelling FF or committed criticality. |

Existing UI also uses “Late” for committed finish versus target and for
As-of health. Neither alone proves an actual project finish delay.

## Missing evidence and bounded recommendation

Available: graph, current calendar, full scheduled durations, current planned
slot boundaries, effective actual dates, event sequence, current four-state
status, optional historical committed finish date, remaining person-hours,
optional work logs, baseline and effort settings.

Missing: actual start, actual finish hour/slot, remaining **scheduled-slot**
duration for started/reopened work, known blocked restart, historical calendar
and planned boundary at completion, historical project-wide finish reference,
and an archived PA As-of/rule version. Work logs are optional and cannot fill
these gaps by subtraction. Missing historical snapshots must remain Unknown.

Recommend conservative date-only successor readiness, full current duration
only for ordinary Not Started tasks, a current commitment floor and explicit
As-of floor. Started, blocked and reopened paths remain uncertain where
required slot evidence is absent. Already completed successors retain their
facts; contradictory history is exposed rather than repaired. See the exact
[rules](PROJECTION-RULES.md) and all [sixteen scenarios](SCENARIO-MATRIX.md).

Historical lateness, a breached committed start date, a modelled successor
shift, and project outlook movement are different findings. Slack, parallel
work and nonworking gaps can absorb lateness. Conversely, date-only precision
alone can produce a conservative shift on an on-time date. There is no basis
to label either case a measured resource delay or actual final project delay.

## Verification and evidence limits

Only fictional disposable tasks were used. The diagnostic
[`tests/wp731/scenario-evidence.mjs`](../../../tests/wp731/scenario-evidence.mjs)
contains **hand-specified** committed/candidate answers and independent date
lookup tables. Existing utilities check anchors, calendar arithmetic, maximum
known bounds, committed slack and invariants; it is **not** a general PA
scheduler. Its 23 cases cover L01–L16 and precision/unknown-state variants.
[`scenario-evidence.json`](evidence/scenario-evidence.json) records inputs,
actual histories, committed outputs and candidate answers. Proposed Unknown
and UI policies are design decisions, not implemented assertions.

| Command | Result / evidence |
| --- | --- |
| `node tests/wp731/scenario-evidence.mjs` | Pass, 23 cases / 16 scenarios; [log](evidence/scenarios.txt) |
| `npm.cmd run check` | Lint, typecheck, **414 tests in 32 files**, production build pass; [log](evidence/check.txt) |
| `npm.cmd run test:e2e -- tests/task-status.spec.ts tests/progress-visualization.spec.ts tests/forecast-visual-clarity.spec.ts tests/wp73/corrections.spec.ts --workers=3` | **57 Chromium browser tests pass**; [log](evidence/browsers.txt) |
| Source/protection/link checks | [Verification record](evidence/verification.json); no production diff, no format/dependency/config change |

One pre-existing test was date-sensitive on Nov 3: the unscoped `Late` text
locator in `src/components/ProjectEntry.test.tsx` matched both overview and
health. The sole existing-source edit scopes it to **Project overview**,
retaining its expected result and task-date assertions. The initial run had
413 pass / 1 fail; [initial evidence](evidence/initial-check.txt). No app change
was needed. A diagnostic authoring error initially confused global and
project-relative indexes; the fixture check was corrected to subtract the
project origin. This was not a scheduling defect.

The browser suite verifies existing behavior; it does not test unimplemented
PA visuals. It was a relevant 57-test subset, not a full browser-suite run.
No student study, real owner-plan experiment, future PA performance benchmark,
visual usability acceptance or new projection implementation is claimed.
Generated historical screenshot changes from regression runs were restored.

## Handoff

Read [PROJECTION-RULES](PROJECTION-RULES.md), [SCENARIO-MATRIX](SCENARIO-MATRIX.md),
[GANTT-NETWORK-DESIGN](GANTT-NETWORK-DESIGN.md) and
[IMPLEMENTATION-PLAN](IMPLEMENTATION-PLAN.md), then record the separate
[owner decisions](OWNER-DECISIONS.md). This package is complete as a design
proposal; implementation remains gated on explicit approved policies/scope.
