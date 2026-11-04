# Owner review — 15–20 minutes

Use `feature/wp7-stabilization` in the **wp7-stabilization worktree**.
Save/export your real plan before importing disposable review fixtures.
All fixture projects are fictional, clearly named WP732 DISPOSABLE.
Review is separate from automated acceptance; record observations in
[ACCEPTANCE](ACCEPTANCE.md).

## Start (2 minutes)

In PowerShell:

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

The branch must read `feature/wp7-stabilization`. Open the printed
`http://127.0.0.1:5174/` URL. Port5174 distinguishes this worktree from an
older server that may still be running on5173. Keep PowerShell open while
testing. If5174 is occupied, stop that task's previous server or choose a
free explicit port and use the URL printed by Vite.

Use Files → Import JSON and the fixtures under
`tests/fixtures/wp732/`. Confirm replacement only for the disposable current
project. After **each** import, set **PA As-of** in the Gantt to the date
listed below; these are scripted November2026 examples and the default local
today may differ. PA As-of is deliberately not saved. The effort-forecast
As-of lives separately in Project Settings.

## Immediate completion and meaning (4 minutes)

Import `late-before-completion.json`, set PA As-of `2026-11-04`.
A=T1 is In Progress, so B=T2 has PA Unknown initially. Leave Show Baseline,
Show Forecast and Highlight Critical Path off. Select T1, change its Status
to Complete in the selected chart panel, set effective completion to
`2026-11-04`, acknowledge the absent formal criteria and confirm completion.

Without refresh/toggling/navigation, expect:

- A marker on Nov4, explicitly date-only.
- B's separate PA outline Nov5 H1–after H4; its committed bar stays Nov3.
- Summary: one historically late completion, one shifted task, conditional
  project finish Nov5 versus committed Nov3 (+2 calendar days).
- Selected details explain the saved historical finish Nov2, conservative
  next-working-day readiness and four full scheduled slots.

Turn all three existing toggles on, then off independently. A/PA/summary must
remain. With all on, baseline B ends Nov3, effort FF ends Nov4, PA ends Nov5.
Those are different models, not contradictory labels. Move through a marker
and outline with Tab/Enter; inspect their text without relying on color.

## Absorbed lateness and changed driver (3 minutes)

Import `slack-absorbed.json`; PA As-of `2026-11-03`. B shifts to Nov4,
parallel P still ends Nov5, and project outlook remains Nov5. Summary must
say no modelled project finish delay despite late A and changed B.

Import `changed-driver.json`; PA As-of `2026-11-04`. B's PA ends Nov5,
versus committed project Nov4. Outlook-driving constraints include T1/T2.
Highlight Critical Path: T3 remains committed-critical. In Network, T3's
committed critical border remains; T2 says PA shifted and T1→T2 has a separate
dashed outlook-driving cue. No new zero-slack/projected CPM claim appears.

## Precision, Unknown and unrelated movement (4 minutes)

| Fixture | PA As-of | Expected |
| --- | --- | --- |
| `same-day-precision.json` | Nov2 | A completed on committed date; no historically late completion. B's conservative PA moves from Nov2 H3 to Nov3 H1. No proven actual same-day delay claimed. |
| `started-unknown.json` | Nov3 | B In Progress → PA/project Unknown; no full-duration replacement or invented start. |
| `blocked-unknown.json` | Nov3 | Blocked predecessor/restart unknown → required downstream Unknown. |
| `reopened-unknown.json` | Nov4 | Old actual marker says history/reopened; does not release B. PA/project Unknown. |
| `conflicting-history.json` | Nov3 | B actual Nov2 before predecessor A actual Nov3; explicit conflict, preserved facts and no certified global outlook. |
| `as-of-only.json` | Nov4 | Unrelated manual root T2 moves due As-of, without attributing it to late T1. Impact details explain its not-before release. |
| `nonworking-actual.json` | Nov7 | A actual Saturday Nov7; B already starts Monday Nov9, unchanged project outlook. Compressed mode preserves exact Saturday text at a collapsed boundary. |

Dates in the table are `2026-11-DD`. Review any future-effective warning
against the deliberately supplied PA As-of, not the separate FF control.

## Persistence and navigation (3–4 minutes)

Import `roundtrip.json`; PA As-of Nov4. Save As a disposable browser copy,
reload, Load project, and supply PA As-of Nov4 again. Expect B PA Nov5.
Export JSON, re-import it and supply Nov4 again. Baseline, task progress,
completion snapshots, remaining estimates and FF settings must survive;
no PA endpoints or PA preference are added to the file. PA input changes
alone should not mark a saved project dirty.

Import either existing `tests/fixtures/wp71/student-30-prepared.json` or
`student-40-performance.json`. Set PA As-of Nov9. Scroll and select tasks,
use Go to impact, test keyboard scrolling, switch charts and return. Rows
stay bounded; offscreen effects remain discoverable. Extent changes after
progress/As-of edits retain date context. Existing explicit scale/mode
changes continue to reset horizontal position, as before this package.

Review at desktop and a narrow window. Check labels, focus, dependencies,
hatching and all simultaneously visible layers for obstruction. Record any
confusion about actual/committed/FF/PA separately from arithmetic defects.
This runbook is owner review, not a conducted student participant study.
