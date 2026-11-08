# Approved contract and independent answer traceability

Authority is in [README](README.md). Exact input/answer references are
[P01 C01-C12](../wp7-4-1/P01-CALCULATED-COMMITMENT.md),
[P12 pure interface](../wp7-4-1/P12-CONSUMER-CONTRACT.md) and
[E13-E18](../wp7-4-1/ACCEPTANCE-TEST-MATRIX.md). No earlier acceptance sheet
or application consumer was changed.

## Sources under test

- [workingPlan.ts](../../../src/planning/workingPlan.ts): pure exported types,
  explicit-input validation, topological evaluation and project qualification.
- [workingPlan.test.ts](../../../src/planning/workingPlan.test.ts): independent
  literal assertions, frozen caller structures and range/graph-size boundaries.
- [cases.ts](../../../src/planning/__fixtures__/cases.ts): hand-entered current
  working plans and a literal answer table; existing status validator builds
  fictional valid history. No answer is produced by the new evaluator.
- [benchmark.ts fixture](../../../src/planning/__fixtures__/benchmark.ts): existing
  WP1 supplies only old plans for sparse/diamond/chain size fixtures. The
  independently counted30/40-chain dates are asserted separately in unit tests.
- [benchmark runner](diagnostics/benchmark.mjs): six measured Node cases,
  unchanged-input assertions and environment/quantile evidence.

## Literal examples

| Contract case | Exact independent expected result / test |
| --- | --- |
| C01 | Input floorNov9 / actual releaseNov10 gives B10 H1-afterH4. Additional required condition: retained floor9 plus second actual predecessor release12 gives B12 H1-afterH4; only the second predecessor binds. |
| C02 | Planned predecessor9 afterH2 releases9 H3; B9 H3-afterH4. |
| C03 | Old B9 H3-afterH4, floorH1, pred releaseH2; Keep holdH3 controls. |
| C04 | Same source, explicit null hold: B9 H2-afterH3, retained dependency. |
| C05 | Actual A release9 H1 plus planned P release9 H3; J9 H3-afterH4. |
| C06 | Two actual6 releases9 tie; J9 H1-afterH4 with both IDs. |
| C07 | A actual6/ref2 unchanged; B9, C10, project10; four historical calendar days retained, no summed task movement. |
| C08 | Keep B16 by default; explicit floor12/null hold gives B12; unreviewed child stays17. |
| C09 | P planned finish13 controls B16; P In Progress makes B Unknown and requiredReviewIds includes P. Clarified future P window is documented in README. |
| C10 | Proposed12 on review16 rejects PAST_PLANNED_FLOOR; Keep16 valid. Separately supplied Actual Start12/In Progress still has Unknown finish. |
| C11 | Floor16 remains availability even with null hold; no inference from team capacity. |
| C12 | M/Th/F: requestedTue3 separately retained, normalized floorThu5; actualMon2 releasesThu5, B5. |

The first17 literal assertions include multiple outputs/variants for C07/C08
and E13/E14. C10 and Unknown variants are additional named tests, not converted
into fake Known rows just to fit that table.

## Acceptance-matrix E cases

| ID | Test evidence |
| --- | --- |
| E13 | A4->B4/C4->D4: B9/C9/D10; canonical A,B,C,D order; one D with tied B/C planned bounds. |
| E14 | Independent completed roots both6, J9; reversed task/edge/map order leaves canonical output unchanged. |
| E15 | Past unaffected P promise retained at2, J Unknown, P appears once in required review. |
| E16 | In Progress/Blocked/reopened, person-hours0 or4 outside API: all required finishes Unknown; resolved/corrected/retracted start read facts also provide no remaining duration. |
| E17 | Self/missing/duplicate/cycle errors and unsupported overflow return structured failure with no partial candidate or source mutation. |
| E18 | Active completion9 at review6 remains recorded but not observed; both dependent/project Unknown, no false release10. |

## Cross-cutting invariants and scope

| Requirement | Assertions / implementation boundary |
| --- | --- |
| Exact floors, holds and every edge | Literal dates/hours/afterHours and binding arrays; active root manual versus inactive retained dependent manual; new task requires explicit affected/null hold. |
| Date-only actual release | Fri6/Sat7 -> Mon9, old event date never snapped; no actual finish boundary. Date-only actual tying latest planned date leaves project finish hour null. |
| History and contradictions | Current latest recorded completion may correct effective date backwards; reopened history never releases. Actual start bypass and completion order conflict preserved; global project Unknown, known local conditional dates remain qualified. Same-date order is not called a conflict. |
| Source immutability | Recursive freeze of objects/arrays plus throwing Map mutators; before/after snapshots include baseline, events, current promises, tasks and effort. Unfrozen caller/output-alias check proves no caller freeze or mutable alias leak. |
| Determinism | Task/edge/map/affected-list permutations give the same canonical valid result; progress decoder receives sorted task IDs without changing event order. |
| Calendar edits and range | Old promise validates against its own calendar; candidate hours/calendar produce independently expected new finish. Years0001/9999, valid last-date leaves and required next-year overflow handled distinctly. Completed successors do not demand unnecessary planned release. |
| No accidental path enumeration | Topological node/edge traversal;300-node repeated diamonds and1200-chain complete with unique IDs/known rows. Source graph utility retains its existing complexity; no new graph API. |
| Application exclusion | Static consumer search, protected-path diff and identical build asset names; production invocation count0. Only new module/tests/fixtures plus this QA package added. |

Durable completion-context capture, file codecs, Actual Start replay/persistence,
atomic apply, task editing and chart activation remain excluded. Tests of
existing saved status snapshots prove preservation, not a new context writer.
No dates were generated by the implementation and then adopted as expected
answers. Failures and measured limits are recorded in [VERIFICATION](VERIFICATION.md).
