# WP6.4 QA01 — Save appears to freeze the browser

## Diagnosis

Reproduced on starting commit `f1004c9` on `feature/wp6-progress-tracking`.
The distinguishing condition is an existing **named saved plan in format 1–4**,
with header Save clicked while Files is hidden (Project Settings or Workspace).
The exact capacity sequence 4 class + 2 homework × 4, then homework 5, reproduces
the problem for a format-4 saved plan. A format-5 saved plan completes normally.
The capacity values are incidental to the failure: the first Save of an older
named copy requires approval to upgrade it to project format 5.

`ProjectStorage.quickSave()` validates the proposed file and reads the saved
library. When the existing saved format is older, it sets `pending` to an
overwrite/migration action and returns **before any write**. `ConfirmDialog`
then calls native `showModal()` in its mount effect. That component previously
rendered inside ProjectStorage, beneath the Files panel (`#panel-0[hidden]`).
The native modal state made the rest of the document inert, while the hidden
ancestor prevented the dialog from being displayed. The user could neither see
the confirmation nor click the surrounding interface.

## Evidence before correction

Automated Chromium tests exercised the same sequence with two small, valid saved
projects, both with all unfinished remaining estimates populated. Instrumentation
was installed in the isolated test page, not in production code or user storage.
It recorded event-loop timer ticks, DOM mutations, storage writes and stringify
calls/timings, long tasks, page errors, dialog geometry/state and the `showModal`
call stack. CDP performance metrics are attached to the test run as well.

| Observation after header Save | Format 4 (failure) | Format 5 (control) |
| --- | --- | --- |
| Active tab | Project Settings | Project Settings |
| Dialog open / native `:modal` | true / true | no dialog |
| Hidden dialog ancestor | `panel-0` | none |
| Dialog width × height | 0 × 0 | no dialog |
| Event-loop timer ticks | 8 | 8 |
| localStorage writes | 0 | 1 |
| Observed JSON.stringify calls | 0 | 46 |
| Total stringify duration | 0 ms | about 0.4 ms |
| Root DOM mutations | 9 | 60 |
| Observed long tasks / page errors | none / none | none / none |

The old-code regression failed because `getByRole('dialog')` could not find a
visible accessible dialog. DOM inspection still found `dialog.open === true`,
`:modal === true`, a hidden ancestor and a zero rectangle. The call stack reaches
`ConfirmDialog.tsx` at `showModal()` through React's mount effect. The development
Strict Mode effect remount in that stack is expected, not a repeating render loop.
Raw recorded observations are in
[wp6-4-qa01-before.json](review/wp6-4-qa01-before.json).

The timer continued to run while interaction was blocked. There was no observed
infinite forecast loop, sustained render storm, recursive serialization or
long synchronous task in this reproduction. Inspection confirms that saves
serialize validated plain project inputs and optional assumptions, not the
derived forecast object or runtime graph/maps. Saving a current-format copy
finishes with a finite update through `savedProject()`. These findings do not
claim performance bounds for arbitrarily large projects; they identify the
reproduced defect without changing engine behavior.

## Smallest safe correction

Render only ProjectStorage's pending confirmation through its existing
`createPortal` import into `document.body`. This removes the hidden Files ancestor
while preserving the active tab, native modal keyboard behavior, original backup
download, migration approval and existing save/serialization functions.

Changed files:

- `src/components/persistence/ProjectStorage.tsx`: portal the existing dialog;
  no changes to save data or approval conditions.
- `tests/save-forecast-qa.spec.ts`: exact capacity sequence for saved formats 1–5,
  instrumentation, visible modal checks, cancellation/backup preservation,
  confirmation, reload and JSON round trips. The format-4 case also retries
  header Save from Workspace after cancelling from Project Settings.
- This report and the raw before-correction diagnostic JSON.

Scheduling and forecast formulas, baseline structure, actual-work records and
project version contracts are unchanged. No new project format or migration
policy is introduced. Legacy originals are untouched until explicit confirmation.

## Verification

- Baseline `npm.cmd run check`: 379 tests across 30 files, lint, typecheck and build.
- Before correction: format-4 reproduction failed on the invisible dialog;
  format-5 control passed.
- After correction: all five targeted format cases passed. Expected capacity
  changes from 24 to **36 person-hours/week**; seven remaining hours finish on
  **2026-11-03** for As-of **2026-11-02** under the existing formula. Reload and
  JSON export/import preserve those assumptions and rederive the same result.
- Final `npm.cmd run check`: **379 tests / 30 files**, lint, typecheck and build.
- Full browser regression: **93 tests** (88 existing plus five QA01 cases).

All browser tests use generated fixtures at `127.0.0.1:4173`, separate from the
owner's `localhost:5173` saved plans. Main remains
`a6a1c32c22a2bf074b161e52d523443602843dd7`; `v1.0-pre-progress` remains tag object
`a4157bc84392c770c27111da58d779948b110a56`, target
`abb85011dafc9fb0876953e3132880e025ef65da`.

## Reproduce and retest

1. Load an existing named format-4 (or older) browser save. Ensure unfinished
   tasks have explicit Remaining Effort.
2. In Project Settings, enable forecasting. Set class hours 4, homework 2,
   team size 4. Change homework to 5 and immediately click header Save.
3. Before correction, the interface appears frozen with an invisible modal.
   After correction, the format-upgrade confirmation is visible over the current tab.
4. Export the offered original-format backup, or cancel/Escape to preserve the
   saved copy. Retry Save and confirm Overwrite saved plan to write format 5.
5. Reload and load that named plan: homework remains 5 and capacity is 36.
   Export/import JSON and confirm the same settings. Subsequent format-5 header
   saves complete directly, without another migration dialog.
