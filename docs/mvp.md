# MVP

The MVP should prove one narrow product promise:

> Before an AI agent works on a brownfield repository or software landscape,
> Portolan can run a local preflight that maps what is visible, selects useful
> local code-understanding tools, records blind spots, and hands bounded context
> to the agent without turning guesses into facts.

## Phase 0: Bootstrap

- Repository, license, Go module, and CLI shell.
- Product boundary documents.
- Draft evidence graph schema.

## Phase 1: Agent Context Preparation

- Accept a local target root.
- Discover bounded local repositories.
- Detect existing local OSS/tool-output candidates.
- Emit `agent-brief.md`, `answer-contract.md`, `query-plan.md`,
  `evidence-index.jsonl`, `repos.json`, `tool-registry.json`, `oss-plan.json`,
  and `gaps.jsonl`.
- Preserve `unknown`, `cannot_verify`, and `not_assessed`.

## Phase 2: Agent Toolbox Entry Point

- Add an agent skill/rule pack that works in Cursor first and remains portable
  to Claude, Codex, OpenCode, pi, and other harnesses.

## Phase 3: Brownfield Preflight

- Produce a preflight bundle from existing context/map artifacts.
- Show target shape, current evidence, blind spots, candidate local tools, and
  agent handoff in one bounded artifact set.
- Start with Apache Bigtop as the first demonstration target because it is
  messy enough to test the job and prior local evidence exists.
- Do not install tools, run network commands, mutate target repositories, write
  global agent configuration, or start daemons by default.

## Phase 4: Map Command And Evidence Useful To Preflight

- Keep `portolan map --root . --out .portolan/run` as the direct map command;
  it discovers the root, direct child Git repositories, and `repos/*` Git
  repositories under a bounded local policy.
- Use `portolan map --selection selection.json --out .portolan/run` for curated
  local inventories. A local inventory can validate represented, missing,
  blocked, and extra scope records, but repository counts alone never prove
  complete inherited-estate coverage.
- Emit a stable artifact bundle: `run.json`, `coverage.json`, `summary.json`,
  `graph-index.json`, `graph.json`, `findings.jsonl`, and `map.md`.
- Provide bounded graph drill-down with `portolan graph slice` before agents
  need full `graph.json`.
- Validate new OSS/tool-output inputs through `portolan adapter validate` before
  adding them to the agent workflow.

- Detect relationships across imports, dependency manifests, config references,
  metadata, runtime exports, and claims.
- Detect duplication clusters through local tool outputs or focused scanners.
- Detect configuration surfaces such as env vars, ports, Docker, Kubernetes,
  CI/CD, feature flags, and secret references.
- Generate technical-debt findings from local evidence without policy verdicts.

## Phase 5: Toolchain Doctor And Approved Acquisition

- Verify installed tools, versions, license/privacy posture, output
  compatibility, target mutation risk, and approval boundaries.
- Provide explicit opt-in acquisition or run plans for selected tools.
- Keep candidate tools as future evidence steps until local output is produced
  and re-ingested.

## Phase 6: Importers And Tool Composition

- Add importers for existing OSS/tool outputs where licenses and formats fit.
- Favor adapters over native reimplementation.
- Preserve source attribution and evidence state per imported fact.

## Phase 7: Black-Box Profile

- Represent systems without source through metadata, runtime observations, and
  claims.
- Keep black-box facts visibly lower authority than source-visible facts.
- Report `unknown` or `cannot_verify` instead of inventing conclusions.

## Phase 8: Diff And Usefulness Validation

- Compare map runs without readiness, pass/fail, or degradation verdicts.
- Compare AI-agent work with and without preflight on the same Bigtop task.
- Judge visible first-run usefulness first: where to start, which artifacts to
  read, which tools to acquire, and which blind spots remain.
- Keep corpus preparation separate from default map/scan execution so Bigtop
  does not introduce surprise network access, cloning, or heavyweight setup into
  the MVP path.

## Non-Goals For MVP

- No SaaS service.
- No background agent.
- No repository mutation.
- No automatic modernization plan.
- No policy gate.
- No autonomous delivery trace platform.
- No eval platform until preflight usefulness is proven.
- No dependency on one agent IDE or harness.
