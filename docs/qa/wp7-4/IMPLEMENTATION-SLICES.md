# Later implementation slices and acceptance boundaries

**Planning only. Do not start these slices from WP7.4 design authorization.**
Owner decisions must name the approved policy IDs, contract and slice scope.
Each slice needs a separately reviewable commit and appropriate checks; no
slice implicitly authorizes the next or a release/deployment.

## Dependencies and blocking decisions

| Slice | Required decisions | Proposed bounded result / acceptance |
| --- | --- | --- |
| S0 Contract freeze | P01-P12, including P09 storage and P11 evidence lifecycle | Resolve field types, baseline guard, planned floor semantics, completion references, concurrency support and which perspectives consume new commitments. No ambiguous root-manual or PA shortcut. |
| S1 Versioned evidence/storage foundation | P02/P03/P06/P09/P11, frozen contract | New decoder/replay for start records/corrections/retractions, v6 file reader/writer/fingerprint, isolated v2 saves and original-format copy/backup. Legacy readers, v1 bytes, baseline and formats1-5 fixtures protected. Invalid/partial journals rejected atomically; quota/crash/stale-writer tests. No guided UI yet. |
| S2 Pure working-plan evaluator | P01/P04-P07/P12 | All-task planned floors, strict-next-working-day actual releases, all-predecessor evaluation, early hold-by-default and Unknown for started/blocked/reopened without remaining slots. Keep baseline's legacy interpreter. Independent scenario answers, permutation/tie/range/cycle tests. No new effort/CPM formula. |
| S3 Transaction coordinator | P08/P09 plus S1/S2 | One candidate document, deterministic dirty queue, decisions and explicit unresolved outcomes, consolidated diff, validate/save/publish with idempotent transaction ID. Cancel, invalid source/date, save failure and crash have the specified invariants; no hidden partial writes. |
| S4 Guided completion/Actual Start UI | P02-P08, S3 | One accessible surface, late keep/sever, early keep/advance, actual-versus-planned inputs, baseline/reference details, reason gates, previous/next, narrow layout, focus/discard/retry. Current completion criteria and reopening effort rules retained. |
| S5 Consumers and minimal Gantt | P10/P12, approved S2 reference contract | One truthful primary representation, date-only actuals, Unknown endpoints, working commitment qualification, optional history/PA/FF and unchanged View Baseline. Explicitly label legacy-plan CPM or separately scope new analysis. No erased lateness or fabricated starts/finish hours. |
| S6 Integration/owner acceptance | All approved slices | Formats1-6 save/reload/export/import, capacity Save regression, all existing checks, both axis modes/scales, eight overlay combinations, real keyboard flow,30/40 tasks, dense/long chains, performance observations and owner walkthrough. Earlier acceptance gates remain independent. |

S1 is not permission to ship an unusable partly upgraded workflow. Keep
unfinished behavior unavailable until its whole approved vertical path is
integrated and verified. The implementation package must decide its delivery
boundaries and recovery path, rather than leaving partially required fields
to be filled by future commits.

## Proposed communication between concerns

```text
Accepted document + explicit review date + completion intent
              |
              v
Pure draft commands -> candidate + issues + affected IDs
              |
              v
Pure working evaluator / queue / preview read model
              |
        user confirms all changes
              v
Coordinator: revalidate source + baseline + whole candidate
              |
              v
Versioned storage adapter: lock / one durable write / result
              |
              v
Publish one accepted document -> React charts/details/notice

Frozen baseline -> original decoder/view, read only
Remaining person-hours + capacity -> independent FF
Accepted source + explicit PA As-of -> named PA rule version
```

Use explicit typed commands/results and IDs, not DOM messages or render effects
that rewrite state. Keep clock/ID creation in orchestration; calculations get
explicit dates/IDs. Never serialize a React object, callback, graph node with
backreferences or derived view model. Do not persist PA geometry or use a
localStorage event as an automatic reschedule command. Storage notification
may invalidate a stale draft; it cannot silently accept a new graph.

Current source boundaries are in [ARCHITECTURE-AUDIT](ARCHITECTURE-AUDIT.md).
New module names can be chosen later (for example `planning/workingPlan`,
`planning/reviewDraft`, `progress/actualStart`, `persistence/projectV6`), but
module naming is not a decision about behavior. Leave old baseline validation
and known version parsers available; do not turn them into a generic parser
that silently strips unsupported new evidence.

## Verification to require after implementation

1. Turn every [scenario](SCENARIO-MATRIX.md) and I1-I7 into independent tests.
   Use hand date/slot answers, unchanged-source snapshots and deterministic
   input permutations. Distinguish date variance, working slots and person-hours.
2. Test Actual Start replay including old missing data, corrected earlier date,
   retraction/re-record, tied recordedAt, same-task completion bounds, nonworking
   dates, pre-project facts, bad IDs and supersession forks/cycles. No start
   inferred from status/logs/passed plan dates; no automatic status or effort.
3. Test queue joins, tied/unknown predecessors, changed upstream decisions,
   explicit reasoned sever, retained inactive manual date on last-edge removal,
   early keep and another successor offer. No double propagation or graph drift.
   Unrelated promises and local-day rollover never silently publish revised
   commitments; other task/calendar edit routes honor the revision boundary.
4. Test transaction/upgrade failure injection before and at write; original
   accepted state/storage/baseline unchanged. Detect source conflicts under
   lock; retries/crash recovery do not double-record completion. Old v1 copies
   remain readable by the old app, v6 rejected there, no lossy downgrade.
5. Test baseline identity/snapshots and current progress/criteria/effort/forecast
   field equality across formats1-5 upgrades and v6 round-trips. Validate archive,
   duplicate and allocation contracts. A derived calculation never writes a file.
6. Test visible known/Unknown/default spans and all accessible alternatives,
   View Baseline, both modes/scales, exact nonworking actual dates, eight overlay
   masks, focus return, Escape/Close and40-task narrow scrolling. Run full
   regression suite, lint, typecheck and build; investigate new failures.
7. Measure pure evaluation/preview and browser interactions with documented
   environment for30/40 tasks, joins, long chains and histories. Proposed target:
   ordinary recalculation avoids a50ms blocking task on the agreed classroom
   device, no save/render loop and bounded DOM. This target is unmeasured for
   the proposed design. Require owner device review; do not substitute host
   automation or a zero-long-task claim for a classroom study.

## Explicit exclusions and stop conditions

No automatic baseline replacement, resource levelling, new work status,
mandatory logs, elapsed-time deduction, actual-hour capture, implied restart,
remaining-slot conversion from person-hours, probabilistic forecast, full
projected CPM, authenticated audit service, remote sync, generic undo system,
fullscreen/meeting workspace, WP8, merge, tag or deployment.

Stop for an owner decision if a needed policy is deferred/rejected without
an alternative, if started-work finish must be known, if old clients must edit
new facts without loss, or if storage coordination cannot satisfy the approved
atomicity contract. Do not resolve those gaps with implicit defaults or
unreviewed formula/persistence changes.
