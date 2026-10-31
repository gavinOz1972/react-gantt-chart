# Original approved baseline (WP6.1)

`establishBaseline(inputs, baselineId, establishedAt, existing?)` is pure. Its
caller supplies the identifier/timestamp; neither influences WP1 calculations.
Shared `decodePlanInputs` validates source structure, IDs, order/copy metadata and
delegates scheduling rules to the unchanged WP1 engine. A valid nonempty plan is
required. An existing baseline returns BASELINE_EXISTS. A completion after target
is allowed and captured as calculated, without moving work to meet the target.

The readonly `Baseline` contract contains:

| Field | Content |
| --- | --- |
| schemaVersion | 1 (independent of project file version 2) |
| baselineId, establishedAt | Nonempty ID and strict ISO UTC timestamp |
| project | Identity/name, start/target, working weekdays/hours |
| tasks | Permanent IDs, names/descriptions, hours, predecessor IDs, DEFAULT/MANUAL provenance and retained requested dates |
| nextTaskNumber | Historical allocation floor, including previously deleted IDs |
| manualOrder, sortMode, duplicateOrigins | Original comparison context; manual order includes each frozen ID exactly once |
| schedule.tasks | Original scheduled records: ID/predecessors, occupied start slot, exclusive finish boundary, start/finish date |
| schedule.projectCompletion | Original exclusive overall completion boundary |

The result is a deep copy of known validated fields, recursively frozen at
runtime and recursively readonly in TypeScript. Caller-owned objects/arrays are
neither shared nor frozen. Task deletion, dependency changes, reordering and
calendar changes in Current Plan cannot mutate the snapshot. Frozen inputs and
outputs stay authoritative for the original plan; current chart/task state uses
the existing current schedule as before.

`decodeBaseline(unknown)` validates version, metadata, required display context,
inputs and nonempty schedule independently of Current Plan. It verifies each
stored calculated record against WP1 using the frozen calendar/tasks, comparing
structure/values independently of object key order. Missing, extra or inconsistent
calculated fields reject the snapshot with actionable baseline-specific errors.
It returns a fresh frozen copy; it never substitutes current calculated outputs.
Project decoding additionally requires matching project identity and a current
ID allocation counter no lower than the frozen counter. Baseline tasks may be
absent from Current Plan after deletion.

Only Project Settings exposes Establish Baseline, with a one-time confirmation
and task/settings draft validation. Once established, View Baseline offers a
summary and read-only task table in original manual order. Export JSON includes
all baseline fields. Establishing marks the open plan unsaved; local Save/Load
and JSON Export/Import preserve both layers. New/load resets per-document UI
state and loads only the baseline present in that file. No autosnapshot, baseline
edit/delete/replace or multiple versions are provided.

This is an integrity-checked local planning snapshot, not a digital signature or
authenticated approval audit. Re-baselining policies, work entries, actual effort,
statuses, completion history, forecasts, variance and progress visuals are deferred.
