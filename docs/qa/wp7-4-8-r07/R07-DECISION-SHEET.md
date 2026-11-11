# R07 decision sheet - final owner decision pending

Reviewed source: `8ae0eb4cff4e9f46785852bec9462f0b49518513`.
This sheet assesses **design acceptance separately from production readiness**.
The implementation has formats 1-5, a format-5 writer, unused repository ports
and a default-off development history slice. It has no Snapshot6 production
codec, physical repository, retirement workflow or complete `/2` export.

## Authority and precedence

| Authority | Decision carried forward / evidence |
| --- | --- |
| [WP7.4.3b acceptance](../wp7-4-3b/ACCEPTANCE.md) | Owner accepted unused generic port/test-only implementation at `78f18407e67d7eb84ed5cbf51a6236d6b1bfce27`; production integration, providers and R07 excluded. |
| [F01-F09 dispositions](../wp7-4-4/OWNER-DECISIONS.md) and [field contract](../wp7-4-4/FORMAT6-CONTRACT.md) | Option A is fixed: authoritative current snapshot plus explanatory history, no mandatory replay. WP7.4.4a replaces physical deletion with proposed retained retirement/restoration. F04/F08 conditional; whole-contract acceptance pending. |
| [Integrity contract](../wp7-4-4/VALIDATION-AND-INTEGRITY.md) and [migration policy](../wp7-4-4/MIGRATION-POLICY.md) | Sole owners of exact canonical scope and preserved-source 1-5 copy-upgrade; no codec activation. |
| [WP7.4.4b qualification](../wp7-4-4b/QUALIFICATION-MATRIX.md), [recommendations](../wp7-4-4b/R07-FINAL-RECOMMENDATIONS.md) | Independent byte vectors/capacity probes qualify parts of F04/F08, not full validation or final acceptance. |
| [Consolidated C00-C05](../wp7-4-4d/CONSOLIDATED-R07-CONTRACT.md), [D01-D05/U01-U07](../wp7-4-4d/OWNER-DISPOSITIONS.md) | Later explicit directions govern; do not reopen accepted D01-D05 as blank choices. Detailed ownership is split across R, H, K contracts below. |
| [WP7.4.5 conformance](../wp7-4-5/README.md), commit `d0e99034c71dc6141ed8d56cad4f1a3be3627051` | Typed additive capability and test reference, not selected storage; `exportPortable` explicitly Unsupported. |
| [WP7.4.6 gaps](../wp7-4-6/GAPS-AND-GATES.md), commit `678013e5ac57ba2efec5775ea1a780c5198d3932` | Characterization exposes consumer gaps, not proof of interchangeable normal consumers. |
| WP7.4.7 / a / [b acceptance](../wp7-4-7b/ACCEPTANCE.md) | Commits `07faed745d66502033ab7a60ac9dfc612512fe8f`, `22bfd6a3afff6f78e977d9fde55405de9983cabd`, `8ae0eb4cff4e9f46785852bec9462f0b49518513`: bounded read-only loaded-legacy history; latest owner acceptance does not accept R07. |

The [consolidated acceptance matrix](../wp7-4-4d/ACCEPTANCE-MATRIX.md)
remains the detailed requirement crosswalk. The following classifies its
conditions using **Satisfied**, **Unresolved**, or **Explicit owner decision**.
Satisfied always names its scope: a documented/test-only condition is not a
production pass. No unresolved implementation gate is silently closed.

## Schema, evidence, compatibility and integrity conditions

| Condition | Classification and evidence | Remaining gate |
| --- | --- | --- |
| C00 authority; fixed Option A; D01 exact `/2`; D04 additive port | **Satisfied - direction recorded.** Consolidated index and D01/D04; old full `ProjectRepository<S>` retained alongside `src/repository/operationalHistoryRepository.ts`. | No partial OperationalView may replace full S or full D. Final contract acceptance remains separate. |
| F01/C01 complete Current, identity, maps, counters, inputs and W | **Unresolved - production.** Exact required fields in FORMAT6-CONTRACT; no production Snapshot6 model/codec. | Complete detached domain/reference validation, not fixture payload validation; preserve active and retained values. |
| F02 explanatory history; Partial/Unknown; sequence and corrections | **Satisfied - design direction; unresolved integration.** Field contract and loaded-legacy reader qualify available evidence without replay. | Append-only correction/supersedes rules and complete `/2` linked consistency; no invented missing events or clock-based sequence. |
| F03/R04 revision, identity, receipts and atomicity | **Satisfied - port/reference tests; unresolved provider.** WP7.4.3b/5 exact-intent retry, stale ref and OutcomeUnknown tests. | One full closure/revision publication with B/history/counters/full D/receipt; real crash, contention and durability tests. Portable identity is not resource/receipt identity. |
| F04 canonical bytes and scope | **Explicit owner decision.** WP7.4.4b has 37 independent vectors / 358 assertions and matching maintained Node/.NET valid bytes, including numeric/Unicode cases. | Accept reference-adoption conditions; simplified sample fails required behavior and C# parser accepts `01`. Strict lexical/duplicate/UTF-8 validation and complete semantic codec still unqualified. |
| F04 full D publication | **Unresolved.** Integrity contract requires `bugsys-gantt/snapshot-history/2\n` + JCS(snapshot), UTF-8 SHA-256; full B/opaque/history/lifecycle/reviews/archives included, routing/exportInfo excluded. | Full intended export validation and hash before acceptance; no record-hash substitute, rounding or normalization. A matching hash is not provenance/authentication. |
| F05/C01/R02 actuals and consumer parity | **Unresolved.** WP7.4.6 C01-C07/S01/S03; current guidance, prior completion, assumed-status origin, work details and Known Actual Start boundary are not interchangeable. | Typed/versioned source qualification and consumer-by-consumer equality. Narrow loaded-legacy history resolves its slice, not generic `/2` payload semantics. |
| F06 immutable first B and old commitments | **Satisfied - existing known-format regression; unresolved complete `/2` preservation.** Baseline tests pass; field contract requires full opaque B and retired before-context. | WP7.4.6 P01/P02: known-field decoder cannot preserve arbitrary opaque B or manufacture full S/D from a projection. B never replaced by current plan or named capture. |
| F07/K01 legacy copy-upgrade | **Satisfied - proposed mapping and unchanged 1-5 runtime; unresolved implementation.** MIGRATION-POLICY; current `src/persistence/projectFile.ts` reads 1-5/writes 5 and rejects 6. | Explicit source-preserving copy, exact raw backup/digest, Unknown actuals/Partial history/Active defaults; reject unrepresentable extras, never infer retirement from absent IDs. No migration performed. |
| F08/K02 strict rejection and no publication on failure | **Unresolved.** Design specifies lexical/shape/domain/link/lineage/B/capacity checks before atomic publication. | Real decoder/accepted-state/source-preservation tests; current supported-file checks are not `/2` rejection proof. |
| F08/K03/D02 capacity and recovery | **Explicit owner decision plus unresolved qualification.** Provisional raw 10,485,760 bytes and depth 64 (root=1); b measured lifecycle growth exceeding the cap. | Accept initial policy/configuration and complete-cost plan. Qualify a higher-cap/offline recovery route before accepting portable-only edits that exceed reopen capacity; warnings alone insufficient. Current 1-5 limits are not retroactively amended. |
| F09/C02 retirement and restoration | **Satisfied - owner direction; unresolved runtime.** Full retained identities, lifecycle independent of four statuses, before-context, rationale/dates/available actor, archive episodes and reviewed restore are specified. | Validate required fields/links; freeze and deduplicate full successor closure, one final choice per ID and one atomic revision; cancellation no change, stale source requires reconfirmation. Restore never silently restores graph/B/W. Current Delete is still physical legacy deletion. |

## Repository, reporting, capacity and future-scope conditions

Detailed owners: [R01-R05](../wp7-4-4d/REPOSITORY-AND-MEMORY-CONTRACT.md),
[H01-H06](../wp7-4-4d/HISTORICAL-REPORTING-CONTRACT.md),
[K01-K05](../wp7-4-4d/COMPATIBILITY-AND-GATES.md).

| Condition | Classification and evidence | Remaining gate |
| --- | --- | --- |
| R01/C03 operational projection and retained-purpose reads | **Satisfied - typed/reference contract; unresolved production.** WP7.4.5 tests cover distinct operational, B, task, event and episode reads. | Real adapter/client must avoid normal full-history materialization while retaining all source; current loaded-legacy bridge holds already-loaded data. Registry/current graph can still grow. |
| R02 normal schedule/forecast/status/PA/work-log parity | **Unresolved.** WP7.4.6 fixture matches are conditional; several cases explicitly unproven. | Resolve guidance, reopened completion, origin, work detail, actual-start and clock policies before replacing consumers. No evaluator/formula changes inferred. |
| R03/U02 bounded stable reads and oversize handling | **Satisfied - test-only scope.** WP7.4.5 cursor/filter/watermark/session, ties/dedup, item/byte budgets and explicit oversize delivery tests; current feature-on failures/retries pass. | Real indexed, pinned, cancellable I/O, lifetime/caching/transient-memory qualification; no full physical U02 closure. Do not truncate rationale/closure. |
| R04 acceptance/failure/reconciliation | **Satisfied - reference semantics; unresolved physical guarantees.** Accepted full port preserved; exact retry and stale-intent tests. | Provider must enforce whole closure, full expected ref and atomic evidence/cache/counter/D/receipt changes; OutcomeUnknown is not rollback or a fresh-ID retry. |
| R05/U01/C04 complete export and full D cost | **Unresolved.** `docs/qa/wp7-4-5/tests/referenceOperationalHistoryRepository.ts` returns Unsupported/PortableExportNotQualified without sink writes. | Exact full `/2` materialization/order/opaque values plus lexical/canonical/validation costs; benchmark browser time, memory, cancellation and safe staging. No cheap hash-of-hashes substitution. |
| R05/U04/U05/D05 physical provider and archival | **Explicit owner decision - separate scope.** D05 requires later scale/concurrency/index/access/retention/backup/export design; no provider selected. | Choose only after requirements and capacity/recovery evidence. Test oracle is not IndexedDB/API/SQL or multiuser authorization. |
| H01/C05/D03 original-B comparison | **Satisfied - design contract; unresolved report implementation.** ID-based original-versus-active joins, new/retired/legacy-absent qualification and like-unit variance specified. | Pinned provenance, no recomputed B or retirement-as-completion; current baseline overlays are not this report. |
| H02 retired episodes/report access | **Unresolved - runtime.** Columns, accessible entry, lifecycle-versus-episode filters, available actor/reason and complete review links specified. | Required `/2` lifecycle dates cannot be waived by report Unknown; no invented episode for a baseline-only absent task. |
| H03 change-log/Gantt/report-export boundary | **Unresolved - runtime.** Future retired hidden by default with explicit toggle, no ghost constraints; complete qualified rationale/source metadata required. | Separate UI/export-medium authorization; no report/PDF engine implemented and no required field/receipt/cursor additions to `/2`. |
| H04/H05/H06 examples and query consistency | **Satisfied - illustrative design coverage.** Original B comparison, 99-successor/common-source/concurrent alternative, linked retire/restore timeline and pinned filters documented. | Owner consistency review; examples are not runtime tests. Provider/report tests must prove no duplicate closure decisions or cross-page lifecycle drift. |
| K01/K04 compatibility and conflict reconciliation | **Satisfied - documented boundary.** Read-only projections not full snapshots; internal references must expand to exact wire values; Unknown report display does not relax required lifecycle data; D03 supersedes near-term replay suggestions. | Any wider legacy bridge, field/hash change or named capture requires explicit amendment/version review; current formats and source bytes preserved. |
| K05 phase/stop gates | **Satisfied - this scope.** Assessment only, existing regression evidence, independent pending decision sheet. | No auto-start of provider/codec/consumer/report/release work. |
| FR-HIST-01/U06 named user snapshots | **Satisfied - deferred requirement registration.** [Future requirement](../wp7-4-4d/FUTURE-SNAPSHOT-REQUIREMENT.md) separates opt-in accepted-state captures from first B, log and caches. | Separate WBS/identity/contents/permissions/retention/cost/compatibility decisions; no model or field added. Not a current runtime defect or prerequisite silently added to a legacy pilot. |

## Unresolved register carried forward

| ID | Disposition at this assessment |
| --- | --- |
| U01 | Full-D cost remains unqualified end to end; b probes are historical partial measurements. |
| U02 | Typed/reference query contract substantially evidenced by WP7.4.5; physical paging/memory/session guarantees remain unresolved. |
| U03 | Current facts/recorded totals and normal-consumer parity remain unresolved per WP7.4.6; selected loaded-legacy detail acceptance is narrower. |
| U04 | Qualified higher-cap/recovery route and actual platform transient-memory evidence remain unresolved. |
| U05 | Archival/DBMS design separately scoped by accepted D05; no provider choice inferred. |
| U06 | FR-HIST-01 deferred design; not required near-term arbitrary replay. |
| U07 | **Explicit owner decision pending** at exact reviewed assessment/contract SHA. |

## Independent owner disposition

Recommendation: accept the consolidated direction **only with explicit retained
implementation gates**, if the owner agrees after review. Do not certify a
production-ready format/provider or silently close F04/F08 conditions. Choosing
design acceptance does not require pretending all future software exists.

- [ ] Accept final R07 design contract, with conditions and unpassed implementation gates explicitly listed below.
- [ ] Defer final R07 acceptance; further analysis requested below.
- [ ] Require amendment to the specified contract items below.
- [ ] F04 vectors/reference-adoption conditions explicitly accepted / conditions: ______
- [ ] F08 limits/lifetime/configuration/recovery policy explicitly accepted / conditions: ______
- [ ] F01-F03/F05-F07/F09 whole-contract consistency explicitly accepted / conditions: ______

Owner/date: ______ Reviewed exact SHA: ______ Conditions/item IDs: ______

All boxes start pending. This assessment does not sign for the owner, activate
format 6, close physical gates, approve an overall WP7 release or authorize a
next package. Record the final decision separately after review.
