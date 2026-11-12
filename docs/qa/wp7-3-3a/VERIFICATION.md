# WP7.3.3a verification

Base `c68197a3b706085294808683e55054af374ea484`;
`feature/wp7-stabilization`; client date2026-11-12, America/Regina.
All projects/browser contexts used for testing are synthetic. The user's real
plan, saved library and existing server are not operated on.

## Final commands and results

| Command | Result / evidence |
| --- | --- |
| `npm.cmd run check` | Lint, typecheck, **864 unit/component tests in44 files**, production build pass; [log](evidence/check.txt). Six new component cases. |
| `node node_modules/typescript/bin/tsc -b docs/qa/wp7-3-3a/tsconfig.json --pretty false` | QA browser/helper/config typecheck pass; [log](evidence/qa-typecheck.txt). |
| `npm.cmd run test:e2e -- --config docs/qa/wp7-3-3a/playwright.config.ts --workers=3` | **9 passed**; [log](evidence/focused-browser.txt). |
| `npm.cmd run test:e2e -- --workers=3` | **223 passed**; [log](evidence/baseline-browser.txt). |
| `npm.cmd run test:e2e -- --config docs/qa/wp7-4-7b/playwright.config.ts --workers=3` | **38 passed**, existing feature-on history regression; [log](evidence/feature-browser.txt). No new acceptance decision. |
| Original archive: focused config `--grep 'reference screenshots' --workers=2`, `WP733A_CAPTURE=before` | **2 passed** before captures; [log](evidence/before-browser.txt). |
| Original archive: focused config `--grep 'narrow day scale' --workers=1` | **Expected1 failure**, missing new readable Actual card/accessibility label in the unchanged original; [log](evidence/regression-before.txt). This is a reproduction control, not a final-candidate failure. |

Node24.19.0/npm11.17.0; existing installed dependencies retained. No install,
upgrade, audit fix or format migration ran. Final browser suites use Chromium,
America/Regina, three workers/no retries. The package adds no scheduling,
forecasting, persistence or task-status test expectation changes.

## What the focused checks prove

- Required SatNov7 actual, saved FriNov6 comparison and **+1 calendar day**;
  MondayNov9 R/PA relationship retains its prior result.
- At600px, Hour/Day/Week geometry asserts separated text boxes, both lines inside
  the card/drawing, and card above the separate R glyph. Geometry values:
  [Hour](evidence/layout-hour.json), [Day](evidence/layout-day.json),
  [Week](evidence/layout-week.json). No assertion infers elapsed time from width.
- Keyboard Enter/Space task selection, one target for wholly collapsed overrun
  plus Actual, noncolor text and accessible meaning. SVG edge cues preserve
  the recorded date when outside the viewport.
- SundayNov8 shows +2days at the same compressed boundary. A calendar with
  M/Th/F preserves WedNov11 actual, +5 calendar days against the saved Friday
  reference and ThuNov12 R. Missing historical reference shows unavailable,
  without invented lateness. Future actual stays visibly qualified.
- All8 overlay combinations retain label geometry. JSON export after view/keyboard
  activity equals the fixture apart from the intentional export timestamp;
  B/history/status/estimates/settings are not rewritten.

The before/after screenshot routes use the same actual fixture, widths1440/600,
Day scale, T1 selection and Go to selected. Expanded complete chart PNGs and
SVG drawings are **byte-identical** before/after at both widths. Images were
visually inspected, including the previous overlap and final narrow card.
Hashes/source scope are in [scope-audit.json](evidence/scope-audit.json).
Screenshot inspection and automation are not owner UX acceptance.

## Isolation and preservation

Before source is an archive of the original commit under
`output/wp7-3-3a-verification/before`; final broad-browser source is its isolated
`candidate` copy plus exactly the scoped implementation/test files. Dependencies
are shared by junction; servers4173/4175/4176 and synthetic browser storage are
owned by the tests. Old suites write older artifact paths only in that copy,
protecting all85 original local edits in this worktree.

Every pre-existing tracked file was fingerprinted before work. The only permitted
existing source changes are ActualImpactOverlays.tsx and GanttChart.tsx; the new
component test and this QA package are separately listed in the audit. Domain,
PA/FF/CPM, data models, baseline/history, persistence, package/lock/application configuration,
old QA evidence and accepted a/b records remain unchanged. No application-level
row-height/axis/selection behavior change is made. Local and remote main/protected
tags are checked before/after the feature-only push.

## Development diagnostics and residual limits

The first narrow before probe left Monday outside the initial viewport; using
the existing Go to selected route made the paired evidence consistent. The first
test-helper parameter initializer needed an explicit options type. Early geometry
checks found a real1px text-box overlap, corrected by separating the baselines;
the release check was refined to measure its glyph rather than its connector.
Screenshot cropping was corrected to viewport coordinates. One original-source
probe initially contended for4176 and was rerun separately; the delivered control
log demonstrates the actual missing readable marker. Final tests above pass.

Cards use a fixed schematic width inside the current drawing; distant dates still
need existing navigation, and the date/time precision remains date-only. Exact
calendar labels carry meaning when multiple omitted dates share one boundary.
No student/assistive-technology study or owner acceptance is claimed. Other
WP7.3.3 limits/earlier acceptance gates remain independent. WP7.3.3-UX-01 awaits
the [owner's decision](OWNER-REVIEW.md); no next implementation/release begins.
