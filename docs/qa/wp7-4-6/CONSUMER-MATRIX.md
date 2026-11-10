# Consumer dependency matrix

## Inventory method and scope

[scripts/inventory.mjs](scripts/inventory.mjs) enumerates every `src` file,
hashes and classifies it, builds a TypeScript program, resolves imports and
local call symbols, and records typed property reads with declaration and
call-site lines. Complementary lexical searches cover embedded arrays,
history, baseline, work, status and fingerprints, including comments. The
[machine inventory](evidence/consumer-inventory.json) is the exhaustive
per-call-site/per-field index; the table below groups its consumer contracts.
It avoids treating DOM events or `Object.entries` as status history.

All **116 source files** are classified: **105 TS/TSX files**, **57 modules
in the static import closure of `src/main.tsx`**, **45 test files/utilities**.
That conservative closure includes type-only imports and is not an executed
module count. Remaining files
include styles/documentation and unused capabilities/evaluator. Every file has
a role and SHA-256; there are no unclassified files. Static analysis does not
audit library internals or prove performance. Assessment helpers outside `src`
are reachable only through the test bridge and are not application consumers.

Seven runtime files directly read embedded status/work arrays: App,
TaskStatusPanel, TaskWorkPanel, taskProgress, workTracking, progressImpact and
projectFile. Indirect readers are explicitly listed below. In the machine
index, `imports`, `calls`, `typedFieldReads` and `lexicalMatches` retain exact
locations, including helpers not named in the initial work-package examples.

## Runtime mapping

Line numbers refer to unchanged source at the starting commit. B01/N01/D01
are each parameterized across the 24 [fixtures](PARITY-VECTORS.md). Difficulty
is the prospective integration effort, not authorization to implement it.

| Current consumer / call site | Fields, scan and ordering assumptions | Observable output | Minimal operational/purpose input | Evidence/result; uncovered condition | Difficulty |
| --- | --- | --- | --- | --- | --- |
| [App.tsx](../../../src/App.tsx):80,119,239,249,263 | Whole project fingerprint; current P/tasks/order, B, all work entries, status history, DoD, settings | Dirty/saved identity, guarded load/reset/save | Full repository S remains required; op subset is not S | P01, G03/G04; full identity cannot be reconstructed from op | High |
| App:93–112 | Schedule/CPM, original B, forecast assumptions, As-of/today, statuses, remaining and effort summaries | Current schedule, forecast, health, selected task summary | `loadOperational`, original B purpose read, qualified completion record references | B01/N01/A01/A02; conditional subset parity; PA separate | Medium/high |
| App:137–169,194–213,269–323 | Decode/edit task/work/progress; criteria, current DoD; transition appends event; duplicate starts new current state; delete removes arrays | Editor validation and mutations | No write conversion assessed; full legacy validators still replay histories | G01–G04/G08, P01; new atomic change implementation and semantics unproven | High |
| App:385–432; [DeleteTaskDialog](../../../src/components/DeleteTaskDialog.tsx) | Current task status/criteria, `workTracking.entries` and `taskProgress.events` filtered to selected ID at 432 | Selected controls; delete evidence counts and warning | Current fields plus explicit evidence count query; retirement is a different workflow | G08/D06; target retained records are not legacy delete parity | High |
| [taskProgress.ts](../../../src/progress/taskProgress.ts):28–29 | Missing current record defaults Not Started; `latestCompletion` reverse-scans array, including reopened tasks | Current status; last completion in insertion order, not max date | Current `progress`; current completion reference insufficient for prior episode after reopen | G01/G02, B01; origin/prior episode gaps | Medium/high |
| taskProgress:45–100 `decodeProgress` | Full event replay from Not Started, surviving IDs, unique IDs/criterion ownership, per-task nondecreasing recordedAt (ties legal), attestations and snapshots, final-state consistency | Validated frozen progress or specific error | Cannot replace with partial op map plus a few events; needs validated source/full legacy boundary or separately approved validator | G06/G09, B01; generic payload is not an attestation decoder | High |
| taskProgress:103–139 transitions/criteria/duplicate/remove/fingerprint | Current global DoD and snapshots; full replay; remove filters events; fingerprint maps complete ordered events | Accepted edits, immutable completion snapshots, dirty identity | Current DoD absent in op; preserve writer/fingerprint | G03/G08/P01; no editing integration | High |
| [forecast.ts](../../../src/forecast/forecast.ts):42,60,68,100 | P/calendar, active dependencies/order, remaining, current status; last completion date for completed output; settings, B and today | Capacity, availability/start/finish, zero/unknown states and project forecast | Op inputs + original B + bounded referenced complete record (qualified payload) | B01/N01/A01/A02/G07; 22 exact, 1 retired population difference, 1 missing-completion gap | Medium |
| [settings.ts](../../../src/forecast/settings.ts) and [ForecastSettingsForm](../../../src/components/forecast/ForecastSettingsForm.tsx) | Schema 1, enabled, class/homework/team, optional fixed As-of, caller's local today | Validated assumptions and weekly availability | `forecastAssumptions` with legacy decoder; do not use session expiry as As-of | A01/N01; automatic/fixed preserved; form edits unconverted | Medium |
| [healthPresentation.ts](../../../src/progress/healthPresentation.ts):25–43; [ForecastSummary](../../../src/components/forecast/ForecastSummary.tsx) | Current statuses/blocked reason, remaining, forecast, baseline/current commitment and latest completion | Blocked, Unknown, At Risk/Late/Complete markers and qualifications | Op current facts + same qualified completion evidence and existing forecast | B01/N01/A01/A02; future-completion semantics retained, generic payload gap | Medium |
| [progressImpact.ts](../../../src/projection/progressImpact.ts):34–47 and replay/propagation below | Calls `decodeProgress`, then groups/scans full events; prior completion even after reopen, actual-start Unknown, current criteria/status, missing-record origin, commitments, As-of/calendar | Actual/PA dates and slots, reopen/assumed flags, warnings, causal driver relationships | Qualified prior-completion ref/origin/DoD validation policy; eventual evaluator boundary for Known starts | B01/G01/G02/G05–G07; **projected PA unproven** in all cases | High |
| [TaskStatusPanel.tsx](../../../src/components/progress/TaskStatusPanel.tsx):21–24 | `progressForTask`, `latestCompletion`, all selected events `.filter(...).slice().reverse()`; reason/note/attested checklist/DoD | Status, last completion, transition rows and historical attestation | Current controls unchanged; task-filtered `queryHistory(sequenceDesc)` with typed payload, explicit coverage | D01/D02/D03/D04 and component 3 cases: conditional row parity, generic payload/partial UI not implemented | Low/medium read-only; high editing |
| [DefinitionOfDone](../../../src/components/progress/DefinitionOfDone.tsx), [TaskStatusControl](../../../src/components/progress/TaskStatusControl.tsx), [StatusTransitionDialog](../../../src/components/progress/StatusTransitionDialog.tsx) | Current global DoD, criteria and blocked reason; existing callbacks invoke validated transition with complete/reopen acknowledgement and remaining review | Editing, completion/reopen confirmation | Current guidance plus atomic transition contract; old callbacks remain | G03/P01, existing tests; no production transformation, mutation parity unproven | High |
| [workTracking.ts](../../../src/workTracking/workTracking.ts):validation,81–103 | Full entry validation; edits replace current entry; removal filters; per-task recorded sum in hundredths; chronological sort workDate/createdAt/ID | Recorded-only actual sum, effective remaining, EAC and baseline variance; selected logs | `recordedWork` sums + remaining/current status + B for arithmetic; distinct work-detail query for logs | B01/N01/G04/G08; aggregate conditional match, selected logs gap | Medium/high |
| [TaskWorkPanel.tsx](../../../src/components/TaskWorkPanel.tsx):32–48,113 | `effortSummary`, `chronologicalEntries`, current entry lookup, map/filter corrections/retractions; contributor, description, createdAt, updatedAt | Optional recorded log UI, edit/delete, sums, completeness qualification | Work-log details/order/correction identity purpose contract missing; aggregate op alone insufficient | G04 and component 2 cases; 1.75 h recorded does not prove complete actual hours | High |
| [RemainingEffortField](../../../src/components/RemainingEffortField.tsx) and App task controls | Current remaining hours, Complete effective 0, unknown null; local draft input | Quick remaining review, completed stored estimate retained | `remainingHours` plus current progress; save remains legacy | B01/N01/A02; no calendar deduction; control mutations not converted | Medium |
| [scheduler](../../../src/domain/scheduler.ts), domain calendar/CPM/validation | P weekdays, hours/day, durations, predecessors, independent starts; no status/work event dependency | Slot boundaries, working dates, slack and critical relationships | Op project + activeTasks; active population must be intentional | A01/A03/B01/N01; dense100 all 1,034 edges; retired differs by population | Low for pure inputs |
| [baseline.ts](../../../src/baseline/baseline.ts), [BaselinePanel](../../../src/components/BaselinePanel.tsx) | Original immutable B contains project/tasks/schedule; known-field decoder, establish/compare | Original commitment and comparison, never latest edited input | `readOriginalBaseline` pinned reference; keep complete raw value outside arithmetic projection | B01/N01/G10; no-baseline explicit; opaque round-trip not proven by known-field decoder | Medium |
| [GanttChart](../../../src/components/gantt/GanttChart.tsx):175,192 and [overlays](../../../src/timeline/overlays.ts) | Derived schedule/B/forecast; display dates/slots; no independent history replay | Baseline/forecast marker descriptions | Same derived outputs and immutable B | B01/N01; marker strings exact on 22; SVG/pointer UI remains unchanged-app regression | Medium |
| [ActualImpactOverlays](../../../src/components/gantt/ActualImpactOverlays.tsx), [ImpactRelations](../../../src/components/gantt/ImpactRelations.tsx), [ProgressOverlays](../../../src/components/gantt/ProgressOverlays.tsx), [historyPresentation](../../../src/timeline/historyPresentation.ts) | PA dates/state/warnings, driver relationships, completion/commitment provenance, display scale/viewport | Actual/overrun/PA layers, primary/subordinate marks, captions and extents | Qualified PA results, not arbitrary rehydrated events | B01 captures captions/date extents; G01/G05/G07; **projected visual meaning unproven** until PA gap closed | High |
| Network layout/view and timeline geometry/viewport modules | Current tasks + CPM relationships; Gantt derived dates and display scale; selected task and geometry | Nodes/edges/critical classification, navigation | Same active graph/derived results; no history query | B01/N01/A03; node/edge classification compared; SVG paths and interactions not new-integration proof | Low/medium |
| [ProjectStorage](../../../src/components/persistence/ProjectStorage.tsx):62,77,103,112,126; [projectFile](../../../src/persistence/projectFile.ts):24–80 | Full decode/create/parse/serialize/fingerprint; formats 1–5; schema 5 writer; work/status arrays and complete B | Save/load/export/import, whole-file validation and dirty meaning | Full S/legacy codec stays intact; partial op cannot be serialized as a full file | P01, G03/G04/G10; existing compatibility/browser checks; portable `/2` Unsupported | High |
| [localProjects](../../../src/persistence/localProjects.ts) + [planInputs](../../../src/persistence/planInputs.ts):41 | Single library key; reads/validates all saved plans, untouched raw records retained on explicit write; schedule validates full inputs | Saved plan list, corruption/quota protection and full save | No storage replacement evaluated; preserve full raw records and source backups | Existing suite + P01; no lazy full-S claim | High |

## Other source groups and completeness reconciliation

- `taskManagement.ts` selectors/order/duplicate origins and task/project editor,
  predecessor picker and navigation components use current task fields and
  callbacks. They add no history scan. Effects of lifecycle population must
  still preserve selection/order and avoid phantom dependency edges (D06).
- `hooks/useLocalDate.ts` and `localDate.ts` update caller-supplied local today
  on midnight/focus/visibility; these are clocks, not event replay. Timeline
  viewport hooks and selection callbacks operate on derived values. Automatic
  As-of is covered by A01; session expiry is a different concern.
- `src/planning/workingPlan.ts` is an **unused evaluator**, with legacy
  `decodeProgress` at 77 and event scans around 132. It cannot bypass the same
  history/DoD gap. Its existing evaluator/contract tests remain; assessment
  does not wire it into App or declare target W semantics implemented.
- `src/repository/*` production ports are **unused capabilities**; reference
  adapters/fixtures are test-only. No App import or runtime provider exists.
  `ProjectRepository<S>` retains full load/commit semantics.
- All 45 test/fixture/setup files are individually classified and indexed,
  including status/progress-impact/work/forecast/history-presentation tests,
  domain fixtures, persistence/evaluator/conformance suites and the new bridge.
  Tests intentionally pass full legacy arrays; they are not runtime readers.
  The bridge imports two suite entry points and transitively reaches the six
  test-only helpers. Their dependency graph never enters the 57-module static
  App closure.
- The enumerated source tree has **no runtime report/PDF engine or meeting
  route**. Earlier meeting workflows are documentation. There is no report
  parity result to assert. No Redux/event-bus/history subscription mechanism
  was found: App owns React state and passes derived values/props/callbacks.
- Non-executable source documents/styles and type-only contracts are hashed
  and classified too. Pure graph/geometry/formatting modules are accounted for
  by reachable imports even when they have no lexical history match.

No history consumer is left unexplained within this source tree. The claim is
source exhaustiveness and bounded characterization, not proof of every input
combination, external-library behaviour or all future port implementations.
