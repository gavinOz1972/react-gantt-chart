# Owner runbook — no UI change expected

Run in a new PowerShell terminal. The reference uses only synthetic memory
data; no saved project, owner browser tab or running5174 server is needed.

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
npm.cmd test -- src/repository/projectRepository.test.ts
npm.cmd run check
node docs/qa/wp7-4-3b/diagnostics/scope-check.mjs
npm.cmd run test:e2e -- --workers=3
```

Expected branch: `feature/wp7-stabilization`. The focused suite has74 tests;
full unit/component suite625; existing Chromium browser suite223. Browser
checks start their own isolated4173 server and must be able to clean it up.
Run the scope guard before marking acceptance; it checks the delivery's blank
acceptance sheet as well as application isolation.
They can regenerate tracked historical screenshots/metrics: inspect git status
and preserve your own edits; the implementation restored only its generated
artifacts after its clean-start run. Do not blanket-reset a worktree with edits.
If PowerShell turns a NO_COLOR/FORCE_COLOR warning into NativeCommandError,
remove NO_COLOR in that terminal process and capture the native exit explicitly:

```powershell
Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue
npm.cmd run test:e2e -- --workers=3
$wp743bBrowserExit = $LASTEXITCODE
Write-Output "Native npm exit code: $wp743bBrowserExit"
```

## One short two-writer/retry exercise

```powershell
npm.cmd test -- src/repository/projectRepository.test.ts -t "C08 two writers and exact retry"
```

Read C08 in [the suite](tests/conformance.ts): two writers receive revision17/
the same fingerprint, change different tasks and submit distinct transaction
IDs. Exactly one complete revision18 is accepted; the second gets StaleRevision.
The winner retries the identical request and receives AlreadyCommitted with its
original receipt, while loaded revision stays18. No task merge occurs. This
one-memory-critical-section example is not a native two-tab test.

To inspect receipt18/current19 and unknown acknowledgement reconciliation:

```powershell
npm.cmd test -- src/repository/projectRepository.test.ts -t "C11 old receipt"
npm.cmd test -- src/repository/projectRepository.test.ts -t "C16"
```

C16 covers both possible simulated outcomes: accepted or not accepted before
the acknowledgement is lost. The initial OutcomeUnknown is not proof of either;
same-ID retry/load resolves it without another copy or revision. No new React
save route/publication behavior is implemented by these examples.

Use [ACCEPTANCE](ACCEPTANCE.md) to record review. The app should look and save
exactly as before. The next R07 design decision and any browser adapter remain
separately authorized work; no format6/storage/DBMS activation is available here.
