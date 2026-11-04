# Approved D01–D09 and acceptance traceability

Authorization and source hash are recorded in [README](README.md). The
WP7.3.2 prompt supplies the approved policies/conditions; no acceptance of
earlier packages is inferred. All listed source paths are relative to repo root.

| Decision | Implementation / owner-visible result | Evidence |
| --- | --- | --- |
| D01 | Pure actual-date + 1 calendar date then working-calendar normalization. No actual `afterHour`; A spans a date cell or a labelled collapsed nonworking boundary. On-date and conservative shift remain distinct. | L01/L01b/L03/L12/L12b; browser D and nonworking case |
| D02 | Known ordinary Not Started uses full current scheduled duration, max of committed floor/As-of/all predecessor releases. Root-only manual release unchanged; inactive manual date explained. Propagated As-of cause stays distinct. | L01–L08/L11/L11b; browser A/B/F |
| D03 | In Progress, Blocked and reopened work return Unknown without actual-start/restart/full-duration inventions. Required unknown predecessor blocks future candidate; no person-hour conversion API exists. | L09/L13/L14b/L14e; browser C |
| D04 | Active completion selected by recorded event sequence; comparison uses its saved commitment date or Unknown. Actual-all-complete project date has no fabricated hour/reference. | L02/L14; corrected-effective-date and date-only project unit tests |
| D05 | Definite earlier successor actual date produces conflict; same-date order remains unverified. History is preserved; global outlook/driving claim withheld across conflict/Unknown. Future-effective facts warned. | L10/L14c/L14d; browser C |
| D06 | Explicit pure As-of; App's transient override defaults to existing local-date hook and can return to today. Separate PA control; no source fingerprint or persisted preference change. | deterministic reverse-input tests; browser F/G |
| D07 | Historical late, breach, slot/date movement, binding constraints/ties, As-of causes, project date and uncertainty are separate outputs. Exact planned endpoints distinguish same-date slot changes from absorbed slack; actual date-only ties stay qualified. Binding-chain traversal reports outlook drivers; committed CPM untouched. | L05–L08; tied-join/driver and project-slot unit tests; browser B/E/F and same-date project delay |
| D08 | A/PA/Unknown and summary automatic, selected details, noncolor text, focusable SVG affordances, keyboard Go to impact. Separate lanes, union axis and bounded virtualization preserve context and links/hatching. | browser A–J, eight H combinations, narrow existing checks, nonworking/offscreen test; screenshots |
| D09 | No file/schema/serializer changes. Only source facts + explicit As-of generate PA. Baseline/events/current plan/FF remain independent and source files round-trip exactly. | L15/L16; unit formats1–5, unchanged FF4 versus PA5; browser G/H and full existing suite |

Principal independent answers remain the **23 pre-implementation cases** in
[`../wp7-3-1/SCENARIO-MATRIX.md`](../wp7-3-1/SCENARIO-MATRIX.md) and its
JSON evidence. `src/projection/progressImpact.test.ts` checks all L01–L16
and variants without regenerating expected dates using the new calculator.
The reversed task array must yield the same canonical result. Source,
committed schedule/CPM, baseline, serialization and FF checks are explicit.

| WP7.3.2 observable acceptance | Browser check |
| --- | --- |
| A + J completion updates immediately | A J: actual marker, new successor outline and summary asserted directly after confirmation, all existing toggles off |
| B absorbed slack | L05: B moves to Nov4 while project outlook stays Nov5 |
| C Unknown started/blocked/reopened, contradictions | L09/L14b/L13/L10, no invented endpoint/full replacement bar |
| D same-date conservative release | L01b: B moves to Nov3, zero historically late completions |
| E changed controlling branch | L08: PA driver T1→T2, committed T3 stays critical in both views |
| F unrelated As-of movement | L11b: T2 cause As-of only, FF settings unchanged |
| G round-trip | Save, reload, load, external PA As-of, export and re-import preserve all source facts |
| H all eight overlay combinations | Separate tests for masks0–7, FF Nov4 versus PA Nov5 when all on |
| I 30/40 tasks and keyboard | Bounded rendered rows, focused native scrolling, no page errors; pure sparse/dense 30–100 task benchmark |

## Existing test adjustments

The row-virtualization test now uses the shared row-height constant rather
than a hardcoded 52px. The task-status browser comparison isolates committed
bar/link markup: all-chart pixel equality is no longer valid when status must
change PA. Dependency inspection is addressed by its named live region rather
than an unqualified status role. Two old exact `Late` locators are scoped to
Project overview; other visible health uses are legitimate. A hierarchy test
positions its click target before measuring page scroll, excluding Playwright
actionability scrolling introduced by the extra automatic summary height.
The established scale/mode reset expectations remain enforced.

These changes retain each original invariant. They do not hide altered
committed dates, replace expected PA dates with implementation outputs or
remove compatibility/status checks. Details and failed-run history are in
[VERIFICATION](VERIFICATION.md).
