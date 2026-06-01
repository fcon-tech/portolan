# Quickstart: Black-Box Profile

This quickstart describes the target behavior for the black-box profile slice.

## Prepare Fixture

```bash
mkdir -p /tmp/portolan-blackbox/metadata /tmp/portolan-blackbox/runtime /tmp/portolan-blackbox/claims
cat >/tmp/portolan-blackbox/metadata/payments.json <<'JSON'
{
  "schema_version": "0.1.0",
  "service": {
    "id": "payments-api",
    "label": "Payments API",
    "owner": "payments-team"
  },
  "source": "service-catalog-export"
}
JSON
cat >/tmp/portolan-blackbox/runtime/payments.json <<'JSON'
{
  "schema_version": "0.1.0",
  "observations": [
    {
      "service": "payments-api",
      "endpoint": "payments.internal:443",
      "observed_at": "2026-05-20T10:00:00Z"
    }
  ],
  "source": "runtime-export"
}
JSON
cat >/tmp/portolan-blackbox/claims/payments.json <<'JSON'
{
  "claims": [
    {
      "id": "claim-payments-ledger",
      "subject": "payments-api",
      "predicate": "depends-on",
      "object": "ledger-api",
      "source": "architecture-interview"
    }
  ]
}
JSON
cat >/tmp/portolan-blackbox/selection.json <<'JSON'
{
  "schema_version": "0.1.0",
  "black_boxes": [
    {
      "id": "payments-api",
      "kind": "service",
      "label": "Payments API",
      "metadata": [
        {
          "id": "payments-catalog",
          "path": "/tmp/portolan-blackbox/metadata/payments.json"
        }
      ],
      "runtime": [
        {
          "id": "payments-runtime",
          "path": "/tmp/portolan-blackbox/runtime/payments.json"
        }
      ],
      "claims": [
        {
          "id": "payments-claims",
          "path": "/tmp/portolan-blackbox/claims/payments.json"
        }
      ],
      "expected": ["owner", "dependencies", "runtime-endpoints"]
    }
  ]
}
JSON
```

## Run

```bash
go run ./cmd/portolan scan --selection /tmp/portolan-blackbox/selection.json --out /tmp/portolan-blackbox/graph.json --force
jq empty /tmp/portolan-blackbox/graph.json
go run ./cmd/portolan packet render --graph /tmp/portolan-blackbox/graph.json --out /tmp/portolan-blackbox/packet.md --force
```

## Expected Outcome

- The graph contains a `service` node for `payments-api`.
- Metadata-derived facts use `metadata-visible`.
- Runtime-derived facts use `runtime-visible`.
- Claim-derived relationships remain `claim-only`.
- Missing expected evidence is represented as `unknown` or `cannot_verify` with
  a reason.
- No black-box-derived fact uses `source-visible`.
- No network access or live telemetry query is required.
