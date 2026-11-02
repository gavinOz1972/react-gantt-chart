# WP7.1 — end-to-end functional verification

WP7.0 was owner-accepted before QA began. Verification was performed on
`feature/wp7-stabilization`, based on protected candidate
`af96d3b257ddfdcbc7f26a968401d634d210aef6`, in the isolated
`C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization` worktree.

- [Assessment, E01–E14 coverage, environment and command results](qa/wp7-1/ASSESSMENT.md)
- [28-minute owner runbook](qa/wp7-1/OWNER-RUNBOOK.md)
- [Findings and owner triage](qa/wp7-1/FINDINGS.md)
- [30/40-task fixture inputs and independent expected anchors](../tests/fixtures/wp71/README.md)

Final validation: **411 unit/component tests (32 files), 131 browser tests**,
lint, typecheck and build pass. Three additional isolated performance passes
completed without freeze. The initial browser failures were a documented
date-sensitive test setup, corrected only in test code. No product source,
formulas, persistence formats or dependencies changed.

The owner session and WP7.1 assessment acceptance remain pending. Product
fixes, student usability sessions and release work have not begun. Main,
the owner's original checkout and protected release tags remain unchanged.
