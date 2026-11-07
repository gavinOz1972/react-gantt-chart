# Open findings and owner decisions

## No calculation/persistence blocker

The requested visual hierarchy can be implemented from existing records and
approved PA results. No change to committed scheduling, PA formulas, effort
forecasting, CPM, baseline/history, statuses, optional logs, file formats or
migration is needed. The prompt's stop-for-owner-decision condition was not
triggered. See [verification](VERIFICATION.md) for source guards.

## Known precision and presentation limits

1. **Actuals are date-only.** Whole-date brackets and date-edge red spans do
   not create an actual hour/start or continuous worked duration. Reference
   snapshot absence stays unavailable. No richer evidence capture is added.
2. **Compressed omits calendar gaps.** A weekend-only overrun has no logical
   working-axis width; the red break symbol and exact date/day count carry
   its meaning. Do not read compressed pixels as elapsed calendar time.
3. **PA remains conditional.** Insufficient started/restart/remaining-slot
   evidence stays Unknown. Conflicting recorded order is preserved; no
   completed successor is moved. Local conditional dates do not certify a
   globally conflicted project. Future-effective evidence is warned.
4. **Accepted versus draft context.** PA/release cues use the accepted plan
   and calendar. Task/calendar edits remain explicit previews until committed;
   their grid can differ from accepted PA, as labelled. This package does not
   redefine preview scheduling or persist a PA context.
5. **Finite view.** Distant dates may be horizontally offscreen while still
   inside the axis. Sticky captions state actual/PA dates; edge cues and Go to
   impact reveal the primary evidence without an automatic viewport jump.
6. **Details are deferred.** Closed details do not mount every task node.
   Lists show50 entries initially and expose the rest through Show more.
   This is a rendering limit, not missing data or a calculation cutoff.
7. **Narrow-screen density needs owner review.** At600px the explanations and
   legend wrap onto several lines, so the chart requires vertical scrolling.
   Captured views have no horizontal page overflow or hidden keyboard targets;
   owner review should judge the reading effort on the actual device.

## Owner UX review remains open

Machine checks establish date/reference integrity, shapes/attributes,
interaction, bounded rendering and nonoverlap assertions. They do not prove
student understanding of red elapsed lateness versus actual effort, or PA
versus commitment. Use the [owner runbook](OWNER-RUNBOOK.md) and
[acceptance checklist](ACCEPTANCE.md) on the owner's screen/device.

No student participant study has been conducted. No human acceptance is
inferred from screenshots or automated passes. WP7.1, WP7.3, WP7.3.2 and
WP7.3.3 remain independently tracked gates. No main merge, protected-tag
change, deployment, rebaseline or WP8 is authorized by this handoff.
