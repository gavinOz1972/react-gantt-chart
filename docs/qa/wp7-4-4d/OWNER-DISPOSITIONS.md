# Owner dispositions and decision register

Disposition date: **2026-11-09, America/Regina**. Source: the owner's instruction
to implement `Bugsys_WP7_4_4d_Historical_Architecture_Contract_Consolidation.docx`,
whose Authority and section 1 explicitly accept WP7.4.4c and approve D01–D05.
Source SHA-256: `18d6be76b41b965de4a0b47d3ae403f0f0cec2d8666dfc0dc6a222e95dc556e2`.
These are owner dispositions, **not conclusions inferred from passing tests**.

The assessed WP7.4.4c commit is
`c967d0c8417d263cccdc3c6b5472036199bbcdcd`. Earlier unchecked options in its
[owner sheet](../wp7-4-4c/OWNER-DECISIONS.md) are historical. This register records
the later explicit directions without rewriting that assessment or its evidence.

## Accepted directions — limited authority

| ID | Owner disposition | Supporting assessment evidence | Effect in this package |
| --- | --- | --- | --- |
| A00 | WP7.4.4c accepted as an architectural assessment. | [assessment handoff](../wp7-4-4c/README.md), [verification](../wp7-4-4c/VERIFICATION.md). | Authorizes this documentation consolidation only. |
| D01 | Retain proposed snapshot-history/2 semantics and complete portable export initially. Separate operational loading from immutable paged history; no mandatory replay. | [options comparison](../wp7-4-4c/ARCHITECTURE-COMPARISON.md), [measurements](../wp7-4-4c/STORAGE-MEASUREMENTS.md). | Preserve wire shapes/digest; define purpose-based reads. No event-store migration or checkpoints. |
| D02 | Provisional 10 MiB raw input / depth 64. A separately qualified higher-cap or offline recovery/export route must exist before accepted portable-only edits exceed supported reopen capacity. No pruning or silent increase. | [capacity qualification](../wp7-4-4b/CAPACITY-REPORT.md), [long-lived and dense cases](../wp7-4-4c/STORAGE-MEASUREMENTS.md). | Warning-only acceptance is insufficient. Preserve oversized draft/source and accepted state; apply the future gate before publication. |
| D03 | Immutable first-baseline comparison, accessible explanations/change log and retired-task reporting satisfy the near-term history requirement. Exact reconstruction of every intermediate schedule is not required. | [consumer/retention assessment](../wp7-4-4c/CURRENT-ARCHITECTURE-ASSESSMENT.md), [reconstruction cost/limits](../wp7-4-4c/STORAGE-MEASUREMENTS.md). | Remove replay/checkpoint methods from the near-term capability proposal. Reports are pinned views, not arbitrary time travel. |
| D04 | Propose a distinct additive operational/history capability. Preserve ProjectRepository<S> load/commit and revision/receipt semantics until separately authorized. | [implemented port](../../../src/repository/projectRepository.ts), [capability proposal](../wp7-4-4c/MEMORY-AND-REPOSITORY-CONTRACT.md). | New design notation only; no port modification or activation. |
| D05 | Separately scope future archival/DBMS design: concurrent users, indexing, access control, retention, backups and complete export. No SQL or browser adapter selected. | [repository/storage assessment](../wp7-4-4c/MEMORY-AND-REPOSITORY-CONTRACT.md), [staged recommendation](../wp7-4-4c/RECOMMENDATION.md). | Keep browser and service/SQL options distinct; no implementation choice. |

## Proposed future contracts — not accepted implementations

| ID | Proposal / sole owner document | Approval still needed |
| --- | --- | --- |
| P01 | [Repository and memory](REPOSITORY-AND-MEMORY-CONTRACT.md): operational projection, read sessions, stable pages and atomic change boundary. | Concrete models, conformance and later integration authorization. |
| P02 | [Historical reporting](HISTORICAL-REPORTING-CONTRACT.md): baseline comparison, episode-based retired report and linked change log. | UI/report engine and export medium/WBS scope. |
| P03 | [Compatibility and gates](COMPATIBILITY-AND-GATES.md): detached validation, exact /2 materialization, capacity/recovery qualification. | Full R07 review, codecs, source-preservation and platform qualification. |
| FR-HIST-01 | [Future named snapshots](FUTURE-SNAPSHOT-REQUIREMENT.md). | Separate WBS item, capture/retention/permissions/format design and explicit authorization. |

## Unresolved approvals and implementation-verification gates

| ID | Outstanding issue | Consequence / proposed next decision |
| --- | --- | --- |
| U01 | Full-snapshot D and acceptance validation may traverse all history on each commit/export. Lazy client reads do not remove that cost. | Qualify a bounded canonicalization/staging design; keep exact D, or request an explicit profile amendment. No record-hash replacement is approved. |
| U02 | Concrete cursor byte/item limits, session lifetime/pinning, oversized record delivery and filtered query indexes. | Approve these as a later capability contract and test consistent reads under concurrent commits. Proposed limits here are not deployed constants. |
| U03 | Operational fact adapters and recorded-work totals completeness/atomicity. Existing consumers still use legacy history. | Specify qualified projections and verify parity/correction handling before removing history dependencies. |
| U04 | Actual higher-cap/offline recovery route, supported platforms and transient-memory budget. | Select and qualify separately before any accepted edit outgrows its supported reopen path. No route is supplied here. |
| U05 | Archival scale, concurrent-user, access/retention/backup/export requirements. | Separate D05 design scope; no current adapter choice. |
| U06 | Named snapshot capture, immutable provenance, cost and portable compatibility. | Separate FR-HIST-01 WBS/decision; no current fields or automatic capture. |
| U07 | Complete-contract R07 acceptance and subsequent authorized work. | Owner must record exact reviewed SHA/conditions. No inference from A00 or D01–D05. |

- [x] WP7.4.4c assessment and D01–D05 directions recorded from the explicit source.
- [ ] Final R07 contract accepted. Reviewed SHA / owner / date: _______________
- [ ] Further authorization names a bounded implementation package: ___________

Only the first checkbox records an existing owner direction. The remaining boxes
stay unchecked. No WP7.4.5, WP8, production model/codec/adapter/API/UI or user
snapshot implementation is authorized by this consolidation.
