# Implementation Plan: OSS Adapter Contract

## Decision Gate

- Simpler/Faster: add a JSON contract, fixtures, and a validator command. Do
  not build an adapter runtime, plugin loader, installer, or OSS execution
  engine in this slice.
- Blocking Edge Cases: adapters can introduce license, privacy, network, and
  mutation risks. These must be explicit and machine-checked before agents treat
  a tool output as safe evidence.
- Existing Open Source: no new dependency is needed. The validator uses Go
  stdlib JSON and a small project-local contract.

## Technical Approach

- Add `schema/oss-adapter.schema.json` as the public shape.
- Add `internal/adapter` with `ValidateFile`.
- Add CLI:

```bash
portolan adapter validate --in <contract.json>
```

- Add fixtures:
  - `jscpd.json`
  - `syft-cyclonedx.json`
  - `semgrep.json`
  - `invalid-network-mutating.json`
- Update `docs/oss-composition.md`, agent guide, Cursor skill/rule, and backlog.

## Verification

Run:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan adapter validate --in internal/testfixtures/oss-adapter-contract/jscpd.json
go run ./cmd/portolan adapter validate --in internal/testfixtures/oss-adapter-contract/syft-cyclonedx.json
go run ./cmd/portolan adapter validate --in internal/testfixtures/oss-adapter-contract/semgrep.json
! go run ./cmd/portolan adapter validate --in internal/testfixtures/oss-adapter-contract/invalid-network-mutating.json
```
