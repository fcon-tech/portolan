# Runtime Topology Acceptance Audit

Date: 2026-05-27

## Decision Gate

- Simpler/Faster: use the existing runtime observation contract and fixture map
  command as acceptance evidence; do not add live telemetry or topology
  inference.
- Blocking Edge Cases: complete service topology requires complete runtime
  evidence for a declared scope. Partial observations, source dependencies,
  ports, metadata, or claims cannot prove estate topology.
- Existing Open Source: telemetry, traces, service catalogs, and runtime
  exporters remain external producers. Portolan imports local observation files
  and preserves their evidence state.

## Acceptance Result

| Surface | Status | Evidence |
| --- | --- | --- |
| Local runtime relationship import | `verified` | `go run ./cmd/portolan map --selection internal/app/testdata/runtime-security-boundary/selection.json --out /tmp/portolan-runtime-topology-audit --force` wrote a map bundle. `/tmp/portolan-runtime-topology-audit/graph.json` contains `payments-api observes ledger-api` as `runtime-visible`. |
| Partial coverage guardrail | `verified` | The same graph contains `payments-api -> payments-api:unknown:runtime-topology` with state `unknown` and reason `partial runtime observation coverage does not prove complete topology`. |
| Complete runtime topology | `not_assessed` | The fixture has `coverage: "partial"`. No complete runtime evidence for a declared estate scope was supplied. |
| Live observability integration | `not_assessed` | No telemetry system, credentials, network fetch, daemon, or live endpoint was used. |
| Runtime producer redaction for arbitrary exports | `not_assessed` | Focused contract tests exist, but arbitrary producer payload/secret validation was not assessed. |

## Verification Commands

```bash
go run ./cmd/portolan map --selection internal/app/testdata/runtime-security-boundary/selection.json --out /tmp/portolan-runtime-topology-audit --force
jq '{nodes:(.nodes|length), edges:(.edges|length), states:([.nodes[].evidence.state,.edges[].evidence.state] | unique)}' /tmp/portolan-runtime-topology-audit/graph.json
jq '.edges[] | select(.evidence.state=="runtime-visible")' /tmp/portolan-runtime-topology-audit/graph.json
jq '.edges[] | select(.to=="payments-api:unknown:runtime-topology")' /tmp/portolan-runtime-topology-audit/graph.json
```

Observed summary:

- graph nodes: 4;
- graph edges: 2;
- evidence states: `runtime-visible`, `unknown`;
- runtime-visible edge: `payments-api observes ledger-api`;
- unknown topology edge: `payments-api -> payments-api:unknown:runtime-topology`.

## Product Boundary

Product claims may say Portolan can represent supplied local runtime
observations as `runtime-visible` graph facts and preserve incomplete topology
as `unknown`.

Product claims must not say Portolan provides complete runtime topology unless
complete supported runtime evidence for the claimed scope is supplied and
inspected.
