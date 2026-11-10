# FR-HIST-01 — User-Initiated Project Snapshots (deferred)

**Registered future requirement only. Not implemented, not part of the current
wire profile, and not authorization for a new feature.** Source: WP7.4.4d section 4,
owner request dated 2026-11-09, America/Regina.

Students or faculty may explicitly capture a named, immutable snapshot of the
current **accepted** project schedule at a selected time, with optional rationale
and available attribution. Capture is opt-in; no automatic snapshot on every edit,
Save, import or report generation is approved. Selected snapshots could enable
chosen historical schedule comparisons without reconstructing every intermediate
schedule or requiring a general event-replay engine.

## Distinct meanings

| Artifact | Meaning and boundary |
| --- | --- |
| First original baseline B | Existing proposed immutable original commitment; may be Absent and never replaced by later captures. |
| Authoritative current snapshot | Current complete accepted /2 value; the word snapshot in its profile does not implement named historical captures. |
| Explanatory change log | Append-only available changes/reasons/provenance, with truthful Partial/Unknown. Not a sequence of complete saved schedules. |
| FR-HIST-01 named snapshot | Future explicit immutable accepted-state capture, separately identified and attributed, with comparison/storage/permission rules still to design. |
| Internal derived checkpoint | Hypothetical acceleration cache for exact replay; not a user-named capture, not an original baseline and not a near-term feature under D03. |
| Report or ordinary exported file | A read-only projection or portable copy; neither automatically registers a named capture or rewrites baseline/history. |

## Required separate design and decision

1. Assign its own future WBS item and explicit owner authorization. This package
   registers the requirement ID, not a reserved implementation phase or start date.
2. Define immutable capture identity, lineage, source accepted revision/full D,
   interpretation, recording time/precision, optional rationale and honest available
   attribution. Names are display labels, not identity or overwrite keys.
3. Define capture consistency under concurrent edits: pin one accepted head, reject
   or explicitly handle a stale capture request, and distinguish dispatch time,
   accepted source time and effective comparison date. Do not capture a half-edited
   draft or falsely backdate a schedule. Exact retry/uncertain outcome semantics
   require a specific contract before storage is chosen.
4. Decide whether to include inputs, calculated schedule under pinned rule versions,
   accepted W, actual/completion facts, progress, remaining, forecast assumptions/
   outputs and source context. Missing facts remain Unknown. Current formulas must
   not silently reinterpret a saved schedule years later.
5. Define comparison meanings against B/current/other captures, retired task identity,
   changed graphs/calendars, precision, unavailable data and Partial context.
6. Define per-project count/size limits, retention and deletion policy, storage cost,
   permissions for student/faculty capture/access, naming conflicts, copies, backup
   and recovery. Do not infer unlimited retention or implement automatic checkpoints.
7. Review complete export/import compatibility, immutable baseline guards, canonical
   integrity scope, capacity/reopen path and source preservation. Adding capture
   fields to `/2` or changing D requires an explicit profile/version proposal and
   migration review. No container, field, schema number or profile is chosen here.
8. Obtain concrete acceptance/concurrency/cost tests and owner review before any
   model/codec/provider/UI work; obtain separate integration/release authorization.

The registration of FR-HIST-01 changes no baseline, accepted project revision,
portable field, repository method, historical coverage or checkpoint policy.
No implementation or future approval is inferred from this document.
