# Runtime Observations

Portolan treats runtime evidence as a local input artifact. It does not connect
to telemetry systems, scrape live endpoints, start daemons, use credentials, or
infer production topology from source names.

Runtime observations are useful when a user already has a local export from an
observability system, test run, trace sample, packet capture summary, or manual
runtime inventory and wants Portolan to represent only what that file supports.

## Current Command Surface

The supported input path is a local selection file with a black-box runtime
source:

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
| `from` | yes for contract-shaped observations | Observed source subject. Must match the selected black-box `id` in this slice. |
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

`coverage: "complete"` means the supplied runtime file claims complete coverage
for its captured scope. It does not prove complete inherited-estate topology,
UI behavior, production behavior outside the captured window, or correctness of
the producer.

Runtime observations that name a `from` subject different from the selected
black-box `id` are represented as `cannot_verify` because this slice does not
resolve arbitrary runtime subjects across a landscape.

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
internal/app/testdata/runtime-security-boundary/
```

Focused tests:

- `TestRunScanRuntimeObservationContractProducesRuntimeVisiblePartialEvidence`
- `TestRunMapSelectionRuntimeObservationContractResolvesRelativeRuntimePath`
- `TestRunScanRuntimeObservationRejectsUnsupportedSchemaVersion`
- `TestRunScanRuntimeObservationInvalidContractFieldsAreCannotVerify`
- `TestRunPacketEscapesPromptLikeRuntimeObservationText`

These tests verify contract-shaped runtime observations, unsupported schema
handling, prompt-like text escaping in the packet, and partial coverage staying
`unknown` instead of becoming complete topology.
