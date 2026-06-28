# Agent Instructions

Portolan is a local-first cartographic atlas of a code landscape. The admiral
(the human) drops a Portolan link to an agent, leans back, and participants in
the expedition (deterministic static analyzers + agent producers) build a
snapshot. `/portolan:map` opens the behaviour map. The admiral reads units,
typed edges, surfaces, and confidence; drills into dossiers; and enables
triangulation to see where the three truths (behaviour, intentions,
representations) disagree.

The current product target is simple:

> The admiral drops a Portolan link to an agent and leans back. The agent
> installs Portolan autonomously (zero copied commands), runs managed
> conversational intake, builds the snapshot, and opens `/portolan:map`. The
> admiral understands the landscape: units, typed edges, surfaces, confidence,
> and drill-down paths.

## Active Product Contract

Use `docs/captain-atlas/` as the active product specification surface.

Do not use deleted or historical planning artifacts as source of truth. They
were removed because they encoded false tracks, stale claims, and
implementation drift.

Authority order: `08` (product concepts) > `07` (frozen system-map contract) >
`00`–`06` (supporting notes).

The active documents are:

- `docs/captain-atlas/README.md`: work package index.
- `docs/captain-atlas/08-portolan-product-charter.md`: **governing** product
  charter for Part 1 (the admiral's atlas). Defines identity, roles
  (admiral/participants/fleet), discovered ontology, trust/confidence
  contract, navigation model, C4-as-one-optional-map, UX principles, and the
  Part 1 / Part 2 boundary.
- `docs/captain-atlas/07-portolan-core-product-spec.md`: **partially
  superseded.** Remains the frozen contract authority for the
  already-implemented `system-map` schema, builder, and viewer. Its product
  concepts are superseded by `08` (see the "Superseded Concepts" table at the
  end of `08`).
- `docs/captain-atlas/00-product-contract.md` through
  `docs/captain-atlas/06-oss-kill-gates.md`: supporting work-package notes.
  Use them only when they do not contradict `08` or `07`.

## The One Entry Point: /portolan:map

After the agent installs Portolan and runs managed intake, the single command
that opens the atlas is:

```bash
node portolan-core/scripts/portolan-map.mjs --target <target-root> [--open]
```

This is `/portolan:map`. It: (1) loads the intake result from
`<target>/.portolan/intake.json` (errors with the exact remediation if absent),
(2) builds the snapshot by delegating to the deterministic core
(`scripts/build-system-map.sh`) if stale, (3) exports the clean-stack shell +
inlined atlas to `<target>/.portolan/atlas.html`, and (4) optionally opens it.
The admiral types no command beyond the initial prompt.

## Architecture: Deterministic Core + Reading Layer

Authority: `docs/captain-atlas/08-portolan-product-charter.md`. The product is
moving to the charter-08 world (the 0.2.0 big-bang migration) — a proper
reading layer and a proper collector — not a gradual cutover.

Portolan has two distinct layers, not two competing products:

1. **Deterministic core (the collector / producer) — `internal/` (Go) +
   `scripts/*.sh` (bash).** The only thing that actually scans a target: runs
   ripgrep/ctags/jscpd/syft/semgrep, parses output, and emits the evidence
   bundle (`*.jsonl`) + `system-map.json`. Not replaceable by the reading layer.
2. **Reading layer (consumer) — reads the core's output and presents the
   atlas.** Two implementations exist in-tree:
   - **`portolan-core/` — the charter-08 reading layer.** Clean Architecture
     (domain → use-cases → ports → adapters, dependency rule enforced), 429
     unit tests, the `/portolan:map` entry point, and the `atlas.html` export.
     This is the direction.
   - **`viewer/` — the 0.1.0 contract surface.** The historical meaning-first
     UI and the frozen `system-map` schema authority. It is **superseded**, not
     maintained: do not add features; treat as reference-only. It is removed by
     the 0.2.0 big-bang migration.

Both reading layers render the same Bigtop demo (22 units, 24 relationships, 7
families) — feature-parity proven headlessly.

## Mandatory Decision Gate

Before proposing product, design, implementation, dependency, or workflow
changes, answer:

1. **Simpler/Faster**: can the Portolan first-run scenario be solved with less code,
   fewer moving parts, fewer dependencies, less process, or a smaller change?
2. **Blocking Edge Cases**: what scale, security, privacy, install, harness,
   compatibility, data-quality, or UX constraints prevent that simpler answer?
3. **Existing Open Source**: does an existing OSS or commercial tool solve the
   Portolan first-run scenario well enough that Portolan should integrate, wrap, or
   die instead of building?

Use enough evidence to make the decision reliable. Do not turn this into broad
market theater.

## Product Rules

- Optimize for the user opening a useful Portolan result, not for internal proof
  rituals.
- Keep local-first and read-only defaults.
- Do not add network access, daemon behavior, mutation, or credentials without
  explicit product approval.
- Cursor Composer and the terminal/headless Cursor Agent lane are the first
  acceptance client. The product must remain portable to OpenCode, Codex,
  Kimi/Zed-like harnesses, and direct shell use.
- Portolan should generate a ready local UI and data bundle. Agents should not
  have to write a new UI for every target.
- Evidence states are internal guardrails. Do not sell evidence as the primary
  value proposition.
- Unknown, partial, and cannot-verify states must remain visible in the UI,
  but they must support navigation instead of dominating the product.
- Prefer importing and normalizing OSS/tool outputs over reimplementing mature
  scanners.
- Treat Bigtop as a useful stress corpus, not as product-specific choreography.

## Engineering Rules

- Keep changes small and testable.
- Preserve the harness-first path unless a captain-atlas BDD scenario proves it
  is insufficient.
- Keep the legacy Go CLI thin; new product behavior should usually live in
  harness scripts, viewer app, schema/contracts, importers, or generated bundle
  artifacts.
- Add dependencies only after documenting fit, maintenance, license, privacy,
  and integration cost.
- Do not hide failed or not-assessed checks.

## Delivery Rules

When implementing one BDD work package:

- Work from the matching `docs/captain-atlas/*.md` file.
- Record what scenario is being served.
- Keep parallel-agent work package boundaries clean.
- Verify with the smallest command set that proves the scenario.
- If a scenario cannot be proven, record the blocker and whether the answer is
  kill, pack, or build.

## Review Rules

Classify issues as:

- critical
- major
- minor

Prioritize:

1. mismatch with the Portolan first-run scenario;
2. UX failure in the generated Portolan UI;
3. agent first-run failure;
4. correctness bugs;
5. security/privacy issues;
6. maintainability risks;
7. test gaps.

Use evidence labels:

- `verified`: command, test, check, or direct inspection passed.
- `not_assessed`: not checked.
- `assumed`: inferred but not checked.
- `blocked`: could not check, with reason.
- `failed`: checked and failed.

Do not call a surface ready unless the relevant BDD scenario passed.

## Response Style

Be direct, concise, and grounded in the current repo state. When the user pushes
back on scope drift, treat it as a product contract failure, not a wording issue.
