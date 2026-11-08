# WP7.4.2 verification and practical limits

Review date: **2026-11-07, America/Regina**. UTC logs can be Nov8.
Starting branch/tree: clean `feature/wp7-stabilization` at
`b9e258ddcb0c96e4ec96620f533247e6c9104049`. Authority/hash and clarifications
are in [README](README.md). Only new planning code/tests/fixtures and this
QA package change; no existing consumer, model or configuration is edited.

## Actual commands and results

Executed from the `wp7-stabilization` worktree; terminal output was redirected
to ignored `.wp742-*.log` files and retained here as UTF-8 text.

| Exact command | Result | Evidence |
| --- | --- | --- |
| `npm.cmd run check` | Final exit0: lint, typecheck, **551 tests in36 files pass**, production build pass. This is486 existing plus65 new evaluator tests. | [check.txt](evidence/check.txt) |
| `npm.cmd run test:e2e -- --workers=3` | Final exit0: **223 existing Chromium tests pass**, about2.5 minutes, after the final range correction | [browser-all.txt](evidence/browser-all.txt) |
| `node docs/qa/wp7-4-2/diagnostics/benchmark.mjs` | Exit0: six30/40-task fixtures,25 warmup plus300 measured calls each; unchanged-input/result guards pass | [performance.txt](evidence/performance.txt), [raw record](evidence/performance.json) |
| Static consumer/clock and source/dependency/config/ref/link checks | No production imports/invocations; existing protected paths unchanged; links valid and acceptance unchecked | [scope.txt](evidence/scope.txt), [verification.json](evidence/verification.json) |

Environment: Node24.19.0/npm11.17.0, Vitest5.0.5/Vite8.3.5,
Playwright1.64.1/Chromium156.0.8078.4 on Windows. Browser scenarios use
America/Regina and their owned localhost4173 server with isolated storage.
Authorized browser execution permits owned test-server cleanup; no owner
development server/browser profile/project library is used or restarted.

No dependencies, lockfile, public domain contracts, persisted fields or
format/version changes. Source modules for baseline, progress, WP1, PA1, FF,
CPM, codecs and UI remain byte-for-value unchanged in Git. The production
bundle still emits `index-1Q4VyGQ_.js` and `index-GW2dyLss.css`, the same names
as the starting implementation, with69 modules transformed. Typecheck includes
the new unused module; the app imports no new planning code.

## Independent checks and execution boundaries

The65 new assertions include all [literal C/E cases](TRACEABILITY.md), exact
binding/tie arrays, root/dependent manual semantics, H3 and explicit Advance,
past-date rejection, unaffected overdue prerequisites, future/reopened/started
Unknown, conflicting date-only evidence, input permutations and year1/9999.
Recorded completion selection follows existing event sequence, not maximum
effective date. Actual Start is only an explicit resolved read fact; no new
history decoder, attestation or persistence behavior is tested/implemented.

All evaluator calls in independent success/failure helpers snapshot/freeze
their caller objects/arrays/maps. Throwing Map mutators guard against writes.
Additional envelopes retain original baseline, old events, working promises,
source tasks and distinct0/4/99/null effort inputs. Separate unfrozen/output
alias assertions verify that the function does not freeze or mutate callers.
These are source-data invariants, not a new baseline capture/revision mechanism.

Size checks include300-node repeated diamonds (exponentially many potential
paths, which are never enumerated) and1200-node chains. Thirty/forty-chain
final dates Dec17/Dec31 from Nov6 are independently counted expectations.
Traversal is iterative over nodes/edges. The existing graph utility's sorted
ready list retains conservative O(V^2 log V + E) worst-case behavior; this
package does not claim to replace it with a linear-time graph implementation.
Event indexing and validation add O(H), with bounded calendar arithmetic.

Generated historical review/QA screenshots/metrics from full browser runs
are restored to their original versions; only this new package's evidence
is retained. No old owner acceptance checkbox is marked.

## Failures investigated

- Initial standalone typecheck failed because a runtime `every(record)` guard
  narrowed TaskInput[] into generic unknown records. A boolean shape helper
  preserves the typed API while still rejecting malformed input. The
  [initial typecheck log](evidence/typecheck-initial.txt) is retained. No public
  domain API or task-field contract was altered.
- The first54-case evaluator suite passed. Added boundary/size/identity and
  new-root/start-read-fact coverage brought it to64, also passing the full check.
- An additional targeted range regression then had **64 pass /1 fail**:
  a newly proposed root finish at year9999 unnecessarily calculated a planned
  next slot even though its successor was already Complete. The
  [failed log](evidence/range-initial.txt) demonstrates DATE_OUT_OF_RANGE.
  Planned release is now calculated only when unfinished dependent work
  consumes it. Last-date leaves/completed successor facts remain representable;
  a genuinely required unsupported future release still rejects. Final full
  unit/browser/build checks were rerun after the correction.

No failed final checks remain. C09's otherwise unspecified P window and C12's
raw-versus-normalized boundary are explicit fixture completions, not changed
expected answers. Optional Bound.source is explanatory metadata in the new
read model only. No unresolved contract contradiction or production-wide API
change triggered the package's stop-for-clarification condition.

## Node measurements and caveats

AMD Ryzen9 8945HX host,32 logical processors. Each interval measures the whole
evaluator call, including source scheduling validation, decoded progress,
old-state checks, graph/calendar evaluation and aggregation. Fixture creation,
loader startup and result assertions are excluded. Shared host, no CPU isolation.
Values below rounded to three decimals; raw record retains full precision.

| Tasks / topology | Edges | p50 ms | p95 ms | Max ms |
| --- | --- | --- | --- | --- |
| 30 sparse roots | 0 | 0.457 | 0.718 | 1.280 |
| 30 repeated diamonds | 38 | 0.511 | 0.747 | 1.181 |
| 30 long chain | 29 | 0.495 | 0.830 | 1.588 |
| 40 sparse roots | 0 | 0.593 | 0.873 | 1.231 |
| 40 repeated diamonds | 52 | 0.676 | 1.023 | 1.432 |
| 40 long chain | 39 | 0.639 | 0.975 | 1.410 |

Longest observed call:30-task chain,29 edges, about1.588ms. This fixture has
one root moved from its old Nov2 promise to reviewNov6, then full four-slot
tasks propagating to Dec17. The sample is not proof that30 tasks intrinsically
cost more than40; scheduler noise/GC/shared-host effects were not isolated.
These fixtures use ordinary Not Started work; unit cases separately cover
history/Unknown. No large-history or classroom-device benchmark is claimed.

Node call duration is not browser paint time, browser long-task measurement,
UI responsiveness, resource feasibility or owner acceptance. The evaluator
is unused by the223-browser suite, which checks that today's app still works.
No UI, screen-reader or student comprehension claim is made for this module.

Review [OWNER-RUNBOOK](OWNER-RUNBOOK.md), then record [ACCEPTANCE](ACCEPTANCE.md)
separately. No activation, format6, v2 storage, P11 lifecycle, P12 integration,
P10 chart revision, merge, tag, deployment, rebaseline or WP8 is authorized here.
