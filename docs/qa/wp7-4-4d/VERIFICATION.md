# Verification and scope evidence

Client date 2026-11-09, America/Regina; branch `feature/wp7-stabilization`;
starting SHA `c967d0c8417d263cccdc3c6b5472036199bbcdcd`. Authority/source hash
is recorded in [OWNER-DISPOSITIONS](OWNER-DISPOSITIONS.md). The
[machine-readable verification](evidence/verification.json) records versions,
protected refs, suite counts and evidence hashes; the
[scope audit](evidence/scope-audit.json) records content preservation, imports,
document/link checks and byte-identical application assets.

## Actually executed checks

| Check | Actual outcome and limits |
| --- | --- |
| npm.cmd run check in isolated starting-HEAD export | Native exit 0: lint, typecheck, 625 unit/component tests in 37 files and production build. [Log](evidence/check.txt). Existing runtime only. |
| npm.cmd run test:e2e -- --workers=3 in the isolated export | Native exit 0: 223 Chromium checks, 2.6 minutes. [Log](evidence/browser-all.txt). No new report/format/API behaviour is asserted. |
| Final worktree npm.cmd run lint | Exit 0 after documents were added. [Log](evidence/final-lint.txt). No src/TS/config/package change. |
| Source and App import audit | Application/source/config and earlier contract packages unchanged. App's 57 source modules still exclude the unused repository/working evaluator and new package. Evidence in scope audit. |
| Asset/preservation audit | All production dist files byte-match the independent isolated build. Initial hashes of 85 pre-existing edited files match. No owner evidence reset or project data write. |
| Documentation checks | Ten required Markdown documents, valid local links, UTF-8 text and labelled H04/H05/H06 illustrations. Only A00/D01–D05's source-recording checkbox is checked; final R07 remains unchecked. These are document checks, not runtime conformance. |
| Git/ref/scope checks | Branch correct, empty starting index, only this documentation package staged; main and both protected tag objects/peeled commits checked before/after delivery. Final handoff reports exact commit and push result. |

Measured environment for these regressions: Node 24.19.0 / V8
13.6.233.17-node.51, Windows 10.0.26200 x64, Ryzen 9 8945HX, 32 logical CPUs.
No new benchmark or new cross-language qualification was executed for this
documentation-only package. WP7.4.4b's 358 assertions and WP7.4.4c's 1,180 research
assertions are prior evidence, not new runtime tests or final R07 acceptance.

## Isolation and reproducibility

The executed export was
`GanttProject/output/wp7-4-4d-verification/app`, made by git archive of the starting
SHA with a junction to installed node_modules. Both check and browser runs occurred
there, so regenerated tracked screenshots/QA JSON never overwrote owner edits.
Playwright owned port 4173 only; owner 5173/5174 dev servers were untouched.

For a repeat from this worktree, choose a new unused directory:

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
$wp744dApp = 'C:/Users/gavin/Documents/CodexProjects/GanttProject/output/wp7-4-4d-owner-app'
if (Test-Path -LiteralPath $wp744dApp) { throw 'Choose a fresh isolated directory' }
New-Item -ItemType Directory -Path $wp744dApp | Out-Null
git archive --format=tar "--output=$wp744dApp/source.tar" HEAD
tar -xf "$wp744dApp/source.tar" -C $wp744dApp
New-Item -ItemType Junction -Path "$wp744dApp/node_modules" -Target "$PWD/node_modules" | Out-Null
Push-Location $wp744dApp
npm.cmd run check
Write-Output "Native check exit: $LASTEXITCODE"
Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue
npm.cmd run test:e2e -- --workers=3
Write-Output "Native browser exit: $LASTEXITCODE"
Pop-Location
git diff c967d0c8417d263cccdc3c6b5472036199bbcdcd -- src package.json package-lock.json vite.config.ts playwright.config.ts
```

Expected: feature/wp7-stabilization, both native exits 0, 625/37 unit/component
counts and 223 browser checks, no source/config diff. Compare the built dist tree's
SHA-256 hashes with the worktree build and inspect scope-audit's recorded values.
Do not blanket reset the worktree to remove artifacts. The local ignored initial
preservation log allows delivery-time verification of the 85 owner edits; a fresh
clone cannot attest another worktree's private local changes.

## Warnings, limitations and reconciliation checks

No final compiler, lint, unit or browser failure remains. Native browser exit was
captured explicitly; process-local NO_COLOR was removed to avoid colour-warning
ambiguity. Captured PowerShell UTF-16LE terminal text was transcoded to UTF-8/LF
for readable evidence; original terminal logs remain in owned output. This does
not alter project/reference/canonical data. No new dependency or runtime installed.

Requirements were extracted read-only from the DOCX's XML. No DOCX/PDF was edited
or generated. No packaged executable audit/research script, fixture writer,
production model, repository API or migration was created. Ad hoc read-only scope
checks produce documentation evidence only.

The manual consistency review confirms: mandatory /2 retirement dates are not
weakened by report Unknown rendering; baseline-only missing legacy tasks are not
inferred retirements; one episode can be restored while the task is retired again;
report watermarks do not promise arbitrary historical reconstruction; first B,
named future captures and internal checkpoints are distinct; and warning-only
oversize acceptance is superseded by D02's qualified-route prerequisite. These
are design-review findings, not executable conformance results.

Not executed or claimed: new format 6 reader/codec/domain validation, lazy query
I/O, full-D cost, accepted-state rejection, physical atomicity/crash/concurrency,
legacy-consumer parity, reports/toggle/PDF export, higher-cap recovery or named
snapshot capture. All remain the explicit gates in
[COMPATIBILITY-AND-GATES](COMPATIBILITY-AND-GATES.md).

## Delivery and stop

Only `docs/qa/wp7-4-4d/` is committed/pushed; main, protected releases and earlier
packages remain unchanged. Delivery commit identity is read from Git and reported
in the final handoff, not invented as a self-referential hash inside a committed
file. Existing local edits remain outside the commit. Stop for owner review:
final R07 remains pending; no production implementation, WP7.4.5 or WP8 starts.
