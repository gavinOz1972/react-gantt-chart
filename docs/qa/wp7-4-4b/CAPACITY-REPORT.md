# F08 synthetic capacity and resource qualification

These are deterministic synthetic families, not observed student workloads.
No production limit was increased, hard-coded or activated. Default 10 MiB and
depth 64 remain recommendations for owner acceptance and native implementation
qualification, separate from browser localStorage quota/DBMS constraints.

## Recipe, distributions and repeatability

[Recipe](scripts/synthetic.mjs), [driver](scripts/capacity.mjs) and
[worker](scripts/capacity-worker.mjs) generate complete proposed `/2` JSON in
owned workspace/output only. Nine families cover 30/40/100/300/1000 tasks and a
fixed 100-task history trajectory. Graphs repeat five-task chains/diamonds with
joins, retirement of one task per block, restoration/review of another, and
unaffected predecessors. This is not every graph shape or a long single critical
path benchmark. A fresh synthetic full original baseline is established once
using unchanged WP1, never by reading/regenerating a user's baseline.

Each block initially has two retirements and one restoration; 20% remain retired.
An additional **batch cycle** retires/restores every block's T3 subject while
keeping other confirmed edges; 100 tasks means 20 subjects per batch. Lifecycle
before-context, archive episodes and explanatory events are preserved. Growth
families also add10 explicit description-review events per batch. Logs/criteria/
long text distributions are recorded in every row's options/counts. Logging
does not infer actual start or status; history is honestly Partial where earlier
explanations are unavailable. Fixtures are representative data recipes, not
certified by an unimplemented full format 6 validator.

One fresh-process warmup, then **three fresh measured Node processes** per
family (27 measurements/9 warmups). Input files are warm in the OS cache after
generation; no cold-disk claim. Generation/baseline calculation is excluded
from pipeline timings and recorded separately. Full semantic/lifecycle/correction
validation is absent: measured phases are read, strict test-only lexical scan,
ordinary JSON.parse, selected shape/active-graph checks, snapshot canonicalization,
SHA-256 and full-file canonicalization. Both canonicalization passes are included;
this is not an exact future import-only latency prediction.

Reference: maintained canonicalize 5.1.0 at 31fb117, Node 24.19.0/V8 13.6.233.17,
Windows 10.0.26200 x64, Ryzen 9 8945HX/32 logical CPUs, 16,425,455,616 RAM bytes.
Memory is fresh-process maxRSS and sampled phase RSS/heap/external memory,
not browser peak. No p95/production SLA is inferred from three runs.

## Recorded primary measurements

Exact UTF-8 byte counts; milliseconds are median pipeline; RSS is the maximum
of three process high-water marks in MiB. [Raw runs](evidence/capacity-results.json)
include min/median/max, all phases, memory samples, recipe/input/snapshot hashes,
counts and canonical/pretty sizes. Repeated runs can vary in timing/RSS.

| Family | Pretty bytes | Canonical bytes | Median ms | Max RSS MiB |
| --- | ---: | ---: | ---: | ---: |
| class30 |363,377|199,653|15.2|63.6|
| class40 |827,340|504,852|28.9|74.5|
| class100 |3,551,755|2,484,691|97.1|101.1|
| stress300 |18,053,092|13,357,252|405.0|240.6|
| stress1000 |105,559,899|79,061,587|2,330.1|810.3|
| growth100-c0 |1,983,535|1,415,047|58.4|81.6|
| growth100-c5 |5,570,118|3,986,490|152.8|118.6|
| growth100-c20 |16,305,498|11,676,450|388.5|268.1|
| growth100-c50 |37,777,188|27,057,300|888.6|404.3|

Stress cases intentionally exceed the proposed cap and were measured with an
unbounded **test harness**, never through a production reader. There is no
promise that an over-cap file is accepted. Smaller machines/browsers, GC timing
and a real codec can differ substantially. The live app's JS/CSS stay unchanged.

Median phase costs in milliseconds (separate medians need not sum exactly to
the median pipeline; full semantic validation is **not** among these columns):

| Family | Read | Lexical scan | JSON.parse | Selected checks | Canonical snapshot | SHA-256 | Canonical file |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| class40 |0.26|12.05|1.82|0.24|6.94|1.43|5.58|
| class100 |0.91|46.78|5.62|0.34|23.03|4.61|15.13|
| stress1000 |30.14|1,000.31|168.32|1.43|567.13|131.24|429.40|

## Per-section contributions and history growth

The raw report records canonical value bytes for each root section and each
Current child, plus framing overhead. These are byte contributions, not timing
attributions. Root/child tables are different levels and must not be summed
together. Within a level, value bytes plus recorded key/bracket/comma overhead
give the enclosing object; full-file envelope overhead is recorded separately.

| Current child / root section | class100 value bytes | growth100-c20 value bytes |
| --- | ---: | ---: |
| Current tasks |53,787|65,497|
| Current progress |231,364|227,592|
| Current actuals |68,733|67,995|
| Current workTracking |355,346|283,578|
| Current lifecycle |548,055|3,552,761|
| Current archivedDependencies |44,211|290,907|
| Current scopeReviews |141,891|1,220,367|
| Root originalBaseline |72,224|83,839|
| Root history |885,142|5,788,295|

Preserved before-context and repeated review/lifecycle evidence, not nesting,
dominate long-term growth. Growth cases keep 100 tasks and 80 active/20 retired;
c0/c5/c20/c50 retain 60/260/860/2060 lifecycle decisions and 2/12/42/102 reviews.
Maximum container depth stays 11. From c0 to c50 this recipe averages about
512,845 additional canonical bytes or715,873 pretty bytes per batch, including
the associated description events. This is not a universal classroom rate.

Both canonical and pretty growth100-c20 exceed 10 MiB despite unchanged task
count. Preserving history has no finite lifetime guarantee within a fixed cap.
Do not solve that by pruning history, changing baseline or down-exporting.

## Exact boundary and independent flat-structure checks

- 10 MiB raw input: 10,485,759 and 10,485,760 bytes pass the test lexical/resource
  gate; 10,485,761 fails FileTooLarge. A valid synthetic project plus trailing
  whitespace isolates **raw** input size without changing snapshot/digest.
- Root container depth 1: nested-array depths63/64 pass, 65 fails NestingTooDeep.
  Those are schema-free resource fixtures, not valid domain projects.
- 100,000 numeric array items, an 8 MiB string, and 100,000 unique IDs with a maximum
  safe sequence stamp remain shallow. Nine boundary/structural checks pass.
  Large flat input can consume resources without large depth; field/domain
  limits and full validation still matter. These passes do not bless those
  arbitrary locations as valid Bugsys fields.

Read-only probes preserve tested raw buffers; **real reader rejection preserving
an accepted project/ref/baseline is NOT executed** because no format 6 reader
exists. It remains a proposed native negative test.

## Recommendation

Retain default **10 MiB raw portable input/depth 64** as bounded initial policy,
configurable only through an explicitly qualified application/operator policy,
never from the untrusted file. Default 64 comfortably covers measured depth 11;
the byte cap also bounds shallow structures. Reject oversize before publication,
retain source/draft/last accepted state, and explain that a compatible higher-cap
inspection/adapter or separately designed archival policy needs authorization.
Do not silently increase limits or strip evidence.

Capacity is separate from physical storage: a portable10MiB file is not promised
to fit localStorage, nor a DBMS quota. A future adapter checks its own limits.
Full validation and browser/mobile memory/latency, atomic preservation, cancellation
and UI handling remain implementation gates. Node stress1000's ~810 MiB process
peak is evidence against treating a larger cap as free, not a browser result.

The initial simplified-sample measurements are retained as
[historical evidence](evidence/capacity-sample-reference-results.json); primary
tables above were rerun with maintained 5.1 after the reference issue was found.
Two30/40-task snapshot digests match in .NET as well. No unnecessary large
generated projects are committed; reproduce them using the owned recipe/output.
