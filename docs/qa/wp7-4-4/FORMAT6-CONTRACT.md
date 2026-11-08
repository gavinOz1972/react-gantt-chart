# Candidate format6 `snapshot-history/2`

**Retirement amendment proposed; R07 not final or implemented.** F01/F02/F03/
F05/F06/F07 are approved in principle, F04/F08 conditionally; the concrete F09
schema below still needs complete-contract review. This is a field contract in
design notation, not a compiled model or JSON Schema. All fields are required
unless explicitly marked optional. No decoder may guess this profile from an
old `guidedPlanning` object. Root `schemaVersion:6` alone is insufficient.

## Envelope and minimum snapshot

```ts
type File6 = {
  format: 'react-gantt-chart'; schemaVersion: 6; profile: 'snapshot-history/2';
  exportInfo: { application: 'React Gantt Chart'; exportedAt: UTC };
  snapshot: Snapshot6;
  integrity: { profile: 'bugsys-jcs-sha256/1'; snapshotSha256: Hash };
}
type Snapshot6 = {
  logicalRevision: SafePositiveInteger;
  origin: Origin;
  current: Current;
  originalBaseline: { kind: 'Absent' } |
    { kind: 'Present'; interpretation: 'WP1-v1'; value: LegacyBaselineJSON };
  history: History;
}
type Origin =
  | { kind: 'New'; createdAt: UTC; attribution: Attribution }
  | { kind: 'LegacyCopy'; sourceVersion: 1|2|3|4|5;
      sourceSavedAt: UTC; sourceRawSha256: Hash; upgradedAt: UTC;
      attribution: Attribution; limitations: string[] };
type Current = {
  project: LegacyProjectSettings; tasks: LegacyTaskInput[];
  lifecycle: { [taskId: TaskId]: TaskLifecycle };
  archivedDependencies: ArchivedDependency[]; scopeReviews: ScopeReview[];
  nextTaskNumber: SafePositiveInteger; manualOrder: TaskId[];
  sortMode: 'manual'|'start'|'name'|'duration';
  duplicateOrigins: { [copyTaskId: TaskId]: TaskId };
  progress: { definitionOfDone: string;
    tasks: { [taskId: TaskId]: CurrentProgress } };
  actuals: { [taskId: TaskId]: {
    start: DateFact; completion: CompletionFact } };
  workTracking: LegacyWorkTracking; forecastSettings: LegacyForecastSettings|null;
  working: Working; // Reviewed state/input population is ACTIVE tasks only
}
type CurrentProgress = {
  status: 'Not Started'|'In Progress'|'Blocked'|'Complete';
  criteria: LegacyCriterion[]; blockedReason?: string;
  statusEventId: EventId|null;
}
type Attribution = {
  source: 'User'|'LegacyImport'|'Unknown';
  actorLabel: string|null; application: string|null;
}
type Unknown = { kind: 'Unknown'; reason: string };
type KnownDate = {
  kind: 'Known'; claimId: Id; date: DateOnly; precision: 'DateOnly';
  recordedAt: UTC|null; attribution: Attribution; sourceEventId: EventId|null;
}
type DateFact = KnownDate | Unknown;
type CompletionReference =
  | { kind: 'Reviewed'; workingRevisionId: Id; finishDate: DateOnly }
  | { kind: 'LegacySnapshot'; finishDate: DateOnly }
  | Unknown;
type Attestation =
  | { kind: 'Attested'; criteriaSnapshot: LegacyCriterion[];
      definitionOfDone: string; completionAcknowledged: true;
      noCriteriaAcknowledged: boolean }
  | { kind: 'LegacyUnknown'; reason: string };
type KnownCompletion = KnownDate & {
  committedAtCompletion: CompletionReference; attestation: Attestation;
}
type CompletionFact = KnownCompletion | Unknown;
type Working =
  | { kind: 'Unreviewed'; reason: string; reference: WorkingReference|null }
  | { kind: 'Reviewed'; reference: WorkingReference };
type WorkingReference = {
  interpretation: 'WP742-v1'; reviewDate: DateOnly; reviewTimezone: string;
  acceptedAt: UTC; inputs: { project: LegacyProjectSettings;
                            tasks: LegacyTaskInput[] };
  state: ExistingWorkingState; decisions: ReviewDecision[];
}
type ReviewDecision = {
  decisionId: Id; taskId: TaskId; predecessorIds: TaskId[];
  outcome: 'KeepAndMove'|'Sever'|'KeepCommitment'|'Advance'|'RecordActual'|'Unresolved';
  reason: string; sourceEventId: EventId|null;
}
```

`Legacy*` means the existing known-data contracts at starting HEAD:
[project/task/slots](../../../src/types/scheduling.ts),
[input ordering/allocation](../../../src/persistence/planInputs.ts),
[baseline](../../../src/baseline/baseline.ts),
[criteria/status meanings](../../../src/progress/taskProgress.ts),
[work entries/remaining](../../../src/workTracking/workTracking.ts) and
[forecast assumptions](../../../src/forecast/settings.ts). Reuse their domain
limits, not their old root envelope or progress-history replay requirement.
ExistingWorkingState means exactly [WorkingState/Commitment](../../../src/planning/workingPlan.ts):
revisionId, ruleVersion1, calendar, per-task constraints(notBefore/origin/
decisionId), commitments(Known start/finish or ReferenceOnly start/finish/
reason/decisionId). This design adds no scheduling formula.

## Current-state invariants and authority

- Project identity is `current.project.projectId`, the portable lineage, equal
  to original-baseline project identity when present. Task IDs are stable exact
  strings; labels/names are not identities. Copies keep them. Repository stored
  resource IDs, receipt ledgers, file paths and lock names are absent.
- Tasks retain all active AND retired identities/inputs. The current acyclic
  scheduling graph is the active projection under existing WP1 rules: only
  active tasks can have active `predecessorTaskIds`, and all those IDs must be
  active. A retired task's array is empty. Removed edges are immutable archive
  episodes, never a second writable set of active constraints.
  manualOrder lists every retained task once; active views filter it without
  reordering. Lifecycle, progress, actuals and remainingHours maps cover ALL
  retained task IDs exactly; empty projects have empty maps/arrays.
  nextTaskNumber exceeds every allocated numeric T ID in current/baseline/
  retained history and never decreases across accepted edits.
- Current progress is explicitly stored, not derived from event replay.
  Blocked requires its reason; other statuses omit blockedReason. Complete
  with known completion has an attested matching checklist/guidance when those
  were recorded. Missing old criteria/actual date stays qualified Unknown;
  LegacyUnknown cannot be used for a new completion confirmation.
- Actual Start and completion are date-only attestations, never occupied hours.
  Known facts carry inline identity/provenance even if history is unavailable.
  Unknown is mandatory when unsupported, not guessed from status, schedule,
  effort or logs. Complete may have Unknown date for an imported incomplete
  history; that does not supply a definite dependency release. For unfinished
  current work, completion is Unknown; past completions stay historical events.
  Reopening does not replace the original first-start fact with a restart.
- A fact's non-null sourceEventId must resolve to a matching fact/correction
  record; statusEventId must match its current status. Null explicitly means
  history attribution unavailable, not a dangling reference. A fact's recordedAt
  may be null only if unknown legacy provenance is explained. New attestations
  need recordedAt and User attribution; actorLabel can still be unknown.
- Impossible known start-after-completion claims reject as contradictory
  accepted state, preserving the source for recovery. Actual starts before a
  retained predecessor completes can reflect real out-of-order work: preserve
  facts and show a dependency conflict; do not erase/backdate them to fix graph
  feasibility. Imported future-effective dates are qualified relative to an
  explicit evaluation date; loading never changes with the wall clock.
- Stored durationHours remains positive whole planned working slots. Remaining
  and recorded work remain person-hours. Logging is optional; empty logs mean
  no recorded logs, not proof of zero actual work. Complete has zero effective
  future work; retain its stored estimate/history. No calendar deduction.
- Forecast settings persist assumptions only. Null means unconfigured. Existing
  omitted asOfDate still means caller-supplied local today, not a saved date.
  Forecast dates, outlook/health/slack, candidate W*, live conflict messages and
  WP1 current calculated dates are derived and excluded from the snapshot.
- Baseline B is full original input/schedule JSON plus pinned WP1 interpretation.
  It may be absent; it is never auto-established even on format upgrade. Once
  known, its entire value/opaque extras and interpretation cannot be removed,
  replaced, repaired from current inputs or reinterpreted by a new engine.
- Working W is a stored accepted promise, distinct from B, actual A and calculated
  outlook. Reviewed W includes its own input/calendar context and explicit
  decisions; stored commitments may become infeasible after later actuals,
  without being silently recomputed. A scheduling-input edit requires reviewed
  replacement or explicit Unreviewed state retaining the old reference.
  Unreviewed references are historical context, never certified new promises.
  Slot.hour/finish.afterHour are ordinal planned hours, never clock times.

Reviewed reference inputs match the ACTIVE projection's scheduling fields/graph/
calendar (names/descriptions can change independently); state keys cover only
active tasks. Retired task promises remain in their retirement decision's
preserved working context and the original baseline, not as active W entries.
An Unreviewed reference validates against its own retained inputs, not today's
changed source. Inline decisions cover referenced active decision IDs; a non-null
sourceEventId must match an available corresponding review/dependency/fact event.
Historical workingRevisionId in a completion reference is a provenance stamp,
not a requirement to reconstruct an old W: its finishDate is self-contained.
Missing review evidence must be qualified by Partial coverage, never relabeled
as independently verified history. A recorded status date is historical status
evidence, not a second writable actual-completion date after a fact correction.

## Structured explanatory history

```ts
type History = {
  coverage: { kind: 'CompleteSince'; revision: SafePositiveInteger } |
            { kind: 'Partial'; reason: string };
  nextSequence: SafePositiveInteger; events: Event[];
}
type Event = {
  eventId: EventId; sequence: SafePositiveInteger;
  recordedInRevision: SafePositiveInteger|null;
  recordedAt: UTC|null; effectiveDate: DateOnly|null;
  attribution: Attribution; taskIds: TaskId[];
  supersedesEventId: EventId|null; reason: string|null;
  kind: EventKind; payload: KindSpecificPayload;
}
```

| EventKind | Exact payload |
| --- | --- |
| LegacyStatus | `{event: LegacyStatusEventJSON}`; preserve full original object, validate known fields without discarding opaque legacy extras. |
| StatusChanged | `{fromStatus, toStatus, blockedReason:string|null}` using the four existing statuses. |
| ActualStart | `{operation:'Record'|'Correct'|'Retract', fact:DateFact}`. |
| Completion | `{operation:'Record'|'Correct'|'Retract', fact:CompletionFact}`. |
| DependencyDecision | `{predecessorTaskId, successorTaskId, outcome:'Retain'|'Sever'|'Unresolved', resultingWorkingRevisionId:Id|null, basisActualStartClaimId:Id|null}`. |
| WorkingReview | `{workingRevisionId, reviewDate, reviewTimezone, decisions:ReviewDecision[]}`. |
| SourceEdit | `{fields:string[], summary:string}`; fields are names of changed current sections, not replay patches. |
| EffortChange | `{taskId, remainingHours:number|null}`. |
| BaselineEstablished | `{baselineId, interpretation:'WP1-v1'}`. |
| TaskRetired / TaskRestored | `{decision:LifecycleDecision}`; exact matching retained inline lifecycle decision. |
| ScopeReview | `{review:ScopeReview}`; exact matching self-contained review/closure record. |

History itself is mandatory; an event list can be empty. An empty new snapshot
at logical1 can declare CompleteSince1. Missing older records require Partial
with a reason; do not invent a Seed, status transition, date or actor. Every new
domain edit after creation appends at least one event in its one accepted
logical revision. Copies/import/export append no fake domain change. Full
CompleteSince coverage must represent each subsequent revision; Partial may
have gaps. Old migrated events use recordedInRevision:null, not fictitious1.

Array order is strictly increasing sequence; event IDs are unique in the whole
file. Sequence is an ordering/high-water mark, not a project revision or clock.
One revision can hold several events. nextSequence exceeds every stored event
and never decreases; overflow blocks a new append, not reading/copying the file.
Timestamps are evidence metadata, may tie, and never sort the event list.
Clock skew can be qualified; valid effective dates can be historical.

IDs are unique within their declared entity namespace, not across every JSON
occurrence: an inline fact/decision and its identical historical snapshot can
repeat the same stable identity. Reject conflicting definitions of one claim or
decision; event records themselves must never duplicate eventId. Baseline and
historical criteria can retain the original task/criterion identities without
becoming new current entities. Changing a fact value requires a fresh claim ID
and a correcting event, not reuse of its old claim identity.

Correction/retraction appends a new event with reason and same-topic earlier
supersedesEventId. Reject self/forward/cross-task/cross-topic links or competing
successors; keep superseded content unchanged. Where a fact is superseded, the
same accepted snapshot changes its inline current projection atomically.
Retracting an active completion also requires an explicit reopen/reassessment
under existing lifecycle policy; it cannot silently retain a newly unconfirmed
Complete state. Actual Start retraction can leave an honestly qualified In
Progress task with Unknown first start. No retraction erases old evidence.
No history pruning across ordinary accepted edits. Event IDs may be reused as
stable legacy IDs only if unique; a collision across legacy namespaces requires
explicit rejection/review, not silent ID renaming. Legacy event recordedAt/
payload values stay as recorded, with missing metadata explicit null.

Loader validates snapshot directly, event shapes/order/references, linked
current facts and corrections. Contradictory linked assertions reject, never
choose one as a repair. For CompleteSince coverage, the latest unsuperseded
covered status/fact assertion must agree with its current projection. For
Partial coverage, an older unlinked differing value may be historical: warn
that the latest explanation is unavailable; do not infer a new current value.
An older completed episode can differ from a reopened current state without
contradiction. None of these checks replays patches to build Current.

History/facts/decisions/archive references resolve to retained active OR retired
task identities; baseline-only older IDs remain in the immutable baseline.
Replace the original blanket deletion prohibition with the retirement contract
below. Physical erasure/history pruning remains prohibited; current production
deletion behavior is unchanged until separately authorized integration.

## Task retirement and restoration (F09 amendment)

```ts
type TaskLifecycle = {
  kind: 'Active'|'Retired'; lastDecisionId: Id|null;
  decisions: LifecycleDecision[]; // preserve every recorded retirement/restore
}
type LifecycleDecision = {
  decisionId: Id; taskId: TaskId; operation: 'Retire'|'Restore';
  priorDecisionId: Id|null; reviewId: Id; recordedInRevision: SafePositiveInteger;
  effectiveDate: DateOnly; recordedAt: UTC; attribution: Attribution;
  rationale: string; sourceEventId: EventId|null;
  before: {
    task: LegacyTaskInput; progress: CurrentProgress;
    actuals: { start: DateFact; completion: CompletionFact };
    remainingHours: number|null;
    working: { workingRevisionId: Id; calendar: LegacyCalendarSettings;
      constraint: ExistingConstraint; commitment: ExistingCommitment }|null;
  };
}
type ArchivedDependency = {
  archiveId: Id; predecessorTaskId: TaskId; successorTaskId: TaskId;
  archivedInRevision: SafePositiveInteger; reviewId: Id; rationale: string;
  sourceEventId: EventId|null;
}
type SuccessorDecision = {
  taskId: TaskId;
  outcome: 'RemoveAndSchedule'|'ReplacePredecessors'|'Retire'|
           'Restore'|'KeepCurrent';
  removedPredecessorIds: TaskId[]; confirmedPredecessorIds: TaskId[];
  plan: { kind: 'Planned'; notBefore: Slot } |
        { kind: 'ActualKnown'; claimId: Id } |
        { kind: 'ReferenceOnly'; reason: string } | { kind: 'Retired' };
  rationale: string;
}
type ScopeReview = {
  reviewId: Id; operation: 'Retirement'|'Restoration'; reviewDate: DateOnly;
  recordedAt: UTC; attribution: Attribution; rationale: string;
  sourceLogicalRevision: SafePositiveInteger;
  targetLogicalRevision: SafePositiveInteger;
  retiredTaskIds: TaskId[]; restoredTaskIds: TaskId[];
  affectedTaskIds: TaskId[]; successorDecisions: SuccessorDecision[];
  archivedDependencyIds: Id[];
  addedDependencies: { predecessorTaskId: TaskId; successorTaskId: TaskId;
                       reinstatesArchiveIds: Id[] }[];
  resultingWorkingRevisionId: Id;
  sourceEventId: EventId|null;
}
```

ExistingConstraint/Commitment are the exact constraint/commitment entries in
WorkingState. Their retirement `before` context uses before.task duration and
its own calendar; it never validates old dates using today's changed estimate.
Every `before` is captured from the common accepted source revision, not from
an intermediate partially retired draft. Retired source fields still validate
identity/scalars, but current active scheduling restrictions do not reinterpret
their historical requested dates. Slot means the existing planned WorkingSlot.
Lifecycle is independent of the four progress statuses. Retirement is neither
completion nor a fifth status. Store current progress/criteria/actuals/remaining/
work logs unchanged unless a separately explicit attestation/correction is part
of the same review. Preserve the pre-review task/estimate/promise in `before`;
never substitute retirement date for Actual Start/completion. The complete
baseline JSON value stays identical. Reports label original-baseline estimate separately
from estimate-at-retirement; if the original entered estimate is unavailable,
say Unknown rather than invent it from a later estimate or deleted task gap.

Initial Active uses lastDecisionId:null/decisions:[]. Retired requires a last
Retire decision; restored Active requires its last Restore. Records alternate
through priorDecisionId, with strictly increasing recordedInRevision for that
task, nonblank rationale3–500 and explicit effective/recording dates. Last ID
and kind are stored current state, checked for consistency without replaying
the entire event history. All earlier lifecycle decisions/rationales remain
unchanged, including after multiple retirement/restoration cycles. Imported
Partial coverage may have missing explanatory events (null sourceEventId), but
cannot erase any known inline lifecycle decisions. New reviews emit matching
events with real recording metadata; an unavailable actor stays null.

Every removed active edge is archived once per removal episode, including
incoming edges of a retiring task and outgoing edges to successors. Archive
IDs are unique; the same pair may have later archive episodes. Endpoints must
remain in the retained task registry. A pair can be active again after explicit
restoration/review while its earlier archive record remains: the archive is
history, never an active constraint. Do not apply DAG validation to the union
of archive episodes from different revisions. Current active DAG validation
must reject any active task depending on a retired/missing ID.

ScopeReviews and their successor decisions persist the whole approved scope
change, not forecast outputs. All referenced review/decision/archive IDs resolve
in the self-contained snapshot; an ID denotes one immutable decision definition
even if its identical payload is repeated in an explanatory event. History adds
TaskRetired/TaskRestored payload `{decision:LifecycleDecision}` and ScopeReview
payload `{review:ScopeReview}`. Event taskIds may include retained retired tasks.
All records for one review share targetLogicalRevision=source+1; these fields
are historical stamps, not extra writable current counters or repository receipts.
SourceEdit or generic import/save cannot bypass lifecycle review by assigning
these fields directly: a known accepted transition changing scope requires the
matching complete ScopeReview and append-only records at the repository boundary.

### Guided successor closure and atomic review

1. Freeze accepted snapshot/ref; collect original active downstream closure of
   nominated tasks. Accumulate affected incoming-edge changes by task ID, not
   by traversed path. Use deterministic topological order, with exact-ID ties.
2. For each affected active successor choose: remove the retiring dependency
   and explicitly plan it; confirm replacement active predecessor(s); or retire
   that successor. Preserve unaffected predecessors. Each additional retirement
   expands closure transitively. In a diamond/join, collect ALL changed parents
   before one final successor decision; no duplicate prompts/events/IDs by path.
3. If a later choice changes a previously reviewed bound, invalidate that draft
   preview and require explicit reconfirmation. Keep one final outcome per task;
   do not silently reuse an outdated decision. Terminate only when every affected
   task is reviewed and no active retired-predecessor edge or pending choice remains.
4. Future planned floors cannot precede review/project start. A genuinely started
   task can reference a real Known actual claim; remaining schedule can stay
   honestly ReferenceOnly, without inventing a finish from person-hours. This
   is a resolved dependency choice, not permission to leave a dangling edge.
5. Preview retirements, archived/new edges, all affected task outcomes and full
   working schedule/Unknown/conflicts. Validate active graph, explicit holds/
   floors and accepted-state invariants using the separately agreed adapters.
6. Confirm one complete candidate/logical revision and one repository transaction,
   including lifecycle/archives/reviews/events/working state. Cancel before dispatch
   leaves accepted state/ref/IDs/history/B unchanged. Lost acknowledgement after
   dispatch remains OutcomeUnknown and uses exact-request receipt reconciliation.

Restoration is an equally explicit review, with rationale. Consider archived
incoming/outgoing relations and affected active successors, but reinstate NONE
automatically. Confirm current active predecessors (reject retired/missing/cyclic
ones), choose any successor reconnections and review their consequences to closure.
Preserve every old archive/retirement; append Restore and reviewed added-edge
records. Never restore a baseline graph or old commitment by assignment. Dates
of restoration/retirement are scope decisions, not actual worked durations.

### Calculation, Gantt and reporting contracts only

Current scheduling/FF/CPM/working-readiness input projects ACTIVE tasks and their
active edges/order/progress/remaining only. Retired tasks remain in portable
maps/logs/details but contribute no active constraint, forecast cost or critical
path. If all tasks are retired, report no active work, not an invented project
actual-completion date. Original-baseline views still use the full original graph.
No existing formula is changed by this design; new projection adapters remain gated.

Default Gantt hides retired tasks. Proposed Show Retired Tasks reveals subdued,
clearly labelled relics with a retirement-date marker/details, plus separate
known actual date markers. It must NEVER draw an elapsed-work bar from planned
start to retirement. Original commitments remain available through baseline
overlay; promise-at-retirement is labelled separately if shown. Toggle state is
presentation-only, outside portable snapshot/fingerprint, and changes no schedule
or baseline. No toggle/renderer is implemented here.
The toggle reveals currently retired rows. A restored task is a normal active
row; earlier retirement episodes remain in details/history rather than creating
duplicate task rows. A current relic uses its latest retirement marker, with
earlier dates still available as separate evidence.

Details and future WP8 scope-change reports expose retirement rationale/date,
available actor, preserved status/actuals, baseline estimate versus retirement
estimate, archived/replacement edges, downstream outcomes and all restorations.
Retired values are historical retained evidence, not zeroed work. WP8 report
implementation and lifecycle UI require separate authorization.

## Versions, scalars and port/evaluator mapping

DateOnly is strict Gregorian YYYY-MM-DD(0001–9999); UTC is exact valid
YYYY-MM-DDTHH:mm:ss.sssZ. Hash is64 lowercase hex. New IDs/reasons use existing
nonblank text limits; preserve valid legacy task IDs exactly, including unusual
prototype-like strings, using safe map access. Numbers are finite binary64;
integer fields/integers in opaque JSON must be safe. No silent trimming,
Unicode normalization, ID renaming or optional-field defaulting on format6 load.
Unknown tagged values differ from missing fields; optional means absent, not
null. Unrecognized new fields/profile/kind reject without stripping. Full legacy
baseline/LegacyStatus payloads are the explicit inert-opaque exceptions.

SafePositiveInteger means1 through Number.MAX_SAFE_INTEGER. New Id/EventId/
claim/decision/working IDs are nonblank strings up to120 UTF-16 code units;
valid legacy identities are preserved with their pinned limits. Reasons are
plain nonblank text3–500 units; optional absence uses the specified null/omission,
not an empty string. Attribution labels/application are null or nonblank1–120;
origin limitation/SourceEdit summary text is nonblank up to1000. SourceEdit
fields are distinct names of Current's declared sections. Origin is immutable
across ordinary saves/copies; a copy does not invent a new original creation
timestamp. No hidden array, string or identity truncation is permitted.
The existing nextTaskNumber limit remains strictly below MAX_SAFE_INTEGER;
logicalRevision may equal it for read/copy, but cannot increment. Planned slot
hours and date ranges retain their own calendar constraints.

Propose `ProjectRepository<Snapshot6>` with logicalRevision projected unchanged
into RevisionRef; the full snapshot fingerprint includes history and baseline.
Other interface/result/receipt shapes stay accepted and unused. An imported
valid revision17 creates a new stored-copy handle at17; its next domain edit18.
Labels, resource IDs and receipts stay repository-local, not in this file.

WP7.4.2 WorkingState maps from reviewed reference.state; actualStarts maps from
inline facts; project/tasks map from Current; reviewDate/floors/holds/affected
IDs are explicit draft inputs, never inferred from file load. **ProgressTracking
cannot generally be constructed without inventing events** when history is
Partial or completion Unknown. Propose a separately reviewed event-independent
progress/actual-completion read model and reopened-history indication (or a
typed Unsupported projection). Do not fake a Not Started→Complete transition,
bypass decodeProgress, or modify the accepted evaluator in this package.
