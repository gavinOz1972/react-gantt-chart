# WP7.4.7b — history follow-up

Implemented from `22bfd6a3afff6f78e977d9fde55405de9983cabd` on
`feature/wp7-stabilization`. Implementation date: 2026-11-11, America/Regina.
Authority: owner's request and `Bugsys_WP7_4_7b_History_UX_Follow_Up.docx`,
SHA-256 `0af69452ecb2a2a00307ba185e9e57d4f52bc715effcb57d08d6080995f3247c`.

- Recorded Gavin Osborne's explicit acceptance of WP7.4.7a and owner closure of
  UX7.4.7-001 / QA7.4.7-002 in the existing
  [disposition](../wp7-4-7a/OWNER-DISPOSITION.md), retaining its earlier history
  and original test evidence. R07 remains pending.
- Renamed the collapsed technical disclosure to **History Audit Data**, retaining
  its contents and native keyboard behavior.
- Added persistent retry/refresh attempt and outcome feedback, safe single-flight
  handling, and focus-preserving busy semantics. Fast failures still report the
  completed attempt even if a loading frame is too brief to see.

## What the investigation established

The original actions **already initiated new attempts**. Invalid source was
revalidated and rejected before a page query; expired/oversized/mixed scenarios
opened fresh sessions and issued another page read. Their deterministic synthetic
problems persisted, so the primary error looked unchanged. The correction makes
that action and outcome visible; it does not repair invalid data or change reads.
See [diagnostics](INVESTIGATION.md) and [verification](VERIFICATION.md).

Verified: 61 focused history tests, 858 total unit/component tests in 43 files,
38 feature-on and 223 default-off browser checks, lint, application/QA typechecks
and build. Four additional diagnostic checks ran against the original source.

The default-off development flag and all data/scheduling/storage boundaries are
unchanged. **More about this change** retains its current behavior; the owner's
low-priority observation remains documented and deferred. No WP7.4.8 starts here.

Use the [owner runbook](OWNER-RUNBOOK.md) for the short final retest.
**WP7.4.7b acceptance is pending**. Its implementation is not self-accepted,
and no new finding or R07 approval is implied.
