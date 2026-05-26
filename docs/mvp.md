# MVP

The MVP should prove one narrow product promise:

> An AI agent can run Portolan locally against a repository or software
> landscape and receive a context pack plus optional evidence-backed map before
> answering CTO-level questions, without turning guesses into facts.

## Phase 0: Bootstrap

- Repository, license, Go module, and CLI shell.
- Product boundary documents.
- Draft evidence graph schema.

## Phase 1: Agent Context Preparation

- Accept a local target root.
- Discover bounded local repositories.
- Detect existing local OSS/tool-output candidates.
- Emit `agent-brief.md`, `answer-contract.md`, `query-plan.md`,
  `repos.json`, `tool-registry.json`, `oss-plan.json`, and `gaps.jsonl`.
- Preserve `unknown`, `cannot_verify`, and `not_assessed`.

## Phase 2: Agent Toolbox Entry Point

- Add an agent skill/rule pack that works in Cursor first and remains portable
  to Claude, Codex, OpenCode, pi, and other harnesses.

## Phase 3: Product Hypothesis Checks

- Compare Cursor-alone with Cursor-plus-Portolan context preparation.
- Start with a non-Bigtop local target, then use Apache Bigtop as the larger
  stress target when local checkouts are available.
- Record false claims, missing evidence, ignored gaps, and useful answers.

## Phase 4: Map Command And Evidence Useful To Users

- Keep `portolan map --root . --out .portolan/run` as the direct map command;
  it discovers the root, direct child Git repositories, and `repos/*` Git
  repositories under a bounded local policy.
- Use `portolan map --selection selection.json --out .portolan/run` for curated
  local inventories.
- Emit a stable artifact bundle: `run.json`, `coverage.json`, `summary.json`,
  `graph.json`, `findings.jsonl`, and `map.md`.

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

## Non-Goals For MVP

- No SaaS service.
- No background agent.
- No repository mutation.
- No automatic modernization plan.
- No policy gate.
- No dependency on one agent IDE or harness.
