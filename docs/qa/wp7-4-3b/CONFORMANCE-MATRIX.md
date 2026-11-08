# Executed conformance and unproved cases

The [parameterized suite](tests/conformance.ts) accepts a factory returning only
the typed port and explicit failure/uncertainty controls. Expected data and the
narrow validator/fingerprint are [separate fixtures](tests/fixtures.ts); the suite
does not inspect reference maps, counters or cursor encoding. It can be applied
to another adapter with a test harness, but native adapter tests are also required.

| IDs | Executed assertion | Cases |
| --- | --- | ---: |
| C01–C03 | Frozen full snapshot create/load, stable IDs, duplicate-label copies, opaque cursor pagination and namespace/invalid cursor rejection | 3 |
| C04 | Invalid list limits0/-1/101/fraction/NaN | 5 |
| C05–C06 | Empty/missing resource; whole-snapshot expected+1 and original baseline/source arrays/history retained | 2 |
| C07 | Wrong counter or same-counter wrong fingerprint rejects unchanged | 2 |
| C08 | Two disjoint task writers from17: one18, one StaleRevision; exact winner replay accepts no second revision | 1 |
| C09 | Same create retry ID/receipt; different label or content conflicts without another copy | 1 |
| C10 | Reused commit ID with changed candidate, expected revision or expected fingerprint is TransactionIdReuse | 3 |
| C11–C14 | Old receipt18/current19; create/commit/per-resource scope; separate-namespace copy17→18; no copied receipts or source-command retargeting | 4 |
| C15 | Validation, AccessDenied, Unsupported, known capacity failure and retryable Busy on each load/list/create/commit, no accepted mutation | 20 |
| C16 | Unknown create and commit, both accepted and unaccepted simulated outcomes; exact retry/load reconciles once | 4 |
| C17 | Undispatched draft has no persistent effect; no cancel method is invented | 1 |
| C18 | Reject baseline identity/opaque/originalWP1/removal, old-history edit/order or lineage change | 7 |
| C19–C20 | Known-lineage copy preserves established baseline; absent baseline remains absent when none is known | 2 |
| C21 | Create rejects nonpositive, fractional, unsafe, infinite and NaN revisions | 6 |
| C22 | Commit rejects unchanged/skipped/fractional/unsafe next revision | 4 |
| C23 | Max safe revision can load/copy/replay; cannot increment | 1 |
| C24–C25 | Caller, loaded/listed/ref/receipt/replay/conflict mutations cannot alias accepted memory | 2 |
| C26 | Injected fingerprint or validation exception returns known typed rejection before mutation | 2 |
| C27 | Empty/long label or empty create/commit transaction ID rejects without new state/receipt | 4 |
| **Total** | **Passing executable reference cases** | **74** |

Compile-only tests additionally require opaque identity separation, recursively
readonly input/output snapshots, readonly refs/receipts and NotCommitted versus
unknown-outcome distinction. They are type assertions, not extra runtime test counts.

## What these tests cannot establish

- The reference runs an entire memory transition synchronously before yielding
  its Promise. C08 demonstrates the semantic result for ordered memory writers,
  not browser tabs, native Web Locks, a network race or database isolation.
- Receipts last within a reference instance. There is no disk/process/restart/
  power-loss durability, native crash or eviction proof. Unknown responses and
  before-write failures are injected. No access-control implementation is claimed.
- Snapshot copying between reference namespaces is a data portability exercise,
  not portable-file export/import. No format6 codec, format1–5 upgrade, down-export,
  canonical hash/golden vectors, replay or production-schema conformance is run.
- The narrow baseline/history fixture cannot prove full original WP1 semantics,
  graph/criteria/completion/commitment/Unresolved consistency or detect malicious
  external edits. C06 accepts an entire synthetic edit atomically; real grouped
  completion semantics await the deferred model/validator.
- Existing browser tests cover today's unchanged UI. There is no new save path,
  React publication, cancel UX or evaluator consumer to certify. A future
  coordinator must reconcile OutcomeUnknown and old receipts before publication.
- R04/R05 native adapter failure/corruption/capacity/two-tab/migration tests and
  cross-browser support remain outstanding. See the prior
  [failure matrix](../wp7-4-3a/CONCURRENCY-FAILURE-MATRIX.md); its native rows are
  not discharged by this suite.
