# Owner review and stop runbook

No application change is expected from WP7.4.4d. Opening the running app will not
show a new report, retired-task toggle, storage capability or snapshot button.
The review artifact is this documentation package and its verification evidence.

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
git log -1 --format=fuller
```

Expected branch: feature/wp7-stabilization. The final handoff provides the exact
delivery SHA; compare it with your local HEAD before reviewing. No server restart
is needed to inspect Markdown or captured logs.

## Review in order

1. Read [OWNER-DISPOSITIONS](OWNER-DISPOSITIONS.md). Confirm A00/D01–D05 match the
   source directions and their 2026-11-09 date. Earlier blank c-sheet alternatives
   remain historical; they are not repeated owner questions here. R07 is not final.
2. Use [CONSOLIDATED-R07-CONTRACT](CONSOLIDATED-R07-CONTRACT.md) to check each family's
   single detailed owner. No new Snapshot6, JCS profile or port implementation was
   introduced to reconcile wording.
3. Review [repository/memory](REPOSITORY-AND-MEMORY-CONTRACT.md): operational current
   and qualified work totals, explicit first-B/retired/history reads, bound pages,
   full expected refs, stale review reconfirmation, atomic receipt/history and
   OutcomeUnknown. Check the legacy consumer parity and full-D cost gates.
4. Walk H04–H06 in [historical reporting](HISTORICAL-REPORTING-CONTRACT.md): first B
   versus retirement-time estimate, 99 unique successors and linked restore episodes.
   Confirm current lifecycle and per-episode restoration remain distinct and report
   pages retain one query watermark. These are illustrations, not application output.
5. Review [compatibility/capacity](COMPATIBILITY-AND-GATES.md). D02 requires a usable
   qualified larger-cap/offline route before accepted edits exceed supported reopen
   capacity. Confirm preservation and blocking of publication without such a route,
   unchanged D and no inferred retirement from missing legacy tasks.
6. Read [FR-HIST-01](FUTURE-SNAPSHOT-REQUIREMENT.md): opt-in named captures need their
   own WBS/decision/compatibility review. They do not replace first B, enter `/2`,
   add repository methods or activate checkpoints here.
7. Check [ACCEPTANCE-MATRIX](ACCEPTANCE-MATRIX.md) and [VERIFICATION](VERIFICATION.md).
   Existing runtime checks and documentation audit have separate claims. Review
   unresolved U01–U07; passing tests do not accept a future implementation.

## Record the next decision explicitly

- [ ] Accept WP7.4.4d as a documentation-only consolidation / conditions: _______
- [ ] Request specific contract corrections or further evidence: ______________
- [ ] Explicit final R07 disposition, reviewed SHA / owner / date: _____________
- [ ] Separately authorized future package, scope and prerequisites: ___________

All boxes stay unchecked in the delivered handoff. A00/D01–D05 are already
recorded; they do not need reapproval merely to read this package. Final R07 and
new work are separate decisions. Do not treat a checked handoff box alone as a
request to implement APIs, reports, snapshots, codecs, adapters or migration.
Use OWNER-DISPOSITIONS as the authoritative decision record; these review boxes
reference that record rather than creating a second approval source.

## Optional regression repeat without overwriting owner evidence

The browser suite regenerates tracked review artifacts. Use a fresh isolated
export, not a reset of this worktree. [VERIFICATION](VERIFICATION.md) includes
the exact repeat commands, preservation evidence and expected counts. It does
not require restarting owner dev servers on 5173/5174; Playwright owns 4173 only.

No merge to main, protected tag update, release/deployment, WP7.4.5, WP8 or
FR-HIST-01 implementation is authorized by this package. Stop for owner review.
