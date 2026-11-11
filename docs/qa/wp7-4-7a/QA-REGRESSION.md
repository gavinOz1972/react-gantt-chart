# QA7.4.7-002 and UX regression evidence

## Diagnosis before correction

An isolated archive of reviewed commit
`07faed745d66502033ab7a60ac9dfc612512fe8f` ran the existing synthetic QA preview.
No new UI files were overlaid on that original source. Four capture checks
asserted the old heading/banner and captured three screens plus a typed source
matrix. These are independent automated observations, distinct from the owner's
manual test notes recorded in [OWNER-DISPOSITION](OWNER-DISPOSITION.md).

[source-state-before.json](evidence/source-state-before.json) shows:

| Source/task | Typed result | Matching first-page rows |
| --- | --- | --- |
| Format 1 without progress, T1/T2/T3 | Unavailable, Partial coverage metadata | 0 each |
| Normal format 5, T1 | Available, Partial | 20, continuation present |
| Normal format 5, T2 | Available, Partial | 2 |
| Normal format 5, T3 | Available, Partial | 0 |

The adapter did **not** misclassify Unavailable as Available-empty. In the
original UI, however, an unavailable screen led with a prominent **Partial
coverage** banner, schema/provenance text and then a long unavailable
explanation. The hierarchy competed with the important distinction. The new
presentation chooses Unavailable before empty or a Partial-evidence note;
Unavailable's Partial metadata remains in History details. No source data,
availability rule or read adapter was changed to manufacture a new result.

| Evidence | Before | After |
| --- | --- | --- |
| Retained rows / summary hierarchy | [Original](evidence/before-rows.png) | [Student summary](evidence/after-rows.png) |
| Available zero rows, T3 | [Original](evidence/before-empty.png) | [Exact empty primary](evidence/after-empty.png) |
| Unavailable, T2 | [Original](evidence/before-unavailable.png) | [Exact unavailable primary](evidence/after-unavailable.png) |
| Optional context/provenance | Originally always prominent | [Entry context](evidence/after-entry.png), [technical details](evidence/after-details.png) |

## Automated correction checks

New direct UI tests independently verify the primary message, recovery action
and optional diagnostic content for Available-zero, Partial-zero, Unavailable,
invalid, expired, oversized and mixed states. The production legacy reader
always qualifies coverage as Partial; Available-zero and Partial-zero tests
exercise availability and coverage independently, without inventing a new
Complete coverage contract.

Unavailable T1/T2/T3 each produce exactly **History unavailable.**, never the
empty primary or the available-Partial note. Normal T3 produces exactly
**No recorded history for this task.** with one visible Partial qualifier.
Full metadata stays collapsed until requested. Invalid retry starts a fresh
read but does not claim to repair the same invalid source.

The original 19 feature checks were updated for the authorized copy/disclosures
and continue to test 43-row paging, stable tie order, reopened completion, blocked
reason, selection/source changes, cancellation, safe fallback, saved bytes,
unfinished draft, status/remaining/forecast/baseline/work and formats 1–5. Their
screenshots are redirected into this package during the combined run, preserving
the earlier committed evidence. Twelve new browser checks cover this hierarchy,
local timezone/UTC distinction, exact primaries and layout at 780/1280/1440px.

Visual review found wrapped, readable controls/labels and distinct empty versus
unavailable screens. [780px](evidence/after-app-780.png),
[1280px](evidence/after-app-1280.png) and
[1440px](evidence/after-app-1440.png) show the actual 40-task panel. Automated
checks retain Duplicate visibility and prohibit horizontal document overflow.

The source reason is unchanged. Reasons longer than 160 characters show a short
excerpt and the full wording inside the entry disclosure; tests verify escaping
and unchanged source bytes. Effective dates use a UTC calendar rendering of the
existing date-only value. Recorded local time includes a timezone; exact ISO/UTC
and all retained fields remain in History details.

## Human correction gate — still open

- [ ] Owner compares unavailable T2 with normal empty T3 and sees the distinction.
- [ ] Owner accepts the primary/context/technical hierarchy for COMP 214 tasks.
- [ ] Owner confirms keyboard, readable dates, reason/context and narrow layout.
- [ ] Owner decides whether to close QA7.4.7-002 and UX7.4.7-001.

Automated passes and screenshot review do not close either item. Record the
owner's decision in [OWNER-DISPOSITION](OWNER-DISPOSITION.md).
