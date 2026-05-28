# Graphify Adapter Profile

Graphify is accepted in Portolan as an installed local OSS producer and local
output format, not as a vendored core scanner or replacement target.

## Decision

- State: accepted for first-class local producer invocation, adapter contract
  validation/profile, raw node-link import, and source-backed verification when
  `--root` is supplied.
- Source: https://github.com/safishamsi/graphify
- License posture: MIT observed, `needs_review` before broader integration.
- Portolan behavior in this slice: invoke installed Graphify locally through a
  staged source copy; validate a Graphify adapter contract and confidence
  mapping; import local `graph.json` node-link payloads into stable Portolan
  node and edge records; optionally inspect source files under `--root` before
  marking `EXTRACTED` facts `source-visible`.

## Supported Subset

The current supported subset is local producer execution, the adapter contract
fixture, and local raw Graphify node-link JSON import:

```bash
portolan produce graphify --root /path/to/source-root --out /tmp/portolan-graphify-run
portolan adapter validate --in testdata/oss-adapter-contract/graphify-minimal.json
portolan import graphify --in /tmp/portolan-graphify-run/source-copy/graphify-out/graph.json --out graph.json
portolan import graphify --in /tmp/portolan-graphify-run/source-copy/graphify-out/graph.json --root /path/to/source-root --out graph.json
```

Supported Graphify-style fields for the raw importer:

- graph payload: top-level `nodes` and `links` or `edges`;
- node identity: `id`, `label`, `file_type`, `source_file`,
  `source_location`, `type`, `confidence`, `confidence_score`, `community`;
- edge identity: `source`, `target`, `relation`, `confidence`, `source_file`,
  `source_location`, `confidence_score`, `weight`.

Unsupported in this slice:

- `hyperedges`;
- Graphify MCP server behavior;
- hook/watch behavior;
- HTML/Obsidian/wiki exports;
- PR impact dashboards;
- full source-range validation beyond checking that `source_file` is readable
  inside `--root`;
- Graphify-specific analytics beyond preserving confidence score, community,
  and edge weight in evidence reasons;
- LLM-derived semantic/rationale import beyond preserving weak producer states.

## Evidence Mapping

| Graphify confidence | Portolan evidence state | Rationale |
| --- | --- | --- |
| `EXTRACTED` with readable `source_file` under `--root` | `source-visible` | Graphify identified the fact and Portolan read the referenced local source file inside the declared root. |
| `EXTRACTED` without `--root` | `metadata-visible` | The relationship is explicit to Graphify, but Portolan has not inspected the source directly in this adapter validation path. |
| `INFERRED` | `claim-only` | The relationship is a producer inference and must not become observed evidence. |
| `AMBIGUOUS` | `cannot_verify` | The producer has flagged uncertainty; Portolan cannot verify it from the adapter contract alone. |
| missing or unrecognized | `cannot_verify` | Forward-compatible weak fallback until a profile revision defines the state. |

`EXTRACTED` must not map to `source-visible` unless `--root` is supplied and
Portolan can read the referenced `source_file` inside that root.

## Privacy And Safety

- Run installed Graphify only through `portolan produce graphify` with an
  explicit `--out` directory.
- Portolan stages a source copy under `--out/source-copy` before invoking
  `graphify update <out>/source-copy --force --no-cluster`; this preserves the
  read-only target-root boundary even though Graphify's no-LLM update mode
  writes `graphify-out` inside its input path.
- The staging copy excludes symlinks, `.git`, `.portolan`, and existing
  `graphify-out` directories so prior local Portolan/Graphify artifacts do not
  become new source evidence.
- Do not start Graphify MCP or hook/watch behavior from Portolan.
- Treat node labels, source paths, rationale, and semantic edges as potentially
  sensitive when exporting outside the local machine.
- Do not commit private Graphify outputs as fixtures.

## Validation

```bash
go test -count=1 ./internal/adapter ./internal/app
go run ./cmd/portolan produce graphify --root testdata/importer-normalization/graphify-source --out /tmp/portolan-graphify-run --graphify graphify --force
go run ./cmd/portolan adapter validate --in testdata/oss-adapter-contract/graphify-minimal.json
go run ./cmd/portolan import graphify --in testdata/importer-normalization/graphify.json --out /tmp/portolan-graphify-import.json --force
go run ./cmd/portolan import graphify --in testdata/importer-normalization/graphify-edges.json --root testdata/importer-normalization/graphify-source --out /tmp/portolan-graphify-source-backed.json --force
```

## Deferred Work

Future profile revisions must define:

- accepted Graphify schema version or compatibility probe;
- source hash/range handling;
- large graph limits;
- rendering/query behavior for `claim-only` and `cannot_verify` records.
