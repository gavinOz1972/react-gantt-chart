# WP7.4.7a UX decision sheet

Review performed before UI changes under the
[Bugsys UX Advisor charter](../../ux/BUGSYS-UX-ADVISOR.md). Target: COMP 214
students inspecting what changed in a selected task, when and why.

| Finding | Authorized decision | Observable acceptance |
| --- | --- | --- |
| UX7.4.7-001: provenance dominates task history | Primary row: Changed from X to Y, friendly effective date, recorded reason; no IDs/schema/raw timestamps in the primary row | T1 reopened and T2 blocked are understandable before opening technical details |
| Context competes with the summary | Per-entry More about this change, collapsed; retains full reason/note, recorded local time plus exact UTC, historical completion guidance/checklist/attestation | Opening a historical completion preserves original wording and never changes current status |
| Technical evidence still needs access | Separate History details, collapsed; source/version, exact times, event/source-position/decision IDs, actor, coverage and diagnostics remain accessible | No metadata discarded; Unknown values remain explicit in details |
| QA7.4.7-002: Unavailable resembles empty | Trace actual typed state for synthetic unavailable T1/T2/T3 and available-empty T3 before correction; assert separate primary messages | Exactly History unavailable. versus No recorded history for this task. |
| Partial coverage is over-emphasized | One Some earlier history may be unavailable note beside available evidence, including empty partial results; full explanation in History details | Not repeated per row or at end; incompleteness never hidden by disclosure |
| Failure text exposes internals or implies repair | State-specific short message; invalid source uses Retry reading history, not an implied repair; expiry/mixed use Refresh history | Primary text/actions and optional diagnostics independently verified |

Example primary row: **Changed from In Progress to Blocked** · Nov 5, 2026 ·
Waiting for review. Exact recorded UTC, source position and unknown actor belong
deeper. Reasons and notes stay plain escaped text. Effective dates have no
invented time; recorded local time is labeled with its timezone.

Project-wide baseline comparisons, change logs, retired-task reports, health
and period reporting stay outside this task panel and this package.

Accessibility: native details/summary for both disclosure levels; Show/Hide
expanded state and focus preserved; readable date labels, wrapping at laptop
widths, truthful empty/error messages, keyboard paging and no displaced actions.

The owner must review the resulting UI and unavailable/empty distinction.
Neither finding is self-closed by implementation or automated checks.
