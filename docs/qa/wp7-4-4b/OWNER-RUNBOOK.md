# Owner runbook - qualification only

No UI change is expected. Node 24 and .NET SDK 10 are installed in the measured
environment. All sources/fixtures are pinned locally; no npm/pip/NuGet package
installation is required. Run from the stabilization worktree in PowerShell.
These commands regenerate package-owned evidence and owned synthetic output;
they never upgrade/import/save a user project. Preserve delivery evidence in
Git or use a scratch copy if you want to compare fresh timing results.

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
$wp744bOut = 'C:/Users/gavin/Documents/CodexProjects/GanttProject/output/wp7-4-4b-verification'
New-Item -ItemType Directory -Force -Path $wp744bOut | Out-Null
$env:DOTNET_CLI_HOME = "$wp744bOut/dotnet-home"
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
dotnet build docs/qa/wp7-4-4b/reference/CrossCheck.csproj --configuration Release --configfile docs/qa/wp7-4-4b/reference/NuGet.Config "-p:BaseOutputPath=$wp744bOut/dotnet/bin/" "-p:BaseIntermediateOutputPath=$wp744bOut/dotnet/obj/"
node docs/qa/wp7-4-4b/scripts/make-vectors.mjs
node docs/qa/wp7-4-4b/scripts/qualify.mjs
node docs/qa/wp7-4-4b/scripts/capacity.mjs
node docs/qa/wp7-4-4b/scripts/cross-capacity.mjs
```

Expected: branch feature/wp7-stabilization; 37 vectors/358 assertions; 9 capacity
families with 3 measured runs each plus warmups; 9 boundary checks; two generated
snapshot digests agree across Node/.NET. Timing/RSS can vary; input/expected-byte
hashes should match for the same pinned recipe. Large synthetic files are under
`output/wp7-4-4b-capacity`, marked as qualification-owned; the script refuses an
unowned output directory. Avoid committing those files.

## Short owner review

Read [CANONICAL-VECTORS](CANONICAL-VECTORS.md) for the toJSON/leading-zero findings;
check [CAPACITY-REPORT](CAPACITY-REPORT.md) growth100-c20 exceeding10MiB; then
record decisions in [R07-FINAL-RECOMMENDATIONS](R07-FINAL-RECOMMENDATIONS.md).
Opening the app will show no new format 6 reader, lifecycle workflow or toggle.

## Repeat existing regressions without overwriting local review edits

The browser suite regenerates tracked review artifacts, so use a new isolated
export. Never blanket-reset a worktree with owner edits. If the following
directory already exists, preserve it and choose another dedicated name.

```powershell
$wp744bApp = 'C:/Users/gavin/Documents/CodexProjects/GanttProject/output/wp7-4-4b-owner-app'
if (Test-Path -LiteralPath $wp744bApp) { throw 'Choose a new isolated directory' }
New-Item -ItemType Directory -Path $wp744bApp | Out-Null
git archive --format=tar "--output=$wp744bApp/source.tar" HEAD
tar -xf "$wp744bApp/source.tar" -C $wp744bApp
New-Item -ItemType Junction -Path "$wp744bApp/node_modules" -Target "$PWD/node_modules" | Out-Null
Push-Location $wp744bApp
npm.cmd run check
Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue
npm.cmd run test:e2e -- --workers=3
Write-Output "Native npm exit code: $LASTEXITCODE"
Pop-Location
node docs/qa/wp7-4-4b/scripts/audit.mjs "--app=$wp744bApp"
```

Expected 625 tests/223 browser checks. The browser command owns port 4173 and needs
permission to clean up only that server. Audit verifies application imports,
asset bytes, pinned references and (where the delivery preservation log is
available) existing edits. It is not final R07 acceptance.

Do not run a codec/adapter/model implementation or start WP7.4.5/WP8 based on
qualification completion. Stop for explicit owner review and new scope.
