# Format6 candidate 6.0-A - exact proposed contract

**P09/P11/P12 are deferred. This freezes a candidate for decision, not a
production schema. No new parser or writer is implemented.** This resolves
the outline in [WP7.4](../wp7-4/EVENT-AND-FILE-CONTRACT.md). Any later code
must implement these types **and** validation rules, or return for an explicit
contract amendment. No structural-only validation or silent field stripping.

## Type vocabulary and complete field set

Types below are normative design notation, not compiled TypeScript. `Legacy`
means the exact existing known-data contract at source commit
`93bcc5396724b02cc00361e87113a26f3a563b64`: [ProjectFile/PlanInputs](../../../src/persistence/projectFile.ts),
[baseline](../../../src/baseline/baseline.ts), [work](../../../src/workTracking/workTracking.ts),
[progress](../../../src/progress/taskProgress.ts) and [forecast settings](../../../src/forecast/settings.ts).
Their current date/number/checklist/graph validation remains normative.

```ts
type DateOnly = string // strict Gregorian YYYY-MM-DD, years0001-9999
type UTC = string      // exact valid YYYY-MM-DDTHH:mm:ss.sssZ
type Id = string       // new IDs: nonempty, <=120 characters, exact identity
type TaskId = string   // exact existing nonempty ID; no new legacy length cap
type Hash = string     // 64 lowercase hex SHA-256 characters
type Reason = string   // trimmed plain text,3-500 characters
type JSONValue = null | boolean | number | string | JSONValue[] |
                 { [key: string]: JSONValue }
type Slot = { date: DateOnly; hour: number }
type Boundary = { date: DateOnly; afterHour: number }

// All root fields other than schemaVersion keep their exact legacy types.
// No optional legacy section is populated merely because version6 is used.
type File6 = Omit<Legacy.ProjectFile, 'schemaVersion'> & {
  schemaVersion: 6;
  guidedPlanning: Planning1;
}
type Core = Pick<Legacy.ProjectFile,
  'project' | 'tasks' | 'nextTaskNumber' | 'manualOrder' | 'sortMode' |
  'duplicateOrigins' | 'baseline' | 'workTracking' | 'taskProgress' |
  'forecastSettings'>

type Planning1 = {
  schemaVersion: 1;
  documentRevision: number;  // positive safe integer
  baselineGuard: { kind: 'Absent' } |
    { kind: 'Present'; baselineId: string; canonicalSha256: Hash;
      interpretation: 'WP1-v1' };
  actualStartEvents: StartEvent[];
  workingPlan: WorkingState;
  transactions: (Seed | Change)[];
  completionContexts: { [completionEventId: string]: CompletionContext };
}
type WorkingState = {
  revisionId: Id;
  ruleVersion: 1;
  calendar: Legacy.CalendarSettings;
  constraints: { [taskId: string]: {
    notBefore: Slot; origin: 'SeededLegacy' | 'Confirmed'; decisionId: Id
  }};
  commitments: { [taskId: string]:
    { kind: 'Known'; start: Slot; finish: Boundary; decisionId: Id } |
    { kind: 'ReferenceOnly'; start: Slot | null; finish: Boundary | null;
      reason: Reason; decisionId: Id }
  };
}
type StartEvent = {
  eventId: Id; taskId: TaskId; transactionId: Id;
  recordedAt: UTC; reason: Reason; actorLabel?: string; evidenceNote?: string;
} & (
  { kind: 'Record'; effectiveDate: DateOnly } |
  { kind: 'Correct'; effectiveDate: DateOnly; supersedesEventId: Id } |
  { kind: 'Retract'; supersedesEventId: Id }
)
type CompletionContext =
  { kind: 'Reviewed'; taskId: TaskId; workingRevisionId: Id;
    finishDate: DateOnly } |
  { kind: 'LegacySnapshot'; taskId: TaskId; finishDate: DateOnly } |
  { kind: 'Unknown'; taskId: TaskId; reason: Reason };
type MaybeValue = { kind: 'Missing' } | { kind: 'Present'; value: JSONValue };
type SourceEdit = { field: keyof Core; before: MaybeValue; after: MaybeValue };
type Decision = {
  decisionId: Id; taskId: TaskId; predecessorIds: TaskId[];
  outcome: 'KeepAndMove' | 'Sever' | 'KeepCommitment' | 'Advance' |
           'RecordActual' | 'Unresolved';
  reason: Reason;
  requestedPlannedDate?: DateOnly;
  actualStartEventId?: Id;
  resolvesDecisionIds: Id[];
}
type Header = {
  transactionId: Id; revision: number; sourceRevision: number;
  sourceDocumentSha256: Hash; intentSha256: Hash;
  destination: { entryId: Id; name: string };
  reviewDate: DateOnly; reviewTimezone: string; recordedAt: UTC;
  reason: Reason; actorLabel?: string;
}
type Seed = Header & {
  kind: 'Seed'; origin: 'LegacyCopy' | 'ImportedCopy' | 'New';
  initialCore: Core; workingAfter: WorkingState;
}
type Change = Header & {
  kind: 'Review' | 'SourceEdit' | 'ActualStartCorrection' | 'SaveCopy';
  sourceEdits: SourceEdit[];
  workingBeforeId: Id; workingAfter: WorkingState | null;
  decisions: Decision[];
  statusEventIds: Id[]; actualStartEventIds: Id[];
  completionContextsAdded: { [completionEventId: string]: CompletionContext };
}
```

Only the fields above are permitted in new structures. Optional means absent,
not null. Dictionaries use own properties only; reject prototype-polluting
keys at parsing boundaries without renaming any legitimate legacy task ID;
use Map/null-prototype dictionaries if such an ID occurs. Do not reject or
truncate a valid old ID merely because it collides with an Object prototype.
All numbers are finite; slots/boundaries, revisions and counters are safe
positive integers with their relevant limits. Record keys are exact IDs,
never names/row positions. New actorLabel is trimmed1-120 characters and
evidenceNote up to1000. Reason is required even for a record/backfill.
No archive/tombstone field exists in phase-one6.0-A.

## Validation and replay rules (required in addition to types)

1. Root format/createdBy/savedAt and all existing known sections validate under
   their pinned legacy rules. Format6 requires `guidedPlanning`; a partial
   v6 without it rejects. Unknown new fields/subversions reject, rather than
   becoming data that the next save drops. Size remains10MiB UTF-8.
2. Exactly one Seed is first, revision1/sourceRevision0. It stores the initial
   Core and explicitly confirmed seed floor/commitment state. Seed decision ID
   is `D-seed-` plus SHA-256(C([seed transactionId, exact taskId])), so long
   legacy IDs do not overflow the new ID limit. These identify legacy-plan
   promises, never actual dates.
   Legacy actual starts are absent. Legacy completions get only LegacySnapshot
   from their saved event field, or Unknown; no invented reviewed revision.
3. Later transaction revisions are contiguous positive safe integers; each
   sourceRevision equals previous revision. SourceDocumentSha256 binds the
   immutable opening document, using the canonicalization below. Replay Core
   field replacements, checking exact `before` state; fields cannot repeat
   within a change. Missing differs from Present(null). Validate Core after
   each change. Whole-array patches can grow storage; never truncate history.
4. The root Core equals replayed final Core; documentRevision equals last
   transaction revision. Working state equals the last non-null workingAfter.
   workingBeforeId must match replayed state. A project/task change requires
   explicit non-null workingAfter and confirmed preview; unrelated effort/
   text changes may leave working state unchanged. Date rollover alone is no
   transaction and changes no commitment. Known promises are not certification
   of live feasibility after subsequent progress; PA/Unknown remain separate.
5. Working constraints/commitments cover current task IDs exactly, no current
   orphans. Validate every stored planned boundary against its revision calendar.
   Known finish equals start advanced by current scheduled duration when that
   commitment was accepted. Each historical state uses its then-current Core,
   never today's duration/calendar. ReferenceOnly records cannot certify a new
   future promise. Before/after state plus decisions preserves floor versus
   computed start and the effective keepHold; no hidden equality assumption.
6. Actual Start event IDs are unique in their namespace; events appear in
   recorded array order and recordedAt is nondecreasing per task. Record needs
   no live claim; Correct/Retract must supersede that task's live claim. A new
   Record after retraction is permitted. No forks/cross-task/forward references.
   Correct selects the new date even if earlier; Retract yields Unknown.
7. Start events refer to surviving current tasks in phase one and to the owning
   transaction. Every event appears in exactly one appended change's ID list;
   IDs in that list must match the appended records. No automatic start from
   plan/status/logs or effort change. Newly attested date cannot exceed review
   date/known active completion. Nonworking/pre-project history needs reason;
   existing chronological conflicts are retained and exposed, not repaired.
8. Ordinary Not Started plus a newly attested start requires an explicitly
   chosen accompanying In Progress/Blocked status event, unless historical
   reopened context already explains it. Blocked reason, Complete criteria and
   reopening reassessment retain existing validation. Already Complete backfill
   does not reopen; first start is not a restart. Status evidence itself remains
   existing schema1; the new transaction owns atomic grouping only.
9. New status IDs refer to exactly appended legacy events. Each newly appended
   Complete has a context chosen from the pre-review state by P12. Reviewed/
   LegacySnapshot date must equal that event's saved committed finish field;
   Unknown has no manufactured field. Legacy contexts never gain invented
   provenance. completionContexts equals seed contexts plus added contexts;
   old entries/events are immutable. Later fact correction appends evidence.
10. Decisions name affected then-current tasks/predecessors; Sever requires a
    matching removed edge, reason, and valid actual/new planned/unresolved
    outcome. All retained bounds apply. Unresolved records a reason, keeps
    evidence/edge unless separately severed, and cannot publish a Known future
    result it cannot support. ResolvesDecisionIds references previous unresolved
    decisions, without rewriting them. WorkingAfter dates must be independently
    recalculated during acceptance, not trusted because they deserialize.
11. Historical Core/working snapshots validate references at their own revision.
    Current fact/context/review references use the P11 deletion guard. Mechanical
    seed/before snapshots are historical context, not live orphans. A blocked
    deletion cannot be bypassed by removing history fields or down-exporting.
    Counter high-water mark exceeds current/baseline/historical allocated T IDs.
12. No existing baseline may be removed/replaced. A first explicit establishment
    may change Absent to Present once using original WP1 rules; guard then binds
    the full accepted baseline JSON value and original interpretation. Current
    imports/saves with the same known project identity but a conflicting baseline
    reject for recovery. Absent imported into a known-baselined identity cannot
    erase it. A different project's baseline is not replaced by the current one.

The Seed must also retain any seeded legacy completion contexts so replay can
reconstruct the final map: they are deterministically derived **only** from
initialCore.taskProgress completion events and their existing optional saved
finish field. There is no separately mutable seed-context cache.

Root savedAt equals the latest transaction's recordedAt. A prefix replay can
therefore reconstruct the preceding v6 document, its metadata, appended event
prefixes, contexts and working state to verify the next source hash. The Seed's
original legacy source hash is provenance, independently verifiable only when
the compatible source/backup is available; do not call it a signature. Timezone
is a nonempty recognized IANA zone label, metadata only; no pure calculation
reads the clock or uses it to invent an actual hour.

## Canonical hashes, baseline bytes and intent

Define `C(value)` recursively: arrays retain order; plain-object own keys sort
by JavaScript UTF-16 lexicographic order; serialize finite JSON primitives with
JSON.stringify, without whitespace. UTF-8, no BOM/trailing newline. This is a
named application canonicalization, not a claim of conformance to another
canonical-JSON standard. Hash is SHA-256 of these bytes. Missing optional fields
remain absent, null remains null; no sorting of historical arrays or trimming IDs.

`sourceDocumentSha256` hashes the full pre-change file, including its prior
history/savedAt. It never hashes a reference to the candidate itself.
`intentSha256` hashes C of `{kind, sourceRevision, sourceDocumentSha256,
destination, reviewDate, reviewTimezone, reason, actorLabel?, sourceEdits, workingBeforeId,
workingAfter, decisions, statusEventIds, actualStartEventIds,
completionContextsAdded}` plus the full appended status/start event bodies.
Seed instead hashes its kind/origin/source hash/destination/initialCore/workingAfter and
header review metadata. Exclude recordedAt, transactionId and the intent hash
itself from this digest; reuse the same staged IDs/body/recordedAt on retries.
The library receipt's payload hash covers the full resulting file separately.
No recursive serializer, self-hashing object or mutable after-hash field.

Destination uses the v2 name/entry-ID rules. It is historical write provenance,
not an instruction for an imported file to overwrite that destination. Changing
destination is a new intent/transaction; Save Copy preserves prior destinations
and records its own. File import validates content first and remains unsaved
until an explicit local destination is chosen.

Baseline invariants have three explicit levels: original v1 saved-library raw
string and compatible source backup bytes stay unchanged; the full accepted
baseline JSON value stays semantically identical; C(baseline) bytes/hash stay
identical across v6 round-trips. JSON export indentation may differ, so do not
claim a reserialized baseline substring preserves original whitespace bytes.
Preserve opaque legacy baseline extras as inert JSON alongside validated known
fields; hash the full accepted value, never strip unknown baseline evidence.
The original decoder still validates known WP1 interpretation. A digest detects
accidental divergence; it is not authentication against edited files/scripts.

## Upgrade and independent implementation boundary

Read versions1-5 using existing semantic validation and retain their original
raw source for backup/copy. Do not infer missing baseline, starts, completion
reference or logs. Explicit Save As upgrade creates a v6 copy with Seed;
v1 source is untouched. Version6 round-trip must preserve all new records;
current old reader must reject6. Version7/unknown subversion rejects atomically.
No down-export5 that drops evidence. Raw backup download is separate from
the one library write and cannot be called part of an atomic transaction.

This candidate needs a separately tested new codec and replay validator after
P09/P11/P12 decisions. The [primitive spike](diagnostics/storage-spike.mjs)
uses a counter and current codecs; it is intentionally **not** that adapter.
