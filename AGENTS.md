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

The active product specification surface is **OpenSpec**: `openspec/specs/` is
the living source of truth, `openspec/changes/` holds proposed work. Spec work
flows through the OpenSpec workflow (`/opsx:propose` → `/opsx:apply` →
`/opsx:archive`); validate with `openspec validate --specs`.

The living specs (each: Purpose + Requirements + Scenarios, RFC 2119):

- `openspec/specs/atlas-identity/` — what Portolan IS; roles; Part 1/2 boundary.
- `openspec/specs/intake/` — managed conversational intake; typed intake result.
- `openspec/specs/ontology/` — units, surfaces, findings, edges, groupings.
- `openspec/specs/confidence/` — the trust contract (ironclad → speculation).
- `openspec/specs/navigation/` — `/portolan:map`, the enumerated maps, dossier.
- `openspec/specs/three-truths/` — behaviour/intentions/representations + triangulation.
- `openspec/specs/ux-principles/` — zero-copied-commands, one entry point.
- `openspec/specs/visual-style/` — cartographic/plain display-style contract.
- `openspec/specs/reading-experience/` — the atlas as a readable system atlas.
- `openspec/specs/drilldown-semantics/` — reader-facing drill-down labels/targets.
- `openspec/specs/semantic-investigation/` — component investigation contract.

`openspec/legacy/captain-atlas/` is the verbatim pre-OpenSpec spec surface,
retained for history only — NOT authority. The charter (`legacy/captain-atlas/
08-portolan-product-charter.md`) and behavior-defining work packages were
migrated into the living specs above; the rest (roadmaps, scorecards, the frozen
0.1.0 contract `07`) is kept verbatim as historical record. See
`openspec/legacy/README.md`.

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

Authority: `openspec/specs/atlas-identity/` (migrated from the charter). The
product is moving to the charter-08 world (the 0.2.0 big-bang migration) — a
proper reading layer and a proper collector — not a gradual cutover.

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
- Preserve the harness-first path unless an OpenSpec scenario proves it is
  insufficient.
- Keep the legacy Go CLI thin; new product behavior should usually live in
  harness scripts, schema/contracts, importers, or generated bundle artifacts.
- Add dependencies only after documenting fit, maintenance, license, privacy,
  and integration cost.
- Do not hide failed or not-assessed checks.

### Engineering standards (portolan-core) — locked in

Authority: `openspec/specs/engineering-standards/`. The portolan-core reading
layer follows Clean Architecture, the dependency rule, SOLID, and TDD. These are
enforced, not aspirational:

- **Clean Architecture + dependency rule.** Layers `domain → use-cases → ports →
  adapters`; dependencies point strictly inward. Enforced by
  `portolan-core/scripts/check-dependency-rule.js` (runs in CI; 0 violations).
- **SOLID / dependency inversion.** Outward concerns (fs, rendering, navigation)
  cross the boundary through ports; adapters implement ports; use-cases depend on
  ports, never on concrete adapters.
- **TDD.** Every executable OpenSpec scenario is bound to a real, passing unit
  test; the BDD runner (`portolan-core/test/bdd-runner.js`) verifies the chain
  `openspec/specs → test/features → unit`. New behavior lands with its binding.

## Delivery Rules

When implementing an OpenSpec change:

- Work from the matching change under `openspec/changes/` (or the living spec
  under `openspec/specs/`).
- Record what scenario is being served.
- Keep parallel-agent change boundaries clean.
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
