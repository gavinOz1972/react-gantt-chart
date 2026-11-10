# Owner UI acceptance — WP7.4.7

Automated evidence is complete; **human owner acceptance is pending**. All
owner decision boxes below deliberately start unchecked. No student usability
study or owner test is inferred from automated checks or screenshot inspection.

| Scenario | Automated evidence | Owner pass/fail / notes |
| --- | --- | --- |
| Default OFF and production path | Original full selected-panel HTML matches exactly; existing 223 browser regressions; dev flag true cannot activate a production build | [ ] Pass [ ] Fail ______ |
| Enabled but collapsed | Zero open/read calls until Show; obvious Show/Hide, aria-expanded/controls, focus retained; row loading/hide tested | [ ] Pass [ ] Fail ______ |
| Completion/reopen/block meaning | T1 historical completion and guidance still visible after reopen; current status stays In Progress; T2 remains Blocked; attestation IDs/wording retained | [ ] Pass [ ] Fail ______ |
| Dates and provenance | Effective date separate from UTC recorded time; native event ID/source position; actor/decision ID Unknown; equal timestamp ties keep source order | [ ] Pass [ ] Fail ______ |
| Safe user text | Literal HTML-like guidance, reason and note remains text; no image/script element created | [ ] Pass [ ] Fail ______ |
| Paging and source refresh | 43 T1 rows in 20/20/3 pages, true end; task switch drops delayed reply; concurrent source change requires explicit refresh | [ ] Pass [ ] Fail ______ |
| Qualifications/errors | Partial, empty and Unavailable distinguished; unsupported/invalid/expired/oversized/mixed/cancelled scenarios; safe fallback only when qualified | [ ] Pass [ ] Fail ______ |
| No editing/persistence effects | Draft preserved; no status/criteria/selection callback invoked; saved source bytes unchanged; formats 1–5 export comparison and save/reload; original B/work/forecast settings retained | [ ] Pass [ ] Fail ______ |
| Layout and access | 40-task App at 780/1280/1440px: no horizontal overflow, Duplicate remains visible; screenshots reviewed | [ ] Pass [ ] Fail ______ |
| Rollback | Removing dev flag restores original history path; pending reads release and no project fields are added | [ ] Pass [ ] Fail ______ |

Use [OWNER-RUNBOOK](OWNER-RUNBOOK.md) and the synthetic QA preview. Invalid and
failure scenarios belong there; do not corrupt a real project to test them.

Owner/date: ____________________

- [ ] WP7.4.7 UI accepted within the documented read-only development scope.
- [ ] Corrections requested: _____________________________________________
- [ ] Additional verification requested: _________________________________

R07 remains pending. This sheet does not authorize operational loading in
other consumers, storage/providers, retired-task lifecycle, portable export,
report/PDF UI, automatic replay, named snapshots or another work package.
