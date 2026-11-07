# Requirement and regression traceability

Authority, scope and starting SHA are in [README](README.md).

| Requirement | Implementation and evidence |
| --- | --- |
| 3.1 Actual precedence / late extension | `ActualImpactOverlays` and `elapsedOverrun` consume the active event's historical reference, draw a primary dotted red date span and Actual marker, and expose exact calendar-day caption. Cases1/4/7/8. |
| 3.1 Unaffected project / no successors | Red history is independent of project variance and successor count. Absorbed and leaf fixtures/tests retain it. |
| 3.1 On-date, early, missing historical comparison | No extension for non-late or absent-reference cases; no current/baseline substitution. Primary actual marker remains. Three browser cases plus both-axis adapter tests. |
| 3.2 Not Started primary PA / secondary C | Shifted known PA has primary 20px interval; C is a thin reference. PA=C uses one interval. DOM paint attributes and component/browser checks establish hierarchy. |
| 3.2 Unknown and contradictory evidence | No fabricated primary duration or shifted connector; sticky captions, PA ? and Deps ? expose insufficient/contradictory evidence. Started/blocked/reopened/conflict/future fixtures. |
| 3.3 Actual release and projected relations | `presentImpactRelations` maps existing actual facts to conservative release R, then existing PA starts. Nov6 -> Nov9 is independently asserted; both tied predecessors retained. Committed edges remain distinguishable references. |
| Accepted versus staged dependencies | Presentation reads the accepted impact record's predecessor IDs. A draft-edge removal/addition test verifies accepted PA relations stay unchanged without source mutation. |
| 3.3 Working/nonworking axes | Existing modes/coordinate functions preserved. Expanded PA gaps hatch; red dots are elapsed comparison. Compressed omitted dates use collapsed red break and exact date/count labels. |
| 4 Historical integrity | Adapter tests edit current duration while retaining the historical snapshot and assert four historical days. Serialization/source invariants and baseline equality remain exact. No calculation/persistence module diff. |
| 4 PA As-of and summary | Existing explicit As-of remains authoritative. Future-effective warning and required Unknown persist. Shifted task IDs, absorbed margin and slot/date project variance remain separate from red elapsed history. |
| 5 Accessibility and overlays | Focusable Actual/overrun/PA/R/relations, row descriptions, text/dots/dashes/shape and legend. All8 toggle combinations in both modes; narrow30/40 fixtures and keyboard activation. |
| 5 Navigation and extents | Axis includes historical/release dates; no automatic jump. Existing date-anchor handling and explicit Go to impact; primary selected task navigation and virtualized source order. |
| 7 Handoff | Runbook, explicit Pending acceptance, findings, screenshots, logs, source/ref guards and branch-only push. No earlier gate inferred. |

## Required case mapping

| Prompt case | Independent inputs / expected outcome |
| --- | --- |
| 1 | T1 current/historical finish Nov2, actualNov6 -> red +4 calendar days and ActualNov6, not4 hours. |
| 2 | T2 current start Nov3; PA As-ofNov6 -> primary PA MondayNov9 H1. Current C remainsNov3. |
| 3 | Same effective completion with As-ofNov4 -> future warning, T2 Unknown and no exact shifted relation. |
| 4 | Independent manual root Nov9 for8slots controls Nov10; T2 PA endsNov9. Red overrun remains; project outlook unchangedNov10. Separate leaf case has no successors. |
| 5 | T1/T2 completeNov6, both releaseNov9 to T3; separate R links. Changed-driver fixture keeps committed T3 critical while outlook drivers are T1/T2. |
| 6 | Started, Blocked, reopened and contradictory completed successor cases preserve status/history and uncertainty without invented positions. |
| 7 | On-date/early/missing historical reference cases have Actual and no fabricated red span. |
| 8 | T1 committed FridayNov6, actual SaturdayNov7 -> MondayNov9 release; Expanded shows calendar gap, Compressed uses a collapsed symbol. |
| 9 | Formats1-5 import/export/import; supported facts and baselines preserved; same external As-of redraws deterministically. No new saved presentation/PA fields. |
| 10 | 30/40-task narrow keyboard cases; all8 masks x2 modes; direct completion update asserted before any refresh/navigation/toggle. |

## Existing tests intentionally adapted

`tests/wp4.spec.ts` no longer expects the committed C reference to remain a
solid red critical-duration bar. It verifies unchanged committed critical
flags and source boundaries, the subordinate reference, and primary PA
nonworking hatching in Expanded versus no gap in Compressed. PA As-of is
explicitly fixed for reproducibility.

`tests/wp5.spec.ts` collects both virtual row windows when comparing drag order
and immutable task/critical data. The previous assertion assumed all seven
rows existed at once. The new common row layout legitimately renders fewer
rows; the test still checks every task, not a shortened expected list.

The existing thousand-task Network DOM limit exposed hidden summary detail
nodes once As-of moved tasks. Lazy/paged details correct that presentation
cost while preserving all entries and keyboard access. The Network model,
layout, CPM and storage contracts have no changes.
