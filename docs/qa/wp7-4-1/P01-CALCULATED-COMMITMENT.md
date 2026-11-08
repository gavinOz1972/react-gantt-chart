# P01 - A floor is not the calculated commitment

**Established intent:** P01-P08 are conditionally approved; the first baseline
is immutable and only confirmed working promises change. **New mechanism
proposed:** explicit candidate floors plus a keep-current-start hold, evaluated
against every retained predecessor. This resolves an ambiguity in
[WP7.4 P01](../wp7-4/POLICY-PROPOSALS.md), not permission to implement it here.

## Exact meanings and calculation contract

- `notBefore` is a lower bound in **planned numbered working slots**. A chosen
  date normalizes to H1 on/after it, with requested/normalized values shown.
  It does not claim the task actually started then.
- `currentCommitment` is the last explicitly reviewed planned start/finish,
  with revision ID. It is stored decision state, not a live PA value.
- `keepHold` is that exact current planned start when keeping a promise.
  It prevents silent early movement, including preservation of H3. It is
  separate from the user's lower bound; do not replace a stated H1 floor
  with H3 merely because a predecessor made the computed start H3.
- `candidateStart` for supported ordinary Not Started work is the maximum
  of project release, candidate not-before, applicable existing root release,
  review-date H1 (only affected/new proposals), optional keepHold, and **all**
  retained predecessor releases. Compare exact planned slot indexes.
- `candidateFinish` occupies the task's full positive scheduled duration from
  that computed start, using the existing calendar. Slot duration is not
  remaining person-hours. Planned finish is an exclusive afterHour boundary.

A completed predecessor with active non-future evidence releases at the first
working slot strictly after its actual calendar date. An ordinary Not Started
predecessor with a supported calculated finish releases at its next planned
slot. Required Unknown makes the new successor commitment Unknown; a lower
bound is still not a valid-looking scheduled start. Actual Start does not
make a started/blocked/reopened finish calculable.

The pure evaluator receives explicit proposed floors and hold policies; it
does not decide whether to sever, advance, accept a fact or lower availability.
An early Advance deliberately omits the old hold and explicitly proposes any
floor replacement, with a before/after preview. A seeded dependency-derived
floor can be replaced only by that confirmed choice. A genuine availability
floor stays binding unless the student separately revises it with a reason.
Alternative: encode hold and floor as one constraint; rejected recommendation
because it would hide whether a promise or availability prevented the advance.

## Independently worked November2026 examples

Calendar M-F, four scheduled slots/day. Actual dates have no hour. `afterH4`
means end of the last planned slot, not a measured finish time. Review dates
are hypothetical contexts for these examples, independent of today's date.

| ID / inputs | Maximum bounds and exact expected result | Confirmed difference |
| --- | --- | --- |
| C01 Lower floor than actual release: T1 actual Mon9; T2 duration4, notBefore Mon9 H1; review9. | T1 conservative release Tue10 H1 dominates floor9. T2 **10 H1-afterH4**. | Show floor9 **and computed10**. Accepting floor9 alone is not accepting a Mon9 start. |
| C02 Intraday planned predecessor: P known9 H1-afterH2; T2 duration2, floor9 H1; review9. | P releases9 H3, later than floor/review H1. T2 **9 H3-afterH4**. | Do not coerce result to H1 or add a whole day to a known planned boundary. |
| C03 Preserve H3: current T2=9 H3-afterH4, floor9 H1; P now releases9 H2; duration2; Keep. | keepHold9 H3 dominates P's H2. T2 remains **9 H3-afterH4**. | Exact current slot retained; no silent H2 advance. |
| C04 Explicit intraday advance: same as C03, student chooses Advance; floor remains9 H1 and hold is expressly omitted. | P release9 H2 dominates floorH1. T2 **9 H2-afterH3**. | Show H3->H2 and finish afterH4->afterH3; retain edge. |
| C05 Join: A actual6 releases9 H1; B planned9 afterH2 releases9 H3; J duration2, floor9 H1; review6. | Both retained constraints participate; B controls9 H3. J **9 H3-afterH4**. | Do not choose A just because it triggered review. |
| C06 Tied join: A/B both actual6, J duration4, floor6 H1; review6. | Both release9 H1, J **9 H1-afterH4**; two binding causes. | One join row, not two applied delays. |
| C07 Late chain: A actual6/ref2; B4 current3, C4 current4 after B; review6, Keep edges. | B **9 H1-afterH4**; C **10 H1-afterH4**. | Confirm both computed promises, preserve historical A late +4 calendar days. |
| C08 Early: A planned finish13, actual11; B4 current16; review11. | Default Keep retains16. Explicit Advance with proposed floor12 and no hold gives **12 H1-afterH4** if other bounds allow. | Replacing old seed floor16 is explicit. B's child stays at its old promise until separately reviewed. |
| C09 Another predecessor: C08 plus P still plans to finish13. | P releases16, so B **16 H1-afterH4**, even with proposed floor12. P Unknown instead makes B Unknown. | Cannot offer12 as feasible by ignoring P; no definite bar for Unknown. |
| C10 Past earliest: C08 meeting16, earliest12 already past. | Reject new Planned12. Attested Actual Start12 is a separate fact/status choice and yields no invented finish. Otherwise keep16 or choose later. | Do not turn feasible history into an unreported actual. |
| C11 Availability: C08 but confirmed task floor16 reflects student availability. | Keep that bound: B16. Only an explicit revision of the availability permits another result. | FF class/homework/team capacity is not availability evidence. |
| C12 Gaps: M/Th/F, actual Mon2; B4 floorTue3; review2. | Requested floor3 normalizes Thu5 H1; actual release also5. B **5 H1-afterH4**. | Preserve actualMon2 and requestedTue3 as labelled dates; no Tue working slot. |

These are paper answers for [future acceptance tests](ACCEPTANCE-TEST-MATRIX.md).
The current calendar utilities support the arithmetic; no proposed evaluator
has been built here. The [existing diagnostic](../wp7-4/diagnostics/calendar-anchors.mjs)
checks a subset of calendar anchors, not these policy combinations.

## Precision, confirmation and risk

For each affected row show old reviewed start/finish, original baseline
reference, requested/normalized floor, hold if retained, all readiness bounds,
computed start/finish or Unknown, and downstream/project result. Confirm the
calculated result and constraints together. Do not relabel elapsed variance
as additional effort or sum task movements into project delay.

The review-date floor is not a daily auto-rescheduler. Unaffected promises
stay as stored; unsupported old promises remain references needing review.
Pure calculation emits a candidate only. Publication and every project/task/
graph/calendar edit require the [P12 gate](P12-CONSUMER-CONTRACT.md).

An unchanged historical lower bound may remain below today's review date;
it is not a newly promised past start. Newly entered/replaced planned dates
must satisfy the review-date/project-start restriction before normalization,
and their computed start must satisfy every bound. A floor edit cannot be
used to bypass the no-backdating rule merely because another bound is later.

Implementation risk: conflating floors, holds and calculated results would
make early review ineffective or secretly alter H3 promises. Owner confirmation
of this mechanism is required alongside the already agreed P01 intent.
