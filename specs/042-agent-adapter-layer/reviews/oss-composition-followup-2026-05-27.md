# OSS Composition Follow-up

Date: 2026-05-27
Spec: `specs/042-agent-adapter-layer/`
State: mixed; several `not_assessed` surfaces narrowed, others remain blocked
or out of current Portolan import scope.

## Decision Gate

- Simpler/Faster: run local producer smoke checks and adapter validation before
  adding new importers or dependencies.
- Blocking Edge Cases: full Graphify, SCIP, Serena, and Repomix integration
  would require new parsers, security/redaction policy, or daemon/indexer
  behavior outside the current local read-only import boundary.
- Existing Open Source: use the tools as producers where possible; do not
  reimplement Semgrep, Graphify, SCIP, Serena, or Repomix inside Portolan.

## Component Status

| Component | Status | Evidence |
| --- | --- | --- |
| Semgrep producer integration | `verified` | `portolan produce semgrep` is implemented as a first-class local OSS producer command and covered by a fake-binary test that verifies invocation shape and explicit output-path writing. `semgrep` 1.157.0 also ran with a local repo-provided config on `/tmp/portolan-semgrep-local-valid-20260527225405`, produced two JSON findings, and `portolan context prepare` recorded `semgrep` as `input_present` / `metadata-visible` in `tool-registry.json` and `evidence-index.jsonl`. |
| Graphify producer integration | `verified` | `portolan produce graphify` is implemented as a first-class local OSS producer command and covered by a fake-binary test that verifies invocation shape, read-only target behavior, `.git`/`.portolan` exclusion, and explicit output-directory writing. A temporary venv installed the local Graphify snapshot from `/tmp/portolan-042-research/graphify`; `python -m graphify update /tmp/portolan-graphify-venv-target --force --no-cluster` wrote `graphify-out/graph.json` with 2 nodes and 1 edge. |
| Graphify raw node-link import | `verified` | `go run ./cmd/portolan import graphify --in testdata/importer-normalization/graphify.json --out /tmp/portolan-graphify-import.json --force` wrote a 4-node, 3-edge graph preserving `metadata-visible`, `claim-only`, and `cannot_verify`. `go run ./cmd/portolan import graphify --in /tmp/portolan-graphify-venv-target/graphify-out/graph.json --out /tmp/portolan-graphify-raw-import.json --force` normalized the producer smoke output into 2 nodes and 1 edge. |
| Graphify source-backed import | `verified` | `go run ./cmd/portolan import graphify --in testdata/importer-normalization/graphify-edges.json --root testdata/importer-normalization/graphify-source --out /tmp/portolan-graphify-source-backed.json --force` wrote a 2-node, 1-edge graph where all facts are `source-visible` because Portolan read the referenced `source_file` inside `--root`. This also verifies `edges`, `confidence_score`, `community`, and `weight` preservation in evidence reasons. |
| SCIP CLI | `verified` for protocol CLI only | `go run /tmp/portolan-042-research/scip/cmd/scip --help` succeeded and exposed CLI commands such as `lint`, `print`, `stats`, and `expt-convert`. No SCIP indexer output or Portolan protobuf parser was run. |
| SCIP / Serena-style JSON symbol-index import | `verified` narrowly | `go run ./cmd/portolan import symbol-index --in testdata/importer-normalization/symbol-index.json --out /tmp/portolan-symbol-index-import.json --force` wrote a 6-node, 5-edge graph with document and symbol records as `metadata-visible`. SCIP protobuf parsing, real SCIP indexer output, real Serena export, LSP/MCP/daemon behavior, semantic correctness, and call-graph completeness remain unimplemented or `not_assessed`. |
| Serena execution | `blocked` | `python3 -m serena --help` failed with `No module named serena` from the local snapshot context. Running Serena would require installing its Python project and starting or invoking its tooling, which is outside the no-daemon default for this slice. |
| Repomix producer integration | `verified` | `portolan produce repomix` is implemented as a first-class local OSS producer command and covered by a fake-binary test that verifies invocation shape and explicit output-path writing. `npx --yes repomix@1.14.1` also packed a one-file local target into `/tmp/portolan-repomix-local/out/repomix-output.xml`. |
| Repomix file-inventory import | `verified` narrowly | `go run ./cmd/portolan import repomix --in testdata/importer-normalization/repomix-output.xml --out /tmp/portolan-repomix-import.json --force` wrote a 3-node, 2-edge graph with file paths as `metadata-visible` and disabled security-check source as `cannot_verify`. `go run ./cmd/portolan import repomix --in /tmp/portolan-repomix-local/out/repomix-output.xml --out /tmp/portolan-repomix-smoke-import.json --force` normalized the producer smoke output into 2 nodes and 1 edge. Source-content architecture parsing and redaction semantics remain unimplemented. |

## Verification Commands

```bash
semgrep scan --config /tmp/portolan-semgrep-local-valid-20260527225405/.semgrep.yml --json --json-output /tmp/portolan-semgrep-local-valid-20260527225405/.portolan/context/tool-outputs/semgrep.json --metrics=off /tmp/portolan-semgrep-local-valid-20260527225405
go run ./cmd/portolan produce semgrep --root /tmp/portolan-semgrep-local-valid-20260527225405 --config /tmp/portolan-semgrep-local-valid-20260527225405/.semgrep.yml --out /tmp/portolan-semgrep-local-valid-20260527225405/.portolan/context/tool-outputs/semgrep.json --force
go run ./cmd/portolan context prepare --root /tmp/portolan-semgrep-local-valid-20260527225405 --out /tmp/portolan-semgrep-local-valid-20260527225405/.portolan/context --profile cursor --force
python -m graphify update /tmp/portolan-graphify-venv-target --force --no-cluster
go run ./cmd/portolan produce graphify --root /tmp/portolan-graphify-produce-real-target --out /tmp/portolan-graphify-produce-real-out --graphify /tmp/portolan-graphify-venv/bin/graphify --force
go run ./cmd/portolan import graphify --in testdata/importer-normalization/graphify.json --out /tmp/portolan-graphify-import.json --force
go run ./cmd/portolan import graphify --in /tmp/portolan-graphify-venv-target/graphify-out/graph.json --out /tmp/portolan-graphify-raw-import.json --force
go run ./cmd/portolan import graphify --in testdata/importer-normalization/graphify-edges.json --root testdata/importer-normalization/graphify-source --out /tmp/portolan-graphify-source-backed.json --force
go run /tmp/portolan-042-research/scip/cmd/scip --help
go run ./cmd/portolan import symbol-index --in testdata/importer-normalization/symbol-index.json --out /tmp/portolan-symbol-index-import.json --force
python3 -m serena --help
npx --yes repomix@1.14.1 /tmp/portolan-repomix-local/target --output /tmp/portolan-repomix-local/out/repomix-output.xml --style xml --no-security-check
go run ./cmd/portolan produce repomix --root /tmp/portolan-repomix-local/target --out /tmp/portolan-repomix-local/out/repomix-output.xml --style xml --force
go run ./cmd/portolan import repomix --in testdata/importer-normalization/repomix-output.xml --out /tmp/portolan-repomix-import.json --force
go run ./cmd/portolan import repomix --in /tmp/portolan-repomix-local/out/repomix-output.xml --out /tmp/portolan-repomix-smoke-import.json --force
```

## Disposition

Product claims may say:

- Portolan can invoke installed Semgrep as a local OSS producer with an
  explicit local config and output path, and the resulting JSON can be
  preserved as `metadata-visible`.
- Portolan can invoke installed Graphify as a local OSS producer through a
  staging copy under an explicit output directory, preserving the read-only
  target checkout boundary.
- Portolan can invoke installed Repomix as a local OSS producer with an explicit
  output path, and then import its file inventory.
- Portolan can normalize raw Graphify node-link outputs into the evidence graph,
  preserve weak producer confidence states, and upgrade `EXTRACTED` facts to
  `source-visible` only when `--root` lets Portolan read the referenced
  `source_file`.
- Portolan can normalize bounded Repomix packed-output file inventory into the
  evidence graph while keeping disabled security-check packs visible as
  `cannot_verify`.
- SCIP CLI availability is verified, and Portolan can normalize a bounded
  SCIP/Serena-style JSON symbol-index export as metadata. SCIP protobuf, real
  indexer/export execution, daemon behavior, and call-graph completeness remain
  outside verified scope.

Product claims must not say:

- Portolan starts Graphify MCP behavior, imports LLM-derived rationale as
  architecture truth, or guarantees large-graph performance/source-range
  hashing.
- Portolan imports SCIP protobuf indexes, real Serena exports, or starts
  SCIP/Serena/LSP/MCP daemons.
- Portolan parses Repomix source snippets as architecture facts, uses remote
  packing or Repomix MCP behavior, or enforces Repomix redaction semantics.
- Serena is integrated or runnable under the current Portolan default boundary.
