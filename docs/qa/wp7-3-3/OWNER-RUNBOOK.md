# Owner review - 15-20 minutes

Save/export any real open plan before importing the fictional review files.
Every example is named **WP733 DISPOSABLE**. Use the separate
[acceptance checklist](ACCEPTANCE.md) to record the result.

## Start and identify the correct app (2 minutes)

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

The branch must be `feature/wp7-stabilization`. Open the localhost5174 URL
printed by Vite, keeping PowerShell open. This distinguishes the stabilization
worktree from an older app server on5173. If5174 is already occupied, use the
existing server for this same worktree or choose an explicit free port and
open its printed URL. Do not discard unsaved real edits just to switch apps.

Use Files -> Import JSON from `tests/fixtures/wp733/`. Set **PA As-of after
each import** as listed below. It is an external view context, not a saved
preference. Use Scale **Day** for a broad first review; repeat selected cases
with Hour and Compressed to inspect boundaries. An offscreen primary position
can be revealed with Go to impact; no automatic chart jump is expected.

## Actual reality and Monday release (4 minutes)

Import `late.json`; PA As-of **2026-11-06**.

- T1's thin C reference remains Nov2. Its prominent red dotted extension
  reaches ActualNov6 and the row says **Completed late +4 calendar days**.
- The red span means elapsed lateness, not4 hours of work or continuous work.
  Its comparison is against the commitment saved at completion, not today's
  editable plan or optional baseline.
- T2's primary conditional PA is **MondayNov9 H1 through afterH4**. The
  secondary C remains TuesdayNov3. No primary actual-work interval is invented.
- R on T1 identifies the conservative **Nov9 H1 release**, not an actual
  finishing hour on Friday. The primary relationship connects R to T2 PA;
  the original committed relationship remains a distinct dotted reference.
- Summary names T2 as shifted and gives conditional project finish Nov9 versus
  committed Nov3. Four historical late days are not the six-day project
  outlook difference or an effort variance.

Turn all8 combinations of Show Baseline / Show Forecast / Highlight Critical
Path on/off (or inspect the captured matrix evidence). A/red/PA/R remain
automatic. Check the top FF, primary Actual/PA, C, Baseline and uncertainty
lanes for readable separation. Critical means committed CPM only.

## Historical late with absorbed impact; ties/driver (3 minutes)

Import `absorbed.json`; As-ofNov6. Red +4 days remains; T2 PA endsNov9,
but independent T3 controls Nov10. Summary must say **project outlook
unchanged**, with movement absorbed. Import `leaf.json`; As-ofNov6 to confirm
the same historical overrun remains visible with no successors at all.

Import `tied.json`; As-ofNov6. Both completed predecessors have RNov9 and
separate primary relations into T3; inspect each with keyboard/tooltip.
Import `driver.json`; As-ofNov6, enable critical highlighting. T3 remains
committed-critical; T1/T2 are the conditional outlook-driving branch, without
a new projected critical-path claim.

## Precision and Unknown (4 minutes)

All dates in this table are November2026.

| File | PA As-of | Look for |
| --- | --- | --- |
| `future.json` | Nov4 | ActualNov6 is future-effective in this context. Warning/qualified recorded comparison; T2 PA Unknown, Deps ?, no precise R-to-PA arrow or fabricatedNov9 bar. |
| `started.json` / `blocked.json` | Nov6 | Existing status, no invented actual start/restart/full-duration PA. C is only a subordinate reference. |
| `reopened.json` | Nov6 | Old Actual is History, current PA Unknown. The historical completion does not release T2. |
| `conflict.json` | Nov6 | B actualNov3 is preserved before predecessor A actualNov6; explicit conflict/uncertainty, no shifted completed fact. |
| `on-time.json` | Nov2 | Strong Actual, no red overrun; T2's unchanged PA/C uses one interval labelled PA=C. |
| `early.json` | Nov2 | Strong Actual and early comparison; no overrun invented from today's plan. |
| `missing-reference.json` | Nov6 | Actual plus historical comparison unavailable. No fabricated red interval from current/baseline dates. |
| `weekend.json` | Nov7 | Actual SaturdayNov7, historical commitment FridayNov6, +1 calendar day. R MondayNov9. Expanded shows elapsed gap; Compressed shows a collapsed red break at the exact labelled date. |

In Compressed, the red width is not elapsed duration: omitted dates can have
zero working-axis width. Read the exact actual date and calendar-day label.

## Immediate update, persistence and usability (4-6 minutes)

Import `before.json`; PA As-ofNov6. Select T1, which is In Progress; T2 PA
is Unknown. In the selected chart task panel change T1 to Complete, enter
effective completion **2026-11-06**, acknowledge no formal criteria, confirm.
Without refresh, navigation or overlay toggles, expect red +4 days, ActualNov6,
primary T2 PA Nov9 and RNov9. Test Tab/Enter on the red span, Actual, R,
primary PA and reference C. Full descriptions must distinguish each meaning.

Save As a disposable browser plan. Reload/Load project and supply the same
PA As-ofNov6. Export JSON, re-import and supplyNov6 again. History, baseline,
source dates/edges/estimates and forecast settings must survive; presentation
endpoints and a PA preference are not new file fields. Existing older-format
backup/migration prompts remain unchanged.

Import the existing `tests/fixtures/wp71/student-30-prepared.json` or
`student-40-performance.json`, set PA As-ofNov9 and try a narrow window.
Scroll/select/switch views, use Go to impact and keyboard scrolling. The
sticky row caption and legend must explain offscreen effects without relying
on color. Expand Impact details: every task remains reachable; large lists
use Show more while closed lists avoid mounting hidden task DOM.

Record arithmetic defects separately from comprehension or visual findings.
Automated passes and screenshots are not a conducted student study or owner
acceptance on the real device.
