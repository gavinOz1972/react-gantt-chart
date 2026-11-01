# Task status, completion criteria and decisions (WP6.3)

This model is independent of WP1 schedule inputs, baseline snapshots and WP6.2
person-hours. Its optional `taskProgress` section belongs to project format 4:

```text
{
  schemaVersion: 1,
  definitionOfDone: string,
  tasks: { [permanentTaskId]: { status, criteria, blockedReason? } },
  events: [{ eventId, taskId, fromStatus, toStatus, date, recordedAt,
             reason?, note?, criteriaSnapshot?, completionAcknowledged?,
             noCriteriaAcknowledged?, definitionOfDone? }]
}
```

Only Not Started, In Progress, Blocked and Complete are accepted. Missing task
records mean Not Started, no criteria or active reason. Missing progress means no
history and blank guidance. Reading never invents completion/work/status events.

`transitionTask` takes explicit IDs, effective date and UTC recording metadata.
Ordinary transitions record an event. Blocked requires a 3–500 character reason.
Leaving Blocked clears only the active reason; the earlier event retains it.
Complete requires explicit acknowledgement and every current criterion checked.
With no criteria, an additional explicit acknowledgement is mandatory. The UI
routes dropdown Complete and Mark Complete through the same confirmation.

The confirmation can manually check criteria but cannot replace their IDs/text or
remove them to bypass assessment. Its accepted checks become the current checklist
and an independent completion-event snapshot. The event also retains the selected
date, optional note/evidence (up to 1,000 characters) and the project Definition
of Done guidance at that moment (up to 2,000 characters). These date-only effective
dates may be historical; future completion dates give a UI warning and remain as
chosen. UTC recording time is metadata, never a scheduling input.

Leaving Complete requires explicit reopening confirmation and a 3–500 character
reason, whether the target is Not Started, In Progress or Blocked. For Blocked the
reason also explains its active blocking condition. Old completion events and
snapshots remain untouched. Reopening retains the checklist, which can then be
edited before another distinct completion event. A completed checklist is read-only
until reopening. No change to work, remaining effort or elapsed dates infers status;
completing or reopening never resets those independent measures.

Each criterion has a stable ID, 3–500 characters of trimmed text and an explicit
boolean checked state. IDs are at most 120 characters. Current IDs must be unique
across tasks; historical snapshots may retain an old/deleted criterion ID only
under its original task. Copies receive new IDs and unchecked text only, starting
Not Started without history/reason/work. Ordinary task editing and sorting do not
change association. Criteria checking/editing does not itself create status events.

`decodeProgress` validates structure, enums, references, text/date limits and all
events, then replays each task's chain from Not Started. IDs are unique, recording
times are ordered per task, from/to statuses differ, and current status/reason
must match replay. Completion snapshots are checked and acknowledged; a currently
Complete checklist must match its latest attestation. Effective dates need not be
monotonic, allowing deliberate historical corrections without inventing clock time.
Known records are copied and recursively frozen. No caller-owned input is mutated.

`replaceCriteria`, `duplicateProgress`, `removeTaskProgress`, `progressForTask`,
`latestCompletion` and `progressFingerprint` centralize current-data operations.
Completion date is derived from the latest completion event. Confirmed task
deletion removes that task's current progress/history only after the existing
dialog explicitly discloses the loss and recommends exporting first. No orphaned
references are retained; baseline records and other task decisions stay intact.

Task Details exposes status, blocked reason, latest completion date, checklist
CRUD/check controls and expandable read-only history. Task-table status is compact;
the selected chart summary has the same compact status control and transition
confirmation rules. Criteria/project-definition drafts
survive tab/task navigation and join the existing unsaved/replace safeguards.
Definition of Done is guidance, not generated or automatically enforced criteria.

The history records local user decisions, not authenticated identity, timesheet
approval or tamper-proof audit evidence. There is no Ready for Review state,
percentage control, schedule forecast, automatic completion or graphical progress
bar. WP6.4/WP6.5 remain separate future work packages.
