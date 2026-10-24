# Stop Motion Simulation

A toy for children: place participants in a 3D world (landscape, animals, vehicles),
give them motions, add incident events, then generate a film from that storyboard.

Stack: TypeScript, Vite, Three.js, Vitest (unit), Playwright (acceptance + performance).

## Engineering Rules (Dave Farley CD Process)

- **Trunk-based development**: small, frequent commits to `main` (or PRs that live less than a day).
  Hide unfinished features behind a flag in `src/config.ts`, never on a long-lived branch.
- **TDD**: write a failing unit test before writing application code. Red, green, refactor.
- **Domain first**: all rules live in `src/domain/` as pure functions with no DOM or Three.js.
  `src/ui/` only renders and forwards user intent to the domain.
- **Commit stage stays under 5 minutes**: unit tests must not touch the network, the DOM or timers.
  Anything slower belongs in the acceptance or performance stage.
- **Build once**: `npm run commit-stage` produces `artifact/` (the bundle plus a SHA-256 manifest).
  Later stages deploy that exact artifact with `scripts/deploy.sh`. They never run `vite build`.
- **Environment-agnostic binaries**: nothing environment-specific is compiled in.
  `scripts/deploy.sh` writes `config.json` next to the bundle at deploy time.
- **Four-layer acceptance tests**:
  1. `acceptance/specs/`: test cases written in the language of the toy ("place a dog", "make the film"). No selectors, no URLs.
  2. `acceptance/dsl/`: the domain-specific language. Handles aliases and sensible defaults.
  3. `acceptance/drivers/`: the protocol driver. This is the only layer that knows about Playwright or the DOM.
  4. The system under test: the deployed artifact at `BASE_URL`.
- **Zero-downtime changes**: if persisted storyboard data is ever added, schema changes must follow
  expand/contract and keep readers compatible with the previous version.

## Commands

- `npm run commit-stage` runs typecheck, unit tests, build, and packages `artifact/`
- `bash scripts/deploy.sh <env> artifact deployments/<env>` deploys the artifact into a directory
- `BASE_URL=http://localhost:4173 npm run test:acceptance` (serve first with `npm run serve -- deployments/acceptance 4173`)
- `npm run test:perf` runs the performance stage
