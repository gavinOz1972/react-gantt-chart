# Evidence register and interpretation

Paths are relative to this worktree unless linked. Historical evidence is read
at the named committed version; current unstaged screenshots/JSON are preserved
and are not treated as new owner observations. Source hashes and reviewed paths
are recorded in [the audit](evidence/review-audit.json).

## Requirement sources

| Package | Original source and repository requirement/acceptance record |
| --- | --- |
| WP7.1 | `../react-gantt-chart/docs/WP_Req/React_Gantt_WP7_1_End_to_End_Verification.docx`; [ASSESSMENT](../wp7-1/ASSESSMENT.md), [FINDINGS](../wp7-1/FINDINGS.md), [owner route](../wp7-1/OWNER-RUNBOOK.md). TV01-TV04, E01-E14, OV01-OV03, A01-A06. |
| WP7.2 | `C:/Users/gavin/Downloads/Bugsys_Gantt_WP7_2_Usability_Assessment.docx`; [assessment](../wp7-2/UX-ASSESSMENT.md), [findings](../wp7-2/UX-FINDINGS.md), [candidates](../wp7-2/WP7-3-CANDIDATES.md), [owner sheet](../wp7-2/OWNER-REVIEW.md). UX01-UX07 and unnumbered section 6 criteria. |
| WP7.3 | `../react-gantt-chart/docs/WP_Req/React_Gantt_WP7_Progress_Consistency_and_Usability_Corrections.docx`; [implementation](../wp7-3/WP7-3-IMPLEMENTATION.md), [runbook](../wp7-3/WP7-3-OWNER-RUNBOOK.md). Explicit November 2 C01-C06 scope approval; independent post-implementation acceptance. |
| WP7.3.1 to WP7.3.2 | `Bugsys_Gantt_WP7_3_1_Late_Completion_Design.docx` and `Bugsys_WP7_3_2_Implementation_Prompt.docx` in the sibling primary worktree's `docs/WP_Req`; [D01-D09 design sheet](../wp7-3-1/OWNER-DECISIONS.md), [later authorization](../wp7-3-2/README.md), [traceability](../wp7-3-2/TRACEABILITY.md), [acceptance](../wp7-3-2/ACCEPTANCE.md). |
| WP7.3.3 | Sibling `docs/WP_Req/Bugsys_WP7_3_3_Historical_Gantt_Presentation.docx`; [rationale](../wp7-3-3/README.md), [traceability](../wp7-3-3/TRACEABILITY.md), [open limits](../wp7-3-3/OPEN-FINDINGS.md), [acceptance](../wp7-3-3/ACCEPTANCE.md). Source cases 1-10 and eleven owner checklist conditions. |

## Commit references

| Alias | Exact commit / scope |
| --- | --- |
| K71 | `8a6bf3171d40f8aec5025e63e55f3f0c62018ad3` - original WP7.1 verification; `ffd93a57854943d60ecbd66f03c188c110237724` - QA71-005 investigation. |
| K72 | `3dc291ec556aa0fbd1fae38e2fc9f1ba6acf0308` - WP7.2 assessment. |
| K73 | `b09aae181589167889710b8992e3a82df35dd2b8` - C01-C06 implementation; updates WP7.2 owner sheet with scope approval, not assessment/product acceptance. |
| K731 | `284a7f921790473c26f5248cefdfe11584d03c5d` - design/independent scenarios. |
| K732 | `70dd0625243de143731f40d5338c6e4d0527ee4c` - PA implementation. |
| K733 | `a5a953e820615e2b1105f235f0060c5831e335bf` - historical Gantt correction. |
| K7a / K7b | `22bfd6a3afff6f78e977d9fde55405de9983cabd` / `8ae0eb4cff4e9f46785852bec9462f0b49518513` - accepted narrow history corrections. |
| K748 | `ca46e9a9b5b603d621ca860c6493b60e5c24bb44` - release assessment and supplied b owner acceptance. Reviewed base for this reconciliation. |

## Automated evidence aliases

These aliases in the crosswalk identify actual logs and test sources, not human
acceptance. Counts are historical results, not newly run in WP7.4.9.

### E71

[Assessment coverage E01-E14](../wp7-1/ASSESSMENT.md),
[411-test check](../wp7-1/evidence/qa71-005-check.txt),
[137-browser result](../wp7-1/evidence/qa71-005-full.txt),
[date experiment](../wp7-1/evidence/date-mode.txt),
[six access probes](../wp7-1/evidence/qa71-005-targeted.txt),
[isolated performance](../wp7-1/evidence/performance-isolated.txt).
Sources: `tests/wp71/lifecycle.spec.ts`, `performance.spec.ts`,
`duplicate-access.spec.ts`; [fixture anchors](../../../tests/fixtures/wp71/README.md).
The old pre-correction discoverability outcome is not the current expectation.

### E72

[Assessment method/results](../wp7-2/UX-ASSESSMENT.md),
[six diagnostic cases](../wp7-2/evidence/diagnostics.txt),
[411-test check](../wp7-2/evidence/check.txt),
[143-browser result](../wp7-2/evidence/browsers.txt).
Source: `tests/wp72/usability-diagnostics.spec.ts`; historical diagnostic assertions
and screenshots explain the old problems, not unfixed current behavior.

### E73

[C01-C06 coverage](../wp7-3/WP7-3-VERIFICATION.md),
[414-test check](../wp7-3/evidence/check.txt),
[160-browser result](../wp7-3/evidence/browsers.txt).
Source: `tests/wp73/corrections.spec.ts`; six stored-value/log variants,
all three reopen entry points, new/copy/forecast cross-feature cases,
Fixed-today/midnight/reload and legacy preservation.

### E732

[D01-D09 and A-J mapping](../wp7-3-2/TRACEABILITY.md),
[452-test check](../wp7-3-2/evidence/check.txt),
[182-browser result](../wp7-3-2/evidence/browser-all.txt),
[performance scope](../wp7-3-2/VERIFICATION.md).
Sources: `src/projection/progressImpact.test.ts`,
`tests/wp732/progress-impact.spec.ts`; independent
[L01-L16 and variants](../wp7-3-1/SCENARIO-MATRIX.md).
Calculation-host benchmarks are not student-device observations.

### E733

[Source cases 1-10 mapping](../wp7-3-3/TRACEABILITY.md),
[486-test check](../wp7-3-3/evidence/check.txt),
[223-browser result](../wp7-3-3/evidence/browser-all.txt).
Sources: `src/timeline/historyPresentation.test.ts`,
`src/components/gantt/HistoricalPresentation.test.tsx`,
`tests/wp733/historical-gantt.spec.ts`. Cases cover actual/PA hierarchy,
late/absorbed/leaf, Unknown, weekend precision, all eight overlays in both
modes, immediate completion, keyboard/narrow 30/40-task and formats 1-5.

### E748

[Existing full verification](../wp7-4-8-r07/VERIFICATION.md):
[858 tests / 43 files, lint/typecheck/build](../wp7-4-8-r07/evidence/check.txt),
[223 default-off browsers](../wp7-4-8-r07/evidence/baseline-browser.txt),
[38 development feature-on browsers](../wp7-4-8-r07/evidence/feature-browser.txt).
Source assessed was K7b; K748 only added documentation. These corroborate the
current code, not owner sign-off. The current full browser suite contains the
updated C01-C06, PA and historical Gantt checks; original diagnostic assertions
were intentionally adapted where behavior was authorized to change.

## Human evidence

| Alias | Actual observation/decision and limits |
| --- | --- |
| H01 | Owner's QA71-005 report, retained in [FINDINGS](../wp7-1/FINDINGS.md): Duplicate could not be located. A concrete negative usability observation at the earlier version, not a post-C01 pass. |
| H02 | WP7.3.3 original DOCX section 1 explicitly states that **WP7.3.2 owner review revealed** a completed task still appeared to finish on its planned date because a solid committed bar dominated the actual marker. This is evidence of human review of that scenario. It establishes neither a complete A-J pass nor acceptance of the later fix. The same source expressly requires independent earlier acceptances. |
| H03 | WP7.3 correction DOCX header/section 2 and WP7.2 owner sheet explicitly approve **C01-C06 scope** (including copied-duration seed) on November 2. WP7.3.2 source explicitly approves **D01-D09 policies** and implementation. WP7.3.3 source explicitly chooses prominent historical overrun even when project finish is unaffected. These are owner policy/authorization decisions; they are not post-implementation product acceptance. |
| H04 | Current WP7.4.9 request: owner recalls substantial testing of WP7.3, WP7.3.2 and WP7.3.3. Recorded today as package-level owner-tested, disposition pending. No case list, tested SHA/date, recorded outcomes or explicit acceptance supplied. It cannot populate individual pass boxes. A new specific owner statement can reconcile those observations without falsely backdating approval. |
| H05 | [WP7.4.7a disposition](../wp7-4-7a/OWNER-DISPOSITION.md) explicitly accepts K7a and closes UX7.4.7-001 / QA7.4.7-002, retaining earlier manual test notes. [b acceptance](../wp7-4-7b/ACCEPTANCE.md) explicitly accepts K7b and closes recovery feedback with supplied owner checks including project-data regression. These stay closed; that narrow regression observation is not a detailed E01-E14 or C01-C06 acceptance record. |

For crosswalk rows saying **No item-level pass**, H04 is acknowledged but not
expanded into that specific observation. Agent screenshot inspection, automated
JSON, changed timestamps and unsigned runbook instructions are not human tests.

## Later changes and contradictory or unavailable evidence

1. WP7.2 findings/backlog initially say all recommendations Pending. The later
   K73 [owner sheet](../wp7-2/OWNER-REVIEW.md) explicitly checks approval of
   C01-C06, while assessment acceptance remains unchecked. These are different
   decisions, not proof one source is false. Do not ask for the scope choice again.
2. WP7.3.1 D01-D09 boxes remain blank; WP7.3.2's later approved-policy prompt
   resolves implementation authorization. Its independent product acceptance
   remains pending. WP7.3.3 replaces the older D08 visual hierarchy, preserving
   the calculation/precision/persistence policies.
3. QA71-005's offscreen-action expectation and raw Complete display were replaced
   by K73. The earlier Duplicate-copy Unknown default also changes deliberately
   under C04. Do not rerun pre-fix expectations as current acceptance criteria.
4. Since K733, no changes to Gantt, PA/FF/domain calculations, current format
   codecs or task-table/reopen/forecast-setting implementations were found in
   the committed diff to K748. New unused evaluator/repository code and a
   DEV-only history path were added; App passes history context, and
   TaskStatusPanel delegates its old markup to LegacyTaskHistory or the flagged
   reader. Production defaults to legacy history. This does not invalidate a
   specific unchanged-chart observation the owner can now identify. Changes from
   K73 through K733 **do** alter the chart/summary; review the final presentation,
   not the old PA-outline hierarchy.
5. a's original README still says Pending and b's original VERIFICATION says not
   self-accepted. Subsequent H05 acceptance records take precedence. These older
   statements are retained history, not grounds to reopen closed findings.
6. No signed/item-completed WP7.1, WP7.2, WP7.3, WP7.3.2 or WP7.3.3 acceptance
   record was located in the reviewed branch/history or supplied source documents.
   That is a statement about located records, **not proof testing never occurred**.
   H04 supplies a broader recollection, but no new specific positive outcomes.
7. QA71-003's original 12 affected development packages became 10 in the later
   [K748 audit](../wp7-4-8-r07/evidence/npm-audit-all.json), with zero in the
   [production audit](../wp7-4-8-r07/evidence/npm-audit-production.json). Different
   audit snapshots are not an acceptance or dependency fix. Risk triage remains
   RR-04, separate from accepting WP7.1 as an honest assessment.
8. No original student study, student-device/screen-reader/touch session or
   item-specific owner timing record was located. Existing synthetic viewport
   and fast-host measurements do not fill that gap. Broader classroom qualification
   remains RR-03; RR-01 need not duplicate that entire program.

No historical owner evidence or old checkbox is rewritten here. This register
and the crosswalk are proposed reconciliation, not retrospective certification.
