# Verification - WP7.4.8-R07

Client date 2026-11-11, America/Regina. Base implementation:
`8ae0eb4cff4e9f46785852bec9462f0b49518513` on
`feature/wp7-stabilization`. This package adds no tests or application changes.

## Newly run checks

| Command / check | Result and retained evidence |
| --- | --- |
| `npm.cmd run check` | Exit 0: lint, application typecheck, **858 unit/component tests in 43 files**, build. [Full log](evidence/check.txt). |
| `node node_modules/typescript/bin/tsc -b docs/qa/wp7-4-7b/tsconfig.json --pretty false` | Exit 0: existing history QA/helper/browser typecheck. [Log](evidence/qa-typecheck.txt). |
| `npm.cmd run test:e2e -- --workers=3` | Exit 0, **223 default-off Chromium checks**. [Log](evidence/baseline-browser.txt). |
| `npm.cmd run test:e2e -- --config docs/qa/wp7-4-7b/playwright.config.ts --workers=3` | Exit 0, **38 feature-on Chromium checks**. [Log](evidence/feature-browser.txt). |
| `npm.cmd audit --json` | Exit 1 for findings, not a failed scan: **10 moderate**, 0 high/critical. [Raw report](evidence/npm-audit-all.json). |
| `npm.cmd audit --omit=dev --json` | Exit 0: **0 production findings**. [Raw report](evidence/npm-audit-production.json), [exit codes](evidence/npm-audit-exits.json). |
| Documentation/scope/preservation checks | [Scope audit](evidence/scope-audit.json): local links, byte preservation, source/config equality and production-asset hashes. |

Node **v24.19.0**, npm **11.17.0**; installed dependencies retained. Audit findings
cover ESLint/typescript-eslint/minimatch development paths (10 affected package
entries, not 10 independent vulnerabilities). No install, update, npm audit fix,
dependency or lockfile change ran. Production scan is not a general security
certificate. Registry findings can change; these reports describe this run.

Browser suites ran against an isolated archive of the exact base under
`output/wp7-4-8-r07-verification/candidate`, using a node_modules junction to the
installed dependencies. Playwright owned servers 4173 (default) and 4175
(feature-on). Synthetic fixtures and isolated browser storage only. Existing tests
write some older artifact paths inside that isolated copy; none was copied over
the owner's historical screenshots/JSON. Only fresh text logs are delivered here.
The feature variable was removed for default checks; its dedicated config enables
it for the second suite. Production builds always retain legacy history.

Build output remains `index-C1Jwrj5E.css` and `index-CemCM8Gv.js`, with identical
bytes to the previously accepted b asset evidence. Source/config content and the
application import boundary are unchanged. Scope is only this assessment plus
b acceptance and its two administrative links/checklist updates. Old evidence,
investigation, tests and application code remain untouched.

All **85 pre-existing actual local edits** were fingerprinted before work and
remain byte-identical/outside staging. The original preservation manifest is
ignored local `.wp748r07-before.log`; the delivered audit records its checks.
Ordinary Git LF/CRLF notices are not application changes. Text logs are normalized
to UTF-8/LF without changing results.

## Historical or supplied evidence - not newly executed here

- WP7.4.4b: **37 independent vectors / 358 assertions**, numeric/Unicode/raw
  negatives and Node/.NET comparison; 27 fresh capacity measurements plus nine
  warmups/nine boundaries. Its simplified Node sample/C# parser limitations still
  apply. No canonicalizer/capacity probe was rerun or treated as complete codec
  validation here. The historical 100-task/20-cycle example is 11,676,450 canonical
  bytes, beyond 10 MiB; it is not a measured current browser limit.
- WP7.4.5 reference conformance and WP7.4.6 fixed-fixture consumer characterization
  informed the assessment. Existing Vitest cases rerun within the 858 count;
  this adds no physical-provider or complete-export evidence. Conditional matches
  and deliberate gap assertions are not normal-consumer semantic parity.
- Earlier WP7.1/2/3/3.2/3.3 screenshots, usability observations and performance
  measurements remain historical. No new student study, owner laptop, touch,
  screen-reader, Firefox/WebKit, cloud/provider, power-loss or semester-lifetime
  qualification was performed.
- Gavin Osborne's b acceptance and recovery-feedback closure are **supplied owner
  evidence** from the current requirement. They were recorded, not independently
  invented or extended into R07/overall WP7 acceptance.

## Preservation and publication boundary

Only documentation/evidence is committed to `feature/wp7-stabilization`.
The protected reference values checked before publication are:

| Ref | Value |
| --- | --- |
| main | `a6a1c32c22a2bf074b161e52d523443602843dd7` |
| v1.0-pre-progress object / peeled | `a4157bc84392c770c27111da58d779948b110a56` / `abb85011dafc9fb0876953e3132880e025ef65da` |
| v1.1-pre-stabilization object / peeled | `134305f2205eb993ab76672c2d2469d48d91a609` / `af96d3b257ddfdcbc7f26a968401d634d210aef6` |

The delivery response supplies the published commit and post-push verification;
this document does not fabricate its own future commit hash. No main/tag update,
real project save/migration, report generation, release or deployment occurs.
Final R07 and overall WP7 decisions remain pending owner review.
