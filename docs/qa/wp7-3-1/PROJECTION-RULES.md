# Proposed deterministic progress-impact rules

**Design proposal; no production projection is implemented.** Current accepted
semantics are audited in [PROGRESS-IMPACT-ASSESSMENT](PROGRESS-IMPACT-ASSESSMENT.md).
Every new rule here needs the [owner decisions](OWNER-DECISIONS.md). Examples
are independently specified in [SCENARIO-MATRIX](SCENARIO-MATRIX.md).

## 1. Inputs, identity and precision

Inputs are the validated current project/calendar, durable-ID task graph,
current committed schedule, progress events/current status, and an explicit
projection `asOfDate`. No Date.now/React/locale dependency belongs in the
calculation. Baseline and effort forecasting are separate read-only references.
Actual evidence consists of effective calendar dates, not measured working
slots. The event array is replay order; `recordedAt` must be nondecreasing
per task (ties are allowed). It is never actual finish time and must not be
used to re-sort tied events.

Select an active completion only when the current status is Complete and
the replayed latest transition is a valid completion. Select by recorded
event sequence, not maximum effective date: historical effective dates can
be corrected backwards. Retain all earlier completion/reopen events as history.
Do not use an old completion as current release after reopening.

Use current recorded status as a declared planning input, not verified human
observation. In particular, missing progress records default to Not Started
in today's files; mark that as an assumption. This outlook never proves
that no work occurred. No new status or actual start is inferred.

## 2. Historical lateness versus current-plan feasibility

For an active completion with date A and saved
`committedFinishDateAtCompletion` H:

- A > H: historically late by A−H **calendar days**.
- A < H: completed before the saved committed finish date.
- A = H: completed on the committed **date**, with intraday timing unverified.

If H is absent, historical comparison is Unknown. The baseline or today's
edited committed finish must not be substituted for a missing historical
snapshot. A separately labelled comparison against the current plan can
still explain today's dependency constraint. Historical calendars/slot finishes
at completion are not recorded, so historical working-slot lateness cannot
be reconstructed reliably.

A successor's committed start **date earlier than A** is a confirmed date-order
breach under finish-to-start. If its start shares A's date, the evidence cannot
certify or disprove intraday feasibility. Both can warrant a modelled outlook,
but the latter must not be labelled a proven missed start. L01b demonstrates
a conservative shift with no historically late completion at all.

## 3. Date-only completion readiness — recommended conservative rule

For future unfinished work depending on a valid completion date A, use the
first working slot on the first selected working date **strictly after A**:

```text
release(A) = calendar.firstSlotOnOrAfter(calendarDateAfter(A))
```

`calendarDateAfter` is ordinal date + 1 with supported-range checks. This is
a **safe planning bound**, not an assertion that the task finished at H4,
at midnight or after a measured number of hours. Do not construct an actual
`FinishBoundary` or feed A into `slotAfter` as though an hour were known.
Nonworking A stays a valid actual fact; only its future release is normalized.

This deliberately may be later than an achievable same-day start. It makes a
deterministic conservative schedule under the stated precision, not an exact
prediction or proof of actual project delay. Owner alternative: show an
uncertain readiness interval instead; exact intraday propagation would need
additional evidence and a separately approved contract. See D01.

Future-effective completion (A > projection As-of) remains an existing saved
decision, but is not a validated observed actual fact at that As-of. Recommend
an explicit future-dated/scenario warning and uncertain dependent outlook
until the date is reached or a separately approved scenario policy applies.
Do not change saved status or the effort model's current Complete treatment.

## 4. Not Started task duration and start

For an ordinary Not Started task, recommend its **full committed scheduled
duration**, in whole working slots. Remaining person-hours, actual log hours
and team capacity do not provide remaining scheduled slots and are not inputs
to this duration. Parallel tasks remain permitted; this is dependency/calendar
feasibility, not resource levelling or a capacity guarantee.

For tasks whose required predecessors have known releases:

```text
candidateStart = maxWorkingSlot(
    currentCommittedStart,
    firstWorkingSlotOnOrAfter(asOfDate),
    release for every direct predecessor)
candidateFinish = advanceWorkingSlots(candidateStart, committedDuration)
```

An unfinished predecessor's release is `slotAfter(its candidateFinish)`;
there an explicit planned slot boundary exists. A Complete predecessor uses
the date-only bound in rule3. A relevant unknown predecessor makes the
successor uncertain; do not ignore the missing constraint. Evaluate a
validated topological order and return canonical task-ID order.

The committed-start floor makes the first version **delay-only**: early
completion does not silently accelerate promises or move a task ahead of its
current commitment. As-of is a **start-of-date planning context**, not a claim
about the wall-clock hours still available today; H1 is an abstract slot.
Not Started tasks scheduled in the past move to the As-of floor under the
declared-status assumption. Label such movement separately from late-event
impact and flag unreported/default status assumptions.

### Manual dates

Preserve existing semantics: a MANUAL independent start is an earliest
release only when there are **no predecessors**, and nonworking requests
roll forward. With predecessors its retained independent date is inactive.
Do not reactivate it or reinterpret it as a fixed appointment. The committed
floor already contains active independent releases. A later As-of/readiness
bound can legitimately supersede a not-before date. L11/L11b distinguish
inactive retained dates, active releases and unrelated As-of movement.

## 5. Unsupported progress precision and contradictions

| Current evidence | Recommended derived result |
| --- | --- |
| In Progress | Preserve its actual status; no invented actual start and no shifted “actual start”. Without remaining scheduled-slot duration, no confident finish or full-duration restart bar. A prerequisite readiness bound can be shown separately. |
| Blocked | Reason remains visible; no known restart/remaining slot duration means uncertain finish and dependent readiness. |
| Reopened predecessor | Preserve the earlier actual marker with “reopened” context; it no longer releases dependents. Even a known reassessed person-hour estimate does not supply remaining scheduled slots. First version remains uncertain rather than silently replaying full duration. |
| Already Complete successor | Never move its completion or create a new projected-duration bar. Its own valid completion can anchor future successors, with history-conflict warnings. |
| Complete successor date before predecessor date | Definite recorded ordering conflict. Keep both facts; do not repair dates/status or certify the whole project. A conditional future bound may still be displayed using those facts, explicitly qualified. |
| Same-date actual dependency order | Intraday ordering unverified, not a proven contradiction. |
| No completion event / malformed history | Existing decoder rejection remains authoritative. No invented date or partial repair/projection. |
| Zero remaining but no Complete decision | Not a completion fact; an In Progress task remains uncertain in this slot model. |

Unknown readiness propagates only through required paths. A completed factual
node can provide its own date-bound release downstream, but does not erase
upstream contradictory history. Independent known components may retain
conditional dates; if any relevant path is unresolved, withhold a definitive
project outlook and any certified global driving-path claim.

## 6. Explain impact without confusing causes

Keep separate fields for:

1. Historical late/early/on-date/unknown comparison and reference.
2. Confirmed committed date-order breach or intraday uncertifiability.
3. Candidate start/finish shift versus current committed coordinates.
4. Binding reasons: actual event IDs, predecessor bounds, As-of, committed
   floor/manual release, precision assumption and uncertainty source.
5. Project outlook change versus current committed project completion.

Keep all tied binding reasons. A late ancestor's existence alone does not
make every changed date its fault: As-of or another predecessor can dominate.
Do not sum branch shifts to get project delay or allocate the full difference
to one late event without a separate counterfactual analysis.

For fully calculable conditional cases, project outlook date is the latest
date among remaining-work candidate finishes and active actual completions.
An exact projected slot boundary is available only when the controlling
remaining-work boundary has adequate precision; a controlling/tied actual
date remains date-only. Report working-slot shift for planned boundaries
where comparable; calendar-date differences separately. Never turn unknown
actual hour into an exact project-slot delay.

When all tasks are Complete, latest effective completion date is an actual
project finish. Compare it with a clearly named available reference. A current
plan comparison is not automatically historical project lateness: there is
no saved project-wide committed-finish-at-completion snapshot. Until the
project is complete, say **projected/outlook delay**, never actual final delay.

## 7. Paths, effort forecasting and reproducibility

Recommend first-version **outlook-driving chains**, traced from binding
predecessors/constraints and the maximum known finish. This is not projected
CPM, zero-slack analysis or a resource-critical path. Existing committed
criticality remains unchanged. If unresolved/conflicted branches exist,
report only local known drivers and no certified project-wide path. L08
proves the finish-driving branch can change; a full projected critical-path
algorithm is a separate owner choice, not an automatic reuse of current CPM.

The effort forecast still uses remaining person-hours, shared daily capacity
and its existing rules. Complete contributes zero effective remaining there,
but its actual date can constrain a future dependent in this different model.
Effort FF, current commitment and this outlook can disagree (L15) without a
mathematical contradiction. Do not feed this outlook back into that model.

Prefer no new persisted state: calculate from existing facts plus explicit
As-of. The default UI could use local today, independently labelled from
effort-forecast As-of. Same saved inputs + same As-of + same rules/calendar
must give the same output. Later-day reload can legitimately produce a
different conditional outlook. Reproducing a past As-of requires it to be
supplied externally; current files do not archive that projection context.

Reject invalid graphs/calendars or out-of-range dates atomically; surface
uncertainty instead of a fabricated endpoint. Before implementation, owner
approval must settle D01–D09 and the missing-evidence policy.
