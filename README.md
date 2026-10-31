# React Gantt Chart

WP0 provides a tested React and TypeScript development environment. Scheduling,
Gantt rendering, persistence, and application features begin in later work packages.

## Prerequisites and setup

Use Node.js 24 LTS and npm 11 or 12, Git, and optionally VS Code. The verified
workstation uses Node 24.19.0 and npm 11.17.0; `.nvmrc` records the Node version.
Use a current patched Node 24 release for ongoing development.

```sh
git clone https://github.com/gavinOz1972/react-gantt-chart.git
cd react-gantt-chart
npm ci
npm run dev
```

Open the printed localhost URL. In Windows PowerShell, use `npm.cmd` instead of
`npm` if the local execution policy blocks npm.ps1. No policy change is needed.
Open this folder in VS Code with `code .` or File > Open Folder.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | TypeScript check and production build in dist |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint including the domain import boundary |
| `npm run typecheck` | TypeScript project checks |
| `npm test` | Vitest and React Testing Library smoke test with jsdom |
| `npm run test:watch` | Watch unit/component tests |
| `npm run check` | Lint, types, unit tests, and build |
| `npx playwright install chromium` | Install the browser for the smoke test |
| `npm run test:e2e` | Chromium home-page smoke test; starts its own dev server |

Browser tests reserve 127.0.0.1:5173; stop other servers on that port first.

## ENGINE and VIEW separation

- `src/domain/`: ENGINE pure TypeScript calculations, explicit inputs/outputs,
  no React, DOM, view imports, or hidden browser state.
- `src/domain/__tests__/`: future scheduling calculation unit tests.
- `src/types/`: shared data contracts, once defined in WP1.
- `src/components/` and `src/App.tsx`: VIEW React presentation and interaction.
- `src/styles/`: simple CSS; `src/test/`: component test setup.
- `tests/`: browser smoke test.

The VIEW will consume ENGINE results. Keep scheduling rules in the ENGINE.
No scheduling models or business rules have been invented in WP0. ESLint blocks
React and common view imports from domain files; code review must also preserve
purity and avoid browser APIs or indirect view dependencies.

## Known issues and handoff

The latest Vite scaffold selected TypeScript 7 and Oxlint. WP0 uses TypeScript 6
because typescript-eslint currently supports versions below 6.1, and uses ESLint
to match the work package. The lockfile fixes the verified dependency graph.

No deployment, paid service, database, authentication, or Gantt library is included.
The referenced Application Requirements v1.0 was not supplied with WP0. Obtain it
before implementing WP1 scheduling contracts and calculation rules.

See [WP0 verification and WP1 handoff](docs/WP0-HANDOFF.md) for workstation findings,
verification results, and publication status.
