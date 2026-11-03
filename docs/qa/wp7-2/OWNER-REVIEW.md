# Owner review and decision sheet

WP7.2 was delivered as an assessment with no production changes. Subsequent
owner authorization on November 2, 2026 explicitly approved **C01–C06** in
`React_Gantt_WP7_Progress_Consistency_and_Usability_Corrections.docx` and the
user's implementation request. Those corrections are now implemented for
[WP7.3 owner review](../wp7-3/WP7-3-OWNER-RUNBOOK.md). C07–C10 are excluded.
WP7.1 acceptance remains unrecorded and outstanding; scope authorization
does not silently accept it or the earlier assessment checkboxes below.

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

At the assessment handoff every choice was Pending. The current record below
reflects the subsequent explicit C01–C06 implementation approval. WP7.3
acceptance is a separate owner decision after testing; no approval is inferred
for the remaining candidates or for future work packages.

| Item | Proposed decision | Approve | Defer | Reject | Conditions / alternative |
| --- | --- | --- | --- | --- | --- |
| C01 / QA71-005 | Sticky visible Actions/Duplicate and overflow hint | [x] | [ ] | [ ] | Implemented; WP7.3 owner validation pending |
| C02 / UX7-006 | Complete shows zero effective remaining; retain stored estimate/history | [x] | [ ] | [ ] | Implemented with C03 qualification |
| C03 | Qualify actual/variance as recorded data with unknown completeness; keep logging optional | [x] | [ ] | [ ] | Implemented; no completeness field added |
| C04 | One-time new-task remaining = initial entered estimate | [x] | [ ] | [ ] | Duplicate seeds from copied planning duration; implemented |
| C05 | Require affirm/revise/Unknown remaining review when reopening, plus reason | [x] | [ ] | [ ] | Implemented; history remains intact |
| C06 / QA71-002 | Explicit Automatic/Fixed As-of selection, existing file contract | [x] | [ ] | [ ] | Implemented; optional asOfDate semantics retained |
| C10 | Preserve task/date anchor on scale/mode change when practical | [ ] | [ ] | [ ] | Current Go to selected may suffice |
| C07 (larger) | Separately scope Expand/Restore for both charts, controls/details/Esc/state retained | [ ] | [ ] | [ ] | No native browser fullscreen |
| C08 (larger) | Separately scope exception-based meeting view | [ ] | [ ] | [ ] | Approve manual workflow only / view scope: ____ |
| C09 (larger/storage) | Separately design optional dated student Green/Yellow/Red with history | [ ] | [ ] | [ ] | New version/backup review required |

C01–C06 have now been approved and implemented together for WP7.3 review.
C10 remains optional, unapproved polish. C07/C08/C09 still require separate
enhancement scope and, for C09, a compatibility contract before implementation.
None was bundled into the correction package and no health history was added.

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
WP7.3 implementation was explicitly authorized for C01–C06; its owner
acceptance is still pending. The scope approval source/date are recorded
above; it does not check the earlier assessment-acceptance boxes by inference.
WP8 reporting and release/deployment work remain outside this package.
