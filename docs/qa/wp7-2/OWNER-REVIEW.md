# Owner review and decision sheet

WP7.2 is complete as an assessment. **No production changes were authorized
or made.** The application's visible UI is therefore unchanged. WP7.1
acceptance is still unrecorded; mark it independently below. Starting WP7.2
and reporting QA71-005 did not approve either assessment or any correction.

## Review the key evidence

1. [Complete still shows 10 h](evidence/ux7-006-complete-summary.png): the same
   summary explains zero future work. The forecast already excludes the task;
   correct the displayed meaning, not the forecasting formula. Compare the
   [optional work-log panel](evidence/ux7-006-work-details.png): recorded 0 h
   is not proof that no work occurred.
2. [Hidden Duplicate](../wp7-1/evidence/qa71-005-pointer-initial.png) versus
   [Actions revealed](../wp7-1/evidence/qa71-005-pointer-revealed.png): recommend
   keeping task actions visible, with an actual-overflow cue.
3. [40-task Gantt](evidence/forty-gantt-1280.png) and
   [Network](evidence/forty-network-1280.png): current navigation works;
   expansion is a proposed new workspace behavior, not already implemented.
4. Review the [existing meeting route and proposed review view](STATUS-MEETING-WORKFLOW.md).
   It keeps work logging optional, asks students to review all unfinished
   effort, and separates student opinion from calculated risk.

The [assessment](UX-ASSESSMENT.md) covers UX01–UX07 and test limits. The
[findings](UX-FINDINGS.md) distinguish confirmed defects from weaknesses,
policy decisions and enhancements. The [candidate backlog](WP7-3-CANDIDATES.md)
contains bounded acceptance and compatibility requirements.

## Approve, defer or reject independently

All choices start **Pending**. Mark one disposition per row and add any
scope conditions. Approval means authorization for a later explicitly started
WP7.3/enhancement scope, not that it has already been implemented here.

| Item | Proposed decision | Approve | Defer | Reject | Conditions / alternative |
| --- | --- | --- | --- | --- | --- |
| C01 / QA71-005 | Sticky visible Actions/Duplicate and overflow hint | [ ] | [ ] | [ ] | __________ |
| C02 / UX7-006 | Complete shows zero effective remaining; retain stored estimate/history | [ ] | [ ] | [ ] | Pair with C03 qualification |
| C03 | Qualify actual/variance as recorded data with unknown completeness; keep logging optional | [ ] | [ ] | [ ] | __________ |
| C04 | One-time new-task remaining = initial entered estimate | [ ] | [ ] | [ ] | Duplicate: same seed / Unknown / other: ____ |
| C05 | Require affirm/revise/Unknown remaining review when reopening, plus reason | [ ] | [ ] | [ ] | __________ |
| C06 / QA71-002 | Explicit Automatic/Fixed As-of selection, existing file contract | [ ] | [ ] | [ ] | __________ |
| C10 | Preserve task/date anchor on scale/mode change when practical | [ ] | [ ] | [ ] | Current Go to selected may suffice |
| C07 (larger) | Separately scope Expand/Restore for both charts, controls/details/Esc/state retained | [ ] | [ ] | [ ] | No native browser fullscreen |
| C08 (larger) | Separately scope exception-based meeting view | [ ] | [ ] | [ ] | Approve manual workflow only / view scope: ____ |
| C09 (larger/storage) | Separately design optional dated student Green/Yellow/Red with history | [ ] | [ ] | [ ] | New version/backup review required |

Recommended order: C01 and C02 with C03 first; independently decide C04/C05/C06.
C10 is optional polish. Treat C07/C08/C09 as larger enhancements requiring
their own scope and, for C09, a compatibility contract before implementation.
Do not bundle them into a defect correction or silently add health history.

Constraints already given by WP7.2 remain fixed: four work statuses, no
calendar-based remaining deduction, optional actual logs, immutable baseline
and historical snapshots, independent computed risk, preserved real data,
and no unauthorized formula/persistence changes. These are not new choices
to be inferred from blank decision boxes.

## Acceptance and next authorization

- [ ] WP7.1 assessment accepted. Conditions/remaining checks: ______________
- [ ] WP7.2 assessment accepted as an evidence-based diagnostic handoff.
- [ ] Further verification requested instead: ___________________________

Owner/date: ____________________ Approved item IDs/scope: ________________

No new-student participant study was conducted. If student comprehension or
meeting effort must be validated before selecting a design, request a short
facilitated session separately; no automated pass rate substitutes for it.
WP7.3 begins only after separate authorization naming its approved scope.
WP8 reporting and release/deployment work remain outside this package.
