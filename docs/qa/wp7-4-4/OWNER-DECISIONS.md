# R07 owner decisions — Pending

The owner selected Option A: authoritative self-contained current state with
structured explanatory history. This choice is fixed for this design, not a
new approval request. WP7.4.3b port/test-only acceptance remains recorded in
[its acceptance sheet](../wp7-4-3b/ACCEPTANCE.md). It does not approve the proposed
R07 mechanisms below. All new decision and acceptance boxes remain blank.

The questions required by WP7.4.4 have concrete recommended answers in the
contract. This sheet records unresolved **owner acceptance**, not unspecified
implementation defaults. Choose independently and state any alternative.

| ID / question | Recommended decision and consequence | Approve | Defer | Reject |
| --- | --- | --- | --- | --- |
| F01 Minimum portable snapshot | Adopt snapshot-history/1 envelope and full Current/Unknown/originalBaseline/history/origin fields. Snapshot alone supplies current state; no optional fields are silently fabricated. More explicit data than legacy files. | [ ] | [ ] | [ ] |
| F02 History optionality/contradiction | History header mandatory, events may be empty with honest coverage. Preserve all known events; validate linked/current assertions and correction chains, reject contradictions, never replay patches or auto-repair current state. Partial coverage cannot certify completeness. | [ ] | [ ] | [ ] |
| F03 Revision/order/copy identity | One logical revision per accepted domain change, multiple events per revision; sequence and timestamps are separate. Copies keep portable lineage/revision but get repository resource ID/receipt. No global ordering across diverged copies. | [ ] | [ ] | [ ] |
| F04 Canonical serialization/digest | Adopt RFC8785 JCS and bugsys-jcs-sha256/1 with exact domain prefix/full-snapshot scope. Preserve every array order/string; exporter metadata outside digest. Requires native cross-language vectors later; existing fingerprints remain unchanged. | [ ] | [ ] | [ ] |
| F05 Unknown actuals and evaluator boundary | Inline current actuals/status authoritative; missing dates remain Unknown. Do not invent transitions for existing decodeProgress/evaluator. Separately design an event-independent read-model adapter/interface or return Unsupported when not lossless. No accepted evaluator change here. | [ ] | [ ] | [ ] |
| F06 First baseline/working references | Full original baseline and WP1 interpretation immutable, including opaque JSON. Reviewed W stores input/calendar context and all active decisions; stale references become explicitly Unreviewed. No load-time regeneration of B/W/A. | [ ] | [ ] | [ ] |
| F07 Legacy mapping/backup | Explicit copy-upgrade1–5 with raw source retained and digest/provenance. Missing history/starts/remaining stay Partial/Unknown, no fake Seed/review or lossy downgrade. No implicit v1 library/key migration. | [ ] | [ ] | [ ] |
| F08 Strict errors/limits/unknown fields | Reject duplicates, unsupported fields/profiles, bad digest and unsafe opaque numbers; portable10MiB/depth64 initial limits. Legacy files accepted by lenient readers can be ineligible for strict upgrade; retain originals instead of dropping/rounding evidence. | [ ] | [ ] | [ ] |
| F09 Lifecycle/history retention | Prevent future deletions that would orphan retained fact/history/decision references; no tombstone/archive feature in this profile. Existing deletion code stays unchanged until separately gated integration. This can constrain later task management. | [ ] | [ ] | [ ] |

Conditions / alternatives per item: _______________________________________

Owner/date: ____________________ Reviewed design SHA: ____________________

## Design acceptance and next authorization

- [ ] Accept WP7.4.4 as a design-only R07 handoff.
- [ ] Explicitly accept the schema decisions F01/F02/F03/F05/F06/F09, with conditions: ______
- [ ] Explicitly accept compatibility F07/F08, with conditions: ______
- [ ] Explicitly accept canonicalization/integrity F04/F08, with conditions: ______
- [ ] Further analysis requested: _________________________________________

R07 is not final until schema, compatibility and integrity decisions are all
explicitly accepted. Design acceptance alone does not start implementation.
Recommended next slice is a separately named unused pure model/validation and
canonical-vector foundation, only after those decisions are frozen. No codec,
adapter, repository activation, production integration, migration or UI follows
automatically. R04/R05 physical-adapter conditions remain separate. Earlier
independent owner acceptance gates, main, protected tags and WP8 are unchanged.
