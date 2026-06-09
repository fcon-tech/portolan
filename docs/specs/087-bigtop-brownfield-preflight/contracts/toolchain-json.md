# Contract: toolchain.json

`toolchain.json` is the machine-readable tool recommendation artifact emitted
by Brownfield Preflight. The schema is a contract document; implementation uses
explicit Go validation for required fields and enum values to avoid a runtime
JSON Schema dependency in this slice.

## Top-Level Shape

```json
{
  "schema_version": "preflight-toolchain/v1",
  "target": {
    "root": "/path/to/target",
    "scope": "single-repo"
  },
  "tools": [
    {
      "tool": "semgrep",
      "job": "local static pattern checks over source/config surfaces",
      "status": "approval-required",
      "evidence_family": "source-visible static findings",
      "approval_boundary": ["tool-execution"],
      "risk": ["may scan private source paths"],
      "next_action": "Run only after operator approves the bounded local command.",
      "evidence_state": "not_evidence"
    }
  ]
}
```

## Status Values

- `installed`: local executable is visible, but no target evidence is implied.
- `missing`: useful candidate is not locally available.
- `supplied-output`: compatible local output is present and can be imported or
  linked.
- `approval-required`: next useful step requires explicit approval.
- `parked`: not useful for the current preflight job.
- `rejected`: unsuitable for documented license, privacy, mutation, or fit
  reasons.

## Evidence Boundary

Tool records are recommendation metadata. They are not graph facts. A tool
record may use `evidence_state: "not_evidence"` but must not use
`source-visible`, `metadata-visible`, `runtime-visible`, `claim-only`,
`unknown`, or `cannot_verify` unless a local output artifact has been imported
through the appropriate Portolan contract.
