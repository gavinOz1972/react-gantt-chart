# Historical reporting contract and worked examples

Owner: baseline comparison, retired-task reporting and change-log traceability.
**Proposed data/acceptance contract only. No UI, report engine or PDF/export feature
is built here.** Normal report queries use the pinned view defined in
[REPOSITORY-AND-MEMORY-CONTRACT](REPOSITORY-AND-MEMORY-CONTRACT.md).

## H01: Original-baseline comparison

Compare the full immutable first B with the current active plan at a pinned
accepted revision. Join by exact portable task ID, never name/order/index. Show:

| Value | Required presentation / qualification |
| --- | --- |
| Comparison provenance | Lineage, accepted revision/fingerprint, query watermark, original baseline identity/interpretation or Absent, and history coverage. A later saved/named snapshot is not B. |
| Original commitment | Stored baseline name, duration, graph and planned start/finish under original interpretation. Preserve baseline-only/retired IDs and opaque value provenance. Do not recompute B using today's calendar/inputs. |
| Current active plan | Current name/duration, explicit active predecessors, planned dates and accepted W context/qualification where available. Label WP1 calculated plan versus reviewed W; do not present Unreviewed context as a new promise. |
| Scope difference | Active existing, active new since B, retired with linked evidence, or absent from legacy current scope with reason Unknown. A gap in allocated IDs or a baseline-only task is not proof of retirement/deletion reason. |
| Dependency difference | Added/removed current constraints relative to B. Historical archived edge episodes are explanations, not active constraints. Identical labels or restored edge pairs retain distinct episode provenance. |
| Progress/actual/forecast | Existing four statuses; actual facts with known date precision; remaining in person-hours; separately labelled current forecast/assumptions/As-of and Unknown/Blocked/unavailable outcomes. No progress/date inferred from planned duration or retirement date. |
| Variance | Compare like quantities only with known compatible endpoints. Retired tasks have no current active finish; show Not applicable with preserved original/promise-at-retirement context, not a fabricated zero delay or completion. Missing evidence yields Unknown/Partial. |

Without B, show “Original baseline unavailable,” not an automatic snapshot of the
current plan. Removing a task from active scope cannot erase its baseline row.
Newly added active tasks show “New since original baseline,” not invented original
dates. Changing labels does not change identity. Report reads and exports never
establish/replace B, increment revision or append fake domain events.

## H02: Retired-task report

Future discoverability requirement: a clearly labelled “Retired tasks” entry in
the authorized history/report workspace, plus a task-detail link when applicable.
It must be available without toggling a chart layer or finding an offscreen table
action. Future controls need keyboard access, labels and clear empty/Partial states.
These are acceptance requirements for later UI authorization, not a navigation
change in this package.

The row unit is a **retirement episode**, keyed by retained task ID + immutable
Retire decision ID. Default view is currently Retired / Latest episode per task.
Explicit controls can include restored tasks or all episodes without duplicating
a single episode when multiple successors/paths refer to it.

| Row data | Source and rule |
| --- | --- |
| Task ID and name | Retained identity; show current name and label retirement-time name from before.task separately if different. No name-based join. |
| Retirement date | Recorded decision effectiveDate, labelled date-only, with recordedAt separately. Unknown is a qualified display value when evidence is unavailable, never a date inferred from status, logs, baseline or the query clock. |
| Recorded actor | Available Attribution label/source; otherwise “Actor unknown.” A recorded label is not authenticated identity. Do not fill from Git configuration/current user. |
| Rationale and episode | Complete recorded rationale, decision ID, prior decision ID, review ID, recorded revision and any linked event ID/sequence. No silent truncation. |
| Current lifecycle and episode resolution | Current Active/Retired at the query watermark, separately from whether this particular retirement was followed by a linked Restore. Show the restoring decision/date or qualified Unknown. A task retired again can have an older resolved episode. |
| Archived relationships | Both incoming and outgoing removed-edge episodes, stable archive IDs/endpoints, revision/review/rationale and restoration references where recorded. Never union archives into the active DAG. |
| Reviewed successor outcomes | Whole deduplicated affected set, each final outcome, preserved unaffected/confirmed predecessors and qualified plan/fact/reference. Link the complete scope review without expanding every payload into the normal editor. |
| Coverage and source links | Available before-context, original B row, lifecycle/review/archive/event references, current head fingerprint and Partial/Unknown warnings. A null historical event reference remains unavailable, not a fabricated event. |

For valid `/2` lifecycle records the mandatory effective/recorded retirement dates
are present. Report-level Unknown rendering **does not relax those wire fields**
or license an invalid Retired record. Unsupported/missing retirement evidence is
not converted into a valid episode. A baseline-only absent task can show Unknown
scope explanation in the comparison but does not enter the retired report as an
inferred retirement. Broader legacy bridges would require separate compatibility
review; no new Unknown variant is added to LifecycleDecision here.

Filters: exact task IDs, explicit retirement effective-date or recording-date basis
(inclusive from/exclusive until), include-undated choice, current lifecycle at the
watermark, episode resolution (restored/unrestored/unknown) and latest/all episode
scope. Recording order uses recorded revision then immutable decision ID as a
stable tie-break; expose linked event sequence when available without inventing it.
The change log itself remains ordered by its existing event sequence. Wall-clock
timestamps and names never select latest lifecycle state.

Pinned pagination binds these filters/sort to the accepted ref and lifecycle
summary through the query watermark. Later restores/retirements cannot change
classification halfway through the pages. An expired view fails explicitly. This
does not require reconstructing every old schedule or opening arbitrary past heads.

## H03: Change log, display and export requirements

Provide task/type/date-filtered access to available explanatory events, rationale,
recorded/effective dates, correction links and stable decision/review/archive IDs.
Cross-link retirement and restoration to their matching lifecycle definitions and
ScopeReview; identical repeated definitions must resolve consistently. Show old
superseded/retracted evidence as history rather than rewriting it. Empty matching
pages with Partial coverage do not certify “nothing happened.”

The future normal Gantt hides retired tasks by default. An explicitly authorized
user-controlled Show Retired toggle reveals labelled historical rows/details with
known retirement markers and separately known actual markers. It must not draw a
planned-start-to-retirement work bar, add phantom dependency constraints, alter
current calculation inputs or automatically restore archives. Original B overlay
still means original commitment; promise at retirement must have its own label.
A restored task has one normal active row; prior episodes remain history. Toggle
state is presentation-only, not part of `/2`, its digest or accepted project state.

Logical report exports must include report kind/generation time, project lineage,
accepted revision/full fingerprint, query/record watermark, B identity if relevant,
filters/date basis/order and coverage/limitations. Rows include stable task/episode/
decision/review/archive/event IDs needed for cross-reference, complete rationale
and explicitly qualified missing values. Retain date precision and distinguish
planned slots, remaining person-hours and recorded-only actual totals. All pages
come from one pinned view. Repository routing/session/receipt tokens are excluded.
Export medium and UI delivery are deferred; these logical columns are not new
portable project fields. A report is not a complete project backup or named
immutable schedule snapshot. No CSV/PDF/report exporter is delivered here.

## H04: Worked example 1 — original B versus retired task

**Illustrative acceptance example, not production output or a runtime test.**
Fictional lineage P-REPORT has first baseline B1, Monday–Friday / four planned
slots per day. B1 records T7 “Prototype,” duration 6 slots, start 2026-11-02 hour 1,
finish 2026-11-03 after hour 2. T8 originally depends on T7. At accepted revision
10, T7's entered duration is 8 slots and W3 retains an explicitly reviewed later
promise. Status is In Progress, Known Actual Start 2026-11-02 (date only), current
completion Unknown, stored remaining effort 5 person-hours. Two recorded work hours
are not proof of complete actual effort.

At revision 11, decision L11-T7 retires T7 effective 2026-11-05, recorded
2026-11-06, actor label null, rationale “Prototype removed from delivery scope.”
Review SR11 explicitly schedules T8 without T7, with a future floor on 2026-11-09.
Archive AR11-T7-T8 retains that removed pair. The common-source before-context
preserves the 8-slot input, progress/facts/remaining and W3 promise; B1 stays exact.

Expected comparison: original 6-slot B1 commitment remains visible; current T7 is
Retired with no active finish/forecast contribution. Label the stored 8-slot
estimate/promise as “at retirement,” not original baseline or actual work. Display
Actor unknown, effective/recorded dates separately and current completion Unknown.
No finish date or elapsed-work bar is created from retirement. T8's removed
dependency links to AR11/SR11. B1's T7/T8 graph is not edited.

## H05: Worked example 2 — retirement with many successors

**Illustrative contract exercise using the WP7.4.4c synthetic graph shape.**
P-DENSE has 100 tasks and 1,034 edges; each Ti after T1 includes T1 and up to ten
preceding tasks as predecessors, deduplicated. T1 has 99 unique downstream/direct
successors. Retiring T1 from revision 20 to 21 removes 99 incident pairs; the 935
other edges remain unless a further explicit reviewed choice changes them.

Freeze ref R20/D20. One SR21 review contains T1 plus 99 final successor outcomes,
one per stable ID. Retain 99 separate archive episodes, one subject before-context
and the full approved closure/rationale. Reaching T100 through many paths must not
produce repeated prompts, decisions or report rows for the same episode. The
report row for L21-T1 exposes all archive IDs and one linked scope-review detail;
its change-log links point to the matching TaskRetired and ScopeReview events.
Lifecycle remains independent of the four statuses, including a Complete subject
in the original synthetic study. This is a scope/retention example, not a forecast
delay assertion or a requirement to replay the study.

Alternate concurrency case: another user commits after the R20 draft was opened.
Submission with expected R20/D20 conflicts; none of its current/archives/review/
history group is accepted. Reload the changed head, recompute affected closure and
reconfirm stale successor choices before a new submission. No report may expose
the rejected draft as an accepted retirement. Exact retry after lost acknowledgement
uses the unchanged intent/transaction ID, not a new speculative retirement.

## H06: Worked example 3 — retire/restore and change-log linkage

**Illustrative continuation of P-REPORT, distinct from P-DENSE.**

| Accepted revision / event sequence | Event and stable links | Report consequence |
| --- | --- | --- |
| 11 / 101 | E101 TaskRetired, payload decision L11-T7; priorDecisionId null; review SR11. | Retirement episode L11-T7, source actor unknown; archived AR11-T7-T8 retained. |
| 11 / 102 | E102 ScopeReview SR11, archive AR11-T7-T8 and final outcomes for T7/T8. | Change log and retired row resolve the same review/decision definitions. |
| 12 / 103 | E103 TaskRestored, decision L12-T7, priorDecisionId L11-T7, review SR12; effective/recorded 2026-11-09, recorded label “Faculty review.” | Episode L11-T7 is restored by L12; current lifecycle Active at the revision-12 watermark. Label attribution as recorded, not independently verified. |
| 12 / 104 | E104 ScopeReview SR12 explicitly adds T7→T8 with reinstatesArchiveIds [AR11-T7-T8] and newly reviewed W4. | Original archive remains unchanged; the active pair exists only by this new explicit review. W3/B1 are not restored by assignment. |

A session pinned when revision 11 was current reports T7 currently Retired on
all its pages, even if revision 12 is later committed. A fresh revision-12 session
defaults to no currently-retired T7 row, but Include Restored/All Episodes reveals
L11 with its restoration link. This is bounded query consistency, not a promise
to open every intermediate past project later. If T7 is retired again, create a
new episode/archives; do not overwrite L11 or delete E101–E104.

Original B1 remains identical throughout. Progress/known first start/remaining
stay retained unless explicitly changed in the accepted review. Restore does not
mean Complete, new Actual Start, guessed effort or automatic old-edge activation.
