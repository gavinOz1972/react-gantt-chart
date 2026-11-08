# P09 - Versioning and the durable write boundary

**Established intent:** immutable baseline, compatible old data, no partial
review. **Deferred mechanism:** P09. Recommend candidate
[format6 6.0-A](FORMAT6-CONTRACT.md), isolated v2 library, explicit Save As
upgrade and cooperative Web Locks. None is authorized for production yet.

## Exact library and coexistence proposal

Keep `react-gantt-chart:projects:v1` byte-for-byte unchanged. Use a new key
`react-gantt-chart:projects:v2` whose only fields are:

```ts
{
  schemaVersion: 2,
  projects: [{
    entryId: Id, name: string, entryRevision: positiveSafeInteger,
    payloadSha256: Hash, plan: File6
  }]
}
```

entryRevision equals plan.guidedPlanning.documentRevision; payload hash is
SHA-256(C(plan)) under the candidate contract. Names are trimmed1-120 characters,
unique only within v2; entryId is a fresh stable ID independent of name/projectId.
Do not truncate an old long project name: collect a separate valid copy name.
Same project identity may have multiple saved copies, each an independent
entry; preserve its baseline and history. Lists explicitly label **Legacy v1
original** versus **v2 working copy**, including name/entry ID where ambiguous.
No automatic "newest wins", cross-key rename or overwrite by matching name.

Bound the proposed whole-library UTF-8 payload to10MiB as well as each portable
file. Physical quota may be smaller. Reject size excess before write without
pruning other entries/history; allow accepted-data backup and deliberate copy
management. Parsing/serialization within that bound still needs measured
performance; no50ms guarantee follows from the limit alone.

Save As upgrade previews the chosen source snapshot, compatible backup and
destination name. Confirm creates only the new v2 entry. Cancel/failure leaves
v1, v2 and accepted memory unchanged. First v6 import/save requires full codec,
reference guards and edit gates; do not enable public v6 parsing prematurely.
Later Save Copy retains the whole journal and appends a SaveCopy transaction,
not a fresh seed or reset of history. New entry revision follows the document's
revision; it need not start at1 when copying an existing v6.

For an imported source, retain its original File/ArrayBuffer for a byte-exact
compatible backup; do not promise byte identity after parsing/reformatting JSON.
For a saved v1 copy preserve its raw stored value. A known-fields fallback
export must be labelled as such if the original source bytes are unavailable.

Older apps still use v1 and reject v6 JSON. Current [library validation](../../../src/persistence/localProjects.ts#L22)
rejects the whole old library if even one record is unsupported; never put6
into v1. The diagnostic confirms that existing behavior. A v1 writer does not
honor the new lock; upgrade copies the explicitly captured source, never
pretends to atomically migrate two keys. Re-read/warn if the legacy source
changed, but no cross-key atomicity is claimed. Original raw source/backup
retains unsupported legacy extras; v6 preserves its full accepted baseline.

## Coordination API and browser qualification

Exact proposed API:

```js
navigator.locks.request('react-gantt-chart:projects:v2:writer',
  { mode: 'exclusive', ifAvailable: true }, lock => {
    if (!lock) return { kind: 'Busy' }
    // Re-read library, recheck source, validate/serialize, one setItem.
    // No network, prompt or user wait inside this callback.
  })
```

Use one lock for the entire library key, not one per project, so concurrent
saves to different entries cannot lose each other's library edits. Every v2
writer, including Save/Delete saved copy, must cooperate. Do not use `steal`.
If unavailable/insecure/denied, fail closed for new durable apply: keep the
draft, allow read/backup of accepted data, and explain supported-context needs.
No fallback to an unlocked localStorage timestamp, BroadcastChannel election
or read-then-write "CAS". Alternative: separately approved IndexedDB transaction
adapter, with its own migration/failure contract; not an incidental fallback.

The [Web Locks draft](https://www.w3.org/TR/web-locks/) describes cooperative
locking within a storage bucket and automatic release when the callback
finishes. It is not a security boundary over storage. The
[HTML storage specification](https://html.spec.whatwg.org/multipage/webstorage.html)
warns that shared localStorage has no assumed locking mechanism; quota and
access failures remain possible. These sources do not establish support in
every browser/profile used by students. The inference here is to require
feature detection plus an approved browser matrix, rather than infer safety
from the existence of localStorage alone.

Observed: the isolated Chromium156.0.8078.4 loopback context reports secure
context and navigator.locks.request. Two cooperating tabs exclude writes;
closing a holder releases the lock asynchronously. Immediate retry can still
be Busy. UI should show Busy and offer deliberate retry/rebuild; do not spin
or freeze. Diagnostic's bounded queued wait is an observation tool, not the
proposed production no-wait acquisition. Firefox, Safari, branded Edge,
mobile, managed/private profiles and deployed HTTPS remain **unverified**.
Public support requires running the acceptance matrix there or explicitly
narrowing supported contexts. Do not assume loopback127.0.0.1, localhost and
another port share locks/storage; they are distinct origins.

## One-write protocol and failure matrix

Prepare immutable candidate/IDs/recordedAt/intent digest and preview outside
the lock. On final Apply: acquire; re-read fresh v2; check target entry/name and
the exact expected revision/payload hash; validate baseline identity and whole
candidate; merge other entries from the fresh library; serialize/size-check;
then one `setItem` to the v2 key. No accepted React state changes before success.
Publish the whole accepted document and saved fingerprint after that write.

The write request names either an expected existing entry/revision/payload hash
or an absent destination name/new entry ID. A first upgrade combined with
completion may contain virtual Seed1 then Review2 in one candidate: validate
the prefix hashes, captured original source and absent destination, then write
only the final revision2. Never save Seed as an intermediate side effect of
an operation whose cancellation promises to discard the whole review.

Within the lock check transaction ID **before** rejecting a stale retry. If
that ID already exists with matching intent digest, return AlreadyApplied
and the current stored entry, preserving any later transactions. Different
intent with the same ID is Collision. Otherwise stale revision/hash rejects.
Only an absent-target Save As may create an entry; never recreate a deleted
entry silently. Revalidation after Busy or stale data may require a new preview.

| Situation | Exact required result / limit |
| --- | --- |
| Two tabs, same opening revision | One may write; other Busy or Stale. Fresh locked read prevents overwrite. A notification alone never applies another tab's plan to a draft. |
| Two entries saved concurrently | Same whole-library lock; re-read/merge inside lock preserves other entry's bytes/value. Never write an opening cached library snapshot. |
| Missing/denied lock | No write or accepted-state publication; draft retained. No unlocked fallback. |
| Owner tab closes holding lock | Eventually released by browser; Busy can persist briefly. User retry is bounded/actionable. No immediate-release timing guarantee. |
| Validation/date/cycle/baseline/name failure | No storage or accepted mutation. Keep draft and field errors. |
| Quota/denied getItem or setItem | No publication; old key retained when write throws. Keep draft/retry/export accepted copy. Do not assume available quota from a probe. |
| Cancel upgrade/review before write | No completion/event/edge/floor/revision/fingerprint/library change. |
| Successful key write, then tab closes before publication | Saved transaction is authoritative on reload. Matching retry returns AlreadyApplied; no double completion. Spike tests tab-close with publication omitted, not power loss. |
| Browser/disk/power crash or eviction/clear storage | No guarantee of physical durability/recovery. Compatible exported backups remain necessary. |
| Noncooperating raw writer/devtools/old code writes v2 | Web Lock does not prevent it; hash detects some later drift, not security/authentication. Do not claim exclusion. Spike includes this negative control. |
| Backup download + v2 write | Separate operations, never atomic together. Keep v1 copy; download-start is not proof a backup was retained. |
| Corrupt v2 library/unsupported6 subversion | Reject without overwrite; offer recovery/export of original raw data. No best-effort stripping. |

The guarantee is one logical document update included in one v2-library key
replacement among cooperating writers. It is not multi-key, filesystem,
cross-origin, cross-profile, cross-device or server transaction atomicity.
Do not use rollback writes after successful save to "undo" a different tab.

## Compatibility fixture obligations

| Input / fixture | Required future v6 result |
| --- | --- |
| [format1](../../../tests/fixtures/wp71/legacy-format-1.json) | Plan fields preserved, no baseline/work/status/start fabricated; compatible source retained. |
| [format2](../../../tests/fixtures/wp71/legacy-format-2.json) | Original baseline whole value and C bytes unchanged; preserve its WP1 interpretation. |
| [format3](../../../tests/fixtures/wp71/legacy-format-3.json) | Logs, known/null/zero remaining preserved; none implies Actual Start. |
| [format4](../../../tests/fixtures/wp71/legacy-format-4.json) | Status/criteria/event order preserved; missing completion reference stays Unknown. |
| [format5](../../../tests/fixtures/wp733/late.json) | Forecast settings, historical committed snapshot and baseline preserved; no PA preference invented. |
| v6 valid/partial/corrected/retracted | Exact new-section round-trip/replay; malformed/partial rejects atomically; no silent down-export5. |
| Unknown future root/subversion | Reject without replacing open/saved data. |

The spike validates these five existing fixtures through today's codecs,
including current-format5 round-trips and baseline preservation. It does not
test a proposed v6 migration. Future tests must add variants for baseline absent,
opaque extras, raw backup bytes, same-identity conflicting baseline, all status
states, optional logs, null/zero effort, unsafe ID counters and10MiB boundaries.

## Decision and implementation risk

Recommend approve6.0-A plus isolated v2 and fail-closed cooperative locking,
subject to target-browser runs and a private codec/storage slice before any
public v6 path. Alternative backend changes need another contract. Main risks
are source-hash/intent mismatch, partial journal validation, baseline stripping,
unsafe old-library contamination and claiming the primitive spike proves a
production adapter. Review [evidence](evidence/storage-spike.json) and
[OWNER-DECISIONS](OWNER-DECISIONS.md) independently.
