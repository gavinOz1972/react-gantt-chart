# Established rules and proposed policies

**No new policy is approved by this document.** The requirement establishes
E01-E07 below. P01-P12 recommend how to implement them; their independent
choices remain Pending in [OWNER-DECISIONS](OWNER-DECISIONS.md).

## Established by the WP7.4 requirement

| ID | Established rule |
| --- | --- |
| E01 | The first baseline is immutable forever; View Baseline and its comparisons remain available. |
| E02 | Working commitments change only through confirmed decisions. A newly entered past start is an actual-history claim, not a retrospective plan. |
| E03 | For late completion, review directly affected successors: keep dependency and advance feasibly, or explicitly sever it with reason and valid planned/actual start. |
| E04 | Early completion does not pull starts forward automatically. Default keep; offer earliest feasible start after every required predecessor. Moving a successor early offers another successor review. |
| E05 | If earliest start is past, ask whether work actually began; otherwise retain the commitment and expose unresolved evidence. Do not backdate a plan. |
| E06 | Show a consolidated preview and apply confirmed edits together; cancelling must not leave partial graph/schedule writes. |
| E07 | Keep four statuses, optional work logs and independent effort. Actual Start neither consumes effort nor completes work. |

## P01 - Working start is a planned not-before slot

Recommend a new per-task constraint for roots **and dependents**, separate
from `independentStartMode` (see [source audit](ARCHITECTURE-AUDIT.md)). It is
an earliest permitted **planned slot**, not a fixed appointment, actual start
or adjusted baseline. Date entry maps to H1 on/after that date, with the
normalized date shown before confirmation. Keeping an existing commitment
preserves its exact planned slot, including H3; no actual hour is inferred.

Seed the first working-plan revision from the accepted legacy schedule only
at explicit upgrade confirmation. Store each task's planned floor so future
graph changes cannot silently pull an unchanged promise earlier. A reviewed
late move raises that floor; a reviewed early advance explicitly replaces it.
Later bounds may still delay a task. If that happens, the changed commitment
must be in the consolidated confirmation, not an automatic saved rewrite.

The accepted working revision also retains its reviewed planned boundaries.
They are durable promises/reference snapshots, not live PA outputs. Local
today advancing never rewrites them. The review-date floor applies to new
proposals in the affected review closure; unrelated past promises stay labelled
unverified, not silently moved. Changes to project/calendar/tasks outside the
wizard must use the same explicit revision boundary or invalidate feasibility
until reviewed; a live calculation cannot publish a new accepted commitment.

The future evaluator takes current source graph/calendar, these constraints
and supported actual evidence. Completed predecessor release uses the next
working day; ordinary Not Started predecessor release uses its known planned
finish. A completed task's old full duration never forces an early successor
to wait for a fictitious future planned finish. Started/Blocked/reopened
predecessors remain Unknown without sufficient remaining scheduled-slot data.
Do not introduce that missing-duration capture in the first implementation.

Legacy WP1 remains the frozen-baseline/legacy-plan interpreter. A new working
evaluator and its downstream integration need explicit approval. Reject the
alternative of writing dependent dates into currently inactive manual fields.
An adjusted commitment snapshot alone is insufficient unless a defined
evaluator can honor its constraints after subsequent edits.

## P02 - Actual Start and status are related, separately attested facts

Actual Start means the first calendar date substantive work on this task
actually began, as reported by the user. It is date-only, not a log entry,
planned release, status-transition timestamp or first recorded keystroke.
See [event contract](EVENT-AND-FILE-CONTRACT.md).

- In Progress may lack Actual Start indefinitely: legacy/missing means Unknown.
  Recording a start is optional outside an explicit bypass/backfill decision.
- For an ordinary Not Started task, attesting Actual Start also requires an
  explicit In Progress transition (or explicit Blocked with reason) in the
  same transaction. Do not choose status silently. Cancelling leaves both absent.
- Blocked retains its blocking reason/status; a start fact does not unblock it.
- Complete may receive a historical start backfill on/before its completion;
  no reopening or effort change follows solely from adding that fact.
- Reopening preserves first-ever Actual Start as history. It is not a restart
  date. A reopened Not Started state can coexist with that historical first
  start, explicitly labelled; future finish still Unknown.

## P03 - Start recording and corrections

Recommend append-only Record/Correct/Retract events. Each correction names the
active predecessor event and gives a reason. No array rewrite, silent last
date wins, removal of old evidence or inference from optional logs. A retracted
claim yields Unknown until explicitly recorded again. RecordedAt is metadata;
effective dates may go backwards in a correction. No authenticated actor exists;
an optional self-described name is informational only.

## P04 - Late keep/sever semantics

For each directly affected successor ask **Did this task wait for T1?**
Keep dependency proposes max(review-date floor, retained planned floor, every
required release and any existing independent availability floor). On M-F,
T1 actual Friday Nov6 yields Monday Nov9 H1, or later if another bound wins.
Propagate later dates through ordinary Not Started descendants and confirm
all changes together. Do not shift already-reported actual facts.

Severing removes only the named current edge, with a 3-500 character reason.
It does not assert the edge was absent historically. Attest actual start if
work began; otherwise choose a current/future planned start. All other edges
remain constraints. A contrary second predecessor must also be reviewed; one
sever action cannot certify a still-infeasible join. Missing start facts can
be explicitly left unresolved, but no valid-looking replacement bar is invented.

Removing the final edge requires reviewing the retained legacy manual value.
If clearing/changing it is needed, include that source-field edit explicitly
in the preview and preserve the old value in revision evidence. Never let
an inactive date reactivate invisibly. Actual Start bypass does not imply
that the task's finish is now known.

## P05 - Early keep/advance and availability

Keep the exact current working start by default. Offer earliest feasible
advance only when all required predecessor releases are known. Check all
retained dependencies, project start, existing independent releases and
explicit task not-before availability. The app has no individual resource
calendar; do not infer availability from class/homework/team capacity. The
student can choose a later planned not-before date and give the reason.

Example: A committed Nov13, actual Nov11, B committed Nov16. Earliest from A
alone is Nov12. If P still plans to finish Nov13, B remains Nov16; if P's
readiness is Unknown, advancement is not certified. If B advances to Nov12,
offer B's successors a new review, default keep their existing commitments.
An unchosen earlier possibility never rewrites a future promise.

## P06 - Past dates and review context

Freeze review As-of to the user's local meeting date when opening the draft.
It is independent of PA As-of and FF As-of. Hypothetical/historical review
contexts are read-only; do not use a past PA control to permit backdated plans.
On local-day rollover require refreshed preview before applying.

A newly chosen planned date must be on/after review As-of and project start.
Past earliest feasibility asks: **Did work actually begin?** Yes records an
attested date; No/Unknown retains the old commitment as a labelled historical,
unverified reference or chooses a current/future revision. Retaining an old
reference is not confirming a feasible future promise. Unknown remains visible.

Recommend actual dates may fall on nonworking days and before project start
with an explicit explanatory reason, because they are historical claims.
Actual Start cannot be after review As-of or after a known same-task active
completion. Future or internally contradictory new input blocks application;
preserve conflicting imported legacy evidence and mark it unresolved rather
than silently repairing it. Existing planned-date rejection policies stand.

## P07 - Multi-predecessor and chronological evidence

All retained constraints participate. Deduplicate by successor task ID, retain
all triggering predecessors and tied bounds. A definitely earlier actual
start than a retained predecessor's completion is a bypass conflict; offer
explicit edge removal with reason or retain conflict as unresolved. Same-date
ordering is unverified, never proven from date-only data. Actual-to-future
release remains strictly next-working-day even if same-day work was possible.

Already Complete successors keep their dates and attestations. Resolving a
graph decision now does not retroactively declare old chronology feasible.
Historical conflict remains attached to the earlier graph snapshot. Corrections
to evidence are separate attested commands, never automatic rescheduling.

## P08 - Atomic completion/review and unresolved decisions

Recommend one staged in-memory draft containing the completion, successor
decisions, optional Actual Start and graph/commitment changes. One consolidated
**Apply and save review** validates, writes the whole candidate once and then
publishes accepted state. Cancel discards everything, including completion.
See [workflow](REVIEW-WORKFLOW.md) for failures and recovery.

Allow an explicit **Keep facts unresolved** disposition with reason. It records
the completion and the review outcome in the same final transaction, while
retaining the affected old commitment as unverified and withholding a definite
future finish. It never silently severs an edge or calls a past plan feasible.
This prevents insufficient evidence about one successor from forcing a false
answer or blocking truthful completion recording indefinitely.

Alternative: save completion first and retain a durable pending-review record;
cancel later cancels only revisions. That is a different lifecycle and needs
owner choice, file fields and restart UX. Do not combine both models implicitly.

## P09 - Versioning, backup and isolated saves

Recommend future format6 (or next unused version), a separate v2 browser
library key, explicit backup/upgrade consent and no lossy down-export. Current
format5 readers drop unknown keys, and a single unsupported saved plan rejects
their entire v1 library. Leave original v1 copies untouched. A failed candidate
write leaves accepted memory/storage unchanged; draft remains retryable.
See [file contract](EVENT-AND-FILE-CONTRACT.md) for exact effects and concurrency.

## P10 - Minimal default Gantt

Recommend one supported primary schedule span, explicit actual/planned start
qualification, finish/late badge and persistent unresolved-review cue. Unknown
endpoints get markers/open ends, not an invented filled duration. Actual
start-to-finish spans mean elapsed lifespan, never continuous effort.
Keep View Baseline, history comparisons and PA/FF details accessible on demand.
Evaluate removal of simultaneous thick red/C/A/R/PA lanes from the default
only after owner review; do not discard underlying facts or change the current
WP7.3.3 chart in this package. Details are in [workflow](REVIEW-WORKFLOW.md).

## P11 - Deletion, duplication and retained evidence

Recommend retaining minimal archived task identities for Actual Start and
review-history references after explicit deletion, without resurrecting active
graph edges. This changes today's progress-purge contract and needs approval.
Until that slice is approved, block deletion of tasks referenced by new history
rather than corrupting or silently deleting it. Preserve baseline independently.
Copies get new task/criterion IDs and no actual-start/status/review history or
inherited revised floor; copy existing source-task fields as today and review
the new planned constraint explicitly. Never reuse archived numeric IDs.

## P12 - Working-plan consumers and comparisons

Capture a completion's historical committed finish from its **pre-review**
accepted working commitment when known, with revision/reference provenance;
do not use the post-revision plan or overwrite earlier snapshots. Older
events retain their original reference and missing context stays Unknown.

Future integration must explicitly name legacy plan, revised working plan,
PA and FF inputs. Preserve PA version1 and FF formulas initially. Do not claim
PA consumes new constraints or that legacy CPM analyzes a hybrid working plan.
Graph/plan input changes can alter FF priorities/results and legacy CPM; label
the reference used and test it. A new PA rule version/working-plan CPM, if
wanted, is separately scoped after the evaluator contract is accepted.
