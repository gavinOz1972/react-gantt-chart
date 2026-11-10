# Executable conformance traceability

Suite: [conformance.ts](tests/conformance.ts), instantiated by the existing-config
[runner bridge](../../../src/repository/operationalHistoryRepository.test.ts).
**76 runtime cases** after parameter expansion; compile-only assertions are separate.
The reusable suite calls the public port and explicit test controls, not the old
repository adapter or application code. Fixture expected values/commands and
validation guards are authored separately from reference publication/paging logic.

| Required contract / direction | Exact case IDs in suite | Evidence / boundary |
| --- | --- | --- |
| D01 operational projection without historical payloads | O01, O03, O07 | Expected keys/contents, explicit retained detail/evidence, deeply detached results. No physical memory claim. |
| Immutable B separately available; no inference of missing B | O02, O04, E02 | Present/Absent, opaque bytes as values preserved; B/current active scope compared without reconstructing past schedules. |
| Identity versus routing / full revision provenance | O05, T01, T02 | Same semantic fixture across different resources has same fixture ref; receipts bind resource and original commit. No production D qualification. |
| Honest facts, coverage and work completeness | O01, O06, P05, W01, W02 | Unknown dates/actor metadata, CompleteSince/Partial, Available empty versus Unavailable, recorded-only versus total actual. |
| Pinned stable pages under accepted writes | P01, P02, L02 | Old operational/history/lifecycle view remains stable; fresh session sees append/restore. Equal timestamps and overlapping task filters deduplicate by immutable event ID. |
| Cursor exact endpoint/filter/sort/watermark/page binding | P03 (8 cases), S02 | Foreign session/resource/endpoint and changed date/sort/filter/limit/bytes explicitly InvalidCursor; tampered handle metadata rejects. |
| Date filters and null dates | P04, P05, P08 (3 cases) | Distinct UTC recording/date-only effective basis, inclusive/exclusive limits, explicit undated policy and strict invalid date rejection. |
| Item/byte bounds, complete oversized records | P06 (6), P07 (4), P09, P10 | Bounds validate; RecordTooLarge without truncation; rich response byte budget shrinks pages with stable continuation. |
| Retained task filters and name ties | P11, O03 | Stable summary IDs, exact missing filter yields empty page; selected missing task is NotFound. |
| Read expiry/release/unsupported pinning/cancel | S01–S03 | Injected clock, dropped pinned data, repeat release, foreign namespace, explicit Unsupported, cancelled undispatched reads/new writes. |
| Retire early task, common source and complete successor closure | L01, L04 (14) | Diamond T1→T2/T3→T4, T5 predecessor retained, one outcome per unique ID, archives/rationale/linked IDs, incomplete evidence atomic rejection. |
| Restore without automatic archive reactivation; repeat episodes | L02 (2), L03 | Explicit reconnection or none; old archive trail retained; current state and per-episode resolution separated, latest/all filters correct. |
| Stale review/revision/fingerprint | L04 stale-review case, T01, T09 | Whole candidate rejects; no event/counter advance, generic source edit cannot bypass a changed graph's review. |
| Exact retry and changed intent | T02, T04 | Original receipt plus later current ref; same ID/changed intent conflicts; rejected candidate does not consume accepted intent. |
| Post-publication uncertainty and cancellation | T03 | OutcomeUnknown → exact receipt reconciliation with no duplicate append, including aborted retry after uncertain dispatch. |
| Boundary failures/malformed input/immutable evidence | L04, T04–T06, T10 | Injected pre-publication or throwing validator/fingerprint, partial entity, baseline overwrite, empty transaction, missing links/IDs and nonfinite payload reject atomically. |
| Counter and identity safety | T07 (3), T08 | Revision/sequence overflow, allocation decrease reject; explicit fresh task does not erase existing IDs or modify B. |
| Work record/cache atomicity and no inference | W01–W05 | Correction/retraction, unavailable source, bad hours/precision, aggregate overflow and same-batch correction fork; status/actual/remaining unchanged. |
| Export honesty | E01 | Explicit Unsupported(PortableExportNotQualified), no sink bytes/state change. Full /2 export is **unpassed**, not a skipped positive conformance claim. |
| D03 / FR-HIST-01 boundaries | E02; compile-only typeChecks.ts | No arbitrary reconstruction or named capture endpoint. First B remains distinct. No report UI/PDF or snapshots. |
| D04 additive and readonly contracts | typeChecks.ts, unchanged old port tests | Full S is not OperationalView; brands preserved; facts/session/registry/generic B readonly. Expected type errors compile; no TS config changes. |
| D05 / no application wiring | evidence/scope-audit.json | No App/runtime consumer, provider/codec/storage/UI/engine modification; same built assets. Not a physical storage conformance test. |

All current cases pass. Existing 625 unit/component cases remain; combined total
701 in 38 files. The 223 existing Chromium cases exercise unchanged app behaviour,
not the new port. Prior WP7.4.4b/c measurement assertions are not counted again.

Unpassed future gates: complete /2 serializer/JCS and strict validation, preserved
real-source rejection, qualified larger-cap recovery, provider native concurrency/
atomicity/crash/durability, lazy I/O/scale, consumer parity, report UI/PDF and
FR-HIST-01. Passing this semantic oracle does not accept final R07 or choose a
physical storage implementation.
