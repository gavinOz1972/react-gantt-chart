# Bounded plan for a later approved implementation

**Planning only.** This document does not authorize starting these steps.
Approve the design policies/scope in [OWNER-DECISIONS](OWNER-DECISIONS.md)
separately before production work. WP7.1 and WP7.3 acceptance remain separate
outstanding records. No production PA scheduler, read model, UI or new file
format is part of WP7.3.1.

## Proposed boundaries and flow

```text
Existing validated file / current edits
  + current committed schedule (unchanged scheduler)
  + decoded status/event history + explicit PA As-of
                   |
                   v
  Pure progress-impact calculation (new, separately tested)
    facts / precision / candidate dates / reasons / uncertainty
                   |
                   v
  Derived chart read models
    Gantt axis + actual / PA geometry + summaries
    Network affected flags + conditional outlook drivers

Frozen baseline ---------> existing baseline presentation (read only)
Existing effort inputs --> unchanged effort forecast ------> FF presentation
```

Suggested modules, names provisional:

- `src/projection/progressImpact.ts`: pure explicit-input calculation;
  no React, current clock, localStorage, event mutation, baseline mutation or
  calls that rewrite committed results. Return canonical-ID results.
- `src/projection/progressFacts.ts`: one pass over decoded events to index
  active/history completion, saved reference, reopen and evidence warnings.
  Respect event sequence and current status; do not use latest effective date.
- `src/projection/types.ts`: discriminate known slot boundary, date-only fact,
  unknown, conditional/conflicted; never fill an unknown with `0` or a fake
  `FinishBoundary`. Include rule version and explicit As-of in derived result.
- Gantt/Network read-model adapters: map derived facts to labels, geometry,
  primary axis extent and binding-edge cues. No independent date calculations
  or persistence side effects in React/render helpers.

Proposed per-task result includes durable ID, committed coordinates (reference),
active completion date/event ID/reference precision, historical comparison,
date-order feasibility, candidate start/finish **or uncertainty reason**,
planned slot/date shifts, all binding constraints and derived provenance.
Project result distinguishes actual-all-complete finish, conditional outlook,
known local lower bounds, Unknown/conflict, and controlling **date-only**
versus precise planned boundary. Avoid a single boolean `isLate`.

Reuse existing graph/calendar/working-index utilities after current validation.
Current `src/timeline/projection.ts` maps coordinates; do not add scheduling
logic to it. Current committed CPM is a separate input/display. A future PA
backward pass would need its own tested treatment of actual dates, zero/partial
work, releases and unknowns; do not force the current CPM API to accept fake
positive durations. Recommend binding-chain tracing only for the first scope.

## Calculation stages

1. Validate existing project/graph/progress and explicit As-of. Reject invalid
   structures or unsupported date overflow atomically using existing error
   conventions; preserve all source values.
2. Index active and historical events, detect future-effective context and
   cross-task date-order conflicts. Historical lateness requires the event's
   saved reference; never substitute an edited current plan.
3. Traverse topological order. Anchor valid Complete dates; ordinary Not
   Started uses max(committed floor, As-of floor, every required release) and
   full current slot duration. Propagate unknown through required unresolved
   paths; already-complete facts can anchor conditional local downstream work.
4. Aggregate dates without inventing actual hours; withhold a definite global
   finish when unresolved/conflicted paths remain. Retain tied binding
   constraints and cause categories. Do not equate all ancestor lateness with
   causal project delay or sum branch shifts.
5. Produce read models and automatic accessible summaries; union actual/known
   PA extents into the primary Gantt domain. Existing forecast, baseline,
   committed bars/links, criticality and persistence receive no derived edits.

## Complexity and performance

Let V tasks (~30–100), E dependencies and H recorded progress events.
Event indexing is O(H), dependency checks/traversal O(V+E), and project
aggregation O(V). Calendar utilities jump by weeks with bounded/logarithmic
date arithmetic rather than iterating every elapsed hour. Canonical final
sorting adds O(V log V). Keeping immediate binding edges uses O(V+E+H)
storage; reconstruct full provenance chains lazily rather than copying every
ancestor chain into every task (which can become quadratic).

Existing graph ready-array sorting has a conservative O(V² log V + E)
worst-case bound; reuse is reasonable at this scale, and this package does
not rewrite it for an unsupported performance claim. Avoid enumerating all
paths, all topological orders, every day in a long gap or running a scheduler
once per rendered row. Memoize the pure result by actual relevant input
identity plus As-of; do not introduce effects that repeatedly set derived
state or write back to localStorage during render.

After implementation, benchmark repeated recalculation for 30, 60 and 100
tasks, sparse and dense acyclic joins, long date gaps and long histories on
the supported browser. Record hardware/browser, p50/p95 and longest blocking
task. Provisional owner-review target: a calculation below one 50ms long-task
threshold for a 100-task fixture, with no repeated render/save loops. This is
an acceptance target, **not measured PA performance**. Virtualized rendering
must scale with visible rows/cells; expanded date ranges must stay bounded.

## Persistence and compatibility contract

**Recommended first scope: derived only, no format change.** Existing source
fields suffice for conservative known cases plus explicit Unknown results.
Use formats1–5 exactly as currently decoded, with current5 saves; do not
backfill unknown historical snapshots or replace historical actuals with
current coordinates. Keep baseline and completion snapshots immutable.
Do not persist candidate bars, affected flags, driver paths, warnings or
comparison values that become stale when tasks/calendar/status change.

PA As-of is an explicit calculation input, defaulted to local today in the
UI and labelled separately from FF As-of. Determinism requires it in the
reproduction notes; saving a file alone does not preserve a past PA context.
If exact historical reproduction is required inside the project file, stop
and approve a separate context/rule-version contract first.

If the owner instead requires exact intraday release, confident started/
blocked/reopened finishes or historical project delay, the required new
evidence must be designed before implementation:

| Requested capability | Missing data / explicit decisions needed |
| --- | --- |
| Actual-hour readiness | A project-calendar actual finish slot or genuine timestamp with timezone/calendar mapping and precision metadata; editing/correction validation; semantics for nonworking actual time |
| Started/reopened projected finish | Actual start evidence and separately assessed remaining **scheduled slots** (or an explicitly justified conversion model), source/effective date, handling zero/Unknown and reopened work; not existing remaining person-hours |
| Blocked restart | Explicit expected restart/release date and uncertainty, assessed remaining scheduled duration; no inference from reason text |
| Historical working-slot lateness | Historical committed finish boundary and calendar version captured at the event, not today's calendar |
| Historical whole-project delay | A named project-wide reference snapshot appropriate to that decision; baseline remains a distinct reference |
| Reproduce prior PA context | Stored As-of, precision policy/rule version and relevant input reference; define whether audit snapshot or mutable preference |

Current serializers reconstruct known fields, so do not silently append
these to format5 and hope an older reader retains them. A later approved
version (6 or whatever follows the then-current version) must specify exact
types, absence-as-Unknown, non-destructive migration, copy/backup before
upgrade, import validation, export round-trip, and explicit rejection by
older readers rather than silent data loss. Existing formats and real data
must still load without invented evidence. No such migration is authorized
or implemented here. Optional work logs remain optional; four statuses remain.

## Test and review plan after authorization

1. Domain tests: convert every [L01–L16](SCENARIO-MATRIX.md) supplied answer
   into independently expected PA outputs after policy decisions. Include
   strict-after nonworking dates, H1/Hlast boundaries, week jumps, ties, slack,
   parallel paths, manual inactive/active, early no-pull-forward, Complete
   fact conflicts, same-date uncertainty, reopen, future actual, missing
   legacy snapshots and invalid graph/calendar/range. Preserve committed
   schedule/CPM, source baseline/events and effort results byte-for-byte.
2. Determinism: task-array permutations, repeated calls, corrected effective
   dates with recorded order, empty/default statuses, same explicit As-of
   across local timezones. Date rollover changes the context only; no hidden
   clock in domain code. Unknown never becomes zero or an arbitrary date.
3. Compatibility: representative formats1–5, missing progress/snapshot,
   optional logs, current stored null/0 estimates, exact save/import/export
   round-trips; confirm no new derived keys appear in current files. Test
   Save after capacity changes remains unaffected and no derived-state loop
   enters serialization. Full existing checks must still pass.
4. Browser: both modes/scales, keyboard/touch, narrow/1440px, long graphs,
   virtualization, simultaneous layers and all eight existing overlay toggle
   combinations. L03 default-visible actual/PA/summary, L05 zero project
   impact, L08 driver versus committed critical, L09/10/13/14 uncertainty,
   L12 nonworking date, L15 distinct FF, L16 same-context reload. Off-range
   impact remains discoverable without automatic focus/viewport jumps.
5. Performance and owner review: measured 30–100 task budget, stable save/
   render behavior, clear date-only assumptions, marker/layer visibility and
   comprehension of committed versus FF versus PA. No participant findings
   are assumed from automated passes.

## Suggested bounded delivery sequence

After explicit authorization naming decisions: first pure evidence/precision
types and domain tests; then derived PA/driver results; then automatic Gantt
actual/PA/summary and extent/navigation; then bounded Network annotations;
finally compatibility/browser/performance evidence and owner acceptance.
Review after each boundary if approved policy changes. Do not sneak missing
evidence capture or a new persistence format into a chart correction.

No resource-levelled scheduling, new status, forced actual logs, automatic
remaining deduction, commitment rewriting, rebaseline, student health/history,
meeting view, expanded charts, general C10 navigation enhancement, WP8,
dependency upgrade, merge, release tag or deployment is included.
