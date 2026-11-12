# WP7.3.3a - Compressed weekend Actual marker

Implemented on `feature/wp7-stabilization` from
`c68197a3b706085294808683e55054af374ea484`, client date **2026-11-12**,
America/Regina. Target: classroom-ready Format 5.

Authority: owner's request and sibling primary-worktree requirement
`docs/WP_Req/Bugsys_WP7_3_3a_Compressed_Weekend_Marker.docx`, SHA-256
`7b64f3aa25a853c02a21e433e06088b20d137b5db53f3ee3ef8e8ced80f84d5c`.
Finding **WP7.3.3-UX-01**: correction implemented; **owner acceptance pending**.

## What caused the overlap

For Saturday Nov7 in Compressed mode, both date edges map to the same working-axis
boundary as the end of Friday Nov6/start of Monday Nov9. The previous component
drew a zero-width Actual bracket, a nonworking cross, a collapsed-overrun zigzag
and the word Actual in the same primary lane. The dates/calculations were right;
the superimposed glyphs were confusing. Expanded has distinct calendar cells.

The supplied owner observation says the focused weekend calculations/reporting
passed and Expanded was acceptable, while Compressed presentation was confusing.
This is a specific human observation, **not** acceptance of all WP7.3.3 or WP7.
Historical evidence and earlier acceptance sheets are unchanged.

## Result and bounded change

- An omitted nonworking Actual now has a two-line card: **Actual Sat, Nov7,2026**
  and **+1 calendar day late**, connected to its exact collapsed boundary.
  Label width is schematic, never elapsed time or performed work.
- A wholly collapsed overrun and Actual share one keyboard target, avoiding
  stacked glyphs and duplicate focus stops. Enter/Space retain task selection.
  The accessible name supplies date, saved historical comparison and date-only
  qualification; no hover or color interpretation is required.
- Cards clamp inside the drawing viewport. Correct edge arrows plus existing
  Go to selected/impact reveal offscreen dates. Sunday and other nonworking
  calendars retain their own exact dates; absent reference says Comparison
  unavailable, without invented lateness. Future evidence stays qualified.
- R remains MondayNov9, separate from Saturday Actual and conditional PA.
  Expanded rendering is **byte-identical in SVG and PNG** for the same fixture
  and view at1440 and600 widths. No row size, navigation or date-calculation rule
  changes.

Production changes: [ActualImpactOverlays](../../../src/components/gantt/ActualImpactOverlays.tsx)
and the Compressed-only legend explanation in
[GanttChart](../../../src/components/gantt/GanttChart.tsx).
Focused unit coverage: [CollapsedActualMarker.test.tsx](../../../src/components/gantt/CollapsedActualMarker.test.tsx).
Browser/geometry/source coverage: [weekend.spec.ts](browser/weekend.spec.ts),
[config](playwright.config.ts), [QA typecheck config](tsconfig.json).

## Same-fixture before/after evidence

Fixture: [weekend.json](../../../tests/fixtures/wp733/weekend.json), PA As-of
**2026-11-07**, Day scale; select T1 and use Go to selected in each mode.
Both captures use the same viewport/fixture/actions. Before uses the original
commit archive; after uses the final candidate. Tight crops include Actual and R.

| View | Before | After |
| --- | --- | --- |
| Compressed1440, overlap detail | [Before cluster](evidence/before-compressed-1440-detail.png) | [After labelled boundary](evidence/after-compressed-1440-detail.png) |
| Compressed1440, full chart | [Before](evidence/before-compressed-1440.png) | [After](evidence/after-compressed-1440.png) |
| Compressed600, detail | [Before](evidence/before-compressed-600-detail.png) | [After](evidence/after-compressed-600-detail.png) |
| Compressed600, full chart | [Before](evidence/before-compressed-600.png) | [After](evidence/after-compressed-600.png) |
| Expanded1440, unchanged | [Before](evidence/before-expanded-1440.png) | [After](evidence/after-expanded-1440.png) |
| Expanded600, unchanged | [Before](evidence/before-expanded-600.png) | [After](evidence/after-expanded-600.png) |

See [verification](VERIFICATION.md) for actual commands, geometry and preservation
evidence, and [owner review](OWNER-REVIEW.md) for the short acceptance check.

The correction changes presentation only. PA/FF/CPM, scheduler/calendar, dates,
dependency/status/effort/history/B data, persistence/formats, accepted a/b history
behavior and protected refs are preserved. All 85 existing local edits remain
outside this commit. R07/Format6, RR-01 closure, overall WP7, classroom-pilot
acceptance, merge/tag/release/deployment and the next work package are not inferred.
