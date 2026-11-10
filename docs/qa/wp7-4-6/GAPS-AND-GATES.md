# Gaps, discrepancies and production gates

No production correction is made in this package. These are readiness
findings, not permission to fill missing data or modify the engines. Existing
WP7.4.4d owner dispositions retain their authority; only unresolved semantics
and new implementation scope need decisions.

| ID | Evidence / missing contract | Required resolution before affected integration |
| --- | --- | --- |
| C01 | G03: OperationalView omits current project Definition of Done; a completion's old snapshot is not current guidance | Add/review current guidance read ownership and dirty/transition validation boundary; never substitute historical guidance |
| C02 | G01: reopened tasks clear current completion fact but legacy PA still reads the last completion episode | Explicit compact prior-completion reference/fact or bounded purpose query; no normal all-history scan |
| C03 | G02: missing-record default Not Started versus explicitly recorded Not Started differs in PA `assumedStatus` | Preserve origin qualification or approve a deliberate semantic change; do not invent record provenance |
| C04 | D04: EventRecord payload is generic; fixture-only `LegacyStatus.legacyStatusEvent` is not a guaranteed wire contract | Typed, versioned, validated projection including attestations, completion/commitment references, timestamps and retained metadata; narrow test guard is insufficient production validation |
| C05 | G04: WorkRecord/query surface cannot supply all contributor/description/createdAt/updatedAt and chronological workDate/createdAt/ID semantics | Dedicated purpose query/index/read projection and correction identity/order/coverage contract; recorded total alone cannot render current log |
| C06 | G04/G08: legacy work corrections overwrite and retractions delete; no recoverable prior versions | Qualify absent history as Unknown/partial; preserve actual retained source, never fabricate corrections or total actual hours |
| C07 | G05: port has Known actual-start facts but current PA accepts only legacy progress input, which leaves starts Unknown | Separately reviewed consumer/evaluator boundary and actual precision/causal semantics; not a field to infer from status/log dates |
| S01 | G07: current Complete releases forecast dependencies immediately, while PA uses dated/future/same-day qualifications | Preserve both current outputs now. Owner decision and independent tests required before unifying behaviour; no formula change authorized |
| S02 | G08/D06: legacy delete drops task work/status records; target retirement retains evidence and removes only active links | Existing target retirement direction is not re-opened here; separately authorize production lifecycle/restore UI, active population, selection/order and source preservation |
| S03 | G09: existing decoder rejects decreasing recordedAt; sequence/Partial target reads may retain clock-skew/undated data | Explicit version/source/clock qualification and error policy; do not relax legacy decoder implicitly |
| P01 | G10: known-field B decoding drops opaque fields | Keep raw original B immutable and separate from math projection; complete backup/export must retain unknown values and integrity |
| P02 | G03/G04/P01: partial operational view cannot reproduce full S/fingerprint or format 5 export | Preserve ProjectRepository<S>, codecs, current dirty tracking and full saved source; no lazy-S or `/2` activation claim |

## Error and history policy

The normal probe rejects inconsistent pinned reads, invalid assumptions or
baseline decode rather than switching revisions. Missing/unknown/conflicting
completion evidence produces explicit forecast/health/marker gaps. It never
normalizes an invalid legacy state into accepted progress or silently queries
full history. These are test-probe outcomes; user-facing recovery remains a
separate UI design task.

The detail probe preserves Partial coverage and distinguishes Unavailable,
Unsupported, ReadExpired, RecordTooLarge, unknown payload and MoreAvailable.
No empty response establishes completeness. Snapshot consistency is tested
against a concurrent accepted change; the reference adapter materializes full
fixtures internally, so this does not demonstrate bounded production memory.

For the proposed read-only slice, fallback is the original already-loaded
legacy detail, with a visible qualification. Mixed/expired pages must be
discarded; retry opens a fresh explicit session. Disable the default-off flag
on wrong rows, missing qualifications, unbounded reads, writes or dirty effects.
See [integration options](INTEGRATION-OPTIONS.md) for acceptance and rollback.

## Compatibility, recovery and authorization gates

- Current formats 1–5 readers and format 5 writer, local library key, immutable
  original baseline and existing historical snapshots stay unchanged. A new
  format must not reinterpret a legacy physical deletion as known retirement
  history or backfill unrecorded work/actual dates.
- WP7.4.5 `exportPortable` still returns Unsupported without writing its sink.
  Portable `/2`, JCS/integrity/canonicalization, opaque value preservation,
  atomic restore, backup/capacity validation and complete production validation
  remain unpassed gates. Tests of known-field arithmetic are not export proof.
- No physical provider is chosen or qualified. Retry/concurrency/durability,
  resource isolation, lazy I/O and memory require real adapter evidence later.
- Private working-plan evaluator is unused. W/change-record linkage and
  operational validation need their complete contracts; authored trusted test
  seeds are not a substitute for a production boundary or historical replay.
- R07 remains pending final owner review. No report UI/PDF, migration, automatic
  historical replay or user-driven named snapshots (FR-HIST-01) are implemented.
- Owner authorization must name the first production/UI vertical slice and
  required contract resolutions. Broad integration does not follow from a
  passing conformance suite, a passing gap assertion or this assessment.

Implementation diagnostics resolved during this work were a missing schema
version in the initial characterization fixture, unused test imports and an
unsupported TypeScript parameter-property syntax in a test-only error class.
All were corrected and checks rerun. No scheduling, forecast, codec, persistence
or production implementation defect was demonstrated or changed.
