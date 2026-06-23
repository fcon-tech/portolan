# MVP

The MVP should prove one narrow product promise:

> An AI agent can run Portolan locally against a repository or software
> landscape, install target-local Cursor/OpenCode atlas wrappers, build a
> queryable atlas bundle plus viewer, and answer CTO-level questions from that
> local bundle without turning guesses into facts.

## Phase 0: Bootstrap

- Repository, license, Go module, and CLI shell.
- Product boundary documents.
- Draft evidence graph schema.

## Phase 1: Installable Atlas Pack

- Accept a local target root.
- Install target-local wrappers under `<target-root>/.portolan/bin`.
- Install Cursor/OpenCode/Codex/Claude instructions that use those wrappers.
- Build a first atlas bundle at `<target-root>/.portolan/atlas`.
- Emit `manifest.json`, `repos.json`, `repo-profiles.json`,
  `relationships.jsonl`, `hotspots*.jsonl`, `gaps.jsonl`, `atlas-facts.json`,
  `atlas-surfaces.json`, and `atlas-surface-content.json`.
- Preserve `unknown`, `cannot_verify`, and `not_assessed`.

## Phase 2: Agent Toolbox Entry Point

- Add an agent skill/rule pack that works in Cursor first and remains portable
  to Claude, Codex, OpenCode, pi, and other harnesses.

## Phase 3: Product Hypothesis Checks

- Compare Cursor/OpenCode without Portolan against Cursor/OpenCode with an
  installed Portolan atlas.
- Start with a non-Bigtop local target, then use Apache Bigtop as the larger
  stress target when local checkouts are available.
- Record false claims, missing evidence, ignored gaps, and useful answers.

## Phase 4: Atlas Evidence Useful To Users

- Keep `scripts/portolan-install.sh` and the installed
  `<target-root>/.portolan/bin/portolan-scan.sh` wrapper as the direct product
  path.
- Discover the root, direct child Git repositories, and `repos/*` Git
  repositories under a bounded local policy. If a complete inventory is
  required, ask for a local manifest or explicit target set; repository counts
  alone never prove complete inherited-estate coverage.
- Emit a stable atlas bundle for viewer and agent queries.
- Provide bounded drill-down through `portolan-bundle-query.sh` before agents
  need large JSONL files.
- Validate new OSS/tool-output inputs through `portolan adapter validate` before
  adding them to the agent workflow.

- Detect relationships across imports, dependency manifests, config references,
  metadata, runtime exports, and claims.
- Detect duplication clusters through local tool outputs or focused scanners.
- Detect configuration surfaces such as env vars, ports, Docker, Kubernetes,
  CI/CD, feature flags, and secret references.
- Generate technical-debt findings from local evidence without policy verdicts.

## Phase 5: Importers And Tool Composition

- Add importers for existing OSS/tool outputs where licenses and formats fit.
- Favor adapters over native reimplementation.
- Preserve source attribution and evidence state per imported fact.

## Phase 6: Black-Box Profile

- Represent systems without source through metadata, runtime observations, and
  claims.
- Keep black-box facts visibly lower authority than source-visible facts.
- Report `unknown` or `cannot_verify` instead of inventing conclusions.

## Phase 7: Diff And Larger Ecosystem Acceptance

- Compare map runs without readiness, pass/fail, or degradation verdicts.
- Return to Apache Bigtop for larger runs after each product gap is addressed.
- Keep corpus preparation separate from default map/scan execution so Bigtop
  does not introduce surprise network access, cloning, or heavyweight setup into
  the MVP path.
- Keep legacy `context prepare` and `map` as compatibility routes only, not the
  primary MVP path.

## Non-Goals For MVP

- No SaaS service.
- No background agent.
- No repository mutation.
- No automatic modernization plan.
- No policy gate.
- No dependency on one agent IDE or harness.
