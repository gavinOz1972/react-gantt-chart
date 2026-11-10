# Compatibility, reconciliation and approval gates

Owner: capacity/recovery, legacy boundary, validation/publication and future phases.
This is a proposal constrained by accepted D01–D05, not final R07 approval.

## K01: Wire and implementation boundaries

| Boundary | Consolidated requirement / impact |
| --- | --- |
| Running release | [projectFile](../../../src/persistence/projectFile.ts) still reads 1–5 and writes 5. Formats, limits, storage key/library, code/imports and UI are unchanged. |
| Proposed format 6 / snapshot-history/2 | Current authoritative state, full active/retired registry/maps, immutable first B, active-only W/graph, lifecycle before-context, archive episodes, closure reviews and explanatory history remain the exact proposed shapes in the prior field contract. No new wire field or version here. |
| Original B | Preserve complete known baseline JSON/opaque values and interpretation. Never remove, replace or reconstruct from current inputs. Absent is not permission to invent an earlier approval. |
| Legacy copy-upgrade | Future explicit preserved-source mapping only, following [MIGRATION-POLICY](../wp7-4-4/MIGRATION-POLICY.md). Missing Actual Start/history/retirements stay Unknown/Partial; baseline-only IDs or allocation gaps do not prove scope events. No migration is performed now. |
| Repeated copies/imports | Portable identity/revision/history stay intact. Destination resource/receipt IDs are separate. Same-lineage branches at the same revision can have different full fingerprints; no timestamp/name merge or pending-intent retargeting. |
| Physical decomposition | May store one immutable definition/index internally if complete export restores exact /2 values and array order. That normalization is not a new accepted wire representation or permission to drop repeated required fields. |
| Reporting and operational views | Derived read projections, with explicit source/ref/completeness, are not complete Snapshot6 values or writable replacement candidates. No report fields/totals/cursors/receipt metadata are inserted into /2. |
| Named snapshots/checkpoints | FR-HIST-01 is deferred and checkpoints/replay are not near-term methods. No portable fields, new baseline semantics, profile or hash changes follow from their registration. |

## K02: Integrity and publication order

The exact full-snapshot algorithm, prefix ending in one LF, JCS bytes and digest
scope remain owned by [VALIDATION-AND-INTEGRITY](../wp7-4-4/VALIDATION-AND-INTEGRITY.md).
It includes complete retained current/history/lifecycle/reviews/archives and first
B including opaque content; it excludes exportInfo/integrity and private routing.
Do not hash record hashes instead of the snapshot or call an operational digest D.
The [independent WP7.4.4b vectors](../wp7-4-4b/CANONICAL-VECTORS.md) qualify bytes
and disclose simplified-sample/C# parser limitations; they are not a deployed
reader or full semantic/preservation certificate. No final F04 acceptance is inferred.

Future candidate acceptance must:

1. Preserve exact source/backup and accepted ref/state before detached processing;
   enforce configured raw byte/depth, strict UTF-8/lexical/duplicate-name boundaries
   before ordinary parse loses evidence. Do not canonicalize an over-cap untrusted
   input first to avoid its resource rejection.
2. Recognize exact schema/profile/integrity and required fields without guessing
   drafts, dropping extras or filling missing format 6 values. Validate complete
   structure/numbers/Unicode and recompute the unchanged D.
3. Validate current domain/active graph, fact/correction links, append-only evidence,
   original baseline/known lineage, IDs/sequences, lifecycle/archives/review consistency
   and common-source full successor closure. Partial coverage never excuses a
   contradictory known linked assertion or missing mandatory retirement field.
4. Check expected full ref, baseline guard, capacity/reopen preflight and qualified
   physical storage limits; publish the one complete candidate/evidence/counters/
   receipt transaction atomically under the repository contract. No half-publication.
5. On rejection/definitive failure retain accepted state/ref/B/history and raw source/
   draft. On uncertain acknowledgement retain exact intent and reconcile as
   OutcomeUnknown; never falsely report rollback or retry with an invented new intent.

Unsupported source/profile/unknown active fields or nonrepresentable opaque values
block the copy-upgrade; keep the old source readable. Never prune, round, stringify
or strip content merely to satisfy a checksum or new file limit. Lossy down-export
to 1–5 is not approved; an original backup lacks later edits and must be labelled.

## K03: Raw input, canonical output and the reopen gate

D02 retains **provisional 10 MiB = 10,485,760 raw UTF-8 input bytes** and maximum
container depth **64**, root container depth 1. These are safety/resource policies,
not proof of domain invalidity above the bound or storage quota/lifetime guarantees.
Object/array containers add depth; primitives do not. A qualified alternate route
requires explicit application/operator policy, not a limit supplied by the input.

Canonical output is the full envelope's JCS bytes, not just snapshot bytes or a
character count. Pretty whitespace can push raw input above the default even
when canonical export would fit; non-ASCII characters also prevent treating JS
string length as UTF-8 bytes. Future preflight must count the actual full intended
export and validate the chosen receiver's depth/representation/profile, including
retained history and B. Required preservation does not make that work free.

Before accepting a portable-only edit whose complete export outgrows its supported
reopen path, a separately qualified higher-cap/offline recovery/export route must
exist and be usable for that candidate. **A warning or successful download alone
does not satisfy D02.** Without a qualified route, block accepted publication,
keep the detached oversized draft/raw source and prior accepted state for recovery,
and explain the bound. This future gate does not alter today's 1–5 application.
Do not solve it by dropping history, creating a lossy report as backup, silently
increasing limits or changing the original baseline. No larger-cap route is built
or selected here.

Qualification must include full-validation cost, raw/decoded/parsed/indexed/canonical/
candidate buffers and accepted-state preservation, browser/managed-device response,
cancel/failure and exact round-trip. A worker or lazy client alone does not bound
transient memory. The [WP7.4.4b](../wp7-4-4b/CAPACITY-REPORT.md) and
[WP7.4.4c](../wp7-4-4c/STORAGE-MEASUREMENTS.md) synthetic cases show retained history
can exceed the cap at fixed task count. No finite portable limit promises indefinite
retention. Local browser quota, SQL capacity, response page budgets and raw file
safety remain separate constraints; D05 archival design is still deferred.

## K04: Conflict register and compatibility decisions

| Prior ambiguity / potential conflict | Resolution under the approved direction | Impact / amendment gate |
| --- | --- | --- |
| WP7.4.4c owner sheet is blank. | Later WP7.4.4d explicitly records A00 and D01–D05 in the new disposition register. Preserve old sheet as historical. | No retroactive evidence or source edits. Final R07 still unchecked. |
| WP7.4.4c optional replay/checkpoint API could imply a near-term requirement. | Excluded from the consolidated capability under D03. Retain accessible explanations/reports and first-B comparison. | No wire change. A future exact-reconstruction feature needs a new explicit scope/contract. |
| Warning versus gate when history outgrows a reopen route. | D02 requires a qualified higher-cap/offline route before accepted portable-only edits cross the supported bound; otherwise preserve draft and block publication. | Existing code not changed; route/platform/budget qualification is unresolved U04. |
| Report Unknown retirement date versus mandatory /2 lifecycle date. | Unknown is a projection limitation, not permission to omit a mandatory decision date or infer Retired from a baseline-only gap. | Broader legacy/unknown-date retirement representation would need an explicit field/profile/bridge amendment; not selected here. |
| Partial operational view versus complete S. | Distinct additive capability; preserve old full load/commit semantics and all omitted retained values. | No port change. Partial-as-S replacement would be breaking and is not approved. |
| Physical references versus repeated wire definitions. | Resolve references and preserve exact /2 content/order/D on export. | Wire references, authoritative deltas/checkpoints or record-hash D require explicit profile/version/migration approval; not approved here. |
| Work totals/cache versus persistent actual truth. | Revision-bound recorded-only derived summary; unknown completeness explicit, source entries retained. | No new wire field. Atomicity/parity specification U03 remains before integration. |
| Saved named snapshot versus first baseline/checkpoint. | FR-HIST-01 deferred; none replaces B or enters /2 merely by registration. | Future WBS, capture/retention/permission/integrity/compatibility decision required. |

No remaining issue is resolved by weakening accepted semantics to reduce a test
burden. Unresolved U01–U07 are owned by [OWNER-DISPOSITIONS](OWNER-DISPOSITIONS.md).
They are concrete future approval/qualification gates, not implicit implementation
permission. No amendment is silently applied to existing portable fields or D.

## K05: Bounded phases and stops

1. Review this consolidated handoff and exact SHA; record R07 disposition/conditions.
   This package ends here with final acceptance unchecked.
2. Only after a separately named authorization, resolve private representation/
   validation and additive capability contracts, budgets and conformance fixtures.
   Preserve 1–5 boundaries; stop for their owner review.
3. Separately authorize/qualify a physical provider and higher-cap route if needed:
   atomicity, crash/quota, concurrent writers, exact retry/unknown acknowledgement,
   pinned pagination and complete digest/export/import costs. No adapter is selected.
4. Separately authorize consumer integration and reports/UI with parity, preserved
   real data and accessible lifecycle/history views. Report contract acceptance is
   not permission to start WP8 or any unspecified UI work.
5. FR-HIST-01, long-term archival/DBMS and any future replay/checkpoint feature each
   need their own WBS item/decisions. Release/deployment, WP7.4.5 and WP8 do not begin
   because documentation, conformance or provider checks happen to pass.
