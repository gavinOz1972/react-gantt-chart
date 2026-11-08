# WP7.4.3b verification

Client date2026-11-08 (America/Regina). Starting branch
`feature/wp7-stabilization`, clean HEAD
`4d32a4e8ccb61651f422cdb2de242e6d0297573e`.
The change adds an unused type-only contract, its test runner bridge and this
documentation-owned reference/suite/evidence. Existing application code,
persistence, domain/forecast/evaluator, configs and dependencies are unchanged.

## Executed checks and exact outcomes

| Command | Result | Evidence |
| --- | --- | --- |
| `npm.cmd test -- src/repository/projectRepository.test.ts` (initial suite) | Exit0,69 tests before final cases/type assertions were added. | [Initial log](evidence/contract-initial.txt) |
| `npm.cmd run typecheck` (initial) | Exit1, two TS1294 diagnostics: constructor parameter properties conflict with erasableSyntaxOnly. Replaced with explicit readonly fields and assignments; configuration unchanged. | [Initial failure](evidence/typecheck-initial.txt) |
| `npm.cmd run typecheck` after correction | Exit0, includes documentation-owned test code transitively through src test bridge and compile-only readonly/type expectations. | [Corrected log](evidence/typecheck-corrected.txt) |
| `npm.cmd run lint` initial and after correction | Both exit0. | [Initial](evidence/lint-initial.txt), [corrected](evidence/lint-corrected.txt) |
| `npm.cmd run check` on final implementation | Exit0: lint/typecheck,625 tests in37 files (551 existing +74 conformance), production build. | [Full log](evidence/check.txt) |
| `npm.cmd run test:e2e -- --workers=3` (first run) | All223 assertions passed in2.5minutes, but the PowerShell wrapper returned1 after rendering the NO_COLOR/FORCE_COLOR warning as NativeCommandError. | [First browser log](evidence/browser-first.txt) |
| Same browser command with process-local NO_COLOR removed and explicit native exit capture | Native npm exit0; all223 existing Chromium checks passed. | [Verified browser log](evidence/browser-all.txt) |
| Focused final suite and owner C08/C11/C16 examples | Exit0:74 focused cases;1 C08,1 C11 and4 C16 cases pass when selected. | [Focused log](evidence/contract-final.txt), [case results](evidence/contract-results.json), [owner exercises](evidence/owner-exercises.txt) |
| Scope/links/graph/bundle guard | Bounded new files only; application graph excludes port/reference/evaluator; port erases to an empty module; existing asset bytes unchanged; local links resolve; acceptance unchecked. | [Guard](diagnostics/scope-check.mjs), [scope evidence](evidence/scope-review.json) |
| Final lint after documentation/guard additions | Exit0. | [Log](evidence/lint-final.txt) |

The constructor issue was the only compiler failure; no test assertion failed.
The first browser wrapper status was also nonzero as described above, so its
native status was explicitly verified in a repeat run. No production behavior
defect was found or corrected. The broader final suite
incorporates the corrected syntax, recursive readonly types and additional
boundary/identifier cases. No assertions or existing checks were removed.

Browser checks used their own loopback4173 server; owner5173/5174 sessions were
not restarted or controlled. They regenerated historical screenshots/metrics;
only these known generated differences were restored after the clean-start run.
The old evidence and acceptance files match the starting commit.

## Immutability, compatibility and scope evidence

The test-only reference does no persistent I/O. It prepares detached accepted
snapshot/receipt/result objects before the memory transition and checks receipt
intent before treating an old expected ref as stale. Same-ID changed intent is
TransactionIdReuse. A retry can return old committedRef and newer currentRef.
Readonly type tests also cover nested values even when a supplied generic S
was declared mutable. Unsafe caller mutations in C24/C25 cannot alter accepted
memory or retained receipts.

The [pre-change asset hashes](evidence/build-before.json) and final scope report
show identical application JS/CSS bytes. Existing file decoder dispatch, formats
1–5 and browser keys are untouched; the existing compatibility/browser checks
still pass. No real project/baseline was opened, saved, migrated or exported by
this package. Synthetic baseline/history fixtures are not user data.

Protected local/remote main and the v1.0-pre-progress/v1.1-pre-stabilization tag
objects/peeled targets were compared before commit and rechecked after push.
Only the named feature branch receives the bounded commit. The final owner
handoff reports the actual resulting SHA; no main merge/tag/deploy is performed.

## Limitations and dependent work stopped

The [conformance matrix](CONFORMANCE-MATRIX.md) distinguishes74 reference cases
from unproved native guarantees. One synchronous memory critical section,
injected errors/unknown acknowledgements and instance-lifetime receipts cannot
prove browser/DBMS races, disk durability, cross-browser support or real access
control. No React save integration exists to test publication/reconciliation.

R07 is deferred: complete format6 state/history/group/replay fields, canonical
hash profile/golden vectors, migration/backups and codec integration are not
implemented or frozen. Full baseline/original-WP1 validation and completion/
criteria/dependency/commitment consistency remain dependent on that contract.
Only known fixture invariants and exact fixture JSON fingerprinting are tested.
This stops the dependent full-model task rather than guessing a production
format. Copying synthetic snapshots across memory namespaces is not file I/O.

R04/R05 remain conditional future adapter choices. No localStorage, IndexedDB,
Web Locks, API, database, authentication, actual-start capture, guided review,
editor gate, PA/FF/CPM or chart work is included. WP7.4.2 remains unused and prior
independent acceptance gates remain unchanged. See
[traceability](CONTRACT-TRACEABILITY.md) for all type/example adaptations.

## Owner gate

Use [OWNER-RUNBOOK](OWNER-RUNBOOK.md) and [ACCEPTANCE](ACCEPTANCE.md). All new
acceptance boxes remain unchecked. Recommended next step is a separately
authorized R07 design/validation/representation decision, before a private
format6 foundation or physical adapter. Stop here for owner acceptance.

Structured check/reference metadata: [verification.json](evidence/verification.json).
