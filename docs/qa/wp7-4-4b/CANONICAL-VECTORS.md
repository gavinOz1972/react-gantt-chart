# F04 independent canonical-byte qualification

Contract pinned: RFC 8785/JCS; UTF-8; SHA-256 of the exact prefix bytes
`bugsys-gantt/snapshot-history/2\n` (one LF, hex 0a), followed by canonical
`file.snapshot` bytes. exportInfo/integrity are excluded; no self-hash. Full
lifecycle/before-context, retired data, archives, scope reviews, baseline and
history are included. No contract/digest-version amendment was made here.

## Independent expected values and provenance

| Input/expected source | Cases | Exact derivation |
| --- | ---: | --- |
| Upstream testdata input/output/outhex |6| Pinned files from cyberphone32a4819; canonical UTF-8 text must agree with independently supplied outhex. |
| RFC 8785 AppendixB IEEE 754 table |24| Literal bit patterns and expected decimal renderings; no Bugsys generator output. |
| Independently specified literals under JCS rules |7| Empty/nested/array order, non-BMP UTF-16 ordering, NFC/NFD distinction, escapes/controls/supplementary text and a normal toJSON data member. |
| **Total** |**37**| Exact inputBase64, expected canonicalHex, raw SHA-256, prefixed SHA-256 and per-case provenance in [vectors.json](fixtures/vectors.json). |

The reference algorithm is documented in [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html).
Expected fixture bytes are fixed literals/reference outputs; their SHA-256 values
are independently hashed in Node crypto and .NET SHA256 without invoking a
canonicalizer. This differs from generating an expected digest using the tested
Bugsys authoring shortcut. Regeneration is [make-vectors](scripts/make-vectors.mjs).

## Implementations actually cross-checked

- Maintained **canonicalize 5.1.0**, commit
  `31fb117afde3ef305b2e1d99bde539bf6300bc62`, Node 24.19.0/V8:
  [source](https://github.com/erdtman/canonicalize/tree/31fb117afde3ef305b2e1d99bde539bf6300bc62),
  [pin/hash manifest](reference/SECOND-SOURCE.json).
- C# JsonCanonicalizer plus its separate ES6 number implementation, commit
  `32a48195b9b20fe67b1795e39e4509f14d860b45`, SDK 10.0.400/runtime .NET 10.0.11:
  [source](https://github.com/cyberphone/json-canonicalization/tree/32a48195b9b20fe67b1795e39e4509f14d860b45/dotnet),
  [pin/hash manifest](reference/SOURCES.json).

Unmodified upstream bytes, Apache notices/full license and versions are retained.
The libraries share RFC authors/provenance; separate language/runtime/number
implementations do not mean independent audit teams or exhaustive certification.
The C# driver retargets compilation only; it does not patch reference algorithms.

## Executed outcomes and discovered deviations

All 37 expected canonical byte vectors and both SHA forms match in Node/.NET.
All 358 assertions pass in [canonical-results](evidence/canonical-results.json),
with raw C# observations in [cross-results](evidence/cross-results.json).
Numeric bit-pattern serialization and decimal-input parsing were separately
checked. Node/.NET also agree on two representative generated 30/40-task snapshot
digests; those are application-scope cross-checks, not independent golden vectors.

1. The simplified Node/RFC sample is **not an adoption candidate**: a valid
   object with non-function toJSON emits insertion order rather than canonical
   member order. Its nonfinite handling can also turn Infinity into null.
   This was exposed and retained, not silently fixed. Maintained 5.1/C# agree
   with the independently specified toJSON expected bytes. Capacity was rerun
   with 5.1; old sample measurements are [historical](evidence/capacity-sample-reference-results.json).
2. The C# reference parser accepts leading-zero 01 and emits 1. The strict
   lexical probe rejects it. Thus C# reference serialization evidence does
   **not** qualify that parser as a production JSON boundary. No reference
   parser/code is integrated into Bugsys.

These are resolved reference-selection/hardening findings, not an ambiguous JCS
byte rule. No valid vector disagreement remains; [owner decisions](R07-FINAL-RECOMMENDATIONS.md)
record the consequences. R07 is still not finally accepted.

## Lexical, numeric-policy and integrity separation

The 16 raw-negative fixtures exercise duplicate names (nested/escaped/array),
malformed/overlong/surrogate UTF-8, BOM, unpaired code units, nonfinite overflow,
NaN/Infinity tokens, trailing comma and leading zero. A test-only scanner runs
BEFORE ordinary JSON.parse; decoded keys are compared without normalization.
It is schema-free and is not a production format 6 parser.

Ordinary parse overwrites duplicate members; nonfatal decoding can replace bad
UTF-8; unpaired escaped code units can survive parse. Those facts cannot be
recovered by later object validation. Tests also demonstrate that malformed
input buffers and deliberately bad envelope objects are not repaired/mutated
by the probes. Accepted-project/ref/baseline preservation through a real reader
is a proposed future negative test, not claimed here.

JCS rendering of finite values such as2^53 or huge integral binary64 values can
be valid while Bugsys rejects them under its safe-integer policy. Fractional
planned slots and overprecision effort are separately rejected by selected
policy assertions, not called JCS failures. Negative zero renders 0; RFC bit
cases include subnormals, exponent transitions, maximum finite values and
rounding boundaries. This does not implement complete field/domain validation.

Envelope probes show member-order/pretty-spacing independence, array-order
sensitivity, all covered retired/lifecycle/archive/review/baseline/history
mutations changing the digest, exportInfo changes excluded, wrong profile/
altered digest/snapshot rejected, no self-hashing and no implicit digest repair.
Full codec compatibility, signatures/authorship/truth of actuals and malicious
editing protection remain outside this qualification.
