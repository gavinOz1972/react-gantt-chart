# WP7.4.1 verification and unsupported claims

Review date: **2026-11-07, America/Regina**. UTC logs can be dated Nov8.
Starting clean `feature/wp7-stabilization` at
`93bcc5396724b02cc00361e87113a26f3a563b64`. Authority/hash and inherited
conditions are in [README](README.md). Only this design/evidence package changes.

## Exact executed commands and results

Commands ran from `wp7-stabilization`, redirected to ignored `.wp741-*.log`
files; final copies below are UTF-8 with terminal color/trailing spaces removed.

| Command | Actual result | Evidence |
| --- | --- | --- |
| `npm.cmd run check` | Exit0: lint, typecheck, **486 unit/component tests in35 files**, production build pass | [check.txt](evidence/check.txt) |
| `npm.cmd run test:e2e -- --workers=3` | Exit0: **223 existing Chromium browser tests pass**, about2.6 minutes | [browser-all.txt](evidence/browser-all.txt) |
| `node docs/qa/wp7-4-1/diagnostics/storage-spike.mjs` | Final exit0: **22 design diagnostics pass**, including five existing format fixtures | [final log](evidence/storage-spike.txt), [observations](evidence/storage-spike.json), [script](diagnostics/storage-spike.mjs) |
| `npm.cmd run lint` after final diagnostic edit | Exit0 | [lint-final.txt](evidence/lint-final.txt) |
| Source, branch/protected-ref, requirement-hash, decision-box and link guards | Only `docs/qa/wp7-4-1/` added; old acceptance and production/test/config paths unchanged | [verification.json](evidence/verification.json) |

Environment: Node24.19.0/npm11.17.0, Vitest5.0.5/Vite8.3.5,
Playwright1.64.1 / Chromium156.0.8078.4, Windows. Existing browser scenarios
use America/Regina and an owned localhost4173 server/isolated contexts.
The spike uses a separate ephemeral127.0.0.1 port and fresh browser context,
and keys prefixed `wp741:diagnostic:`. It never opens the owner app, shares
the owner browser profile, restarts the development server or reads real
owner project data. Browser commands used authorized process-cleanup execution.
No dependencies/configs were changed. Generated historical QA/review evidence
from the regression suite was restored, including WP7.3.3 screenshots.

## What the spike demonstrates

- F1-F5: each original format1-5 fixture parses and round-trips through today's
  codec; a current-format5 save preserves supported fields and decoded baseline.
  Source fixture raw strings remain unchanged. Decoded baseline serialization
  hashes are observations, **not** the proposed sorted-key C(baseline) or a
  test of opaque-extra preservation/new v6 migration.
- F6-F8: current reader rejects6; unknown data put under5 is dropped by known
  field reconstruction; one unsupported record fails the old whole-library
  read without writing. These motivate versioning/storage separation.
- B01-B05: actual secure loopback Chromium locks, cooperative two-tab exclusion,
  same-revision contention and locked stale-revision check work in a counter
  stand-in. One concurrent write succeeds; the other is Busy or Stale.
- B06-B09: injected quota/accessor failures preserve the stand-in key/accepted
  value. Separately, an actual32MiB setItem rejection raises QuotaExceededError
  and leaves its prior value; an actual opaque sandbox origin raises SecurityError.
  The latter is not a test of school privacy/managed-profile settings.
- B10-B12: one write with UI publication omitted survives tab close; matching
  retry finds its receipt without duplicate count, mismatched intent collides,
  closing the lock holder eventually releases the native lock.
- B13-B14: negative control proves a raw noncooperating writer can change storage
  while another tab holds a Web Lock. Legacy sentinel string stays unchanged.

Initial spike exit1 expected immediate success after closing a lock holder,
but observed Busy. The diagnostic incorrectly assumed synchronous release.
It now uses a bounded queued observation (AbortSignal timeout3s) before the
next attempt; the proposed production API still uses ifAvailable and returns
Busy for deliberate retry. The [initial log](evidence/storage-spike-initial.txt)
is retained. This was an evidence/contract timing correction; no production
adapter existed or was modified. Final spike reruns pass. All existing tests
passed on their first WP7.4.1 run; no expected-data/test clarification needed.

## Claims explicitly not established

The counter protocol is a primitive diagnostic, not the proposed format6
decoder, project migration, whole-library multi-entry adapter, baseline guard,
event/intent hash replay or transaction UI. It cannot prove those implementations
are correct. They remain future acceptance rows in
[ACCEPTANCE-TEST-MATRIX](ACCEPTANCE-TEST-MATRIX.md).

No general Safari/Firefox/Edge/mobile/HTTPS/profile support is certified.
No atomicity across keys, origins, profiles, devices, backup downloads or disk
failure is claimed. Tab close with publication omitted is not power loss or
OS/process crash. Simulated errors are distinguished from native failures.
Web Locks coordinate cooperating writers only. Specifications and observed
limits are cited in [P09](P09-STORAGE-DECISION.md).

No new working evaluator, Actual Start UI, v6 schema activation, save adapter,
archival or simplified Gantt is implemented. No new visual screenshot,
screen-reader session, student study or new40-task review benchmark is claimed.
Current30/40-task regression checks exercise today's app only. Proposed
performance/reader/owner gates require later measured verification.

## Requirement traceability

| Requirement | Artifact |
| --- | --- |
| Inherited conditional P01-P08/P10 and deferred P09/P11/P12 | [README](README.md), [OWNER-DECISIONS](OWNER-DECISIONS.md) |
| Exact format6 candidate, migration/backup/baseline semantics | [FORMAT6-CONTRACT](FORMAT6-CONTRACT.md), [P09](P09-STORAGE-DECISION.md) |
| API, fallback, two tabs/stale/crash-window/retry/quota/denial and qualified spike | P09, diagnostic observations and failure matrix |
| Phase-one referenced-delete guard/copy/current purge/privacy/IDs/orphans | [P11](P11-LIFECYCLE-DECISION.md) |
| Named projections, pure interface/diagram, pre-review provenance, all edit gates | [P12](P12-CONSUMER-CONTRACT.md) |
| Floor versus computed start, joins, exact H3 preservation | [P01](P01-CALCULATED-COMMITMENT.md), literal C01-C12 |
| Actual history, deterministic review, baseline invariants,30/40 tasks/accessibility/failures | [ACCEPTANCE-TEST-MATRIX](ACCEPTANCE-TEST-MATRIX.md) |
| Challenge to premature foundation activation, bounded first slice/rollback | [IMPLEMENTATION-SEQUENCE](IMPLEMENTATION-SEQUENCE.md) |

WP7.1, WP7.3, WP7.3.2 and WP7.3.3 acceptance remain independent. New decisions
and first-slice authorization stay unchecked. Main/protected tags, accepted
data, original checkout, immutable baseline and architecture PDF are unchanged.
After this design push, stop for owner review and a separately named package.
