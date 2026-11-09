# WP7.4.4b - format 6 qualification handoff

**Test-only qualification; no production implementation. R07 remains Pending.**
Source contract: [snapshot-history/2](../wp7-4-4/FORMAT6-CONTRACT.md),
[integrity](../wp7-4-4/VALIDATION-AND-INTEGRITY.md),
[migration](../wp7-4-4/MIGRATION-POLICY.md) and the retirement amendment at
`4129c53d5e2f279810d31dc1f28d244e9d8c9344`. Work branch:
`feature/wp7-stabilization`. Client date: 2026-11-08 (America/Regina).

Authority: owner request and
`Bugsys_WP7_4_4b_Format6_Qualification.docx`, SHA-256
`12167e6a20a37be1a40c95c229fe6b1ca29b4d262cf006d2e1597b9d87d60f55`.
F09 is accepted in principle for design qualification; this does not grant
final R07 acceptance or start WP7.4.5.

## Results and review order

- [CANONICAL-VECTORS](CANONICAL-VECTORS.md): 37 independently specified canonical
  byte vectors, maintained Node 5.1/.NET cross-check, 358 assertions. Two reference
  limitations are disclosed; no valid vector disagreement remains.
- [CAPACITY-REPORT](CAPACITY-REPORT.md): 9 synthetic families, 27 measured fresh
  processes plus 9 warmups, nine byte/depth/flat-structure checks. Preserve-history
  growth can exceed 10 MiB even at 100 tasks; task count alone is not a capacity bound.
- [QUALIFICATION-MATRIX](QUALIFICATION-MATRIX.md): executed probes versus proposed
  production codec/preservation/UI tests, with exact counts and limitations.
- [R07-FINAL-RECOMMENDATIONS](R07-FINAL-RECOMMENDATIONS.md): exact F04/F08
  recommendations, reference-adoption decisions and remaining owner gates.
- [VERIFICATION](VERIFICATION.md) and [OWNER-RUNBOOK](OWNER-RUNBOOK.md): versions,
  failures/warnings, regression results, source/import/asset audit and commands.

The scripts, reference sources and fixtures are isolated under this package.
No App/production imports, model, codec, canonicalizer integration, migration,
storage key/adapter, scheduler/evaluator change, Gantt or WP8 implementation.
References are qualification tools, not dependencies selected for production.
Synthetic large files stay in owned workspace/output directories, not Git.

Existing 625 tests/223 browser regressions and prior 199 authoring checks are
separate evidence; they are not counted as format 6 conformance. Stop for owner
review of the qualification and recommendations. Main/protected tags and
unrelated local edits are preserved.
