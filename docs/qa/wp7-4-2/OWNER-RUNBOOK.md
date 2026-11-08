# Owner review - intentionally no UI change

This package adds an unused pure calculation, not a visible application feature.
The existing localhost chart should look exactly as before. Do not import real
plans or change capacity/status settings to try to reveal this evaluator.
Review its literal examples, tests and measurements in the stabilization worktree.

## 1. Confirm branch and code

```powershell
cd C:\Users\gavin\Documents\CodexProjects\GanttProject\wp7-stabilization
git branch --show-current
git log -1 --oneline
```

Branch must be `feature/wp7-stabilization`; the latest WP7.4.2 implementation
commit is reported in the handoff. Open
[`src/planning/workingPlan.ts`](../../../src/planning/workingPlan.ts) and
[`workingPlan.test.ts`](../../../src/planning/workingPlan.test.ts).
The input is explicit and the output is a candidate; no App/UI/storage import
activates it. Existing development server can remain running; no restart needed.

## 2. Follow one worked example (3 minutes)

Four scheduled slots per working day, M-F. Review Nov11,2026. B's retained
not-before is Nov9 H1. A actually completedNov9 (conservative releaseNov10);
another predecessor P actually completedNov11 (releaseNov12). Every retained
edge must constrain B:

| Value | Expected |
| --- | --- |
| B not-before | Nov9 H1, a lower bound, not the result |
| Binding predecessor | P, conservative date-only releaseNov12 H1 |
| B calculated commitment, duration4 | Nov12 H1 through afterH4 |
| Actual finishing hour for A/P | Unknown; none is invented |

Inspect the test named **C01 condition both sides** and run it alone:

```powershell
npm.cmd test -- src/planning/workingPlan.test.ts -t "C01 condition both sides"
```

Then inspect **C03 exact H3 hold**. Its old B start9 H3 remains9 H3 despite
floorH1 and predecessor releaseH2. Choosing explicit null hold in C04 allows
the separately requested H2 proposal; the evaluator never chooses Advance.

## 3. Run bounded and full checks (3-5 minutes)

```powershell
npm.cmd test -- src/planning/workingPlan.test.ts
npm.cmd run check
```

Current expected counts:65 evaluator tests;551 total tests in36 files,
with lint/typecheck/build passing. Counts may grow in later authorized work.
Review C01-C12/E13-E18 against [TRACEABILITY](TRACEABILITY.md), especially
C09's Unknown variant, C10 no backdating and E15 prerequisite review. Tests
use fictional frozen data, not local browser projects.

The complete browser regression command, if you want to repeat it, is:

```powershell
npm.cmd run test:e2e -- --workers=3
```

It runs223 existing tests with its own localhost4173 server and disposable
storage. It does not make the evaluator visible in the app. These tests may
regenerate historical screenshot/metric artifacts; do not treat those generated
files as new owner acceptances. Existing servers on5173/5174 are separate.

## 4. Read/repeat measurements (2 minutes)

```powershell
node docs/qa/wp7-4-2/diagnostics/benchmark.mjs
```

This prints six JSON records for30/40-task sparse/diamond/chain cases and writes
the report `docs/qa/wp7-4-2/evidence/performance.json`, which may appear modified
after a rerun. It uses a middleware-only TypeScript loader, no owner app server
or project storage, and uses an ignored loader cache. Read p50/p95/max and longest case; the measured interval
includes source/history validation and calculation, not browser painting.
Node numbers do not establish classroom-device or UI responsiveness.

## 5. Owner decision

Review [VERIFICATION](VERIFICATION.md), including the year9999 release failure
that was fixed and the fixture/interface clarifications. Complete the separate
[ACCEPTANCE](ACCEPTANCE.md). Acceptance does not authorize wiring this module
into App, formats6/v2 storage, lifecycle changes, guided review or Gantt.
Those require separately scoped instructions and their remaining owner gates.
