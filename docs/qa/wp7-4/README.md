# WP7.4 - Guided dependency review and Actual Start design

**Design completed for owner policy review; no proposed application behavior
is implemented.** Review date: 2026-11-07, America/Regina.

The owner requested WP7.4. Its saved requirement is
`react-gantt-chart/docs/WP_Req/Bugsys_WP7_4_Guided_Dependency_Review_Design.docx`
in the original checkout; SHA-256
`112eeff3985315df171a0b3de1e4dc62087f2f8fb4fa37c444d7f82cc9737cac`.
The requirement explicitly says "Do not implement the proposed behavior."
It authorizes analysis, proposed rules, scenarios, UI flow, compatibility
design, regression checks, commit and push on the stabilization branch.

Starting tree: clean `feature/wp7-stabilization` at
`a5a953e820615e2b1105f235f0060c5831e335bf` (WP7.3.3).
All WP7.3.1 design documents and the WP7.3.2/WP7.3.3 rationale, traceability,
verification, limitations, runbooks and acceptance sheets were reviewed.
Older documents describe their historical versions: the current source at
this SHA takes precedence for this audit. Prior acceptance sheets are unchanged.

## Read and decide

1. [Architecture audit](ARCHITECTURE-AUDIT.md): current behavior and incompatible assumptions.
2. [Policy proposals](POLICY-PROPOSALS.md): established rules versus new choices.
3. [Event and file contract](EVENT-AND-FILE-CONTRACT.md): proposed facts, revisions, migration and backups.
4. [Review workflow](REVIEW-WORKFLOW.md): atomic operation, deterministic queue and accessible UI.
5. [Scenario matrix](SCENARIO-MATRIX.md): independently specified outcomes for all 12 required scenarios.
6. [Implementation slices](IMPLEMENTATION-SLICES.md): later bounded work and acceptance boundaries.
7. [Owner decisions](OWNER-DECISIONS.md): independent approve/defer/reject choices, all Pending.
8. [Verification](VERIFICATION.md): exact commands, results, evidence and limits.

The recommendation is an explicit per-task planned not-before constraint,
separate date-only Actual Start history, and a single reviewed transaction.
This requires a later approved working-schedule evaluator and versioned file
contract. Reusing root-only manual dates or treating PA as a saved commitment
would not satisfy the requirement. Actual Start alone cannot supply remaining
scheduled duration for started work; those finishes remain Unknown.

## Scope and gate

Only this documentation/evidence package changes. The existing app, four
statuses, scheduling, PA/FF formulas, baseline/history, formats 1-5 and browser
storage are untouched. No new Actual Start field, workflow, migration,
rescheduler, default Gantt or production test change is included.

The first established baseline is immutable. Guided edits may revise future
working commitments only through an explicit consolidated confirmation.
Past dates are actual-history claims, never newly backdated plans. Actual
work logging stays optional and remaining effort is never deducted by time.

New choices are proposals, not owner approvals. WP7.1, WP7.3, WP7.3.2 and
WP7.3.3 owner acceptance remain independent and unrecorded here. WP7.4 design
acceptance also remains Pending. After this design commit/push, stop for a
separate owner-approved implementation package. No main merge, protected-tag
change, deployment or WP8 follows this handoff.
