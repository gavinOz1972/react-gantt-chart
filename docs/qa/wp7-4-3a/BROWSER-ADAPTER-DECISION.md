# Initial browser adapter - private layout and fail-closed coordination

Accepted in principle: browser first, repository-independent domain and whole
project optimistic concurrency. Pending mechanism recommendation: keep one
isolated library key initially, behind [the port](REPOSITORY-CONTRACT.md), and
measure/replace the adapter later. No key or repository is created here.

## Compare physical options

Let N be stored projects, S the sum of snapshot/receipt bytes and P the changed
project size. For illustration, eight1MiB snapshots plus receipt overhead:

| Option | Commit/read cost and failure boundary | Compatibility/migration cost |
| --- | --- | --- |
| One new library key (recommended first) | Read/validate/encode O(S), write about8MiB per1MiB project change: roughly8x payload amplification before overhead. One setItem includes project, receipt, creation identity and any adapter indexes. Malformed outer JSON can obstruct the whole library. | Smallest extension of the pending P09-S design; one cooperative writer lock. A10MiB private total cap rejects twelve1MiB projects even if the environment allowed them. No current production v2 data exists to convert. |
| Per-project localStorage keys, derived discovery index | Project write O(P), but directory/name/receipt lookup and known-lineage baseline checks may still require O(S) scans/global coordination. One corrupt record need not obstruct loading others. | An authoritative persisted catalog plus record would need multiple key writes; Web Locks do not make them atomic. A rebuildable catalog avoids that promise but needs crash/list/create-ID/name/baseline reconciliation tests and more code. Not the first small slice. |
| IndexedDB transactional adapter | Can atomically maintain project/receipt/catalog state without a whole-library replacement. | New schema lifecycle/blocked upgrades/transaction/failure tests; not an implicit localStorage fallback. Useful later alternative behind the same port. |

Numbers above are arithmetic examples, **not measurements of quota or latency**.
Actual browser quota can be lower than configured caps. The private first
adapter keeps a10MiB whole-library encoded limit; portable file limits are
separate. Limits/StorageFailure(CapacityExceeded) do not become domain scheduling
rules or a future DBMS-wide quota. If expected classroom use exceeds that
bound, choose a separately tested transactional adapter before public activation.

Shared port semantics do not require one JSON blob, a global browser lock or
one key in a DBMS. This layout choice trades initial implementation size for
write amplification and correlated storage failures; it is not a backend mandate.

## Proposed private envelope

Key proposal: `react-gantt-chart:projects:v2`, untouched v1 alongside it.
Private wrapper `layoutVersion:2` contains resources keyed by opaque repository
ID. Each record has display label, normalized snapshot and create/commit
receipt metadata. Current ref is derived from snapshot.logicalRevision and
semantic fingerprint. There is no independently incremented entryRevision.
Any cached hash/ref must be revalidated against the snapshot before use.

Resource IDs, labels, layout version, key names, receipt indexes, whole-library
cap and lock name are adapter-private. No portable domain transaction names
an entry key. Duplicate display labels are proposed allowed, disambiguated by
repository ID/origin in later UI. This differs from current v1's unique save
names and pending6.0-A's proposed v2 policy; existing v1 behavior stays unchanged.

Under the shared exclusive lock, read fresh raw library, validate accepted
target and relevant known-lineage baseline, check receipt/expected ref, merge
unchanged resource records, validate complete candidate, encode/size-check and
perform **one** setItem. Do not write snapshot and receipt to separate keys.
No accepted React setter or user prompt belongs inside this operation. Reads
and lists validate data; malformed/unsupported data is never silently erased.

## Exact race analysis

Both tabs load resource R at revision7/hashH7 and prepare different whole
revision8 snapshots, even if edits touch different tasks:

1. A acquires the cooperative library writer lock. B cannot enter the write
   critical section: a no-wait request returns Busy/NotCommitted.
2. A re-reads7/H7, checks transaction receipt and baseline, then one key write
   accepts8/HA with its receipt. Only after success may A publish accepted state.
3. B deliberately retries, acquires lock, re-reads8/HA. Its new transaction's
   expected7/H7 does not match: Conflict(StaleRevision), no overwrite. No merge.
4. If B instead retries **A's** exact transaction/request after a lost response,
   receipt matching returns AlreadyCommitted, not another revision.

Different-resource commits still use the library lock to avoid lost library
updates; each reads/merges fresh state. Two same-name Save As requests with
different create IDs produce different resource IDs. Same create ID/same digest
finds the existing resource. A changed digest conflicts. No source file/v1 copy
is overwritten by creating a new v2 copy.

## Lock availability matrix

Exact proposed private API is
`navigator.locks.request('react-gantt-chart:projects:v2:writer',
{mode:'exclusive',ifAvailable:true}, callback)`. If callback receives null,
return a retryable StorageFailure(Busy, NotCommitted). All v2 writes cooperate;
no `steal`, timestamp election or unlocked read-then-write fallback.

| Context / observation | Mutation policy |
| --- | --- |
| Feature available, secure/trusted context, acquired lock, storage usable | Execute locked compare/validate/one-write protocol. |
| Lock busy | Do not spin/wait indefinitely. Return Busy; retain draft and offer deliberate retry. |
| API missing, restricted/insecure context or coordination error | Unsupported(ConditionalWriteUnavailable); no write. Accepted-data read/export only if available. |
| Storage get/write denied or quota exhausted | Known pre-write failure; no accepted publication. Do not infer usable quota from a previous probe. |
| Holder tab closes | Release is asynchronous; temporary Busy can remain. Do not assume immediate availability. |
| Noncooperating code/devtools/other old app writes the key | Outside coordination guarantee. A lock is not protection against manual storage editing. |
| Other origin/port/profile/device | Separate state/coordination scope; no cross-context concurrency promise. |

The [Web Locks draft](https://www.w3.org/TR/web-locks/) specifies cooperative
requests and asynchronous no-wait acquisition. The
[HTML storage standard](https://html.spec.whatwg.org/multipage/webstorage.html)
does not supply assumed locking for shared localStorage. These support the
fail-closed recommendation; they are not a browser certification. Prior
[WP7.4.1 observations](../wp7-4-1/evidence/storage-spike.json) cover one
Chromium156 loopback context, including asynchronous holder release, quota and
opaque-origin denial. They are reused as historical evidence, not rerun here.
Firefox/Safari/branded Edge/mobile/managed/private profiles and deployed HTTPS
remain unverified for this adapter until their native contract tests pass.

## Crash, migration and future layout changes

One successful key write followed by a tab crash before React publication
still has its project/receipt in storage. Reload by stable resource ID or retry
the same create/commit transaction; distinguish old committedRef from a newer
currentRef. Do not write an old candidate back merely to match the UI.
Storage clearing, eviction or power/disk failure are not protected by Web Locks;
retain exported backups. A reported post-write rendering error does not mean
the write failed.

Keep v1 raw bytes unchanged during an explicit copy-upgrade. A download is
not atomic with storage. Unsupported/failed/cancelled upgrade preserves source
and accepted state. Concurrent legacy-v1 editing is not coordinated by a v2
lock; recheck captured source/warn, never claim cross-key atomic migration.

If a later per-project layout is approved, converting N resources requires N
new record writes plus validation/discovery work, O(S) bytes overall; it is not
one atomic repository-wide migration. Prefer explicit copy/verify with original
library retained and a resumable migration manifest outside domain history.
No automatic destructive conversion or invented DBMS layout follows this design.
The migration plan and any new adapter must pass the same semantic suite first.
