# WP6.1 — Protected release and approved project baselines

Implemented 31 October 2026 on `feature/wp6-progress-tracking`.
Ready for owner testing; formal acceptance is pending. Do not start WP6.2 or merge
into main until the owner accepts this slice.

## Release protection

| Item | Verified value |
| --- | --- |
| Accepted WP5.2 commit | `abb85011dafc9fb0876953e3132880e025ef65da` |
| Annotated release tag | `v1.0-pre-progress` |
| Tag object SHA | `a4157bc84392c770c27111da58d779948b110a56` |
| Tag target | Exact accepted WP5.2 commit above |
| Isolated feature branch | `feature/wp6-progress-tracking`, created from that commit and pushed |
| Remote | `https://github.com/gavinOz1972/react-gantt-chart.git` |
| main (unchanged) | `a6a1c32c22a2bf074b161e52d523443602843dd7` |
| Implementation commit | Commit containing this handoff; exact SHA reported in the completion message and available with `git rev-parse feature/wp6-progress-tracking` |

Before modification the worktree was clean on `wp5-2-visualization-refinements`.
No conflicting local/remote tag or feature branch existed; remote main matched
local main. Baseline regression passed 213 tests in 21 files, lint, typecheck,
production build (43 modules), and all 40 browser workflows (25.0 seconds). The
annotated tag and starting feature branch were pushed atomically before code
changes. A browser test regenerated an existing screenshot; that generated-only
artifact was restored to the accepted version. No owner edits were discarded.

Recovery should use a separate checkout/worktree at the tag so in-progress work
and saved browser projects are preserved. The tag protects source code, not user
localStorage. Keep exported WP5 JSON backups to use with the protected release.
No GitHub ruleset settings or main-branch history were changed.

## Delivered behavior

- Project Settings contains Establish Baseline with a one-time confirmation. A
  valid committed schedule and at least one saved task are required. Empty,
  invalid, pending form/inline/settings drafts explain what needs correction.
- The snapshot captures all project/calendar fields, permanent task IDs,
  names/descriptions, estimates, predecessor IDs, independent-start provenance,
  retained manual dates, original manual order, ID allocation floor and original
  calculated slots/completion. Sort/copy context is retained as well.
- Snapshots are self-contained copies, recursively frozen and readonly in the
  type contract. Current Plan continues to drive the task editor, Gantt and
  Network. Subsequent edits/deletions cannot alter Baseline Plan records.
- View Baseline shows establishment time, task count, planned hours, original
  completion/target, calendar and a read-only task table. Late completion is
  captured faithfully. There is no baseline overwrite/delete or second version.
- Establishing a baseline marks the plan unsaved. Save/Load and JSON
  Export/Import retain both layers; snapshots are checked independently against
  their frozen inputs before replacing the open project.
- Current task allocation cannot fall below the frozen historical counter.
  Deleted baseline tasks remain in the snapshot and IDs are not reused.
- No WP1 scheduling algorithm, Gantt/Network rendering code, dependency picker,
  task ordering algorithm or dependency versions changed. There are no actual
  logs, statuses, percent-complete fields, forecasts or progress visuals.

## Compatibility and data safety

Project files now write schemaVersion 2 with an optional `baseline` whose own
schemaVersion is 1. Readers accept WP5 schemaVersion 1 files without inventing a
baseline. Opening does not modify the saved copy. Current and baseline inputs
are validated independently; mismatched identity, malformed frozen structure,
inconsistent calculated outputs and future versions fail before replacement.

Files offers Export WP5 backup for the original loaded version 1 plan, including
when the current plan contains unfinished edits. It preserves original known
source values and savedAt, adding only compatible WP5 default metadata where
absent. It does not include later Current Plan edits or a newly established
baseline. The migration confirmation additionally offers a backup of the named
saved record being replaced. Save As with a new name preserves the old record.
Normal Export JSON writes format 2 without changing the browser library.

Header Save and Save As both confirm before upgrading an existing version 1
record. Cancel leaves the saved library untouched. Other saved records retain
their original JSON objects during explicit save/delete operations. The library
key/envelope remain v1. Earlier applications cannot read format 2, including a
library containing such a plan; use the portable WP5 backups for the old release.

The existing save failure, quota, invalid import and unsaved replacement safeguards
remain. Storage remains local to this browser profile and origin. A snapshot is
not cryptographically signed and does not authenticate who approved it. Multiple
baselines and formal re-baselining are deferred.

## Verification

| Check | Result |
| --- | --- |
| `npm.cmd run check` | Passed: lint, typecheck, 237 tests in 23 files, build |
| New pure baseline/persistence tests | 24 passed, included in the 237 total |
| `npm.cmd run test:e2e` | 47 passed in 24.9 seconds |
| Prior browser regression | All 40 workflows retained and passing |
| New browser workflows | 7 passed: explicit creation/content, edits/deletion, round trip, legacy migration, invalid drafts, malformed imports, layout |
| Production build | Passed, 46 modules |
| Source boundary review | WP1, timeline/network rendering and package/lock files unchanged |
| Live owner server | `http://localhost:5173/` returned the new baseline UI source |

The existing WP4 browser export assertion now expects schemaVersion 2 and checks
that no baseline is fabricated. All its other save/reload/import assertions are
unchanged. No regression tests were removed. An initial new-test selector and the
old version assertion were corrected; the final full suite passes with no known
exceptions. Existing harmless NO_COLOR/FORCE_COLOR runner warnings remain.

## Changed files

| Files | Purpose |
| --- | --- |
| `src/baseline/baseline.ts` | Pure deep-copy creation, readonly contract, freeze and independent snapshot validation |
| `src/baseline/baseline.test.ts` | Snapshot content, isolation, integrity, invalid input and one-baseline tests |
| `src/baseline/README.md` | Domain contract and boundaries |
| `src/persistence/planInputs.ts` | Existing source validation extracted for reuse; WP1 rules unchanged |
| `src/persistence/projectFile.ts` | v1/v2 reader, v2 writer, optional baseline, identity/counter checks and dirty fingerprint |
| `src/persistence/localProjects.ts` | Preserve untouched legacy saved records on explicit writes |
| `src/persistence/baselinePersistence.test.ts` | Version migration, independent round trips, corrupt payloads and storage preservation |
| `src/components/BaselinePanel.tsx` | Confirmation, summary and read-only inspection in Project Settings |
| `src/components/persistence/ProjectStorage.tsx` | Legacy backups, explicit migration confirmation and baseline-aware download text |
| `src/App.tsx` | Per-project baseline lifecycle, creation eligibility and persistence wiring |
| `src/styles/global.css` | Baseline panel contrast, responsive summary and contained detail table |
| `src/test/baselineFixture.ts` | Nonsequential-ID custom-calendar test fixture |
| `tests/baseline.spec.ts` | Seven end-to-end acceptance workflows and screenshots |
| `tests/wp4.spec.ts` | Expected export schema bump, with no fabricated baseline |
| `src/persistence/README.md`, `README.md` | Migration contract and owner-facing usage |
| This handoff and four `docs/review/wp6-1-*.png` files | Review evidence and owner guide |

## Screenshots

- [Explicit confirmation](review/wp6-1-baseline-confirm.png)
- [Desktop summary and frozen tasks](review/wp6-1-baseline-desktop.png)
- [Narrow summary with internally scrolling detail table](review/wp6-1-baseline-narrow.png)
- [WP5 compatibility and backup controls](review/wp6-1-legacy-backup.png)

Screenshots were visually reviewed. The narrow table is deliberately wider than
its container; focus it and scroll horizontally to inspect all frozen columns.

## Owner test guide — A01–A12

Use `http://localhost:5173/`. Save/export your real plan before testing replacement
or deletion workflows. Browser regression uses a separate test origin/port 4173.

1. **A01 Protection:** inspect the GitHub tag and feature branch. The tag must
   resolve to `abb8501`; main must remain at `a6a1c32`. All WP6.1 changes are on
   `feature/wp6-progress-tracking`.
2. **A02 Explicit creation:** load an existing unbaselined project. In Project
   Settings verify No baseline established. Open Establish Baseline, cancel,
   then confirm. Cancel creates nothing; confirmation marks the plan unsaved.
3. **A03 Invalid attempt:** try an empty plan, a zero-hour task draft and invalid
   calendar settings. The action is unavailable with corrective guidance and no
   snapshot. Finish/cancel edits or revert settings to recover.
4. **A04 Content:** use Monday/Thursday/Friday, 3 hours/day, manual starts and
   dependent tasks with nonsequential IDs. Establish and View Baseline; compare
   frozen inputs, manual order and ordinal slots with the current approved plan.
   A target before completion is allowed and visibly reported.
5. **A05 Isolation:** export the snapshot, then change effort, dependencies,
   calendar, target and order. Current Plan dates update. Export again and verify
   the entire baseline section is identical, including completion and metadata.
6. **A06 No overwrite:** return to Project Settings. Only View/Hide Baseline is
   offered; no second Establish or destructive reset is available.
7. **A07 Round trip:** Save, reload, select the named plan and Load project.
   Export/import that JSON. Both layers retain their respective values. Editing
   then importing still requires the existing replacement confirmation.
8. **A08 Legacy:** load a WP5 JSON or saved plan. Verify no baseline is invented;
   export the WP5 backup before upgrading. Header Save over a legacy saved copy
   must explain the format change; cancel preserves it. Save As to a new name
   also keeps the original. Then establish a baseline if desired.
9. **A09 Malformed data:** alter baseline version or frozen completion in a copy
   of exported JSON, then import it. Expect a baseline-specific error, no replace
   prompt and no change to the open or saved plan. Current-input errors also
   remain independently rejected.
10. **A10 Deletion:** delete a current task through the usual confirmation flow.
    Baseline details retain it and its old ID. Add/duplicate a task and verify
    allocation continues forward instead of reusing the deleted ID.
11. **A11 Placement:** inspect Project Settings at desktop/narrow widths. The
    summary and frozen detail table are accessible there; Workspace still begins
    with its chart and keeps tasks/details below it.
12. **A12 Regression:** use Gantt expanded/compressed and Hour/Day/Week, Network
    zoom/pan/Fit, manual reorder/sorts, duplicate, inline edits and the scrollable
    predecessor picker. Existing behavior and calculated scheduling stay intact.

Automated coverage passes for A01–A12 (A01 via Git checks, the rest via domain,
persistence, browser and retained regression checks). Owner acceptance remains
pending; WP6.2 is not implemented or started.
