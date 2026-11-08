# WP7.4.2 - Pure calculated commitment evaluator

Implemented on `feature/wp7-stabilization`, initially clean at
`b9e258ddcb0c96e4ec96620f533247e6c9104049`. Review date: 2026-11-07,
America/Regina; UTC evidence can be dated Nov8.

Authority: owner request and
`react-gantt-chart/docs/WP_Req/Bugsys_WP7_4_2_Pure_Calculated_Commitment_Evaluator.docx`,
SHA-256 `de6863afdc0a7df5936391a21450a4e2ea143b958ae596f4a776013316f1716f`.
It accepts WP7.4.1 as a design handoff and approves P01-C/P12-E for this unused
pure module only. Historical decision sheets stay unchanged; the later saved
requirement supplies this bounded authority.

## Result and boundaries

[`evaluateWorkingCandidate`](../../../src/planning/workingPlan.ts) takes explicit
source tasks/calendar, decoded four-state progress, resolved Actual Start read
facts, current working read model, proposed floors, explicit holds, affected
IDs and review date. It returns canonical proposals or structured validation
issues, with tied binding causes, prerequisite review IDs, historical conflicts
and a separately qualified project result.

- Not-before is a lower bound. An exact Keep hold stays separate; H3 never
  becomes H1 merely because a date input normalized to H1.
- Every retained predecessor participates. Active non-future actual completion
  releases strictly on the next working day; planned finish releases at its
  exact next slot only if unfinished dependent work needs it.
- Started, Blocked, reopened and future-effective paths remain Unknown where
  duration/readiness is missing. Actual facts remain date-only; contradictory
  history is preserved with explicit global uncertainty. Locally calculable
  dates do not certify a conflicted project.
- Unaffected promises stay Retained, with feasibility issues/prerequisite
  review when overdue/unsupported. Explicit Advance can omit a hold and propose
  a different floor; it does not silently accelerate an unreviewed child.
- No clock, storage, React, baseline writes, effort deduction, graph mutation,
  status command, attestation or revision commit. No actual-start event decoder
  or new file schema is introduced.

There are **zero production consumer imports**. App/UI, WP1, PA1, FF, CPM,
baseline/progress models, codecs, file formats, packages/configuration and
real project data are unchanged. The app bundle retains the same generated
JS/CSS asset names. The new evaluator is intentionally invisible at localhost.

## Tests and contract clarifications

The [test suite](../../../src/planning/workingPlan.test.ts) covers all literal
C01-C12 and E13-E18 answers, including both C01 conditions (floor9/release10
and floor9/second release12), joins/ties, early keep/advance, exact holds,
Unknown/conflicts, source immutability, permutations and date-range limits.
Additional size guards include300-node diamonds and a1200-node chain.

Three implementation clarifications, not changes to approved dates:

1. C12's requested nonworking TueNov3 is represented by the already-normalized
   ThuNov5 `WorkingSlot` required by P12. The test keeps the raw requested date
   separately and proves normalization with the existing calendar. Invalid
   nonworking slots supplied directly to the evaluator reject.
2. C09 specifies P's finishNov13 but not its start/duration. Its known future
   plan is instantiated as8 slots Nov12-13 so it satisfies P12's requirement
   not to assume an overdue Not Started predecessor already worked. Its
   In Progress variant is explicitly Unknown. No supplied expected date changes.
3. Optional `Bound.source` distinguishes an independent-root manual bound
   from the explicit task not-before floor. Approved bound kinds and precision
   remain unchanged; it is read-only explanatory metadata in this new module.

No production-wide API change or unresolved fixture contradiction was needed.
See [TRACEABILITY](TRACEABILITY.md), [VERIFICATION](VERIFICATION.md),
[OWNER-RUNBOOK](OWNER-RUNBOOK.md) and [ACCEPTANCE](ACCEPTANCE.md).

WP7.4.2 owner acceptance is Pending. Main/protected tags are unchanged.
Acceptance does not activate the evaluator or authorize P09 storage, P11
lifecycle, P12 integration, P10 Gantt, rebaseline, deployment or WP8.
