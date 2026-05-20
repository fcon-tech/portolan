# Portolan

Portolan is an open-source, local-first evidence graph builder for messy
software landscapes.

It helps a team run a read-only scout inside its own environment, across source
repos, metadata exports, runtime observations, and black-box systems. The output
is an honest map of what is visible, what is only claimed, and what remains
unknown.

Portolan is not a replacement for Sourcegraph, CAST, Backstage, observability
platforms, modernization tools, or coding agents. It is a complementary
normalization layer that can compose their outputs into a common evidence model.

## Status

Bootstrap repository.

Implemented:

- Go module and `portolan scan --selection <file> --out <file>` for the first
  local evidence graph.
- `portolan import cyclonedx --in <file> --out <file>` for local CycloneDX JSON
  SBOM normalization.
- Black-box profile scanning from local metadata, runtime export, and claim
  files without source-visible overclaiming.
- `portolan diff --base <file> --head <file> --out <file>` for
  machine-readable evidence graph movement without readiness verdicts.
- Documentation for product boundary, MVP, evidence states, and OSS composition.
- Draft JSON schema for an evidence graph document.
- GitHub Spec Kit workflow and product backlog.
- Apache Bigtop test corpus profile for final acceptance planning.

Not implemented yet:

- platform-specific runtime importers;
- corpus preparation or manifest-to-selection generation;
- SPDX, Syft-native, or live tool importers;
- integrations with external tools.

## Product Contract

Portolan should default to:

- local-first execution;
- read-only collection;
- no daemon;
- no network calls unless explicitly enabled;
- machine-readable evidence graph output;
- human-readable packet generated from the same graph;
- explicit states for missing, weak, or unverifiable evidence.

## Roadmap Shape

Portolan should be built from the smallest runnable loop outward:

1. Local selection input, read-only scan, and JSON evidence graph.
2. Human-readable packet generated from the same graph.
3. Importer normalization, black-box profiles, evidence diffs, and adapter
   contracts.
4. Final ecosystem acceptance against Apache Bigtop.

The final realistic acceptance loop is the full operator assembly:

- Cursor as the interactive engineering surface;
- Composer 2.5 / Kimi 2.6 as the agent/model pair under evaluation;
- Portolan as the local evidence graph and packet substrate;
- Apache Bigtop as the large OSS ecosystem corpus.

Bigtop is intentionally last. It is the stress corpus for an assembled product,
not the next implementation target after bootstrap.

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

- [Product Boundary](docs/product-boundary.md)
- [GitHub Spec Kit Workflow](docs/speckit-workflow.md)
- [Product Backlog](docs/product-backlog.md)
- [MVP](docs/mvp.md)
- [Evidence Model](docs/evidence-model.md)
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
go run ./cmd/portolan --version
go run ./cmd/portolan import cyclonedx --in testdata/importer-normalization/cyclonedx.json --out /tmp/portolan-import-graph.json --force
go run ./cmd/portolan diff --base testdata/evidence-diff/base.json --head testdata/evidence-diff/head.json --out /tmp/portolan-diff.json --force
go run ./cmd/portolan selection validate --selection testdata/selection-inventory/valid-selection.json
go run ./cmd/portolan scan --help
go run ./cmd/portolan scan --selection testdata/local-evidence-graph/selection.json --out /tmp/portolan-graph.json --force
go run ./cmd/portolan scan --selection testdata/black-box-profile/selection.json --out /tmp/portolan-black-box-graph.json --force
go run ./cmd/portolan packet render --graph /tmp/portolan-graph.json --out /tmp/portolan-packet.md --force
jq empty /tmp/portolan-graph.json
jq empty /tmp/portolan-black-box-graph.json
jq empty /tmp/portolan-diff.json
jq empty schema/*.json
git diff --check
```
