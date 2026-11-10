# Verification evidence

Client date 2026-11-10, starting HEAD
`d0e99034c71dc6141ed8d56cad4f1a3be3627051`, branch
`feature/wp7-stabilization`. Commands use the stabilization worktree unless
otherwise stated. Runtime version: Node 24.19.0. Results are finite fixture
evidence and unchanged-app regression evidence, not production integration.

| Check | Command / method | Observed result |
| --- | --- | --- |
| Focused characterization | `npm.cmd test -- src/repository/operationalConsumerParity.test.tsx` | **96 tests, 1 file passed**, exit 0; [log](evidence/focused.txt) |
| Complete checks | `npm.cmd run check` | **797 tests, 39 files passed**, lint/typecheck/build passed, exit 0; [log](evidence/check.txt) |
| Browser regression | `npm.cmd run test:e2e -- --workers=3` | **223 passed**, 2.6 minutes; [log](evidence/browser-all.txt), [Playwright final status](evidence/browser-last-run.json) |
| Deterministic original oracle | Isolated starting-commit source + producer-only capture script | 24 cases, 600,506 bytes; producer shim absent; [provenance](evidence/golden-provenance.json) |
| Source inventory | `node docs/qa/wp7-4-6/scripts/inventory.mjs` | 116 files classified, 105 TS/TSX, 57 static App imports (including types), 45 test/utilities; [index](evidence/consumer-inventory.json) |
| Result ledger | `node docs/qa/wp7-4-6/scripts/parity-report.mjs` | 24 cases; no unexpected subset differences; gaps and deliberate population difference retained |
| Script syntax / scope | `node --check` for each package mjs; [audit](scripts/audit.mjs) | See [scope evidence](evidence/scope-audit.json) |

The browser run used an isolated export of the starting commit at
`output/wp7-4-6-verification/baseline-capture`, sharing installed dependencies
by junction. Playwright launched its own server on 127.0.0.1:4173. This protected
pre-existing edited screenshots/JSON in the owner's worktree from the browser
suite's output writes. Production source/assets were also built there and
compared with this worktree. The final browser summary and `.last-run.json`
both report passed; the original tool's numeric exit result was not retained.
No new browser UI/integration was created or exercised.

## Preservation audit

The task adds only this package and one new source **test bridge**. The source
inventory and Git scope checks show no modification of App, engines,
repository S/operational port, reference adapters, codecs/formats, storage,
dependencies, configuration, components or existing QA/contracts. App's static
import graph stays at 57 modules; none imports the new test package/bridge.
Production dist index/CSS/JS bytes match the isolated starting-commit build.

The ignored initial hash manifest recorded **85 pre-existing actual edited
files**. All 85 are byte-for-byte preserved and excluded from staging/commit.
Git status can list additional CRLF/stat-only evidence files; those were not
reset or staged either. Browser artifacts were generated in the isolated copy,
not over the owner's evidence. No real project files/browser profile/local
library were opened, migrated or written by the characterization probes.

Protected references are checked before and after publication:

| Reference | Required unchanged value |
| --- | --- |
| main | a6a1c32c22a2bf074b161e52d523443602843dd7 |
| v1.0-pre-progress tag object / peeled | a4157bc84392c770c27111da58d779948b110a56 / abb85011dafc9fb0876953e3132880e025ef65da |
| v1.1-pre-stabilization tag object / peeled | 134305f2205eb993ab76672c2d2469d48d91a609 / af96d3b257ddfdcbc7f26a968401d634d210aef6 |

Only `feature/wp7-stabilization` is committed/pushed. The full handoff SHA is
reported in the delivery message and Git history; evidence in the commit does
not attempt to embed its own recursive SHA. A final post-push check compares
remote branch to HEAD and protected refs to the values above.

## Limits and diagnostic history

The initial invalid forecast fixture capture was replaced by an independently
recaptured validated corpus; see [vectors](PARITY-VECTORS.md). Initial test-only
lint/type errors were fixed before final checks. An inventory classification
omission for forecast settings was fixed; the inventory fails on unclassified
source. Failed convenience Python/process-inspection commands did not modify
files or change test conclusions; DOCX requirements were read with .NET ZIP/XML.

No runtime assertion failure or production bug repair was needed. Expected gap
assertions count as test passes but **not semantic parity passes**. PA/history
presentation adaptation, complete work details, arbitrary generic payloads,
clock-skew compatibility, physical I/O/memory, storage/export and UI partial
coverage handling remain unproven. R07 and production authorization remain open.
