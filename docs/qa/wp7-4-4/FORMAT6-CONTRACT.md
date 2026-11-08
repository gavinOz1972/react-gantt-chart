# Candidate format6 `snapshot-history/1`

**Proposed, not accepted or implemented.** This is a complete field contract in
design notation, not a compiled model or JSON Schema. All fields are required
unless explicitly marked optional. No decoder may guess this profile from an
old `guidedPlanning` object. Root `schemaVersion:6` alone is insufficient.

## Envelope and minimum snapshot

```ts
type File6 = {
  format: 'react-gantt-chart'; schemaVersion: 6; profile: 'snapshot-history/1';
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
  nextTaskNumber: SafePositiveInteger; manualOrder: TaskId[];
  sortMode: 'manual'|'start'|'name'|'duration';
  duplicateOrigins: { [copyTaskId: TaskId]: TaskId };
  progress: { definitionOfDone: string;
    tasks: { [taskId: TaskId]: CurrentProgress } };
  actuals: { [taskId: TaskId]: {
    start: DateFact; completion: CompletionFact } };
  workTracking: LegacyWorkTracking; forecastSettings: LegacyForecastSettings|null;
  working: Working;
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
- Tasks are a valid acyclic source graph under existing WP1 rules. Dependencies
  are only `tasks[].predecessorTaskIds`, not a second writable edge array.
  manualOrder lists each current task once. Progress, actuals and remainingHours
  maps cover current task IDs exactly; empty projects have empty maps/arrays.
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

Reviewed reference inputs match the current scheduling fields/graph/calendar
(names/descriptions can change independently); state keys cover those tasks.
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

Phase-one history refers to surviving tasks; baseline-only IDs may appear inside
the frozen baseline. Future edit gates must prevent deletion of a task needed
by retained history/facts/decisions. This is a proposed compatibility restriction,
not a new tombstone/archive feature or a change to current deletion behavior.

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
