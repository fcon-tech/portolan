# Agent Instructions

Portolan is a local-first cartographic atlas of a code landscape. The captain
(the human) drops a Portolan link to an agent, leans back, and participants in
the expedition (deterministic static analyzers + agent producers) build a
snapshot. `/portolan:map` opens the behaviour map. The captain reads units,
typed edges, surfaces, and confidence; drills into dossiers; and enables
triangulation to see where the three truths (behaviour, intentions,
representations) disagree.

The current product target is simple:

> The captain drops a Portolan link to an agent and leans back. The agent
> installs Portolan autonomously (zero copied commands), runs managed
> conversational intake, builds the snapshot, and opens `/portolan:map`. The
> captain understands the landscape: units, typed edges, surfaces, confidence,
> and drill-down paths.

Terminology: the human role is the **captain** — one word, everywhere (code,
specs, docs, UI copy). Code and fixtures must not introduce "admiral".

## Active Product Contract

The active product specification surface is **OpenSpec**: `openspec/specs/` is
the living source of truth, `openspec/changes/` holds proposed work (its
README is the reconciled index — statuses there are verified against code, do
not trust memory over it). Spec work flows through the OpenSpec workflow
(`/opsx:propose` → `/opsx:apply` → `/opsx:archive`); validate with
`openspec validate --specs`.

The living specs (each: Purpose + Requirements + Scenarios, RFC 2119), with
their enforcement status:

- `openspec/specs/intake/` — managed conversational intake; typed intake result. *(BDD-bound)*
- `openspec/specs/navigation/` — `/portolan:map`, the enumerated maps, dossier. *(BDD-bound)*
- `openspec/specs/three-truths/` — behaviour/intentions/representations + triangulation. *(BDD-bound)*
- `openspec/specs/ontology/` — units, surfaces, findings, edges, groupings. *(BDD-bound)*
- `openspec/specs/reading-experience/` — the atlas as a readable system atlas. *(BDD-bound)*
- `openspec/specs/drilldown-semantics/` — reader-facing drill-down labels/targets. *(BDD-bound)*
- `openspec/specs/semantic-investigation/` — component investigation contract. *(BDD-bound)*
- `openspec/specs/engineering-standards/` — Clean Architecture, dependency rule, TDD. *(partially enforced: dependency-rule checker in CI + BDD chain)*
- `openspec/specs/atlas-identity/` — what Portolan IS; roles; snapshot contract. *(prose contract — no BDD binding yet)*
- `openspec/specs/confidence/` — the trust contract (ironclad → speculation). *(prose contract — no validator implements the matrix; see its enforcement-status note)*
- `openspec/specs/ux-principles/` — zero-copied-commands, one entry point. *(prose contract — no BDD binding yet)*
- `openspec/specs/visual-style/` — cartographic/plain display-style contract. *(prose contract — theme tokens unit-tested, scenarios unbound)*

When redefining behavior, either bind new scenarios to real tests through the
BDD chain or mark the spec honestly as a prose contract. Do not claim
enforcement that does not exist.

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
The captain types no command beyond the initial prompt.

## Architecture: Scan Pipeline + Reading Layer

Authority: `openspec/specs/atlas-identity/`. Portolan has two layers, not two
competing products:

1. **Scan pipeline (producer).** `scripts/portolan-scan.sh` →
   `scripts/build-portolan-bundle.sh` (bash + jq) driving local OSS tools
   (ripgrep, ctags, jscpd, syft, semgrep), with `portolan-core/scripts/*.mjs`
   assembling artifacts. This is the only thing that actually scans a target.
   It emits the evidence bundle (`*.jsonl`) + `system-map.json`. Not
   replaceable by the reading layer.
2. **Reading layer (consumer) — `portolan-core/` (JS).** The single reading
   layer: domain → use-cases → adapters, dependency rule enforced by
   `portolan-core/scripts/check-dependency-rule.js` in CI. Owns the
   `/portolan:map` entry point and the `atlas.html` export. The former
   `viewer/` app (0.1.0) was removed 2026-06-28; do not resurrect it. The
   public demo (`docs/site/`) is generated from a real Bigtop pipeline scan.

**Go core (`internal/` + `cmd/portolan`) status: frozen.** See
`docs/harness/GO-FREEZE-POLICY.md`. The production scan pipeline does not
invoke Go; the only live entry is the opt-in map bridge
(`portolan-scan.sh --with-map-bridge` → `go run ./cmd/portolan map`), which
carries cross-repo relationship detection (`internal/maprun`,
`internal/relationships` — JVM source references, multi-language manifests,
mobile frameworks). Do not add legacy-CLI surface (`context prepare`, `query`,
`diff`, `graphslice`, `adapter`, `reportquality`): a code-reset decision on
the Go core's fate is pending from the 2026-08-23 review.

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
- Assign language by consumer fit, not preference: the human-atlas reading
  layer is JS (`portolan-core`); the scan pipeline is bash + jq + the mjs
  assembly scripts today; Go hosts the map-bridge relationship detection until
  the pending code-reset decides otherwise. Shell scripts are thin drivers
  only.
- Add dependencies only after documenting fit, maintenance, license, privacy,
  and integration cost.
- Do not hide failed or not-assessed checks.

### Engineering standards (portolan-core) — locked in

Authority: `openspec/specs/engineering-standards/`. The portolan-core reading
layer follows Clean Architecture, the dependency rule, and TDD. What is
actually enforced:

- **Dependency rule.** Dependencies point strictly inward
  (domain ← use-cases ← adapters). Enforced by
  `portolan-core/scripts/check-dependency-rule.js` (runs in CI; 0 violations).
- **TDD.** Every executable OpenSpec scenario is bound to a real, passing unit
  test; the BDD bindings (`portolan-core/test/bdd-runner.js`) map
  `test/features` → `openspec/specs` → unit-test files. New behavior lands
  with its binding; keep the map true when renaming specs or tests.
- **Ports are nominal.** The `src/ports` layer currently has single
  implementations and no production consumers — flagged by the 2026-08-23
  review for removal in the code-reset. Do not add new ports; depend on
  adapters directly until that decision lands.

## Delivery Rules

When implementing an OpenSpec change:

- Work from the matching change under `openspec/changes/` (or the living spec
  under `openspec/specs/`).
- Record what scenario is being served.
- Keep parallel-agent change boundaries clean.
- Verify with the smallest command set that proves the scenario.
- If a scenario cannot be proven, record the blocker and whether the answer is
  kill, pack, or build.
- Commit after each coherent unit of work without waiting to be asked; do not
  batch a session's worth of changes into a single commit.

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
