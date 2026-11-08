# WP7.4.3a - Persistence architecture contract revision

**Design and contract verification only. No production repository, adapter,
format6, API or database is implemented or activated.** Review date:2026-11-07,
America/Regina. Starting tree clean on `feature/wp7-stabilization` at
`f61cacecd97bbfd5b83f48576aec8775d380a121`.

Authority: owner request and saved requirement
`react-gantt-chart/docs/WP_Req/Bugsys_WP7_4_3a_Persistence_Architecture_Contract.docx`,
SHA-256 `f782cac63ad57092734ed98979c384de47df2a4bc23e99825baf27905779d7f4`.
It establishes a storage-independent repository direction, whole-project
conditional revisions, atomic reviewed changes, immutable baseline and portable
files independent of database layout. These principles are accepted; the
mechanisms below remain owner choices.

WP7.4/P09, WP7.4.1 P09-F/P09-S, format6.0-A, P12/implementation sequence and
WP7.4.2 acceptance/verification were reviewed. The new requirement carries
forward WP7.4.2 acceptance **only for the unused pure evaluator**. It does not
activate that code or accept the separate earlier WP7.1/WP7.3/WP7.3.2/WP7.3.3
gates. Historical sheets and all source code are unchanged.

## Recommended contract

- One repository port owns load/list/create-copy/conditional whole-project
  commit. Domain calculations never depend on browser, HTTP or SQL clients.
- One portable logical revision counts accepted whole-project changes; a
  revision can contain multiple operations. Repository references expose that
  number plus a semantic fingerprint, not an independent browser counter.
- Repository resource identity is separate from existing portable project
  lineage identity, so Save As does not rewrite the baseline's project ID.
- Keep the simplest single-key browser adapter first, behind the port, with
  cooperative whole-library locking and a private bounded capacity. Evaluate
  per-project/transactional storage later without changing domain/port semantics.
- Distinguish known rejection from an unknown commit outcome after a lost
  acknowledgement. Reconcile by transaction ID, never invent a new completion.

## Material revisions to older proposals

[FORMAT6-IMPACT](FORMAT6-IMPACT.md) records the clashes explicitly. Candidate
6.0-A binds browser entry IDs/names into portable transaction digests, equates
library and document counters, and counts virtual Seed+Review as two revisions
for one save. Proposed6.0-B removes routing data from domain history and groups
operations into one accepted project revision. Save As/import copies preserve
logical history instead of creating a fake domain change just to store it.
These are proposed amendments to pending mechanisms, not silently approved
changes or a migration of real format6 data. No production format6 exists.

## Review artifacts and gate

1. [Repository contract](REPOSITORY-CONTRACT.md): interface, invariants, layers and diagram.
2. [Browser adapter decision](BROWSER-ADAPTER-DECISION.md): layout alternatives, race/lock policy and costs.
3. [Format6 impact](FORMAT6-IMPACT.md): identity, revision, hash, baseline and migration consequences.
4. [Concurrency/failure matrix](CONCURRENCY-FAILURE-MATRIX.md): exact acceptance and execution limits.
5. [Future API adapter](FUTURE-API-ADAPTER.md): illustrative requests and server authority, no endpoint implementation.
6. [Implementation impact](IMPLEMENTATION-IMPACT.md): bounded next private slice and activation gates.
7. [Owner decisions](OWNER-DECISIONS.md): independent choices, all new boxes blank.
8. [Verification](VERIFICATION.md): actual regression results and fake contract examples.

The examples use toy in-memory snapshots, not a production repository or
format6 codec. No browser keys, real project data, baseline, accepted evaluator,
UI, existing decoder/engines/configs or prior acceptance records change.
Commit/push this design only; stop for owner review. P09 implementation,
collaboration, main merge, tags, deployment and WP8 remain outside this package.
