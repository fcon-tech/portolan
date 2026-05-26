# Hypothesis Ledger: OSS Adapter Contract Validation

## Product Gap

The OSS track had local discovery, local tool-output summaries, and
`oss-plan.json`, but no published, machine-checkable contract for adding a new
OSS/tool-output family safely.

## Implemented Slice

`specs/031-oss-adapter-contract/` adds:

- `schema/oss-adapter.schema.json`
- `docs/adapter-contracts/oss-adapter-contract.md`
- `portolan adapter validate --in <adapter.json>`
- fixtures for jscpd, Syft/CycloneDX, Semgrep, and one unsafe adapter

## Verification

Validated positive fixtures:

```bash
go run ./cmd/portolan adapter validate --in testdata/oss-adapter-contract/jscpd.json
go run ./cmd/portolan adapter validate --in testdata/oss-adapter-contract/syft-cyclonedx.json
go run ./cmd/portolan adapter validate --in testdata/oss-adapter-contract/semgrep.json
```

Rejected unsafe fixture:

```bash
go run ./cmd/portolan adapter validate --in testdata/oss-adapter-contract/invalid-network-mutating.json
```

The unsafe fixture failed because it required network access, mutated the
target, and could contain secret values without required redaction.

## Hypothesis Status

- H9: supported for the fixture suite. A new OSS/tool-output family now has a
  local validation gate before agents treat it as part of the Portolan assembly.

## Evidence State

- Adapter contract shape: `verified`
- jscpd contract fixture: `verified`
- Syft/CycloneDX contract fixture: `verified`
- Semgrep contract fixture: `verified`
- Unsafe network/mutating fixture rejection: `verified`
- Actual external tool execution: `not_assessed`
- License approval for the named OSS tools: `not_assessed`; fixtures use
  `needs_review`
