# Verification, reproduction and scope

Client date 2026-11-09, America/Regina; source commit
`1b35da8ed7e4d113557b992d7abe7a1a0c316e6d`, `feature/wp7-stabilization`.
The [machine-readable record](evidence/verification.json) pins the request, protected
refs, checks and primary evidence hashes. No owner decision is inferred from tests.

## Checks actually completed

| Check | Result / evidence |
| --- | --- |
| npm.cmd run check in the worktree before research scripts | Exit 0: lint, typecheck, 625 tests / 37 files, production build. [Log](evidence/check.txt). |
| npm.cmd run test:e2e -- --workers=3 in isolated source export | Native exit 0: 223 Chromium checks, 2.5 minutes. [Log](evidence/browser-all.txt). |
| npm.cmd run build in isolated source export | Exit 0; JS/CSS byte comparison against worktree build passes. [Log](evidence/build-isolated.txt). |
| node scripts/measure.mjs | Final exit 0: 11 scenarios, 165 fresh measured processes, 55 warmups, 1,180 research assertions. [Log](evidence/measure.txt), [raw measurements](evidence/measurements.json). |
| Independent graph/closure/baseline/checkpoint audit | Four dense inputs independently counted from baseline graphs; DAG, 1,034 edges, 99 unique successors, unique closure reviews, episode growth and checkpoint binding verified. [Scope audit](evidence/scope-audit.json). Selected fixture checks, not full format validation. |
| Final lint and Node syntax checks | Exit 0 after assessment utilities added. [Log](evidence/final-checks.txt). Node syntax checking explicitly covers MJS research scripts. |
| Source/import/asset/recipe/ownership audit | 57 App source modules exclude assessment, unused repository and working evaluator. Source/config and prior /2/WP7.4.4b package unchanged; asset bytes identical; 85 existing edited files retain initial content hashes. [Scope audit](evidence/scope-audit.json). |

Node 24.19.0 / V8 13.6.233.17-node.51, Windows 10.0.26200 x64, Ryzen 9 8945HX,
32 logical CPUs, 16,425,455,616 RAM bytes. Versioned reference/recipe/input hashes
are in the measurement JSON. The unchanged WP7.4.4b canonicalize 5.1 reference is
reused; the earlier Node/.NET 37-vector suite is prior evidence, not a new count.

## Reproduce research evidence

These commands regenerate package-owned evidence and synthetic outputs only.
Use a scratch checkout if you want to preserve delivered timing results exactly.

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
node docs/qa/wp7-4-4c/scripts/measure.mjs
node docs/qa/wp7-4-4c/scripts/audit.mjs
```

Expected branch: feature/wp7-stabilization. The study output marker must identify
WP7.4.4c; scripts refuse unowned directories. Default outputs are under
`GanttProject/output/wp7-4-4c-study`. An alternate output must be a dedicated child
of workspace/output; use `measure.mjs <absolute-output>` and the matching audit
`--study=<absolute-output>`. Timing/RSS may vary; canonical bytes/input hashes
must match for these deterministic recipes. Earlier generated WP7.4.4b inputs are
optional; regeneration uses unchanged recipe and checks the pinned snapshot digest.

## Repeat regressions while preserving tracked review artifacts

Browser tests regenerate tracked historical QA artifacts. The executed run used
a git-archive export of the starting HEAD under
`output/wp7-4-4c-verification/app`, with a node_modules junction. It owned only
port 4173; owner dev servers/ports 5173/5174 were untouched. The full check initially
ran in the worktree; an independent production build in the export enabled the
byte comparison. No blanket restore/reset was used on owner evidence.

Example for a future repeat; choose a new unused directory:

```powershell
$wp744cApp = 'C:/Users/gavin/Documents/CodexProjects/GanttProject/output/wp7-4-4c-owner-app'
if (Test-Path -LiteralPath $wp744cApp) { throw 'Choose a new isolated directory' }
New-Item -ItemType Directory -Path $wp744cApp | Out-Null
git archive --format=tar "--output=$wp744cApp/source.tar" HEAD
tar -xf "$wp744cApp/source.tar" -C $wp744cApp
New-Item -ItemType Junction -Path "$wp744cApp/node_modules" -Target "$PWD/node_modules" | Out-Null
Push-Location $wp744cApp
npm.cmd run check
Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue
npm.cmd run test:e2e -- --workers=3
Write-Output "Native npm exit code: $LASTEXITCODE"
Pop-Location
node docs/qa/wp7-4-4c/scripts/audit.mjs "--app=$wp744cApp"
```

The audit also checks original edited-file hashes where the local delivery
preservation log exists. That ignored log is not user project data or an artifact
to publish. A fresh clone can still verify source, hashes, graphs and assets after
generating the study and comparison build; it cannot attest another worktree's
pre-existing local edits.

## Failures, warnings and limits

- The first harness negative checkpoint fixture altered its revision, making it
  ineligible for selection; the expected selected-checkpoint rejection did not
  occur and the research assertion failed. The fixture now corrupts checkpoint
  contents while retaining its selection revision. The entire measurement run
  was repeated and all final assertions pass. No production or reference algorithm
  was changed to make results agree.
- Vite printed dependency-scanning/bundling messages while creating fresh synthetic
  baselines; these are not app or browser failures. Native browser exit was captured
  explicitly, with process-local NO_COLOR removed. No compiler/test failure remains.
  Captured PowerShell UTF-16LE terminal logs were losslessly transcoded to UTF-8
  for readable text evidence; measured project/reference bytes were not transcoded.
  Their original CRLF is retained. Full staged whitespace checking flags those
  captured log line endings; the check excluding generated evidence passes for
  all authored documents/scripts. No reference/data bytes were changed to hide it.
- Read probes initially guessed several file names that do not exist; the audit
  used the actual listed source paths. No missing source was substituted with an
  assumed implementation. No new npm/runtime package or production dependency was
  installed, and no physical database/browser storage was modified for experiments.
- Only an illustrative known recorded-state series is replayed. The path delta
  representation is not complete domain semantics; arrays depend on fixed recipe
  order. Unknown earlier history stays Unknown. Partial never becomes Complete.
- Queries are in-memory scans, not measured indexed SQL/IndexedDB fetches. Purpose
  reads are separate synthetic JSON files, not an implemented lazy repository.
  Memory numbers include runtime and allocation effects, not browser guarantees.
- No real format 6 reader, full semantic validation, accepted-state rejection,
  crash/concurrency/cancellation/eviction/transaction or streaming import/export
  test is claimed. Those are explicit proposed gates in the repository contract.

## Delivery and stop

Only `docs/qa/wp7-4-4c/` is staged/committed/pushed. Main and both protected tag
objects/peeled targets are checked against initial values before and after push;
the final owner handoff reports the actual delivery SHA. Existing local evidence
edits remain outside the commit. No production code/model/version/codec/storage/
UI/formula change is authorized here. R07 remains pending; stop for owner review,
without starting WP7.4.5, any implementation phase or WP8.
