# Versioned local project files (WP6.4)

## Forecast assumptions and completion context

Project format 5 optionally adds `forecastSettings` (schemaVersion 1, enabled,
classHoursPerStudent, homeworkHoursPerStudent, teamSize, optional asOfDate).
Legacy versions 1–4 load with forecasting unset, never invented capacity.
Only assumptions are saved; computed forecasts rederive on load. New completion
events can retain a valid `committedFinishDateAtCompletion`; old completions without
it show unknown historical timing. Neither field enters the original baseline.
Malformed settings/context reject the whole import/save before changing the open
project or saved record. Original-format backups include WP6.3 format 4, and
overwriting a version 1–4 save requires explicit migration confirmation.
See [forecast calculations and limits](../forecast/README.md).

## Format 5 and explicit migration

The reader accepts project schemaVersion 1 (WP4–WP5.2), 2 (WP6.1), 3 (WP6.2/6.2.1), 4 (WP6.3), and 5 (WP6.4).
Every new Save/Save As and normal Export JSON writes version 5, with optional
`baseline`, `workTracking` and `taskProgress` sections. All three have their own schemaVersion
1. The baseline contract is unchanged. A format 1 project carrying a baseline,
a format 1/2 project carrying workTracking, or a format 1/2/3 project carrying taskProgress, is rejected rather than silently
losing it. Missing baseline means no baseline; missing workTracking means empty
logs and unknown remaining effort. Missing status defaults to Not Started with no events. Opening does not fabricate tracking history.

Loading is read-only: it preserves the loaded format version in memory and does
not write localStorage. Files offers Export WP5 backup, Export WP6.1 backup or Export WP6.2 backup of
the original loaded inputs, even while invalid current drafts are open. This
compatible backup normalizes known defaults, retains original savedAt and any
original baseline, and omits subsequent edits/work/newly established baselines.
Normal Export JSON downloads format 5 without changing any saved copy. It does
not mark local edits saved.

Saving over a format 1/2/3/4 named record requires migration confirmation, including
header Save. The dialog also offers an original-format backup of the record being
replaced. Cancel keeps that record untouched; Save As with a different name keeps
the old copy. Subsequent header Save to a format 5 record keeps the existing
explicit Save workflow. There is no automatic rewrite on first open. Saving or
deleting another named plan preserves the original JSON objects of untouched
records, including their legacy optional/unknown fields.

The browser library key/envelope remain v1; each plan has its own version. Earlier
pre-WP6 applications cannot read new plans (including a library containing them).
WP6.1 does not preserve workTracking and must use the format 2 backup instead.
WP6.2/6.2.1 cannot preserve taskProgress and should use their format 3 backups.
The WP6.3 version bump prevents new files opening in those older releases. Keep exported WP5 backups
to use with the protected pre-progress release.

See [the baseline contract](../baseline/README.md) for frozen fields, validation
and the separation of Current Plan and Baseline Plan.

## Work tracking section

WP6.3 adds `taskProgress` alongside work tracking, never inside the frozen baseline.
Its schemaVersion 1 contains `definitionOfDone`, a permanent-task-ID keyed `tasks`
map (status, criteria, optional active blockedReason), and ordered `events`.
Each event stores stable event/task IDs, from/to statuses, effective calendar date,
UTC recordedAt, applicable reason/note and, for completion, an acknowledged frozen
criteria snapshot plus project guidance. Completion dates are derived from events.

Missing progress in formats 1/2/3 or 4 means Not Started with no criteria/history
and blank project guidance. Legacy readers cannot preserve these records, so
normal writes use format 5 and migration offers original-format backups. The
reader rejects older-format files carrying progress, invalid statuses, duplicate
event/criterion IDs, orphaned task references, broken transition chains, mismatched
current state, missing reasons or malformed/unacknowledged completion snapshots.
No independent current completion-date field can drift from history. The full
contract and limits are in [task progress](../progress/README.md).

Current progress and historical decisions participate in the dirty fingerprint.
Empty defaults do not make legacy plans dirty. Task duplication copies only
unchecked criterion text with new IDs. Explicitly confirmed task deletion warns
that criteria and history will also be removed; otherwise old completion events
remain unchanged through reopening and later checklist edits. Invalid imports and
failed writes never replace the open project or saved copy.

```json
"workTracking": {
  "schemaVersion": 1,
  "entries": [{
    "entryId": "W-example",
    "taskId": "T1",
    "workDate": "2026-10-28",
    "contributor": "Alex Student",
    "hours": 2.25,
    "description": "Reviewed sources and wrote notes",
    "createdAt": "2026-10-31T21:00:00.000Z",
    "updatedAt": "2026-10-31T21:00:00.000Z"
  }],
  "remainingHours": { "T1": 5, "T2": null, "T3": 0 }
}
```

The map keys and entry task IDs must reference surviving Current Plan tasks;
baseline-only deleted IDs cannot own current work records. Duplicate entry IDs,
unsupported versions, malformed values or orphaned references reject the whole
file before replacement. Missing map key and null both mean unknown; zero is an
explicit estimate. No derived actual total, forecast total or variance is stored.
The reader reconstructs known work fields and validates decimal precision, text,
dates and metadata. The full contract is in [work tracking](../workTracking/README.md).

Save/Load and JSON round trips preserve entry IDs, timestamps, work dates, user
text and estimates, independently of baseline and current scheduling. Task copies
receive no work data. Confirmed task deletion removes only that task's current
work records/estimate; the UI discloses this before confirmation. Manual order and
sort changes do not rewrite work associations. Work records and current estimates
participate in the dirty fingerprint; entry/map order and absent versus null
unknown estimates do not create false dirty changes.

## Source-only schema

```json
{
  "format": "react-gantt-chart",
  "schemaVersion": 4,
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
export includes the normalized metadata in format 5. The storage key and envelope version
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

- createProjectFile(ProjectData, savedAt?) returns a validated version 4 file.
- serializeProject produces readable JSON with a final newline.
- parseProject handles unknown JSON text and returns a predictable success/errors
  union; decodeProject validates an already parsed unknown object.
- projectFingerprint compares canonical source fields, independent of object-key
  ordering, weekday order and predecessor order, plus baseline and work data, for
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
Saving/exporting is disabled until task and effort drafts are saved/cancelled and source fields
are valid. Inline field drafts block save/export until committed or cancelled;
they never replace valid scheduling data on failed validation. Project settings
commit on blur as before. A successful browser save
sets the clean baseline. Export downloads a file without updating a named browser
copy or clearing the local dirty indicator. Imported projects are dirty until saved
locally. Deleting the current named copy makes its still-open model unsaved again.

Load/import/New project warn before replacing changed source or unfinished task,
settings or effort drafts. Cancelling preserves those drafts, including invalid values.
Valid imports are decoded before asking to replace; bad files do not raise a
destructive replacement dialog. The asynchronous reader consults the current dirty
state. A beforeunload handler additionally requests the browser's standard warning
while unsaved work exists; browser behavior varies.

This format does not preserve incomplete invalid drafts, selected task/tab, chart
mode or zoom, perform migrations from future versions, encrypt local copies, or synchronize
multiple tabs. Keep exported backups when moving between browsers/computers.
