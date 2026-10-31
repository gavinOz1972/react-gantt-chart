# Versioned local project files (WP6.1)

## Format 2 and explicit migration

The reader accepts project schemaVersion 1 (WP4–WP5.2) and 2 (WP6.1). Every new
Save/Save As and normal Export JSON writes version 2, with an optional `baseline`
section. A baseline uses its own schemaVersion 1. A version 1 project carrying a
baseline is rejected rather than silently losing it. Missing baseline in either
supported format means no baseline; loading and saving do not establish one.

Loading is read-only: it preserves schemaVersion 1 in memory and does not write
localStorage. Files offers Export WP5 backup of the original loaded inputs, even
while invalid current drafts are open. This compatible backup normalizes known
WP5 order/sort defaults, retains the original savedAt and omits current edits and
any subsequently established baseline. Normal Export JSON downloads format 2
without changing any saved copy. It does not mark local edits saved.

Saving over a format 1 named record requires migration confirmation, including
header Save. The dialog also offers Export saved WP5 backup of the record being
replaced. Cancel keeps that record untouched; Save As with a different name keeps
the old copy. Subsequent header Save to a format 2 record keeps the existing
explicit Save workflow. There is no automatic rewrite on first open. Saving or
deleting another named plan preserves the original JSON objects of untouched
records, including their legacy optional/unknown fields.

The browser library key/envelope remain v1; each plan has its own version. Earlier
application releases cannot read v2 plans (including a library containing them).
Keep exported WP5 backups to use with the protected pre-progress release.

See [the baseline contract](../baseline/README.md) for frozen fields, validation
and the separation of Current Plan and Baseline Plan.

## Source-only schema

```json
{
  "format": "react-gantt-chart",
  "schemaVersion": 2,
  "createdBy": "React Gantt Chart",
  "savedAt": "2026-10-31T05:00:00.000Z",
  "project": {
    "projectId": "P1",
    "name": "Semester plan",
    "projectStartDate": "2026-11-02",
    "targetEndDate": "2026-12-18",
    "workingWeekdays": [1, 4, 5],
    "workingHoursPerDay": 3
  },
  "tasks": [
    {
      "taskId": "T1",
      "name": "Research",
      "description": "Source notes",
      "durationHours": 5,
      "predecessorTaskIds": [],
      "independentStartMode": "MANUAL",
      "requestedStartDate": "2026-11-05"
    }
  ],
  "nextTaskNumber": 2,
  "manualOrder": ["T1"],
  "sortMode": "manual",
  "duplicateOrigins": {}
}
```

savedAt is UTC provenance metadata only. It is not a scheduling date. createdBy
identifies the format producer; it is not an authenticated author signature.
All source scheduling fields use the existing date-only/weekday/whole-hour types.
DEFAULT tasks omit requestedStartDate. MANUAL tasks retain it even while dependent.
nextTaskNumber preserves the allocation sequence, including previously deleted
IDs, and must exceed every existing numeric T ID. Imported nonnumeric stable IDs
are preserved. Safe integer exhaustion blocks new IDs while keeping existing work
editable/exportable.

WP5 adds optional fields to the existing schema 1 reader. Missing manualOrder
defaults to the file's existing task array order; missing sortMode defaults to
manual; missing duplicateOrigins defaults to an empty map. Opening an older file
does not rewrite its stored browser copy. A subsequent explicit Save/Save As or
export includes the normalized metadata in format 2. The storage key and envelope version
stay unchanged, and old task IDs, retained dates and ID counters are preserved.

manualOrder must be an exact permutation of surviving task IDs. sortMode is one of
manual/start/name/duration. duplicateOrigins maps each surviving copy ID to the
original ID, which may already be deleted. Numeric origins must also be below
nextTaskNumber; origins cannot equal their copy. Deleting a copy removes its own
origin entry; deleting an original keeps references from surviving copies. Sorts
never rewrite manualOrder or the source task array. Source task-array position is
not task identity. Malformed metadata rejects the entire import/save atomically.

Current-plan fields never need derived schedule, critical analysis, chart positions, selection,
Gantt/network mode or zoom. Unknown extra fields, including embedded calculations, are
ignored and dropped. The optional baseline alone stores validated frozen schedule
slots/completion. The reader reconstructs known source records, then asks WP1
to validate dates, calendar, IDs, estimates, predecessors, cycles and approved
earlier-date policies. App recalculates the schedule and critical path on opening.

## APIs and validation

- createProjectFile(ProjectData, savedAt?) returns a validated version 2 file.
- serializeProject produces readable JSON with a final newline.
- parseProject handles unknown JSON text and returns a predictable success/errors
  union; decodeProject validates an already parsed unknown object.
- projectFingerprint compares canonical source fields, independent of object-key
  ordering, weekday order and predecessor order, plus the optional baseline, for
  unsaved-change tracking. The explicit snapshot therefore marks the plan dirty.
- acceptsProjectFile checks .json extension or JSON MIME type and file size.

Malformed content, incompatible format/version, missing/wrong field types, invalid
provenance or reusable/unsafe ID counters are rejected before replacement.
Source date/graph/value failures use WP1 machine-readable codes and actionable
messages. File errors include INVALID_JSON, INVALID_FORMAT, UNSUPPORTED_VERSION,
INVALID_STRUCTURE, INVALID_PROVENANCE, INVALID_ID_COUNTER, INVALID_FILE_TYPE and
FILE_TOO_LARGE. WP5 also reports INVALID_MANUAL_ORDER, INVALID_SORT_MODE and
INVALID_COPY_METADATA. Portable imports/exports have a 10 MiB limit.

Imported content is treated only as data. It is never evaluated, executed or used
as a URL. A failed parse or validation leaves open source state and browser saves
unchanged. JSON import uses a user-selected local file; export uses an in-browser
Blob download. No telemetry, accounts, backend, remote persistence or network API
is involved.

## Named browser library

localProjects.ts accepts an injected StoragePort, rather than reading browser
globals in pure file/domain code. The UI uses localStorage under the single key
react-gantt-chart:projects:v1:

```text
{ schemaVersion: 1, projects: [{ name, savedAt, plan: ProjectFile }, ...] }
```

Named saves are case-sensitive, trimmed, explicit and sorted for display. Saving
with Save As under an existing name requires overwrite confirmation. Header Save
explicitly updates the current known saved identity without a second naming step.
For an unnamed/imported plan it routes to Files/Save As. Delete requires explicit
confirmation and affects only that browser copy. Updates reread the current
library and preserve other named records. Storage is per origin (including port)
and browser profile. Reload starts a new in-memory plan; choose Saved plans/Load
project to reopen a named copy. There is no automatic save or reopen.

Storage failures are reported as STORAGE_UNAVAILABLE, STORAGE_FULL or STORAGE_CORRUPT.
Failed writes do not claim success or change the open model/clean-state baseline.
Last known saved-plan choices remain available after a write failure. Damaged or
incompatible library data is not erased or overwritten automatically. Browser
cleanup/private browsing can remove copies; JSON is the portable backup path.
Browser storage has no cross-tab merge or collaboration protocol.

## Editing and replacement safeguards

Save task accepts a form draft; Save/Save As persists the complete accepted source.
Saving/exporting is disabled until task edits are saved/cancelled and source fields
are valid. Inline field drafts block save/export until committed or cancelled;
they never replace valid scheduling data on failed validation. Project settings
commit on blur as before. A successful browser save
sets the clean baseline. Export downloads a file without updating a named browser
copy or clearing the local dirty indicator. Imported projects are dirty until saved
locally. Deleting the current named copy makes its still-open model unsaved again.

Load/import/New project warn before replacing changed source or unfinished task/
settings drafts. Cancelling preserves those drafts, including invalid values.
Valid imports are decoded before asking to replace; bad files do not raise a
destructive replacement dialog. The asynchronous reader consults the current dirty
state. A beforeunload handler additionally requests the browser's standard warning
while unsaved work exists; browser behavior varies.

This format does not preserve incomplete invalid drafts, selected task/tab, chart
mode or zoom, perform migrations from future versions, encrypt local copies, or synchronize
multiple tabs. Keep exported backups when moving between browsers/computers.
