# WP7.4.1 owner review and bounded next authorization

Read [README](README.md), [P01](P01-CALCULATED-COMMITMENT.md),
[P09](P09-STORAGE-DECISION.md), [format6 candidate](FORMAT6-CONTRACT.md),
[P11](P11-LIFECYCLE-DECISION.md), [P12](P12-CONSUMER-CONTRACT.md),
[acceptance tests](ACCEPTANCE-TEST-MATRIX.md), [sequence](IMPLEMENTATION-SEQUENCE.md)
and [verification limits](VERIFICATION.md).

## Inherited owner intent, not new unchecked mechanisms

The WP7.4.1 requirement records P01-P08 conditionally approved. It carries
forward original baseline immutability, date-only first-ever Actual Start,
append-only corrections, no effort decrement, four statuses/optional logs,
late keep/sever with reason, early exact-keep default/explicit advance, no
backdated plan, all-predecessor deterministic review and draft/preview/atomic
apply-and-save with a reasoned Unresolved outcome. Implementation contracts
must satisfy these conditions; the old WP7.4 Pending sheet is not rewritten.

P01 additionally requires confirming **computed** start/finish, not merely a
lower bound. P10 is approved only in principle and still needs owner visual
review. P09/P11/P12 remain deferred until independently decided below.
Nothing here converts conditional agreement into approval of an unexamined
storage API, format, reference policy or journal mechanism.

## Independent decisions - all unchecked

Choose Approve / Defer / Reject per row; record alternatives. Partial approval
does not imply another row. Deferral blocks only slices needing that choice.

| Decision | Recommended mechanism and consequence | Approve | Defer | Reject | Conditions / alternative |
| --- | --- | --- | --- | --- | --- |
| P01-C | Distinct floor and exact keepHold; all retained bounds compute one start/finish; confirm the result. Approve C01-C12 examples and explicit floor replacement on Advance. | [ ] | [ ] | [ ] | __________ |
| P09-F | Candidate6.0-A exact fields/replay/hash/whole-baseline guard, explicit Save As copy-upgrade, compatible raw backup, versions1-5 preserved and no lossy down-export. New public codec remains gated. | [ ] | [ ] | [ ] | __________ |
| P09-S | Isolated10MiB-bounded v2 library/name labels, one whole-library cooperative Web Lock, locked revision/hash recheck and one write before publication. Fail closed if locks unavailable; support limited to tested contexts. No multi-key/power-loss guarantee. | [ ] | [ ] | [ ] | __________ |
| P11-D | Phase-one deletion guard for explicit new fact/review/context references; historical seed/before snapshots validate at their own revision. Unreferenced active purge can retain private source snapshots; no privacy erasure claim. Alternative disable all v6 task deletion until archive. | [ ] | [ ] | [ ] | __________ |
| P11-C | Copy legacy source options/fresh unchecked criteria/one-time effort seed; fresh IDs with no Actual Start/status/review history or revised floor. New computed commitment requires preview; counters never reused. | [ ] | [ ] | [ ] | __________ |
| P12-E | Pure evaluator interface, pre-review Known W reference selection and explicit Unknown instead of fallback; outside-closure overdue prerequisites require review. First implementation is unused by App/storage. | [ ] | [ ] | [ ] | __________ |
| P12-I | Source-of-truth/consumer labels and every editing/import/save gate; no public v6 until all are integrated. PA1, FF and legacy CPM rules stay unchanged; new W-aware algorithms separate. | [ ] | [ ] | [ ] | __________ |

Open choices to resolve explicitly: Is fail-closed locking acceptable on
unverified browsers? Is private snapshot retention acceptable when active
unreferenced data is deleted? Does missing/ReferenceOnly W yield Unknown
historical comparison as proposed? Is the unused pure-first slice enough
before the wider persistence/integration decisions are settled?

Owner / date: ____________________ Reviewed design SHA: ____________________

## Design acceptance and independent earlier gates

- [ ] Accept WP7.4.1 as implementation-readiness design only.
- [ ] Further design/spike verification requested: ____________________
- [ ] P10 visual review completed separately; conditions: ____________________
- [ ] WP7.1 acceptance recorded separately.
- [ ] WP7.3 acceptance recorded separately.
- [ ] WP7.3.2 acceptance recorded separately.
- [ ] WP7.3.3 acceptance recorded separately.

## Separate first-slice authorization - not granted by design acceptance

- [ ] Authorize **WP7.4.2: pure calculated-commitment evaluator only**, under
  [IMPLEMENTATION-SEQUENCE](IMPLEMENTATION-SEQUENCE.md), after P01-C/P12-E
  decisions. New unused module/tests only, zero App/UI/format/storage/status/
  baseline/PA1/FF/CPM change.
- Approved scope/alternatives and acceptance gates: ____________________
- Remaining blocking decisions: ____________________
- Owner / date: ____________________

This box remains unchecked. A separately named owner request is required to
start that package. It does not authorize the private codec, activation,
archival or Gantt slices. No main merge, tag, deployment, rebaseline or WP8.
