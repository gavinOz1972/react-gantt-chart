# WP7.4.7 verification

Starting commit `678013e5ac57ba2efec5775ea1a780c5198d3932`, branch
`feature/wp7-stabilization`. Client date 2026-11-10, America/Regina.

| Check | Result / evidence |
| --- | --- |
| Focused reader/UI characterization | **36 passed**, 2 files; [log](evidence/focused.txt) |
| Complete unit/component suite | **833 passed**, 41 files; [check log](evidence/check.txt) |
| Lint, application typecheck, build | Passed via `npm.cmd run check` |
| QA harness/config/browser typecheck | Passed via `node node_modules/typescript/bin/tsc -b docs/qa/wp7-4-7/tsconfig.json --pretty false` |
| New feature-on Chromium suite | **19 passed**; [log](evidence/history-browser.txt), [final status](evidence/history-last-run.json) |
| Existing default-off Chromium suite | **223 passed**; [log](evidence/browser-regression.txt), [final status](evidence/regression-last-run.json) |
| Default/production HTML parity | Two new cases compare full current selected panel markup with independently captured [original HTML](evidence/original-panel.html); [provenance](evidence/original-panel-provenance.json) |
| Scope, owner preservation, source/assets | [Scope audit](evidence/scope-audit.json) and [audit script](scripts/audit.mjs) |

## Independent original output and isolation

The original full TaskStatusPanel HTML was captured from an isolated Git archive
of 678013e, with only the synthetic fixture producer added. The new reader/UI was
absent there. React server rendering used the same deterministic props and
installed dependencies; current default-OFF and DEV-false markup must match
exactly. The golden is not generated from the new renderer.

Original baseline and candidate source copies live under
`output/wp7-4-7-verification/`. Browser runs use the candidate copy, with its own
servers 4173 (existing suite) and 4175 (feature ON). Dependencies are shared by
junction. This prevents the existing suite from overwriting the owner's edited
screenshots/JSON. No real browser profile or plan is used: fixtures and browser
contexts are synthetic, and saved-source checks use each test's isolated storage.

Before/after audit checks all existing source against the starting commit,
allowing only App's read-context prop and the bounded TaskStatusPanel history
branch/extraction. Scheduling, forecast, status model/decoder/PA, CPM, work,
baseline, storage/codec, repository ports/reference implementations, dependency
and root configuration files remain unchanged. All 85 pre-existing actual local
edits retain their initial byte hashes and are excluded from commits.

New source is limited to the typed history reader/flag, two history renderers,
scoped CSS, two focused test files and synthetic fixture. App adds one
read-context prop; TaskStatusPanel gates the new renderer and preserves existing
editing callbacks/draft state. No generic operational repository integration is
introduced. Exact changed paths/imports and baseline/current build hashes are
recorded in the audit. Build assets change for this authorized UI addition;
default panel DOM and project outputs retain independent byte comparisons.

Protected local/remote main and both tags are checked before/after publication:
main `a6a1c32c22a2bf074b161e52d523443602843dd7`; v1.0-pre-progress object
`a4157bc84392c770c27111da58d779948b110a56`, peeled
`abb85011dafc9fb0876953e3132880e025ef65da`; v1.1-pre-stabilization object
`134305f2205eb993ab76672c2d2469d48d91a609`, peeled
`af96d3b257ddfdcbc7f26a968401d634d210aef6`. Only the feature branch is published.

## UI and error evidence

Automated tests cover zero reads while collapsed, keyboard/focus/disclosure,
complete/reopened/blocked meanings, 43-row selected pagination and timestamp
ties, raw text escaping and attestations, count/byte limits, detached returned
rows, session/cursor binding, expiry/cancellation, source-change refresh and late
reply suppression. A genuine valid legacy attestation above 128 KiB is refused
without truncation. Failure fallback is permitted only after validated opening;
invalid or mixed data never receives unsafe fallback.

App browser cases preserve an in-progress criterion draft and chart scroll,
current reopened status and selected row. Formats 1–5 open/save/reload/export
checks compare exact content (excluding explicit export savedAt), unchanged
saved local source bytes while viewing, original baseline/work/forecast inputs
and Saved locally state. The new reader has no access to mutation/undo commands;
the App has no separate undo-store integration to convert.

Screenshots at [780](evidence/history-780.png), [1280](evidence/history-1280.png)
and [1440](evidence/history-1440.png) show the actual 40-task App. Automated checks
find no horizontal document overflow and keep Duplicate visible. Visual review
checks wrapping, historical/current distinction, labels and controls; no human
owner acceptance is claimed. New row labels explicitly override a pale global
definition-term colour for readable contrast on the white task panel.

## Diagnostics and limits

Initial focused runtime checks passed; TypeScript then caught an invalid test
locator option, unused test import and a narrowed unknown property used in a
closure. These were corrected. QA-only typechecking explicitly includes the
already-installed Node types. Initial browser run: 8 passed / 11 failed because its
focus locator used the pre-toggle name and exact QA label lookup included option
text. Corrected locator and explicit accessible QA labels resolved all 19.
This did not require status, scheduling, forecast or persistence changes.
Final QA review also aligned the fallback fixture with each scenario's exact
source; Unavailable now falls back to an empty loaded history and Oversized to
the same full 300-criterion attestation. Browser assertions verify both cases.
Final lint/typecheck/build had no reported warnings. Git emitted ordinary
LF-to-CRLF checkout notices for new source files; no existing files were
renormalized or reset.

Legacy data remains fully resident; selected validation scans references and
keeps validation metadata. No production lazy I/O or total memory reduction is
claimed. Coverage remains Partial; partial file imports are not a new supported
format. Source positions are local to the pinned array, not portable event IDs.
No storage provider, generic payload activation, `/2` export/JCS, snapshots,
migration, retired-task lifecycle or report/PDF is implemented. R07 and owner UI
acceptance remain pending. Delivery reports the full feature commit SHA.
