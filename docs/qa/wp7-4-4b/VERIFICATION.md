# WP7.4.4b verification and scope

Client date2026-11-08, America/Regina. Branch `feature/wp7-stabilization`, actual
starting HEAD `4129c53d5e2f279810d31dc1f28d244e9d8c9344`. Pre-existing local
review/evidence edits were captured by content hash and preserved.

## Commands actually executed

| Command/check | Actual result |
| --- | --- |
| dotnet build reference/CrossCheck.csproj with local NuGet.Config and output redirected under workspace/output | Exit0, SDK 10.0.400/runtime10.0.11, 0 warnings/0 errors; no package sources/network restore. [Build log](evidence/dotnet-build.txt). |
| node scripts/make-vectors.mjs |37 fixed independent vector records with input, canonical hex and both hashes. |
| node scripts/qualify.mjs | Exit0,358 assertions; 37 byte vectors cross-checked Node/.NET, two reference limitations recorded. [Log](evidence/canonical.txt), [results](evidence/canonical-results.json). |
| node scripts/capacity.mjs | Exit0, 9 families, 27 measured runs/9 warmups, 9 boundary/flat-structure checks. Large outputs remain outside Git. [Log](evidence/capacity.txt), [results](evidence/capacity-results.json). |
| node scripts/cross-capacity.mjs | Exit0, 30/40-task generated snapshot hashes agree Node/.NET. [Log](evidence/cross-capacity.txt). |
| npm.cmd run check in isolated export | Exit0: lint/typecheck, 625 tests in 37 files, production build. [Log](evidence/check.txt). |
| npm.cmd run test:e2e -- --workers=3 in isolated export | Native exit0,223 Chromium checks in 2.7 minutes. [Log](evidence/browser-all.txt). |
| Final working-tree npm.cmd run lint and script syntax checks | Exit0 after test-only utilities/references added. [Log](evidence/lint-final.txt). |
| Source/import/byte/ownership audit | No src/config/app-dependency diff; application graph excludes qualification; bundle bytes/pinned sources match; original local edits unchanged. [Audit](evidence/scope-audit.json). |

Full command forms/paths are in [OWNER-RUNBOOK](OWNER-RUNBOOK.md). Test drivers
are isolated under this package; no npm dependencies or root configs changed.
C# reference sources and JS implementations are pinned, unmodified licensed
upstream content. Driver/csproj/probes/recipes are explicitly test-only. No
production model, reader, serializer, canonicalizer integration or migration.

## Environment and evidence provenance

The [machine-readable verification record](evidence/verification.json) pins the
request hash, protected reference values, suite counts and primary evidence hashes.

Node 24.19.0/V8 13.6.233.17-node.51, Windows x64 build10.0.26200, AMD Ryzen 9
8945HX, 32 logical CPUs, approximately16.4 GB RAM. .NET SDK 10.0.400/runtime10.0.11.
Maintained Node canonicalize 5.1.0 commit31fb117; C# and independent golden
testdata commit32a4819. Exact full hashes/versions are in
[reference manifests](reference/SOURCES.json), [second source](reference/SECOND-SOURCE.json)
and [capacity methodology](evidence/capacity-results.json).

Regressions used `output/wp7-4-4b-verification/app`, a git-archive export of the
exact source HEAD with a junction to installed node_modules. Browser outputs
landed in that export, preserving existing owner evidence. Only the owned port 4173
server was used/cleaned; owner ports 5173/5174 were untouched. Source/application asset
comparison is byte-based, not just matching filenames.

## Failures, warnings and corrections

- All final qualification/regression assertions pass. No valid canonical vector
  disagreement remains. The simplified sample failed the added valid toJSON
  data-member rule; this was characterized, not patched. Maintained 5.1/.NET match
  expected bytes. Full capacity runs were repeated using5.1; original sample
  measurements remain explicitly historical.
- C# raw parser accepts leading zero. This is an observed limitation, with strict
  lexical-probe rejection; serialization agreement is not parser certification.
- The locally fetched reference clone initially triggered Git ownership checks;
  per-command safe.directory for that explicitly owned clone allowed exact git
  blob reads. No global Git trust configuration was changed.
- A broad optional runtime inventory encountered access-denied folders and only
  Python Store aliases; .NET was available and used. No restricted data was read
  and no Python dependency/runtime installed. The upstream Node sample has no
  package.json; version is identified by its pinned commit instead.
- No dotnet compiler warnings or browser assertion failures. Browser native exit
  was captured explicitly with process-local NO_COLOR removed to avoid the
  previous PowerShell color-warning ambiguity.
- The first scope-audit attempt compared its not-yet-generated report path with
  mixed Windows separators and failed its self-link check. Using normalized
  resolved paths corrected that tooling issue; final audit passes. No application
  or reference algorithm was changed by this correction.
- Full staged whitespace checking reports original upstream reference whitespace
  and raw .NET evidence CRLF. Those captured bytes are intentionally unchanged; authored-file
  whitespace checking passes. Local attributes preserve reference/fixture/evidence
  bytes and LF recipe hashes across checkouts.

## Limits and stop

Tests qualify exact byte evidence and test-only resource envelopes; no new
codec accepts any real project. Full validation/preservation, browser responsiveness,
storage quota/atomicity and schema integration remain proposed. The report
does not equate358 assertions, 625 tests, 223 browser cases or the earlier199
authoring checks with full format 6 conformance.

Only this qualification package is committed/pushed. Main/protected tag objects
and peeled targets are checked before/after push; final owner handoff reports
the actual commit SHA. R07 remains pending owner review; no WP7.4.5, storage,
evaluator/Gantt change, deployment or WP8 starts automatically.
