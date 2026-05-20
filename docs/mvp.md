# MVP

The MVP should prove one narrow product promise:

> An AI agent can run Portolan locally against a selected software landscape and
> receive an evidence-backed map of relationships, duplication, configuration
> surfaces, and technical debt without turning guesses into facts.

## Phase 0: Bootstrap

- Repository, license, Go module, and CLI shell.
- Product boundary documents.
- Draft evidence graph schema.

## Phase 1: Static Local Profile

- Accept a local selection file that names repositories and optional metadata
  files.
- Inspect only local filesystem inputs.
- Emit JSON evidence graph.
- Render a compact text packet from the same graph.

## Phase 2: Agent Toolbox Entry Point

- Add an agent skill/rule pack that works in Cursor first and remains portable
  to Claude, Codex, OpenCode, pi, and other harnesses.

## Phase 3: Immediate Bigtop Acceptance Smoke

- Run the skill pack in Cursor + Composer 2.5 against the Apache Bigtop corpus
  profile as soon as the guide exists.
- Use prepared local fixtures and current Portolan commands first; do not wait
  for all detectors to be built.
- Record concrete gaps in relationships, duplication, configuration surfaces,
  technical debt, packet quality, and agent behavior.

## Phase 4: Map Command And Evidence Useful To Users

- Add `portolan map --root . --out .portolan/run` if the smoke proves the agent
  needs a single artifact-producing command.
- Emit a stable artifact bundle: `graph.json`, `findings.jsonl`, `run.json`,
  and `map.md`.

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
