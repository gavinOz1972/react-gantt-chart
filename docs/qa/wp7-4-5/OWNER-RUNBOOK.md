# Owner inspection and decision runbook

WP7.4.5 adds an unused typed boundary and test-only implementation. No new button,
report, persistence provider or snapshot feature should appear in the app, and no
dev-server restart is needed to review this infrastructure.

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
git log -1 --format=fuller
npm.cmd test -- src/repository/operationalHistoryRepository.test.ts
npm.cmd run check
```

Expected branch feature/wp7-stabilization; focused 76 cases, full 701 tests in
38 files; lint/typecheck/build pass. Compare HEAD with the full delivery SHA in
the final handoff. [VERIFICATION](VERIFICATION.md) gives isolated browser commands
and the 223-case result without overwriting existing tracked owner QA artifacts.

## Inspect the concrete boundary

1. Open [the new interface](../../../src/repository/operationalHistoryRepository.ts)
   beside [the unchanged old port](../../../src/repository/projectRepository.ts).
   Confirm no partial operational view replaces full S, and no replay/checkpoint/
   named-capture method is introduced. DTOs are not the portable schema.
2. Read [API-CONTRACT](API-CONTRACT.md), then the
   [conformance matrix](CONFORMANCE-MATRIX.md). Check why operational payloads omit
   history while purpose reads retain original B, retired detail and linked records.
   Review page/date/watermark/null/expiry semantics and actual response budgets.
3. In [conformance.ts](tests/conformance.ts), inspect L01/L02/L04: T1's diamond
   closure reviews T4 once, preserves T5→T3, archives removed edges and rejects
   incomplete/stale evidence. Restore chooses edges explicitly and retains episodes.
4. Inspect T01–T04 and W01–W05 for atomic rejection, receipt/current-ref distinction,
   changed-intent conflict, lost acknowledgement/aborted retry, record corrections
   and recorded-only totals. Unknown actual/remaining facts are not inferred.
5. Inspect E01 and the oracle export method: Unsupported, zero sink bytes, no
   full `/2` parity claim. Confirm the fixture fingerprint is not production D,
   and the oracle is not an IndexedDB/SQL recommendation or a lazy-storage proof.
6. Review [scope evidence](evidence/scope-audit.json): only two new source files,
   no App imports/asset churn, no original port/config changes and preservation
   of the 85 pre-existing edited files. No user data was migrated or saved.

## Record review separately from follow-on authorization

- [ ] Accept WP7.4.5 unused capability/test-oracle scope at reviewed SHA: ________
- [ ] Further correction/verification requested: _____________________________
- [ ] Final R07 owner disposition, exact reviewed contract SHA/conditions: _____
- [ ] Separately authorized next package and prerequisites: __________________

Owner/date: ____________________ Conditions: _________________________________

All boxes remain unchecked in this handoff. Accepted D01–D05 authorize this slice;
passing it does not accept final R07 or authorize production storage, format
activation, migration, app wiring, consumer parity, report UI/PDF, FR-HIST-01,
deployment or WP8. Portable export and qualified recovery capacity remain explicit
future work. Stop for owner review; do not automatically start another phase.
