# Verification and scope evidence

Client date 2026-11-09, America/Regina. Starting SHA
`191f919b9929ef2a4b53083038b500e2e803af91`, branch `feature/wp7-stabilization`.
Authority/request hash is in [README](README.md). Counts below are observed final
results, not inferred owner acceptance or production storage qualification.

| Executed check | Actual result |
| --- | --- |
| npm.cmd test -- src/repository/operationalHistoryRepository.test.ts | Exit 0: 76 cases in one focused suite. [Log](evidence/focused.txt). |
| npm.cmd run check in the worktree | Exit 0: lint, typecheck (including compile-only assertions), 701 tests in 38 files and production build. [Log](evidence/check.txt). Existing 625 + new 76. |
| npm.cmd run test:e2e -- --workers=3 in isolated starting-source export | Native exit 0, 223 Chromium checks, 2.6 minutes. [Log](evidence/browser-all.txt). No new UI or provider flow. |
| npm.cmd run build in isolated starting-source export | Exit 0. Worktree's final build files byte-match this independent baseline build. [Log](evidence/baseline-build.txt). |
| App/source/import/asset audit | New capability/test bridge only under src; original port, application consumers/config/package/codec/storage/engine files unchanged. App graph excludes both repository capabilities and test oracle. All built files identical; 85 initial edited-file hashes preserved. [Scope audit](evidence/scope-audit.json). |
| Package/link/staging/ref audit | Five required documents, case mapping and local links checked; only authorized additions staged. Main and protected tag object/peeled IDs verified before/after push; final handoff reports full SHA. [Verification record](evidence/verification.json). |

Environment: Node 24.19.0 / V8 13.6.233.17-node.51, Windows 10.0.26200 x64,
AMD Ryzen 9 8945HX, 32 logical CPUs. Existing dependencies/config were used; none
installed/changed. No external service/database/authentication/real project data
was involved in the oracle. Reference seeds and intent/fingerprint tokens are
authored test values, not a format upgrade or a `/2` golden-vector extension.

## Reproduce focused and full checks

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
npm.cmd test -- src/repository/operationalHistoryRepository.test.ts
npm.cmd run check
```

Expected branch feature/wp7-stabilization; 76 focused / 701 total in 38 files.
The test-only modules are reached from one source test bridge; no root runner/
TypeScript/ESLint configuration was edited. The old repository suite is unchanged.

## Browser isolation and app parity

The browser run/build used a git-archive of the starting source under
`GanttProject/output/wp7-4-5-verification/app`, with an installed node_modules
junction. The new unused interface is not a browser feature. The final worktree
JS/CSS/index bytes match that isolated application build, so the browser checks
exercise the same runtime artifact. This does not claim browser testing of the
new memory oracle or UI integration. Only Playwright's owned 4173 was used; owner
5173/5174 servers were untouched. Regenerated QA files stayed in the export.

To repeat browser checks without overwriting pre-existing tracked owner evidence,
use a fresh directory (never blanket-reset this worktree):

```powershell
$wp745App = 'C:/Users/gavin/Documents/CodexProjects/GanttProject/output/wp7-4-5-owner-app'
if (Test-Path -LiteralPath $wp745App) { throw 'Choose a fresh isolated directory' }
New-Item -ItemType Directory -Path $wp745App | Out-Null
git archive --format=tar "--output=$wp745App/source.tar" HEAD
tar -xf "$wp745App/source.tar" -C $wp745App
New-Item -ItemType Junction -Path "$wp745App/node_modules" -Target "$PWD/node_modules" | Out-Null
Push-Location $wp745App
npm.cmd run check
Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue
npm.cmd run test:e2e -- --workers=3
Write-Output "Native browser exit: $LASTEXITCODE"
Pop-Location
```

Expected browser count 223. Compare final dist SHA-256 values with the recorded
scope audit and independent build if reviewing asset parity. The ignored local
preservation log records initial hashes of owner edits; it is not published user
project data and a fresh clone cannot attest another worktree's local modifications.

## Failures, warnings and corrections

The initial 67 runtime cases passed while the first typecheck/lint found issues
in the new additions: unused imports, recursive JSON/deep-readonly expansion of
branded primitives, an inferred literal suffix, Node crypto typing outside the
existing app TS configuration and a missing archive type predicate. Corrections
were confined to this slice: a brand-preserving ReadonlyValue, explicit types,
removed imports and process-local exact-value fixture interning instead of a
Node-only fingerprint dependency. Existing port/types/config stayed unchanged.
Additional cases and checked work-aggregate arithmetic brought the suite to 76.
The final focused/type/lint/full checks all pass; no runtime assertion failed.

Native browser exit was captured explicitly with process-local NO_COLOR removed.
Captured PowerShell UTF-16LE terminal logs are readable UTF-8/LF copies; original
logs remain in owned output. No project/canonical/reference data was transcoded.
No final compiler, lint or browser warning/failure remains. No extra benchmark or
new independent cross-language vector count is asserted for this slice.
Git reported its normal LF-to-CRLF working-copy notice for the two new source
files under the existing repository settings. Staged content/whitespace checks
pass; no global Git or root line-ending configuration was changed.

## Unpassed future gates and stop

exportPortable deliberately returns Unsupported and leaves its sink untouched.
No conformant `/2` serialization, JCS/full-D validation, real-source rejection or
qualified capacity/reopen path is implemented or passed. Seed validation is not
an import API. Fixture-domain lifecycle/fact/work checks are bounded protocol
evidence, not complete R07 domain/attestation validation.

The oracle keeps full fixture/history copies in memory and scans/rebuilds test
lists. No SQL/IndexedDB adapter, native transaction/crash/durability, authentication,
lazy-I/O/scale or production memory claim. No consumer fact/work-history parity,
report/toggle/PDF, exact intermediate-schedule replay or FR-HIST-01 capture is
implemented. No formats 1–5, existing original baselines or stored projects changed.

Only the new unused port, one test bridge and this package are committed/pushed.
Main/protected tags and previous owner edits remain intact. Final R07 acceptance
is still pending; stop for owner review before any further storage/export/
consumer/deployment implementation or WP8 authorization.
