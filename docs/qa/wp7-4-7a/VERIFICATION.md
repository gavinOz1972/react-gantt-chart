# Verification and scope

Base `07faed745d66502033ab7a60ac9dfc612512fe8f`, branch
`feature/wp7-stabilization`, client date 2026-11-10 (America/Regina).

| Check | Observed result |
| --- | --- |
| Focused history adapter/UI tests | **48 passed**, 3 files, including 12 new UX cases; [log](evidence/focused.txt) |
| Full unit/component suite | **845 passed**, 42 files; [log](evidence/check.txt) |
| Lint, application typecheck, production build | Passed via `npm.cmd run check` |
| QA/config/browser typecheck | Passed via `node node_modules/typescript/bin/tsc -b docs/qa/wp7-4-7a/tsconfig.json --pretty false` |
| Feature-on browser | **31 passed**: 19 existing functional  + 12 UX; [log](evidence/feature-browser.txt) |
| Default-off browser | **223 passed**; [log](evidence/baseline-browser.txt) |
| Independent pre-correction capture | **4 passed** against original archived source; [log](evidence/before-browser.txt) |
| Scope, imports/source, owner hashes, refs/assets | [Audit](evidence/scope-audit.json), [script](scripts/audit.mjs) |

The original before archive and corrected candidate are separate source copies
under `output/wp7-4-7a-verification`. Browser servers run there on 4175 (feature)
and 4173 (default-off); installed dependencies are shared by junction. Existing
browser suites write old QA evidence, so isolation prevents overwriting the
owner's edited screenshots/JSON. Only newly owned evidence is copied into this
package. No real browser profile or project library was opened.

The four before checks are reference capture, not additional final-candidate
regressions. Owner test notes in the requirement are separately attributed in
OWNER-DISPOSITION and are not counted as new automated or human acceptance.

## Evidence and preservation

The typed pre-correction matrix and screenshots reproduce the reported
Unavailable/empty presentation issue. [QA-REGRESSION](QA-REGRESSION.md) explains
why no adapter/model correction was required. New direct tests verify each
primary/action and collapsed diagnostic independently. Browser tests verify
T1/T2/T3 mapping, friendly date, CST local recording and exact UTC provenance,
escaping, native keyboard disclosures and the actual 40-task panel at 780/1280/1440px.

Existing functional tests continue to verify 43-row pagination/order, source and
task switching, cancellation, pinning, safe fallback, unfinished criterion draft,
saved local source bytes, formats 1–5 save/reload/export, baseline/work/remaining/
forecast inputs and default-off full-panel HTML equality with the independent
original golden. No new semantic or full-history completeness claim is made.

Application changes are confined to `SelectedTaskHistory.tsx` and its scoped
CSS: presentation helpers/disclosures/copy, plus retaining already-read session
and last-page metadata for truthful error details/Partial qualification. Reader
calls, budgets, cancellation and fallback eligibility are unchanged. App,
TaskStatusPanel, the legacy rollback renderer, feature flag, adapter, status
model/decoder, all calculation engines, full repository S/ports, original
baseline, work, storage/codecs, formats 1–5 and dependencies/root config are unchanged.

Other code changes are focused UI tests and the existing feature browser tests
updated for the authorized labels/disclosures and scoped screenshot destination.
New files are the UX unit tests, charter and this bounded QA package. Earlier
evidence/acceptance sheets are preserved. All 85 pre-existing actual local edits
retain their before hashes and are excluded from commits. Git may additionally
list CRLF/stat-only older files; none was reset or staged.

The audit compares all prior source except the authorized UI/test paths to the
base, checks no unrelated tracked/untracked change, validates documentation links
and records exact before/current asset hashes. Build assets change for this UI
refinement; default-OFF panel DOM and project contents retain exact comparisons.
R07 is not marked final and neither correction finding is marked closed.

Protected reference values checked before/after publication:

- main: `a6a1c32c22a2bf074b161e52d523443602843dd7`.
- v1.0-pre-progress object: `a4157bc84392c770c27111da58d779948b110a56`;
  peeled: `abb85011dafc9fb0876953e3132880e025ef65da`.
- v1.1-pre-stabilization object: `134305f2205eb993ab76672c2d2469d48d91a609`;
  peeled: `af96d3b257ddfdcbc7f26a968401d634d210aef6`.

## Diagnostics and remaining limits

The initial focused run had 3 failures: two expected-message replacements passed
through a Windows stdin encoding path had substituted a question mark for the
em dash, and one local-time query matched hidden sibling disclosures. The source
UI copy was correct. Corrected test literals/scoped query produced 48 passes.
No reader, historical-semantic, forecast or persistence correction was needed.
Final visual review corrected inherited pale/oversized definition-list styling
inside optional History details. The scoped CSS was rebuilt and the 31 feature
browser checks/screenshots rerun. No logic or source-data changes were needed.
Final lint/typechecks/build reported no warnings; Git emitted ordinary
LF-to-CRLF checkout notices for edited/new source files, without renormalizing
or resetting existing edits.

The legacy source remains fully in memory. There is no new provider, lazy-I/O or
memory saving claim, schema migration, portable `/2` export/JCS, retired-task
lifecycle, reporting/PDF or FR-HIST-01 snapshot implementation. Final automated
checks and visual evidence do not substitute for owner UI acceptance. Stop for
the explicit unavailable-versus-empty human check and both finding dispositions.
