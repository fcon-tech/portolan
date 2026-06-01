# Feature Specification: Bigtop Semgrep Local Producer

**Feature Branch**: `codex/063-bigtop-semgrep-local-producer`

**Created**: 2026-06-02

**Status**: Merged via PR #41

**Input**: Spec 057 left Semgrep local-safe output as `cannot_verify` because
auto-config required registry/telemetry. The current objective still requires
real producer outputs beyond Syft/CycloneDX.

## Requirements

- **FR-001**: The feature MUST use a local Semgrep rule pack, not registry
  auto-config.
- **FR-002**: The Semgrep run MUST use `--metrics off` and
  `--disable-version-check`.
- **FR-003**: The run MUST be bounded to selected Bigtop deployment/provisioner
  surfaces and MUST NOT mutate target repositories.
- **FR-004**: The output MUST be classified as `metadata-visible` API/catalog
  mention evidence only.
- **FR-005**: The output MUST NOT be promoted to runtime topology,
  symbol/reference graph, call graph, or enterprise parity evidence.
- **FR-006**: Cursor stress MUST preserve those claim boundaries.

## Success Criteria

- **SC-001**: Semgrep local-config output is generated or an exact blocker is
  recorded.
- **SC-002**: The producer run records command, targets, exit code, summary,
  hashes, sizes, and privacy/mutation boundary.
- **SC-003**: Cursor stress treats the output as bounded API/catalog mention
  evidence, not runtime or full code intelligence.
- **SC-004**: Local baseline checks pass before PR readiness.

## Assumptions

- The target landscape is `/home/fall_out_bug/projects/bigtop-landscape`.
- Raw external outputs are stored under
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-063-semgrep-local-producer-final/tool-outputs`.
- The selected scope is Bigtop deployment/provisioner surfaces, not the full
  Bigtop corpus.
