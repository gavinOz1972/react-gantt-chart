# Overall WP7 release readiness

**Recommendation: further stabilization before declaring overall WP7 ready.**
The current implementation passes its automated checks and supports the basic
semester planning workflow. There is no newly demonstrated calculation, Save or
persistence blocker in this assessment. Human acceptance and target-device
evidence are incomplete; R07 production integration remains unqualified.

An owner could separately authorize a bounded classroom pilot of the existing
format-5 application after accepting its limits and completing the review checks.
That choice would not require shipping every R07/future enhancement, and would
not imply final R07 or general WP7 release acceptance. No pilot or deployment is
started here.

## Capability and reliability evidence

All source paths below are relative to the worktree root. The fresh full suite
and browser logs are in [verification](VERIFICATION.md); references to old owner
observations or qualification are identified separately.

| Concern | Current behavior and evidence | Release qualification |
| --- | --- | --- |
| Scheduling/calendar | `src/domain/scheduler.ts`, calendar tests; whole working slots, nonworking weekdays and dependency propagation. `tests/gantt.spec.ts`, `project-entry.spec.ts`, `week-header.spec.ts`. | Existing rules tested; no change proposed. Planned duration/working slots are not person-hours or actual elapsed work. |
| Dependencies and critical path | `src/domain/criticalPath.ts` and tests; `tests/wp4.spec.ts`, `dependency-scroll.spec.ts`, WP7.3.2 impact/browser cases. | DAG validation, drivers/slack/highlights covered. Archived edges/retired populations do not exist in the running model. |
| Task management | `src/components/TaskTable.tsx`, task-management tests; `tests/wp5.spec.ts`, `tests/wp73/corrections.spec.ts`. Sticky Actions/Duplicate, order, inline/form editing and selection. | QA71-005 has a concrete correction and fresh regression coverage. Current Delete removes task work/status records; use exports before destructive revisions. Not target retirement. |
| Four work statuses/criteria | `src/progress/taskProgress.ts`, status controls; `tests/task-status.spec.ts`, WP7.3 correction cases. Completion attestation and reopen review; Complete has zero effective remaining without erasing its stored estimate. | Zero remaining alone does not mark Complete. Logging stays optional; no fifth health status. Human comprehension acceptance is separate from these tests. |
| Remaining/work records | `src/workTracking/workTracking.ts`, `TaskWorkPanel.tsx`; `tests/work-tracking.spec.ts`, `remaining-quick-entry.spec.ts`. One-time initial estimate seed; explicit later reviews. | Remaining is student-entered person-hours, not automatically reduced by elapsed days/logs. Totals are recorded data of unknown completeness. Old work correction/retraction history may not survive. |
| Forecast/availability | `src/forecast/forecast.ts`, `settings.ts`, `src/projection/progressImpact.ts`; `tests/forecast.spec.ts`, `save-forecast-qa.spec.ts`, WP7.3.2/3 cases. Capacity, fixed/automatic As-of, missing effort/blocked/Unknown qualifications. | Fresh Save/reload/export/import checks pass. Current forecast completion-release semantics and dated PA semantics differ deliberately pending separate review; do not unify formulas here. Assumptions require student review. |
| Actual impact and Gantt/network | `src/projection/progressImpact.ts`, `ActualImpactOverlays.tsx`; `tests/wp732/progress-impact.spec.ts`, `tests/wp733/historical-gantt.spec.ts`, network viewport checks. | Actual completion is date-only; conservative next-workday release and Unknown starts/reopened gaps remain qualified. Accepted plan versus unsaved preview, compressed gaps and Go to impact/selected need owner comprehension checks. |
| Baseline | `src/baseline/baseline.ts`; `tests/baseline.spec.ts` and cross-feature round trips. Deliberately frozen first known-format baseline survives edits/deletes. | No baseline rewrite here. Existing known-field codec is not arbitrary opaque-B preservation for future `/2`. No newly approved baseline or capture is invented. |
| Save/load/JSON/local library | `src/persistence/projectFile.ts`, `localProjects.ts`, storage UI; `tests/wp4.spec.ts`, `save-forecast-qa.spec.ts`, WP7.3.3 legacy round trips. Reader 1-5/writer 5; current file cap 10 MiB. | Explicit local browser persistence, not automatic cloud/team storage or cross-tab CAS. Quota/corrupt/blocked paths report errors. Keep external copies; no real user files or local browser library modified by this assessment. |
| History | `src/history/featureFlag.ts`, loaded-legacy reader and `SelectedTaskHistory.tsx`; 38 fresh feature-on browser checks. Owner accepted b recovery feedback on November 11. | Opt-in DEV only; production retains legacy history. Already-loaded legacy data, truthful Partial/Unavailable, bounded presentation. Not lazy physical repository I/O, full audit, exact historical replay or a `/2` export. |
| Usability/accessibility | Sticky actions, scrollable predecessors, keyboard/focus/error feedback and responsive chart tests; 223 default-off browser checks. Historical WP7.2 evidence and WP7.3/3.2/3.3 runbooks. | Automated Chromium checks and owner b review do not prove screen-reader, touch, all-browser or managed student-laptop suitability. Older independent owner acceptances are still unrecorded. |

## Semester-team workflow

Students can create a calendar and task graph, deliberately freeze B, review
remaining effort/status, adjust capacity, inspect forecast/impact/critical-path
information and save/export revised plans. Those operations are covered by
synthetic automated regression tests, including reopened/Complete/Unknown cases
and legacy round trips. Forecasts remain conditional on students supplying
truthful, current estimates; optional logs cannot prove total actual effort.

For a pilot, designate one authoritative working copy and a person responsible
for each save/export and review. Agree how the team exchanges copies, checks
As-of/capacity/remaining and retains backups before deletion or revision. The
application does not implement shared concurrent editing, permissions, server
backups or conflict-free merging. Multiple same-name copies are not a safe
collaboration protocol. This workflow guidance does not add a product feature.

Current formats cannot establish a known Actual Start, accepted independent W,
guided successor retirement review or complete retained change audit merely by
saving. Where those are essential to the course workflow, R07 integration is a
release prerequisite. If ordinary planning/progress estimates suffice, those are
future capabilities rather than defects in the supported legacy application.
Course suitability must therefore be decided against an explicit release scope.

## Evidence limits and decision

WP7.4.7b has supplied owner acceptance. The WP7.1 assessment and WP7.3,
WP7.3.2 and WP7.3.3 human acceptance sheets do not contain equivalent recorded
sign-off. Later implementation requests are not retrospective signatures.
The owner can resolve these independently, document scope conditions or explicitly
accept a limitation; this assessment cannot do so on the owner's behalf.

The current registry audit reports **10 moderate development-tool dependency
findings, zero production findings, zero high/critical findings**. This is current
evidence, replacing the old QA71-003 count for triage; it is not an automatic
security waiver. No dependency update or npm audit fix ran.

Recommended exit criteria: record the older human dispositions; validate a
representative semester project on supported student hardware/browser with
keyboard and required assistive technology; settle development-tool risk;
and name whether release scope is existing format 5 or R07-integrated. For the
latter, pass the additional gates in the [R07 sheet](R07-DECISION-SHEET.md).
Use [OWNER-REVIEW](OWNER-REVIEW.md) for independent choices. A green test suite
does not authorize merge, tagging, deployment or the next work package.
