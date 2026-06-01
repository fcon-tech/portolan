# Research: E2E Agent Scan Report

## Decision Gate

### Simpler/Faster

Use the existing `context prepare`, `map`, `query`, graph-index, findings, and
optional producer-plan surfaces as inputs to a first-report workflow. Do not
start by building stack-specific analyzers or a harness-specific Cursor
integration.

### Blocking Edge Cases

- A user may open a single repository, a multi-repo folder, or a mixed folder
  where some child directories are not Git repositories.
- Current map output can expose useful findings while still requiring the agent
  to assemble a human report manually.
- Relationship and runtime topology evidence can be thin or `not_assessed`;
  the report must stay useful without turning those gaps into success.
- Large maps require bounded entrypoints before full graph loading.
- Optional OSS producers may be absent, so near-clone duplication and semantic
  config checks must remain gap-aware.

### Existing Open Source

Existing OSS tools remain optional evidence producers rather than the core E2E
answer surface:

| Tool or pattern | Fit | Decision |
| --- | --- | --- |
| jscpd / PMD CPD | Mature near-clone duplication detection across many languages. | Use as optional local producer/import evidence; do not reimplement near-clone scanning in this slice. |
| Syft / CycloneDX | SBOM and component identity evidence. | Use for dependency/component evidence when local output exists or producer is approved. |
| Semgrep | Structural source/config findings. | Use as optional local producer for semantic checks; keep registry/network behavior outside default. |
| Graphify / symbol indexes / Repomix | Context and relationship-adjacent evidence. | Normalize bounded local outputs; do not treat them as architecture truth without evidence labels. |
| Mermaid diagrams | Portable text diagram format agents and docs can render. | Accept as first architecture diagram format if evidence states are labeled. |

## Prototype Evidence

Date: 2026-06-01

Local target: `/tmp/portolan-e2e-story-jzcoqx/landscape`

Shape:

- `service-a`: Go module with exact duplicate source file.
- `service-b`: JavaScript service with `package.json`, GitHub Actions workflow,
  env var, and port reference.
- `mobile-app`: Swift package.
- `docs/openapi.yaml`: local API contract outside a Git child directory.

Commands run:

```bash
go run ./cmd/portolan context prepare \
  --root /tmp/portolan-e2e-story-jzcoqx/landscape \
  --out /tmp/portolan-e2e-story-jzcoqx/out/context \
  --profile cursor \
  --force

go run ./cmd/portolan map \
  --root /tmp/portolan-e2e-story-jzcoqx/landscape \
  --out /tmp/portolan-e2e-story-jzcoqx/out/map \
  --force

go run ./cmd/portolan query findings \
  --bundle /tmp/portolan-e2e-story-jzcoqx/out/map \
  --kind duplication \
  --limit 10

go run ./cmd/portolan query findings \
  --bundle /tmp/portolan-e2e-story-jzcoqx/out/map \
  --kind relationships \
  --limit 10
```

Observed:

- `context prepare` wrote the context pack.
- `map` wrote the map bundle.
- `map.md` reported 3 visible repositories, 32 findings, 18 nodes, 8 edges, 5
  coverage records, 1 exact duplication finding, 5 configuration findings, and
  3 technical-debt findings.
- Relationship findings were largely `not_assessed`, including non-Go source
  relationship detection, service topology, lifecycle modeling, and runtime
  inference.
- `map.md` was useful as an internal artifact but not sufficient as the
  requested user-facing first report because it did not provide a concise
  stack/architecture/duplication/debt narrative, a diagram, or a ranked action
  plan.

Prototype conclusion:

Portolan already has enough lower-level evidence to produce a useful first
report for a simple multi-repo landscape, but the current product surface makes
the agent assemble that report manually. The missing slice is an E2E
scan-report workflow and acceptance harness.

## Decisions

### D1: Add A First-Report Surface Over Existing Artifacts

- **Decision**: Implement a scan-report workflow that orchestrates existing
  context/map/query artifacts and emits a user-facing report.
- **Rejected alternatives**: Documentation-only prompt updates; stack-specific
  analyzers; a Cursor-only integration.
- **Why now**: Customer feedback showed that generated artifacts are not the
  same as a fast useful answer.
- **Reversibility**: High. The report can remain an additive artifact.
- **Risk if wrong**: Some report sections may duplicate `map.md`; acceptance
  tests should force user-facing usefulness, not just artifact existence.
- **Confidence**: high

### D2: Require Architecture Diagram With Evidence Boundaries

- **Decision**: The report must include a diagram or diagram-ready model.
- **Rejected alternatives**: Leave diagrams to the agent; report only raw
  relationships.
- **Why now**: The user story explicitly asks for architecture schemes.
- **Reversibility**: Medium. The diagram format can change if the contract
  stays stable.
- **Risk if wrong**: A partial diagram may be overread as runtime truth; labels
  and weak states are mandatory.
- **Confidence**: medium

### D3: Treat Optional Producers As Follow-Up Evidence, Not Core Success

- **Decision**: The first report must be useful without jscpd/Syft/Semgrep, but
  must name them when they are the best next local step.
- **Rejected alternatives**: Fail the report if optional tools are absent; run
  producers automatically without approval.
- **Why now**: The first-use UX cannot depend on every stack/tool being present.
- **Reversibility**: High. Producer automation can be added later with explicit
  approval boundaries.
- **Risk if wrong**: Native findings may be too shallow on some targets; the
  report must state thin evidence honestly.
- **Confidence**: high

## SDP Lab Distillation

Source repo inspected: `/home/fall_out_bug/projects/sdp/sdp_lab`

Relevant source surfaces:

- `README.md`
- `AGENTS.md`
- `docs/START_HERE.md`
- `docs/reference/product-surface.md`
- `docs/reference/commands.md`
- `docs/reference/harness-parity-matrix.md`
- `docs/reference/agent-skill-entry-map.md`
- `docs/reference/FALLBACK_MODE.md`
- `docs/runbooks/onboarding-downstream-repo.md`
- `sdp.manifest.yaml`
- `cmd/sdp/cmd_scout.go`
- `internal/scout/types.go`
- `internal/scout/format.go`
- `internal/scout/scout.go`

### Pattern 1: Narrow First-Run Promise

SDP separates "first useful result" from the full operator platform. The first
run is intentionally repo inspection and safe adapter setup, not autonomous
delivery. The README says the first useful SDP result is an explicit map of
scope, evidence, limits, and next actions.

Portolan implication:

- The first Portolan scan-report promise should be a report, not complete
  architecture intelligence.
- Advanced surfaces such as optional producers, curated selections, or deeper
  relationship analysis should be second-run actions, not prerequisites for
  first value.

### Pattern 2: Human Intent Menu Before Tool Inventory

SDP's agent entry map reduces many command/skill surfaces into a small human
menu. Users do not need to know internal command names first.

Portolan implication:

- The user-facing request should be one intent: "scan this repo/folder and
  prepare a first report."
- The report workflow should hide context/map/query sequencing from non-expert
  users while still preserving the artifacts underneath.

### Pattern 3: One Manifest, Many Harness Adapters

SDP uses `sdp.manifest.yaml` as the source of truth for skills, commands, and
agents, then generates harness-specific adapters. It also documents that static
adapter parity does not prove runtime dispatch readiness.

Portolan implication:

- Portolan should not hand-maintain divergent Cursor/OpenCode/Codex/Pi
  instructions for the scan-report story.
- If Portolan adds multiple harness entrypoints, they need one canonical source
  plus parity/drift checks.
- Runtime readiness must stay separate from "adapter file exists."

### Pattern 4: Scout ProjectCard As A Bounded First-Run Contract

`sdp scout` emits a stable `ProjectCard` with identity, scale, activity,
maturity, build, health signals, and conventions. The text/card formats are
thin renderings over the same JSON contract.

Portolan implication:

- `report-summary.json` should be the stable read model, and
  `first-report.md` should be a rendering over it plus cited Portolan evidence.
- Nullable/unknown fields should stay explicit instead of being rendered away.
- The report should have a compact one-screen summary before detailed sections.

### Pattern 5: Fallback Mode Preserves Output Quality

SDP's fallback mode says manual or sequential harness execution is slower, not
lower quality. It requires the same artifacts and acceptance criteria when
subagent/native dispatch is unavailable.

Portolan implication:

- If a harness cannot run a native command/skill directly, the fallback prompt
  must still produce `first-report.md` and `report-summary.json`.
- The acceptance harness should test fallback behavior, not only the preferred
  CLI path.

## Additional Decisions From SDP Lab

### D4: Use Markdown Plus Machine Summary, Not Chat-Only Output

- **Decision**: The workflow saves `report/first-report.md` and
  `report/report-summary.json`; the agent relays the Markdown report in chat.
- **Rejected alternatives**: Chat-only answer; JSON-only report; requiring the
  user to read `map.md` directly.
- **Why now**: The customer failure was a missing first useful answer, but the
  repo still needs durable artifacts for verification.
- **Reversibility**: High. stdout summaries can be added later.
- **Risk if wrong**: Some harnesses may prefer stdout-first; the saved Markdown
  remains portable.
- **Confidence**: high

### D5: Mermaid Is The V1 Diagram Format

- **Decision**: Use Mermaid in `first-report.md` for architecture diagrams.
- **Rejected alternatives**: Generated images; bespoke graph format only;
  agent-invented diagrams without a contract.
- **Why now**: Mermaid is text, reviewable, portable across docs/harnesses, and
  easy to label with evidence boundaries.
- **Reversibility**: Medium. A richer diagram artifact can be added while
  keeping Mermaid as fallback.
- **Risk if wrong**: Some harnesses may not render Mermaid; the text source is
  still readable.
- **Confidence**: high
