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

- Go module and minimal `portolan` CLI shell.
- Documentation for product boundary, MVP, evidence states, and OSS composition.
- Draft JSON schema for an evidence graph document.

Not implemented yet:

- repository scanning;
- metadata importers;
- runtime importers;
- black-box inventory workflow;
- report rendering;
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
- [MVP](docs/mvp.md)
- [Evidence Model](docs/evidence-model.md)
- [OSS Composition](docs/oss-composition.md)
- [Evidence Graph Schema](schema/evidence-graph.schema.json)

## Commands

```bash
go test ./...
go run ./cmd/portolan --version
go run ./cmd/portolan scan --help
jq empty schema/*.json
git diff --check
```
