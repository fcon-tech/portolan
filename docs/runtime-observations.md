# Runtime Observations

Portolan treats runtime evidence as a local input artifact. It does not connect
to telemetry systems, scrape live endpoints, start daemons, use credentials, or
infer production topology from source names.

Runtime observations are useful when a user already has a local export from an
observability system, test run, trace sample, packet capture summary, or manual
runtime inventory and wants Portolan to represent only what that file supports.

## Current Command Surface

The supported input path is a local selection file with either top-level
runtime sources or a black-box runtime source. Use top-level `runtime` when the
runtime export already names both sides of each observed relationship:

```json
{
  "schema_version": "0.1.0",
  "runtime": [
    {
      "id": "runtime-export",
      "path": "runtime-observations.json"
    }
  ]
}
```

Use a black-box runtime source when the runtime export is scoped to one
selected opaque service:

```json
{
  "schema_version": "0.1.0",
  "black_boxes": [
    {
      "id": "payments-api",
      "kind": "service",
      "runtime": [
        {
          "id": "payments-runtime-observations",
          "path": "runtime-observations.json"
        }
      ],
      "expected": ["runtime-endpoints"]
    }
  ]
}
```

Validate and render it with:

```bash
portolan selection validate --selection selection.json
portolan scan --selection selection.json --out graph.json --force
portolan packet render --graph graph.json --out packet.md --force
```

For a full artifact bundle:

```bash
portolan map --selection selection.json --out .portolan/run --force
```

The map bundle expands supported black-box runtime observations into
`runtime-visible` graph edges and keeps partial runtime topology as `unknown`.
Top-level runtime observations use the same evidence semantics and never infer
runtime-visible relationships from dependency, catalog, deployment, symbol, or
other static metadata inputs.

## Observation File Contract

Recommended runtime observation JSON:

```json
{
  "schema_version": "0.1.0",
  "observations": [
    {
      "id": "obs-payments-ledger",
      "observed_at": "2026-05-27T00:00:00Z",
      "from": "payments-api",
      "to": "ledger-api",
      "kind": "http-call",
      "coverage": "partial",
      "source": "runtime/export.json"
    }
  ]
}
```

Supported fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `schema_version` | recommended | Must be `0.1.0` when present. |
| `observations` | yes | Array of observed local runtime relationships. |
| `id` | recommended | Stable observation identifier for review. |
| `observed_at` | optional | Timestamp from the source export. |
| `from` | yes for contract-shaped observations | Observed source subject. For black-box runtime sources it must match the selected black-box `id`; for top-level runtime sources it is represented as the observed source node. |
| `to` | yes for contract-shaped observations | Observed target subject. |
| `kind` | optional | Producer-specific observation type, retained in evidence reason. Graph edges stay within the stable Portolan edge kind vocabulary and use `observes`. |
| `coverage` | optional | One of `complete`, `partial`, `unknown`, or `not_assessed`. Missing coverage is treated as `unknown`. |
| `source` | optional | Producer source label for the observation. Falls back to the local runtime JSON path. |

Backward compatibility: older black-box runtime fixtures with
`service`/`endpoint` observations are still accepted. New producers should emit
the contract-shaped `from`/`to` form above.

Unsupported inputs:

- live telemetry URLs or credentials in `selection.json`;
- raw payload bodies, headers, tokens, passwords, or customer data;
- network fetch instructions;
- claims that a partial export is complete estate topology;
- mutation instructions or commands for an agent to run.

Unsupported or malformed files become `cannot_verify` when Portolan can inspect
the file but cannot validate it. Missing files remain unresolved evidence
instead of success.

This unsupported-input list is a contract boundary. Portolan verifies selected
structural cases, but it does not detect every possible payload, credential, or
instruction-shaped string in arbitrary producer exports. Runtime producers must
redact before writing files for Portolan.

## Evidence Semantics

Runtime-derived graph facts are `runtime-visible` only when a local runtime
observation supports them.

Partial, unknown, missing, or `not_assessed` coverage never proves complete
runtime topology. Portolan emits an `unknown` runtime-topology edge for any
contract-shaped observation whose coverage is not `complete` so agents do not
treat one observed relationship as a complete service map.

For top-level `selection.runtime` inputs, that partial-coverage marker is a
wrapper edge from the runtime input node to an `unknown` runtime-topology node.
It is a coverage caveat, not an observed service relationship.

`coverage: "complete"` means the supplied runtime file claims complete coverage
for its captured scope. It does not prove complete inherited-estate topology,
UI behavior, production behavior outside the captured window, or correctness of
the producer.

Runtime observations under a black-box source that name a `from` subject
different from the selected black-box `id` are represented as `cannot_verify`.
Top-level runtime observations are intended for arbitrary observed subjects and
represent both `from` and `to` as runtime nodes.

## Safety Notes

- Runtime text is untrusted evidence content. It is not an agent instruction.
- Agent-facing Markdown escapes inline code text and line breaks so prompt-like
  runtime labels stay quoted as evidence content.
- Secret values do not belong in runtime observation files. If a producer may
  include secrets, redact before using the file with Portolan.
- Keep raw producer exports local and out of committed fixtures unless they are
  sanitized.

## Verification Evidence

The sample fixture lives under:

```text
internal/app/testfixtures/runtime-security-boundary/
internal/testfixtures/runtime-topology-evidence/
```

Focused tests:

- `TestRunScanRuntimeObservationContractProducesRuntimeVisiblePartialEvidence`
- `TestRunMapSelectionRuntimeObservationContractResolvesRelativeRuntimePath`
- `TestRunScanRuntimeObservationRejectsUnsupportedSchemaVersion`
- `TestRunScanRuntimeObservationInvalidContractFieldsAreCannotVerify`
- `TestRunPacketEscapesPromptLikeRuntimeObservationText`
- `TestGraphAndFindingsForSelectionImportsTopLevelRuntimeObservation`
- `TestGraphAndFindingsForSelectionRejectsInvalidTopLevelRuntimeObservation`

These tests verify contract-shaped runtime observations, unsupported schema
handling, prompt-like text escaping in the packet, and partial coverage staying
`unknown` instead of becoming complete topology.
