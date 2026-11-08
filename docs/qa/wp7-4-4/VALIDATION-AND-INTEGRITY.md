# Proposed canonical representation, validation and recovery

F04/F08 have conditional approval; qualification remains pending. No canonicalizer, lexer, decoder,
serializer, repository provider or migration is implemented by this package.

## Deterministic bytes and digest scope

Use JCS as specified by [RFC8785](https://www.rfc-editor.org/rfc/rfc8785.html)
for canonical JSON: recursively order object names by UTF-16 code units, keep
array order, serialize finite binary64 numbers/strings by its rules, emit UTF-8
without insignificant whitespace, and reject duplicate names/invalid Unicode.
Do not normalize Unicode strings. JCS is an informational RFC, not an IETF
Standards Track specification. This is a proposal to adopt it, not a claim that
the current JSON.stringify-based serializers already implement it.

Define this application's profile exactly:

```text
profile = bugsys-jcs-sha256/1
P = UTF8("bugsys-gantt/snapshot-history/2\n")  // final byte LF(0A)
D = lowercaseHex(SHA-256(P || JCS(file.snapshot)))
file.integrity.snapshotSha256 = D
canonical full file bytes = JCS(file)        // no BOM or trailing newline
```

The full envelope is serialized only after D is assigned. No digest includes
itself, and no hash reference requires recursive serialization. Pretty JSON is
valid input; canonical export produces deterministic bytes for a fixed complete
envelope. Re-export time can change envelope bytes but not D for the same snapshot.

D covers logical revision, origin/provenance, project/task inputs, graph,
ordering/allocation, current statuses/actuals/criteria, stored work/remaining,
forecast assumptions, current ACTIVE commitments, complete lifecycle decisions
and their preserved before-context, archived dependency episodes, scope reviews,
full baseline including opaque extras and all history/coverage/sequence metadata.
Retired task/progress/actual/effort values stay inside D; calculation filtering
does not remove them from integrity. It excludes exportInfo and integrity
by construction. Repository IDs/labels/receipts/URL/auth metadata are absent.
The recognized root format/schema/profile are validated independently; the
prefix prevents silently interpreting the same snapshot under another profile.

Repository fingerprint provider for Snapshot6 must return D under this approved
profile; current port treats it as opaque. The WP7.4.3b fixture-only JSON string
fingerprint is not eligible. A future backend must match the same byte profile,
not substitute a physical row/version hash. No provider is installed here.

## Application normalization choices

| Value class | Exact proposal and consequence |
| --- | --- |
| Current tasks/predecessors/criteria/manualOrder/logs/events/decisions and every other array | Preserve stored order, including arrays whose current calculation is set-like. Never sort during load/hash. Equivalent reordered sets can have a different D; the CAS contract intentionally detects representation changes. Object-member order alone does not change D. |
| Object maps | Canonicalize keys only; do not reorder associated arrays or rename keys. Safe map/null-prototype access supports valid task IDs such as `__proto__`; duplicate JSON names are rejected before object construction can erase them. |
| Numbers | Domain integer/counter/slot rules unchanged; all integer-valued JSON numbers must be safe integers, including opaque extras. Other numbers must be finite binary64; domain effort/settings retain their existing two-decimal limits. Lexical1/1.0 are the same numeric value; -0 canonicalizes as0 and has no distinct domain meaning. No string-to-number coercion. |
| Dates/timestamps | Validate exact strings described in FORMAT6-CONTRACT; no local timezone conversion or inferred midnight/hours. Nonworking historical actual dates remain dates. reviewTimezone is explicit IANA label metadata, never a hidden calendar clock. |
| Strings/IDs | Preserve exact code points, whitespace, case and IDs after validation; new UI validation can constrain input before acceptance, but import cannot silently trim. Visually identical Unicode sequences can remain distinct identities/digests. |
| Optional fields | Omission differs from null, false,0 and empty array. Apply only explicitly defined mandatory Unknown/null representations; no normalizer invents omitted format6 fields. |
| Baseline/legacy payload opaque values | Preserve complete JSON values, not just known decoder output. Nonrepresentable/unsafe values block copy-upgrade; keep original readable file, never round, stringify, remove or regenerate them. |

Wire JSON syntax is based on [RFC8259](https://www.rfc-editor.org/rfc/rfc8259.html).
This profile additionally requires strict UTF-8, no BOM on export, one root
object and duplicate-name rejection. A future reader may accept one leading
UTF-8 BOM for recovery only after an explicit compatibility decision; the
recommended strict profile rejects it and retains original bytes. Set an initial
portable input cap of10MiB UTF-8 and nesting depth64, with typed limits errors;
both are PROVISIONAL under F08, not finally accepted bounds. Qualify them with
realistic/larger projects, repeated lifecycle snapshots, archive/rationale growth,
bytes at limit-1/limit/limit+1 and depths63/64/65 before implementation.
These are file resource bounds, not a browser-library or DBMS storage layout.
Count the root container as depth1; each nested object/array adds1, primitives
add no container depth. A schema6 file with no recognized profile is
Unsupported(UnidentifiedFormat6), never guessed to be an A/B draft.

## Validation order and typed taxonomy

Every rejected import/upgrade leaves accepted state/ref/baseline/source bytes
unchanged and retains the draft/raw file for recovery. Validate into a detached
candidate; never publish a half-decoded object. Proposed order:

1. Resource/UTF-8/JSON lexical validation, including duplicate names and depth.
2. Recognized format/schema/profile/integrity profile and exact new field/kind set.
3. Complete structural/scalar validation without filling missing required fields.
4. Recompute D from the validated parsed snapshot; mismatches reject.
5. Active graph/domain/status/criteria/actual/commitment/baseline invariants,
   sequence/reference/correction consistency and linked-history contradictions.
6. Repository-bound acceptance guards: expected revision/fingerprint, exact
   next revision, preserved baseline/known lineage/history/lifecycle/archive/
   review prefixes and high-water marks. Check the full affected closure against
   accepted inputs, not a UI-supplied "reviewed" flag.

Retirement checks additionally require: full retained registry/map coverage;
consistent lifecycle last-kind/decision chain and before-context; rationale/date/
honest nullable actor; no active retired predecessor; unique archive IDs/retained
endpoints; matching review/event/decision references; one final successor outcome
per affected ID; and active-only W/input coverage. Restoration never removes old
records or silently reinstates archived edges. An old archive can coexist with
a later explicitly active pair; their union is not the current DAG. Proposed
issues include InvalidLifecycle, MissingRetirementRationale,
IncompleteSuccessorReview, ActiveRetiredPredecessor, OrphanArchive,
ConflictingDecisionDefinition, LifecycleHistoryRewrite and
UnconfirmedRestorationEdge. An isolated file cannot prove its original review
closure/provenance without an accepted source snapshot.

Cancelled undispatched review has no accepted change; a definitive failed whole
transaction preserves every accepted field. OutcomeUnknown after dispatch uses
the exact original request/receipt for reconciliation. No receipt ledger lives
in this file. Show Retired Tasks and relic geometry are view-only, outside the
file/digest, and cannot change schedule, baseline, status or logical revision.

Steps1–5 are pure file validation. Step6 requires an accepted target and is
not provable from an isolated imported file or checksum. No event replay is
used to reconstruct current state. No load-time recalculation replaces B/W/A.

| Proposed issue family | Examples and handling |
| --- | --- |
| ResourceLimit | FileTooLarge, NestingTooDeep; stop before publication. Limits must also bound large arrays/strings in later implementation tests, without an unreviewed truncation rule. |
| Syntax | InvalidUTF8, InvalidJSON, DuplicateMember, InvalidUnicode, NonRepresentableNumber; preserve exact original bytes. |
| Unsupported | WrongFormat, UnknownSchema/Profile/IntegrityProfile/EventKind/Field/Interpretation; no speculative older parser, silent drop or downgrade. |
| Structure | MissingRequiredField, WrongType, InvalidDate/UTC/Id/Counter; report path and reason. |
| Integrity | SnapshotDigestMismatch; reject without offering automatic hash replacement as repair. |
| Domain | DuplicateTask/Claim/Event/CriterionId, cycle/orphan, invalid checklist/status/slot/context, contradictory actual dates, linked assertion mismatch or invalid correction chain. |
| Compatibility | AmbiguousLegacyField, MissingRequiredLegacyEvidence, UnsafeOpaqueValue; retain legacy source; explicit reviewed copy-upgrade/recovery only. Missing evidence representable as Unknown/Partial is not itself an error. |
| AcceptedStateConflict | Changed/removed known original baseline, history rewrite, lowered allocation/sequence mark or stale expected ref. File can be valid by itself while unsafe to overwrite an accepted target. |

Map these issues to the existing port's Validation issues, Unsupported, Conflict
or known StorageFailure only at the appropriate boundary. Port OutcomeUnknown
is for uncertain dispatched writes, not a malformed file or proven rollback.
No new port discriminants or changed error handling are implemented here.

## Integrity boundaries and corruption recovery

D detects accidental inconsistency in the snapshot, not who authored it. It
does not authenticate actorLabel, prove the first-ever baseline globally, certify
the truth of dates, or prevent an editor changing both data and D. There is no
signature, audit service, trust chain or tamper-proof history claim. ExportInfo
has only schema validation and is deliberately outside D; raw backup checksums
can cover the exact complete file bytes externally when required.

Known baseline equality is enforced within a cooperating accepted repository
namespace. Unknown imported lineage can only be validated/frozen as supplied;
cross-device first-baseline authenticity needs a separate trusted system.
Baseline semantic JSON equality and source raw-byte preservation are different
invariants. Never replace the original stored WP1 schedule with a new result.

For corruption, keep the last accepted copy and original failed file, report the
specific issue and offer a separate known-good backup. No partial history drop,
baseline repair, ID renumbering, status reset, guessed date or automatic hash
recalculation. A separately authorized recovery tool would produce an explicit
new evidence-bearing copy with provenance; it is outside this design handoff.

Actual verification limits and future canonicalization cases are in
[SCENARIO-MATRIX](SCENARIO-MATRIX.md). Example digest authoring checks use only
ASCII-key/integer fixtures and built-in JSON tools; they are not a JCS/codec
implementation or cross-language conformance certification.
F04 still requires independent cross-language vectors plus Unicode, numeric
and duplicate-member coverage before implementation. F08's realistic/larger
fixture/capacity qualification remains outstanding. Existing browser checks and
small fictional examples do not discharge either condition.
