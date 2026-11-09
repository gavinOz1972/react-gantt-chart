# Recommended owner dispositions - R07 not finally accepted

Authority: WP7.4.4b qualifies F04/F08 against snapshot-history/2 and accepts F09
in principle for this design qualification. No automatic implementation follows.

| Item | Exact recommendation | Remaining condition / consequence |
| --- | --- | --- |
| F04 algorithm/scope | **Approve RFC 8785/JCS + UTF-8 + SHA-256 with exact `/2` prefix/LF and snapshot-only scope**, based on 37 independent byte vectors and Node/.NET matching evidence. Keep snapshot-history/2 and bugsys-jcs-sha256/1; no amendment needed. | Owner must accept evidence/reference-adoption findings. Full production lexical/domain/codec integration is unimplemented and needs native negative/parity tests. Finite test evidence is not blanket library certification. |
| F08 resource policy | **Conditionally approve initial default 10 MiB raw portable input and depth 64**, as a configurable application resource policy, not an unlimited-lifetime/task-count guarantee or storage quota. Keep profile/digest unchanged. | Full semantic-validation cost, reader preservation, browser/mobile/managed environment and UX budgets must be qualified in an authorized implementation slice. The measurements cover test-only Node probes/reference code. |
| F08 oversized handling | **Reject over configured bounds before publication; preserve raw source, accepted project/ref and immutable baseline, retain draft/recovery path. Never prune history/round/drop data.** | No production reader exists, so state-preservation behavior is proposed, not passed. Explicit higher-cap/read-only tooling or format/retention redesign needs separate owner authorization and memory/performance evidence. No automatic cap escalation. |
| F09 consistency | **Retain the retirement/restoration design accepted in principle**: full registry, active-only graph, immutable before-context/archives/reviews/history and whole-closure atomic commit. | Repeated cycles materially grow data at fixed task count. Complete schema/transition/reference/closure/lifecycle consistency and real workflow/transaction tests remain pending; qualification recipe is not their implementation. |

## Decisions exposed by qualification

**Q01 - Reference adoption:** reject the simplified Node/RFC sample as a production
candidate because of its toJSON-member/nonfinite behavior. Do not adopt the C#
raw parser without strict lexical validation (it accepts leading-zero 01).
Maintained Node 5.1 and C# serialization give matching valid-vector bytes. No
vendor algorithm was patched to make tests agree; exact versions/pins are retained.

**Q02 - Capacity lifetime:** history preservation is unbounded over time, while
safe input resource policies must be bounded. A 100-task synthetic with 20 cycles
exceeds 10 MiB even in canonical form. Rejecting an oversized candidate safely is
the recommended first policy, not proof that every lifetime plan can always save.
If the owner requires indefinite history in one portable file at all sizes,
resolve that product/architecture requirement before implementation. No silent
compaction, down-export, baseline rewriting or reset of event/ID counters.

**Q03 - Configuration:** future deployment policy may choose a lower cap or an
explicitly qualified higher cap. Do not accept limits supplied by the untrusted
file itself. Canonical meaning/digest is independent of local policy; operator
configuration must be explicit and tested. No production constant changes here.

**Q04 - Validation boundary:** read/lexical/parse/selected checks/hash costs are
measured; complete lifecycle/domain/codec validation is NOT measured. Add that
cost and real accepted-state/source-preservation tests before activation. A
valid isolated digest does not prove baseline provenance or review truth.

## Preserve prior semantics and stop

F01–F03/F05–F07 and F09 remain authoritative design semantics: Option A current
snapshots without mandatory replay; honest Unknown/Partial; immutable first
baseline and history; storage-independent generic repository; retirement and
guided successor closure. No criteria/status/fifth-state/effort/calendar formula
change, evaluator activation, Gantt implementation or WP8 is included.

- [ ] Owner accepts F04 qualification and Q01/reference-adoption conditions.
- [ ] Owner accepts F08 initial policy and Q02/Q03 lifetime/configuration choices.
- [ ] Owner records remaining implementation/verification conditions: __________
- [ ] Owner explicitly accepts final R07 contract at reviewed SHA: __________

Owner/date: ____________________ Disposition/conditions: ____________________

These boxes remain blank. This document is a recommendation, not owner final
acceptance. Do not mark R07 final, begin WP7.4.5, create a production model/
canonicalizer/codec/adapter/migration, enable storage or start integration/WP8
without a separate explicit instruction. Stop for owner review.
