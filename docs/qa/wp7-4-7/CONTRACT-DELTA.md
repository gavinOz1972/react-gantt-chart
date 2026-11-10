# Selected-task read contract delta

WP7.4.6 gap **C04** is addressed for **loaded legacy progress version 1 only**.
The generic WP7.4.5 EventRecord payload/operational port is unchanged. Its other
consumers, payload versions and remaining gaps are not declared resolved.

## Additive boundary

[selectedTaskHistory.ts](../../../src/history/selectedTaskHistory.ts) defines
`SelectedTaskHistoryReader` with `open(taskId, signal)`,
`read(session, {cursor, limit, maxBytes}, signal)` and `release(session)`.
There is no writer, save callback, fetch, storage connection or operational
loader. It captures references to the already loaded immutable legacy state.
App passes only the document namespace, legacy format and current task list;
the existing TaskStatusPanel supplies current progress without changing it.

| Field | Provenance and meaning |
| --- | --- |
| resourceId | Project identity plus existing document epoch, isolating reopen/new/import even for reused project IDs; not a repository overwrite target |
| revisionToken | Opaque identity of one immutable in-memory source reference set; **not** a persisted accepted revision, full fingerprint or historical snapshot |
| session token | Opaque per-opening identity; expires after 5 minutes; release invalidates it and its cursors |
| source | LoadedLegacy, original loaded format 1–5 and progress schema 1. Edited current memory may contain status added after an older file was opened |
| taskId | Explicit selected stable task ID, validated against the supplied current task list |
| event | Validated original StatusEvent fields: native eventId/taskId, from/to status, effective `date`, recordedAt, optional reason/note, historical checklist/DoD and acknowledgement/committed-finish reference |
| sequence | One-based position in this pinned legacy event array, displayed as **source position**. Stable within the read and decisive for timestamp ties; not a new permanent sequence ID across edits/deletions or a portable-format sequence |
| actor / decisionId | Null → shown as Unknown. Legacy has no separate actor or decision identifier; native event ID remains visible |
| coverage | Always Partial for a loaded legacy source: retained status decisions only; not full change/work/deletion history or an authenticated audit trail |

No actual start/finish time, actor, new decision ID or missing history is
inferred. Completion guidance and checklist are historical wording, not the
current status or current project DoD. Text renders through React escaping.
Missing mandatory legacy dates/timestamps cause a qualified validation error,
rather than accepted undated rows with a newly invented interpretation.

## Validation and bounded projection

The original import/mutation decoder is untouched and still validates the full
legacy source. The read adapter separately validates the selected task's source
structure, allowed statuses, field/date/timestamp shapes, criteria/attestation
requirements, unique IDs, unbroken transition chain, nondecreasing recordedAt,
current status/blocked reason and completed-checklist agreement. It retains
original wording instead of normalizing it for display. Unit cases compare
rejection with the existing decoder, including clock skew and invalid snapshots.

This narrow read validation does not certify arbitrary external files,
cross-task criterion ownership, a general `/2` payload, or target change-log
completeness. Those stay at the existing loader or separately gated boundaries.
No trusted fixture-only payload cast is used in production.

Opening scans existing references and retains selected validation metadata
(IDs and checklist reference), without constructing an all-history projection.
Page reads scan the captured source backwards, filter by task before delivery,
and copy **only selected rows admitted by the page budget**. Default/max count:
20. Default/max delivery budget: **128 KiB UTF-8 JSON of the items array**;
small fixed page/session metadata is outside that item budget. Both count and
byte limits apply. A too-large first record returns RecordTooLarge, never a
truncated attestation. A too-large later record leaves a continuation so the
next explicit read reports it honestly.

Cursors are issued opaque objects bound to one exact session/reader and source
position. They cannot be forged by copying numeric offsets or carried into
another session. Pages carry the pinned resource/revision watermark. The UI
also rejects a mismatched watermark/task, non-descending row order or budget
violation. No automatic page drain or hidden all-project read exists.

The legacy application already retains all events. Validation/reference scans
and per-session ID/cursor metadata can grow with retained history; repeated
page rendering accumulates only pages explicitly requested by the user. This
is **not** a claim of lazy physical loading, indexed queries, bounded overall
memory, reduced saved-file size or a database provider.

## UI lifecycle and failures

The gate requires both Vite DEV and `VITE_SELECTED_TASK_HISTORY === 'true'`.
Default and production paths retain the extracted original history renderer;
independent original-panel HTML characterization proves identical default DOM.
Enabled-but-collapsed captures no historical rows and calls no reader methods.

Show/Hide uses an accessible expanded button and controlled region, preserves
focus and has no write callbacks. Only a user action opens or pages. Hide,
unmount, selection/project change or flag disable aborts pending work, releases
the session and invalidates continuations. A changed source suppresses old rows,
releases/cancels and requires **Refresh history**. Late results cannot change
the newer view; there is no automatic mixed-revision append.

| Outcome | Presentation and recovery |
| --- | --- |
| Loading | Explicit busy state; Hide can cancel |
| Available, no matching rows | Explicit empty retained-source message plus Partial coverage and truthful end |
| Unavailable | Older format without any retained progress/events; not proof of no decisions; refresh and qualified original-display option |
| Unsupported after validated open | Explain, refresh, optional original loaded display |
| Unsupported/invalid opening | Explain and refresh; no unsafe fallback |
| InvalidPayload / MixedWatermark | Explain, discard unsafe/mixed results, refresh; no original-display fallback for invalid evidence |
| ReadExpired / RecordTooLarge after validated open | Explain, refresh; optional original unpaged loaded display with visible qualification |
| Cancelled | Explicit cancellation/retry wording if surfaced; obsolete cancelled replies are discarded |

Fallback is **explicitly requested**, uses the original already loaded
TaskStatusPanel history renderer, and performs no new fetch. It may render an
unpaged selected history, which is visibly qualified. Disabling the flag is the
complete UI rollback: no migration, data rollback or saved-state cleanup exists.
