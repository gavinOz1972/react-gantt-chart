# React Gantt Chart

WP0 provides a tested React and TypeScript development environment. WP1 adds a
pure scheduling engine. WP2 adds project calendar settings, task entry, predecessor
selection, and live schedule dates. Graphical Gantt rendering and persistence
belong to later work packages.

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
| `npm test` | Scheduling tests, entry boundary tests, and React interaction tests |
| `npm run test:watch` | Watch unit/component tests |
| `npm run check` | Lint, types, unit tests, and build |
| `npx playwright install chromium` | Install the browser for the smoke test |
| `npm run test:e2e` | Chromium entry workflows and smoke test; starts its own dev server |

Browser tests reserve 127.0.0.1:4173, separate from the normal development server
on port 5173. Stop other servers on the test port first.

## Using the entry interface

Run `npm.cmd run dev` in PowerShell and open the Local URL it prints. If a dev
server is already running, the page should update automatically; otherwise refresh.

1. Enter the project name, start, target, weekdays, and daily working hours.
   Text/date/number settings apply when you leave the field; weekdays apply
   immediately. Invalid drafts stay editable. Revert settings restores the last
   accepted project settings.
2. Choose Add task. Enter a name, description, whole-hour estimate and independent
   start date, or select predecessors from the checkbox dropdown.
3. Inspect the live schedule preview, then Save task or Cancel. A dependent start
   is read-only. Removing all predecessors restores its retained independent date.
   Reset to Project Start restores automatic following.
4. Edit a task to change inputs. Delete requests confirmation and discloses affected
   predecessor links; other tasks are kept. IDs are never renumbered or reused
   after a saved task is deleted.

Target status compares the last occupied working date to the inclusive target
end date. It never changes the schedule. Starts show the first occupied hour;
finishes show the exclusive boundary after the final occupied hour. Hour numbers
restart on each working day; Total hours is the full estimate across all days.

The interface labels unsaved previews and suppresses calculated dates for invalid
input. Saved inputs remain recoverable with Cancel or Revert settings. Project
settings are disabled while a task is being edited to keep the two drafts separate.
All entries live in memory in this tab; reloading or closing clears them.

## ENGINE and VIEW separation

- `src/domain/`: ENGINE pure TypeScript calculations, explicit inputs/outputs,
  no React, DOM, view imports, or hidden browser state.
- `src/domain/__tests__/`: calendar, validation, and scheduling unit tests.
- `src/types/`: shared scheduling data contracts.
- `src/components/` and `src/App.tsx`: VIEW React presentation and interaction.
- `src/styles/`: simple CSS; `src/test/`: component test setup.
- `src/components/projectEntry.ts`: conversion boundary for editable strings and
  typed WP1 inputs; no scheduling arithmetic.
- `tests/`: browser smoke test and project/task entry workflows.

The VIEW consumes ENGINE results. Keep scheduling rules in the ENGINE.
The [engine API documentation](src/domain/README.md) describes WP1 contracts,
slot boundaries, errors, and owner policies. ESLint blocks
React and common view imports from domain files; code review must also preserve
purity and avoid browser APIs or indirect view dependencies.

## Known issues and handoff

The latest Vite scaffold selected TypeScript 7 and Oxlint. WP0 uses TypeScript 6
because typescript-eslint currently supports versions below 6.1, and uses ESLint
to match the work package. The lockfile fixes the verified dependency graph.

No deployment, paid service, database, authentication, or Gantt library is included.
The referenced Application Requirements v1.0 was not supplied. WP1 follows the
explicit rules in its work package. Owner-approved defaults reject manual task
starts and target end dates before project start, with explicit field errors.

See [WP0 verification and WP1 handoff](docs/WP0-HANDOFF.md) for workstation findings,
verification results, and publication status.

The latest clean-install audit reports 12 moderate development-tool findings
stemming from minimatch (GHSA-g3hv-75wg-m249), with no high or critical findings.
Review upstream ESLint dependency fixes before processing untrusted lint patterns.
See the handoff for the full context; no forced dependency downgrade was applied.

See [WP1 verification and handoff](docs/WP1-HANDOFF.md) for the scheduling engine
acceptance matrix and deferred work.

See [WP2 verification and handoff](docs/WP2-HANDOFF.md) for interface behavior,
acceptance coverage, browser verification, and WP3 integration points.
