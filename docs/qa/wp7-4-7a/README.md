# WP7.4.7a — history UX refinement

Implemented from `07faed745d66502033ab7a60ac9dfc612512fe8f` on
`feature/wp7-stabilization`, client date 2026-11-10 (America/Regina).
Authority: owner request and `Bugsys_WP7_4_7a_History_UX_Refinement.docx`,
SHA-256 `f5975123363ccfa5d9af0d79ca844c5017649c7e77118058534d0da831692ee9`.

Task history now shows a short change summary, readable effective date and
recorded reason. **More about this change** reveals context and historical
completion evidence. **History details** holds technical provenance and exact
retained records. Both disclosures start collapsed.

Empty and unavailable have distinct primary messages:

- **No recorded history for this task.** — available source, zero matching rows.
- **History unavailable.** — no accessible retained history in this source.
- Available Partial evidence carries one visible **Some earlier history may be
  unavailable** note; detailed coverage remains accessible deeper.

The original typed reader already distinguished these states. The correction
prioritizes availability before empty/Partial presentation and removes the
competing primary coverage banner. [Before/after evidence](QA-REGRESSION.md)
includes the original source-state matrix and unavailable T1/T2/T3 checks.

The default-off development flag, initial collapse, 20-row/128-KiB delivery
limits, source consistency, cancellation, fallback eligibility and read-only
boundary are preserved. No reader/port, App, scheduling/forecast/status model,
baseline, work, persistence or formats 1–5 changes were made.

## Review and test

Read [UX decisions](UX-DECISIONS.md), the
[owner-stated conditional disposition](OWNER-DISPOSITION.md),
[regression evidence](QA-REGRESSION.md), [verification](VERIFICATION.md) and
[owner runbook](OWNER-RUNBOOK.md). The
[Bugsys UX Advisor charter](../../ux/BUGSYS-UX-ADVISOR.md) defines a review
function, not an autonomous agent or permission for further implementation.

Verified: **845 unit/component tests in 42 files**, including **48 focused
history checks**; **31 feature-on browser checks** and **223 default-off
regressions**. Four separate checks captured the original pre-correction UI.
Lint, application/QA typechecks and build passed.

Use the unchanged development flag `VITE_SELECTED_TASK_HISTORY=true`, select a
task, then Show history. Production builds retain the original history path.
See the runbook for exact startup and synthetic QA instructions.

**Owner acceptance is pending.** UX7.4.7-001 and QA7.4.7-002 remain open for
follow-up human review; the conditional WP7.4.7 disposition is recorded without
checking the earlier acceptance box. R07 remains pending final review. No next
package, storage/provider, migration, portable export, report/PDF, retirement
UI or snapshots are authorized or started by this correction.
