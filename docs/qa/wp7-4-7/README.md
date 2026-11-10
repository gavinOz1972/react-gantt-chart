# WP7.4.7 — selected-task history UI

Implemented from `678013e5ac57ba2efec5775ea1a780c5198d3932` on
`feature/wp7-stabilization`, client date 2026-11-10 (America/Regina).

The first read-only historical UI is available **only when explicitly enabled
on the development server**. In selected task details, **Show history** opens
the first page; **Load more history** continues; **Hide history** collapses and
releases the read. The section starts collapsed for every new selection/project.

Authority: owner request and `Bugsys_WP7_4_7_Selected_Task_History_UI.docx`,
SHA-256 `cf905f51462474594c833ad8e4fab369fb884cd62fa93970fced472e0c20fb49`.
The document accepts WP7.4.6 as a characterization handoff and authorizes only
this reversible UI/read boundary. **R07 remains pending final owner review.**

## Try it

In the stabilization worktree, start a free development server:

```powershell
$env:VITE_SELECTED_TASK_HISTORY = 'true'
npm.cmd run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

Open `http://127.0.0.1:5176/`, import the
[synthetic 40-task fixture](evidence/owner-fixture.json), select T1 and use
**Show history** under **Status & completion**. T1 is reopened and has 43
retained transitions; T2 is blocked. A different port has a separate browser
library: import a JSON copy explicitly if testing an existing plan there.

For error/partial/empty cases, use the isolated [QA preview](qa/index.html) at
`http://127.0.0.1:5176/docs/qa/wp7-4-7/qa/index.html`. It uses synthetic data only.
See the [owner runbook](OWNER-RUNBOOK.md) for the full test sequence and rollback.

Unset the variable and restart the development server to return to the original
history display. Production builds **always** use the original path, even if
this environment variable is set. Disclosure state never enters a project file.

## Delivered and verified

- Typed, validated loaded-legacy read adapter; selected-task filtering, stable
  source order, bounded pages and source/session/cursor consistency.
- Read-only transition/attestation UI, explicit date versus recorded-time labels,
  unknown provenance, truthful Partial/Unavailable states and qualified errors.
- Cancellation/release on hide, selection/project changes, flag disable and
  unmount. Source changes require explicit refresh; stale replies are ignored.
- Safe opt-in original-display fallback after a validated opening; no fallback
  for invalid data or mixed watermarks, and no additional project fetch.
- **36 focused checks; 833 total tests in 41 files; 19 feature-on Chromium
  checks; 223 default-off browser regressions**, lint, application and QA
  typechecks, build. Details and diagnostic history are in [verification](VERIFICATION.md).

Read [contract delta](CONTRACT-DELTA.md) and
[UI acceptance](UI-ACCEPTANCE.md). The legacy project still holds its full
history in memory. This feature bounds delivered projections, not physical I/O
or total application memory. Scheduling, forecast/health/PA/CPM, work tracking,
full repository S, baseline, persistence and formats 1–5 are unchanged.

Stop for owner UI testing and acceptance. Production storage, retired-task
lifecycle, portable `/2` export, PDF/reporting, automatic replay and FR-HIST-01
snapshots remain separately gated. No next work package starts automatically.
