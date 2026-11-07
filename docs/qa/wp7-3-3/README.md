# WP7.3.3 - Historical reality and schedule impact presentation

Bounded presentation correction on `feature/wp7-stabilization`, starting
clean at `70dd0625243de143731f40d5338c6e4d0527ee4c` (WP7.3.2).
Review date: **2026-11-06, America/Regina**.

## Authorization and acceptance

Owner request: "Please implement WP7.3.3." Requirement source:
`react-gantt-chart/docs/WP_Req/Bugsys_WP7_3_3_Historical_Gantt_Presentation.docx`,
SHA-256 `33f332311eccb67803d4beda24cb77bcfc8948aee38b5589c29f0abae6368fac`.
The prompt authorizes this implementation, verification, evidence, commit and
push. It prohibits calculation/persistence changes, main merge, protected-tag
changes, deployment and WP8. No such expansion was required or made.

WP7.3.1 rules/scenarios and WP7.3.2 implementation, known limitations,
verification findings, owner runbook and acceptance materials were reviewed.
This request does not accept WP7.1, WP7.3 or WP7.3.2; their owner gates remain
separate. **WP7.3.3 owner acceptance is Pending.**

## Design and rationale

The former solid committed bar dominated a small actual-date marker. The
default now gives the best supported reported history or conditional outlook
the primary lane, while the current committed schedule remains a subordinate
reference. This changes visual hierarchy, not source records or calculations.

| Recorded/calculated state | Default visible result |
| --- | --- |
| Complete, actual date later than saved historical commitment | Prominent red dotted elapsed-delay extension from the saved historical date edge to the actual date edge, strong whole-date Actual marker, and sticky-row "Completed late +N calendar days" plus exact date. |
| Complete on the historical date / early | Strong Actual marker with on-date/early text; no red extension. |
| Complete, historical snapshot missing | Actual marker and "Historical comparison unavailable"; never infer historical lateness from current or baseline dates. |
| Future-effective Complete relative to PA As-of | Dashed/qualified recorded comparison and Future A, explicit summary warning, required dependent PA Unknown. No observed future finish is certified. |
| Not Started with shifted known PA | Primary 20px conditional PA interval; thin 6px C reference at the original committed position. Nonworking periods remain hatched, not performed work. |
| PA equals commitment | One primary interval labelled PA=C; no needless duplicate interval. |
| In Progress, Blocked, reopened or contradictory evidence | Unknown/conflict cues and labelled uncertain dependencies; no fabricated actual start, restart duration or precise shifted handoff. Reopened completions are marked History. |

The dotted red span is **elapsed calendar-date lateness**, not continuous work,
extra actual effort, scheduled-slot variance, committed criticality or project
delay. A late task still gets this treatment when no successors exist or
parallel margin absorbs the movement. Actual dates remain date-only. Drawing
at visual date-cell edges never creates an actual finish hour.

Expanded shows the intervening calendar dates, including nonworking gaps.
Compressed retains the existing working-slot axis; omitted-date spans can
collapse to a labelled red break symbol. Exact actual dates and calendar-day
variance remain visible in row captions/tooltips. Compressed red width must
not be read as elapsed time or effort; the legend explicitly says so.

## Relationships and layout

- Committed dependencies remain separately focusable dotted references, with
  their original graph/critical flags. They do not assert a new actual handoff.
- A known actual-to-PA relation begins at **R**, the conservative next-working-day
  release bound. A date-to-release dotted association links the recorded date
  to R. For Friday Nov6 on M-F, R is Monday Nov9 H1, never Saturday Nov7.
- Known future PA-to-PA links consume the existing planned PA boundaries.
  Tied predecessor relations remain separate. These are not projected CPM.
- Required Unknown/conflicted readiness gets a labelled `Deps ?` relation
  instead of a falsely precise shifted arrow. Completed successor facts stay
  at their own recorded dates.

The shared row height is 112px: FF near the top; Actual/PA centered at30;
release R at52; current C at68; optional Baseline at84; uncertainty relation
near the bottom. The lanes avoid collisions across all eight overlay toggle
combinations. Current committed critical styling is subordinate with its C
reference, never copied as new projected criticality.

Historical reference dates and relevant release dates participate in the
existing primary-axis union. The existing date-anchor preservation handles
extent changes; no automatic jump is added. Go to impact reveals offscreen
Actual/PA; explicit Go to selected task targets the selected primary position.
Scale/mode controls retain their established horizontal reset policy.
Task IDs, row ordering, selection and bounded row/date rendering remain intact.

## Implementation boundary

`src/timeline/historyPresentation.ts` is a pure presentation adapter. It reads
the existing TaskImpact/ProgressImpact records and calendar utilities to map
historical date spans and release-bound cues. It does not change a finish,
status, graph edge, effort value or file field. Gantt components consume those
coordinates; the new `ImpactRelations` component draws read-only relationships.

The App change only passes the accepted project/calendar to the presentation.
During task/calendar drafts, PA still uses the accepted plan and is labelled
as such; the existing committed preview remains a preview. All source
calculation and persistence modules remain unchanged.

The shared impact summary now names shifted task IDs and future-effective
facts explicitly. Closed detail lists are lazy, and long lists expose 50
entries at a time with a keyboard-accessible Show more action. This prevents
hidden detail DOM from defeating large-chart rendering limits; it changes
neither the result nor the set of available details.

## Visible-state evidence and review

See [traceability](TRACEABILITY.md), [verification](VERIFICATION.md),
[open findings](OPEN-FINDINGS.md), the [15-20 minute owner runbook](OWNER-RUNBOOK.md)
and [separate acceptance checklist](ACCEPTANCE.md). Fictional fixtures are in
[`tests/fixtures/wp733`](../../../tests/fixtures/wp733/README.md).

Representative views: [late Expanded](evidence/01-late-expanded.png),
[all layers Compressed](evidence/10-all-layers-compressed.png),
[absorbed impact](evidence/04-absorbed-expanded.png),
[future-effective](evidence/03-future-expanded.png), and
[collapsed weekend](evidence/08-weekend-compressed.png).
