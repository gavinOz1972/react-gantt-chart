# Three architecture options

All options keep authoritative current state, the immutable original baseline,
stable IDs, four progress statuses, honest Unknown/Partial, rationale and explicit
retirement/restoration successor review. None makes effective dates equivalent to
recording order or requires replay to edit the current plan.

| Concern | A: existing snapshot-history/2 | B: current + structured immutable events | C: B + optional historical checkpoints |
| --- | --- | --- | --- |
| Storage and duplication | Full current and baseline; repeated inline/event decision and review definitions. Closure and episode counts dominate growth. | Store each immutable definition once with references; preserve sufficient before/after context for a separately defined reconstruction boundary. Context can cost more than deduplication saves. | Same B records plus checkpoint state, digest and provenance. No deletion of events; larger storage unless checkpoints replace some other explicitly approved reconstruction strategy. |
| Ordinary memory | Whole-file parse today for portable use. Future physical decomposition can fetch an operational projection without changing the wire contract. | Purpose-based repository can read current and only requested history. Lazy access depends on adapter/API, not the word “events.” | Same ordinary footprint as B if checkpoint loading is explicit. Loading all checkpoints defeats that goal. |
| Task/type/date history | In-memory scan is simple; a decomposed physical store can index existing event metadata. No mandatory wire amendment to add indexes. | Natural event/task index with referenced definitions joined on demand; indexes and rich-record materialization have cost. | Same as B; checkpoints do not improve ordinary event filtering. |
| Exact reconstruction | Not generally available: explanatory summaries are insufficient. Some individual before-context is known, not every past state. | Possible only from a qualified base and complete versioned deltas in the covered interval; gaps yield Partial/Unknown. | Nearest valid checkpoint plus covered deltas shortens replay; validate checkpoint identity, source revision, baseline binding and integrity. |
| Baseline integrity | First B remains a separate full immutable value, not rebuilt from history. | Same; reference by stable identity/hash internally, preserve full value for export. | Same; checkpoint never becomes the original baseline. |
| Retirement/dependencies | Explicit current active graph, retained registry, archives per removal episode, common-source before-context and one review per unique affected ID. | Same semantics must be represented by immutable typed events/definitions. No unreviewed replay command may bypass full closure checks. | Same; checkpointing cannot turn old archives into active edges or invent missing reviews. |
| Concurrency | Existing generic expected-ref/transaction rules are a starting point; physical adapter absent. Full-snapshot writes can be costly. | Atomic current + event/definition append + head/receipt update; stale reviews must be reconfirmed. Before-context can detect divergence but is not a substitute for compare-and-swap. | Same, plus asynchronously created derived checkpoint bound to a committed revision; checkpoint failure must not misdescribe an uncommitted change. |
| Crash/recovery | Full candidate must publish atomically. Existing localStorage library is not the new port. | Head and history must commit together; lost acknowledgement reconciles exact intent. Orphan staged data must not appear as accepted history. | Same, plus reject/quarantine invalid checkpoints and fall back only within intact covered event ranges; never silently repair an import. |
| DBMS mapping | Current row/document plus tables for immutable records and relationships can materialize the exact /2 value. SQL tables need not mirror JSON. | Similar tables with typed changes, before/after/version metadata and supporting indexes. More constraints and event schema evolution. | Adds checkpoint blobs/manifests and retention indexes. Storage and verification overhead buys explicit historical reads. |
| Portable compatibility | Existing proposed /2 semantics and exact digest remain. Format 6 still unimplemented/unaccepted as a whole. | Physical factoring can export exact A; changing wire fields/definitions/replay promises requires explicit profile/version amendment, not reusing /2 with different bytes. | Derived checkpoints can stay repository-private; exporting authoritative new sections requires a separately versioned contract. |
| Verification | Strict raw lexical, full domain/lineage/closure validation, hashes and state preservation; full digest/export still touch retained history. | All A guarantees plus stable reference resolution, immutable single definitions, delta completeness, before/after checks, versioned replay and old-data limits. | All B guarantees plus checkpoint provenance/corruption/gaps/parity and selection rules. |

## What the illustrations actually compare

The [harness](scripts/illustrations.mjs) has two deliberately separate mechanisms:

1. **Lossless factoring** moves existing `/2` decision/review/archive definitions
   into ID maps and replaces exact duplicated event payloads with references.
   Order arrays preserve original order. Re-expansion matches canonical `/2`
   snapshots/digests. This is test-only encoding, not a new accepted project file.
2. **Recorded-state research** adds a known synthetic operational base and
   before/after path changes for the new dense/text scenarios. It records actual
   stored values, including accepted W context; it does not rerun formulas to
   reconstruct states. C additionally retains every twentieth recorded state.

The second mechanism buys information that A does not promise, so its size is
not a like-for-like “compression” ratio. The generic path representation is an
illustration, not the recommended production event schema. It repeats long paths
and changed working-decision IDs. More efficient typed field deltas, immutable
working-context references or shared reason IDs might reduce bytes, but none was
measured or selected here. Those designs must preserve exact context and explain
whether they require amendment. No hypothetical savings are reported as results.

Repeated full text replacements, broad closure reviews, changed W context, short
histories and opaque legacy values can offer little advantage or make B larger.
Checkpoints add little when history is short or rarely reconstructed; intervals
must follow a measured historical-read requirement, not an arbitrary default.
See [STORAGE-MEASUREMENTS](STORAGE-MEASUREMENTS.md) for exact evidence.

## Assessment

Prefer a staged separation of operational reads and immutable history storage
while retaining A's semantic/export boundary initially. Do not adopt full event
replay or periodic checkpoints as default product requirements on these results.
This is a recommendation for owner disposition, not architecture selection for
implementation. [RECOMMENDATION](RECOMMENDATION.md) names amendments and gates.
