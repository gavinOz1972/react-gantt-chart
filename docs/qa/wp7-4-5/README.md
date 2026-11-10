# WP7.4.5 — unused operational/history capability

Implemented on `feature/wp7-stabilization` from
`191f919b9929ef2a4b53083038b500e2e803af91`. Client date 2026-11-09,
America/Regina. **No application behaviour or storage changes. R07 remains pending.**

Authority: owner request and
`Bugsys_WP7_4_5_Operational_Historical_Repository_Contracts.docx`, SHA-256
`6e632b98301394d93eedee641bf9d75b63cb2fbba01e9d3fdae37f8fb3d0e176`.
Its gate authorizes this bounded compiled capability, independent test oracle and
conformance evidence despite final R07 still being pending. It does not authorize
production formats, providers, consumer integration, migration, reports or snapshots.

## Delivered

- [Typed capability](../../../src/repository/operationalHistoryRepository.ts):
  distinct readonly operational/history DTOs and discriminated results, pinned
  sessions, purpose-based reads, bounded cursors, atomic change command and export
  boundary. Existing [ProjectRepository<S>](../../../src/repository/projectRepository.ts)
  and its full load/commit meanings are unchanged.
- [Test-only reference oracle](tests/referenceOperationalHistoryRepository.ts),
  [authored fixtures](tests/fixtures.ts), [independent fixture guards](tests/fixtureSemantics.ts),
  [reusable conformance suite](tests/conformance.ts) and [compile-only assertions](tests/typeChecks.ts).
  A [test runner bridge](../../../src/repository/operationalHistoryRepository.test.ts)
  includes them in existing Vitest/TypeScript checks without config changes.
- **76 new conformance cases**, 701 total unit/component tests in 38 files,
  223 existing Chromium checks, lint, typecheck and production build passed.
  See [CONFORMANCE-MATRIX](CONFORMANCE-MATRIX.md) and [VERIFICATION](VERIFICATION.md).

Operational results omit historical arrays, archive/review narratives, work entry
lists, retired detail and baseline content. Purpose reads retain those values.
The in-memory oracle intentionally holds full fixture data and copies it for
pinning; it is not evidence of lazy physical I/O or bounded production memory.

The fixture fingerprint is an exact-value interned test token, not JCS/SHA-256 or
portable D. **exportPortable returns Unsupported and never writes to its sink**.
Complete `/2` serialization, integrity, capacity/reopen handling and production
validation remain explicit unpassed gates. This slice makes no wire-format claim.

## Review and stop

Read [API-CONTRACT](API-CONTRACT.md), the matrix and verification, then use
[OWNER-RUNBOOK](OWNER-RUNBOOK.md). D01–D05 retain their
[WP7.4.4d authority](../wp7-4-4d/OWNER-DISPOSITIONS.md); this implementation does
not accept R07 or implement FR-HIST-01. All 85 pre-existing edited files, main,
protected tags, App assets/imports and previous contract files are preserved.
Stop for owner review. Consumer parity, adapters, portable export/capacity,
deployment, report UI/PDF, formats 1–5 and named snapshots remain separately gated.
