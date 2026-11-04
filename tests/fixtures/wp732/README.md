# WP7.3.2 disposable review projects

Fictional current-format5 JSON, validated by the unchanged project parser.
Generate with `node tests/wp732/export-fixtures.mjs` from the WP7.3.1
independently specified scenarios. Do not use these to replace a real plan
without first saving/exporting it.

Use the [owner runbook](../../../docs/qa/wp7-3-2/OWNER-RUNBOOK.md). Set the
listed **PA As-of** after each import (full dates below are November2026).
It is a transient view context, separate from saved effort FF settings.

| Files | Scenario | PA As-of |
| --- | --- | --- |
| `late-before-completion.json`, `late-after-completion.json` | L03 before/after; before has T1 In Progress, so B initially Unknown | 2026-11-04 |
| `slack-absorbed.json` | L05, B moves but parallel work keeps project finish unchanged | 2026-11-03 |
| `changed-driver.json` | L08, outlook driver differs from committed critical branch | 2026-11-04 |
| `started-unknown.json` | L09 | 2026-11-03 |
| `blocked-unknown.json` | L14b | 2026-11-03 |
| `reopened-unknown.json` | L13 | 2026-11-04 |
| `conflicting-history.json` | L10 | 2026-11-03 |
| `same-day-precision.json` | L01b | 2026-11-02 |
| `as-of-only.json` | L11b, no dependency from late A to manual root B | 2026-11-04 |
| `nonworking-actual.json` | L12, actual Saturday date preserved | 2026-11-07 |
| `all-layers.json` | L15, baseline3/FF4/PA5 | 2026-11-04 |
| `roundtrip.json` | L16 | 2026-11-04 |

No actual hour, actual start, remaining-slot field, derived PA endpoint or PA
preference is stored. Fixtures deliberately use effective/recorded dates
that can differ from the reviewer's local today.
