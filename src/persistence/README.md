# Version 1 local project files

## Source-only schema

```json
{
  "format": "react-gantt-chart",
  "schemaVersion": 1,
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
  "nextTaskNumber": 2
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

Files never need derived schedule, critical analysis, chart positions, selection,
view mode or zoom. Unknown extra fields, including embedded calculations, are
ignored and dropped. The reader reconstructs known source records, then asks WP1
to validate dates, calendar, IDs, estimates, predecessors, cycles and approved
earlier-date policies. App recalculates the schedule and critical path on opening.

## APIs and validation

- createProjectFile(ProjectData, savedAt?) returns a validated version 1 snapshot.
- serializeProject produces readable JSON with a final newline.
- parseProject handles unknown JSON text and returns a predictable success/errors
  union; decodeProject validates an already parsed unknown object.
- projectFingerprint compares canonical source fields, independent of object-key
  ordering, weekday order and predecessor order, for unsaved-change tracking.
- acceptsProjectFile checks .json extension or JSON MIME type and file size.

Malformed content, incompatible format/version, missing/wrong field types, invalid
provenance or reusable/unsafe ID counters are rejected before replacement.
Source date/graph/value failures use WP1 machine-readable codes and actionable
messages. File errors include INVALID_JSON, INVALID_FORMAT, UNSUPPORTED_VERSION,
INVALID_STRUCTURE, INVALID_PROVENANCE, INVALID_ID_COUNTER, INVALID_FILE_TYPE and
FILE_TOO_LARGE. Portable imports/exports have a 10 MiB limit.

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
under an existing name requires overwrite confirmation. Delete requires explicit
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

Save task accepts a task draft; Save project persists the complete accepted source.
Saving/exporting is disabled until task edits are saved/cancelled and source fields
are valid. Project settings commit on blur as before. A successful browser save
sets the clean baseline. Export downloads a file without updating a named browser
copy or clearing the local dirty indicator. Imported projects are dirty until saved
locally. Deleting the current named copy makes its still-open model unsaved again.

Load/import/New project warn before replacing changed source or unfinished task/
settings drafts. Cancelling preserves those drafts, including invalid values.
Valid imports are decoded before asking to replace; bad files do not raise a
destructive replacement dialog. The asynchronous reader consults the current dirty
state. A beforeunload handler additionally requests the browser's standard warning
while unsaved work exists; browser behavior varies.

This first-release format does not preserve incomplete invalid drafts or UI layout
state, perform migrations from future versions, encrypt local copies, or synchronize
multiple tabs. Keep exported backups when moving between browsers/computers.
