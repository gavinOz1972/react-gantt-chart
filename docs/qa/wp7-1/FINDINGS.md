# WP7.1 findings and owner triage

Assessment date: **2026-11-02**. Product under assessment:
`af96d3b257ddfdcbc7f26a968401d634d210aef6`, protected by
`v1.1-pre-stabilization`. No production corrections were made.

No confirmed application freeze, baseline mutation, fabricated history or
round-trip data loss was reproduced in these scenarios. This is a bounded
assessment, not proof that no defects exist. The original full browser run
had four failures; their date-sensitive test cause is retained below.

## QA71-001 — date-sensitive setup in existing Save regressions

**Severity: Medium. Classification: test limitation, resolved in test code.**
Affected: `tests/save-forecast-qa.spec.ts`, legacy formats **1–4** on a host
whose local date is **2026-11-02**. Format 5 already contains the explicit
As-of date and did not fail.

Reproduce with the accepted candidate's original test: run
`npm.cmd run test:e2e -- tests/save-forecast-qa.spec.ts --workers=3` on Nov 2.
It loads a legacy plan with no forecast settings, enables 4 class + 2
homework × 4 students, fills As-of with Nov 2, changes homework to 5,
opens/cancels/reopens the upgrade modal and confirms Save.

Expected by the test: `forecastSettings.asOfDate === '2026-11-02'`.
Actual: class/homework/team values are correct, Save completes, but that
optional property is absent. The input already displays today's date while
the form says **“As-of follows today locally.”** Filling its unchanged value
does not trigger the change handler, so the test never selected fixed mode.
This is not recursive serialization, a save freeze, or loss of an explicitly
fixed date. See `ForecastSettingsForm.tsx`'s `draft.asOfDate || localDate()`
display and optional-property serialization, both unchanged.

Evidence: [initial complete run](evidence/browser-initial.txt),
[original failure trace](evidence/qa01-date-assumption.trace.zip), and
[date-mode experiment](evidence/as-of-date-modes.json). The latter pins the
browser clock, proves same-value entry remains automatic, advances the date,
then proves an explicitly changed fixed Nov 2 survives Nov 3/reload with
baseline/source invariants intact.

Correction limited to the test: change As-of to Nov 1 and then Nov 2 before
asserting fixed persistence. The original strict expected settings assertion
remains. All five Save regression variants and the date-mode experiment
then passed (6/6). New fixture tests also use an As-of distinct from today.

Owner triage: accept this test correction as QA maintenance. No WP7.3 product
fix is justified by these four assertion failures. The interaction may still
merit the separate UX decision below.

## QA71-002 — pinning today's date is easy to confuse with automatic mode

**Severity: Low. Classification: UX concern / ambiguous product decision.**
Affected: current format 5 forecast form, and newly configured legacy plans.

Steps: choose **Use today automatically**, then re-enter the already
displayed date without changing it. Inspect the mode help text; Save/export.
Actual: the form remains automatic and omits `asOfDate`, as its help text
says. An intentional change to a different date and back selects fixed mode.
Evidence is the same [date-mode experiment](evidence/as-of-date-modes.json)
and [original trace](evidence/qa01-date-assumption.trace.zip).

Expected behavior requires an owner decision: should an explicit operation
to pin today be available, or is the current mode text and date-change
interaction adequate? The assessment does **not** classify automatic mode's
omitted date as a persistence defect, and does not claim that all native
date-picker gestures behave identically to automated unchanged-value entry.

Suggested WP7.3 scope, only if accepted: clarify deliberate fixed-today
selection while preserving automatic-today behavior and format compatibility.
Do not alter forecasting mathematics or silently convert automatic plans.
Manual owner confirmation of the confusing interaction is still pending.

## QA71-003 — development-tool dependency audit reports moderate advisories

**Severity: Medium. Classification: test environment/dependency finding;
application exploitability not demonstrated.**

Affected: the accepted, unchanged lockfile's development dependency tree.
Steps: `npm.cmd ci`, then `npm.cmd audit --json`; compare
`npm.cmd audit --omit=dev --json`.

Actual: full audit exits 1 and reports **12 affected packages, all moderate**,
with minimatch advisory
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
propagating through the ESLint/TypeScript ESLint development-tool chain.
This is not twelve distinct demonstrated application vulnerabilities.
The production-only audit exits 0 with **zero reported vulnerabilities**.
Expected release hygiene and acceptable residual tooling risk need owner
triage; no high/critical advisory was reported in this snapshot.

Evidence: [complete audit records](evidence/dependency-audit.json), captured
2026-11-02. No audit fixes, dependency upgrades or lockfile changes were made.

Suggested priority: review the advisory and a bounded tooling update, if
authorized, before release readiness. Scope must preserve the accepted
runtime behavior and repeat all checks. WP7.1 supplies evidence only.

## QA71-004 — laptop experience and owner execution remain unverified

**Severity: Low. Classification: test limitation.**
Affected: performance claims beyond this Windows host/Chromium build and
1440×900 viewport; owner acceptance of this assessment.

Steps run: three isolated 40-task passes, both overlays, remaining-entry,
Week scale, Compressed mode, chart scroll and Save. Actual: no freeze or
page error; save-to-painted confirmation **195.0–227.3 ms**, input
**164.3–172.3 ms**. One long task per run **69–105 ms**; synchronous storage
write **0–0.1 ms**. The host exposes 32 logical processors. A laptop-size
viewport does not make this a student-laptop hardware benchmark.

Evidence: [performance runs](evidence/performance-isolated-0.json),
[run 2](evidence/performance-isolated-1.json),
[run 3](evidence/performance-isolated-2.json),
[40-task screenshot](evidence/e13-forty-task.png).
Measurements include automation/actionability and paint overhead, not just
React computation. No application slowdown is inferred solely from them.

Owner triage: execute the 28-minute [runbook](OWNER-RUNBOOK.md), including
your normal laptop viewport/hardware. If a perceptible freeze occurs,
record the exact action/browser/project and promote it to a reproducible
WP7.3 candidate. No product fix is proposed from this limitation alone.

## Prioritized handoff

| Priority | Observation | Proposed owner decision | State |
| --- | --- | --- | --- |
| 1 | QA71-003, Medium | Accept tooling risk temporarily or authorize bounded dependency review | Awaiting triage; unchanged |
| 2 | QA71-002, Low | Keep current mode interaction or authorize fixed-today UX clarification | Awaiting owner observation/decision |
| Verification | QA71-004, Low | Run owner/laptop route and record results | Pending owner session |
| Closed QA work | QA71-001, Medium | Accept test-only setup correction | Corrected and rerun; no product change |

Confirmed application defects: **0**. UX concerns: **1**. Dependency findings:
**1**. Test limitations: **2** (one corrected). Unsupported requests: **0**.
These categories overlap only where explicitly stated above. There is no
authorized product-remediation backlog yet. WP7.2, WP7.3, WP7.4 and WP8 have
not begun.
