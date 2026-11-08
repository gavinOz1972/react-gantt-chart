# Approved contract traceability and explicit deviations

Authority/status comes from the new WP7.4.3b requirement, not inferred checkboxes
in [the prior decision sheet](../wp7-4-3a/OWNER-DECISIONS.md). The
[prior repository contract](../wp7-4-3a/REPOSITORY-CONTRACT.md), browser decision,
failure/API notes and implementation impact were reviewed against the actual
clean4d32a4e HEAD. WP7.4.2 remains an unused evaluator; earlier independent
acceptance gates are not granted by this package.

| Contract | Implementation and evidence | Boundary |
| --- | --- | --- |
| R01 typed load/list/create/conditional commit | [Port](../../../src/repository/projectRepository.ts), [suite](tests/conformance.ts) C01–C27, [type assertions](tests/typeChecks.ts) | No adapter/framework/browser/network/SQL imports in the port. |
| R02 stored-copy identity distinct from portable lineage; duplicate labels | Branded RepositoryProjectId, reference-assigned IDs; C01–C03/C12–C14 | Instance/namespace-scoped handle; labels never overwrite or change lineage. |
| R03 one logical revision; commit exactly expected+1; copies retain revision | Generic snapshot.logicalRevision, RevisionRef projection; C06–C08/C11/C13/C21–C23 | No independent entry counter or timestamp authority; safe-integer overflow rejects. |
| R06 matching replay, changed-intent conflict, receipt scope | Separate create and per-resource commit maps; C09–C14/C16/C25 | Original committedRef distinct from currentRef. Memory receipt lifetime is reference-instance lifetime only. |
| R08 cancellation/uncertain result | Explicit OutcomeUnknown, typed NotCommitted failures; C15–C17 | Caller can discard an undispatched draft. No cancellation API or false post-dispatch rollback promise. |
| R09 baseline/history validation invariant | Injected SnapshotSemantics; independent fixture baseline/originalWP1/opaque/history checks C18–C20 | Fixture invariants only, no historical authenticity or full v6 validation claim. |
| Readonly/nonaliasing/determinism | Recursive SnapshotValue, detached memory values, frozen inputs C01/C06/C15/C18/C24–C26; compile-only assertions | Result shapes/arrays/order are checked; arbitrary objects/handles are outside fixture data. |
| Typed validation/access/unsupported/storage failures | Exact injected failures on all four operations C15 and throwing boundary C26 | AccessDenied is simulated, not implemented authentication. Busy/capacity are simulated, not lock/quota tests. |
| No production activation | [Scope evidence](evidence/scope-review.json), unchanged bundle hashes and existing regressions | Test bridge is the only src consumer; no App/main/domain/persistence consumer. |

## Adaptations to the illustrative WP7.4.3a types

1. The port is generic over a complete readonly snapshot S, with only the
   approved logicalRevision constraint. The fixed modelVersion/state/history/
   grouped-operation schema from proposed6.0-B is **not implemented or frozen**.
   This is required by the newer R07 deferral, not a substitute schema.
2. IDs/fingerprints/cursors have compile-only opaque brands. The reference
   constructs test IDs locally; no production identity generator or runtime
   authorization claim is added. LogicalRevision is a number with runtime
   safe-integer validation in the reference, rather than a type-level range.
3. SnapshotSemantics explicitly injects create/commit validation (including
   previous/known snapshots) and fingerprint computation. The test implementation
   preserves exact ordered fixture JSON. No shared canonicalization algorithm,
   hash profile, golden vectors, grouped replay or physical serializer is chosen.
4. Result and request names are exported named readonly types; their discriminants
   and load/list/create/commit semantics match the approved port. AccessDenied
   is retained for required simulated failure cases. ProjectSummary is ID/label/ref.
5. Test-only labels are nonblank and at most120 UTF-16 code units, unchanged
   strings with no normalization. Cursors are reference-owned opaque tokens in
   creation order; list is discovery, not a multi-project snapshot. This does
   not define a physical catalog or cross-process cursor lifetime.

These are the complete contract adaptations for this slice. There is no format6
implementation presented as conformance, no hidden receipt export, no automatic
merge and no implicit baseline regeneration. Baseline/history equality in the
narrow fixture uses its exact JSON values/order; final format semantics remain
a separate validation task.

## Layer responsibilities remain separate

Domain/pure validators calculate and verify data; repository adapters enforce
conditional acceptance and receipt atomicity; codecs map portable versions;
application orchestration confirms/retries/reconciles and publishes accepted
React state. This package implements only an unused port and a memory reference
for repository semantics. It does not add an application coordinator or test
that React publishes a newly implemented save route.

R04's proposed single key/cap and R05's cooperative fail-closed Web Lock policy
remain conditional future choices. No code here accesses them. Before a physical
adapter, resolve its real storage/locking/corruption/durability tests. Before a
private format6 foundation, explicitly approve R07 fields/replay/fingerprint/
backup contract. Neither follows automatically from accepting these tests.
