# Format6 impact - proposed6.0-B, not a deployed migration

The [6.0-A proposal](../wp7-4-1/FORMAT6-CONTRACT.md) was pending P09-F/P09-S,
not implemented. Current [codec](../../../src/persistence/projectFile.ts#L15)
still writes5 and reads1-5. This document explicitly proposes6.0-B amendments;
it does not silently accept/alter A, real files or accepted domain logic.

## Material clashes and recommended resolutions

| Earlier proposed mechanism | Clash with new architectural direction | Proposed6.0-B resolution / owner gate |
| --- | --- | --- |
| Header.destination contains browser entryId/name; intent binds destination | Domain history/portable hashes depend on one adapter's routing. A DBMS import would need to rewrite old intent or masquerade as the browser destination. | Remove destination from new domain operations; routing/create intent lives in repository requests/receipts. Preserve attested historical content; new file profile must be approved. |
| entryRevision equals documentRevision but both appear independently writable | Two counters could disagree after restore/import or backend change. | One semantic snapshot.logicalRevision. Port refs/indexes derive it, never increment separately. Physical layout/DB row versions are private. |
| Each transaction record increments revision; virtual Seed1+Review2 in one save | Two counters for one accepted project revision and ambiguous history grouping. | One AcceptedRevisionGroup per accepted domain change, containing ordered Seed/Review/other operations. Group1 can contain the whole first upgrade/review. |
| SaveCopy appends a domain revision | Merely transferring identical content creates artificial project changes and changes fingerprints. | Save As/import creates a new repository resource/receipt while preserving logical revision/history. Domain edits increment once; transport copy does not. |
| Source hash covers portable savedAt/format/destination | Re-export time or adapter layout changes the optimistic concurrency reference. | Hash canonical normalized snapshot; exclude export envelope, routing, labels and receipts. Keep actual event timestamps and domain evidence inside the hash. |
| Strong no-change promise for every failure/cancel | Remote response loss after commit cannot prove no persistent change. | Known rejection/pre-dispatch cancel is NotCommitted; post-dispatch uncertainty is OutcomeUnknown. Reconcile exact same request. Owner confirmation required. |

None conflicts with accepted immutable baseline or the accepted unused
WP7.4.2 evaluator: that module consumes a working read model and has no file/
repository dependency. P09 mechanisms were deferred; these new amendments
remain Pending. The cancellation qualification is an unavoidable distributed
outcome limit, explicitly surfaced rather than called a guaranteed rollback.

## Exact revision/identity mapping proposal

| Concept | Shared/portable meaning | Physical/transport meaning |
| --- | --- | --- |
| Existing root project.projectId | Stable lineage ID, unchanged in original baseline. Task/criterion/event/working revision IDs unchanged. | Not a browser key or authorization proof. |
| RepositoryProjectId | Stored-copy handle within repository namespace; absent from portable domain state. | Browser record identity or future API resource ID; assigned once on create. |
| logicalRevision | One authoritative safe integer, last accepted group number. Same snapshot imported elsewhere retains it. | Indexed/cached revision must equal it. No second writable entryRevision. |
| WorkingState.revisionId | Identifier of reviewed working commitments, not a project-wide counter; can remain unchanged across an effort-only project revision. | Never substitute for repository expected ref. |
| Schema/model/layout versions | Portable root6, proposed planning subversion2, normalized model1 are compatibility discriminators. | Browser wrapper layout2 or API protocol versions do not advance logicalRevision. |
| Receipt | Repository-local idempotency proof for create/commit request. | Saved atomically with accepted snapshot; not exported as old authorization/routing. |

Normalize6.0-B into `{modelVersion:1, logicalRevision, state, history}`. `state`
contains the known domain sections and original baseline; `history` contains
ordered accepted groups/operations. The portable file maps its
`guidedPlanning.documentRevision` to logicalRevision **once**, with grouped
history replacing A's transaction-per-counter assumption. There is no duplicate
current counter inside state. Final group number must equal logicalRevision;
groups and appended evidence replay to the accepted state. Ordinary commits
require candidate revision exactly expected+1. No-op repository retry or file
export increments it. New review/correction requires a new group/ID.

Initial format1-5 copy-upgrade seeds logical1, with ordered source Seed and
optional completion/dependency/Unresolved operations accepted together. The
pre-completion seed working reference remains retained in that group; snapshot
lateness compares against it, not the final revised promise. Cancellation does
not persist Seed separately. Import of an existing B revision17 creates a new
repository resource already at17; next domain change is18. The fingerprint
matches across adapters for the same normalized snapshot.

## Fingerprint and validation boundaries

Proposed profile `snapshot-c14n/1` retains A's deterministic JSON-value approach:
recursively sort own object keys by specified UTF-16 order; preserve all array
order, Missing versus null, exact strings/IDs and finite numeric values;
serialize primitive values consistently and hash UTF-8 with SHA-256. The exact
cross-language byte algorithm and golden vectors must be frozen/tested before
codec/backend implementation. It is a shared representation utility, not
browser storage logic, a signature or authentication mechanism.

Hash the full normalized snapshot, including logical revision, actual/status
events, criteria snapshots, decisions, working commitments, baseline, effort
and settings/history. Exclude portable format/exported savedAt/createdBy,
repository IDs/labels, caches, receipts, URL/auth metadata and UI preferences.
Do not exclude actual recordedAt/effective dates. A group's previousFingerprint
points only to a preceding snapshot, never to itself; compute current digest
outside the snapshot. Reconstruct historical groups using explicit array
sequence, not effective-date/recordedAt sorting; tied timestamps remain valid.

Portable codec validates JSON/schema/version/size; snapshot mapping validates
round-trip equivalence; pure domain guards validate graph/events/commitments,
append-only prefixes and full baseline equality. Repository repeats validation
against its accepted target; API server must not trust a client checksum or
"validated" brand. Physical adapters can normalize records but must reconstruct
the same snapshot and fingerprint. No adapter changes scheduling/PA/FF/CPM.

## Baseline guarantees and honest limits

Preserve full original baseline value, ID, establishedAt, calendar, frozen
inputs and original WP1 interpretation, including inert opaque legacy extras.
Compare canonical whole-baseline bytes as well as known domain semantics.
No save/import/correction changes that value or substitutes a new working plan.
Missing baseline stays missing unless explicitly first established under the
existing policy; it cannot erase an already known baseline for the same lineage.

Within one cooperating repository namespace, first-baseline adoption/known
lineage validation must be serialized with create/commit. A conflicting known
copy rejects; never choose a baseline by newest savedAt or earliest claimed
timestamp. A whole-library browser critical section can check known resources;
a future server must enforce the corresponding invariant transactionally.
This does not authorize editing multiple projects in one command.

For an unknown imported lineage, the application can validate/freeze the
reported reference but cannot prove it was historically the first baseline
outside available trusted data. Checksums are not cryptographic protection
against someone editing both data and checksum. Concurrent old-v1/manual
writers do not honor new coordination; no global guarantee across profiles/
repositories/devices is claimed. Conflicting known sources require recovery
review, not rebaseline. These are integrity-boundary limits, not permission
for an adapter to overwrite an established baseline.

## Migration and portability acceptance

| Input/operation | Required future behavior |
| --- | --- |
| Formats1-5 | Existing decoder semantics retained; no invented starts/history/forecast or historical snapshot. Explicit format6 copy-upgrade; old source/file/v1 record still usable. |
| Raw backup | Retain original imported File/bytes or saved v1 raw source; a reformatted known-fields export is not a byte-exact original backup. Download and repository save are separate operations. |
| Format6 B export/import | Preserve lineage/task/event/working IDs, groups/logicalRevision, all evidence and baseline; use new resource ID/create receipt in destination. Routing/labels are not history. |
| Same lineage, conflicting/missing known baseline | Reject atomically for recovery. No ID rewriting to bypass original-baseline comparison. |
| Malformed, unsupported future/subversion, lossy down-export | Reject without accepted-state mutation. Preserve original bytes; no stripping new fields into5. |
| Unofficial6.0-A planning1 draft | Reject as unsupported rather than guess physical commit grouping or rewrite old digests. No production A files exist. A future explicit bridge would need provenance/group mapping and retained original, not a timestamp heuristic. |

Propose planning subversion2 for B so any A-shaped draft is distinguishable.
The new complete schema/replay vectors require owner approval and a later
private codec slice before public reading/writing. Original baseline raw-source
bytes and canonical semantic bytes are distinct invariants: export whitespace
may differ, while source backups and baseline JSON value remain preserved.
No v6 decoder, new persistence key or migration is built in this package.
