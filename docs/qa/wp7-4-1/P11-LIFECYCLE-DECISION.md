# P11 - Historical identity and the phase-one lifecycle

**Established intent:** preserve baseline, actual evidence and stable IDs;
copies must not inherit another task's history. **Deferred decision:** P11.
This is a recommendation, not approval of archive retention or new delete UI.
See [WP7.4 lifecycle proposal](../wp7-4/POLICY-PROPOSALS.md).

## Current behavior and alternatives

[Current deletion](../../../src/App.tsx#L320) removes the task, outgoing links,
its active work/progress/history and display metadata after warning, while
keeping baseline. [Progress decoding](../../../src/progress/taskProgress.ts#L52)
rejects orphan current-task events. Baseline independently retains historical
task IDs and original allocation counter. Sort order and names are not identity.

| Option | Benefit | Risk / decision |
| --- | --- | --- |
| Apply current purge to new evidence | Familiar delete behavior, less retained personal data. | Would erase Actual Start/correction/review reasons or leave invalid event references. Reject recommendation for new evidence. |
| Full archive/tombstones now | Task deletion remains usable, history survives under archived identity. | Requires archive-aware status/work/criterion/graph validation, privacy/export/restore policy, size bounds and ID rules. Too large for the first slice. |
| Block referenced deletion first (recommended) | Small, independently testable guard; no new orphan/archive model. | Some tasks cannot be deleted until a later archive package. Must explain exactly what references block and how to export safely. |

## Exact proposed phase-one guard

Before accepting deletion, compute the reference set from **existing accepted**
new evidence: every Actual Start event (including superseded/retracted claims),
every reviewed task or explicitly named predecessor in a retained guided
decision, and every new Reviewed completion context. If the task is in that
set, reject deletion with IDs/reasons and a link to its history. Do not offer
"delete history too" or create an orphan; export does not grant deletion.

Current working floor/commitment membership alone does not block every task.
An initial-seed snapshot or a section's historical before-value is a reference
valid **at that snapshot**, not a live task requiring a tombstone. It retains
identity/name within the journal and validates against the then-current core.
It is distinct from direct ongoing event/decision references above. This
distinction needs explicit P11 approval, not an undocumented exception.

An unreferenced task can use the existing disclosed active-data purge, but
only as one validated SourceEdit transaction: remove active task/edges/work/
progress, remove its current floor/commitment, preserve counter high-water mark,
preview affected successors and explicitly resolve retained root manual values.
If deletion changes another reviewed promise, all resulting changes require
confirmation. Do not create new guided fact references to the deleted task
as part of that operation; before/after source snapshots already explain it.

Historical source snapshots can retain copies of old work/status/name data
even after active purge. This is not a privacy erasure operation. Explain that
limitation before enabling v6, retain the10MiB file limit and stop a save that
would exceed it; never prune history silently. A later archive design must
address sensitive names/notes, storage growth, export visibility and whether
any redaction is allowed without breaking attestations. Browser deletion of
an entire saved copy remains a separate disclosed action, not rebaselining.

If this reference distinction is rejected, the safe narrower capability is
to disable task deletion for all v6 plans until archival is approved. That
alternative costs usability but must not be replaced by a silent purge.
Legacy formats1-5 retain today's behavior until explicitly upgraded.

## Duplication contract

Preserve today's source-field copying: name copy suffix, description, positive
duration, predecessor IDs and independent DEFAULT/MANUAL input. Preserve fresh
unchecked criterion IDs, Not Started, no blocked reason/status events/work
logs, and the existing one-time remaining-effort seed; this does not authorize
person-hour/slot conversion in projections. [Current implementation](../../../src/App.tsx#L207)
and [copy helper](../../../src/taskManagement.ts#L34) are the compatibility reference.

New copy rules: fresh task ID, no Actual Start events, no review/completion
contexts and no source revised not-before floor or promise. Show the copied
source graph/manual fields in a new-task preview, propose a current/future
floor and calculate its commitment through P01. The student confirms that
new promise; there is no hidden inheritance of a previously revised floor.
An inactive manual value remains inactive with predecessors. Removing copied
predecessors later follows the same root-manual review rule as any task.

No current copy options grant history transfer; a future option to copy a
revised floor would need explicit review and cannot copy actual evidence.
Allocation never reuses numeric T IDs: counter exceeds current and baseline
IDs and every historical allocated ID in new journals. Copy/sort/rename cannot
attach an original's past dates to another task. Duplicate then cancel does
not consume/publish an accepted ID or alter the saved counter.

## Tests and implementation risk

Test blocked deletion for active/corrected/retracted starts, incoming/outgoing
review references and completed contexts; no mutation on refusal. Test allowed
unreferenced deletion, seed-only history, retained baseline IDs, pending drafts,
affected joins/root manual activation, counter overflow and copy/cancel/reload.
Every surviving reference resolves in its correct active or historical scope.
No archival or restore is implemented by this contract. See lifecycle rows in
[ACCEPTANCE-TEST-MATRIX](ACCEPTANCE-TEST-MATRIX.md).

The principal risk is calling a historical snapshot an orphan or treating
all copied task fields as consent to copy its commitments/history. The guard
and identity scopes must be approved before any public v6 delete path exists.
