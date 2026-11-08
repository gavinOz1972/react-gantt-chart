# Current architecture and incompatibility audit

Audited at `a5a953e820615e2b1105f235f0060c5831e335bf`.
Links below cite production source at that snapshot, not proposed APIs.
Policy IDs refer to [POLICY-PROPOSALS](POLICY-PROPOSALS.md).

## Current sources and contracts

| Concern / source | Verified current behavior | Consequence for guided review |
| --- | --- | --- |
| [Task and calendar types](../../../src/types/scheduling.ts#L18) | Stable task ID; positive whole `durationHours`; predecessor ID array; DEFAULT or MANUAL independent date; abstract numbered slots and exclusive finish boundaries. No actual-start or revised dependent-start field. | A real start date cannot be placed in `requestedStartDate` and called history. Planned slots, calendar dates and person-hours remain different units. |
| [Scheduler](../../../src/domain/scheduler.ts#L64) | Recalculates a full canonical schedule from project/tasks. Every predecessor's planned finish constrains a join. MANUAL is active only for roots; nonworking requests normalize. No status/history input. | It cannot honor a dependent not-before date or release a successor early from an actual completion. A new approved working-plan evaluator is needed; do not disguise it as a chart fix. |
| [Validation](../../../src/domain/scheduler.ts#L5) and [input decoder](../../../src/persistence/planInputs.ts#L15) | Active root start and target before project start rejected; retained manual date with predecessors inactive. Decoder rebuilds known task fields and calls WP1. | Severing the last edge can reactivate a stale retained manual value or make the source invalid. Preview must disclose and explicitly resolve this, without changing historical actual dates. |
| [Graph](../../../src/domain/graph.ts#L6) | Rejects missing, duplicate, self and cyclic edges. Code-point ID ordering; iterative cycle discovery. Ready array sorted repeatedly. | Reuse identity/validation. Deduplicate join review by task ID; UI sort/manual row order is not scheduling precedence. Current ordering is not a linear-time implementation. |
| [Calendar](../../../src/domain/calendar.ts#L69) | `firstSlotOnOrAfter` is inclusive; `slotAfter` uses a known planned `afterHour`; ordinal dates cover years 0001-9999. Arithmetic jumps weeks. | Actual date-only readiness is ordinal +1 calendar date, then first working slot. Nov6 Friday releases Nov9 Monday on M-F. Never manufacture an actual `afterHour`. |
| [Status/event model](../../../src/progress/taskProgress.ts#L4) | Four statuses, missing task record defaults Not Started; effective date and UTC recordedAt separate. `decodeProgress` replays array sequence, orders recordedAt per task, validates from/to and snapshots. | In Progress does not encode Actual Start; transition dates are not reliable first-work dates. Do not infer from status, passed plan dates or log timestamps. |
| [Completion/reopen](../../../src/progress/taskProgress.ts#L105) | Completion attests checklist and project guidance. Reopen requires reason/acknowledgement, preserves prior completion. Latest completion selected by event sequence, not maximum effective date. | Keep old events/snapshots immutable. New actual-start corrections must be appended with explicit supersession; reopening does not erase first-ever start or create a restart date. |
| [App status commit](../../../src/App.tsx#L152), [dialog](../../../src/components/progress/StatusTransitionDialog.tsx#L9) | Completion snapshots accepted WP1 finish date, updates progress immediately; reopening additionally reassesses remaining effort. Save is later and explicit. Dialog cancellation currently precedes that status write. | A completion-plus-review draft must intercept before `applyStatus`, not commit then attempt to roll back. Durable atomic apply is a new workflow/storage policy, not today's Save behavior. |
| [PA calculation](../../../src/projection/progressImpact.ts#L29) | Pure dependency/calendar outlook; Not Started uses max(current committed slot, PA As-of floor, every release), full scheduled duration. Complete uses strict-next-working-day bound. Started, Blocked and reopened need missing slot evidence, thus Unknown. Future-effective and conflicting facts are qualified. | PA is delay-only and derived; cannot become an early-revision planner by copying bars to tasks. Actual Start still does not provide remaining slots. A later evaluator/adapter contract must be authorized. |
| [FF engine](../../../src/forecast/forecast.ts), [documented units](../../../src/forecast/README.md) | Remaining person-hours share `(class + homework) * team / 7` over calendar days. Complete costs zero and immediately satisfies dependencies in this model. Priority includes committed finish/manual order/ID. | Keep formulas and effort inputs independent. Confirmed graph or commitment changes may legitimately change FF priority/results; do not promise identical outputs after changed inputs or feed date-only release into FF silently. |
| [Committed CPM](../../../src/domain/criticalPath.ts#L9) | Validates positive durations and exact slot schedule, backward pass on committed graph. Actual date-only/partial nodes are not supported. | Do not pass a hybrid actual/planned schedule as though it were WP1. Retain clearly labelled legacy-plan CPM until a separately approved new analysis exists; binding drivers are not new critical paths. |
| [Baseline](../../../src/baseline/baseline.ts#L30) | Establishment refuses an existing baseline; recursively freezes copied inputs, ordering and outputs. Decoder recomputes with frozen original inputs/calendar, not current plan. | Never run a new working-plan evaluator to revalidate/rewrite the old baseline. Its schema and archived WP1 interpretation must remain available forever. |
| [File parser/writer](../../../src/persistence/projectFile.ts#L15) | Current format5, versions1-5 only; known-field reconstruction; progress from4, forecast from5; 10MiB limit. Fingerprint lists all known fields explicitly. | Appending Actual Start to format5 would be dropped. New durable fields need a new version, parser, serializer, fingerprint and migration contract. Proposed version6 is not implemented here. |
| [Browser library](../../../src/persistence/localProjects.ts#L4) | Single `react-gantt-chart:projects:v1` key. Validates every named plan; one unsupported plan fails the whole library read. Writes preserve untouched raw records. No cross-tab transaction/compare-and-swap or review journal. | Writing format6 into this key would obstruct older apps' whole library. Recommend an isolated v2 key, retaining v1 originals; save-before-publish needs a new adapter and concurrency policy. |
| [Open/save state](../../../src/App.tsx#L228), [storage UI](../../../src/components/persistence/ProjectStorage.tsx) | App coordinates separate React state values, accepted plan and edit previews; storage communicates by callbacks. Saves validate/serialize once; errors preserve the open plan. No server, worker bus or durable command queue. | A future transaction should validate one candidate document and publish once. React batching alone is not durable atomicity. Avoid effects writing derived calculations into storage. |
| [Duplicate/delete](../../../src/App.tsx#L207), [helpers](../../../src/taskManagement.ts#L34), [progress removal](../../../src/progress/taskProgress.ts#L134) | Copy gets fresh ID, unchecked criteria, no progress history/logs, and an initial effort seed; task source predecessors/manual fields copied. Confirmed deletion removes current progress/history and links, leaving baseline. | New Actual Start/review audit must not be copied. New event references need explicit archive/tombstone policy; current purge semantics cannot silently be reused for immutable revision evidence. |
| [WP7.3.3 adapter](../../../src/timeline/historyPresentation.ts#L22), [Gantt](../../../src/components/gantt/GanttChart.tsx) | Actual/PA primary, C subordinate, red dotted elapsed-late span, R conservative release, baseline/FF optional. Accepted PA edges are separate from draft graph previews. Shared row112px. | Minimal new default is a proposed design replacement, not existing behavior. Keep exact history and optional comparisons, Unknown cues, keyboard targets and baseline access. |

## Prior material and current authority

- WP7.3.1: [assessment](../wp7-3-1/PROGRESS-IMPACT-ASSESSMENT.md),
  [rules](../wp7-3-1/PROJECTION-RULES.md), [scenarios](../wp7-3-1/SCENARIO-MATRIX.md),
  [visual design](../wp7-3-1/GANTT-NETWORK-DESIGN.md),
  [plan](../wp7-3-1/IMPLEMENTATION-PLAN.md), [decisions](../wp7-3-1/OWNER-DECISIONS.md).
  Its Pending sheet is historical; WP7.3.2 later authorized D01-D09.
- WP7.3.2: [implementation/limits](../wp7-3-2/README.md),
  [traceability](../wp7-3-2/TRACEABILITY.md), [verification](../wp7-3-2/VERIFICATION.md),
  [runbook](../wp7-3-2/OWNER-RUNBOOK.md), [acceptance](../wp7-3-2/ACCEPTANCE.md).
- WP7.3.3: [rationale](../wp7-3-3/README.md),
  [traceability](../wp7-3-3/TRACEABILITY.md), [findings](../wp7-3-3/OPEN-FINDINGS.md),
  [verification](../wp7-3-3/VERIFICATION.md), [runbook](../wp7-3-3/OWNER-RUNBOOK.md),
  [acceptance](../wp7-3-3/ACCEPTANCE.md).

## Required new boundaries, not incidental refactors

1. An all-task planned not-before layer plus a status-aware working-plan
   evaluator: root-only manual semantics and legacy WP1 remain distinct.
2. Append-only date-only Actual Start and revision evidence, with an explicit
   upgrade, tombstone and fingerprint contract.
3. A draft/preview/validate/save/publish transaction coordinator; accepted
   state, storage and graphs remain unchanged during review.
4. An optional simplified read model that labels facts versus commitments,
   and does not relabel the old CPM or effort forecast.

These changes exceed WP7.3.3's presentation-only scope. They are investigated
here and gated for later authorization. No production modules are changed.
Baseline immutability is an application invariant, not a tamper-proof claim
about manually edited JSON or unauthenticated browser storage.
