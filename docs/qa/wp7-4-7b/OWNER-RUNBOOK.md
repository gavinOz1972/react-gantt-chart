# WP7.4.7b — short owner retest

WP7.4.7a acceptance and its two finding closures are recorded in
[OWNER-DISPOSITION](../wp7-4-7a/OWNER-DISPOSITION.md). This checklist is for the
WP7.4.7b follow-up. Gavin Osborne's November 11, 2026 acceptance is now recorded
in [ACCEPTANCE](ACCEPTANCE.md) from the explicit WP7.4.8-R07 handoff. The original
retest instructions and evidence below are retained.

Use your existing feature-enabled development server, or start a free test port:

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
$env:VITE_SELECTED_TASK_HISTORY = 'true'
npm.cmd run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

Open `http://127.0.0.1:5176/docs/qa/wp7-4-7/qa/index.html` for synthetic cases.
No saved projects are read or changed there. The environment flag is read at
server startup; save work before restarting an occupied server. It remains off
by default, and production builds retain the original path.

1. Partial → Show history: **History Audit Data** should be collapsed. Open it
   with keyboard and confirm source/version, IDs, exact dates, coverage and
   attestation information remain. **More about this change** behaves as before.
2. Try invalid and oversized. Click **Retry reading history**. The error may
   remain, but a visible **Retry attempt 1 finished** message confirms the attempt
   and states that the same history problem is still present. Click again:
   attempt 2 should appear. Invalid data is not repaired and no records are invented.
3. Try expired and mixed. **Refresh history** should similarly show a numbered
   completed attempt with the persistent problem. These synthetic cases are
   deliberately unsuccessful; a stable primary is not evidence of no read.
4. Use delayed → Show history; wait for rows, then Simulate source change.
   Focus Refresh history and press Enter rapidly twice. It should show reading,
   retain focus, and finish as one admitted attempt with success. Extra input
   during the pending read is ignored, not queued.
5. Refresh the delayed source again and change selected task quickly to T2.
   Old task records/feedback must not leak into T2. Hide/reveal resets feedback.
6. In a normal saved project, show/paginate/hide and test a draft. Confirm status,
   remaining effort, baseline/work/forecast, draft and Saved locally are unchanged.

Unsetting `VITE_SELECTED_TASK_HISTORY` and restarting returns to the original
display; no project migration or data rollback is needed. Different ports have
separate browser libraries, so import an explicit JSON copy for real-plan testing.

- [x] History Audit Data label, contents and collapsed/keyboard behavior accepted.
- [x] Retry/refresh attempt and repeated-failure feedback accepted.
- [x] Rapid input and task switching accepted; cancellation safeguards retained.
- [x] Owner project-data regression check passed.
- [x] WP7.4.7b owner accepted within this bounded scope.

Owner/date: Gavin Osborne / November 11, 2026, as supplied in WP7.4.8-R07.
This closeout does not accept R07 or an overall WP7 release.

R07 remains pending. The low-priority More about this change observation remains
deferred. Do not infer storage/provider, migration, portable export, snapshots,
reporting or WP7.4.8 authorization from this follow-up.
