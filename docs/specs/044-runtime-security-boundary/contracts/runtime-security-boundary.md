# Contract: Runtime Security Boundary

## Runtime Observation Input

Supported local JSON shape for `black_boxes[].runtime[].path`:

```json
{
  "schema_version": "0.1.0",
  "observations": [
    {
      "id": "obs-1",
      "observed_at": "2026-05-27T00:00:00Z",
      "from": "service-a",
      "to": "service-b",
      "kind": "http-call",
      "coverage": "partial",
      "source": "runtime/export.json"
    }
  ]
}
```

Contract rules:

- `schema_version`, when present, must be `0.1.0`.
- `from` and `to` are required for contract-shaped observations.
- `from` must match the selected black-box `id` in this slice.
- `coverage` may be `complete`, `partial`, `unknown`, or `not_assessed`; missing
  coverage is treated as `unknown`.
- The graph edge kind remains `observes`; producer-specific `kind` is retained
  in the evidence reason.
- Partial coverage never proves complete topology and must emit an `unknown`
  topology record.
- Older `service`/`endpoint` runtime observations are accepted only for backward
  compatibility with existing fixtures.

## Threat Model Contract

The threat model must cover:

- untrusted repo instructions in Markdown/config/source;
- path traversal and symlink escapes;
- secret value leakage;
- future MCP/query exposure;
- stale evidence reuse.

Each threat needs mitigation, verification state, and residual risk.
