# Consolidated R07 contract proposal

**Authoritative proposal index for this handoff; final R07 acceptance pending.**
Directions D01–D05 are accepted only at the level recorded in
[OWNER-DISPOSITIONS](OWNER-DISPOSITIONS.md). The technical contracts below are
proposals for final consistency review, not implemented or newly accepted models.

## C00: Authority, ownership and reconciliation

The current owner instruction and WP7.4.4d source control this consolidation's
scope. New directions supersede earlier undecided options or optional hypotheses,
not preserved evidence. Keep preceding work packages unchanged as historical
artifacts. One document owns each requirement family:

| Requirement family | Sole detailed owner | Relation to preceding material |
| --- | --- | --- |
| Accepted direction/status | [OWNER-DISPOSITIONS](OWNER-DISPOSITIONS.md) | Records later D01–D05 and A00; earlier WP7.4.4c blank decisions no longer imply these directions are undecided. R07 remains undecided. |
| Portable /2 field shapes and domain semantics | [WP7.4.4a FORMAT6-CONTRACT](../wp7-4-4/FORMAT6-CONTRACT.md) | Reuse exact existing proposal, including F09 amendment. This package does not introduce another Snapshot6 definition. |
| Canonical bytes and strict representation | [VALIDATION-AND-INTEGRITY](../wp7-4-4/VALIDATION-AND-INTEGRITY.md), qualified by [WP7.4.4b vectors](../wp7-4-4b/CANONICAL-VECTORS.md) | Same complete snapshot, prefix, JCS and SHA-256. Evidence is available; production validation is not. |
| Repository capability, memory and concurrent reads/writes | [REPOSITORY-AND-MEMORY-CONTRACT](REPOSITORY-AND-MEMORY-CONTRACT.md) | Consolidates/supersedes the near-term API suggestions in WP7.4.4c. Exact replay/checkpoint methods are excluded under D03. Accepted generic port unchanged. |
| Baseline comparison, retired reports, change log | [HISTORICAL-REPORTING-CONTRACT](HISTORICAL-REPORTING-CONTRACT.md) | Read-only projection requirements and examples; does not add fields to portable /2. |
| Capacity, legacy boundary, validation/publication and future phase gates | [COMPATIBILITY-AND-GATES](COMPATIBILITY-AND-GATES.md) | Reconciles provisional F08 with D02 and preserved-source [migration proposal](../wp7-4-4/MIGRATION-POLICY.md). |
| Future named captures | [FUTURE-SNAPSHOT-REQUIREMENT](FUTURE-SNAPSHOT-REQUIREMENT.md) | FR-HIST-01 is deferred, distinct from B, current snapshot and hypothetical checkpoints. |
| Traceability and evidence | [ACCEPTANCE-MATRIX](ACCEPTANCE-MATRIX.md), [VERIFICATION](VERIFICATION.md) | Document checks and existing application regressions do not establish runtime conformance of these proposals. |

Descriptions in this index refer to those owners rather than creating alternate
field/API definitions. A conflict with a mandatory /2 field is not resolved by a
report fallback, partial view, inferred fact or relaxed decoder. Record it under
the compatibility conflict register and obtain explicit owner amendment if needed.

## C01: Authority of current state and first baseline

Option A stores authoritative Current directly. Load validates current values and
linked explanations; no event replay is required to construct current state.
Explanatory SourceEdit summaries need not reconstruct every intermediate state.
Partial/Unknown remain valid limitations, never filled with invented history.

The first original baseline B is either explicitly Absent or the entire immutable
original JSON value with its pinned interpretation and opaque extras. Once known,
it cannot be replaced, removed or regenerated from later inputs. It is distinct
from current accepted W, calculated WP1 plan, actual facts, forecast and any later
named snapshot. Comparison reads B without rewriting it. A baseline-only ID missing
from legacy current scope does not establish a retirement episode.

## C02: Retained identities, lifecycle and scope review

Retain active and retired task identities/data and all known before-context,
review, archive, correction and explanation records. Current active scheduling
uses only active tasks/edges. Retired predecessors cannot remain active constraints;
archive episodes never form a second scheduling graph. Retirement is not completion
or a fifth progress status. Restore is an explicit review of current consequences,
not assignment of an old graph, baseline or working promise.

Each review freezes a common accepted source/ref, deduplicates successor closure
by stable task ID, preserves unaffected predecessors, records one final outcome
per affected task and commits the entire resolved scope atomically. A changed
source/ref or later conflicting bound requires reconfirmation. Never silently
rebase or keep a stale reviewed flag. Reporting exposes that evidence without
claiming the review actually happened when evidence is missing.

## C03: Operational use and historical access

Normal editing, forecast, critical path and Gantt require current operational
values and derived results, not complete historical payloads in memory. A full
identity/current lifecycle summary remains necessary to keep retired references
interpretable. Detailed retired values/history and the immutable baseline are
explicit purpose reads. Qualified totals and actual/completion facts must preserve
known meaning independently of full legacy event scanning; parity adapters remain
gated. Page/report watermarks guarantee one accepted read view, not arbitrary
historical schedule reconstruction.

## C04: Portable boundary, integrity and safety

Physical decomposition may normalize repeated immutable definitions and query
indexes internally. Complete export must reconstitute exact `/2` content/order,
including retired data, baseline and all retained history, with the existing full
snapshot digest. A partial operational view is not a valid full project snapshot.
Record hashes, query tokens, SQL rowversions and derived totals cannot replace or
enter portable D. Preserve source/accepted state through rejection and unknown
write outcomes under the detailed compatibility and repository owners.

The provisional raw 10 MiB/depth-64 policy is a safety bound, not a format validity,
lifetime-retention or storage-quota promise. D02 controls the pre-publication reopen
gate and separately qualified larger-cap route. No silent record pruning, rounding,
baseline rewriting or automatic cap increase is allowed.

## C05: Near-term history and deferred scope

Near-term product history consists of original-baseline comparison, accessible
explanations/change log and retired-task/episode reporting. Normal Gantt hides
retired rows by default; a future authorized historical-display toggle must not
activate archived dependencies or draw planned-to-retirement elapsed-work bars.
This is a future display contract, not a toggle delivered here.

Exact reconstruction of every intermediate schedule is not required. Neither
replay/checkpoints nor FR-HIST-01 named snapshots are part of the near-term
capability or current wire profile. D05 archival design, report/UI implementation,
adapters, codecs, integrations, WP7.4.5 and WP8 each need a separately named scope
and explicit authorization after their prerequisites are agreed.
