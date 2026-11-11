# Owner follow-up testing — WP7.4.7a

Both correction findings remain open until you review the resulting UI.

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
$env:VITE_SELECTED_TASK_HISTORY = 'true'
npm.cmd run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

Expected branch: `feature/wp7-stabilization`. Open `http://127.0.0.1:5176/`.
Use a free port; this avoids restarting your existing 5174 session. Different
origins/ports have separate browser libraries. Import an explicit JSON copy to
test a plan from another port. Save unfinished work before restarting any
existing server; the environment flag is read at startup.

## Student-facing history

1. Import the existing
   [synthetic 40-task fixture](../wp7-4-7/evidence/owner-fixture.json), select T1
   and use Show history. The history starts collapsed when enabled; the default
   flag-OFF and production paths remain the original display.
2. Primary rows should show Changed from X to Y, a readable date and recorded
   reason. They should not lead with IDs, schema versions or raw UTC timestamps.
   Only one Some earlier history may be unavailable note appears above records.
3. Open **More about this change** for the older Complete row. Confirm the
   original guidance/checklist and note are intact, with local recorded time and
   timezone clearly labeled. T1's current status remains In Progress.
4. Open **History details**. Check the native event IDs, source positions,
   exact UTC/effective dates, source format, Unknown actor/decision ID, coverage
   explanation and retained record. This disclosure starts collapsed.
5. Load more twice: 20→40→43 rows. Hide/reveal, switch to blocked T2 and empty
   T3, try a criterion draft and confirm nothing changes except the view.

## Required unavailable-versus-empty check

Use the synthetic preview at
`http://127.0.0.1:5176/docs/qa/wp7-4-7/qa/index.html`; it reads no saved projects.

| Action | Required visible result |
| --- | --- |
| Scenario partial, selected T3, Show history | Exactly No recorded history for this task. plus one Some earlier history may be unavailable note |
| Scenario unavailable, selected T2, Show history | Exactly History unavailable. with no empty-state primary or competing Partial note |
| Repeat unavailable for T1 and T3 | Same unavailable distinction, independent of zero row count |
| Open History details for each case | Availability remains Available versus Unavailable; detailed coverage remains Partial |

Compare [before/after screenshots](QA-REGRESSION.md). This is the required human
gate for QA7.4.7-002; do not infer it from the automated pass count.

Try invalid, expired, oversized and mixed scenarios. Short primary text and
recovery actions must remain distinct. Invalid uses **Retry reading history**;
the same invalid source can predictably fail again without changing data.
Expired/mixed use **Refresh history**. Safe original-display fallback remains
explicit; invalid/mixed cannot silently fall back. Use delayed selection and
Simulate source change to verify stale rows never mix with a new read.

## Rollback and verification

Stop this test server, unset the flag and restart to return to the original path:

```powershell
Remove-Item Env:VITE_SELECTED_TASK_HISTORY -ErrorAction SilentlyContinue
npm.cmd run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

No migration or data rollback is required. Do not reset/clean your existing edits.

```powershell
npm.cmd test -- src/history/selectedTaskHistory.test.ts src/components/progress/SelectedTaskHistory.test.tsx src/components/progress/SelectedTaskHistory.ux.test.tsx
npm.cmd run check
node node_modules/typescript/bin/tsc -b docs/qa/wp7-4-7a/tsconfig.json --pretty false
npm.cmd run test:e2e -- --config docs/qa/wp7-4-7a/playwright.config.ts --workers=3
```

Expected 48 focused, 845 total tests and 31 feature browser checks. The combined
feature configuration redirects screenshots into this package. Run the existing
223 browser checks in an isolated copy if preserving edited older QA artifacts.
`before.config.ts` is for the original archived WP7.4.7 source only; it deliberately
asserts the old UI and must not regenerate before evidence from corrected code.

Record acceptance/closure separately in [OWNER-DISPOSITION](OWNER-DISPOSITION.md).
No boxes were auto-checked. R07 remains pending final review; no automatic
WP7.4.8, reporting, storage/provider, portable export or snapshot work follows.
