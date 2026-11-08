# WP7.4.3a verification and limits

Design-only handoff, client date **2026-11-07 (America/Regina)**. Host evidence
timestamps are UTC on2026-11-08. Clean starting branch
`feature/wp7-stabilization`, HEAD `f61cacecd97bbfd5b83f48576aec8775d380a121`.
No production source, engine, forecasting formula, accepted pure evaluator,
existing codec, configuration, dependency or old acceptance sheet was changed.

## Executed checks

| Command | Actual result | Evidence |
| --- | --- | --- |
| `npm.cmd run check` | Exit0: lint, typecheck,551 unit/component tests in36 files, production build passed. | [Full log](evidence/check.txt) |
| `npm.cmd run test:e2e -- --workers=3` | Exit0:223 Chromium browser checks passed in2.4minutes. Isolated owned4173 server; owner5173/5174 untouched. | [Full log](evidence/browser-all.txt) |
| `node docs/qa/wp7-4-3a/diagnostics/contract-examples.mjs` | Exit0:33 illustrative checks, comprising28 toy contract cases and five existing-format read-only round trips. | [Log](evidence/contract-examples.txt), [individual outcomes](evidence/contract-examples.json), [source](diagnostics/contract-examples.mjs) |
| `npm.cmd run lint` after final diagnostic edit | Exit0. | [Log](evidence/lint-final.txt) |
| Documentation scope, local links, unchecked decisions, diff whitespace and protected references | Passed before commit. Only this new package staged. | [Scope evidence](evidence/scope-review.json), [metadata](evidence/verification.json) |

These are the existing application's regression results, not a pass rate for
an unimplemented repository. Tests regenerated tracked historical screenshots/
metrics; those generated differences were restored to the clean starting
versions. No historical evidence was republished as new results.

## Illustrative reference examples: what they establish

The diagnostic uses a minimal synthetic snapshot and two fake backings: object
memory and serialized JSON in memory. It illustrates conditional revision/hash
comparison, create identity, receipt replay/reused-ID rejection, baseline and
history prefix guards, atomic grouped toy completion/dependency/Unresolved,
known failure/no publication, unknown acknowledgement reconciliation and
transport-independent snapshot transfer. Export timestamp changes do not alter
the toy semantic fingerprint. Original receipt/current ref are distinguished
after later accepted changes.

Both fake methods execute their critical section synchronously in one Node
event loop. `Promise.all` illustrates an ordering with one winner, **not native
two-tab concurrency or proof of compare-and-swap**. Quota/security/lock errors,
response loss and drift are injected; no browser storage is used by this
diagnostic. Draft cancellation means no call. It is not a crash, server failure,
storage durability or physical rollback test.

The examples deliberately use simplified result shapes and a minimal validator.
They do not compile/implement the proposed TypeScript port, full domain schema,
history replay, complete baseline/opaque-extra/known-lineage enforcement or
canonicalization golden vectors. The proposed next private typed suite must
use the exact agreed types. Two memory representations are a portability
illustration, not certification of browser/API/relational DBMS substitutability.

L1-L5 exercise the **existing** decoder/serializer on existing format1-5
fixtures, compare decoded round trips and confirm source text unchanged.
Existing validation may invoke the existing WP1 engine; no engine/evaluator
logic was changed. These checks implement no format6 codec, copy-upgrade,
migration, down-export or new key. Those remain explicit future criteria in
the [failure matrix](CONCURRENCY-FAILURE-MATRIX.md).

## Native evidence and remaining verification

The [browser decision](BROWSER-ADAPTER-DECISION.md) links the prior WP7.4.1
native primitive observations. This package does not rerun Web Locks/storage
spikes or claim an implemented adapter. Existing223 browser regressions do not
certify the new port or Firefox/Safari/Edge/mobile/private/managed/deployed
contexts. Native locked whole-library writes, different-resource preservation,
known-lineage races, receipt durability, migration interruption, lost response
and crash-before-publication need the later adapter's tests.

No new UI, screenshot, student participant study, screen-reader assessment,
latency/quota benchmark, API/DB transaction, authentication or collaboration
test was performed. The8MiB/8x/10MiB layout comparison is arithmetic and proposed
policy, not measured performance or usable browser capacity.

## Requirement-to-artifact review

| Required area | Review artifact |
| --- | --- |
| Scope, requirement provenance, old acceptance separation | [README](README.md) |
| Storage-independent typed port, identity/revision/receipt, atomicity, layers/publication | [REPOSITORY-CONTRACT](REPOSITORY-CONTRACT.md) |
| Reevaluate v2 key/cap/Web Locks, per-project alternatives and costs | [BROWSER-ADAPTER-DECISION](BROWSER-ADAPTER-DECISION.md) |
| Portable file versus physical persistence,6.0-A clashes, revisions, immutable baseline, old formats/backups | [FORMAT6-IMPACT](FORMAT6-IMPACT.md) |
| Stale/concurrent/duplicate/missing/invalid/failed/crash/cancel/unsupported/migration/portability outcomes | [CONCURRENCY-FAILURE-MATRIX](CONCURRENCY-FAILURE-MATRIX.md) |
| Conditional HTTP/ETag, server authority, relational unit of work and deferred collaboration | [FUTURE-API-ADAPTER](FUTURE-API-ADAPTER.md) |
| Smallest next private slice and independent implementation/activation gates | [IMPLEMENTATION-IMPACT](IMPLEMENTATION-IMPACT.md) |
| New mechanism decisions and separate next authorization, all blank | [OWNER-DECISIONS](OWNER-DECISIONS.md) |
| Executed versus illustrative versus unimplemented verification | This document and linked evidence |

Material amendments remain Pending: grouped project revisions, domain lineage
versus stored-copy identity, removal of routing/export metadata from domain
history/hash, copy/import revision preservation, duplicate labels and honest
OutcomeUnknown after dispatch. They revise older pending mechanisms; they do
not change accepted engine/baseline semantics. WP7.4.2 acceptance is limited to
the unused pure evaluator; independent older owner gates remain unchanged.

## Commit and owner handoff

Commit/push only `docs/qa/wp7-4-3a/` to `feature/wp7-stabilization`. Local and
remote main/release references were checked against the recorded protected
values before commit; verify them again after push and report the design SHA
to the owner. Do not merge, tag, deploy, create storage or proceed to WP7.4.3b.
Owner acceptance and all new mechanism choices remain unchecked.
