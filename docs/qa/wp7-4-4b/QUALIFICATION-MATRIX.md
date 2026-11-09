# Executed qualification versus proposed production checks

No production format 6 reader/model exists in this package. Counts below are
separate suites, not one combined claim of codec conformance.

| Group | Expected / actual result | Executed evidence |
| --- | --- | --- |
| Independent canonical bytes |37 fixed expected inputs/bytes match maintained Node 5.1 and C# reference; raw/prefixed hashes also match | [vectors](fixtures/vectors.json), [358 assertions](evidence/canonical-results.json), [C# output](evidence/cross-results.json) |
| Ordering/Unicode/structures | UTF-16 non-BMP order, nesting, preserved array order, empty structures, controls/escaping/supplementary text and distinct NFC/NFD bytes | Fixed vectors, not Bugsys recipe outputs |
| Numeric edge cases |24 RFC bit cases plus nonfinite, safe-integer/domain distinctions; binary64 and decimal-input paths compared | Part of 358; valid JCS unsafe-integral output is not Bugsys domain acceptance |
| Raw lexical negatives |16 raw cases; strict probe rejects exact expected families and keeps input bytes unchanged | Part of 358; ordinary parse/decode loss separately demonstrated |
| Simplified Node sample | toJSON normal data key does not canonicalize correctly; Infinity may turn into null | Recorded adoption rejection; maintained 5.1 resolves the valid vector, no vendor patch |
| C# raw parser | Leading-zero01 unexpectedly accepted by reference | Recorded hardening limit; strict lexical probe rejects it; no production parser adoption |
| Integrity scope | Member-order/pretty independence, array sensitivity, retired data/lifecycle/before-context/archives/reviews/B/history covered; exportInfo excluded; altered digest/snapshot/profile rejected; no self-hash/repair | Part of 358; envelope probe is not full schema acceptance |
| Representative full snapshots |30/40-task Node and C# snapshot digests match | [Capacity cross-hashes](evidence/capacity-results.json), not independent golden values |
| Synthetic capacity |9 families x3 fresh measured processes plus 9 warmups; sizes/phases/memory/contributions/input hashes recorded | [Capacity report](CAPACITY-REPORT.md), 27 measured runs |
|10 MiB raw input |10,485,759 and 10,485,760 bytes pass lexical/resource gate; 10,485,761 rejects FileTooLarge |3 of 9 boundary checks; valid synthetic project JSON plus trailing whitespace, not real reader acceptance |
| Depth root=1 |63/64 pass, 65 rejects NestingTooDeep |3 of 9 boundary checks; schema-free arrays, not valid project fixtures |
| Flat resource stress |100,000-element numeric array; 8 MiB string; 100,000 unique IDs with maximum safe sequence stamp: shallow depth, independent counts |3 of 9 boundary checks; domain/path limits not asserted |
| Existing application regression |625 unit/component tests in 37 files; 223 Chromium browser checks; lint/typecheck/build | [check](evidence/check.txt), [browser](evidence/browser-all.txt); not format 6 conformance |
| Scope/import/asset/reference audit | No src/config/dependency change, no App import of qualification, byte-identical application assets, pinned references match, existing edits preserved | [Scope audit](evidence/scope-audit.json) |

## Proposed future tests - NOT executed/passed here

- Real format 6 reader rejection must retain original raw bytes, accepted project/
  ref and immutable baseline for duplicate/Unicode/numeric/corrupt/profile/
  oversized/deep inputs. The probes preserve only their input data; they have
  no accepted-project state to exercise. No vacuous fake-state preservation pass.
- Full schema/field-path limits, original-baseline/known-lineage guards, history/
  lifecycle/correction consistency, guided successor closure, overflow/ID reuse,
  unsupported versions and 1–5 upgrade/down-export behavior need a real codec
  and native accepted-state tests after authorization.
- Complete semantic validation cost, long critical paths/arbitrary DAGs,
  browser/mobile/managed memory, responsive/cancellable UI handling and actual
  storage/disk concurrency/durability are unmeasured. The recipe uses repeated
  five-task chain/diamond blocks, not every graph shape or student workload.
- Input caps are resource policy; field limits must still reject oversized
  strings/arrays in invalid domain locations. Neither shallow nesting nor a
  valid digest makes arbitrary JSON a valid project.

The prior 199 authoring checks and old regressions are not recycled as these
qualification assertions. No final owner checkbox is changed by a test pass.
See [recommendations](R07-FINAL-RECOMMENDATIONS.md) for resolved reference
deviations and the remaining F04/F08 implementation conditions.
