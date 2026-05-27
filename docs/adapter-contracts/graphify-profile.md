# Graphify Adapter Profile

Graphify is accepted in Portolan as a local output producer, not as a core
dependency or replacement target.

## Decision

- State: accepted for adapter contract validation/profile only.
- Source: https://github.com/safishamsi/graphify
- License posture: MIT observed, `needs_review` before broader integration.
- Portolan behavior in this slice: validate a Graphify adapter contract and
  confidence mapping; do not import full `graph.json` payloads yet.

## Supported Subset

The current supported subset is the adapter contract fixture:

```bash
portolan adapter validate --in testdata/oss-adapter-contract/graphify-minimal.json
```

The profile describes the future importable shape but does not yet make it a
normalized graph importer.

Supported Graphify-style fields for a future importer:

- graph payload: top-level `nodes` and `links` or `edges`;
- node identity: `id`, `label`, `file_type`, `source_file`,
  `source_location`, `community`;
- edge identity: `source`, `target`, `relation`, `confidence`,
  `confidence_score`, `source_file`, `source_location`, `weight`.

Unsupported in this slice:

- `hyperedges`;
- Graphify MCP server behavior;
- hook/watch behavior;
- HTML/Obsidian/wiki exports;
- PR impact dashboards;
- full path normalization and source-range validation;
- LLM-derived semantic/rationale import beyond preserving weak producer states.

## Evidence Mapping

| Graphify confidence | Portolan evidence state | Rationale |
| --- | --- | --- |
| `EXTRACTED` | `metadata-visible` | The relationship is explicit to Graphify, but Portolan has not inspected the source directly in this adapter validation path. |
| `INFERRED` | `claim-only` | The relationship is a producer inference and must not become observed evidence. |
| `AMBIGUOUS` | `cannot_verify` | The producer has flagged uncertainty; Portolan cannot verify it from the adapter contract alone. |
| missing or unrecognized | `cannot_verify` | Forward-compatible weak fallback until a profile revision defines the state. |

`EXTRACTED` must not map to `source-visible` unless a later importer performs
Portolan source inspection and records that evidence separately.

## Privacy And Safety

- Import local files only; do not run Graphify from Portolan.
- Do not start Graphify MCP or hook/watch behavior from Portolan.
- Treat node labels, source paths, rationale, and semantic edges as potentially
  sensitive when exporting outside the local machine.
- Do not commit private Graphify outputs as fixtures.

## Validation

```bash
go test -count=1 ./internal/adapter ./internal/app
go run ./cmd/portolan adapter validate --in testdata/oss-adapter-contract/graphify-minimal.json
```

## Deferred Work

A future importer spec must define:

- accepted Graphify schema version or compatibility probe;
- path normalization and outside-target rejection;
- source hash/range handling;
- large graph limits;
- mapping from Graphify nodes/edges to Portolan graph IDs;
- rendering/query behavior for `claim-only` and `cannot_verify` records.
