# WP7.4.3a owner review - new choices remain unchecked

Start with [README](README.md), [repository contract](REPOSITORY-CONTRACT.md),
[browser decision](BROWSER-ADAPTER-DECISION.md), [format impact](FORMAT6-IMPACT.md),
[failure matrix](CONCURRENCY-FAILURE-MATRIX.md), [future API](FUTURE-API-ADAPTER.md),
[implementation impact](IMPLEMENTATION-IMPACT.md) and [verification](VERIFICATION.md).

## Established intent

The requirement establishes a storage-independent repository direction,
browser first/API-DBMS later, whole-project expected-revision commits,
atomic completion/dependency/history/commitment decisions, immutable first
baseline and append-only corrections. Portable files are independent of
physical storage. WP7.4.2 acceptance is limited to the unused pure evaluator.
No implementation, collaboration or release follows from these principles.

P09-F/P09-S were pending mechanisms; new amendments below do not silently
mark the historical sheets. Independent earlier WP7.1/WP7.3/WP7.3.2/WP7.3.3
acceptance gates remain unchanged. P11 lifecycle/P12 integration/P10 visual
approval are not granted here.

## Independently approve, defer or reject

One choice per row; add conditions/alternatives. Approval of one mechanism
does not approve another. All new boxes intentionally remain blank.

| ID | Concrete proposed mechanism / consequence | Approve | Defer | Reject | Conditions / alternative |
| --- | --- | --- | --- | --- | --- |
| R01 Repository port | Typed load/list/create/conditional whole-snapshot commit with shared failures/ref/receipt, separate codec/validator/orchestration and no browser/SQL imports in domain. | [ ] | [ ] | [ ] | __________ |
| R02 Identity and labels | Stable repository stored-copy ID distinct from immutable portable lineage/task/baseline IDs. Duplicate labels allowed; names never overwrite identity. Old v1 unique-name behavior stays unchanged. | [ ] | [ ] | [ ] | __________ |
| R03 Revision semantics | One authoritative portable logical revision per accepted domain change; Seed+Review grouped in1, normal commit exactly expected+1. Import/copy preserves existing logical revision. Refs/cache indexes derive it, no independent entry counter. | [ ] | [ ] | [ ] | __________ |
| R04 First adapter layout | One isolated v2 library key initially, private10MiB total cap/global write lock and known write amplification. Per-project/IndexedDB alternative requires native catalog/receipt/baseline/migration tests. No DBMS blob/key requirement. | [ ] | [ ] | [ ] | __________ |
| R05 Conditional coordination | Compare expected revision+semantic fingerprint and save receipt+snapshot in one atomic boundary. Browser writes fail closed without cooperative lock, Busy is retryable; no unlocked fallback or manual-edit security claim. | [ ] | [ ] | [ ] | __________ |
| R06 Idempotency/receipts | Namespace/create and per-resource commit scopes; durable matching retry returns original receipt/currentRef separately. Changed intent/same ID conflicts; no automatic receipt transfer/command retargeting across repositories. | [ ] | [ ] | [ ] | __________ |
| R07 Format6/backup amendments | Approve6.0-B direction/planning2, remove routing from domain history/hash, grouped history and separate export metadata. Source1-5/raw backup retained; no lossy down-export; unsupported A drafts reject rather than guess grouping. Full codec freeze still a later slice. | [ ] | [ ] | [ ] | __________ |
| R08 Cancel/uncertain outcome | Known rejection/pre-dispatch cancellation leaves accepted data unchanged. After dispatch timeout/abort may be OutcomeUnknown: retain exact intent and reconcile, never claim proven rollback. Stronger post-dispatch cancel requires another protocol. | [ ] | [ ] | [ ] | __________ |
| R09 Baseline integrity boundary | Compare full established baseline/original WP1 semantics, preserve opaque extras/IDs; serialize known-lineage adoption. Unknown imported history/external tampering cannot be cryptographically certified. Reject conflicting known copy, never rebaseline. | [ ] | [ ] | [ ] | __________ |

Open mechanism questions: Are duplicate copy labels acceptable? Is the small
single-key capacity appropriate for expected use, or should a transactional
browser adapter be designed first? Does the proposed logical-group revision
replace the pending6.0-A counter as intended? Is OutcomeUnknown the acceptable
honest treatment of lost acknowledgements? Record alternatives explicitly.

Owner/date: ____________________ Reviewed design SHA: ____________________

## Design acceptance and next package (separate gates)

- [ ] Accept WP7.4.3a as design/contract handoff only.
- [ ] Further analysis/native verification requested: ____________________
- [ ] Separately authorize **WP7.4.3b: unused repository port and typed test-only
  reference suite**, per [IMPLEMENTATION-IMPACT](IMPLEMENTATION-IMPACT.md).
- Approved mechanisms/scope/exclusions/test gates: ____________________
- Deferred/blocking items: ____________________
- Owner/date: ____________________

No box is checked. A later work package must be explicitly started by name and
scope. This sheet does not authorize a production adapter, new key/file decoder,
server/database/authentication/collaboration, evaluator activation, chart change,
main merge, tag, deployment, rebaseline or WP8.
