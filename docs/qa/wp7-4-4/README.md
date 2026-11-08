# WP7.4.4 — R07 portable file design

**Design handoff only.** R07 remains Pending until the owner explicitly accepts
the schema, compatibility and integrity decisions. No parser, serializer,
migration, repository integration, storage or UI is implemented here.

Work branch: `feature/wp7-stabilization`. Actual starting HEAD:
`4f8d70548bfbc2867fdfd859d6bf54e8867342e7`. Client review date:2026-11-08,
America/Regina. Existing local review/evidence edits are preserved.

Authority: the request to implement
`react-gantt-chart/docs/WP_Req/Bugsys_WP7_4_4_R07_File_Format_Design.docx`,
SHA-256 `d8c17d8a75f9a03e5a443fe9cfdd423cdf3f10294a70df8ba2b2a9996f4dd42f`.
The owner selected **Option A**: a self-contained authoritative current
snapshot, immutable original baseline and structured explanatory history.
Replaying events is not necessary to load the current project.

## Recommendation and reading order

1. [FORMAT6-CONTRACT](FORMAT6-CONTRACT.md): candidate `snapshot-history/1`,
   required snapshot fields, Unknown, original baseline and event invariants.
2. [JSON-EXAMPLES](JSON-EXAMPLES.md): complete fictional files, including the
   November2/November6 T1 reality case and T2 decisions.
3. [MIGRATION-POLICY](MIGRATION-POLICY.md): explicit legacy copy-upgrade,
   preserved source bytes, missing history and interrupted migration.
4. [VALIDATION-AND-INTEGRITY](VALIDATION-AND-INTEGRITY.md): canonical bytes,
   digest scope, corruption/failure classification and recovery.
5. [SCENARIO-MATRIX](SCENARIO-MATRIX.md): proposed acceptance cases versus actual
   design/example/regression checks and their limits.
6. [OWNER-DECISIONS](OWNER-DECISIONS.md): concrete recommendations and remaining
   consequences; new acceptance/decision boxes remain unchecked.
7. [IMPLEMENTATION-SEQUENCE](IMPLEMENTATION-SEQUENCE.md): separately authorized
   follow-on slices and unchanged production boundaries.

## What changes from previous proposals

| Prior proposal/contract | This design's explicit consequence |
| --- | --- |
| [WP7.4.1 candidate6.0-A](../wp7-4-1/FORMAT6-CONTRACT.md) requires Seed/patch replay and root equals replay | Superseded as a proposed file shape. Snapshot is authoritative; history is explanatory/validated evidence, never a load-time reconstruction algorithm. |
| [WP7.4.3a6.0-B](../wp7-4-3a/FORMAT6-IMPACT.md) retains grouped replay and planning subversion2 | Retain approved identity/revision/receipt separation, but replace the proposed field layout/replay requirement with a distinct root profile. Do not auto-read unofficial A/B drafts. |
| Existing progress decoder verifies transitions by replay from Not Started | Keep it unchanged for formats1–5. A future event-independent current-state validator/read-model adapter is required for this profile. Never fabricate status transitions just to satisfy it. |
| Accepted [WP7.4.3b port](../../../src/repository/projectRepository.ts) is generic and unused | Proposed Snapshot6 can instantiate S with no port implementation change. Real validation/fingerprint provider and integration remain gated. |
| Accepted unused [WP7.4.2 evaluator](../../../src/planning/workingPlan.ts) requires replay-valid ProgressTracking | Complete-history legacy projections may fit; partial history/unknown completion cannot safely be projected. Propose an event-independent input adapter/interface review, not fake events or changes to the accepted evaluator. |

Baseline/current commitments/actuals/outlooks stay separate. Two hours of effort
does not imply two days or a November2 actual completion. A November6 end-of-day
completion releases a retained successor conservatively on the next working day;
it never proves T2 started. See the complete examples and their stated calendar.

No baseline regeneration, forecast/PA/FF/CPM change, extra work status,
mandatory log, application activation, physical adapter, API/DBMS,
main merge/tag/deployment or WP8 is included. Stop for owner review.
