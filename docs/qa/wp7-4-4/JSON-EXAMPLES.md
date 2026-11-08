# Complete fictional JSON examples

Each linked file is a **complete proposed format6 document**, including full
current state, original-baseline representation, history and a concrete digest.
There are no elided fields, partial patches or production files. Pretty layout
is for review; canonical export bytes are defined separately. Do not import
these into today's app: its unchanged reader supports formats1–5 only.

All scenarios use2026 dates. The late case uses Monday–Friday, four planned
working slots/day. Slot numbers are not clock hours. The review date is an
explicit fictional November9, not the execution machine's today. A date-only
November6 completion is treated conservatively as end-of-day for dependency
release: next working slot is Monday November9/hour1. This is the existing
working-evaluator rule, not a forecasting/effort formula change.

## T1 late, T2 has not actually started

Read [late-retained.json](examples/late-retained.json).

| Meaning | T1 | T2 |
| --- | --- | --- |
| Original immutable baseline | November2/hour1 → after hour2 | November2/hour3 → after hour4, predecessorT1 |
| Stored reviewed current promise | Retained original November2 finish | Explicitly revised to November9/hour1 → after hour2 |
| Recorded actual | Complete on November6; Actual Start Unknown | Not Started, Actual Start and completion Unknown |
| Effort | Two planned slots;2 recorded person-hours; stored remaining2 retained, effective future work0 | Two stored remaining person-hours; no actual date inferred |

The completion claim keeps `committedAtCompletion` pointing to W-original/
November2. It does not substitute the revised downstream schedule or today's
baseline. Empty criteria have explicit acknowledgement. Optional work logs
do not prove total actual effort, and none of these fields implies T1 was
actually done on November2 or that T2 started on its old planned date.

## Historical T2 Actual Start: retain versus sever

The following are independent revision3 branches from the same revision2
snapshot. Their equal counters do not mean equal content or an ordering.

- [late-retained-actual.json](examples/late-retained-actual.json): the owner
  explicitly attests T2 actually started November3, recorded on November9.
  The edge remains. Preserve that reality and show the derived dependency
  conflict with T1's November6 completion. T2 is In Progress and its old finish
  is ReferenceOnly: neither a first-start date nor one remaining person-hour
  establishes its remaining **scheduled** duration or a new certain finish.
- [late-severed-actual.json](examples/late-severed-actual.json): the same actual
  attestation is retained, with an explicit Sever decision/reason removing the
  current T1→T2 edge. The frozen original baseline still contains that edge.
  Severing does not erase T1's lateness or invent a T2 completion. T2 remains
  ReferenceOnly until a separately valid future planning decision is made.

A new planned date cannot be backdated as a substitute for the missing actual
attestation. If the owner does not know T2 started, the late-retained example's
Unknown must stay Unknown. Concurrently saving both branches to one resource
would require expected-ref conflict handling, not automatic graph merge.

## Early completion does not automatically advance T2

[early-keep.json](examples/early-keep.json) is a separate lineage. T1 was
committed to November6, but its explicitly recorded start/completion are
November4. T1's plan uses four Friday working slots; its optional recorded
effort can still be two person-hours. T2's original November9 start is retained through a
KeepCommitment decision. Its earlier dependency release on November5 does not
override that floor/hold. T2 Actual Start remains Unknown. The original
baseline and captured completion reference still say November6 for T1.

## Correction retains old evidence

[corrected-completion.json](examples/corrected-completion.json) appends a
revision3 correction on November10: the owner changes T1's completion claim
from November6 to November5. A fresh claim and event supersede the old event;
the old payload is still present, and current actuals point to the new claim.
The saved November2 commitment-at-completion and baseline stay unchanged.
T2's held November9 promise is retained rather than silently accelerated.

The older status record and November6 work log remain historical records;
they are not a second current completion date or a reason to rewrite actuals.
Any discrepancy in what that log meant needs human review, not derivation of
completion from effort. Correction changes the inline fact and explanatory
history together; loading does not replay all revisions.

## Missing history, legacy copy and empty project

| Complete example | Meaning and limits |
| --- | --- |
| [source-format1.json](examples/source-format1.json) | Complete fictional legacy input, validated by today's unchanged parser. |
| [legacy-copy.json](examples/legacy-copy.json) | Authored proposed copy of that input: logical1, same lineage/task/source graph, raw source digest, no baseline, Partial history, Unknown actuals/remaining, Unreviewed working state. It is a design example, not output of an implemented migration. |
| [partial-current.json](examples/partial-current.json) | Current Complete fact/checklist/reference and W are self-contained even though explanatory events are unavailable. Null sourceEventId/statusEventId links and Partial coverage make that limitation explicit; no fake events are synthesized. A new ordinary save must never create this condition by dropping known history. It demonstrates how an already incomplete external snapshot is represented. |
| [empty.json](examples/empty.json) | New logical1 snapshot, no tasks/maps/events/baseline, nextTaskNumber1, CompleteSince1 coverage, no working review. No empty baseline is established. |

The late branches share one immutable baseline/lineage. Early, empty and legacy
families have distinct lineage IDs so they cannot masquerade as conflicting
baselines of one project. Duplicate names or repeated imports never select a
stored overwrite destination.

The legacy source's raw digest refers to its LF bytes as authored/committed.
A Git checkout that converts it to CRLF changes those raw bytes and therefore
their raw digest. A real migration must hash the bytes actually selected; it
must not normalize a backup to force an expected match. Pretty-layout changes
do not change a parsed snapshot's canonical digest.

## Authoring checks, not a codec certification

[Example evidence](evidence/example-authoring.json) records each digest/revision.
The examples use ASCII object keys and safe integer numbers only; built-in
JSON property-list ordering and SHA-256 were used to author their illustrative
canonical snapshot digests. Syntax, digest, references, selected literal dates,
unchanged paired baselines and existing legacy/baseline compatibility were
checked. This does not implement or test general JCS, a format6 decoder,
full schema validation, event replay, migration or application integration.
See [SCENARIO-MATRIX](SCENARIO-MATRIX.md) for exact executed and pending checks.
