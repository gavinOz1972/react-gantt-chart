# Recommended Gantt and Network presentation

**Proposed design only.** No controls, markers, bars, summaries, axis rules or
Network styles below have been implemented. Policies D01–D09 are Pending in
[OWNER-DECISIONS](OWNER-DECISIONS.md). The rendering must consume the derived
read model described in [IMPLEMENTATION-PLAN](IMPLEMENTATION-PLAN.md), never
perform its own scheduling. See [SCENARIO-MATRIX](SCENARIO-MATRIX.md) for the
sixteen acceptance examples.

## One default-visible design

Keep committed bars at their current dates. Add a small **A** date-only
actual-completion marker and a separate **PA** outline for an affected,
ordinary Not Started successor. These cues appear automatically with valid
relevant progress; they require neither selection nor Show Forecast, Show
Baseline or Highlight Critical Path. Keep existing FF wording and colors.

Use shape, labels and patterns as well as color:

| Layer | Proposed encoding and exact meaning |
| --- | --- |
| Current committed | Existing solid task bar, status presentation, nonworking hatching and dependency links. It remains the maintained plan. |
| Actual completion | Dark marker/bracket spanning the **date cell**, tagged `A`. Accessible label includes exact effective date and “time not recorded.” It is not an actual-duration bar. Late badge is an independent historical comparison. |
| PA | Amber double-outline bar tagged `PA`, in its own lane, for known affected future duration. Tooltip says “Progress-adjusted outlook — conditional” and gives start/finish slots and reasons. No fabricated bar for Unknown. |
| Effort forecast | Existing purple dashed `FF` overlay, optional with Show Forecast; still shared-capacity/person-hour forecasting. Complete's existing FF date marker does not replace automatic actual evidence. |
| Baseline | Existing baseline outline, optional with Show Baseline; no rewritten reference. |
| Committed critical | Existing committed critical style/toggle, explicitly labelled “Committed critical path.” It does not control PA visibility. |

Actual markers use the **entire calendar date** in Expanded mode, without an
hour endpoint. Compressed mode can collapse a nonworking date to a boundary;
use a distinguishable collapsed-date glyph with exact date text, accessible
name and tooltip. Do not snap a Saturday actual fact to a Monday date or
claim its boundary coordinate is an actual finishing hour. Equal-date markers
and FF endpoints stay in separate lanes rather than masking one another.

PA is delay-only in this recommendation. A task with unchanged candidate
coordinates need not get a duplicate outline. A late event with zero
downstream movement still gets its actual marker and zero-impact summary.
An early actual gets the same date-only factual marker, an early-date label
when supported, and no automatic pull-forward of committed work. Historical
reopened completions are marked `A (history; reopened)` and never act as
current readiness. Unknown/conflicted paths get a text `PA ?` indicator and
reason in the row/details, without drawing an imaginary endpoint.

## Layout and collision contract

Current `ROW_HEIGHT=52` and overlay positions (FF near row top, baseline near
bottom) do not have room for independent actual/PA lanes in every combination.
Recommend one shared row-geometry definition, approximately 84px per row,
consumed by bars, labels, link endpoints, row hit areas and virtualization.
Final pixel values are implementation acceptance work, not new domain policy.
Suggested lane order: FF, committed, PA, actual date cue, baseline. Avoid
reusing y=7/43 and silently overlaying new strokes on existing ones.

Maintain enough row-label width for task ID/status and `PA ?`; allow wrapping
in selected details rather than compressing labels beyond readability. Link
routes must retain their visibility and interactive targets. Draw decorative
PA/actual shapes with pointer events disabled; add separate keyboard targets
for the text/marker affordances. Do not paint opaque overlays over committed
bars, link arrowheads, nonworking hatching, selection outlines or focus rings.
Virtualized rows must expose the same facts through selected-task details.

Schematic of **proposed** L03, not a screenshot of implemented behavior:

```text
Dates                           Nov 2     Nov 3     Nov 4     Nov 5
A committed                     [====]
A actual (date only)                                | A |
B committed                               [====]
B progress-adjusted                                          [ PA ]

Completed late: A, 2 calendar days versus saved committed date.
B's committed start precedes A's recorded completion date.
Conditional project outlook: Nov 5 versus current committed Nov 3.
```

The empty span from a committed finish to an actual marker is **not effort**.
If a dotted connector aids discovery, label it calendar-date variance; do not
draw an effort-filled extension or an actual start-to-finish bar.

## Automatic summary near Gantt controls

Place a compact, wrapping, nonmodal calculated summary next to the Gantt
legend/controls. Include a visible `View impact` button that opens the existing
selected-task/details route or a bounded impact list; keyboard users must not
need hover. Update politely without moving focus, panning to another row or
announcing every keystroke. Debounce only presentation if needed; domain
calculation remains deterministic and synchronous within its budget.

Use specific summaries, not a blanket late-project warning:

| Situation | Proposed wording |
| --- | --- |
| L03 confirmed date-order breach | “A completed Nov 4, 2 calendar days after its saved commitment. B's committed start Nov 3 is before that actual date. Conditional project outlook Nov 5 (current committed Nov 3). Uses full scheduled durations and next-working-day readiness.” |
| L01b precision-only shift | “Actual finish time is unrecorded. Conservative date-only readiness shifts B's outlook to Nov 3; a missed same-day start is not established.” |
| L05/L07 absorption | “A completed late. B's outlook shifts; project outlook remains Nov 5 under this model. Existing parallel-work margin absorbs the shift.” |
| L02 leaf | “A completed 1 calendar day late; no downstream tasks. All tasks Complete: actual project finish Nov 3.” Reference current plan separately. |
| L09/L13/L14b Unknown | “Project outlook unavailable: remaining scheduled duration/restart information is missing for A/B.” Display known local impact separately; no definite finish/path verdict. |
| L10 contradictory facts | “Recorded completion order conflicts with a dependency: B Nov 2, A Nov 3. Facts are preserved; project feasibility is unverified.” |
| L14 missing historical snapshot | “Actual Nov 3. Historical commitment unavailable; comparison below is against the current plan.” |

Always identify the PA As-of and start-of-date assumption, separately from FF
As-of. Keep default-status assumptions visible where they affect readiness.
An optional collapse/dismiss affordance can be considered later; first version
retains a persistent compact cue and never allows a new impact to disappear
behind an unrelated overlay toggle. No persisted dismiss state is proposed.

## Exact tooltip and selected-details example

For L03 B:

> B — Progress-adjusted outlook (conditional). Committed: Nov 3, slot 1 to
> after slot 4. Outlook: Nov 5, slot 1 to after slot 4; +8 scheduled slots,
> +2 calendar dates. Readiness: A recorded Complete Nov 4; finish time unknown,
> so the next working date is used. Duration: full 4 scheduled slots. As-of:
> Nov 4, start-of-date. This is not the shared-capacity effort forecast.

For A:

> Actual completion: Nov 4; time not recorded. Saved committed finish at this
> completion: Nov 2. Historically late by 2 calendar days. Current committed
> dates and baseline are unchanged.

Selected details should show all four perspectives, FF separately, active
versus historical event, comparison reference, uncertainty and binding
predecessors/event IDs. Tab/Enter can open these details from an actual marker
or PA label; Escape uses existing panel behavior. Do not introduce a new
status editor, repeated completion action or automatic correction workflow.

## Axis and navigation

Current axis comes from committed project/target limits; late actuals or PA
may lie outside. Recommend deriving a **primary axis union** from committed
coordinates/target plus valid displayed actual dates and known PA endpoints,
with existing bounded padding. Actual/PA bounds are always considered,
regardless of the three existing overlay toggles. FF/baseline retain their
current clipping semantics; they must not control actual/PA discoverability.

Preserve visible date/task anchor when this union changes after a progress
edit or As-of rollover; do not automatically jump to a late task. Provide
offscreen direction cues and `Go to impact` to reveal a chosen row/date on
explicit action. For very distant dates use bounded rendering/virtualization,
not a DOM cell for every elapsed hour. Unknown/out-of-range endpoints get a
labelled warning; do not clamp a fact into an apparently valid date.

Expanded mode shows nonworking hatching; Compressed mode still names the
real nonworking actual date. Hour/day scale changes must not change modelled
slots/dates or turn date-only evidence into an hour claim. Anchor handling
needed for this new union is in scope for its later implementation; general
C10 navigation polish and expanded/fullscreen workspaces remain excluded.

## Network semantics

Keep committed positions, dependency edges and committed CPM independent.
Add text/icon cues for `Actual late`, `PA shifted`, `PA unknown/conflict`
and, where known, an amber dashed **outlook-driving dependency**. Critical
red continues to mean committed zero-slack, including L08's P. PA affected is
not synonymous with critical, and a late ancestor does not make all edges
drivers. Include tied constraints and reason in node/edge details.

For L08, P stays committed-critical while A→B is the conditional outlook
finish driver. First version should **not** say “new critical path,” “projected
zero slack” or “resource critical”: it has no projected backward pass suitable
for date-only/unknown/partial states. Known local drivers may remain visible
with global-uncertainty warnings; no certified whole-project path if other
paths are unresolved/conflicted. No new network layout engine is required.

## Later acceptance (not claimed by this handoff)

Check L01–L16 in both calendar modes, hour/day scales, narrow/wide screens,
zoom/pan/selection and virtualized long graphs. Check all eight combinations
of existing overlay toggles, off-range/nonworking actuals and simultaneous
FF/baseline/PA endpoints. Confirm keyboard labels, focus return, noncolor
meaning, live-summary restraint and no link/hatch obstruction. Require a
small owner review of the actual/PA/FF distinction; automated screenshots
alone do not establish comprehension.
