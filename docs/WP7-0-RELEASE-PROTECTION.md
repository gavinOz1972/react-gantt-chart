# WP7.0 — Accepted WP6 release protection

Completed 2026-11-02 UTC (2026-11-01 in America/Regina). No product changes.

## Accepted source and protected refs

The owner explicitly accepted WP6.5.1 in this WP7.0 session: **“Yes, accept this
commit”**, answering the question identifying the full candidate SHA below and
making release protection conditional on all checks passing. Those checks passed.

| Item | Verified value |
| --- | --- |
| Accepted WP6.5.1 commit | `af96d3b257ddfdcbc7f26a968401d634d210aef6` |
| Candidate tree | `22c341fda5c6b47930424133c52bfbe34a17c810` |
| Source branch | `feature/wp6-progress-tracking`, local/remote at the candidate before tagging |
| Annotated release tag | `v1.1-pre-stabilization` |
| Tag object SHA | `134305f2205eb993ab76672c2d2469d48d91a609` |
| Tag target / peeled commit | `af96d3b257ddfdcbc7f26a968401d634d210aef6` |
| Tag creation | `2026-11-01T23:11:29-06:00` / `2026-11-02T05:11:29Z` |
| New branch, local and remote | `feature/wp7-stabilization` at `af96d3b257ddfdcbc7f26a968401d634d210aef6` |
| Main, unchanged | `a6a1c32c22a2bf074b161e52d523443602843dd7` |
| Older annotated tag, unchanged | `v1.0-pre-progress`, object `a4157bc84392c770c27111da58d779948b110a56`, target `abb85011dafc9fb0876953e3132880e025ef65da` |

The new tag and branch names were absent locally and remotely before creation.
Both were pushed using explicit refs without force, then verified with
`git ls-remote`. No merge, tag retargeting or history rewrite occurred.

This note is a separate **documentation-only** commit on the existing WP6 branch,
after tagging. Its parent is the accepted candidate; it does not advance the tag
or stabilization branch. The commit containing this note is reported with delivery.
The full WP6 feature history remains preserved and published.

## Regression gate at the exact candidate

| Command | Result |
| --- | --- |
| `npm.cmd run check` | PASS: ESLint, TypeScript, **411 tests across 32 files**, production build |
| `npm.cmd run test:e2e -- --workers=6` | PASS: **120 Chromium browser tests**, no failures |
| Production build within check | PASS: Vite, **63 modules**, completed in 301 ms |

These are the repository's existing scripts. No scripts or product code changed.
Browser tests used their isolated `127.0.0.1:4173` server, not the owner's running
`localhost:5173` plan. The browser gate included Save-dialog QA01, baseline,
work/status, forecast-clarity, Gantt and Network regressions. The test-generated
review PNG changes were cleaned up; no pre-existing tracked edits existed.

The pre-existing untracked `docs/WP_Req/` folder was kept intact and excluded
from the tag and documentation commit. Tracked files matched the candidate
before tagging. There are no outstanding release blockers.

## Recovery proof

Checked out `v1.1-pre-stabilization` detached in the fresh sibling worktree
`C:\Users\gavin\Documents\CodexProjects\GanttProject\wp70-recovery-af96d3b`.
Read-only checks verified the exact commit and tree above, **209 tracked files**,
presence of application/forecast sources and lockfile, empty porcelain status,
and `git diff --exit-code HEAD --` success. Package version remains `0.0.0`;
this release is identified by the Git tag, not a package-version edit.

The clean temporary worktree was removed through Git without force, after checking
its resolved path stayed in the intended workspace. The active checkout was never
switched; it remains `feature/wp6-progress-tracking`. The tag and stabilization
branch were checked again on origin and resolve to the accepted commit.

To recover independently, run from the repository root in PowerShell. Choose an
unused sibling path; do not overwrite an existing recovery directory:

```powershell
git fetch origin tag v1.1-pre-stabilization
git cat-file -t v1.1-pre-stabilization
git rev-parse "v1.1-pre-stabilization^{commit}"
git worktree add --detach ../wp6-release-recovery v1.1-pre-stabilization
git -C ../wp6-release-recovery rev-parse HEAD "HEAD^{tree}"
git -C ../wp6-release-recovery status --short
```

Expected type: `tag`; expected commit/tree: those in the table; expected status:
empty. This does not reset or switch the current working tree. To run the recovered
application, enter that worktree, run `npm.cmd ci`, then use the existing README
development commands on an unused port. Do not force-update the protected tag.

## Compatibility and handoff boundary

The accepted application writes project format **5**, reads formats **1–5**, and
retains its existing original-format backup/migration behavior. Baselines remain
immutable; actual work, status/completion history and forecast assumptions retain
their accepted contracts. Forecast outputs rederive and visualization toggles are
UI-only. Tagging does not migrate, save or alter browser plans. Earlier releases
cannot safely preserve all format-5 fields; keep their compatible exports when
using `v1.0-pre-progress` or other older code.

`feature/wp7-stabilization` is published at the accepted commit, with no WP7.1
work begun. Owner confirmation that WP7.0 succeeded is required before WP7.1.
