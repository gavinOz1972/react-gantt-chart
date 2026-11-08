# WP7.4 owner policy review and decision gate

**All new decisions are Pending. No boxes are preselected.** Read
[README](README.md), [policies](POLICY-PROPOSALS.md),
[event/file contract](EVENT-AND-FILE-CONTRACT.md), [workflow](REVIEW-WORKFLOW.md),
[scenarios](SCENARIO-MATRIX.md), [audit](ARCHITECTURE-AUDIT.md) and
[implementation slices](IMPLEMENTATION-SLICES.md). Review exact
[verification limits](VERIFICATION.md).

The requirement already establishes immutable first baseline, explicit
confirmed working revisions, truthful past actual dates, late keep/sever,
early keep-by-default, consolidated apply/cancel, four statuses and optional
work logs (E01-E07). This sheet asks how to realize those rules. Blank choices
do not waive them or authorize implementation.

Mark one Approve / Defer / Reject independently for each row. Add conditions
or an alternative; deferring a required policy blocks its dependent slice.
Approving the recommendation does not approve another row by implication.

| ID | Independent proposed choice / consequence | Approve | Defer | Reject | Conditions / alternative |
| --- | --- | --- | --- | --- | --- |
| P01 Working start | New all-task planned not-before slot, seeded explicitly from accepted legacy schedule; date entry normalizes to planned H1, keep preserves exact slot. New evaluator distinguishes completed release from old planned finish. Do not reuse root-only manual fields. Alternative constraint/snapshot model must specify later edits. | [ ] | [ ] | [ ] | __________ |
| P02 Actual Start / status | First-ever date work began; In Progress may still have Unknown start. Ordinary Not Started attestation requires an explicit accompanying In Progress/Blocked choice, no automatic selection. Blocked/Complete/reopened history retained; no implicit finish/restart/effort change. | [ ] | [ ] | [ ] | __________ |
| P03 Start correction history | Append-only Record/Correct/Retract, reason and superseded event ID, date-only effective date, UTC recordedAt, optional self-reported actor/evidence. Missing/retracted remains Unknown; no rewriting previous claims. | [ ] | [ ] | [ ] | __________ |
| P04 Late keep/sever | Keep all required constraints and propose feasible later commitments; confirm propagated changes. Sever only named edge with reason and valid actual/current-future start; explicitly resolve stale manual value on last-edge removal. Bypass history remains visible. | [ ] | [ ] | [ ] | __________ |
| P05 Early keep/advance | Keep exact current commitment by default; offer advance after every predecessor and known availability. Advancing offers successors another review, without silent chain acceleration. FF capacity does not certify individual availability. | [ ] | [ ] | [ ] | __________ |
| P06 Past dates/context | Freeze local meeting date independent of PA/FF; refresh on rollover. New plans cannot be past/before project start. Historical actuals may be nonworking/pre-project with reason, but cannot be future/after known same-task completion. Keep unknown old commitment as unverified reference rather than backdate. | [ ] | [ ] | [ ] | __________ |
| P07 Joins/conflicts | All retained predecessors; topological queue deduplicated by ID, ties kept, upstream edits invalidate dependent choices. Never move actual facts; definite bypass needs reasoned sever or unresolved, same-date order stays unverified. | [ ] | [ ] | [ ] | __________ |
| P08 Transaction/cancel | Recommended atomic completion+review draft, final Apply-and-save only; cancel discards entire intent. Explicit unresolved outcome with reason allowed. Save failure preserves accepted state and draft. Alternative staged completion needs separately finalized durable pending-review contract. | [ ] | [ ] | [ ] | Choose atomic / staged alternative details: __________ |
| P09 File/backup/storage | Proposed format6, original-format backup/copy and explicit upgrade, no lossy down-export. Isolated v2 browser library leaves v1 intact; exclusive writer coordination, source recheck and one write before accepted-state publication. Specify fallback if lock unavailable. | [ ] | [ ] | [ ] | __________ |
| P10 Default Gantt | One supported primary span/marker, explicit actual/planned dates and Unknown endpoints, persistent lateness/review cue. Optional C/A/R/PA/history comparisons replace simultaneous default lanes only after UX review; View Baseline stays available. | [ ] | [ ] | [ ] | Keep current default / alternative: __________ |
| P11 Delete/copy evidence | Archive identities/evidence before referenced deletion; until approved archive exists, block that deletion. Copies get fresh IDs and no actual/review history or revised floor; never reuse archived IDs. This changes current purge behavior and needs explicit contract. | [ ] | [ ] | [ ] | __________ |
| P12 Consumers/references | Completion compares pre-review working commitment with provenance; older snapshots untouched. Name legacy versus revised plan/PA/FF/CPM; keep PA1/FF formulas and legacy CPM distinct initially. New working-plan adapters and any later PA/CPM algorithm require named scope. | [ ] | [ ] | [ ] | __________ |

## Review questions worth resolving together

- Is a truthful completion allowed to be recorded with explicitly unresolved
  successor evidence (recommended), or must completion be staged separately?
- Is an Actual Start attestation sufficient to require an explicit status
  choice, while legacy In Progress without a start remains allowed?
- Are original starts retained across reopened work sufficient, or are restart
  episodes actually required? The latter needs another evidence/finish contract.
- Does the simpler default reduce explanation burden while leaving lateness,
  uncertainty and baseline comparisons discoverable? No student study has
  answered that question in this package.
- Are v2 copy-upgrade and coordinated Apply-and-save acceptable, given that
  old releases must continue to use their untouched v1 copies?

## Independent acceptance and next authorization

- [ ] WP7.1 owner assessment acceptance recorded separately.
- [ ] WP7.3 owner acceptance recorded separately.
- [ ] WP7.3.2 owner acceptance recorded separately.
- [ ] WP7.3.3 owner acceptance recorded separately.
- [ ] WP7.4 accepted as a design handoff only. Conditions: ____________________
- [ ] Further design/verification requested: ____________________

Owner / date: ____________________ Reviewed WP7.4 design SHA: ____________________

**A later implementation requires a separate instruction naming approved
policies, contract and bounded slices.** Design acceptance alone is not that
instruction. Nothing is implemented by marking this sheet.

- [ ] Separately authorize implementation under a later work package: __________
- Approved policy IDs / alternatives: ________________________________________
- Approved slices / exclusions / test conditions: ____________________________
- Remaining blocking decisions: _____________________________________________
- Owner / date: ____________________

No main merge, protected-tag change, rebaseline, deployment or WP8 is
authorized by any blank row or by this design handoff.
