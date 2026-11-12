# WP7.3.3a - owner acceptance pending

Finding **WP7.3.3-UX-01** has a focused implementation and automated evidence.
Preparing this checklist does not close the finding or accept WP7.3.3a.
The earlier owner report of correct weekend calculations and acceptable Expanded
view remains attributed in [README](README.md); it is not extended to this fix.

Use your stabilization server or start a free port from this worktree:

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Open the printed URL for this worktree. Use a disposable browser context and the
fictional [weekend.json](../../../tests/fixtures/wp733/weekend.json); retain any
real plan/export before replacing it. No restart or real-plan test is performed
by this handoff. Set **PA As-of2026-11-07**, choose Day, select T1, then Go to
selected task after changing mode or scale.

1. Compressed: find the card **Actual Sat, Nov7,2026 / +1 calendar day late**.
   Its leader anchors the omitted weekend boundary. Distinguish Friday's saved
   commitment, Saturday Actual, MondayNov9 conservative R and the successor PA.
   Card width does not mean work or calendar duration.
2. Tab to the card and press Enter/Space. Its accessible name/selected details
   must reveal the same date and meaning. R/PA and current committed reference
   remain separate; no exact actual finish hour is implied.
3. Try a narrow window and Hour/Week scale, using existing Go to selected/impact
   if the date is offscreen. The card's two lines should remain readable.
4. Compare Expanded with [the unchanged capture](evidence/after-expanded-1440.png).
   You need not repeat the already supplied weekend calculation test or the full
   old WP7.3.3 runbook just to review this correction.

- [ ] Compressed weekend completion is understandable at a glance, without overlap/clipping.
- [ ] Exact date and calendar-day lateness are readable and accessible.
- [ ] R and successor PA remain distinct and correct.
- [ ] Expanded meaning remains unchanged; automated regression evidence accepted.
- [ ] No unrelated behavior, release action or historical-data change is observed.

Decision: [ ] Accept WP7.3.3a / close WP7.3.3-UX-01
[ ] Accept with conditions [ ] Further correction required

Owner/date: ______ Reviewed commit: ______ Conditions/observations: ______

All boxes remain pending. Acceptance of this focused correction does not imply
acceptance of WP7.3.3, RR-01, WP7, the classroom pilot or R07. Already accepted
WP7.4.7a/b remain closed and are not reopened or retested by this owner route.
