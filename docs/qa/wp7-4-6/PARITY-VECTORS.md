# Characterization and parity vectors

## Independent oracle

[legacyFixtures.ts](tests/legacyFixtures.ts) constructs existing consumer
inputs using existing baseline/transition/work-entry APIs.
[observeLegacy.ts](tests/observeLegacy.ts) imports only current production
functions. Neither imports the read-model transformation or repository port.
[capture-baseline.mjs](scripts/capture-baseline.mjs) ran in an isolated export
of starting commit `d0e99034c71dc6141ed8d56cad4f1a3be3627051`, with only those
two producer files and the capture script added. The projected shim and test
bridge were absent there when the final oracle was captured.

The [goldens](evidence/legacy-goldens.json) contain 24 outputs / 600,506 UTF-8
bytes. [Provenance](evidence/golden-provenance.json) records hashes, original
source hashes, fixture populations and `projectedAdapterExistedAtCapture:false`.
The script refuses overwrite without `--refresh`. Tests compare fixed expected
JSON and independent explicit assertions; they never regenerate the oracle.

An initial 18-case capture omitted `schemaVersion` from forecast settings and
therefore characterized ForecastUnavailable instead of valid capacity. This
was detected by inspecting the original forecast message, not by accepting a
shim match. The producer was corrected, settings/progress validation guards
were added, and the final 24-case corpus was captured independently in the
isolated original-source export. The invalid initial capture is not evidence.

The test-only [port seed](tests/portFixture.ts) uses authored trusted fixtures
over the unchanged WP7.4.5 reference adapter. It is **not a migration or full
portable `/2` validator**. Raw status events retain their IDs/body/order inside
an explicit fixture-only `LegacyStatus` payload. Work seeds retain only the
current records the legacy application actually has. No overwritten history
is invented. Retire/restore records are explicit synthetic target fixtures.

## Scope of comparisons

[parity.ts](tests/parity.ts) checks B01 (legacy output still matches fixed
golden), N01 (normal projected inputs), and D01 (selected-task history) for
each case. Normal reads are one operational load, one original-baseline read,
and at most one bounded direct historical-record read per currently Complete
task. `queryHistory` and `queryRetainedTasks` are forbidden on that normal path.
Selected detail queries are separately bounded by page items/bytes/page count,
task-filtered, revision-pinned, and return explicit continuation/coverage.

The [result ledger](evidence/parity-results.json) distinguishes ConditionalParity,
Gap, UnprovenContractGap and ApprovedTargetPopulationDifference. Conditional
parity assumes the explicit qualified fixture payload and known legacy input
shape; the generic port does not guarantee that payload. Network nodes/edge
IDs/critical flags/dimensions are compared; SVG path rendering is not a new
integration assertion.

| Fixture ID | Existing behaviour / fixed expected evidence | Projected result and diagnosis |
| --- | --- | --- |
| empty | Empty schedule/CPM/network/effort and original empty forecast | Exact compared subset; no invented tasks |
| created | M/Th/F, 3 slots/day; T1=5 h starts 11-02 hour 1, finishes 11-05 after hour 2; dependent T2 starts Thursday hour 3, finishes Friday after hour 2; (class 4 + homework 2) times team 4 = 24 h/week | Exact subset including dates, slots, capacity and health |
| complete | Complete keeps attestation/commitment; effective remaining 0; forecast releases dependent immediately | Exact forecast/health/effort using referenced real completion; PA remains gap |
| reopened | Last completion remains in old history although current status is In Progress | Forecast/current subset exact; PA prior-completion fact absent |
| never-completed | Same current state as reopened but no completion episode | Same op view as reopened; old PA differs (G01), so no invented equivalence |
| blocked | Blocked current reason and risk are retained | Exact current subset; full replay/editing unconverted |
| unknown-remaining | Null is Unknown; does not become zero or elapsed-calendar deduction | Exact unknown forecast/health/effort |
| partial-history | Reference coverage explicitly Partial, retained status rows available | Subset and retained rows match; partial is not evidence of full history |
| complete-no-reference | Valid legacy completion with historical commitment absent | Existing fallback/qualification retained, no fabricated commitment |
| timestamp-ties | Equal recordedAt legal; insertion order remains decisive | Sequence-desc rows match reverse insertion; no timestamp resort |
| work-corrected | W1 originally 2 h, corrected current 1.5 h plus W3 .25 h; recorded 1.75 h; remaining 5 h; EAC 6.75 h; baseline 5 h gives variance 1.75 h; log order W1, W3 | Aggregate arithmetic exact; selected work details/query gap; old 2 h version not recoverable |
| work-retracted | Current entry removed; recorded 0 h, optional logging still not proof of zero actual work | Aggregate exact; no fake immutable retraction event |
| no-baseline | No original B/variance/commitment marker fabricated | Exact available subset; explicit baseline absence |
| dense100 | 100 tasks, 1,034 unique active dependency edges; deterministic scheduling/CPM/network | Exact all characterized slots and classifications; not memory/I/O qualification |
| retired | Legacy pure functions still evaluate all 3 tasks; legacy has no lifecycle field | Target excludes retiredT1 and active links to it; **population difference**, not parity |
| restored | Authored lifecycle/retirement episode resolves restoration and active links | Active calculation subset matches legacy; explicit episode reads preserve archive refs |
| missing-history-invalid | Complete current state with no transitions is rejected by existing decoder | CompletionEvidenceMissing, no projected forecast/health/markers; legacy invalidity preserved |
| forecast-disabled | Settings disabled retains existing unavailable/disabled meaning | Exact current output, no invented enabled forecast |
| at-risk | Explicit At Risk fixture near target | Exact marker and calculated date (A01) |
| late-project | Explicit Late project/target outcome | Exact late marker/date (A01) |
| automatic-as-of | No fixed date; uses deterministic caller today | Exact As-of and forecast; no session-expiry/date confusion |
| zero-capacity | Class/homework zero, no future availability | Exact explicit zero-capacity outcome |
| same-day-actuals | Date-only same-date dependency order is unverified | Original PA warning captured/asserted; projected PA gap |
| after-complete-release | Current Complete forecast dependency release and dated completion output | Exact unchanged forecast subset; no PA/formula normalization |

For schedule/CPM/network/effort: **23 conditional matches +1 target-population
difference** each. For forecast/health/baseline marker outputs: **22 conditional
matches +1 population difference +1 explicit gap** each. Selected status rows:
**24 conditional matches**, with coverage retained. **All 24 PA and work-detail
comparisons remain unproven contract gaps**. Zero unexpected subset differences
does not turn those gaps into passes. Legacy B01 passes establish the fixed
oracle still describes the existing implementation, including invalid inputs.

## Additional high-risk assertions

| Test | Independent expectation / outcome | Remaining limit |
| --- | --- | --- |
| A01 | Explicit ordinal slot convention, 24 weekly capacity, 10 remaining, At Risk/Late, automatic As-of and zero capacity | Finite fixtures, not proof of all capacity/calendar combinations |
| A02 | All tasks Complete => remaining 0, project Completed, latest completion 11-05; exact projected forecast/health | Requires trustworthy completion payloads |
| A03 | Exactly 100 schedule tasks and 1,034 CPM/network relationships | No physical scalability claim |
| G01 | Reopened and never-completed have identical op views but different legacy reopen/PA context | Prior completion episode field/ref/query missing |
| G02 | Absent current record vs explicit Not Started yields identical op view but different `assumedStatus` | Status-origin qualification missing |
| G03 | Different current global DoD yields identical op view but different full dirty fingerprint | Current global guidance missing |
| G04 | Contributor/description change leaves aggregate view equal but log detail/fingerprint differs; corrected values/order asserted | Work-detail query/metadata missing; old corrections lost in legacy |
| G05 | Known actual start in op cannot enter current PA's legacy input model; legacy Unknown retained | Consumer/evaluator integration gap, not missing port start field |
| G06 | Existing missing-history state fails decoder and PA; projected output stays explicit gap | No normalization of damaged legacy input |
| G07 | Forecast immediate dependency release vs future completion PA Unknown and same-day warning | Existing models differ; owner decision before unifying semantics |
| G08 | Legacy physical deletion removes work/status evidence | Target retirement retention intentionally differs; no app delete conversion |
| G09 | Decreasing recordedAt fails legacy decoder with INVALID_STATUS_EVENT_DATE while sequence query can retain record order | Version/clock-policy discrepancy, not accepted-legacy parity |
| G10 | Existing B decoder drops an opaque extra; original repository B still retains it after math read | Known-field projection cannot be full backup/copy boundary |
| D02 | Pinned selected history remains unchanged after concurrent accepted name change | In-memory pinning only; no physical adapter claim |
| D03 | Unsupported, Unavailable, ReadExpired and RecordTooLarge remain explicit | UI handling not implemented |
| D04 | Unknown payload or conflicting pinned completion/commitment returns gap | Narrow fixture guard is not full production attestation validation |
| D05 | Mixed revision/fingerprint/resource reply rejected | Production providers need conformance separately |
| D06 | Retirement episode retains AR-T1-T2 and restored/unrestored resolution; active graph has no phantom links | Synthetic lifecycle fixtures, not migration or complete W proof |
| P01 | Existing format 5 export/parse round-trip retains full inputs; needs global guidance, log metadata and history | Formats 1–5 compatibility unchanged, portable `/2` Unsupported |
| Components (5) | Actual unchanged TaskStatusPanel rows/attestations for complete/reopen/ties; TaskWorkPanel corrected/retracted optional-log meaning | These render legacy inputs; no new paged/partial UI exists |

Total new checks:72 parameterized B/N/D +19 additional semantic/detail checks
+5 component characterizations = **96**. Assertions exposing missing contracts
pass as diagnostics; the corresponding consumer parity remains unproven.
There is no demonstrated production implementation defect to repair here.
