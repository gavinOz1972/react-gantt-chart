# Proposed Actual Start, working-plan and compatibility contract

**Design only; every new field/version below is unimplemented and Pending.**
P01-P03/P06/P08-P09/P11-P12 in [POLICY-PROPOSALS](POLICY-PROPOSALS.md)
govern this proposal. Current formats and serializers remain unchanged.

## Existing durable records stay intact

[Current format5](../../../src/persistence/projectFile.ts#L15) contains project,
tasks, allocation counter, display metadata, optional frozen baseline,
work tracking, status/criteria/history and forecast settings. Its status-event
schema1 already has effective completion date and optional saved committed
finish date; it has no Actual Start. The parser reconstructs known keys and
rejects version6. Do not hide required evidence inside descriptions, status
notes, optional work logs or unrecognized format5 fields.

The following is a **proposed format6 schema outline**, not a sample accepted
by the current app. Names and final types must be frozen after owner decisions:

```text
ProjectFile.schemaVersion = 6
existing known fields: retained under their existing contracts
guidedPlanning?: {
  schemaVersion: 1,
  documentRevision: positive safe integer,
  actualStartEvents: ActualStartEvent[],
  workingPlan: {
    ruleVersion: 1,
    revisionId: stable ID,
    calendar: accepted project calendar snapshot,
    constraints: { taskId -> { notBefore: PlannedSlot, decisionId } },
    commitments: { taskId -> { plannedStart, plannedFinish,
                              qualification, decisionId } }
  },
  reviewTransactions: ReviewTransaction[],
  completionContexts: { completionEventId -> ReferenceContext },
  archivedTasks: { taskId -> { taskSnapshot, archivedAt, transactionId,
                              progressSnapshot?, statusEvents, workSnapshot? } }
}
```

Absence of `guidedPlanning` means no start evidence/review history/revised
constraints. It does not mean tasks started at their plan dates. Existing
optional progress/work/forecast absence rules remain unchanged. A v6 reader
must reject unknown required subversions, malformed references and partial
transactions atomically. PlannedSlot is a valid working `{date, hour}` under
the revision calendar; it never denotes an actual hour. Calendar changes
require a new reviewed constraint normalization, not reinterpretation of old
snapshots. Dates and IDs are serialized primitives, never BigInt objects or
cyclic references. Derived live PA/FF geometry remains outside the file.

## Minimal Actual Start event

| Field | Proposed type / rule |
| --- | --- |
| `eventId`, `taskId`, `transactionId` | Stable nonempty strings, at most120 characters. Event ID unique; task exists currently or in approved archive; transaction exists. Never use task name or row index as identity. |
| `kind` | `Record`, `Correct` or `Retract`. These are event kinds, not additional task statuses. |
| `effectiveDate` | Strict Gregorian date for Record/Correct, years0001-9999; omitted for Retract. Date-only, no slot/hour or wall-clock time. |
| `recordedAt` | Canonical UTC millisecond timestamp, preserving append order. Nondecreasing per task; tied timestamps preserve array order. Not actual time of work. |
| `supersedesEventId` | Required on Correct/Retract, referring to that task's currently active start event. No cross-task, forward, duplicate, forked or cyclic supersession. Initial Record omits it; a new Record after a retraction is permitted. |
| `reason` | Required 3-500 trimmed characters for all captures, including backfill/correction/retraction. Explain evidence and why entered/corrected now. Plain text. |
| `actorLabel` | Optional self-reported name,1-120 trimmed characters. Omit if unavailable; do not invent account identity. |
| `evidenceNote` | Optional plain text up to1000 characters; no mandatory log, attachment, verified timesheet or authenticated audit claim. |

Replay selects the live unsuperseded claim, never the maximum effective date.
Retract makes the current start Unknown but retains all former claims.
Corrections are data provenance, not automatic status transitions. Group any
explicit accompanying status change under the same transaction. Reject new
start dates later than the review date or a known active same-task completion;
show imported legacy conflicts without mutating their facts. Nonworking/past
dates remain exact facts; pre-project facts need explicit explanation (P06).

Actual Start is first-ever work on the task. Reopening does not create another
first start or reactivate an old completion as a release. A restart episode,
remaining scheduled duration and blocked restart date are deliberately absent;
they need another evidence contract before a reliable started-task finish.
Historical effective dates do not rewrite effective status dates or criteria.

## Working commitments and reference history

At an explicit first upgrade, seed `constraints` for every current task from
the accepted legacy schedule's exact start slot. This is a planned reference,
not an actual backfill. The owner must see that a historical seed is retained
as an old commitment, not newly promised retroactive work. Only ordinary
Not Started tasks use that constraint to calculate supported future proposals.
Actual/started/blocked/reopened tasks retain references with uncertainty.

`commitments` retains the last explicitly reviewed planned start/finish or
null where absent; `qualification` is Commitment or ReferenceOnly. This is
accepted decision state, not a cache of today's PA. Completed/started actual
facts are still separate. Unresolved old plans retain their old boundaries
as ReferenceOnly, never a newly certified future finish. Replay from the
initial seed and before/after decision snapshots must reconstruct this map.
No local-day rollover or live model render updates it. Non-wizard task/graph/
calendar edits must pass the same confirmed revision boundary or leave the
old reference explicitly unverified until reviewed. A stale source signature
must not be interpreted as matching valid current working commitments.

The new evaluator must use all retained dependencies, completed date-only
releases and the new planned floors, as described in P01. It cannot be
implemented by passing an ignored field through today's `TaskInput` API.
Current source graph edits remain in task predecessor arrays; revised floors
are in this new section. On final-edge removal, an explicit legacy manual
clear/change is included if necessary, never an invisible reactivation.

Each `ReviewTransaction` proposes these minimum fields:

- Stable transaction ID, operation kind (initial seed/completion review/start correction),
  source project ID, expected source revision/fingerprint, review date/timezone,
  recordedAt, optional actor, and working-plan revision IDs before/after.
- The triggering completion event ID, if present. A completion reuses existing
  attestation/snapshot fields; capture its historical finish before any review
  edits. A `ReferenceContext` links it to legacy or revised commitment and
  revision ID. If the working finish is Unknown, omit a claimed finish snapshot;
  never substitute baseline/current PA. Existing events are never overwritten.
- Per-task decision ID and outcome: keep dependency/revise later, sever with
  reason, keep commitment, advance, record actual or retain unresolved. Name
  all triggering predecessor IDs and all new status/start-event IDs.
- Immutable before/after snapshots for affected task graph edges, legacy
  manual fields if changed, planned start/finish (or explicit Unknown), active
  start-event references, reasons, normalized requested dates and bound sources.
  Include accepted calendar/rule version and project finish before/after with
  precision/uncertainty, so old decisions are not reinterpreted by today's calendar.
- Explicit unresolved items and their reason. Later resolution appends a new
  transaction linked to those IDs; it does not edit the earlier review.

The initial-seed transaction retains the verified legacy task/schedule/calendar
snapshot and decision IDs from which the first constraints/commitments can be
replayed. Every later accepted document write, including task/calendar edits
outside a review, increments `documentRevision` and checks the whole source
fingerprint. An absent new section has implicit source revision0; do not
pretend an unrelated dirty source still matches the opening review revision.

Snapshots are decision evidence, not extra baselines. The initial baseline
object retains its exact accepted fields, ID, establishedAt, original calendar,
tasks and schedule. New validators must continue interpreting it with its
original WP1 rules. A content digest may detect accidental change; it is not
a signature or tamper-proof guarantee. Reject replacing a known baseline for
the same project identity during save/import; surface conflicting copies for
explicit recovery, never rebaseline. A different project's own baseline stays
its own reference. Baseline-absent legacy files remain absent until explicit
first establishment under the existing eligibility rules.

## Integrity, identity and lifecycle

Validate a whole candidate: legacy inputs/graph, new constraints, all dates,
statuses/criteria, actual-event replay, transaction membership, reference
contexts, baseline equality, ID counter and size. A journal cannot claim an
edge removal absent from its before snapshot or add IDs via duplicated history.
Reconstruct current new-section state from valid decisions and compare to
stored current constraints; reject mismatch instead of trusting duplicated caches.
Fingerprints must include every durable new field and journal order. No React
derived summary, UI queue cursor, PA As-of preference or red extension is saved.

Future deletion of a task with these records requires archived identity and
retained evidence, explicit confirmation and active-edge cleanup. Existing
progress currently rejects orphan events and deletion purges them; an archive
aware validation boundary must distinguish active state from historical
references before such deletion is enabled. Preserve related legacy status
evidence in the archive contract; do not append new dangling task references
to the old schema1 active decoder. Until approved/implemented, block deletion
of referenced tasks. Numeric allocation must exceed current, baseline and
archived T IDs. Copies get fresh IDs, no Actual Start or review events; old
review snapshots never attach to the copy. Sort/reorder never changes identity.

The proposed archive contains that task's final source inputs/name, optional
current progress/checklist, its unchanged legacy status events and optional
work entries/remaining estimate, plus deletion metadata. Validate them in an
archive-aware boundary rather than leaving orphans in active progress/work
sections. Actual Start and review events keep their existing IDs/references.
No active schedule task is reconstructed from a tombstone, and restoring one
is outside this package. This proposed retention replaces current deletion
purge behavior only if P11 is explicitly approved.

## Formats1-5 and upgrade effects

| Input | New-reader behavior proposed | Save/export/older reader effect |
| --- | --- | --- |
| Format1 | Existing plan; no baseline/work/progress/forecast invented. Actual Start Unknown. | Explicit v6 upgrade only; retain original compatible copy. |
| Format2 | Preserve established baseline exactly; no actual evidence inferred. | Same upgrade/backup gate, baseline stays schema1 under legacy interpretation. |
| Format3 | Preserve optional logs and null/zero remaining. Logs do not seed start. | No work migration into history. |
| Format4 | Preserve every status event and completion snapshot; missing committed-finish reference remains missing. | Do not infer Actual Start from first In Progress event or fabricate historical commitment. |
| Format5 | Preserve forecast settings/As-of, existing events and optional historical commitment dates. | FF settings unaltered; new section only after explicit v6 upgrade. |
| Format6, no new section | Valid versioned file with no new facts; legacy semantics usable. | Old app rejects version6, rather than dropping facts. |
| Format6 with new section | Validate and replay new records atomically; failed input leaves open/saved project unchanged. | Export6 round-trips all durable fields. No silent down-export5. |
| Unknown future version | Reject without partial import/mutation. | Preserve source file; never downgrade by stripping fields. |

Opening/importing old data does not overwrite its saved source or perform
backfills. First new fact/revision requires an upgrade preview, a compatible
backup offered before overwrite, and explicit consent. Prefer Save As to a
new-format copy. Preserve original raw text if available; otherwise label a
known-fields original-format export honestly, without claiming byte identity.
A download-start message cannot prove the user retained a backup; require
explicit acknowledgement or keep the old named copy intact.

## Browser storage, atomicity and recovery proposal

Use a **new** `react-gantt-chart:projects:v2` key/wrapper for future format6
records. Read v1 as legacy/read-only for copy-upgrade and leave its raw bytes
untouched. No automatic whole-library migration or in-place v6 write into v1.
Label same-name v1/v2 copies distinctly. Older releases continue using v1;
they cannot read imported v6 JSON. This avoids today's all-library failure
on one unsupported plan (see [current reader](../../../src/persistence/localProjects.ts#L22)).

For the recommended Apply-and-save policy, serialize/validate the complete
candidate and v2 library before the one key write. Acquire an exclusive
same-origin v2 writer lock and recheck source revision under that lock; reject
stale review. An unlocked read-then-write is not compare-and-swap. If the
approved browser cannot provide coordination, block this durable apply with
an explanation/read-only path; do not claim multi-tab safety. Choosing a
different backend/coordination fallback is separate implementation scope.

A single `setItem` failure leaves the old key value; do not set React accepted
state first. On quota/security/validation failure retain the draft and original
accepted state for retry/cancel. Do not write a second baseline/journal key
whose failure could split the transaction. After successful durable write,
publish one candidate state and saved fingerprint. If the tab crashes between
write and publication, reload that transaction ID from v2; retry must detect
the already-applied ID and not duplicate a completion. No auto-replay of an
unfinished draft after reload. Backup download and storage write cannot be
one browser transaction; retain old copies and state those limits explicitly.

This is a proposed new save path, not a guarantee of the current app or a
distributed transaction system. Baseline preservation, replay validation,
rollback, crash recovery, concurrency, format matrix and all unchanged-model
regressions must be implemented/tested in a later approved package.
