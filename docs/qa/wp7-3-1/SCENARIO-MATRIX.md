# Independently specified L01–L16 matrix

**Proposed outputs, not implemented behavior.** Every PA answer below assumes
the pending [rules](PROJECTION-RULES.md). The diagnostic
[`scenario-evidence.mjs`](../../../tests/wp731/scenario-evidence.mjs) checks
these supplied answers against current utilities; it does not generate an
arbitrary-project projection. [Machine-readable evidence](evidence/scenario-evidence.json)
contains exact task IDs, events, committed slots, committed CPM and supplied
candidates. All projects are fictional and separate.

## Input and arithmetic legend

Dates in this document are **November 2026**. `2` means `2026-11-02`, not
two elapsed days. Default project: start 2, target 20, working Monday–Friday,
**4 abstract working slots per day**. `3 H1–after H4` occupies all four slots
on Nov 3. `2 H1 → 4 after H4` occupies 12 working slots. These are scheduled
slots, not remaining person-hours or wall-clock start/end times.

`A4 → B4` specifies A's full scheduled duration 4, B's duration 4 and a
finish-to-start dependency. Unconnected roots start at project start unless
`manual 3` is stated. Unless noted, A=T1, B=T2, a third root P=T3, and J=T4
when there are four tasks; the two-root join case L06 has J=T3. Every
unmentioned current status is Not Started; no work logs are present. The
diagnostic seeds person-hour remaining independently to the numerical
duration (L14e uses 0); this does **not** authorize unit conversion. Forecast
settings are enabled with class28/home0/team1 and a fixed case As-of, giving
4 person-hours/day for L15. Baseline captures the stated committed plan.

`actual A=4 / ref2` means active Complete with effective date Nov 4 and saved
historical committed finish date Nov 2. Actual dates have **no hour**.
The diagnostic records decisions at `2026-11-10T12:00:00Z`; that later entry
time does not change the earlier effective completion. Zero criteria are
explicitly acknowledged. Ordering is event sequence, not max effective date.

Independent default-calendar relative boundaries:

| Date | 2 Mon | 3 Tue | 4 Wed | 5 Thu | 6 Fri | 9 Mon | 10 Tue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| H1 start index | 0 | 4 | 8 | 12 | 16 | 20 | 24 |
| after H4 finish index | 4 | 8 | 12 | 16 | 20 | 24 | 28 |

Thus a 4-slot B moved from `[4,8)` to `[12,16)` shifts 8 scheduled slots;
its finish date moves 3→5, two calendar days. Date-only A has no comparable
exact slot variance. For L12b's M/T/Th/F calendar, starts are 2→0, 3→4, 5→8,
6→12, 9→16. No Wednesday working slots exist.

**Invariants I1–I7 apply to every case**, including failures/Unknown:

1. Baseline and committed task dates, durations, graph and manual values stay unchanged.
2. Actual events, effective dates, stored estimates/logs and status history stay unchanged.
3. Effort forecast formulas/inputs and committed critical flags stay unchanged.
4. Known PA Not Started durations equal their full committed slot duration; no invented actual hour/start.
5. No fabricated date for an unknown required path; no automatic status, completion or reopening.
6. Same validated source, explicit As-of and approved rule version yield the same result, independent of input order.
7. Existing file contracts remain valid; derived PA endpoints are not saved into format5.

## L01 — On-time completion (D01, D02, D06)

Input: A4→B4; As-of2. Committed A=2 H1–after H4, B=3 H1–after H4,
project finish3. Actual A=2/ref2. Strict-after-date release=3 H1, already B's
committed start. **PA B remains3 H1–after H4; project outlook3, unchanged.**
Gantt: automatic A date-only marker, “Completed on committed date; time
unknown”; no affected B ghost or delay summary. I1–I7; on-date is not an
hour-level guarantee.

**L01b precision control:** A2→B2, As-of2. Committed A=2 H1–after H2,
B=2 H3–after H4, project2. Actual A=2/ref2 is still on-date. Safe release3 H1
gives PA B=3 H1–after H2; project3 (+1 calendar day; B +2 scheduled slots).
Gantt: precision-qualified B outline, **no historically late badge**.
Same-date original feasibility is unverified, not disproven. This conservative
outlook shift is not proof of actual delay. I1–I7.

## L02 — Late completion without successors (D04, D08)

Input: single A4, As-of3. Committed A=2 H1–after H4, project2. Actual A=3/ref2:
one calendar day historically late. No remaining duration or PA bar exists.
All tasks are Complete, so **actual project finish is date3** versus current
committed date2; no actual finish hour is supplied. Gantt: A marker and
“A completed 1 calendar day late; no downstream tasks.” Current-plan actual
finish comparison may be shown; historical whole-project delay lacks its own
saved project reference. I1–I7; no generic “late predecessor delayed tasks.”

## L03 — One successor (D01, D02, D07, D08)

Input: A4→B4, As-of4. Committed A=2 H1–after H4, B=3 H1–after H4,
project3. Actual A=4/ref2: two days historically late. B's committed date3
precedes A's actual date4: confirmed infeasible committed date order.
Safe release5 H1 dominates B's committed and As-of floors.
**PA B=5 H1–after H4; project outlook5** versus3 (+2 calendar days;
B +8 scheduled slots), conditional on full duration/status/precision rules.
Gantt: automatic A marker on4, B labelled PA outline on5 and visible summary.
Network: A→B known outlook driver, committed critical remains A/B. I1–I7;
no exact actual hour or attribution of measured real-world delay.

## L04 — Multi-task propagation (D01, D02, D07)

Input: A4→B4→C4 (C=T3), As-of4. Committed A2, B3, C4, each H1–after H4;
project4. Actual A=4/ref2. Safe release5 H1 gives B=5 H1–after H4,
then C=6 H1–after H4. **Project outlook6** (+2 dates/+8 scheduled slots
versus committed C). B and C each shift8, but do not sum their shifts into
16 project slots. Gantt: A date marker and two PA outlines; summary names
the chain. Binding B→C uses a known planned boundary, not another date-only
assumption. I1–I7.

## L05 — Late predecessor, no project impact (D02, D07, D08)

Input: A4→B4; independent P12 manual3; As-of3. Committed A2, B3,
P=3 H1→5 after H4; project5. Actual A=3/ref2: one day late.
**PA B=4 H1–after H4; P stays3→5; project outlook5, unchanged.**
Committed A/B slack=8 slots; B shifts4, leaving4 before P's project finish.
Gantt: show A's lateness and B's changed outline, summary “1 successor
shifted; project outlook unchanged under this model.” P still governs.
Do not label the late task a project-delay cause. I1–I7.

## L06 — Multiple predecessors, one late (D01, D07)

Input: independent A4 and B8; J4 after **both** A/B; As-of3. Committed A2,
B=2 H1→3 after H4, J=4 H1–after H4; project4. Actual A=3/ref2 and
B=3/ref3. Both date-only releases are4 H1; neither can be ignored.
**PA J remains4 H1–after H4; project4 unchanged.** A has4 slots committed
slack, B/J are committed critical. Gantt: actual markers with separate
on-date/late labels, no shifted J ghost; explain join readiness and tied
actual bounds. One predecessor being late does not mean the join moved.
I1–I7.

## L07 — Noncritical branch and absorbed slack (D07, D08)

Input: A4→B4; P8 manual3; J4 after B and P; As-of3. Committed A2, B3,
P=3 H1→4 after H4, J5, project5. Actual A=3/ref2. **PA B4; P3→4;
J5 unchanged; project5 unchanged.** All one-day bars occupy H1–after H4.
Committed A/B slack4 is fully consumed by B's4-slot shift; J now has tied
B/P releases. Gantt: affected B only; no false project delay. Network keeps
committed P→J critical; separate outlook tie may include A→B→J. I1–I7.

## L08 — Controlling branch changes (D01, D07)

Input: A4→B4; P8 manual3; As-of4. Committed A2, B3, P=3 H1→4 after H4,
project4. Actual A=4/ref2 and P=4/ref4. Current committed CPM: **P only
critical**, A/B slack4. Safe release5 H1 gives **PA B5 H1–after H4;
project outlook5**, one calendar day/four planned slots beyond committed4.
B shifted8: four absorb old margin and four extend beyond P.
Gantt: A marker, P on-date marker, B PA outline and changed finish driver.
Network: committed P critical remains; separate **outlook-driving A→B**
annotation. On paper this simple remaining branch controls the modelled
finish; no runtime projected CPM/zero-slack claim is made. I1–I7.

## L09 — Successor already In Progress (D03, D05)

Input: A4→B8; As-of3. Committed A2, B=3 H1→4 after H4, project4.
Actual A=3/ref2; B transitions In Progress effective3. No actual start,
remaining scheduled slots or trustworthy current intraday evidence exists.
A's safe future release is4 H1, but B **already started according to status**.
**B finish and whole-project outlook Unknown.** Known8 remaining person-hours
do not justify a full8-slot restart on4. Gantt: A marker, B status and
uncertainty cue; no invented actual start or shifted full-duration bar.
Expose possible same-date order uncertainty without declaring a proven
conflict from date-only evidence. I1–I7.

## L10 — Successor already Complete (D03, D05, D07)

Input: A4→B4→C4; As-of3. Committed A2, B3, C4, project4. Actual
A=3/ref2, B=2/ref3. **Definite recorded ordering conflict:** B date2 is
before predecessor A date3. Do not move B's completion to satisfy A.
B's own safe release3 and C's committed floor4 give a **conditional C4
H1–after H4**; global project outlook remains **Unknown/conflicted**, not
“feasible unchanged4.” Gantt: both actual markers and explicit history
warning, conditional C result in details; B never gets a PA duration bar.
Network cannot certify a global driver across contradictory history.
I1–I7. If both actual dates were equal, ordering would instead be unverified.

## L11 — Manual start and projection (D02)

Input: A4→B4 with B retaining MANUAL requested3; As-of4. Committed A2/B3,
project3. Actual A=4/ref2. The retained manual value is **inactive** because
B has a predecessor. **PA B5 H1–after H4, project5**, as in L03.
Gantt/details: explain predecessor readiness; show retained date as inactive,
not a broken fixed appointment. No new constraint semantics. I1–I7.

**L11b active-release control:** independent A4 and M4 (M=T2) manual3;
As-of4. Committed A2/M3/project3. Actual A=4/ref2. M has **no dependency**
on A. PA M=4 H1–after H4 from As-of; project date4 versus3. A actual date4
ties the latest date, so no exact combined project hour. Gantt: M's reason
is As-of, not late A. Manual3 was a not-before release and remains satisfied.
I1–I7.

## L12 — Actual on a nonworking date (D01, D04)

Input: A20→B4, default calendar, As-of Saturday7. Committed A=2 H1→6
after H4; B=9 H1–after H4, project9. Actual A=Saturday7/refFriday6,
historically one calendar day late. Strict-after7 normalizes to Monday9.
**PA B9, project9 unchanged.** Gantt preserves actual Saturday7; it does
not rewrite the fact as Monday. Compressed mode uses a labelled collapsed
date marker; no weekend effort or scheduled-slot lateness is inferred.
I1–I7.

**L12b weekday-gap control:** M/T/Th/F, four slots/day; A8→B4, As-of
Wednesday4. Committed A=2 H1→3 after H4; B=5 H1–after H4, project5.
Actual A=Wednesday4/refTuesday3. Release Thursday5 already equals B start;
**PA/project unchanged5**. Show exact nonworking Wednesday actual date in
both chart modes. I1–I7.

## L13 — Completed predecessor reopened (D03)

Input: A4→B4, committed A2/B3/project3; A completed3/ref2 then reopened
In Progress effective4 with reason; As-of4. Old completion is history.
**PA A/B and project outlook Unknown:** reopened A has no remaining
scheduled-slot duration or actual-start evidence. The reassessed4
person-hours do not fill that gap. Gantt: earlier A marker “historical;
reopened,” current status, uncertainty for dependent B. Old completion must
not release B. Original event and reason remain available. I1–I7.

## L14 — Insufficient actual-progress information (D03–D06, D09)

Input: A4→B4 committed A2/B3/project3; As-of3. Actual A=3 but historical
finish snapshot **absent** (valid older evidence). **Historical late/early
Unknown.** Current committed comparison is separately available: safe
release4 gives **PA B4 H1–after H4, project outlook4** versus current3.
Gantt: actual marker, “Historical commitment unavailable,” qualified B
outline; no fabricated historical late badge. I1–I7.

| Variant and complete input difference (same committed A2/B3) | Expected uncertainty / appearance / project effect |
| --- | --- |
| L14b: no actual; A Blocked effective3, reason “No known restart”; As-of3 | No restart or remaining slots. A/B Unknown, project Unknown. Status/reason visible; no projected duration bars. I1–I7. |
| L14c: malformed current Complete A with **no event**, As-of3 | Existing decoder rejects `STATUS_HISTORY_MISMATCH`. No PA or fabricated repair/date. Show existing validation error; do not load partial history. I1–I7. |
| L14d: actual A=5/ref2 but As-of3 | Future-effective actual relative to context. Keep stored status/event; warn scenario/future evidence, B/project Unknown under recommendation. No prematurely observed actual claim. I1–I7. |
| L14e: no actual; A In Progress effective3, As-of3; all remaining person-hours0 | Zero is neither Complete nor known remaining scheduled slots. A/B/project Unknown; no automatic completion or zero-duration ghost. I1–I7. |

These are explicit policy/evidence gaps, not reasons to change format5 or
subtract calendar time from remaining effort. Existing current statuses and
effort calculations are not modified by the proposed conservative UI.

## L15 — Baseline and effort overlays remain independent (D07–D09)

Same A4→B4, actual A=4/ref2, As-of4 and committed A2/B3 as L03. Frozen
baseline B finishes3. Current B finishes3. Existing FF, with class28/home0/
team1 and B remaining4 person-hours, finishes B on4: Complete A costs0 and
is immediately satisfied in that model. **Proposed PA B5 H1–after H4**,
project outlook5. These answer different questions; none is renamed.

Gantt design: current bar3, optional baseline3, optional FF4, automatic
actual A4 and PA B5 in separate labelled lanes. All **eight combinations**
of Show Baseline / Show Forecast / Highlight Critical Path must leave actual
and PA discoverable, with the same arithmetic and accessible details.
That eight-way assertion is **future browser acceptance**, not an implemented
PA screenshot test. Existing FF4 is checked now. I1–I7.

## L16 — Save/reload and reproducibility (D06, D09)

Same exact inputs/answers as L03/L15: committed project3, Aactual4/ref2,
As-of4; **PA B5/project5** under proposed rules. Serialize and parse the
fictional current-format file: all source events/snapshots, baseline,
committed inputs, remaining and forecast settings are exactly equal in the
diagnostic. PA is not inserted into the file. Reapplying the **same explicit
As-of4 and rule version** therefore has the same supplied arithmetic.

Gantt would reproduce the actual marker/PA outline and summary from those
facts. This is source round-trip plus a design determinism contract, **not an
end-to-end PA implementation test**. Reloading with later local-today As-of
may legitimately change future Not Started dates; the current file does not
archive a previous PA As-of. Legacy missing snapshots remain missing after
round-trip. I1–I7; exact past-context persistence is a separate owner decision.

## Remaining verification boundary

All 23 supplied cases pass existing committed/calendar/source-invariant
checks. Unknown/conflict rules, event provenance propagation, exact future
PA read model, new automatic markers, layer visibility, permutation behavior
and performance still require implementation tests after approval. No
diagnostic pass substitutes for owner policy choices or student comprehension.
