# Owner runbook — selected task history

WP7.4.7 is implemented for owner UI testing. It is not enabled by default, and
no acceptance or final R07 approval has been recorded.

## Start the correct development server

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
$env:VITE_SELECTED_TASK_HISTORY = 'true'
npm.cmd run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

Expected branch: `feature/wp7-stabilization`. Open the printed URL,
`http://127.0.0.1:5176/`. This free test port avoids restarting your existing
5174 session. Each origin/port has its own browser library; import a JSON copy
explicitly to test a plan saved on another port. Keep the original saved copy.

If you prefer 5174, save any open work before stopping that server with Ctrl+C
and restarting it with the flag. Vite reads the variable at server startup.
Setting it in another terminal does not change an already running server.
Production builds always keep the original display, even with the variable set.

## Ordinary and synthetic project checks

1. First run without the variable, or with it unset: task details should retain
   the original **Transition history** disclosure. There is no Show history
   button on that path. Confirm your normal task/status/criteria controls.
2. Enable as above. In **Files → Import JSON**, choose
   [owner-fixture.json](evidence/owner-fixture.json), then select T1 via its chart
   label or task table ID. The new history starts collapsed.
3. Tab to **Show history**, press Enter, and check that focus stays on the same
   button (now **Hide history**). First 20 retained T1 transitions appear. Actor
   and separate decision ID are Unknown. Partial coverage is visible.
4. T1 is currently **In Progress** after reopening. Its older Complete record
   H-42 retains the original guidance, checked criterion, note and committed
   finish; it does not change the current status. Effective date 11-05 is separate
   from recorded UTC time 11-09. HTML-like wording remains literal text.
5. Use **Load more history** twice: 20→40→43 rows, then truthful end. Equal
   timestamps retain reverse source order, starting H-43. No T2 rows appear.
6. Hide, then select T2: it starts collapsed and shows its two decisions when
   requested, including the blocked reason. T3 has no matching retained rows;
   its Partial qualification does not claim no historical work ever occurred.
7. Start a criterion edit, type unsaved wording, and show/hide history. The draft
   remains; cancel it when finished. Confirm chart position/selection, status,
   remaining, baseline, forecast and optional work totals are unchanged.
8. Save As a synthetic copy, view/page/hide, then check **Saved locally** remains.
   Reload the page and Load project: history starts collapsed. Export before/
   after viewing should have identical project content; explicit exports may
   have different savedAt timestamps. Viewing itself performs no save.

## Safe error and concurrency preview

Open `http://127.0.0.1:5176/docs/qa/wp7-4-7/qa/index.html` while the flag is ON.
This isolated development fixture reads no project library and writes nothing.

| Scenario | Expected result after Show history |
| --- | --- |
| partial | Normal retained transitions and explicit Partial coverage |
| empty | Available but no matching rows; qualified end, no completeness claim |
| unavailable | Older source without retained progress; explicit Unavailable and Partial |
| invalid | Missing recordedAt rejected; no guessed undated record or unsafe fallback |
| unsupported | Qualified failure; Refresh and optional loaded-display fallback |
| expired | ReadExpired, refresh and optional fallback; no mixed pages |
| oversized | A valid synthetic 300-criterion attestation exceeds 128 KiB; no truncation; optional original loaded display |
| mixed | Mismatched watermark rejected, no rows/fallback; refresh available |
| cancelled | Cancellation/retry message |
| delayed | Visible loading; change Selected task rapidly to T2; late T1 rows never appear |

After loading, **Simulate source change** must discard rows and request explicit
**Refresh history**. On supported failure cases, **Show loaded legacy history**
is an explicit fallback to the original unpaged local display with a visible
qualification. It does not fetch another project or certify complete evidence.
Do not modify real project JSON to produce invalid/error scenarios.

## Rollback and reproducible checks

Stop this test server with Ctrl+C, then unset the variable and restart:

```powershell
Remove-Item Env:VITE_SELECTED_TASK_HISTORY -ErrorAction SilentlyContinue
npm.cmd run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

The original Transition history path returns. No project fields, disclosure
preferences, migration or data rollback are involved. Do not reset your branch
or remove your existing edited evidence files.

```powershell
npm.cmd test -- src/history/selectedTaskHistory.test.ts src/components/progress/SelectedTaskHistory.test.tsx
npm.cmd run check
node node_modules/typescript/bin/tsc -b docs/qa/wp7-4-7/tsconfig.json --pretty false
```

Expected 36 focused and 833 total tests. The isolated feature-on browser suite:

```powershell
npm.cmd run test:e2e -- --config docs/qa/wp7-4-7/playwright.config.ts --workers=3
```

It starts its own server on 4175 and writes only this package's synthetic
screenshots/results. The existing 223-check suite writes older QA evidence;
run it in an isolated source copy if preserving local edited artifacts.
See [verification](VERIFICATION.md) for the implementation's isolated runs.

Record your decision in [UI-ACCEPTANCE](UI-ACCEPTANCE.md). Stop for that review;
no storage/provider, retired-task UI, report/PDF, portable export or snapshot
work is implied by accepting this selected-task read feature.
