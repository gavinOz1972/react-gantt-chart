# WP7.3.2 — Progress-adjusted scheduling and Gantt visibility

Implemented on `feature/wp7-stabilization`, starting from WP7.3.1
`284a7f921790473c26f5248cefdfe11584d03c5d`. Required WP7.3 commit
`b09aae181589167889710b8992e3a82df35dd2b8` remains in history.

## Authorization

Owner request: “Please implement 7.3.2.” The saved requirement is
`react-gantt-chart/docs/WP_Req/Bugsys_WP7_3_2_Implementation_Prompt.docx`, SHA-256
`22706bfe95f6b1691bb0a4c0fa6bbf7e5efc399807fde8824fd8ff6323c73a11`.
It explicitly authorizes D01–D09 with its stated conditions, implementation,
verification, commit and push. This is the later bounded authorization
anticipated by WP7.3.1's design gate; the old Pending design decision sheet
remains a historical record. WP7.1 and WP7.3 owner checks remain independently
outstanding. WP7.3.2 acceptance is Pending.

All six WP7.3.1 design documents were reviewed. No main merge, protected-tag
change, deployment, rebaseline or WP8 work is included.

## Result

Completion decisions now immediately recalculate a separate dependency/calendar
outlook and update the Gantt's automatic actual-date markers, affected PA
outlines, Unknown cues and project summary. No overlay toggle, navigation or
refresh is required. Actual facts retain date-only precision; their next
working date releases future dependent work. Ordinary Not Started work uses
full committed scheduled slots, a commitment floor and an explicit As-of
floor. Started, blocked and reopened paths with missing slot evidence remain
Unknown. Contradictory actual ordering is exposed, never repaired.

The visible PA As-of defaults to local today, is independent of FF As-of and
is not saved. Late actual versus saved historical commitment, confirmed
committed date-order breach, conservative successor movement, As-of movement,
absorbed margin and conditional project finish have separate meanings.

Gantt retains committed bars/links/hatching, optional baseline/FF and committed
critical styling. New A/PA lanes use the shared 84px row geometry. The axis
includes actual/known PA extents independent of the existing three toggles.
Extent changes preserve the visible date; Go to impact reveals offscreen
work on explicit action. Existing scale/mode reset behavior is preserved;
general C10 navigation changes remain excluded.

Network retains committed CPM and layout, adding affected/Unknown text and
parallel dashed outlook-driving constraint cues. These are not projected CPM.
Selected task details provide exact dates, binding predecessors/event IDs,
assumptions and the current project outlook. Keyboard targets and noncolor
labels accompany the visual cues.

## Architecture and boundaries

- `src/projection/progressImpact.ts`: pure explicit-input calculation and
  descriptions; reuses existing validation, topological order and calendar
  utilities. No remaining person-hours, team capacity, React or clock input.
- `src/components/gantt/ImpactSummary.tsx` and `ActualImpactOverlays.tsx`:
  read-only derived presentation. `App.tsx` owns the transient PA context and
  memoized calculation; Gantt/Network consume the same result.
- `src/timeline/projection.ts`: coordinate extent union and common row height;
  no scheduling formula moved into coordinate mapping.
- Tests use the pre-implementation WP7.3.1 hand answers, source invariants,
  compatibility round-trips and owner-observable browser behavior.

Existing committed scheduling, calendar mathematics, forecast formulas,
committed CPM, baseline capture, progress event schema, optional logs,
formats1–5, serializers and dependency/configuration files have no source
changes. PA endpoints/reasons/preferences are derived and never persisted.
Original owner checkout/data/server are not operated on by these tests.

See [traceability](TRACEABILITY.md), [verification](VERIFICATION.md), the
[15–20 minute owner runbook](OWNER-RUNBOOK.md) and
[separate acceptance checklist](ACCEPTANCE.md).

## Known limits

PA is a conditional calendar/dependency outlook, without resource levelling.
Date-only actuals deliberately ignore same-day handoff; an outline is not
proof of an observed real-world delay. No actual starts/hours, remaining-slot
entry, blocked restart capture or projected backward CPM pass is added.
The project result is withheld when required evidence is Unknown or
contradictory, even when useful local candidate dates remain available.

Historical lateness needs the active event's saved reference; old files may
lack it. Current plan is never substituted. Future-effective completions
relative to PA As-of remain facts in the file with an uncertainty warning in
this outlook. The model does not reconstruct historical calendar versions or
historical project-wide commitment at completion.

Default today advances with the local calendar. To reproduce a prior result,
provide the same PA As-of externally after reload/import. Browser performance
and Node benchmarks are observational on this host; owner/student usability
acceptance is separate from automation. No student participant study or
physical classroom-laptop benchmark is claimed.
