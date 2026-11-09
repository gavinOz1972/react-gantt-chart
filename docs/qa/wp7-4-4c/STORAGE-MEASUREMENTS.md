# Synthetic storage, retrieval and memory measurements

These are research fixtures, not student workload observations or accepted project
formats. [Raw evidence](evidence/measurements.json) includes all runs, input/recipe
hashes, environment, section sizes, memory samples, reconstruction checks and
assertion IDs. No large generated projects are committed.

## Reproduction and environment

Run in the stabilization worktree, with installed Node/Vite dependencies:

```powershell
node docs/qa/wp7-4-4c/scripts/measure.mjs
```

The script writes only package evidence and a marker-owned child of
`GanttProject/output/wp7-4-4c-study`. It refuses an unowned existing output or a
location outside workspace/output. Use a scratch copy to retain delivery timing
evidence before regenerating it. The script imports the unchanged
[WP7.4.4b recipe](../wp7-4-4b/scripts/synthetic.mjs) and pinned canonicalize 5.1.
Where available it verifies existing generated WP7.4.4b inputs by hash; otherwise
it regenerates and checks their prior snapshot digest. No user project is read.

Fixed recorded environment: Node 24.19.0, V8 13.6.233.17-node.51, Windows
10.0.26200 x64, Ryzen 9 8945HX, 32 logical CPUs, 16,425,455,616 RAM bytes.
One fresh-process warmup and three fresh measured processes per case/mode:
11 cases × 5 modes (A/B/C full, operational-only, baseline-only) = **165 measured
processes plus 55 warmups**. Reads follow writes and use warm OS cache; no cold
disk, SQL/IndexedDB I/O, browser or production latency claim. Timings are medians
of three; memory is the maximum of three process high-water marks, not p95.

Full mode measures read, JSON.parse, a task/type/recorded-date history page scan
including rich-payload copying, covered reconstruction where available, and
canonical serialization. It does not measure strict lexical or full domain
validation. Section accounting and reconstruction hashes also allocate memory;
pipeline peak includes that work. After-parse RSS high-water includes runtime,
imports, read buffer/string and parsed object, not only the parsed object or a true
phase-local peak. Phase RSS/heap/external samples remain in evidence. Generation
and baseline calculation are excluded; parent-process generation peak is unmeasured.

## Scenarios and semantics

Seven unchanged WP7.4.4b cases: 30/40/100-task classrooms and 100-task growth at
0/5/20/50 **batch** cycles, with logs, criteria and long explanations. Each batch
retires/restores 20 subjects in repeated five-task chain/diamond blocks. The same
stored arrays and original baseline are preserved. B/C factor immutable definitions
but do not invent absent before/after history, so no full reconstruction is claimed
for those seven cases. C has no checkpoints there and equals B in byte size.

Four new cases use a fresh 100-task highly interconnected DAG. Task Ti has T1
and up to ten immediately preceding tasks as predecessors (deduplicated). This
gives **1,034 edges**, maximum 11 predecessors, root direct fan-out 99 and 99 unique
downstream successors. Root retirement removes 99 outgoing edges while retaining
935 other edges; restoration explicitly reviews their reinstatement. Each scope
review has exactly 100 final task outcomes (root + unique successor closure), not
one per traversed path. c1/c5/c20 mean 1/5/20 root retirement/restoration cycles
(2/10/40 accepted changes); c20 retains 1,980 archived edge episodes and 40 reviews.
Original baseline is freshly established once with unchanged WP1 and stays identical.
The reused status/actual mix is retained, including a Complete root: retirement
changes lifecycle/graph scope independently of completion. The measured closure is
the active input-graph review, not a claim about forecast delay or actual-date truth.

`dense100-text200` retains the same dense initial graph with 200 description edits
and no retirements. Text is up to 500-character synthetic rationale; status/actual
facts are not inferred. All new cases capture exact before/after operational
changes from a known synthetic revision 1, not unknown earlier history. B includes
that base and changes; C adds operational checkpoints every 20 changes, bound to
the same baseline hash. These illustrations are not a new wire profile or complete
domain validator. Generic path changes repeat paths and changed W decision IDs;
their cost is not a bound on every possible typed-event representation.

## Exact UTF-8 sizes

Raw means the written pretty UTF-8 file including final newline; canonical means
JCS full bytes. A includes the proposed `/2` envelope; B/C are conspicuously named
assessment encodings, with their own small metadata. Operational-only is a detached
purpose view for the same scenario; it is not itself a portable project or existing
repository response. Bytes, not rounded KiB:

| Scenario | A raw | A canonical | B raw | B canonical | C raw | C canonical | Operational canonical |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| class30 | 363,377 | 199,653 | 254,534 | 157,792 | 254,534 | 157,792 | 70,753 |
| class40 | 827,340 | 504,852 | 561,878 | 383,030 | 561,878 | 383,030 | 167,810 |
| class100 | 3,551,755 | 2,484,691 | 2,380,311 | 1,814,351 | 2,380,311 | 1,814,351 | 797,808 |
| growth100-c0 | 1,983,535 | 1,415,047 | 1,487,663 | 1,150,111 | 1,487,663 | 1,150,111 | 734,248 |
| growth100-c5 | 5,570,118 | 3,986,490 | 3,361,016 | 2,610,744 | 3,361,016 | 2,610,744 | 743,676 |
| growth100-c20 | 16,305,498 | 11,676,450 | 8,957,681 | 6,969,249 | 8,957,681 | 6,969,249 | 744,941 |
| growth100-c50 | 37,777,188 | 27,057,300 | 20,151,632 | 15,686,880 | 20,151,632 | 15,686,880 | 745,022 |
| dense100-c1 | 1,907,461 | 1,331,467 | 3,823,941 | 2,639,598 | 3,823,941 | 2,639,598 | 812,690 |
| dense100-c5 | 4,597,364 | 3,021,186 | 9,953,838 | 6,314,235 | 9,953,838 | 6,314,235 | 812,993 |
| dense100-c20 | 14,692,941 | 9,366,073 | 32,964,029 | 20,117,201 | 35,234,057 | 21,743,546 | 812,997 |
| dense100-text200 | 1,566,048 | 1,181,325 | 2,945,197 | 2,258,301 | 14,301,485 | 10,396,186 | 813,908 |

Lossless factoring cuts growth100-c50 canonical bytes by about 42%, but remains
above 10 MiB. In dense100-c20, adding exact recorded-state reconstruction makes
B about 2.15× A; C adds 1,626,345 bytes beyond B. Text200 checkpoints add 8,137,885
bytes beyond B. These are information/representation trade-offs, not proof that
event sourcing always saves or always wastes space. A does not supply B's exact
reconstruction information.

## Retained context and section contributions

Canonical value bytes (keys/framing are separate). A subsets overlap its full
current, so **do not sum subset rows with enclosing sections**. B/C disjoint root
values still need object keys/framing and other metadata to equal total bytes.
The raw report has every section for every scenario.

| Section | growth100-c50 A | dense100-c20 A | dense100-c20 B |
| --- | ---: | ---: | ---: |
| Current including inline history / B operational current | 12,948,536 | 5,659,568 | 812,964 |
| Original baseline | 83,839 | 94,432 | 94,432 |
| Explanatory events | 14,024,217 | 3,611,367 | 90,164 |
| Lifecycle decision values (A subset / B definitions) | 8,521,121 | 269,341 | 269,733 |
| Before-context values (subset) | 6,761,065 | 235,486 | 235,486 |
| Scope reviews (A subset / B definitions) | 2,986,301 | 3,252,968 | 3,253,440 |
| Archived edges (A subset / B definitions) | 694,627 | 1,322,757 | 1,349,941 |
| Recorded operational base | not supplied | not supplied | 812,690 |
| Before/after recorded changes | not supplied | not supplied | 13,400,433 |

The fan-out case is dominated by whole-closure review/rationale, edge episodes and
new replay context; the reused repeated-block case retains much more subject
before-context. Neither should be generalized to all classroom plans.

## Retrieval, parsing and memory

Selected exact scenarios; all remaining runs are in evidence. Query is a linear
in-memory filter plus first 20 rich records, not an indexed database lookup.
It filters task T1, ScopeReview, recording time in November 2026 and a pinned
logical-revision watermark. There is no claim that factoring makes scans faster.

| Scenario / option | Parse median ms | Page median ms | Max RSS after parse MiB | Max pipeline RSS MiB |
| --- | ---: | ---: | ---: | ---: |
| class100 A | 5.62 | 1.41 | 59.31 | 81.30 |
| class100 B | 4.47 | 0.84 | 56.44 | 77.36 |
| growth100-c50 A | 60.63 | 2.46 | 158.37 | 361.24 |
| growth100-c50 B | 33.56 | 2.42 | 105.09 | 297.89 |
| dense100-c20 A | 26.84 | 5.18 | 95.93 | 185.57 |
| dense100-c20 B | 57.47 | 6.07 | 153.75 | 370.00 |
| dense100-c20 C | 61.64 | 5.41 | 160.11 | 371.97 |
| dense100-text200 B | 4.81 | 0.10 | 68.93 | 138.07 |
| dense100-text200 C | 24.09 | 0.16 | 102.07 | 189.91 |

Operational-only growth100-c50 parses in 1.16 ms at a 50.83 MiB process high-water
mark; dense100-c20 parses in 1.33 ms at 61.65 MiB. Their canonical payloads are
745,022 and 812,997 bytes. Separate original baseline loads are 83,839/94,432 bytes,
with 0.22/0.27 ms parse medians. This supports separating payloads; it does not prove
an implemented lazy adapter, bound browser RAM or remove Node runtime overhead.

## Historical reconstruction accuracy and cost

All covered synthetic recorded revisions reconstruct to independently captured
operational-state hashes in B/C; full re-expanded A values and baseline/digests
match. Before-context mismatch and selected checkpoint corruption reject. Earlier
revision 0 is Unknown. The harness's **1,180 research assertions** include those
checks and equivalent paged rich history without duplicate IDs, separately from
the existing app tests. They are not format conformance or concurrency tests.

The worker requests 90%-through and latest recorded revisions. Timed reconstruction
includes copying and canonical result-hash verification; below is the median total
for those two requests, not one query. Replay steps for the two targets:

| Scenario | B steps | C steps | B two-request median ms | C two-request median ms |
| --- | --- | --- | ---: | ---: |
| dense100-c1 | 1 / 2 | 1 / 2 | 32.25 | 32.68 |
| dense100-c5 | 9 / 10 | 9 / 10 | 100.68 | 105.24 |
| dense100-c20 | 36 / 40 | 16 / 0 | 334.56 | 91.64 |
| dense100-text200 | 180 / 200 | 0 / 0 | 762.06 | 24.97 |

Targets landing exactly on checkpoints favour C and are explicitly disclosed.
No checkpoint-interval sweep, arbitrary graph/version migration, arbitrary
effective-date reconstruction, streaming import/export or event-index benchmark
was executed. A cannot generally reconstruct complete past state from its
explanatory events; reused B/C fixtures cannot create that missing information.

## 10 MiB policy consequence

10 MiB is 10,485,760 raw UTF-8 bytes. A growth100-c20/c50 exceeds it even canonically;
factored B growth100-c50 also exceeds it. Dense100-c20 A fits canonically but its
pretty file does not. Thus pretty input can fail a raw resource policy even when
the same snapshot's canonical export fits. A legitimate long-lived value may be
larger than a safe classroom reader permits. `FileTooLarge` is a resource rejection,
not proof of invalid domain semantics or storage corruption.

No finite cap guarantees unlimited history. Keep data/source and accepted state,
never silently prune records, and resolve higher-cap recovery/export paths before
claiming lifetime portability. Browser quotas, database capacity, operational
query limits and portable import safety are different bounds. This package does
not raise any limit, change a format or install a reader.
