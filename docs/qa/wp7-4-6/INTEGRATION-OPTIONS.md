# Integration readiness and options

**Recommend a separately authorized read-only selected-task transition history
slice. Do not replace operational loading throughout the application yet.**
The field/call-site inventory and counterexamples show why current inputs
cannot be replaced with an OperationalView everywhere: current guidance,
reopened completion context, status origin, typed payloads and work detail are
not all represented by its present contract.

| Option | Owner-visible benefit | Prerequisites / risk | Recommendation |
| --- | --- | --- | --- |
| Selected-task transition/change history | View an existing task's recorded transitions, snapshots and notes without loading every task's history into that detail feature | Typed legacy payload projection/validation, task sequence order, honest coverage and failure UX; no editing conversion | Smallest reversible first slice |
| Retired-task read view | Inspect retained tasks and retirement/restore/archive context | Production currently physically deletes; requires lifecycle source and compatibility/restore/selection scope, beyond read-panel parity | Later explicitly scoped lifecycle slice; existing target direction remains accepted |
| Forecast/health operational conversion | Smaller current inputs while retaining calculation results | Qualified completion references/payloads, error policy, raw B preservation; do not change formula; keep PA separate | Conditional calculations demonstrated, but broader failure surface than first read feature |
| Status/PA conversion | Read current/future/actual impact from new facts | Prior completion episode, origin, guidance, Known-start evaluator policy, timestamp compatibility and approved semantic decisions | Not ready; resolve contracts and owner decisions first |
| Selected work log | Read recorded work entries with qualifications | Dedicated sorted detail query/metadata; original overwrite/retraction history unknowable | New query contract required first |
| Storage replacement/full `/2`/report/PDF | Future persistence/report capability | Production validation, canonical integrity/export/recovery, providers, migration/capacity, R07 and reporting scope | Excluded; not justified by these parity results |

## Proposed first slice — scope for owner authorization

This is a proposal, not implemented UI or a selected provider.

- Add an obvious read-only history section in the selected task panel behind a
  **default-off feature flag**. Keep existing status/criteria/DoD editing,
  task/work mutation callbacks and dirty/save/export paths on the legacy model.
- Use a narrowly reviewed read-only boundary over the **already loaded legacy
  source** initially, if the owner authorizes it. It must carry a pinned
  resource/revision identity and qualified typed transition projection. This
  does not imply choosing SQL, IndexedDB or another storage provider.
- Query only the selected task with a bounded page size/byte budget and stable
  sequence order. Show a continuation action rather than silently draining all
  project history. Preserve tie order, IDs, effective date versus recordedAt,
  reasons, notes, snapshots and historical DoD verbatim as qualified by source.
- Label Partial and Unavailable honestly. An empty partial page does not mean
  no transition ever occurred. No synthetic completion, actual-start date or
  attestation may be inferred from current status, work logs or elapsed time.
- Unsupported or an unusable read should show a clear notice and the original
  **already loaded** legacy history section. It must not initiate a hidden
  all-project fetch. Cancel/release a read when selection changes; refresh an
  expired session explicitly and discard stale pages rather than mixing them.

## Proposed user-visible acceptance scenarios

1. Pointer and keyboard can find history, navigate pages and return to the
   selected task without changing status, selection, drafts or scroll context.
2. A completed, reopened and blocked task show exactly their recorded rows,
   effective dates, reasons and original completion guidance/checklists.
   Equal timestamps retain recorded sequence. Reopening does not erase the
   prior attestation or imply current completion.
3. Partial/Unavailable and unknown metadata remain visibly qualified. Loading,
   no retained rows, error and end-of-history are distinguishable.
4. Unsupported, ReadExpired, RecordTooLarge, mismatched payload and mixed
   watermark have explicit recoverable handling. Fallback does not read new
   full history or change any data. Concurrent writes never mix page revisions.
5. Query instrumentation proves task filtering and bounded pages/bytes.
   Selection changes cannot append stale results to another task's panel.
6. Save/reload, formats 1–5 import/export, optional work logs, current status,
   forecast/health/PA, baseline, unsaved drafts and dirty indicators remain
   unchanged. Default-off behaviour uses the original component path.

## Rollback and release boundary

Turn the flag off and restore the original history rendering path if rows,
ordering or attestation differ; coverage is misleading; reads are unbounded;
watermarks mix; or any mutation/dirty/save effect occurs. Since the proposed
slice has **no writes, migration or format activation**, rollback needs no data
conversion. Release reads and abandon pending requests on flag/selection change.

Before implementation, the owner must authorize this specific UI/read-only
scope and its bounded payload/coverage/error contract. This assessment neither
starts that work nor constitutes R07 acceptance. Contract changes and any
future producer/provider require their own review and conformance evidence.
