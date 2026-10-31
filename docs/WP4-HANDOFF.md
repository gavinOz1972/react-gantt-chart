# WP4 verification and first-release handoff

Prepared 30 October 2026 on branch wp4-critical-path-network-persistence, based on
WP3 commit 63b5102. Software implementation and automated verification are complete.
Owner acceptance remains pending validation of the working application.

## Delivered behavior

WP4.1 adds pure working-slot critical-path analysis. It returns WP1 earliest dates,
latest allowable boundaries, total working-hour slack, zero-slack membership,
independent release constraints and controlling predecessor/successor pairs.
The backward-pass deadline is actual calculated completion, never targetEndDate.
Manual root dates are not-before releases, not effort or latest-start deadlines.
Equal controlling branches can both be critical; earlier unrelated branches can
have positive slack when another root is released later. Inputs are never mutated
or rescheduled. Exact BigInt working indices preserve skipped-day arithmetic.

Both Gantt modes offer Highlight Critical Path. Critical work gains a bold outline,
explicit label and emphasis while expanded nonworking hatching remains intact.
Shared inspection exposes current/latest dates, working-hour slack and release
waiting separately from task duration.

WP4.2 adds a read-only Network / Critical Path view. Deterministic left-to-right
DAG columns, separate ports, arrows, labels, scroll/zoom, viewport rendering and
selection are display data only. Critical edges are bold solid; other edges are
dashed. Node/row/bar selection is shared, and switching views preserves Gantt mode.
Task edits recalculate dates/analysis and redraw both views immediately. No
three-point estimates or probabilistic PERT behavior is claimed.

WP4.3 adds explicit named browser Save/Load, New project, version 1 JSON export/
import, overwrite/delete confirmation and unsaved-work replacement warnings.
Reload preserves the named library, with explicit Load to reopen a plan. A failed
import/write keeps current work. Overwriting/deleting saved copies is confirmed;
deleting a copy does not delete the open plan. Quota/blocked/corrupt storage errors
are actionable and never claim save success. A beforeunload warning additionally
protects unsaved work where supported by the browser.

Files preserve every source field, stable task IDs, DEFAULT/MANUAL modes, retained
manual requests, dependencies and the next numeric ID counter. Derived schedules,
critical analysis and layout are not trusted or persisted. Source structure and
version are checked before WP1 validates all dates/calendar/graph/value rules;
App rebuilds schedule and analysis after loading. All data stays local, except an
explicit local file download; there are no accounts, telemetry or remote services.

## Slice sequencing and verification

The initial WP3 regression passed 109 tests before WP4 changes. WP4 was verified
in the requested sequence:

1. Critical analysis: 11 initial focused domain tests, typecheck/lint, then two
   Gantt critical/highlight tests passed before network implementation.
2. Network: six initial layout/component tests plus typecheck/lint passed before
   persistence implementation.
3. Persistence: 22 file/library tests and eight UI tests passed. Final regression
   includes further working-index, manual-join and viewport/precision checks.

Node 24.19.0, npm 11.17.0, TypeScript 6.0.3. Final commands from react-gantt-chart:

| Command | Result |
| --- | --- |
| npm.cmd run lint | Pass |
| npm.cmd run typecheck | Pass |
| npm.cmd test | Pass: 163 tests across 15 files |
| npm.cmd run build | Pass: 38 modules transformed |
| npm.cmd run check | Pass: lint, typecheck, full unit/component suite and build |
| npm.cmd run test:e2e | Pass: 11 Chromium browser tests, final complete run 9.4s |

All 109 pre-WP4 unit/component tests and all seven prior browser tests remain
unchanged and passing. WP4 adds 54 unit/component cases and four browser workflows.
No configured check was skipped. Browser tests used isolated port 4173 outside the
sandbox; normal development runs remain on their own localhost port. The existing
NO_COLOR/FORCE_COLOR warning is harmless. Dependencies/lockfile were not changed,
so earlier WP0 development-tool audit findings are unchanged.

The browser suite exercised real Blob JSON download and file import, reload/reopen,
retained manual dates, stable next IDs, atomic malformed/schema/missing/cycle
rejection, pending invalid-draft replacement cancellation, overwrite/delete prompts,
critical branch changes, shared selection and target independence. It also retained
expanded hatching, compressed precision, live connector removal and scrolling/zoom
regression checks.

Final screenshots were inspected at 1440px and 1100px widths, with existing 900px
and 780px browser regressions still passing. Screenshot review exposed an existing
CSS rule overriding the hidden file input; an explicit hidden rule corrected it.
Network labels are abbreviated/clipped within node bounds while full names/IDs
remain in accessible labels and inspection. The OS-native file chooser itself was
selected via browser automation rather than a human mouse session; final human
workflow acceptance is part of the owner guide.

## Acceptance matrix

| Scenario | Evidence |
| --- | --- |
| A01 | Simple chain has zero slack and identical earliest/latest boundaries |
| A02 | Unequal join branches give shorter branch positive working-hour slack |
| A03 | Equal branches and both controlling edges are critical |
| A04 | Delayed manual root, with/without join, separates release wait from effort and avoids false criticality in earlier work |
| A05 | Valid target changes affect feasibility while analysis remains identical |
| A06 | Monday/Thursday two-hour arithmetic and both Gantt modes retain rollover/hatching/precision |
| A07 | Upstream edits change domain slack and live Gantt/network emphasis |
| A08 | Independent roots, multi-predecessor joins, all directed edges and stable layout after reorder |
| A09 | Node/bar/table selection and Gantt mode survive view/zoom changes |
| A10 | Named save/new/load and browser reload/reopen preserve custom calendar, descriptions, IDs, modes and dates |
| A11 | Real JSON download/new/import round trip preserves source and recomputed results |
| A12 | Malformed JSON/version/type/structure, missing IDs, duplicates, cycles, invalid dates/capacity/duration and counters are rejected atomically |
| A13 | Load/import/New warn over source changes or unfinished drafts; cancellation preserves invalid draft values |
| A14 | All prior WP1-WP3 tests and browser workflows stay green |

API details and edge conventions: [critical-path analysis](../src/domain/CRITICAL_PATH.md),
[network projection](../src/network/README.md), and
[JSON/local storage](../src/persistence/README.md).

## Changed files

- src/domain/criticalPath.ts, workingTime.ts and index.ts; src/types/criticalPath.ts:
  pure analysis contract, exact working-slot indices and public exports.
- src/domain/__tests__/criticalPath.test.ts and workingTime.test.ts: domain checks.
- src/domain/README.md and CRITICAL_PATH.md: API/semantics.
- src/components/TaskInspection.tsx: common Gantt/network dates, slack, latest and
  release details.
- src/components/gantt/GanttChart.tsx and CriticalHighlight.test.tsx: critical
  styling/toggle integration while preserving hatch geometry.
- src/network/layout.ts, layout.test.ts and README.md: pure DAG display layout.
- src/components/network/NetworkView.tsx and NetworkView.test.tsx: live network,
  selection, zoom/scroll, classification and viewport checks.
- src/persistence/projectFile.ts and localProjects.ts, their test files and README:
  schema/unknown-input validation, source fingerprinting and injected storage API.
- src/components/ConfirmDialog.tsx; src/components/persistence/ProjectStorage.tsx
  and ProjectStorage.test.tsx: local project/file controls and safety workflows.
- src/App.tsx: memoized analysis, shared view/selection, save baseline, new/load
  source replacement, stable counter and unsaved-work handling.
- src/styles/global.css: critical/network/storage styles and reliable hidden state.
- tests/wp4.spec.ts: end-to-end analysis/network/persistence workflows.
- README.md, src/timeline/README.md, this handoff, owner guide and review PNGs:
  current usage, semantics and owner artifacts.

Existing WP1 scheduler/calendar/graph rules and TaskInput schema are unchanged.
The WP4 schema is a new file envelope around those existing source contracts.

## Owner review artifacts

[Owner test guide](WP4-OWNER-GUIDE.md)

[Critical Expanded Gantt](review/wp4-critical-expanded.png)

[Critical Compressed Gantt](review/wp4-critical-compressed.png)

[Network / Critical Path](review/wp4-network.png)

[Manual release versus effort](review/wp4-manual-release.png)

[Local project controls](review/wp4-local-projects.png)

The branch is ready for owner review. Do not mark WP4 owner-accepted until the
owner validates critical/slack meaning, network behavior, and local/JSON workflows
in the running application.

## Limits and release boundary

Local saves are scoped to this origin (including port) and browser profile. Browser
cleanup/private browsing may remove them. Exported JSON is the portable backup;
Export does not update a named local copy or clear its dirty indicator. Imports
are dirty until saved locally. There is no automatic save/reopen or invalid-draft
persistence. JSON import/export is limited to 10 MiB; schema versions other than 1
are rejected. Corrupt local library data is preserved and blocks automatic writes
rather than silently erasing records; use backups/another profile for recovery.
No cross-tab merge, multiuser synchronization or encryption is implemented.

Analysis uses BigInt internally but requires output slack/release counts to fit
safe integers. Out-of-range analysis returns an explicit error. Network geometry
is read-only and viewport-rendered; a 1000-root test stays below 300 mounted DOM
elements. Geometry over 4,000,000px at the chosen zoom shows a display-limit message.
The existing task table remains fully rendered, and graph computation still scales
with all tasks/relationships. Existing Gantt projection limits remain documented.
These are scoped checks, not arbitrary-graph or cross-browser performance guarantees.

Resource levelling, costs, progress, external accounts, collaboration, probabilistic
PERT estimates and deployment remain outside the release. No third-party graph/
scheduling library, service or new package was installed.

## Review commit

The work is committed locally on wp4-critical-path-network-persistence, without
pushing or merging. Use git log -1 on the branch for the final review commit.
