# Feature Specification: OSS Adapter Contract

**Feature Branch**: `031-oss-adapter-contract`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: The backlog still listed a future "published adapter contract and
fixture suite". Without a machine-checkable contract, OSS assembly remains
implicit in Portolan code and docs instead of being extensible by agents or
third-party tool outputs.

## Requirements

- **FR-001**: Portolan MUST publish a JSON contract format for OSS/tool-output
  adapters.
- **FR-002**: The contract MUST record tool identity, evidence family, output
  kind, license review status, local execution posture, privacy posture,
  evidence defaults, limitations, and safe command recipes when applicable.
- **FR-003**: Portolan MUST provide a local read-only validation command for
  adapter contract files.
- **FR-004**: Validation MUST reject missing identity, unsupported families,
  unsupported output kinds, invalid evidence states, network-required adapters,
  target-mutating adapters, and contracts that may contain secret values without
  required redaction.
- **FR-005**: The fixture suite MUST cover jscpd, Syft/CycloneDX, Semgrep, and
  at least one invalid adapter.
- **FR-006**: Agent docs and OSS composition docs MUST point adapter authors at
  the contract before adding new OSS tools.

## Success Criteria

- **SC-001**: `portolan adapter validate --in <contract.json>` validates the
  included positive fixtures.
- **SC-002**: The invalid fixture fails with a clear error.
- **SC-003**: Baseline checks pass.
