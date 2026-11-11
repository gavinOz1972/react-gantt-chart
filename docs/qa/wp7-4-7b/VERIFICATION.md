# Verification — WP7.4.7b

Base `22bfd6a3afff6f78e977d9fde55405de9983cabd`, branch
`feature/wp7-stabilization`. Implementation client date 2026-11-11;
owner handoff/acceptance authority dated November 10, 2026.

| Check | Actual result |
| --- | --- |
| Independent original action diagnostics | 4 passed; [log](evidence/before-actions.txt), [observations](evidence/before-actions.json) |
| Focused reader/UI/action tests | 61 passed across 4 files; [log](evidence/focused.txt) |
| Full unit/component suite | 858 passed in 43 files, including 13 new lifecycle cases; [log](evidence/check.txt) |
| Lint, application typecheck, build | Passed through `npm.cmd run check` |
| QA/test helper/config/browser typecheck | Passed through `node node_modules/typescript/bin/tsc -b docs/qa/wp7-4-7b/tsconfig.json --pretty false` |
| Feature-on browser | 38 passed (31 previous + 7 new); [log](evidence/feature-browser.txt) |
| Default-off browser | 223 passed; [log](evidence/baseline-browser.txt) |
| Scope and owner preservation | [Audit](evidence/scope-audit.json), [script](scripts/audit.mjs) |

The four original diagnostics are separate reference observations, not extra
final-candidate checks. They prove fresh validation/open/page dispatch before
the correction. The 13 new component cases cover repeated failures, rapid input,
visible pending/completed status, focus, success, source/task switching, hide,
Unavailable, exceptions/cancellation, and the renamed disclosure. New browser
cases verify the corresponding human-visible action lifecycle and metadata.

All browser tests run in the isolated candidate under
`output/wp7-4-7b-verification`; the original diagnostic source is in its separate
before archive. Dependencies are shared by junction. Servers 4175/4173 are owned
by Playwright. Only synthetic data and isolated browser storage are used. Old
tests may write older artifact paths in that copy; those files are not copied
over the owner's evidence. Only new package evidence is delivered here.

Existing tests retain 43-row paging/tie order, failure safeguards, accurate
empty/Unavailable distinction, source pinning, cancellation, draft retention,
saved-source bytes, formats 1–5 round trips and baseline/work/forecast preservation.
The original default-off full-panel HTML golden still matches. App, reader/port,
models, calculations, history semantics, persistence/formats, dependencies and
feature flag remain unchanged. New feedback is ephemeral UI state.

Production edits are limited to the selected-history controller/caption and one
scoped busy-button style. Tests update the renamed caption and add lifecycle
checks. The previous owner disposition is explicitly updated under the supplied
authority; original evidence remains unchanged. The More about this change
function and styles match the accepted base, leaving the low-priority observation
deferred. Full changed-file/import/asset evidence is in the audit.

All 85 pre-existing actual local edits retain their initial byte hashes and remain
outside the commit. Main and protected tags are checked before/after publication:
main `a6a1c32c22a2bf074b161e52d523443602843dd7`; v1.0-pre-progress object
`a4157bc84392c770c27111da58d779948b110a56`, peeled
`abb85011dafc9fb0876953e3132880e025ef65da`; v1.1-pre-stabilization object
`134305f2205eb993ab76672c2d2469d48d91a609`, peeled
`af96d3b257ddfdcbc7f26a968401d634d210aef6`.

## Diagnostics and remaining review

Initial focused runtime tests passed; typecheck caught an unsupported test-locator
option, which was removed. Initial feature browser run: 36 passed / 2 failed. One
failure exposed real native focus loss from disabling the focused button; the
correction uses aria-disabled and a synchronous request guard. The other was a
newline mismatch in a test's innerText/textContent comparison. Final checks pass.

See [retry feedback](evidence/retry-feedback.png) and
[History Audit Data](evidence/history-audit-data.png). Screenshot review checks
copy, layout and retained audit information; it does not substitute for the
owner's acceptance of WP7.4.7b. Final lint/typecheck/build emitted no warnings;
ordinary Git LF/CRLF checkout notices do not indicate data changes.

WP7.4.7a and its two findings are owner accepted/closed; WP7.4.7b is not
self-accepted. R07 remains pending. No new provider, migration, portable export,
reporting, snapshot or WP7.4.8 work has been introduced.
