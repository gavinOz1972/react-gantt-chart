# Owner review — WP7.4.6

This package changes tests and assessment documentation only. The normal UI
should look and behave exactly as before; there is no new history panel to find.

## Confirm the worktree and review

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
git log -1 --format="%H %s"
git status --short
```

Branch must be `feature/wp7-stabilization`. Existing edited evidence files
remain local and are not part of this package's commit.

Read [README](README.md), [consumer matrix](CONSUMER-MATRIX.md),
[vectors](PARITY-VECTORS.md), [gaps](GAPS-AND-GATES.md) and
[integration options](INTEGRATION-OPTIONS.md). Check in particular G01–G04:
identical operational views can hide different reopen/status-origin/guidance/
log-detail meanings. Those are explicit contract gaps, not safe substitutions.

## Reproduce assessment checks

```powershell
npm.cmd test -- src/repository/operationalConsumerParity.test.tsx
npm.cmd run check
node docs/qa/wp7-4-6/scripts/audit.mjs
```

Expected:96 focused,797 total tests; lint/typecheck/build pass. Scope audit
compares the known source baseline, producer hashes, imports and built assets.
Its preservation-manifest comparison runs when the ignored local initial
manifest is available; a fresh clone cannot prove the prior owner's local
bytes. The committed audit evidence records the implementation run.

Optional regeneration of **observations**, not expected goldens:

```powershell
node docs/qa/wp7-4-6/scripts/inventory.mjs
node docs/qa/wp7-4-6/scripts/parity-report.mjs
```

These rewrite assessment evidence timestamps. Do not recapture goldens simply
to make a failed test pass. A legitimate oracle update requires independent
existing-consumer capture and review of source/producer/provenance differences.
The capture script refuses overwrites unless `--refresh` is deliberately given.

To rerun223 browser regressions without overwriting existing edited QA images,
make an isolated export of the desired commit into a new workspace subfolder,
provide its existing dependencies, then run there:

```powershell
npm.cmd run test:e2e -- --workers=3
```

Use a new empty folder; do not clean/reset the owner's worktree. The existing
suite writes QA evidence. Browser results are unchanged-app regression only.

## Review checklist and next decision

- [ ] Accept inventory completeness and review the per-file/call-site evidence.
- [ ] Accept the independent24-case legacy characterization and its limits.
- [ ] Acknowledge conditional calculation/status-row parity separately from
  PA/work-detail gaps, retirement population difference and clock-policy risk.
- [ ] Accept WP7.4.6 as an assessment handoff, or request more verification.
- [ ] Separately authorize a first production/UI slice, naming its exact scope
  and contract prerequisites, or defer it.

Recommended next scope: default-off **read-only selected-task history**, with
typed payload validation, explicit coverage, bounded pages, pinned refresh and
graceful Unsupported/fallback. Review the acceptance/rollback criteria before
authorizing it. No box is pre-approved by this document.

Owner/date: ____________________

Decision / authorized next scope: ________________________________________

R07 is not marked final. Production integration/providers, portable `/2`
export/JCS, migrations, reports/PDF, automatic replay and FR-HIST-01 snapshots
remain separately gated. Stop here for owner review.
