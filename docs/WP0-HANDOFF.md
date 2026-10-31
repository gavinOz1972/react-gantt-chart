# WP0 verification and WP1 handoff

Prepared 30 October 2026. Local scaffold and clean-checkout verification pass.

## Workstation

| Item | Finding |
| --- | --- |
| Node | 24.19.0, existing supported Node 24 LTS installation retained |
| npm | 11.17.0; use npm.cmd in PowerShell because npm.ps1 is blocked by policy |
| Git | 2.55.0.windows.3 |
| VS Code | 1.139.1 x64; existing openai.chatgpt extension and Codex session |
| GitHub Desktop | 3.6.7 installed and running |
| GitHub CLI | Not installed |
| Approved repository | gavinOz1972/react-gantt-chart, public |

No workstation installations were overwritten. Package downloads and browser
installation required execution outside the restricted sandbox. VS Code CLI
reported sandbox access warnings for its log directory but returned its version
and installed extensions. No system execution policy was changed.

## Implementation

Vite create-vite 9.3.3 react-ts scaffold, React 19.3.1, Vite 8.3.5,
TypeScript 6.0.3, ESLint 10.14.0, Vitest 5.0.5, jsdom 30.1.3,
Testing Library React 16.3.3, jest-dom 7.0.1, Playwright 1.64.1.
Exact direct and transitive dependencies are in package-lock.json.

TypeScript 7 from the template was replaced with TypeScript 6 for the supported
typescript-eslint peer range. ESLint replaces the template's Oxlint to meet WP0.

## Verification

| Command | Result |
| --- | --- |
| npm install | Pass; dependency audit reported zero vulnerabilities |
| npm run lint | Pass |
| npm run typecheck | Pass |
| npm test | Pass, one component smoke test |
| npm run build | Pass, 16 modules transformed |
| npm run test:e2e | Pass, one Chromium test, dev server started automatically |

Playwright reported a harmless NO_COLOR/FORCE_COLOR environment warning.

## WP1 handoff

The ENGINE directory is React independent and contains no scheduling logic.
Define shared contracts in src/types and pure calculations in src/domain, with
unit tests in src/domain/__tests__. The VIEW belongs in App and components.

Application Requirements v1.0 was referenced but not supplied. Obtain it before
implementing scheduling rules. WP0 adds no schedule features, Gantt libraries,
backend, authentication, cloud services, deployments, or confidential inputs.

## Repository and reproducibility

Approved public repository: https://github.com/gavinOz1972/react-gantt-chart

Initial source commit: 75897e3. A separate local clone at ../wp0-verification
successfully ran npm ci, npm run check, and npm run test:e2e using the committed
lockfile. No source or dependency changes were required for clean verification.

The clean install and subsequent npm audit reported 12 moderate development-tool
findings, all stemming from minimatch globparts amplification (GHSA-g3hv-75wg-m249).
No high or critical findings were reported. The earlier install audit had reported
zero findings; the later audit is the current result. No forced major dependency
downgrade was applied. Review the ESLint dependency chain when upstream compatible
fixes become available. These tools are not shipped in the browser runtime.

Standalone Git HTTPS was blocked by Windows Application Control while loading
libcurl-4.dll. GitHub Desktop bundled Git is used for publication; no security
settings were changed. Repository-specific safe.directory command options handle
the different sandbox and owner SIDs without changing global Git trust.

The final handoff commit SHA is obtained with git rev-parse HEAD.
