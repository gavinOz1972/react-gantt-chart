# Prioritized outstanding findings

Classification is scope-specific. **Release blocker** means a gate to the named
release claim, not necessarily a confirmed runtime bug. **Accepted limitation**
requires an explicit owner disposition; otherwise it is a limitation requiring
acceptance. **Deferred improvement** is not smuggled into a defect correction.
No new runtime defect was reproduced in the fresh regression runs.

## Open gates and limitations

| ID / priority | Classification / affected claim | Evidence and impact | Smallest next action |
| --- | --- | --- | --- |
| RR-01 / High | Release blocker - overall WP7 acceptance | WP7.1 and WP7.3/3.2/3.3 owner gates lack recorded acceptance. See historical sheets linked in OWNER-REVIEW. b acceptance is narrower. | Owner reviews or expressly disposes each gate and states release scope; no production change required to record a decision. |
| RR-02 / High | Release blocker - final R07 and any R07-integrated release | F04/F08/final consistency and U07 pending; complete `/2` codec/export, source-preserving upgrade, provider/durability/capacity and consumer parity unqualified. R07 sheet maps individual gates. | Decide the contract independently; separately scope the first necessary integration/qualification slice. Not a bug requiring all future features before a legacy pilot. |
| RR-03 / Medium | Release blocker - unqualified broad student-readiness claim; limitation requiring owner acceptance for a bounded pilot | QA71-004 and WP7.2/3.2/3.3 limits: no new student study or managed-laptop/assistive-technology qualification. Fast host/synthetic Chromium checks cannot establish course comprehension, hardware reliability or all-browser access. | Representative course workflow on declared devices/browsers; record accessibility needs, latency, results and conditions. No invented performance threshold. |
| RR-04 / Medium | Release risk disposition pending - QA71-003 | Fresh npm audit: 10 moderate affected development packages, 0 runtime findings; no high/critical. Old 12-moderate count is historical. See evidence/npm-audit-all.json and production JSON. | Review exposure and bounded remediation versus explicit time-bounded tooling-risk acceptance. npm-proposed fixes include major-version changes; no blind downgrade/audit fix or lockfile change. |
| RR-05 / High if retained audit is required | Limitation requiring scope acceptance; target direction accepted, current behavior unchanged | WP7.4.6 S02/C06; `src/App.tsx` delete removes task work/progress; corrections overwrite/retract old log data. This does not provide target retirement/history retention. Baseline remains. | For legacy pilot, explain irreversible history limits and backups; if course requires retained change evidence, block that scope until separately authorized lifecycle integration. Never backfill invented history. |
| RR-06 / Medium | Limitation requiring scope acceptance | Browser local library is whole-value localStorage, with explicit save and file-size/quota limits; no cloud shared ownership, concurrency protocol, durable backup service or multiuser authorization. | Declare single-authoritative-copy workflow and test recovery/export on intended platform; qualify provider only under a separate scope. |
| RR-07 / Medium | Known qualified limitation; older UI acceptance pending | WP7.3.2/3.3 date-only actuals, Unknown starts/reopened PA, planned-slot versus effort units, compressed gaps and conditional availability. WP7.4.6 S01 compares two different completion-release semantics. | Owner confirms qualifications meet course needs; characterize separately before any semantic/formula change. Do not treat current PA and forecast as interchangeable. |
| RR-08 / Medium for `/2` activation | Release blocker for future adapter/export, not current supported-known-field regression | WP7.4.6 P01/P02 and C01-C07: opaque B, guidance/prior completion/origin/work details/actual-start parity, full-S/export provenance gaps. Typed paging tests do not cure them. | Resolve typed read/codec ownership and independent golden comparisons before replacing normal consumers. Preserve accepted old readers/writer meanwhile. |

## Explicitly accepted narrow limitations

- WP7.4.3b port/test implementation is owner accepted **without** physical
  storage, production integration or R07 acceptance.
- WP7.4.7a/b loaded-legacy history slice and recovery feedback are owner accepted
  within default-off development/read-only scope. It makes no lazy physical-I/O
  or complete-audit claim. See [b acceptance](../wp7-4-7b/ACCEPTANCE.md).
- D01-D05 in [WP7.4.4d](../wp7-4-4d/OWNER-DISPOSITIONS.md) are accepted
  directions, including limited near-term reporting and separate archival design.
  They do not accept the unresolved implementation risks in RR-02/RR-08.

## Deferred improvements

| Item | Disposition / boundary |
| --- | --- |
| More about this change | Explicit low-priority owner deferral retained; no behavior change. |
| WP7.2 C07 expanded chart workspace, C08 meeting view, C09 student health history | Larger candidate enhancements; not previously implemented corrections. Need separately named scope; health history requires storage/compatibility decision. Four work statuses remain. |
| WP7.2 C10 horizontal anchor preservation | Optional polish; current Go to selected/impact is available. No new reproduction of data loss. |
| FR-HIST-01 named user snapshots | Registered future requirement; no model/capture/report implementation. Not first B or mandatory replay. |
| D05 archival/DBMS; arbitrary replay/checkpoints | Archival requires separate requirements/provider decisions. Exact historical reconstruction is excluded from near-term D03 scope; not a missing current promise. |
| Retired reports/Gantt toggle and first-B report | Defined future R07 reporting contracts; not implemented. Need separate authorization and data-readiness gates, not silently bundled WP8 work. |

## Resolved or superseded findings retained as history

| Historical item | Current disposition and evidence |
| --- | --- |
| QA71-001 | Fixed-date/fixture distinction and forecast Save workflow are covered by `tests/save-forecast-qa.spec.ts` and WP7.1 evidence. Fresh run passes; no new Save freeze shown. |
| QA71-002 | WP7.3 C06 adds explicit Automatic/Fixed As-of selection and refresh behavior. Fresh correction tests pass; do not carry the old ambiguous control as a new defect. |
| QA71-005 | WP7.3 C01 sticky visible Actions/Duplicate and overflow/focus handling implemented. Fresh task/correction browser tests pass; older sheet acceptance remains separate. |
| UX7-006; UX72-001/002/003 | WP7.3 C02-C05 implement effective zero for Complete, one-time initial remaining, recorded-data qualification and reopen review. Stored data retained; fresh regression passes. |
| UX7.4.7-001 / QA7.4.7-002 | Owner-closed by WP7.4.7a acceptance recorded in b's handoff. Do not reopen from old screenshots. |
| b recovery-feedback finding | Owner-closed November 11 under current supplied authority; fresh 38 feature-on browser checks pass. Original investigation/evidence remain unchanged. |

Passing tests of a known discrepancy are characterization evidence, not a fix or
authorization to change meaning. All new release-risk decisions remain pending
unless the explicit narrow acceptance above covers them.
