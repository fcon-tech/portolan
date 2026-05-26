# Portolan

Portolan is an open-source, local-first codebase mapping toolbox for AI agents.

It lets an agent inspect large or messy software landscapes with tools instead
of vibes. The output is an evidence-backed map of relationships, duplication,
configuration surfaces, and technical debt, with every finding tied to local
source, metadata, runtime, claim, unknown, or cannot-verify evidence.

Portolan is not a replacement for Sourcegraph, CAST, Backstage, observability
platforms, modernization tools, or coding agents. It is the local discovery
substrate an agent can run from Cursor, Claude, Codex, OpenCode, pi, or another
harness.

## Status

Active local-first CLI. The current agent-facing path is context preparation:
`portolan context prepare --root <dir> --out <dir> --profile cursor`.
Curated landscape selections remain supported as an advanced mapping input.

For source checkouts without an installed binary, build a repo-local binary:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

The bootstrap writes under the Portolan checkout by default and does not fetch
Go modules from the network unless `PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1` is set
with explicit approval.

Implemented:

- Go module and `portolan scan --selection <file> --out <file>` for the first
  local evidence graph.
- `portolan context prepare --root <dir> --out <dir> --profile cursor` for a
  Cursor-readable context pack with repository discovery, OSS/tool-output
  candidates, query plan, and honest gaps.
- `scripts/bootstrap-portolan` for source-checkout local binary bootstrap into
  `.portolan/bin/portolan`.
- `portolan import cyclonedx --in <file> --out <file>` for local CycloneDX JSON
  SBOM normalization.
- Black-box profile scanning from local metadata, runtime export, and claim
  files without source-visible overclaiming.
- `portolan diff --base <file> --head <file> --out <file>` for
  machine-readable evidence graph movement without readiness verdicts.
- `portolan map --selection <file> --out <dir>` for curated local landscape
  artifact bundles with `run.json`, `coverage.json`, `graph.json`,
  `findings.jsonl`, and `map.md`.
- `portolan map --root <dir> --out <dir>` for bounded local mapping of the
  target root, direct child Git repositories, and `repos/*` Git repositories.
- Relationship detection for local Go imports and `go.mod` dependencies in
  `portolan map`.
- Documentation for product boundary, MVP, evidence states, and OSS composition.
- Draft JSON schema for an evidence graph document.
- GitHub Spec Kit workflow and product backlog.
- Apache Bigtop test corpus profile for acceptance planning, not default
  product flow.
- Portable agent guide, example report, and Cursor project rule for the first
  agent toolbox acceptance loop.
- Root-discoverable agent bootstrap entrypoint and portable map skill.
- Bigtop manifest-to-selection generation with
  `portolan selection generate-bigtop`.
- Full Bigtop corpus local map verification through the curated selection path.

Not implemented yet:

- recorded real Cursor + Composer blind operator run comparing Cursor-alone
  with Cursor-plus-Portolan context preparation;
- duplication, configuration, and technical-debt finding generators;
- non-Go, runtime, and inferred service relationship detection;
- platform-specific runtime importers;
- SPDX, Syft-native, or live tool importers;
- integrations with external tools.

## Product Contract

Portolan should default to:

- local-first execution;
- read-only collection;
- no daemon;
- no network calls unless explicitly enabled;
- machine-readable evidence graph output;
- machine-readable findings output;
- human-readable packet generated from the same graph;
- explicit states for missing, weak, or unverifiable evidence.

## Roadmap Shape

Portolan should be built from the cheapest useful agent loop outward:

1. `context prepare` pack that tells any agent where to look first and what
   remains unknown.
2. Agent bootstrap and blind acceptance so an agent can discover the generic
   workflow from Portolan itself, not from a target-specific chat prompt.
3. Agent skill/rule pack that teaches Cursor and other harnesses to use context
   preparation before making landscape claims.
4. Cursor-alone vs Cursor-plus-Portolan hypothesis checks on non-Bigtop and
   Bigtop targets.
5. `portolan map --root <dir> --out <dir>` for normal local map artifacts, with
   `portolan map --selection selection.json --out .portolan/run` retained for
   curated advanced inventories.
6. Relationship, duplication, configuration, and technical-debt finding
   generators backed by local evidence, prioritized from that smoke.
7. Evidence diff, adapter contracts, and optional MCP/LSP-style surfaces.

Cursor + Composer 2.5 is the first cheap acceptance client, not the product
boundary. The first realistic acceptance smoke is:

- Cursor as the interactive engineering surface;
- Composer 2.5 as the agent/model under evaluation;
- Portolan as the local toolbox and artifact substrate;
- Apache Bigtop as the large OSS ecosystem corpus.

Bigtop is a realistic stress target, not the first-run workflow. Fixtures may
preflight Portolan commands, but the real operator lane needs a local Bigtop
checkout and the same target-agnostic protocol used for other targets.

Portolan should make that loop observable without becoming dependent on Cursor,
Composer, Kimi, or any hosted model/runtime during a default scan.

## Evidence States

Portolan must not pretend that every system can be analyzed like source code.
Each graph node or relationship records how it is known:

- `source-visible`
- `metadata-visible`
- `runtime-visible`
- `claim-only`
- `unknown`
- `cannot_verify`

## Start Here

- [Agent Bootstrap: Start Here](agent/START_HERE.md)
- [Portable Portolan Map Skill](agent/skills/portolan-map/SKILL.md)
- [Product Boundary](docs/product-boundary.md)
- [GitHub Spec Kit Workflow](docs/speckit-workflow.md)
- [Product Backlog](docs/product-backlog.md)
- [Agent Toolbox](docs/agent-toolbox/README.md)
- [Blind Acceptance Protocol](docs/agent-toolbox/blind-acceptance.md)
- [Portable Agent Guide](agent/AGENT_GUIDE.md)
- [Agent Bootstrap Discovery](specs/014-agent-bootstrap-discovery/spec.md)
- [Spec 015: Blind Agent Acceptance](specs/015-blind-agent-acceptance/spec.md)
- [Example Map Report](agent/examples/map-report.md)
- [Example CTO Context Answer](agent/examples/cto-context-answer.md)
- [Cursor Portolan Rule](.cursor/rules/portolan-map.mdc)
- [MVP](docs/mvp.md)
- [Evidence Model](docs/evidence-model.md)
- [Relationship Detection](docs/relationship-detection.md)
- [OSS Composition](docs/oss-composition.md)
- [Apache Bigtop Test Corpus](docs/test-corpora/apache-bigtop.md)
- [Apache Bigtop Corpus Manifest](corpora/apache-bigtop/manifest.json)
- [Evidence Graph Schema](schema/evidence-graph.schema.json)
- [Corpus Manifest Schema](schema/corpus-manifest.schema.json)

## SpecKit Workflow

Portolan uses GitHub Spec Kit for product planning. The implemented bootstrap
slice is:

- [001 Local Evidence Graph](specs/001-local-evidence-graph/spec.md)
- [001 Implementation Plan](specs/001-local-evidence-graph/plan.md)
- [001 Tasks](specs/001-local-evidence-graph/tasks.md)

Backlog features live under `specs/` and are indexed in
[Product Backlog](docs/product-backlog.md).

## Commands

```bash
go test ./...
scripts/bootstrap-portolan --out /tmp/portolan
/tmp/portolan --version
go run ./cmd/portolan --version
go run ./cmd/portolan context prepare --root testdata/landscape-map --out /tmp/portolan-context --profile cursor --force
go run ./cmd/portolan import cyclonedx --in testdata/importer-normalization/cyclonedx.json --out /tmp/portolan-import-graph.json --force
go run ./cmd/portolan map --root testdata/map-command/repo --out /tmp/portolan-map-run --force
go run ./cmd/portolan map --root testdata/relationship-detection/repo --out /tmp/portolan-relationships-run --force
go run ./cmd/portolan diff --base testdata/evidence-diff/base.json --head testdata/evidence-diff/head.json --out /tmp/portolan-diff.json --force
go run ./cmd/portolan selection validate --selection testdata/selection-inventory/valid-selection.json
go run ./cmd/portolan scan --help
go run ./cmd/portolan scan --selection testdata/local-evidence-graph/selection.json --out /tmp/portolan-graph.json --force
go run ./cmd/portolan scan --selection testdata/black-box-profile/selection.json --out /tmp/portolan-black-box-graph.json --force
go run ./cmd/portolan packet render --graph /tmp/portolan-graph.json --out /tmp/portolan-packet.md --force
jq empty /tmp/portolan-graph.json
jq empty /tmp/portolan-black-box-graph.json
jq empty /tmp/portolan-diff.json
jq empty /tmp/portolan-map-run/run.json /tmp/portolan-map-run/graph.json
jq empty /tmp/portolan-relationships-run/run.json /tmp/portolan-relationships-run/graph.json
jq empty schema/*.json
git diff --check
```
