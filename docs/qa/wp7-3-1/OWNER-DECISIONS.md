# WP7.3.1 owner review and separate implementation gate

**All decisions Pending.** WP7.3.1 delivers design and diagnostic evidence;
no progress-adjusted scheduling behavior has been implemented. This sheet
records new recommendations, not previously accepted rules. Existing four
statuses, optional work logs, immutable baseline/history, unchanged committed
schedule and independent effort forecasting remain constraints.

Start with [assessment](PROGRESS-IMPACT-ASSESSMENT.md), [rules](PROJECTION-RULES.md),
[scenario matrix](SCENARIO-MATRIX.md), [Gantt/Network design](GANTT-NETWORK-DESIGN.md)
and [implementation plan](IMPLEMENTATION-PLAN.md). In particular compare:
L01b (precision-only shift), L05/L07 (absorbed lateness), L08 (changed driver),
L09/L13/L14 (Unknown), and L15 (FF can disagree with PA).

## Independent policy choices

Mark one disposition per decision; record alternatives/conditions. Blank
boxes do not authorize a default. Partial approval does not resolve dependent
policies; implementation scope must name all necessary choices separately.

| ID | Recommended decision and consequence | Approve | Defer | Reject | Conditions / alternative |
| --- | --- | --- | --- | --- | --- |
| D01 — Date-only readiness | Use first working slot strictly after the effective actual date. It is a conservative bound, not an actual hour or proven same-day infeasibility. Alternative: uncertain readiness interval; exact intraday release requires new evidence. L01b/L03/L12. | [ ] | [ ] | [ ] | __________ |
| D02 — Duration and floors | Ordinary Not Started uses full current committed **scheduled slots**, max of committed start, explicit As-of start-of-date and all predecessor readiness. Delay-only; no early pull-forward. Preserve current root-only manual not-before semantics. Default Not Started is an assumption, not observed no-work. Alternative duration/floor policy requires separate specification. L01–L08/L11. | [ ] | [ ] | [ ] | __________ |
| D03 — Unsupported remaining-slot evidence | In Progress, Blocked without restart, and reopened work stay Unknown for projected finish when remaining scheduled slots are absent. Propagate uncertainty; never substitute person-hours, optional logs, old completion or a full-duration restart. Alternative requires separately approved evidence capture/contract. L09/L13/L14. | [ ] | [ ] | [ ] | __________ |
| D04 — Historical reference and units | Historical lateness uses the active completion's saved committed finish **date**; absent means Unknown. Current-plan comparison is separately named. No historical slot/project-delay claim from today's calendar/plan. Actual project finish exists only when all Complete; use a named reference. L02/L12/L14. | [ ] | [ ] | [ ] | __________ |
| D05 — Contradictory and future facts | Never move a completed successor or rewrite history. Earlier successor actual date is conflict; same-date order is unverified. Known downstream conditional bounds may be shown, but no certified global outlook. Future-effective completion relative to PA As-of is warned/uncertain, preserving saved status and existing FF behavior. L09/L10/L14d. | [ ] | [ ] | [ ] | __________ |
| D06 — PA As-of and reproducibility | Explicit pure input, UI default local today, start-of-date assumption and label separate from FF As-of; no saved PA preference in first scope. Same file + same externally specified As-of reproduces; later-day default may differ. If past-context reproduction must be stored, separately design a versioned contract first. L11b/L16. | [ ] | [ ] | [ ] | __________ |
| D07 — Project impact and paths | Separate late task, breached start, successor shift and conditional project finish; preserve tied reasons/slack absorption. First version traces **outlook-driving constraints**, not projected CPM/zero slack. Committed critical path remains independent. Unknown/conflicted paths withhold a definite global result. Full projected CPM would be a separately scoped algorithm. L05–L10. | [ ] | [ ] | [ ] | __________ |
| D08 — Automatic chart design | Date-only A markers, separate PA outlines/Unknown cues, visible calculated summary and accessible details, independent of all three existing overlay toggles. Separate lanes, noncolor labels, primary actual/PA axis union and explicit Go-to-impact; retain bars/links/hatching and view context. No fullscreen/meeting expansion. L01–L16. | [ ] | [ ] | [ ] | __________ |
| D09 — Derived storage boundary | No persisted projection or new fields/version for conservative first scope. Preserve formats1–5 and missing evidence as Unknown. Exact hour/remaining-slot/restart/historical context capture requires separately approved types, backup and version/migration contract before code. Optional actual logs remain optional. L14–L16. | [ ] | [ ] | [ ] | __________ |

## Prior and present acceptance records

These are independent; none is granted by requesting this design:

- [ ] **WP7.1 assessment accepted.** Outstanding checks/conditions: __________
- [ ] **WP7.3 C01–C06 accepted** at `b09aae181589167889710b8992e3a82df35dd2b8`.
  Conditions/remaining checks: __________
- [ ] **WP7.3.1 design accepted as a diagnostic/design handoff.** Conditions: __________
- [ ] Further design/verification requested instead: __________

Owner / date: ____________________

Design acceptance is not production implementation authorization. No real
student study or PA usability/performance validation has been conducted;
the supplied arithmetic and existing regression passes do not replace it.

## Separate authorization before implementation

- [ ] **Authorize a later progress-adjusted implementation**, explicitly
  naming approved decisions: ____________________
- Approved bounded scope / exclusions / verification conditions: __________
- Any unresolved policy that blocks part of that scope: __________________
- Owner / date: ____________________

The agent stops at this gate after committing/pushing the authorized design
and evidence. No automatic implementation, main merge, tag, deployment,
rebaseline or WP8 work follows this package.
