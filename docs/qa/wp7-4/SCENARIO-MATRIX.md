# Required scenarios and explicit proposed outcomes

**Paper acceptance examples for a future implementation, not executed guided
behavior.** P01-P12 are Pending. Existing-regression passes in
[VERIFICATION](VERIFICATION.md) do not validate these new commands or visuals.

All dates are November2026. Default calendar M-F, four numbered scheduled
slots/day; durations below are scheduled slots, not person-hours. `A4 -> B4`
means finish-to-start. H1/afterH4 are planned boundaries only. Actual dates
have no hour. Review dates below are hypothetical meeting dates for each
example, independent of this document's Nov7 review date. Baseline is captured
before the example; no real owner project is used.

## Common invariants for every row, including failures

I1: original baseline/calendar/ID/establishedAt and historical attestations
are unchanged. I2: no elapsed-time or Actual Start deduction from remaining
person-hours, no mandatory logs, four statuses only. I3: all retained
predecessors constrain future work; no actual hour or started finish invented.
I4: draft changes never touch accepted document/storage before confirmation;
cancel/failure has no partial writes. I5: no new past planned commitment;
historical start is an explicit actual claim. I6: IDs remain durable across
sort/copy/delete, graph acyclic, joins not double-delayed. I7: same explicit
inputs/context/rule version are deterministic; uncertain evidence remains
Unknown and historical project-delay claims need a named reference.

## 1. Late single predecessor kept

Before A4 -> B4 -> C4, committed A2, B3, C4, each H1-afterH4.
A completes Friday6 with saved commitment2; review6; B/C Not Started.
Keep A->B. Conservative release is Monday9 H1, not Saturday7 and not a
fabricated Friday finishing hour. Proposed B9 H1-afterH4, C10 H1-afterH4;
future project finish10, compared with before4. Consolidated preview includes
both changed commitments and preserved edges. Historical A late is +4
calendar days. Do not sum both task movements into double project delay.
Only final confirmation writes the working floors9/10, event and journal.

Control: add independent P8 starting9, ending10. If only A->B is present,
B ends9 and P still governs10: historical A late remains, project finish
unchanged10. A leaf variant has no successor review but retains lateness.

## 2. Late predecessor severed; successor actually began

Before A4 -> B4, A2/B3; A actual6/ref2; B In Progress; review6.
Student attests B Actual Start3, gives reason "Used an independent draft"
and explicitly removes A->B. Preserve start3 and completion6 exactly;
record current removal and historical bypass, not a claim the old edge
never existed. B status remains In Progress, effort unchanged, finish and
project outlook Unknown. Do not restart B's four slots on9 or draw finish3.

Variant: B was ordinary Not Started. Attesting start3 requires an explicit
In Progress (or Blocked with reason) transition in the same transaction.
If that choice is declined, no start fact is silently saved; choose unresolved.
If B also retains P->B with P actual5, removing A alone leaves a definite
bypass conflict. Review P separately or retain unresolved; no certified plan.

## 3. Late sever; successor has not started

Same A4 -> B4 -> C4, review6. Sever A->B with reason; B has no actual start.
Reject Planned Nov3 because it is past. Selecting Planned Nov6 H1 is allowed
under the explicit start-of-review-date abstraction if all remaining bounds
allow it; B6 afterH4 releases C9 H1-afterH4. Selecting Nov9 yields B9/C10.
Do not convert Nov3 into Actual Start without attestation. If B retained an
inactive manual date, show it; explicitly clear/change any newly activated
conflicting manual value before the candidate can validate. Cancellation
leaves that retained source value and the original edge untouched.

## 4. Early completion, default keep and all predecessors

Project starts9. A20 plans9-13, B4 after A starts16; C4 after B starts17.
A actual11/ref13; review11. Default keep B16/C17. If only A constrains B,
earliest is12 H1; explicit advance proposes B12 afterH4. Offer C another
review: default C17, optional feasible advance C13. No silent chain acceleration.

Join variant: add P20 starting9, still expected to finish13, with P->B.
Even though A releases12, P's known planned release is16. Earliest B16;
do not offer Nov12 as feasible. If P is In Progress without remaining-slot
evidence, earliest is Unknown and Advance is unavailable. If P is Complete12,
release13 controls; earliest B13, not12. Retain both edges in all variants.
Explicit availability not-before16 also prevents an advance despite earlier
dependency readiness; FF team capacity is not a personal availability calendar.

## 5. Earliest feasible date is past

Same early chain, A actual11/ref13; meeting review16; B working start16,
earliest from A alone12. Choosing advance cannot write Planned Nov12.
If user attests Actual Start12, append that history with reason and an explicit
status choice if needed; B finish stays Unknown absent completion/remaining
scheduled-slot evidence. If No/Unknown, keep B16 or choose a later current/
future date; do not infer start12 because it was feasible.

If old B commitment itself is13, retaining it means historical reference
unverified, not a new feasible backdated promise. Record unresolved, withhold
definite finish and offer a new plan on/after16. A local-day rollover before
apply forces preview refresh so a now-past new promise cannot slip through.

## 6. Diamond, multiple affected predecessors and ties

Before A4 -> B4/C4 -> D4: A2; parallel B/C3; D4. A actual6/ref2;
review6. Late keep proposes B9/C9 (each four slots); both release10 H1.
D is reviewed once after both branches, starts10 after both, finishes10;
not11 from adding two shifts. Both B->D/C->D binding reasons remain visible.
Canonical queue is B,C,D for these IDs regardless of input/display order.
Changing B upstream after reviewing D invalidates D's confirmation.

Separate roots variant: A4/B8 both complete6, D4 after both. Both actual
releases9 tie. D appears once with both causes, starts9, not10. A candidate
added back edge D->A is rejected as cyclic with no accepted writes. Removing
one direct edge never suppresses a remaining constraint or the original
before-graph review entry.

## 7. Started, Blocked, Complete, reopened and conflicting evidence

| Input difference, review6 unless noted | Explicit outcome |
| --- | --- |
| B In Progress with no start; A actual6 | Optional start attestation/Unknown; no full-duration restart or invented B finish. Keep dependency can remain unresolved. |
| B Blocked, start3, reason recorded | Preserve start/status/reason; no automatic unblock, restart date or forecast finish. |
| B Complete4, A Complete6, retained A->B | Preserve both completions. Definite historical order conflict; offer reasoned sever or unresolved, never move B to9. B's own date can provide conditional local downstream release5, without certifying the conflicted whole project. |
| B first start3, Complete4, reopened5 | First start/completion stay history; old completion does not release current future work. Reopen reason and explicit remaining-effort review remain; no restart inferred from5. |
| Proposed B start7, B active Complete6 | Reject new contradictory actual-start input, leave draft/error; earlier valid facts remain. |
| A completion6, B actual start6 | Same-date order unverified. No assertion of actual hour/order; future not-started release still conservatively9. |
| B In Progress, remaining person-hours0, no completion | Still In Progress with Unknown scheduled finish. Zero does not complete or create a zero-length successor release. |

Correction control: B start3 recorded on6, corrected to2 on9 with reason.
Replay selects corrected2, keeps original3 as superseded evidence; recordedAt
order is metadata. Retract returns Unknown; a later explicit Record can restore
a claim. Same-task completion snapshots and baseline remain byte-for-value
unchanged. Invalid/cross-task/forked supersession is rejected atomically.

## 8. Cancel, invalid input, validation failure and save failure

Stage A completion6, sever A->B and enter B start3, then Cancel halfway:
accepted A status/event list, edge, B status/start, all working constraints,
saved library, dirty fingerprint and baseline equal their opening state.
No compensating completion/reopen pair is emitted. Dirty Close/Escape requires
explicit discard; outside click never applies. Back/Next alone writes nothing.

An invalid Gregorian date, blank sever reason, unknown/cyclic task ID,
out-of-range calendar or mismatched baseline blocks final validation, preserving
draft for correction. Stale source revision from another writer blocks/rebuilds
preview; it does not replay old decisions onto a new graph. Quota/security
failure at the one v2 save leaves accepted memory and saved record unchanged;
retry uses the same transaction ID. Crash after successful save but before
UI publication recovers that ID on reload, without a duplicate status event.
These future guarantees require the proposed storage coordinator; current
regression passes do not prove them implemented.

## 9. Baseline, old formats, history and storage compatibility

For each format1-5, import without rewriting the source, then review an
explicit v6 copy upgrade. Preserve supported fields and baseline exactly;
no start is inferred from status/logs/plan. No baseline in1 remains absent;
old missing historical completion reference stays Unknown. New actual start,
revisions and journal round-trip through v6 save/reload/export/import, retaining
event order, null versus0 remaining and archive identities.

Original v1-key browser bytes and compatible file stay unchanged after the
new v2-key save. An old app can still open the old copy, rejects v6 JSON and
does not encounter v6 inside its library. Invalid v6 import or version7 rejects
without replacing the open plan. No down-export quietly drops facts. Repeated
late/early decisions, start corrections, reopen/recomplete and calendar edits
never replace the first baseline or old completion reference. Same-project
conflicting baseline import prompts recovery, not a silent replacement.

Deletion after approved archiving retains task identity/evidence but removes
active edges; until that contract exists, referenced deletion is blocked.
Duplication gets fresh IDs and no source history/revised floor. Sort/reorder
and counter growth never reassign a deleted task's actual dates to its copy.

## 10. FF, PA context, drivers, calendar gaps and 30/40 tasks

Reuse WP7.3.1 L08: A4->B4, P8 manual3, committed P3-4 governs; A actual4,
P actual4, review4. Future B5 governs the conditional working finish, while
legacy-plan CPM P remains its own analysis. Do not call binding A->B a new
projected critical path. New constraints are not inputs to today's PA/FF APIs;
later integration must label their reference and test changed inputs explicitly.

L15 control: A actual4, B remaining4 person-hours, class28/home0/team1,
FF As-of4 gives B FF4; PA As-of4 gives B PA5. These answer different questions.
Changing review date or accepting a commitment never silently sets either
As-of. Optional actual logs remain absent without invalidating review.

Gap control: with M/Th/F calendar, actual Monday2 releases Thursday5, not
Tuesday3. Saturday7 on M-F remains Actual7 but releases Monday9. Expanded
shows nonworking dates; Compressed collapses them with exact labels. Neither
mode moves the actual fact or turns elapsed days into effort. For30/40 tasks,
joins and chains remain deterministic, preview lists all affected IDs and no
independent branch is charged another branch's delay. Measure responsiveness
after implementation rather than promising it from this design.

An unrelated old commitment does not move merely because the meeting date
advanced. It remains its recorded promise/reference with a needs-review cue.
Only confirmed affected/new proposals receive the review-date floor; live PA
may separately change with its explicitly displayed As-of.

## 11. Keyboard, narrow view, long chain and dismissed review

Future 40-task fixture: Tab from completion trigger through one review panel;
Space selects keep/sever, Enter advances only the intended control. Announced
heading names task ID/step; error summary links date/reason fields. Joins appear
once. Forty successors/long chain do not create forty stacked popups or duplicate
downstream nodes. On600px, controls/body scroll without horizontal page overflow;
all decisions/details/actions remain keyboard reachable.

Escape on dirty review offers Keep reviewing/Discard entire review; selecting
Keep preserves entries and focus, Discard restores original trigger and all
accepted state. Final success returns focus predictably and announces changed/
unresolved counts without reading the whole graph. Start/finish Unknown and
red lateness have text/shape alternatives. Screen-reader and owner walkthrough
remain required; automated DOM assertions are not student comprehension evidence.

## 12. Late, early, on-time, missing and future completion entry

Late6/ref2 opens affected direct-successor review. Early11/ref13 defaults keep16
and offers feasible advance after all predecessors. On-time A4 finishing2 with
B4 starting3 has unchanged release3, so a compact preview usually suffices;
do not force a redundant question per unaffected task.

Precision variant A2/B2: committed A2 H1-afterH2, B2 H3-afterH4; actual A2
on-date has no exact hour. Conservative release3 can affect B despite no
historical lateness. Explain precision-triggered review, never label A late.
Leaf completion has no queue. Missing saved historical reference yields
comparison Unknown and optional readiness review, not invented early/late.
Future completion6 at review4 stays warned/scenario/unresolved, with no
certified successor release9 from an unobserved future fact. Actual-start
capture cannot turn a future intent into observed history.

## Acceptance coverage and execution boundary

All twelve required rows above name explicit inputs, outcomes and failures.
I1-I7 apply throughout. The optional existing-calendar anchor diagnostic
checks only known calendar arithmetic, not a new working evaluator, event
schema, transaction, migration or UI. Future implementation tests must assert
these hand answers independently; never generate expected dates by running
the same new evaluator under test.
