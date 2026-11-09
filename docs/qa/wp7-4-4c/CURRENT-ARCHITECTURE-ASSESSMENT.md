# Current architecture, retention and consumers

Assessment at `1b35da8ed7e4d113557b992d7abe7a1a0c316e6d`,
`feature/wp7-stabilization`, client date 2026-11-09, America/Regina.
This document distinguishes implemented code from proposed contracts.

## Implemented application

[App](../../../src/App.tsx) owns React state and passes values/callbacks to forms,
charts and storage. Memoized pure functions receive values; there is no event
bus, database API or repository injected into the application. The
[file codec](../../../src/persistence/projectFile.ts) reads versions 1–5 and
writes version 5. It uses ordinary JSON.parse/JSON.stringify. The 10 MiB legacy
file limit already exists; it is not activation of the proposed format 6 policy.
[Local storage](../../../src/persistence/localProjects.ts) reads and validates
the entire named-project library in one localStorage key. Saving validates the
candidate, reads the library and rewrites the library while retaining untouched
raw records. This is not lazy retrieval or multi-user optimistic concurrency.

| Implemented consumer | Required inputs / actual history use |
| --- | --- |
| WP1 scheduler and critical path | Project calendar, current task graph/durations/start policy and derived schedules; no audit log or baseline required for core calculations. Graph/results memory grows with tasks and edges. |
| Progress-adjusted outlook | [progressImpact](../../../src/projection/progressImpact.ts) calls decodeProgress and scans completion events. Legacy current status and replay history must agree. It cannot currently discard all status events. |
| Effort forecast | [forecast](../../../src/forecast/forecast.ts) uses current tasks/status/remaining/capacity, baseline finish comparisons, and latestCompletion from legacy events for actual finish dates. It does not treat work logs as capacity. |
| Health and Gantt | [health](../../../src/progress/healthPresentation.ts) and [Gantt](../../../src/components/gantt/GanttChart.tsx) consume derived outlooks, current graph, selected details and optional original-baseline overlay. Historical date markers arrive through progress impact; they are not reads from a lazy history service. Rendering also retains viewport/axis/row/link models. |
| Status/work details | [TaskStatusPanel](../../../src/components/progress/TaskStatusPanel.tsx) filters and displays transition events; [workTracking](../../../src/workTracking/workTracking.ts) filters/sorts entries and sums recorded hours. Full retained logs are loaded today. Optional logging does not mean recorded zero proves no work. |
| File open, Save, export and dirty tracking | Full project objects, progress events, work records and baseline. There is no incremental format 6 integrity computation in the app. |
| Private working evaluator | [workingPlan](../../../src/planning/workingPlan.ts) also validates/scans legacy progress history; this evaluator remains outside the App import graph. |

The future operational view needs explicit qualified actual/completion facts,
current progress/remaining, and recorded-work totals with completeness metadata.
Replacing existing history reads requires separately authorized adapters and
parity tests. No claim is made that simply dropping events from today's objects
would preserve behaviour. A selected task's audit/log detail can then be fetched
explicitly; baseline overlay can request the immutable baseline once and cache it.

## Proposed snapshot-history/2

The [field contract](../wp7-4-4/FORMAT6-CONTRACT.md) and
[retirement amendment](../wp7-4-4/AMENDMENT-SUMMARY.md) are design artifacts.
No production format 6 model/codec, retirement workflow or adapter exists.

| Structure | Authority and retention | Duplication / reconstruction boundary |
| --- | --- | --- |
| Current project/tasks/maps/order | Authoritative current inputs; full stable-ID registry retains active and retired tasks. Calculations use only active projection. | Working reference inputs repeat project/task scheduling context intentionally; this anchors an accepted promise to its own inputs. |
| Original baseline | Full first baseline JSON plus WP1 interpretation, including opaque values; may honestly be Absent. | Deliberate independent historical snapshot, not an optimization target. Never regenerate from current inputs or remove retired IDs. |
| Current lifecycle | Current kind/last decision plus every immutable decision; each decision retains task/progress/actuals/remaining and optional working before-context. | Before-context is per subject, not a whole-project snapshot. Task text, criteria, calendar, rationale and working evidence recur per episode; TaskRetired/Restored events repeat the same decision definition. |
| Archived dependencies | One retained record per removed-edge episode, with stable endpoints, review and provenance IDs. | Restoration never deletes episodes or automatically restores edges. Repeated cycles multiply records even at constant task count. |
| Scope reviews | Whole reviewed successor closure, one final decision per affected task, removed/confirmed edges and accepted planning outcome. | History ScopeReview events repeat the complete review. High fan-out multiplies successor decisions, predecessor lists and rationale, even for one retired root. |
| Explanatory history | Ordered immutable event IDs/sequences, recording/effective dates, attribution, corrections, coverage and high-water mark. | SourceEdit summaries are not reversible deltas. Partial coverage stays Partial. CompleteSince means explanation coverage, not guaranteed exact past-state replay. |
| Current facts and progress | Qualified facts/status/criteria independent of full event replay. | Inline provenance allows ordinary use without historical retrieval; referenced records still require acceptance-time validation and on-demand resolution. |

Audit explanation asks who/what/why, which edges were removed or explicitly
restored, which successors were reviewed, and what the subject/promise was before
the decision. Exact reconstruction additionally needs every changed stored value,
ordering, known starting state and deterministic versioned apply rules. The
existing explanatory contract deliberately does not promise that extra information.
Recomputing with today's scheduler is not historical reconstruction.

Growth is approximately current + immutable baseline + retained events and
decisions + sum of reviewed closure sizes and archived edge episodes. Repeated
definitions add a multiplier; recording all before/after values adds a different
multiplier. Neither a bounded task count nor shallow JSON depth bounds lifetime
bytes. Missing dates, actors or old states cannot be filled to compress or replay.

## Implemented repository boundary

[ProjectRepository](../../../src/repository/projectRepository.ts) is an unused,
generic readonly port with load/list/create/commit. `load` returns the complete
snapshot S. `list` pages project summaries, not history. Commit expects the full
candidate, expected revision/fingerprint and transaction ID. It advances exactly
one revision, distinguishes committed receipt from current head, rejects ID reuse,
and reconciles unknown outcomes through exact-request retry.

The [reference adapter](../wp7-4-3b/tests/referenceRepository.ts) models atomic
in-memory transitions, cloned snapshots and injected acknowledgement loss. It
has no physical durability, history filters, checkpoint retrieval, lazy baseline,
cross-tab locks, SQL transaction or streaming export. Its known-lineage validation
copies known snapshots; that test approach is not a scalable database algorithm.
Owner acceptance of this port does not approve a new operational loading contract.

## Memory conclusion

Normal scheduling can operate on active inputs, adjacency/order and derived
results. Editing additionally needs retained identity/current lifecycle summaries,
qualified current facts, effort, criteria and accepted working promises; overlays
need baseline when requested. Complete audit payloads, old closure decisions and
checkpoints are not inherently scheduling inputs. Logs can be paged if accurate
recorded totals are maintained atomically and remain explicitly qualified.

However, operational current size can itself be large (dense graph, working
input copies, long criteria/text). This study's operational JSON deliberately
retains current log entries and working context for conservative measurement;
it demonstrates separation from old lifecycle/reviews/events, not the smallest
possible working set. Fetch-by-purpose proposals are in
[MEMORY-AND-REPOSITORY-CONTRACT](MEMORY-AND-REPOSITORY-CONTRACT.md).
