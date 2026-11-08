# Proposed import/export, compatibility and recovery policy

No upgrade/codec is implemented. Current [public decoder/writer](../../../src/persistence/projectFile.ts)
still reads1–5 and writes5. Schema6 and this exact profile require explicit
owner acceptance and later private codec/integration work before public use.

## Legacy field mapping without invented evidence

| Source field/version | Proposed format6 mapping | What remains unavailable |
| --- | --- | --- |
| Project/task fields, dependencies, whole duration, IDs, allocation/order/sort/copy origins (1–5) | Exact decoded meanings into Current; fill only documented old-version order/default behavior, preserving raw source separately. | No inference that a planned start/finish was actual or a newly reviewed commitment. |
| Baseline (2–5 when present) | originalBaseline Present, WP1-v1, complete original JSON including opaque extras; validate known original interpretation. | Do not establish a missing baseline, re-run current inputs to create one, change its project ID or replace its stored schedule. |
| Work logs/remaining (3–5 when present) | Preserve entry IDs/order/contributor/dates/hours/createdAt/updatedAt/descriptions and stored remaining/null. Expand omitted remaining map entries to explicit Unknown(null) only. | Empty/missing logs mean no recorded data, not zero historical work. No scheduled-hours-to-effort conversion or automatic remaining deduction. |
| Progress/criteria/events (4–5 when present) | Preserve four statuses, guidance/checklists, blocked reasons; wrap original status events as LegacyStatus with stable ID/payload. Current status fields project from validated old state. | No missing pre-v4 transitions, completion attestations, actor or Actual Start may be manufactured. |
| Known legacy Complete event | Inline completion date/attestation from last active recorded completion; committedAtCompletion LegacySnapshot only if its saved field exists, otherwise Unknown. Link exact corresponding event ID. | No invented historical workingRevisionId or saved committed finish from today's plan. |
| Reopened task | Current completion Unknown, all old completion payloads retained in history, first Actual Start still Unknown unless explicitly recorded later. | Old completion is not a current dependency release or restarted schedule. |
| Earlier files without progress | Explicit existing legacy default Not Started/empty criteria/guidance with origin limitation; actuals Unknown for every task. | Default Not Started is inherited application state, not proof no work ever happened. |
| Forecast settings (5 only) | Preserve assumptions and optional As-of exactly; otherwise null(unconfigured). | No forecast output/health/slack or today's derived date is persisted as fact. |
| Actual Start/working plan | Actual Start Unknown. Working Unreviewed; optionally retain the legacy WP1 plan as a clearly unreviewed reference, never a fabricated reviewed W. | No Actual Start from earliest log/In Progress event and no changed future working promises without a later review. |

Use Partial history for legacy upgrades, even when all surviving old status
events are present: old versions did not record every source/effort/dependency
edit and can remove deleted-task records. Record limitations explicitly. Imported
legacy event sequence can mechanically follow saved array order, starting1;
recordedInRevision stays null. This is new ordering metadata, not a claim of
historical save revisions. Recorded/effective dates stay unchanged. New logical
revision starts1; upgrade plus confirmed review, if later explicitly allowed,
is one accepted revision, not a persisted Seed followed by another save.

Origin retains sourceVersion/sourceSavedAt, SHA-256 of the exact raw source and
the real copy-upgrade timestamp. It does not invent original createdAt/actor.
Current self-contained state carries necessary facts independently of old
events; old absent metadata uses explicit Unknown/null with a reason.

## Source preservation and explicit copy-upgrade

1. Capture the exact selected UTF-8 file bytes or stored legacy raw string and
   source identity before validation. An existing known-field serializer is not
   a byte-exact original backup. Retain the original; record its raw digest.
2. Validate legacy known semantics; separately check profile representability,
   duplicate names/ID collisions and inert opaque values. A file accepted by
   an old last-key-wins parser can still be ambiguous for strict copy-upgrade.
   Reject the upgrade, preserve the source and explain the incompatibility.
3. Build a detached complete candidate with the mapping above. Show version/
   Unknown/Partial implications before confirmation. No original is modified.
4. Export/download a copy or create a separately named repository resource only
   after the relevant later flow is authorized. Physical storage layout remains
   independent of portable envelope shape. Download and repository create are
   separate operations; do not call them a cross-medium atomic transaction.
5. Known baseline/lineage comparisons reject conflicting copies or absence that
   would erase a known baseline. Never change a lineage ID to bypass this guard.

If old opaque JSON is not safely representable, keep it in its original format
and retain the backup. Do not strip extras, round unsafe integers or stringify
values to make a format6 checksum pass. A migration/recovery amendment needs
explicit owner review and must preserve original source bytes.

Unknown legacy fields outside the explicitly preserved baseline/LegacyStatus
opaque islands block this proposed copy-upgrade. Raw backup retention does not
justify silently omitting unknown active fields from a new working document.
Any broader inert-legacy container needs an explicit contract amendment.

## Format6 copies, repeat imports and revisions

Portable lineage/task/event/claim/working IDs and logical revision survive
export/import. A copied file at17 stays17, even in another repository. Its new
stored resource ID is assigned by repository.create; transport receipts do not
travel. Duplicate labels are allowed and never select an overwrite target.
An identical imported snapshot has the same D despite new exportInfo. Repeated
import is not automatically a retry: an explicit new create transaction may
make another copy; exact retry of one staged create must return its original
receipt. Never turn a source-bound pending commit into a destination command.

Two branches of the same lineage can both be at18 with different fingerprints;
neither is inherently newer by timestamp/name/counter. Keep separate copies and
explicitly resolve conflicts; no automatic merge or name-based overwrite.
Replacing an explicitly selected accepted resource requires its expected ref
and invariants, not simply a valid imported digest. This package activates none
of these flows.

## Rejection, interruptions and recovery

| Situation | Required future behavior |
| --- | --- |
| Unknown schema/profile/integrity profile/new field/kind | Unsupported, keep current project and raw file. No optimistic reader or field dropping. Unofficial6.0-A/6.0-B drafts require a separate explicit bridge, not guessed replay conversion. |
| Missing current field, duplicate IDs, corrupt digest or linked contradiction | Typed rejection before accepted publication. Never regenerate state/baseline from history to "fix" it. |
| Missing old history but otherwise complete snapshot | Partial/Unknown with clear limitations is valid; no artificial events or claims of complete audit. |
| Cancel before dispatch or validation/write definitely fails | Source/backup/accepted target unchanged; retain detached candidate for correction/retry. |
| Crash before a new copy is committed | Original remains usable; no half-migrated source. Reopen/validate a complete backup. |
| Write may have committed but acknowledgement lost | OutcomeUnknown; retain exact create/commit transaction and reconcile by retry/load. No claim that cancellation or retry with a fresh ID rolls back the write. |
| Export/download interrupted | Original/accepted repository remains unchanged. Incomplete new file rejects on next open; do not delete the last good backup. |
| Downgrade to format5 would discard facts/W/history | Reject lossy down-export. Offer the original legacy backup for the old release, explicitly lacking later edits, or use a reader for the accepted new profile. |

No storage key/library migration, destructive replace or automatic schema
activation is part of this document. First-baseline/raw-backup guarantees and
future adapter power-loss limits are distinct and must be tested separately.
